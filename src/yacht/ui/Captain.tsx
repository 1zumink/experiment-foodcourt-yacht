import { useEffect, useRef, useState } from 'react';
import { act, useYacht } from '../state';
import { YIcon } from './icons';
import { arcPath } from './arc';

const HOLD = 900;

/** Передача управления капитану — удержанием (чтобы не нажать случайно) */
export function CaptainButton() {
  const s = useYacht();
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  useEffect(() => cancel, []);

  if (s.control !== 'owner') {
    return (
      <button type="button" className="y-cap is-captain" onClick={act.requestControl} disabled={s.control === 'requesting'}>
        <YIcon name="captain" size={20} />
        <span>
          <b>{s.control === 'requesting' ? 'Передаёт…' : 'У руля капитан'}</b>
          <small>{s.control === 'requesting' ? 'ждём подтверждения' : 'нажмите, чтобы вернуть'}</small>
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`y-cap${holding ? ' is-holding' : ''}`}
      style={{ ['--hold' as string]: `${HOLD}ms` }}
      onPointerDown={() => {
        setHolding(true);
        timer.current = window.setTimeout(() => {
          setHolding(false);
          act.holdToCaptain();
        }, HOLD);
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          act.holdToCaptain();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Передать управление капитану (удерживайте)"
    >
      <i className="y-cap-fill" />
      <YIcon name="captain" size={20} />
      <span>
        <b>Капитан</b>
        <small>{holding ? 'держите…' : 'удерживайте'}</small>
      </span>
    </button>
  );
}

/** Шторм: всё лишнее убираем, одна большая кнопка */
export function StormAlert() {
  const s = useYacht();
  if (s.stormAlert == null) return null;
  const left = Math.ceil(s.stormAlert);
  const k = s.stormAlert / 10;
  return (
    <div className="y-storm" role="alertdialog" aria-labelledby="y-storm-t" aria-describedby="y-storm-d">
      <div className="y-storm-card">
        <YIcon name="storm" size={40} stroke={1.4} />
        <h2 id="y-storm-t">Надвигается шторм</h2>
        <p id="y-storm-d">Ветер 34 узла, волна до 3 м. Капитан готов принять управление.</p>
        <button type="button" className="y-storm-go" onClick={act.holdToCaptain} autoFocus>
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="19" className="y-storm-ring-bg" />
            {k > 0.005 && <path d={arcPath(22, 22, 19, -90, 360 * k)} className="y-storm-ring" />}
          </svg>
          <span>
            Передать капитану
            <small>{`автоматически через ${left} с`}</small>
          </span>
        </button>
        <button type="button" className="y-storm-stay" onClick={act.stayAtHelm}>
          Остаться у руля
        </button>
      </div>
    </div>
  );
}

export function Toast() {
  const s = useYacht();
  if (!s.toast) return null;
  return (
    <div key={s.toast.id} className="y-toast" role="status">
      {s.toast.text}
    </div>
  );
}
