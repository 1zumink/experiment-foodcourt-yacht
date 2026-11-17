import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { yacht, type LightZone, type Zone } from '../state';
import { DECK, HULL, MOODS, SPEAKERS, hullShape, railPoints } from './layout';

type V3 = [number, number, number];

function useMats() {
  return useMemo(() => {
    const std = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
    return {
      hullWhite: std('#fbfaf6', { roughness: 0.35 }),
      hullNavy: std('#13243a', { roughness: 0.4 }),
      wall: std('#f5f2ec'),
      wallLow: std('#ebe6dc'),
      teak: std('#a7764a', { roughness: 0.85 }),
      teakDark: std('#7a5233'),
      oak: std('#d6bf9b'),
      rug: std('#cdbfa6', { roughness: 1 }),
      linen: std('#ece5d8', { roughness: 1 }),
      camel: std('#b88553', { roughness: 0.6 }),
      navy: std('#1f3550', { roughness: 0.9 }),
      charcoal: std('#252b33', { roughness: 0.6 }),
      marble: std('#f1eee8', { roughness: 0.25 }),
      tile: std('#e3e6e8', { roughness: 0.4 }),
      carpet: std('#e2d8c8', { roughness: 1 }),
      bridgeFloor: std('#3a4552'),
      glass: std('#1c2c3e', { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.75 }),
      brass: std('#b08d57', { roughness: 0.3, metalness: 0.8 }),
      chrome: std('#d9dde1', { roughness: 0.2, metalness: 0.9 }),
      leaf: std('#3f6b4a', { roughness: 0.9 }),
      pot: std('#d8d0c3'),
      skin: std('#d9a982'),
      uniform: std('#ffffff', { roughness: 0.6 }),
      screen: std('#0d1824', { emissive: new THREE.Color('#5fb8ff'), emissiveIntensity: 1.2 }),
      speaker: std('#2a3038', { roughness: 0.5 }),
      cushion: std('#f3efe7', { roughness: 1 }),
    };
  }, []);
}

/** Коробка: y — низ относительно палубы */
function B({ p, s, m, shadow = true }: { p: V3; s: V3; m: THREE.Material; shadow?: boolean }) {
  return (
    <mesh position={[p[0], p[1] + s[1] / 2, p[2]]} castShadow={shadow} receiveShadow material={m}>
      <boxGeometry args={s} />
    </mesh>
  );
}

function Cyl({ p, r, h, m, seg = 20 }: { p: V3; r: number; h: number; m: THREE.Material; seg?: number }) {
  return (
    <mesh position={[p[0], p[1] + h / 2, p[2]]} castShadow receiveShadow material={m}>
      <cylinderGeometry args={[r, r, h, seg]} />
    </mesh>
  );
}

const LAMP_POS: Record<Exclude<LightZone, 'underwater'>, V3[]> = {
  salon: [[-2.9, 1.7, 0]],
  galley: [[0.5, 1.6, 0.2]],
  cabin: [[3.1, 1.5, -0.6]],
  deck: [
    [-6.9, 1.3, 0],
    [7.5, 1.4, 0],
  ],
};

export function Yacht({ children }: { children?: ReactNode }) {
  const m = useMats();
  const root = useRef<THREE.Group>(null);
  const radar = useRef<THREE.Mesh>(null);
  const captainGlow = useRef<THREE.Mesh>(null);
  const spaWater = useRef<THREE.MeshStandardMaterial>(null);
  const flag = useRef<THREE.Mesh>(null);

  // Лампы: материал абажура + точечный свет на каждую зону
  const lampMats = useMemo(() => {
    const o = {} as Record<Exclude<LightZone, 'underwater'>, THREE.MeshStandardMaterial>;
    (Object.keys(LAMP_POS) as (keyof typeof LAMP_POS)[]).forEach((z) => {
      o[z] = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: new THREE.Color('#ffc677'), emissiveIntensity: 0 });
    });
    return o;
  }, []);
  const lightRefs = useRef<Partial<Record<keyof typeof LAMP_POS, THREE.PointLight[]>>>({});
  const speakerRefs = useRef<Partial<Record<Zone, THREE.Group>>>({});
  const levels = useRef<Record<string, number>>({});

  const hullGeo = useMemo(() => {
    const opts = (depth: number, bevel = 0.1) => ({ depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 24 });
    return {
      navy: new THREE.ExtrudeGeometry(hullShape(0.08), opts(0.9, 0.12)),
      white: new THREE.ExtrudeGeometry(hullShape(0), opts(0.95, 0.08)),
      deck: new THREE.ExtrudeGeometry(hullShape(0.14), opts(0.06, 0)),
      stripe: new THREE.ExtrudeGeometry(hullShape(-0.015), opts(0.05, 0)),
    };
  }, []);

  const rails = useMemo(
    () =>
      ([1, -1] as const).map((side) => {
        const pts = railPoints(side).map((v) => v.clone().setY(0.62));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.03, 6, false);
      }),
    [],
  );

  const tmp = useMemo(() => ({ c: new THREE.Color(), cold: new THREE.Color('#a8dcea'), warm: new THREE.Color('#2fb7c2') }), []);

  useFrame((st, dt) => {
    const s = yacht.get();
    const t = st.clock.elapsedTime;
    const g = root.current;
    if (!g) return;
    const storm = s.weather === 'storm' ? 1 : 0;
    levels.current.storm = THREE.MathUtils.damp(levels.current.storm ?? 0, storm, 0.8, dt);
    const sv = levels.current.storm;
    const sp = s.speed / 24;

    // Рыскание и крен в повороте, качка, подъём носа на ходу
    levels.current.turn = THREE.MathUtils.damp(levels.current.turn ?? 0, s.turn, 1.6, dt);
    const tr = levels.current.turn;
    g.rotation.order = 'YXZ';
    g.rotation.y = -tr * 0.42;
    g.rotation.x = tr * 0.09 * Math.min(1, 0.3 + sp) + Math.sin(t * 0.9) * (0.012 + sv * 0.09);
    g.rotation.z = sp * 0.035 + Math.sin(t * 1.25 + 1) * (0.008 + sv * 0.06);
    g.position.y = Math.sin(t * 1.1) * (0.05 + sv * 0.3) - sp * 0.05;

    if (radar.current) radar.current.rotation.y += dt * (s.control === 'owner' ? 1.2 : 3.5);
    if (flag.current) flag.current.rotation.y = Math.sin(t * 3) * 0.15 + sp * 0.4;

    // Свет по зонам
    const mood = MOODS[s.weather === 'storm' ? 'storm' : s.lights.scene];
    const party = s.lights.scene === 'party';
    const beat = s.music.playing ? 0.75 + 0.25 * Math.max(0, Math.sin(t * 7.6)) : 1;
    (Object.keys(LAMP_POS) as (keyof typeof LAMP_POS)[]).forEach((z, i) => {
      const on = s.lights.zones[z] ? s.lights.level * mood.lamps : 0;
      const k = THREE.MathUtils.damp(levels.current[z] ?? 0, on, 3, dt);
      levels.current[z] = k;
      const pulse = party || (s.music.playing && s.lights.scene !== 'day') ? beat : 1;
      const mat = lampMats[z];
      if (party) mat.emissive.setHSL((t * 0.08 + i * 0.22) % 1, 0.85, 0.6);
      else mat.emissive.set('#ffc677');
      mat.emissiveIntensity = k * 2.4 * pulse;
      lightRefs.current[z]?.forEach((l) => {
        l.intensity = k * 9 * pulse;
        l.color.copy(mat.emissive);
      });
    });

    // Колонки пульсируют, где играет музыка
    (Object.keys(SPEAKERS) as Zone[]).forEach((z) => {
      const grp = speakerRefs.current[z];
      if (!grp) return;
      const on = s.music.playing && s.music.zones.includes(z);
      const k = on ? 1 + Math.max(0, Math.sin(t * 7.6 + 0.3)) * 0.12 * (0.4 + s.music.volume) : 1;
      grp.children.forEach((c) => c.scale.setScalar(THREE.MathUtils.damp(c.scale.x, k, 12, dt)));
    });

    // Капитан подсвечивается, когда у руля
    if (captainGlow.current) {
      const mat = captainGlow.current.material as THREE.MeshBasicMaterial;
      const on = s.control !== 'owner' ? (s.control === 'requesting' ? 0.4 + 0.3 * Math.sin(t * 6) : 0.85) : 0;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, on, 4, dt);
      captainGlow.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.06);
    }

    // Джакузи: цвет воды от температуры
    if (spaWater.current) {
      const k = THREE.MathUtils.clamp((s.spa.temp - 28) / 12, 0, 1);
      tmp.c.copy(tmp.cold).lerp(tmp.warm, k);
      spaWater.current.color.copy(tmp.c);
      spaWater.current.emissive.copy(tmp.c);
      const night = mood.lamps > 0.5 ? 0.6 : 0.08;
      spaWater.current.emissiveIntensity = night * (s.spa.on ? 1 : 0.3) + (s.spa.bubbles ? Math.sin(t * 9) * 0.05 : 0);
    }
  });

  const D = 0; // всё ниже — относительно палубы
  return (
    <group ref={root}>
      {/* Корпус */}
      <mesh geometry={hullGeo.navy} material={m.hullNavy} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]} castShadow />
      <mesh geometry={hullGeo.white} material={m.hullWhite} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]} castShadow receiveShadow />
      <mesh geometry={hullGeo.stripe} material={m.brass} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.42, 0]} />
      <mesh geometry={hullGeo.deck} material={m.teak} rotation={[-Math.PI / 2, 0, 0]} position={[0, DECK - 0.05, 0]} receiveShadow />
      {/* Платформа для купания */}
      <B p={[HULL.stern - 0.55, 0.22, 0]} s={[1.0, 0.14, 4.6]} m={m.teak} />

      <group position={[0, DECK, 0]}>
        {/* Полы зон */}
        <B p={[-2.9, D, 0]} s={[4.6, 0.03, 4.5]} m={m.oak} shadow={false} />
        <B p={[0.5, D, 0]} s={[2.2, 0.03, 4.5]} m={m.tile} shadow={false} />
        <B p={[3.0, D, 0]} s={[2.8, 0.03, 4.5]} m={m.carpet} shadow={false} />
        <B p={[5.3, D, 0]} s={[1.8, 0.03, 4.1]} m={m.bridgeFloor} shadow={false} />

        {/* Стены: дальний (левый) борт — высокий, ближний — разрезан низко */}
        <B p={[-0.4, 0, -2.25]} s={[9.6, 1.5, 0.1]} m={m.wall} />
        {[-4.2, -2.2, 0.2, 2.6].map((x) => (
          <B key={x} p={[x, 0.55, -2.31]} s={[1.3, 0.55, 0.04]} m={m.glass} shadow={false} />
        ))}
        <B p={[-0.4, 0, 2.25]} s={[9.6, 0.32, 0.1]} m={m.wallLow} />
        {/* Перегородки */}
        {[-5.2, -0.6, 1.6, 4.4].map((x) => (
          <group key={x}>
            <B p={[x, 0, -1.25]} s={[0.1, 1.5, 2.0]} m={m.wall} />
            <B p={[x, 0, 1.3]} s={[0.1, 0.32, 1.9]} m={m.wallLow} />
          </group>
        ))}
        {/* Остекление салона к корме */}
        <B p={[-5.2, 0.32, 1.3]} s={[0.04, 1.18, 1.9]} m={m.glass} shadow={false} />

        {/* ---- Корма: U-диван и стол ---- */}
        <B p={[-8.15, 0, 0]} s={[0.6, 0.42, 4.2]} m={m.cushion} />
        <B p={[-8.4, 0.42, 0]} s={[0.18, 0.4, 4.2]} m={m.cushion} />
        <B p={[-7.2, 0, -1.85]} s={[1.9, 0.42, 0.55]} m={m.cushion} />
        <B p={[-7.2, 0, 1.85]} s={[1.9, 0.42, 0.55]} m={m.cushion} />
        <B p={[-7.0, 0, 0]} s={[1.1, 0.4, 1.6]} m={m.teakDark} />
        <Cyl p={[-8.75, 0, 2.2]} r={0.025} h={1.4} m={m.chrome} seg={6} />
        <mesh ref={flag} position={[-8.75, 1.22, 2.2]}>
          <boxGeometry args={[0.02, 0.3, 0.5]} />
          <meshStandardMaterial color="#13243a" />
        </mesh>

        {/* ---- Салон ---- */}
        <B p={[-2.9, 0.03, 0.2]} s={[3.2, 0.02, 2.6]} m={m.rug} shadow={false} />
        <B p={[-3.0, 0, -1.65]} s={[3.0, 0.42, 0.9]} m={m.linen} />
        <B p={[-3.0, 0.42, -2.0]} s={[3.0, 0.42, 0.2]} m={m.linen} />
        <B p={[-4.55, 0, -0.35]} s={[0.9, 0.42, 1.7]} m={m.linen} />
        <B p={[-4.9, 0.42, -0.35]} s={[0.2, 0.42, 1.7]} m={m.linen} />
        <B p={[-2.9, 0, -0.2]} s={[1.3, 0.3, 0.75]} m={m.teakDark} />
        <B p={[-1.6, 0, 1.2]} s={[0.85, 0.42, 0.85]} m={m.camel} />
        <B p={[-1.25, 0.42, 1.2]} s={[0.18, 0.4, 0.85]} m={m.camel} />
        <B p={[-2.9, 0.75, -2.17]} s={[1.6, 0.6, 0.05]} m={m.charcoal} shadow={false} />
        <Cyl p={[-0.95, 0, 1.75]} r={0.2} h={0.35} m={m.pot} />
        <mesh position={[-0.95, 0.75, 1.75]} castShadow material={m.leaf}>
          <icosahedronGeometry args={[0.38, 0]} />
        </mesh>
        <Cyl p={[-4.85, 0, -1.95]} r={0.025} h={1.25} m={m.brass} seg={6} />
        <mesh position={[-4.85, 1.3, -1.95]} material={lampMats.salon}>
          <cylinderGeometry args={[0.16, 0.22, 0.24, 16]} />
        </mesh>

        {/* ---- Камбуз ---- */}
        <B p={[0.4, 0, -1.95]} s={[1.9, 0.85, 0.55]} m={m.wall} />
        <B p={[0.4, 0.85, -1.95]} s={[1.95, 0.05, 0.6]} m={m.charcoal} />
        <B p={[0.5, 0, 0.15]} s={[1.4, 0.85, 0.7]} m={m.navy} />
        <B p={[0.5, 0.85, 0.15]} s={[1.5, 0.06, 0.8]} m={m.marble} />
        {[0.05, 0.5, 0.95].map((x) => (
          <Cyl key={x} p={[x, 0, 0.85]} r={0.13} h={0.6} m={m.brass} seg={10} />
        ))}
        <mesh position={[0.5, 1.45, 0.15]} material={lampMats.galley}>
          <sphereGeometry args={[0.13, 16, 12]} />
        </mesh>

        {/* ---- Каюта ---- */}
        <B p={[3.2, 0, -1.1]} s={[1.9, 0.4, 2.2]} m={m.wall} />
        <B p={[3.2, 0.4, -1.1]} s={[1.85, 0.12, 2.15]} m={m.cushion} />
        <B p={[3.2, 0.52, -0.3]} s={[1.87, 0.05, 0.6]} m={m.navy} />
        <B p={[2.75, 0.52, -1.9]} s={[0.7, 0.14, 0.35]} m={m.cushion} />
        <B p={[3.65, 0.52, -1.9]} s={[0.7, 0.14, 0.35]} m={m.cushion} />
        <B p={[3.2, 0, -2.15]} s={[2.1, 1.0, 0.08]} m={m.oak} />
        <B p={[1.95, 0, -1.95]} s={[0.4, 0.45, 0.4]} m={m.teakDark} />
        <B p={[4.15, 0, 0.9]} s={[0.4, 0.45, 0.4]} m={m.teakDark} />
        <mesh position={[1.95, 0.6, -1.95]} material={lampMats.cabin}>
          <sphereGeometry args={[0.11, 14, 10]} />
        </mesh>
        <B p={[3.2, 0, 0.55]} s={[1.3, 0.35, 0.4]} m={m.camel} />

        {/* ---- Рубка ---- */}
        <B p={[6.0, 0, 0]} s={[0.45, 0.95, 3.2]} m={m.charcoal} />
        <B p={[5.79, 0.8, -0.65]} s={[0.04, 0.32, 0.8]} m={m.screen} shadow={false} />
        <B p={[5.79, 0.8, 0.55]} s={[0.04, 0.32, 0.8]} m={m.screen} shadow={false} />
        <mesh position={[5.7, 1.0, 0]} rotation={[0, Math.PI / 2, 0]} material={m.teakDark} castShadow>
          <torusGeometry args={[0.22, 0.03, 8, 24]} />
        </mesh>
        <B p={[6.28, 0.95, 0]} s={[0.06, 0.55, 3.4]} m={m.glass} shadow={false} />
        <B p={[5.3, 0, -1.95]} s={[1.8, 1.5, 0.1]} m={m.wall} />
        {/* Капитан */}
        <group position={[5.15, 0, 0]}>
          <mesh ref={captainGlow} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.38, 0.52, 40]} />
            <meshBasicMaterial color="#d9b679" transparent opacity={0} depthWrite={false} />
          </mesh>
          <B p={[-0.15, 0, 0]} s={[0.45, 0.5, 0.5]} m={m.charcoal} />
          <mesh position={[0.05, 0.85, 0]} castShadow material={m.uniform}>
            <capsuleGeometry args={[0.17, 0.4, 4, 10]} />
          </mesh>
          <mesh position={[0.05, 1.35, 0]} castShadow material={m.skin}>
            <sphereGeometry args={[0.15, 16, 12]} />
          </mesh>
          <mesh position={[0.05, 1.49, 0]} material={m.navy}>
            <cylinderGeometry args={[0.16, 0.16, 0.08, 16]} />
          </mesh>
          <mesh position={[0.12, 1.46, 0]} material={m.brass}>
            <boxGeometry args={[0.18, 0.02, 0.3]} />
          </mesh>
        </group>
        {/* Радарная арка */}
        <B p={[4.75, 0, -1.9]} s={[0.12, 2.6, 0.12]} m={m.hullWhite} />
        <B p={[4.75, 0, 1.9]} s={[0.12, 2.6, 0.12]} m={m.hullWhite} />
        <B p={[4.75, 2.6, 0]} s={[0.35, 0.16, 3.92]} m={m.hullWhite} />
        <mesh ref={radar} position={[4.75, 2.92, 0]} material={m.hullWhite} castShadow>
          <boxGeometry args={[0.16, 0.08, 1.1]} />
        </mesh>
        <Cyl p={[4.75, 2.76, 0]} r={0.06} h={0.14} m={m.chrome} seg={8} />

        {/* ---- Нос: джакузи ---- */}
        <Cyl p={[7.55, 0, 0]} r={1.08} h={0.45} m={m.hullWhite} seg={40} />
        <mesh position={[7.55, 0.42, 0]} receiveShadow>
          <cylinderGeometry args={[0.92, 0.92, 0.04, 40]} />
          <meshStandardMaterial ref={spaWater} color="#a8dcea" roughness={0.1} emissive="#a8dcea" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[7.55, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.teak}>
          <ringGeometry args={[0.95, 1.08, 40]} />
        </mesh>
        {rails.map((g, i) => (
          <mesh key={i} geometry={g} material={m.chrome} />
        ))}

        {/* Колонки */}
        {(Object.keys(SPEAKERS) as Zone[]).map((z) => (
          <group
            key={z}
            ref={(el) => {
              if (el) speakerRefs.current[z] = el;
            }}
          >
            {SPEAKERS[z]!.map(([x, zz]) => (
              <mesh key={`${x}${zz}`} position={[x, z === 'salon' ? 0.55 : 0.28, zz]} castShadow material={m.speaker}>
                <boxGeometry args={z === 'salon' ? [0.26, 1.1, 0.26] : [0.22, 0.56, 0.22]} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Светильники палуб */}
        {LAMP_POS.deck.map(([x, , z]) => (
          <mesh key={x} position={[x, 0.06, z + (x < 0 ? 1.4 : 1.25)]} material={lampMats.deck}>
            <sphereGeometry args={[0.08, 10, 8]} />
          </mesh>
        ))}

        {/* Точечные источники */}
        {(Object.keys(LAMP_POS) as (keyof typeof LAMP_POS)[]).flatMap((z) =>
          LAMP_POS[z].map((pos, i) => (
            <pointLight
              key={`${z}${i}`}
              ref={(el) => {
                if (!el) return;
                const arr = (lightRefs.current[z] ??= []);
                if (!arr.includes(el)) arr.push(el);
              }}
              position={pos}
              intensity={0}
              distance={5}
              decay={1.6}
              color="#ffc677"
            />
          )),
        )}

        {children}
      </group>
    </group>
  );
}
