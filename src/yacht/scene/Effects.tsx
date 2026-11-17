import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { act, SERVE_ZONES, steward, yacht, useYacht, type Zone } from '../state';
import { SEA_R, SERVE_POINT, SPEAKERS, noteTexture, puffTexture, stewardPath } from './layout';

/* ============ Стюард с клошем ============ */
export function Steward() {
  const g = useRef<THREE.Group>(null);
  const cloche = useRef<THREE.Mesh>(null);
  const spinner = useRef<THREE.Mesh>(null);
  const curve = useRef<{ dest: Zone; pts: THREE.Vector3[]; lens: number[]; total: number } | null>(null);

  useFrame((st, dt) => {
    const s = yacht.get();
    const o = s.order;
    const t = st.clock.elapsedTime;
    if (spinner.current) {
      const on = o?.stage === 'preparing';
      spinner.current.visible = on;
      spinner.current.rotation.z += dt * 3;
      if (on) spinner.current.scale.setScalar(0.8 + Math.sin(t * 4) * 0.05);
    }
    const grp = g.current;
    if (!grp) return;
    if (!o || o.stage === 'preparing') {
      grp.visible = false;
      return;
    }
    if (!curve.current || curve.current.dest !== o.dest) {
      const pts = stewardPath(o.dest);
      const lens = pts.slice(1).map((p, i) => p.distanceTo(pts[i]));
      const total = lens.reduce((a, b) => a + b, 0);
      curve.current = { dest: o.dest, pts, lens, total };
      steward.pathLen = total;
    }
    const c = curve.current;
    const k = o.stage === 'walking' ? o.t : 1;
    let d = k * c.total;
    let i = 0;
    while (i < c.lens.length - 1 && d > c.lens[i]) {
      d -= c.lens[i];
      i++;
    }
    const a = c.pts[i];
    const b = c.pts[i + 1];
    const f = c.lens[i] ? Math.min(1, d / c.lens[i]) : 1;
    grp.visible = !(o.stage === 'served' && o.t >= 1);
    grp.position.lerpVectors(a, b, f);
    const walking = o.stage === 'walking';
    grp.position.y = walking ? Math.abs(Math.sin(t * 9)) * 0.05 : 0;
    const dir = new THREE.Vector3().subVectors(b, a);
    if (dir.lengthSq() > 0) grp.rotation.y = Math.atan2(-dir.z, dir.x);
    const fade = o.stage === 'served' ? 1 - o.t : 1;
    grp.scale.setScalar(Math.max(0.001, fade) * 1.3);
    if (cloche.current) cloche.current.position.y = o.stage === 'served' ? 1.12 + Math.min(1, o.t * 4) * 0.35 : 1.12;
  });

  return (
    <>
      {/* Индикатор «готовим» над камбузом */}
      <mesh ref={spinner} position={[0.5, 2.2, 0.15]} visible={false}>
        <torusGeometry args={[0.32, 0.04, 8, 32, Math.PI * 1.4]} />
        <meshBasicMaterial color="#d4aa63" />
      </mesh>
      <group ref={g} visible={false}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.55, 4, 10]} />
          <meshStandardMaterial color="#fbfaf6" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.155, 0.155, 0.3, 12]} />
          <meshStandardMaterial color="#1b2a3c" />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.38, 32]} />
          <meshBasicMaterial color="#d4aa63" transparent opacity={0.9} depthWrite={false} />
        </mesh>
        <mesh position={[0, 1.08, 0]} castShadow>
          <sphereGeometry args={[0.13, 14, 10]} />
          <meshStandardMaterial color="#c99a74" />
        </mesh>
        {/* поднос и клош */}
        <mesh position={[0.28, 0.98, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.025, 20]} />
          <meshStandardMaterial color="#d9dde1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh ref={cloche} position={[0.28, 1.12, 0]}>
          <sphereGeometry args={[0.16, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e8e9eb" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>
    </>
  );
}

/* ============ Ноты из колонок ============ */
const NOTES = 28;
export function Notes() {
  const ref = useRef<THREE.Group>(null);
  const ps = useMemo(() => Array.from({ length: NOTES }, () => ({ alive: false, x: 0, y: 0, z: 0, age: 0, drift: 0 })), []);
  const acc = useRef(0);
  useFrame((_, dt) => {
    const s = yacht.get();
    const zones = s.music.playing ? s.music.zones.filter((z) => SPEAKERS[z]) : [];
    acc.current += zones.length ? dt * (1.5 + s.music.volume * 3) : 0;
    while (acc.current > 1) {
      acc.current -= 1;
      const p = ps.find((x) => !x.alive);
      if (!p) break;
      const z = zones[Math.floor(Math.random() * zones.length)];
      const spk = SPEAKERS[z]!;
      const [x, zz] = spk[Math.floor(Math.random() * spk.length)];
      Object.assign(p, { alive: true, x, y: z === 'salon' ? 1.2 : 0.7, z: zz, age: 0, drift: (Math.random() - 0.5) * 0.6 });
    }
    const g = ref.current;
    if (!g) return;
    ps.forEach((p, i) => {
      const sp = g.children[i] as THREE.Sprite;
      if (!p.alive) {
        sp.visible = false;
        return;
      }
      p.age += dt;
      if (p.age > 2.2) p.alive = false;
      sp.visible = true;
      sp.position.set(p.x + Math.sin(p.age * 3) * 0.12, p.y + p.age * 0.7, p.z + p.drift * p.age);
      const k = p.age / 2.2;
      (sp.material as THREE.SpriteMaterial).opacity = Math.sin(Math.PI * Math.min(1, k)) * 0.95;
      sp.scale.setScalar(0.35 + k * 0.15);
    });
  });
  const tex = noteTexture();
  return (
    <group ref={ref}>
      {ps.map((_, i) => (
        <sprite key={i} visible={false}>
          <spriteMaterial map={tex} color="#d4aa63" transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

/* ============ Пар и пузыри над джакузи ============ */
const PUFFS = 22;
export function Steam() {
  const ref = useRef<THREE.Group>(null);
  const ps = useMemo(() => Array.from({ length: PUFFS }, () => ({ alive: false, x: 0, z: 0, age: 0, life: 2 })), []);
  const acc = useRef(0);
  useFrame((_, dt) => {
    const s = yacht.get();
    const heat = s.spa.on ? Math.max(0, (s.spa.temp - 31) / 9) : 0;
    acc.current += dt * (heat * 9 + (s.spa.bubbles && s.spa.on ? 4 : 0));
    while (acc.current > 1) {
      acc.current -= 1;
      const p = ps.find((x) => !x.alive);
      if (!p) break;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.75;
      Object.assign(p, { alive: true, x: 7.55 + Math.cos(a) * r, z: Math.sin(a) * r, age: 0, life: 1.6 + Math.random() * 1.2 });
    }
    const g = ref.current;
    if (!g) return;
    ps.forEach((p, i) => {
      const sp = g.children[i] as THREE.Sprite;
      if (!p.alive) {
        sp.visible = false;
        return;
      }
      p.age += dt;
      if (p.age > p.life) p.alive = false;
      const k = p.age / p.life;
      sp.visible = true;
      sp.position.set(p.x, 0.5 + k * 1.4, p.z + k * 0.3);
      sp.scale.setScalar(0.3 + k * 0.9);
      (sp.material as THREE.SpriteMaterial).opacity = Math.sin(Math.PI * k) * 0.55;
    });
  });
  const tex = puffTexture();
  return (
    <group ref={ref}>
      {ps.map((_, i) => (
        <sprite key={i} visible={false}>
          <spriteMaterial map={tex} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

/* ============ Выбор места подачи прямо на яхте ============ */
export function ServePicker() {
  const s = useYacht();
  const [hover, setHover] = useState<Zone | null>(null);
  const t = useRef(0);
  const rings = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    t.current += dt;
    rings.current?.children.forEach((c, i) => {
      const sc = 1 + Math.sin(t.current * 4 + i) * 0.08;
      c.scale.set(sc, sc, sc);
    });
  });
  const show = s.tab === 'service' && !s.order;
  if (!show) return null;
  return (
    <group ref={rings}>
      {SERVE_ZONES.map((z) => {
        const [x, zz] = SERVE_POINT[z];
        const active = s.dest === z;
        return (
          <group key={z} position={[x, 0.06, zz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.32, active ? 0.5 : 0.42, 40]} />
              <meshBasicMaterial color={active ? '#d4aa63' : '#ffffff'} transparent opacity={active || hover === z || s.picking ? 0.95 : 0.0} depthWrite={false} />
            </mesh>
            {s.picking && (
              <mesh
                position={[0, 0.5, 0]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHover(z);
                }}
                onPointerOut={() => setHover(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  act.dest(z);
                }}
              >
                <boxGeometry args={[1.8, 1.2, 1.8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/* ============ Дождь и молнии ============ */
const DROPS = 700;
export function Rain({ onFlash }: { onFlash: (k: number) => void }) {
  const ref = useRef<THREE.LineSegments>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(DROPS * 6);
    for (let i = 0; i < DROPS; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * SEA_R;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = Math.random() * 14;
      pos.set([x, y, z, x - 0.12, y - 0.6, z + 0.05], i * 6);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const level = useRef(0);
  const flash = useRef({ next: 3, k: 0 });
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = yacht.get();
    level.current = THREE.MathUtils.damp(level.current, s.weather === 'storm' ? 1 : 0, 1.2, dt);
    const l = ref.current;
    if (!l) return;
    l.visible = level.current > 0.01;
    (l.material as THREE.LineBasicMaterial).opacity = level.current * 0.55;
    if (l.visible) {
      const a = geo.attributes.position as THREE.BufferAttribute;
      const arr = a.array as Float32Array;
      for (let i = 0; i < DROPS; i++) {
        const o = i * 6;
        const dy = dt * 16;
        arr[o + 1] -= dy;
        arr[o + 4] -= dy;
        arr[o] -= dt * 3;
        arr[o + 3] -= dt * 3;
        if (arr[o + 4] < 0) {
          const y = 12 + Math.random() * 3;
          arr[o + 1] = y;
          arr[o + 4] = y - 0.6;
          // капли сносит ветром — возвращаем в круг
          if (Math.hypot(arr[o], arr[o + 2]) > SEA_R) {
            const ang = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * SEA_R;
            arr[o] = Math.cos(ang) * r + 2;
            arr[o + 2] = Math.sin(ang) * r;
          }
          arr[o + 3] = arr[o] - 0.12;
          arr[o + 5] = arr[o + 2] + 0.05;
        }
      }
      a.needsUpdate = true;
    }
    // Молнии
    const f = flash.current;
    if (s.weather === 'storm') {
      f.next -= dt;
      if (f.next <= 0) {
        f.k = 1;
        f.next = 4 + Math.random() * 6;
      }
    }
    f.k = Math.max(0, f.k - dt * 3.5);
    onFlash(f.k > 0.5 ? f.k : f.k * 0.4);
  });
  return (
    <lineSegments ref={ref} geometry={geo} visible={false} frustumCulled={false}>
      <lineBasicMaterial color="#d6e2ea" transparent opacity={0} depthWrite={false} />
    </lineSegments>
  );
}
