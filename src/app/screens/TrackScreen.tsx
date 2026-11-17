import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { usePrefs } from '../../state/prefs';
import { statusOf, useNow, useOrders } from '../../state/orders';
import { byId } from '../../data/restaurants';
import { money } from '../../i18n';
import type { Order, OrderStatus } from '../../types';
import { useApp } from '../appState';
import { TopBar } from '../ui';
import { A, B } from '../strings';

const STEPS = ['accepted', 'cooking', 'delivering', 'done'] as const;
const stepIndex = (st: OrderStatus) => (st === 'cooking' ? 1 : st === 'delivering' || st === 'ready' ? 2 : 3);

function OrderCard({ o, now }: { o: Order | undefined; id: string; now: number }) {
  const { t } = usePrefs();
  if (!o) return null;
  const r = byId[o.restaurantId];
  const st = statusOf(o, now);
  const idx = stepIndex(st);
  const progress =
    st === 'cooking'
      ? Math.min(1, (now - o.createdAt) / (o.readyAt - o.createdAt))
      : st === 'delivering' || st === 'ready'
        ? Math.min(1, (now - o.readyAt) / (o.doneAt - o.readyAt))
        : 1;
  return (
    <li className={`m-track is-${st}`} style={{ '--brand': r.brand, '--ui': r.ui } as CSSProperties}>
      <header>
        <LogoTile r={r} size={44} radius={12} />
        <span className="m-track-head">
          <strong>{r.name}</strong>
          <span className="m-muted m-small">
            {o.itemsCount} · {money(o.total)}
          </span>
        </span>
        <span className="m-track-code" title={t(A.codeHint)}>
          {o.code}
        </span>
      </header>
      <ol className="m-steps" aria-label={t(A[`st_${STEPS[idx]}`])}>
        {STEPS.map((s, i) => (
          <li key={s} className={i < idx ? 'is-done' : i === idx ? 'is-current' : ''} aria-current={i === idx ? 'step' : undefined}>
            <span className="m-step-dot">{i < idx || st === 'done' ? <Icon name="check" size={12} stroke={3.6} /> : null}</span>
            <span className="m-step-label">{o.mode === 'pickup' && i >= 2 ? t(i === 2 ? B.st_ready : B.st_done) : t(A[`st_${s}`])}</span>
          </li>
        ))}
      </ol>
      {st !== 'done' && (
        <div className="m-progress" aria-hidden="true">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </li>
  );
}

export function TrackScreen() {
  const { t } = usePrefs();
  const { go, table, myOrders } = useApp();
  const orders = useOrders();
  const now = useNow(1000);
  const [staff, setStaff] = useState(false);

  useEffect(() => {
    if (!staff) return;
    const id = setTimeout(() => setStaff(false), 3500);
    return () => clearTimeout(id);
  }, [staff]);

  const mine = myOrders.map((id) => orders.find((o) => o.id === id)).filter((o): o is Order => !!o);
  // Последняя «партия» — заказы с одним временем создания
  const lastAt = mine.length ? Math.max(...mine.map((o) => o.createdAt)) : 0;
  const current = mine.filter((o) => o.createdAt === lastAt);
  const earlier = mine.filter((o) => o.createdAt !== lastAt && statusOf(o, now) !== 'done');
  const allDone = current.length > 0 && current.every((o) => statusOf(o, now) === 'done');

  return (
    <section className="m-screen">
      <TopBar onBack={() => go({ name: 'home' })} title={`${t(A.table)} ${table}`} />
      <div className="m-scroll m-pad">
        <div className="m-track-hero">
          <span className={`m-track-ico${allDone ? ' is-done' : ''}`}>
            <Icon name={allDone ? 'check' : 'table'} size={36} stroke={allDone ? 3 : 2} />
          </span>
          <h1>{allDone ? t(A.enjoy) : t(A.trackTitle)}</h1>
          <p className="m-muted">
            {t(A.trackLead)} <strong>№{table}</strong>
          </p>
        </div>

        <ul className="m-track-list" aria-live="polite">
          {current.map((o) => (
            <OrderCard key={o.id} id={o.id} o={o} now={now} />
          ))}
        </ul>

        {earlier.length > 0 && (
          <>
            <h2 className="m-section">{t(A.earlier)}</h2>
            <ul className="m-track-list">
              {earlier.map((o) => (
                <OrderCard key={o.id} id={o.id} o={o} now={now} />
              ))}
            </ul>
          </>
        )}

        <p className="m-muted m-small m-center">{t(A.codeHint)}</p>

        <div className="m-track-actions">
          <button type="button" className="m-btn m-btn--ghost" onClick={() => setStaff(true)}>
            <Icon name="a11y" size={20} /> {t(A.callStaff)}
          </button>
          <button type="button" className="m-btn m-btn--primary" onClick={() => go({ name: 'home' })}>
            <Icon name="plus" size={20} /> {t(A.orderMore)}
          </button>
        </div>
      </div>
      {staff && (
        <div className="m-toast" role="status">
          <Icon name="check" size={18} stroke={3} /> {t(A.staffComing)} {table}
        </div>
      )}
    </section>
  );
}
