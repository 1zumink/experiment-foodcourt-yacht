import { useRef } from 'react';
import { act, buzz, THROTTLE, useYacht, wrapDeg, yacht } from '../state';
import { YIcon } from './icons';

const PAD = 16;
const at = (k: number) => `calc(${PAD}px + (100% - ${PAD * 2}px) * ${k})`;

const COMPASS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
export const dirName = (deg: number) => COMPASS[Math.round(wrapDeg(deg) / 45) % 8];

/** Машинный телеграф: рычаг с фиксациями */
function Telegraph() {
  const s = useYacht();
  const track = useRef<HTMLDivElement>(null);
  const pick = (clientY: number) => {
    const r = track.current!.getBoundingClientRect();
    const k = 1 - (clientY - r.top - PAD) / (r.height - PAD * 2);
    act.throttle(Math.round(Math.max(0, Math.min(1, k)) * 3));
  };
  const pos = s.throttle / 3;
  return (
    <div className="y-tele">
      <div
        ref={track}
        className="y-tele-track"
        role="slider"
        aria-label="Ход"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={s.throttle}
        aria-valuetext={THROTTLE[s.throttle].label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') act.throttle(s.throttle + 1);
          if (e.key === 'ArrowDown') act.throttle(s.throttle - 1);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons) pick(e.clientY);
        }}
      >
        <div className="y-tele-fill" style={{ height: at(pos) }} />
        {THROTTLE.map((_, i) => (
          <span key={i} className="y-tele-notch" style={{ bottom: at(i / 3) }} />
        ))}
        <div className="y-tele-knob" style={{ bottom: at(pos) }} />
      </div>
      <div className="y-tele-labels">
        {[...THROTTLE].reverse().map((t, ri) => {
          const i = 3 - ri;
          return (
            <button key={t.label} type="button" className={i === s.throttle ? 'is-on' : ''} onClick={() => act.throttle(i)}>
              <b>{t.label}</b>
              <span>{`${t.knots} уз`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Штурвал: поворачивается пальцем, задаёт курс */
function Wheel() {
  const s = useYacht();
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);
  const acc = useRef(0);
  const angleAt = (x: number, y: number) => {
    const r = ref.current!.getBoundingClientRect();
    return (Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const turning = Math.abs(((s.targetHeading - s.heading + 540) % 360) - 180) > 1;
  return (
    <div className="y-wheel-wrap">
      <div
        ref={ref}
        className="y-wheel"
        role="slider"
        aria-label="Курс"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(s.targetHeading)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') act.steer(s.targetHeading + 5);
          if (e.key === 'ArrowLeft') act.steer(s.targetHeading - 5);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = angleAt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (last.current == null || !e.buttons) return;
          const a = angleAt(e.clientX, e.clientY);
          const d = ((a - last.current + 540) % 360) - 180;
          last.current = a;
          act.steer(yacht.get().targetHeading + d * 0.5);
          acc.current += Math.abs(d);
          if (acc.current > 20) {
            acc.current = 0;
            buzz(4);
          }
        }}
        onPointerUp={() => (last.current = null)}
      >
        <svg className="y-wheel-svg" viewBox="0 0 168 168" aria-hidden="true">
          <g transform={`rotate(${Math.round(s.targetHeading * 2) % 360} 84 84)`}>
            {Array.from({ length: 8 }, (_, i) => (
              <g key={i} transform={`rotate(${i * 45} 84 84)`}>
                <line x1="84" y1="84" x2="84" y2="6" stroke="#b9875a" strokeWidth="4" strokeLinecap="round" />
                <rect x="79" y="-6" width="10" height="14" rx="5" fill="#7d5230" />
              </g>
            ))}
            <circle cx="84" cy="84" r="69.5" fill="none" stroke="#9c6b3e" strokeWidth="9" />
          </g>
        </svg>
        <div className="y-wheel-hub">
          <b>{Math.round(s.targetHeading)}°</b>
          <span>{turning ? `сейчас ${Math.round(s.heading)}°` : dirName(s.heading)}</span>
        </div>
      </div>
      <div className="y-wheel-nudge">
        <button type="button" aria-label="Левее на 10°" onClick={() => act.steer(s.targetHeading - 10)}>
          −10°
        </button>
        <button type="button" aria-label="Правее на 10°" onClick={() => act.steer(s.targetHeading + 10)}>
          +10°
        </button>
      </div>
    </div>
  );
}

export function HelmPanel() {
  const s = useYacht();
  const locked = s.control !== 'owner';
  return (
    <div className="y-panel y-helm">
      <div className="y-panel-head">
        <div>
          <p className="y-eyebrow">Ход</p>
          <p className="y-big">
            {Math.round(s.speed)}
            <small> узлов</small>
          </p>
        </div>
        <div className="y-routes">
          <button type="button" onClick={() => act.route('sunset')} disabled={locked}>
            К закату
          </button>
          <button type="button" onClick={() => act.route('bay')} disabled={locked}>
            В бухту
          </button>
          <button type="button" onClick={() => act.route('drift')} disabled={locked}>
            Дрейф
          </button>
        </div>
      </div>
      <div className={`y-helm-body${locked ? ' is-locked' : ''}`} aria-disabled={locked}>
        <Telegraph />
        <Wheel />
      </div>
      {locked && (
        <div className="y-lock">
          <YIcon name="captain" size={28} />
          <p>
            <b>{s.control === 'requesting' ? 'Капитан передаёт штурвал…' : 'Управляет капитан'}</b>
            <span>{s.weather === 'storm' ? 'Ведёт яхту сквозь шторм. Сервис и комфорт — в вашем распоряжении.' : 'Музыка, свет, джакузи и сервис — по-прежнему ваши.'}</span>
          </p>
          {s.control === 'captain' && (
            <button type="button" className="y-btn" onClick={act.requestControl}>
              Вернуть штурвал
            </button>
          )}
        </div>
      )}
    </div>
  );
}
