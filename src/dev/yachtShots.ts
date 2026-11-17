/**
 * DEV-ONLY: снятие всех состояний пульта яхты для сборки макетов в Figma.
 * В консоли (на #/yacht, окно 390×844 или 1180×820):
 *   await __yShots('phone', ['day'])      // одна сцена
 *   await __yShots('tablet')              // все сцены + шторм
 * Каждый кадр: <сцена>__<устройство>__<id>.json (слои) и .png (3D-сцена) → .figma-captures/
 */
import { act, dev, type LightScene, type YachtState } from '../yacht/state';
import { serialize } from './figmaExport';

type Device = 'phone' | 'tablet';
interface Shot {
  id: string;
  title: string;
  patch: Partial<YachtState>;
}

const CART = { champ: 1, oyst: 1, spritz: 2 };

const base = (): Partial<YachtState> => ({
  tab: 'helm',
  focus: null,
  throttle: 2,
  speed: 14,
  heading: 245,
  targetHeading: 245,
  turn: 0,
  control: 'owner',
  weather: 'calm',
  stormAlert: null,
  music: { playing: false, track: 0, pos: 0, volume: 0.6, zones: ['salon', 'aft'] },
  spa: { on: true, bubbles: false, temp: 36, target: 36 },
  cart: {},
  dest: 'aft',
  picking: false,
  order: null,
  toast: null,
});

export const SHOTS: Shot[] = [
  { id: '01', title: 'Ход', patch: { targetHeading: 262, turn: 0.45 } },
  { id: '02', title: 'Ход — у руля капитан', patch: { control: 'captain' } },
  { id: '03', title: 'Музыка', patch: { tab: 'music', music: { playing: true, track: 2, pos: 84, volume: 0.7, zones: ['salon', 'aft', 'bow'] } } },
  { id: '04', title: 'Свет', patch: { tab: 'lights' } },
  { id: '05', title: 'Джакузи', patch: { tab: 'spa', focus: 'bow', spa: { on: true, bubbles: true, temp: 34.6, target: 38 } } },
  { id: '06', title: 'Сервис — меню', patch: { tab: 'service', cart: CART, dest: 'aft' } },
  { id: '07', title: 'Сервис — место на яхте', patch: { tab: 'service', cart: CART, dest: 'salon', picking: true } },
  {
    id: '08',
    title: 'Сервис — стюард несёт',
    patch: { tab: 'service', order: { items: CART, dest: 'aft', stage: 'walking', t: 0.6, prep: 8 } },
  },
];

export const STORM: Shot[] = [
  { id: 'S1', title: 'Шторм — предупреждение', patch: { weather: 'storm', stormAlert: 7.2 } },
  { id: 'S2', title: 'Шторм — капитан ведёт', patch: { weather: 'storm', control: 'captain', throttle: 1, speed: 6 } },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(name: string, body: BodyInit) {
  const r = await fetch(`/__fig/save?name=${encodeURIComponent(name)}`, { method: 'POST', body });
  if (!r.ok) throw new Error(`save failed: ${name}`);
}

type R3fWin = { __r3fCapture: (w: number, h: number, s?: number) => Promise<Blob>; __r3fResume: () => void };

async function capture(file: string, title: string) {
  dev.patch({ toast: null });
  await sleep(150);
  const box = document.querySelector<HTMLElement>('.y-canvas')!.getBoundingClientRect();
  // Сцена прокручивается вручную (3 с анимации), чтобы камера и цвета успокоились даже в скрытом окне
  const blob = await (window as unknown as R3fWin).__r3fCapture(Math.round(box.width), Math.round(box.height), 3);
  const app = document.querySelector<HTMLElement>('.y-app')!;
  const json = serialize('.y-app', title, { designW: app.getBoundingClientRect().width });
  await post(`${file}.json`, json);
  await post(`${file}.png`, blob);
  return json.length;
}

async function run(device: Device, scenes: (LightScene | 'storm')[] = ['day', 'sunset', 'party', 'night', 'storm']) {
  // В скрытом окне ResizeObserver молчит — r3f измеряет холст по событию resize
  window.dispatchEvent(new Event('resize'));
  for (let i = 0; i < 40 && !(window as unknown as Partial<R3fWin>).__r3fCapture; i++) await sleep(100);
  dev.pause(true);
  const log: string[] = [];
  try {
    for (const scene of scenes) {
      const list = scene === 'storm' ? STORM : SHOTS;
      act.lightScene(scene === 'storm' ? 'day' : scene);
      for (const shot of list) {
        dev.patch({ ...base(), ...shot.patch });
        await sleep(400);
        const file = `${scene}__${device}__${shot.id}`;
        const n = await capture(file, shot.title);
        log.push(`${file} ${n}`);
      }
    }
  } finally {
    dev.patch(base());
    dev.pause(false);
    (window as unknown as R3fWin).__r3fResume();
  }
  return log;
}

declare global {
  interface Window {
    __yShots: typeof run;
  }
}
window.__yShots = run;
export {};
