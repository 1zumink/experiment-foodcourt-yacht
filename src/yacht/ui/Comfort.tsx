import { useRef } from 'react';
import {
  act,
  LIGHT_LABEL,
  MENU,
  MUSIC_ZONES,
  SERVE_ZONES,
  TRACKS,
  ZONE_LABEL,
  useYacht,
  type LightScene,
  type LightZone,
} from '../state';
import { YIcon } from './icons';
import { arcPath } from './arc';

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/* ============ Музыка ============ */
export function MusicPanel() {
  const s = useYacht();
  const tr = TRACKS[s.music.track];
  return (
    <div className="y-panel">
      <div className="y-now">
        <div
          className={`y-cover${s.music.playing ? ' is-playing' : ''}`}
          style={{ ['--h' as string]: tr.hue }}
          aria-hidden="true"
        >
          <span />
        </div>
        <div className="y-now-meta">
          <p className="y-eyebrow">{s.music.playing ? 'Играет' : 'Пауза'}</p>
          <p className="y-track">{tr.title}</p>
          <p className="y-artist">{tr.artist}</p>
          <div className="y-progress">
            <i style={{ width: `${(s.music.pos / tr.len) * 100}%` }} />
          </div>
          <div className="y-progress-t">
            <span>{fmt(s.music.pos)}</span>
            <span>{fmt(tr.len)}</span>
          </div>
        </div>
      </div>
      <div className="y-transport">
        <button type="button" aria-label="Предыдущий" onClick={() => act.skip(-1)}>
          <YIcon name="prev" size={22} />
        </button>
        <button type="button" className="y-play" aria-label={s.music.playing ? 'Пауза' : 'Играть'} onClick={act.playToggle}>
          <YIcon name={s.music.playing ? 'pause' : 'play'} size={26} />
        </button>
        <button type="button" aria-label="Следующий" onClick={() => act.skip(1)}>
          <YIcon name="next" size={22} />
        </button>
      </div>
      <Range label="Громкость" value={s.music.volume} onChange={(volume) => act.music({ volume })} />
      <p className="y-label">Где играет</p>
      <div className="y-chips">
        {MUSIC_ZONES.map((z) => (
          <button key={z} type="button" className={s.music.zones.includes(z) ? 'is-on' : ''} aria-pressed={s.music.zones.includes(z)} onClick={() => act.musicZone(z)}>
            {ZONE_LABEL[z]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Range({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="y-range">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        style={{ ['--v' as string]: `${value * 100}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/* ============ Свет ============ */
const SCENES: { id: LightScene; name: string; note: string }[] = [
  { id: 'day', name: 'День', note: 'Солнце и море' },
  { id: 'sunset', name: 'Закат', note: 'Тёплый свет' },
  { id: 'party', name: 'Вечеринка', note: 'Цвет и ритм' },
  { id: 'night', name: 'Ночь', note: 'Тихо и мягко' },
];

export function LightsPanel() {
  const s = useYacht();
  return (
    <div className="y-panel">
      <p className="y-eyebrow">Сцена</p>
      <div className="y-scenes">
        {SCENES.map((sc) => (
          <button key={sc.id} type="button" className={`y-scene y-scene--${sc.id}${s.lights.scene === sc.id ? ' is-on' : ''}`} aria-pressed={s.lights.scene === sc.id} onClick={() => act.lightScene(sc.id)}>
            <b>{sc.name}</b>
            <span>{sc.note}</span>
          </button>
        ))}
      </div>
      <Range label="Яркость" value={s.lights.level} onChange={(v) => act.lightLevel(v)} />
      <ul className="y-toggles">
        {(Object.keys(LIGHT_LABEL) as LightZone[]).map((z) => (
          <li key={z}>
            <span>{LIGHT_LABEL[z]}</span>
            <Switch on={s.lights.zones[z]} label={LIGHT_LABEL[z]} onChange={() => act.lightZone(z)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`y-switch${on ? ' is-on' : ''}`} onClick={onChange}>
      <i />
    </button>
  );
}

/* ============ Джакузи ============ */
const T_MIN = 30;
const T_MAX = 40;
const ARC = 270;

export function SpaPanel() {
  const s = useYacht();
  const ref = useRef<HTMLDivElement>(null);
  const k = (s.spa.target - T_MIN) / (T_MAX - T_MIN);
  const kNow = Math.max(0, Math.min(1, (s.spa.temp - T_MIN) / (T_MAX - T_MIN)));
  const setFrom = (x: number, y: number) => {
    const r = ref.current!.getBoundingClientRect();
    let a = (Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * 180) / Math.PI;
    a = (a + 360 + 225) % 360; // 0 = начало дуги (внизу слева)
    if (a > ARC) a = a > ARC + 45 ? 0 : ARC;
    const t = Math.round((T_MIN + (a / ARC) * (T_MAX - T_MIN)) * 2) / 2;
    if (t !== s.spa.target) act.spa({ target: t, on: true });
  };
  const R = 74;
  const diff = s.spa.target - s.spa.temp;
  const eta = s.spa.on && diff > 0.2 ? Math.max(1, Math.round(diff * 3)) : 0;
  const knob = ((-225 + k * ARC) * Math.PI) / 180;

  return (
    <div className="y-panel y-spa">
      <div
        ref={ref}
        className={`y-dial${s.spa.on ? '' : ' is-off'}`}
        role="slider"
        aria-label="Температура джакузи"
        aria-valuemin={T_MIN}
        aria-valuemax={T_MAX}
        aria-valuenow={s.spa.target}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') act.spa({ target: Math.min(T_MAX, s.spa.target + 0.5) });
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') act.spa({ target: Math.max(T_MIN, s.spa.target - 0.5) });
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFrom(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => e.buttons && setFrom(e.clientX, e.clientY)}
      >
        <svg viewBox="0 0 180 180">
          <path d={arcPath(90, 90, R, 135, ARC)} className="y-dial-track" />
          {kNow > 0.005 && <path d={arcPath(90, 90, R, 135, ARC * kNow)} className="y-dial-now" />}
          {k > 0.005 && <path d={arcPath(90, 90, R, 135, ARC * k)} className="y-dial-set" />}
          <circle cx={90 + Math.cos(knob) * R} cy={90 + Math.sin(knob) * R} r="9" className="y-dial-knob" />
        </svg>
        <div className="y-dial-center">
          <b>{`${s.spa.temp.toFixed(1)}°`}</b>
          <span>{s.spa.on ? (eta ? `до ${s.spa.target}° · ${eta} мин` : 'готово') : 'выключено'}</span>
        </div>
      </div>
      <ul className="y-toggles">
        <li>
          <span>Подогрев</span>
          <Switch on={s.spa.on} label="Подогрев" onChange={() => act.spa({ on: !s.spa.on })} />
        </li>
        <li>
          <span>Пузыри</span>
          <Switch on={s.spa.bubbles} label="Пузыри" onChange={() => act.spa({ bubbles: !s.spa.bubbles })} />
        </li>
      </ul>
    </div>
  );
}

/* ============ Сервис ============ */
export function ServicePanel() {
  const s = useYacht();
  const o = s.order;
  if (o) {
    const steps = ['Готовим', 'Несём', 'Подано'];
    const idx = o.stage === 'preparing' ? 0 : o.stage === 'walking' ? 1 : 2;
    const prog = (idx + (o.stage === 'served' ? 0 : o.t)) / 2;
    const items = Object.entries(o.items).map(([id, n]) => `${MENU.find((m) => m.id === id)?.name}${n > 1 ? ` ×${n}` : ''}`);
    return (
      <div className="y-panel y-order">
        <p className="y-eyebrow">{`Заказ · ${ZONE_LABEL[o.dest].toLowerCase()}`}</p>
        <p className="y-order-title">{idx === 2 ? 'Приятного аппетита' : idx === 1 ? 'Стюард уже идёт к вам' : 'Шеф готовит'}</p>
        <p className="y-muted">{items.join(', ')}</p>
        <div className="y-steps">
          <div className="y-steps-line">
            <i style={{ width: `${Math.min(1, prog) * 100}%` }} />
          </div>
          {steps.map((st, i) => (
            <span key={st} className={i <= idx ? 'is-done' : ''}>
              <em>{i < idx || idx === 2 ? <YIcon name="check" size={14} stroke={2.4} /> : null}</em>
              {st}
            </span>
          ))}
        </div>
        {idx === 2 && (
          <button type="button" className="y-btn" onClick={act.clearOrder}>
            Заказать ещё
          </button>
        )}
      </div>
    );
  }
  const count = Object.values(s.cart).reduce((a, b) => a + b, 0);
  const eta = count ? Math.max(...Object.keys(s.cart).map((id) => MENU.find((m) => m.id === id)!.min)) + 2 : 0;
  return (
    <div className="y-panel">
      <div className="y-menu">
        {MENU.map((m) => {
          const n = s.cart[m.id] ?? 0;
          return (
            <div key={m.id} className={`y-dish${n ? ' is-on' : ''}`}>
              <button type="button" className="y-dish-main" onClick={() => act.cartAdd(m.id, 1)} aria-label={`Добавить: ${m.name}`}>
                <YIcon name={m.icon} size={26} stroke={1.3} />
                <b>{m.name}</b>
                <span>{m.note}</span>
              </button>
              {n > 0 && (
                <div className="y-dish-qty">
                  <button type="button" aria-label={`Убрать: ${m.name}`} onClick={() => act.cartAdd(m.id, -1)}>
                    <YIcon name="minus" size={14} stroke={2} />
                  </button>
                  <span>{n}</span>
                  <button type="button" aria-label={`Ещё: ${m.name}`} onClick={() => act.cartAdd(m.id, 1)}>
                    <YIcon name="plus" size={14} stroke={2} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="y-label">Куда подать</p>
      <div className="y-chips">
        {SERVE_ZONES.map((z) => (
          <button key={z} type="button" className={s.dest === z ? 'is-on' : ''} aria-pressed={s.dest === z} onClick={() => act.dest(z)}>
            {ZONE_LABEL[z]}
          </button>
        ))}
        <button type="button" className={`y-chip-pin${s.picking ? ' is-on' : ''}`} onClick={() => act.picking(!s.picking)}>
          <YIcon name="pin" size={15} /> {s.picking ? 'Коснитесь яхты' : 'На яхте'}
        </button>
      </div>
      <button type="button" className="y-btn y-btn--wide" disabled={!count} onClick={act.placeOrder}>
        {count ? `Подать · ${count} поз. · ~${eta} мин` : 'Выберите, что подать'}
      </button>
    </div>
  );
}
