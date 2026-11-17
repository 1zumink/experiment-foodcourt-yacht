import { useSyncExternalStore } from 'react';

/* ============ Модель ============ */

export type Zone = 'aft' | 'salon' | 'galley' | 'cabin' | 'bridge' | 'bow';
export type LightZone = 'salon' | 'galley' | 'cabin' | 'deck' | 'underwater';
export type LightScene = 'day' | 'sunset' | 'party' | 'night';
export type Tab = 'helm' | 'music' | 'lights' | 'spa' | 'service';
export type Control = 'owner' | 'captain' | 'requesting';
export type OrderStage = 'preparing' | 'walking' | 'served';

export const ZONE_LABEL: Record<Zone, string> = {
  aft: 'Корма',
  salon: 'Салон',
  galley: 'Камбуз',
  cabin: 'Каюта',
  bridge: 'Рубка',
  bow: 'Нос',
};

/** Куда можно подать еду */
export const SERVE_ZONES: Zone[] = ['aft', 'salon', 'cabin', 'bow'];
/** Где можно включить музыку */
export const MUSIC_ZONES: Zone[] = ['salon', 'aft', 'bow', 'cabin'];

export const LIGHT_LABEL: Record<LightZone, string> = {
  salon: 'Салон',
  galley: 'Камбуз',
  cabin: 'Каюта',
  deck: 'Палубы',
  underwater: 'Подводная подсветка',
};

export const THROTTLE = [
  { label: 'Стоп', knots: 0 },
  { label: 'Малый', knots: 6 },
  { label: 'Средний', knots: 14 },
  { label: 'Полный', knots: 24 },
] as const;

export const TRACKS = [
  { title: 'Golden Hour Drift', artist: 'Marea', len: 214, hue: 32 },
  { title: 'Salt & Silk', artist: 'Lune Blanche', len: 187, hue: 200 },
  { title: 'Riviera Nights', artist: 'Costa Club', len: 241, hue: 320 },
  { title: 'Deep Blue Hours', artist: 'Aquarelle', len: 198, hue: 215 },
  { title: 'Linen & Light', artist: 'Sora Vale', len: 176, hue: 45 },
];

export interface MenuItem {
  id: string;
  name: string;
  note: string;
  icon: 'glass' | 'shell' | 'fruit' | 'cup' | 'cocktail' | 'bowl';
  min: number;
}
export const MENU: MenuItem[] = [
  { id: 'champ', name: 'Шампанское', note: 'Brut, охлаждённое', icon: 'glass', min: 3 },
  { id: 'oyst', name: 'Устрицы', note: '6 шт., лимон, шалот', icon: 'shell', min: 8 },
  { id: 'fruit', name: 'Фрукты', note: 'Сезонное плато', icon: 'fruit', min: 6 },
  { id: 'spritz', name: 'Спритц', note: 'Апероль, просекко', icon: 'cocktail', min: 4 },
  { id: 'coffee', name: 'Эспрессо', note: 'Двойной', icon: 'cup', min: 3 },
  { id: 'sorbet', name: 'Сорбет', note: 'Манго и маракуйя', icon: 'bowl', min: 5 },
];

export interface Order {
  items: Record<string, number>;
  dest: Zone;
  stage: OrderStage;
  /** 0..1 в пределах стадии */
  t: number;
  /** секунд стадии «готовим» */
  prep: number;
}

export interface YachtState {
  tab: Tab;
  /** Зона, к которой подлетает камера (null — вся яхта) */
  focus: Zone | null;

  throttle: number;
  speed: number;
  heading: number;
  targetHeading: number;
  /** −1..1 — насколько активно поворачиваем (для крена и следа) */
  turn: number;

  control: Control;
  weather: 'calm' | 'storm';
  /** Сколько секунд осталось до автоматической передачи капитану (шторм) */
  stormAlert: number | null;

  music: { playing: boolean; track: number; pos: number; volume: number; zones: Zone[] };
  lights: { scene: LightScene; zones: Record<LightZone, boolean>; level: number };
  spa: { on: boolean; bubbles: boolean; temp: number; target: number };

  cart: Record<string, number>;
  dest: Zone;
  picking: boolean;
  order: Order | null;

  toast: { id: number; text: string } | null;
}

const SCENE_ZONES: Record<LightScene, Record<LightZone, boolean>> = {
  day: { salon: false, galley: false, cabin: false, deck: false, underwater: false },
  sunset: { salon: true, galley: false, cabin: true, deck: true, underwater: false },
  party: { salon: true, galley: true, cabin: false, deck: true, underwater: true },
  night: { salon: true, galley: false, cabin: true, deck: true, underwater: true },
};

const initial: YachtState = {
  tab: 'helm',
  focus: null,
  throttle: 1,
  speed: 6,
  heading: 245,
  targetHeading: 245,
  turn: 0,
  control: 'owner',
  weather: 'calm',
  stormAlert: null,
  music: { playing: false, track: 0, pos: 0, volume: 0.6, zones: ['salon', 'aft'] },
  lights: { scene: 'day', zones: { ...SCENE_ZONES.day }, level: 0.8 },
  spa: { on: true, bubbles: false, temp: 33, target: 36 },
  cart: {},
  dest: 'aft',
  picking: false,
  order: null,
  toast: null,
};

/* ============ Хранилище ============ */

let state: YachtState = initial;
const listeners = new Set<() => void>();
let toastSeq = 0;

function set(patch: Partial<YachtState> | ((s: YachtState) => Partial<YachtState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

export const yacht = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useYacht() {
  return useSyncExternalStore(yacht.subscribe, yacht.get);
}

/** UI тёмный ночью, на вечеринке и в шторм */
export function isDark(s: YachtState) {
  return s.weather === 'storm' || s.lights.scene === 'night' || s.lights.scene === 'party';
}

function toast(text: string) {
  return { toast: { id: ++toastSeq, text } };
}

const wrap = (a: number) => ((a % 360) + 360) % 360;
const diff = (a: number, b: number) => ((b - a + 540) % 360) - 180;

export function buzz(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* нет вибро — не страшно */
  }
}

/* ============ Действия ============ */

export const act = {
  tab(tab: Tab) {
    const focus: Record<Tab, Zone | null> = { helm: null, music: null, lights: null, spa: 'bow', service: null };
    set({ tab, focus: focus[tab], picking: false });
  },
  focus(focus: Zone | null) {
    set({ focus });
  },

  throttle(n: number) {
    if (state.control !== 'owner') return;
    const t = Math.max(0, Math.min(3, n));
    if (t === state.throttle) return;
    buzz(12);
    set({ throttle: t });
  },
  steer(deg: number) {
    if (state.control !== 'owner') return;
    set({ targetHeading: wrap(deg) });
  },
  route(kind: 'sunset' | 'bay' | 'drift') {
    if (state.control !== 'owner') return;
    buzz(12);
    if (kind === 'sunset') set({ targetHeading: 270, throttle: 2, ...toast('Курс на закат — 270°') });
    if (kind === 'bay') set({ targetHeading: 40, throttle: 1, ...toast('Идём в бухту, малым ходом') });
    if (kind === 'drift') set({ throttle: 0, ...toast('Глушим двигатели. Дрейф') });
  },

  holdToCaptain() {
    buzz(30);
    set((s) => ({
      control: 'captain',
      stormAlert: null,
      focus: 'bridge',
      throttle: s.weather === 'storm' ? 1 : s.throttle,
      ...toast(s.weather === 'storm' ? 'Капитан ведёт яхту сквозь шторм' : 'Управление у капитана'),
    }));
    setTimeout(() => {
      if (state.focus === 'bridge') set({ focus: null });
    }, 2600);
  },
  requestControl() {
    if (state.control !== 'captain') return;
    if (state.weather === 'storm') {
      set(toast('Капитан вернёт управление, когда шторм утихнет'));
      return;
    }
    set({ control: 'requesting', ...toast('Запрос капитану отправлен') });
    setTimeout(() => {
      if (state.control === 'requesting') {
        buzz(20);
        set({ control: 'owner', ...toast('Капитан передал вам штурвал') });
      }
    }, 2600);
  },

  storm(on: boolean) {
    if (on) {
      buzz(60);
      set((s) => ({ weather: 'storm', stormAlert: s.control === 'owner' ? 10 : null, focus: null }));
    } else {
      set({ weather: 'calm', stormAlert: null, ...toast('Шторм позади. Море спокойное') });
    }
  },
  stayAtHelm() {
    set({ stormAlert: null, ...toast('Будьте осторожны — капитан на связи') });
  },

  music(patch: Partial<YachtState['music']>) {
    set((s) => ({ music: { ...s.music, ...patch } }));
  },
  playToggle() {
    buzz();
    set((s) => ({ music: { ...s.music, playing: !s.music.playing } }));
  },
  skip(dir: 1 | -1) {
    buzz();
    set((s) => ({ music: { ...s.music, track: (s.music.track + dir + TRACKS.length) % TRACKS.length, pos: 0, playing: true } }));
  },
  musicZone(z: Zone) {
    set((s) => {
      const has = s.music.zones.includes(z);
      const zones = has ? s.music.zones.filter((x) => x !== z) : [...s.music.zones, z];
      return { music: { ...s.music, zones } };
    });
  },

  lightScene(scene: LightScene) {
    buzz();
    set((s) => ({ lights: { ...s.lights, scene, zones: { ...SCENE_ZONES[scene] } } }));
  },
  lightZone(z: LightZone) {
    set((s) => ({ lights: { ...s.lights, zones: { ...s.lights.zones, [z]: !s.lights.zones[z] } } }));
  },
  lightLevel(level: number) {
    set((s) => ({ lights: { ...s.lights, level } }));
  },

  spa(patch: Partial<YachtState['spa']>) {
    set((s) => ({ spa: { ...s.spa, ...patch } }));
  },

  cartAdd(id: string, d: 1 | -1) {
    buzz(6);
    set((s) => {
      const n = Math.max(0, (s.cart[id] ?? 0) + d);
      const cart = { ...s.cart };
      if (n) cart[id] = n;
      else delete cart[id];
      return { cart };
    });
  },
  dest(dest: Zone) {
    set({ dest, picking: false });
  },
  picking(picking: boolean) {
    set({ picking });
  },
  placeOrder() {
    const items = state.cart;
    if (!Object.keys(items).length || state.order) return;
    buzz(20);
    const prep = Math.max(...Object.keys(items).map((id) => MENU.find((m) => m.id === id)?.min ?? 4));
    set({
      order: { items, dest: state.dest, stage: 'preparing', t: 0, prep },
      cart: {},
      picking: false,
      ...toast(`Заказ принят — подадим: ${ZONE_LABEL[state.dest].toLowerCase()}`),
    });
  },
  clearOrder() {
    set({ order: null });
  },
};

/* ============ Симуляция ============ */

/** Длина маршрута стюарда — задаётся сценой, чтобы скорость шага была честной */
export const steward = { pathLen: 8 };

let timer: number | null = null;
let paused = false;

/** Только для снятия экранов в Figma: задать состояние напрямую и заморозить симуляцию */
export const dev = {
  patch: (p: Partial<YachtState>) => set(p),
  pause: (v: boolean) => {
    paused = v;
  },
  initial,
};

export function startSim() {
  if (timer != null) return () => {};
  const DT = 0.1;
  timer = window.setInterval(() => {
    if (paused) return;
    const s = state;
    const p: Partial<YachtState> = {};

    // Ход
    const tgt = THROTTLE[s.throttle].knots;
    const acc = tgt > s.speed ? 1.6 : 2.4; // узлов в секунду
    const speed = Math.abs(tgt - s.speed) < 0.05 ? tgt : s.speed + Math.sign(tgt - s.speed) * Math.min(acc * DT, Math.abs(tgt - s.speed));
    if (speed !== s.speed) p.speed = speed;

    const d = diff(s.heading, s.targetHeading);
    const maxRate = 4 + speed * 0.6; // °/с
    const rate = Math.max(-maxRate, Math.min(maxRate, d * 0.9));
    if (Math.abs(d) > 0.05) p.heading = wrap(s.heading + rate * DT);
    const turn = Math.max(-1, Math.min(1, rate / 14));
    if (Math.abs(turn - s.turn) > 0.005) p.turn = turn;

    // Джакузи
    const spaTarget = s.spa.on ? s.spa.target : 28;
    const dt = spaTarget - s.spa.temp;
    if (Math.abs(dt) > 0.01) {
      const r = dt > 0 ? 0.35 : 0.12;
      p.spa = { ...s.spa, temp: s.spa.temp + Math.sign(dt) * Math.min(Math.abs(dt), r * DT) };
    }

    // Музыка
    if (s.music.playing) {
      const len = TRACKS[s.music.track].len;
      const pos = s.music.pos + DT;
      p.music = pos >= len ? { ...s.music, pos: 0, track: (s.music.track + 1) % TRACKS.length } : { ...s.music, pos };
    }

    // Заказ: готовим (ускорено: минута меню = секунда) → стюард несёт → подано
    if (s.order) {
      const o = s.order;
      if (o.stage === 'preparing') {
        const t = o.t + DT / o.prep;
        p.order = t >= 1 ? { ...o, stage: 'walking', t: 0 } : { ...o, t };
      } else if (o.stage === 'walking') {
        const t = o.t + DT / steward.pathLen;
        if (t >= 1) {
          p.order = { ...o, stage: 'served', t: 0 };
          p.toast = { id: ++toastSeq, text: 'Подано. Приятного аппетита' };
          buzz(20);
        } else p.order = { ...o, t };
      } else if (o.stage === 'served' && o.t < 1) {
        p.order = { ...o, t: Math.min(1, o.t + DT / 4) };
      }
    }

    // Шторм: если владелец не ответил — передаём капитану сами
    if (s.stormAlert != null && s.control === 'owner') {
      const left = s.stormAlert - DT;
      if (left <= 0) {
        set(p);
        act.holdToCaptain();
        return;
      }
      p.stormAlert = left;
    }

    if (Object.keys(p).length) set(p);
  }, DT * 1000);
  return () => {
    if (timer != null) window.clearInterval(timer);
    timer = null;
  };
}

export const angleDiff = diff;
export const wrapDeg = wrap;
