import { useEffect, useRef, useState } from 'react';
import { useSession } from '../state/session';
import { useCart } from '../state/cart';
import { usePrefs } from '../state/prefs';
import { S } from '../i18n';
import { Icon } from './Icon';

const IDLE_MS = 60_000;
const COUNTDOWN = 15;

/** Если терминал бросили посреди заказа — спрашиваем и сбрасываем, чтобы следующий гость начинал с чистого листа */
export function IdleGuard() {
  const { screen, reset } = useSession();
  const { count } = useCart();
  const { t } = usePrefs();
  const last = useRef(Date.now());
  const [left, setLeft] = useState<number | null>(null);

  const pristine = screen.name === 'map' && count === 0;
  const disabled = screen.name === 'codes';

  useEffect(() => {
    const bump = () => {
      last.current = Date.now();
    };
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    evs.forEach((e) => document.addEventListener(e, bump, { passive: true }));
    return () => evs.forEach((e) => document.removeEventListener(e, bump));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      // dev: режим съёмки экранов для Figma
      if (disabled || (window as unknown as { __figNoIdle?: boolean }).__figNoIdle) return;
      const idle = Date.now() - last.current;
      if (pristine) {
        if (idle > IDLE_MS * 1.5) {
          last.current = Date.now();
          reset();
        }
        return;
      }
      if (idle > IDLE_MS) setLeft((v) => (v === null ? COUNTDOWN : v));
    }, 1000);
    return () => clearInterval(id);
  }, [pristine, disabled, reset]);

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) {
      setLeft(null);
      last.current = Date.now();
      reset();
      return;
    }
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left, reset]);

  if (left === null) return null;
  return (
    <div className="sheet-layer">
      <div className="sheet-backdrop" />
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="idle-t" aria-describedby="idle-d">
        <span className="modal-ico">
          <Icon name="clock" size={72} />
        </span>
        <h2 id="idle-t">{t(S.stillHere)}</h2>
        <p id="idle-d" aria-live="assertive">
          {t(S.stillHereLead)} <strong>{left} {t(S.sec)}</strong>
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost btn-xl" onClick={() => { setLeft(null); reset(); }}>
            {t(S.startOver)}
          </button>
          <button type="button" className="btn btn-primary btn-xl" autoFocus onClick={() => { setLeft(null); last.current = Date.now(); }}>
            {t(S.imHere)}
          </button>
        </div>
      </div>
    </div>
  );
}
