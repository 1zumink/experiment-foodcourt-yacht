import { useEffect, useState, type CSSProperties } from 'react';
import { BottomBar } from '../../components/BottomBar';
import { FloorMap } from '../../components/FloorMap';
import { FakeQr } from '../../components/FakeQr';
import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { usePrefs } from '../../state/prefs';
import { useSession } from '../../state/session';
import { statusOf, useNow, useOrders } from '../../state/orders';
import { byId } from '../../data/restaurants';
import { splitCode } from '../../lib/codes';
import { S, money, plural } from '../../i18n';

const AUTO_RETURN = 45;

export function CodesScreen({ orderIds }: { orderIds: string[] }) {
  const { t, lang } = usePrefs();
  const { reset } = useSession();
  const all = useOrders();
  const now = useNow(1000);
  const orders = orderIds.map((id) => all.find((o) => o.id === id)).filter((o) => !!o);
  const [left, setLeft] = useState(AUTO_RETURN);

  useEffect(() => {
    const bump = () => setLeft(AUTO_RETURN);
    document.addEventListener('pointerdown', bump);
    return () => document.removeEventListener('pointerdown', bump);
  }, []);
  useEffect(() => {
    if ((window as unknown as { __figNoIdle?: boolean }).__figNoIdle) return; // dev: съёмка экранов
    if (left <= 0) {
      reset();
      return;
    }
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left, reset]);

  const mode = orders[0]?.mode ?? 'pickup';
  const table = orders[0]?.table ?? null;

  return (
    <section className="screen screen--codes">
      <header className="plain-head codes-head">
        <span className="paid-ico paid-ico--sm" aria-hidden="true">
          <Icon name="check" size={56} stroke={3.2} />
        </span>
        <h1 data-screen-title tabIndex={-1}>
          {t(S.thanks)}
        </h1>
        <p className="lead">{mode === 'table' ? `${t(S.codesLeadTable)} ${table}` : t(S.codesLeadPickup)}</p>
      </header>

      <div className="screen-body">
        <ul className="codes">
          {orders.map((o) => {
            const r = byId[o.restaurantId];
            const st = statusOf(o, now);
            const { prefix, num } = splitCode(o.code);
            return (
              <li key={o.id} className={`code-card is-${st}`} style={{ '--brand': r.brand, '--on-brand': r.onBrand, '--ui': r.ui } as CSSProperties}>
                <span className="code-brand brand-surface">
                  <LogoTile r={r} size={128} radius={26} />
                </span>
                <span className="code-main">
                  <span className="code-rest">{r.name}</span>
                  <span className="code-value" aria-label={`${r.name}: ${o.code}`}>
                    <span className="code-prefix">{prefix}</span>
                    <span className="code-num">{num}</span>
                  </span>
                  <span className="code-meta">
                    {o.itemsCount} {plural(o.itemsCount, lang, ['позиция', 'позиции', 'позиций'], ['item', 'items'])} · {money(o.total)}
                  </span>
                </span>
                <span className={`status status--${st}`} aria-live="polite">
                  <Icon name={st === 'cooking' ? 'clock' : st === 'delivering' ? 'table' : 'check'} size={30} />
                  {t(S[`status_${st}`])}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="codes-extra">
          <div className="codes-map">
            <h2 className="section-title">
              <Icon name="pin" size={32} /> {mode === 'table' ? `${t(S.bringToTable)} ${table}` : t(S.pickupAt)}
            </h2>
            <FloorMap mode="locate" scale={0.4} highlight={mode === 'pickup' ? orders.map((o) => o.restaurantId) : []} selectedTable={mode === 'table' ? table : null} showTerminal />
          </div>
          <div className="codes-qr">
            <FakeQr seed={orderIds.join(',')} size={240} />
            <p>{t(S.trackOnPhone)}</p>
          </div>
        </div>
      </div>

      <BottomBar>
        <span className="auto-return" aria-live="off">
          {t(S.autoReturn)} {left} {t(S.sec)}
        </span>
        <button type="button" className="btn btn-primary btn-xl" onClick={reset}>
          {t(S.done)}
        </button>
      </BottomBar>
    </section>
  );
}
