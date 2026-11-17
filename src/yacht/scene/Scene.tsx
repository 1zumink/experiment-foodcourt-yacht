import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, advance, useFrame, useThree } from '@react-three/fiber';
import { yacht } from '../state';
import { MOODS, ZONE_CENTER, dampColor } from './layout';
import { Yacht } from './Yacht';
import { Water } from './Water';
import { Notes, Rain, ServePicker, Steam, Steward } from './Effects';

const OFFSET = new THREE.Vector3(14, 16, 22).normalize().multiplyScalar(60);
const HOME = new THREE.Vector3(0.4, 0.6, 0);

/** Камера: изометрия, плавно подлетает к выбранной зоне */
function CameraRig() {
  const { camera } = useThree();
  const look = useRef(HOME.clone());
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ size }, dt) => {
    const s = yacht.get();
    if (s.focus) tgt.set(...ZONE_CENTER[s.focus]);
    else tgt.copy(HOME);
    look.current.lerp(tgt, 1 - Math.exp(-dt * 2.6));
    const base = Math.min(size.width / 27, size.height / 17);
    const want = base * (s.focus ? 2.1 : 1);
    camera.zoom = THREE.MathUtils.damp(camera.zoom, want, 2.6, dt);
    camera.position.copy(look.current).add(OFFSET);
    camera.lookAt(look.current);
    camera.updateProjectionMatrix();
  });
  return null;
}

/** Небо, солнце, общий свет — по сцене освещения и погоде */
function Atmosphere() {
  const { scene } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const flash = useRef(0);
  const c = useMemo(() => ({ bg: new THREE.Color(MOODS.day.bg), a: new THREE.Color(), b: new THREE.Color() }), []);
  useMemo(() => {
    scene.background = c.bg;
  }, [scene, c]);

  useFrame((_, dt) => {
    const s = yacht.get();
    const m = MOODS[s.weather === 'storm' ? 'storm' : s.lights.scene];
    dampColor(c.bg, c.a.set(m.bg), dt, 2);
    if (hemi.current) {
      dampColor(hemi.current.color, c.a.set(m.hemiSky), dt, 2);
      dampColor(hemi.current.groundColor, c.a.set(m.hemiGround), dt, 2);
      hemi.current.intensity = THREE.MathUtils.damp(hemi.current.intensity, m.hemi, 2, dt) + flash.current * 3;
    }
    if (sun.current) {
      dampColor(sun.current.color, c.a.set(m.sun), dt, 2);
      sun.current.intensity = THREE.MathUtils.damp(sun.current.intensity, m.sunI, 2, dt);
    }
    if (flash.current > 0) c.bg.lerp(c.b.set('#c9d6e0'), flash.current * 0.5);
  });

  return (
    <>
      <hemisphereLight ref={hemi} intensity={1.5} />
      <directionalLight
        ref={sun}
        position={[-8, 18, 10]}
        intensity={2.6}
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      <Rain onFlash={(k) => (flash.current = k)} />
    </>
  );
}

/** Только dev: съёмка кадра для Figma без видимого окна — задаём размер и прокручиваем анимацию вручную */
function DevCapture() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    w.__r3fCapture = async (width: number, height: number, seconds = 3) => {
      const st = get();
      st.setFrameloop('never');
      st.setDpr(2);
      st.setSize(width, height);
      let t = 0;
      for (let i = 0; i < seconds * 60; i++) {
        t += 1 / 60;
        advance(t, true, get());
      }
      const canvas = get().gl.domElement;
      return new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    };
    w.__r3fResume = () => get().setFrameloop('always');
  }, [get]);
  return null;
}

export function Scene() {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: import.meta.env.DEV }}
      camera={{ position: OFFSET.toArray(), zoom: 14, near: -200, far: 400 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
    >
      <CameraRig />
      {import.meta.env.DEV && <DevCapture />}
      <Atmosphere />
      <Water />
      <Yacht>
        <Steward />
        <Notes />
        <Steam />
        <ServePicker />
      </Yacht>
    </Canvas>
  );
}
