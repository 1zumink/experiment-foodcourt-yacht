import * as THREE from 'three';
import type { LightScene, Zone } from '../state';

/** Нос яхты смотрит в +x, правый борт — +z. Палуба на высоте DECK. */
export const DECK = 1.33;
export const HULL = { stern: -8.6, shoulder: 3, bow: 10.2, w: 2.6 };
/** Радиус «диорамы» моря */
export const SEA_R = 13.2;

/** Центр зоны (куда летит камера) */
export const ZONE_CENTER: Record<Zone, [number, number, number]> = {
  aft: [-6.9, DECK, 0],
  salon: [-2.9, DECK, 0],
  galley: [0.5, DECK, 0],
  cabin: [3.0, DECK, 0],
  bridge: [5.3, DECK + 0.4, 0],
  bow: [7.6, DECK, 0],
};

/** Куда стюард приносит заказ (x, z на палубе) */
export const SERVE_POINT: Record<Zone, [number, number]> = {
  aft: [-6.6, 0.9],
  salon: [-2.4, 0.5],
  galley: [0.5, 1.2],
  cabin: [2.9, 0.7],
  bridge: [5.0, 1.0],
  bow: [6.3, 1.25],
};

/** Колонки по зонам */
export const SPEAKERS: Partial<Record<Zone, [number, number][]>> = {
  salon: [
    [-0.85, -2.0],
    [-5.0, 1.9],
  ],
  aft: [
    [-8.0, -1.95],
    [-8.0, 1.95],
  ],
  bow: [
    [6.5, -1.7],
    [6.5, 1.7],
  ],
  cabin: [[1.95, 1.9]],
};

export function stewardPath(dest: Zone): THREE.Vector3[] {
  const [dx, dz] = SERVE_POINT[dest];
  const lane = 1.75;
  return [
    new THREE.Vector3(0.5, 0, 1.1),
    new THREE.Vector3(0.5, 0, lane),
    new THREE.Vector3(dx, 0, lane),
    new THREE.Vector3(dx, 0, dz),
  ];
}

export function hullShape(inset = 0) {
  const { stern, shoulder, bow } = HULL;
  const w = HULL.w - inset;
  const b = bow - inset * 1.6;
  const s = new THREE.Shape();
  s.moveTo(stern + inset, -w);
  s.lineTo(shoulder, -w);
  s.quadraticCurveTo(b - 0.8, -w * 0.95, b, 0);
  s.quadraticCurveTo(b - 0.8, w * 0.95, shoulder, w);
  s.lineTo(stern + inset, w);
  s.closePath();
  return s;
}

/** Точки вдоль борта от плеча к носу (для лееров) */
export function railPoints(side: 1 | -1, inset = 0.12) {
  const { shoulder, bow } = HULL;
  const w = HULL.w - inset;
  const b = bow - inset * 2;
  const pts: THREE.Vector3[] = [new THREE.Vector3(-1, 0, side * w)];
  const p0 = new THREE.Vector2(shoulder, w);
  const p1 = new THREE.Vector2(b - 0.8, w * 0.95);
  const p2 = new THREE.Vector2(b, 0);
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const z = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    pts.push(new THREE.Vector3(x, 0, side * z));
  }
  return pts;
}

/* ============ Атмосфера по сценам ============ */

export interface Mood {
  bg: string;
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  sun: string;
  sunI: number;
  deep: string;
  shallow: string;
  foam: string;
  /** яркость интерьерных ламп */
  lamps: number;
}

export const MOODS: Record<LightScene | 'storm', Mood> = {
  day: {
    bg: '#ece6db',
    hemiSky: '#ffffff',
    hemiGround: '#bfae93',
    hemi: 1.5,
    sun: '#fff3e0',
    sunI: 2.6,
    deep: '#4c8ea6',
    shallow: '#93cbd6',
    foam: '#ffffff',
    lamps: 0.35,
  },
  sunset: {
    bg: '#f1d7c1',
    hemiSky: '#ffd8b5',
    hemiGround: '#7a5b4a',
    hemi: 1.0,
    sun: '#ff9a58',
    sunI: 2.1,
    deep: '#41718d',
    shallow: '#d8a78c',
    foam: '#fff1e2',
    lamps: 0.9,
  },
  party: {
    bg: '#140f26',
    hemiSky: '#9a7cff',
    hemiGround: '#1a1030',
    hemi: 0.7,
    sun: '#b18cff',
    sunI: 0.6,
    deep: '#16153a',
    shallow: '#2f2a66',
    foam: '#b8a8ff',
    lamps: 1,
  },
  night: {
    bg: '#0c1421',
    hemiSky: '#8aa3c9',
    hemiGround: '#1a2230',
    hemi: 0.85,
    sun: '#9db4e0',
    sunI: 0.7,
    deep: '#0a2033',
    shallow: '#1b4562',
    foam: '#9cc3dd',
    lamps: 1,
  },
  storm: {
    bg: '#262d34',
    hemiSky: '#b9c4cc',
    hemiGround: '#3b4247',
    hemi: 0.8,
    sun: '#c9d3da',
    sunI: 0.55,
    deep: '#1f323b',
    shallow: '#4c636d',
    foam: '#dfe7ea',
    lamps: 0.9,
  },
};

/** Плавное приближение THREE.Color к цели */
export function dampColor(c: THREE.Color, target: THREE.Color, dt: number, k = 2.5) {
  c.lerp(target, 1 - Math.exp(-k * dt));
}

let noteTex: THREE.Texture | null = null;
export function noteTexture() {
  if (noteTex) return noteTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.font = '52px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('♪', 32, 34);
  noteTex = new THREE.CanvasTexture(c);
  noteTex.colorSpace = THREE.SRGBColorSpace;
  return noteTex;
}

let puffTex: THREE.Texture | null = null;
export function puffTexture() {
  if (puffTex) return puffTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  puffTex = new THREE.CanvasTexture(c);
  return puffTex;
}

const labelCache = new Map<string, THREE.Texture>();
export function labelTexture(text: string, color = '#ffffff') {
  const key = text + color;
  const hit = labelCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.font = '600 40px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 32, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  labelCache.set(key, t);
  return t;
}
