import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { angleDiff, yacht } from '../state';
import { HULL, MOODS, SEA_R, dampColor, labelTexture } from './layout';

const vert = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform vec2 uOffset;
uniform float uR;
varying vec2 vP;
varying vec2 vQ;
varying float vH;
float wave(vec2 q, float t) {
  return sin(q.x * 0.45 + t * 1.1) * 0.5
       + sin(q.y * 0.6 - t * 1.3) * 0.35
       + sin((q.x + q.y) * 1.1 + t * 2.1) * 0.15;
}
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec2 p = wp.xz;
  vec2 q = p + uOffset;
  float edge = 1.0 - smoothstep(uR - 3.0, uR - 0.15, length(p));
  float h = wave(q, uTime) * uAmp * edge;
  wp.y += h;
  vP = p; vQ = q; vH = h;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const frag = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform vec3 uGlowColor;
uniform float uGlow;
uniform float uYaw;
uniform float uR;
uniform float uAmp;
uniform float uTime;
varying vec2 vP;
varying vec2 vQ;
varying float vH;
void main() {
  float d = length(vP);
  if (d > uR) discard;
  float k = clamp(vH / (uAmp + 0.001) * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uDeep, uShallow, k * 0.85 + 0.1);
  float r = sin(vQ.x * 2.3 + sin(vQ.y * 1.7 + uTime * 0.6) * 1.5 + uTime * 0.8)
          * sin(vQ.y * 2.9 - uTime * 0.5 + sin(vQ.x * 1.3) * 1.2);
  col = mix(col, uFoam, smoothstep(0.8, 0.98, r) * 0.32);
  // подводная подсветка вокруг корпуса
  float c = cos(uYaw), s = sin(uYaw);
  vec2 l = vec2(c * vP.x - s * vP.y, s * vP.x + c * vP.y);
  float e = length(vec2((l.x - 0.6) / 10.5, l.y / 3.7));
  col += uGlowColor * (smoothstep(1.5, 0.55, e) * 0.8 + smoothstep(1.05, 0.8, e) * 0.5) * uGlow;
  // край диорамы
  col = mix(col, uFoam, smoothstep(uR - 0.22, uR, d) * 0.7);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const POOL = 260;

export function Water() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const side = useRef<THREE.MeshStandardMaterial>(null);
  const bottom = useRef<THREE.MeshStandardMaterial>(null);
  const wake = useRef<THREE.InstancedMesh>(null);
  const compass = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Group>(null);
  const crew = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.16 },
      uOffset: { value: new THREE.Vector2() },
      uR: { value: SEA_R },
      uDeep: { value: new THREE.Color(MOODS.day.deep) },
      uShallow: { value: new THREE.Color(MOODS.day.shallow) },
      uFoam: { value: new THREE.Color(MOODS.day.foam) },
      uGlowColor: { value: new THREE.Color('#38d9ff') },
      uGlow: { value: 0 },
      uYaw: { value: 0 },
    }),
    [],
  );

  // Частицы пены: живут в мировых координатах, сносятся встречным потоком
  const parts = useMemo(
    () =>
      Array.from({ length: POOL }, () => ({ alive: false, x: 0, z: 0, vx: 0, vz: 0, age: 0, life: 1, size: 1 })),
    [],
  );
  const st = useRef({ yaw: 0, emit: 0, amp: 0.16, glow: 0, i: 0 });
  const tmp = useMemo(
    () => ({ o: new THREE.Object3D(), deep: new THREE.Color(), shallow: new THREE.Color(), foam: new THREE.Color(), glow: new THREE.Color() }),
    [],
  );

  useFrame((s3, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = yacht.get();
    const u = uniforms;
    const t = s3.clock.elapsedTime;
    u.uTime.value = t;

    const mood = MOODS[s.weather === 'storm' ? 'storm' : s.lights.scene];
    tmp.deep.set(mood.deep);
    tmp.shallow.set(mood.shallow);
    tmp.foam.set(mood.foam);
    dampColor(u.uDeep.value, tmp.deep, dt);
    dampColor(u.uShallow.value, tmp.shallow, dt);
    dampColor(u.uFoam.value, tmp.foam, dt);
    if (side.current) side.current.color.copy(u.uDeep.value).multiplyScalar(0.72);
    if (bottom.current) bottom.current.color.copy(u.uDeep.value).multiplyScalar(0.5);

    const r = st.current;
    r.amp = THREE.MathUtils.damp(r.amp, s.weather === 'storm' ? 0.62 : 0.16 + (s.speed / 24) * 0.05, 0.8, dt);
    u.uAmp.value = r.amp;

    // Подводная подсветка: голубая, на вечеринке — переливается
    const glowOn = s.lights.zones.underwater ? s.lights.level * (s.lights.scene === 'day' ? 0.35 : 1) : 0;
    r.glow = THREE.MathUtils.damp(r.glow, glowOn, 2.5, dt);
    u.uGlow.value = r.glow * 1.6;
    if (s.lights.scene === 'party') tmp.glow.setHSL((t * 0.06) % 1, 0.9, 0.55);
    else tmp.glow.set('#38d9ff');
    dampColor(u.uGlowColor.value, tmp.glow, dt, 4);

    // Курс корабля визуально = рыскание; вода течёт против носа
    r.yaw = THREE.MathUtils.damp(r.yaw, -s.turn * 0.42, 1.6, dt);
    u.uYaw.value = r.yaw;
    const fx = Math.cos(r.yaw);
    const fz = -Math.sin(r.yaw);
    const v = s.speed * 0.16;
    u.uOffset.value.x += fx * v * dt;
    u.uOffset.value.y += fz * v * dt;

    // Кильватер
    const rate = s.speed > 0.3 ? 14 + s.speed * 5 : 0;
    r.emit += rate * dt;
    while (r.emit >= 1) {
      r.emit -= 1;
      const p = parts[r.i];
      r.i = (r.i + 1) % POOL;
      const bowSpray = s.speed > 9 && Math.random() < 0.28;
      const sideSign = Math.random() < 0.5 ? -1 : 1;
      // локальная точка у кормы или у носа
      const lx = bowSpray ? HULL.bow - 2.2 - Math.random() * 1.2 : HULL.stern - 0.8;
      const lz = bowSpray ? sideSign * (1.4 + Math.random() * 0.6) : sideSign * Math.random() * 2.0;
      const c = Math.cos(r.yaw);
      const sn = Math.sin(r.yaw);
      p.x = lx * c + lz * sn;
      p.z = -lx * sn + lz * c;
      // разлёт в стороны (перпендикулярно курсу)
      const spread = (bowSpray ? 1.2 : 0.45 + Math.random() * 0.4) * sideSign * (0.4 + s.speed / 24);
      p.vx = sn * spread;
      p.vz = c * spread;
      p.age = 0;
      p.life = bowSpray ? 0.9 + Math.random() * 0.5 : 1.8 + Math.random() * 1.4;
      p.size = bowSpray ? 0.12 + Math.random() * 0.12 : 0.16 + Math.random() * 0.24;
      p.alive = true;
    }
    const inst = wake.current;
    if (inst) {
      for (let i = 0; i < POOL; i++) {
        const p = parts[i];
        if (p.alive) {
          p.age += dt;
          p.x += (-fx * v + p.vx) * dt;
          p.z += (-fz * v + p.vz) * dt;
          p.vx *= 1 - dt * 0.6;
          p.vz *= 1 - dt * 0.6;
          if (p.age > p.life || Math.hypot(p.x, p.z) > SEA_R - 0.6) p.alive = false;
        }
        const k = p.alive ? p.age / p.life : 1;
        const sc = p.alive ? p.size * (0.6 + k * 1.6) * (1 - k) ** 0.6 : 0;
        tmp.o.position.set(p.x, 0.2 + r.amp * 0.6, p.z);
        tmp.o.rotation.set(-Math.PI / 2, 0, 0);
        tmp.o.scale.setScalar(Math.max(sc, 0.0001));
        tmp.o.updateMatrix();
        inst.setMatrixAt(i, tmp.o.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
      (inst.material as THREE.MeshBasicMaterial).color.copy(u.uFoam.value);
    }

    // Компас по краю: N уходит, когда яхта поворачивает
    if (compass.current) compass.current.rotation.y = THREE.MathUtils.degToRad(s.heading) + r.yaw;
    if (marker.current) {
      const rel = angleDiff(s.heading, s.targetHeading);
      const a = THREE.MathUtils.degToRad(rel) * -1 + r.yaw;
      marker.current.position.set(Math.cos(a) * (SEA_R - 0.75), 0.08, -Math.sin(a) * (SEA_R - 0.75));
      marker.current.rotation.y = a;
      const show = Math.abs(rel) > 1 ? 1 : 0.35;
      marker.current.scale.setScalar(THREE.MathUtils.damp(marker.current.scale.x, show, 6, dt));
    }

    // Кольцо капитана
    if (crew.current) {
      const on = s.control !== 'owner' ? 1 : 0;
      const k = THREE.MathUtils.damp(crew.current.scale.x, on ? 1 : 0.001, 3, dt);
      crew.current.scale.setScalar(k);
      crew.current.rotation.y += dt * 0.25;
    }
  });

  const ticks = useMemo(() => Array.from({ length: 36 }, (_, i) => i * 10), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SEA_R * 2, SEA_R * 2, 140, 140]} />
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
      </mesh>
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[SEA_R, SEA_R, 3, 96, 1, true]} />
        <meshStandardMaterial ref={side} color="#2f6276" roughness={0.6} />
      </mesh>
      <mesh position={[0, -3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[SEA_R, 96]} />
        <meshStandardMaterial ref={bottom} color="#1d3d4a" side={THREE.DoubleSide} />
      </mesh>

      <instancedMesh ref={wake} args={[undefined, undefined, POOL]} frustumCulled={false}>
        <circleGeometry args={[1, 14]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.45} depthWrite={false} />
      </instancedMesh>

      {/* Компас */}
      <group ref={compass}>
        {ticks.map((deg) => {
          const a = THREE.MathUtils.degToRad(deg);
          const major = deg % 90 === 0;
          const rr = SEA_R - 0.45;
          return (
            <mesh key={deg} position={[Math.cos(a) * rr, 0.04, Math.sin(a) * rr]} rotation={[0, -a, 0]}>
              <boxGeometry args={[major ? 0.5 : 0.25, 0.02, 0.05]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={major ? 0.9 : 0.5} />
            </mesh>
          );
        })}
        {(['N', 'E', 'S', 'W'] as const).map((l, i) => {
          const a = THREE.MathUtils.degToRad(i * 90);
          const rr = SEA_R + 0.7;
          return (
            <sprite key={l} position={[Math.cos(a) * rr, 0.4, Math.sin(a) * rr]} scale={[0.9, 0.9, 1]}>
              <spriteMaterial map={labelTexture(l, l === 'N' ? '#b08d57' : '#8a8f96')} transparent depthWrite={false} />
            </sprite>
          );
        })}
      </group>

      {/* Метка заданного курса */}
      <group ref={marker}>
        <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.32, 0.7, 3]} />
          <meshBasicMaterial color="#d4aa63" />
        </mesh>
      </group>

      {/* Кольцо «у руля капитан» */}
      <group ref={crew} scale={0.001}>
        {Array.from({ length: 40 }, (_, i) => {
          const a = (i / 40) * Math.PI * 2;
          const rr = SEA_R - 1.4;
          return (
            <mesh key={i} position={[Math.cos(a) * rr, 0.35, Math.sin(a) * rr]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.08, 0.05, 0.9]} />
              <meshBasicMaterial color="#d9b679" />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
