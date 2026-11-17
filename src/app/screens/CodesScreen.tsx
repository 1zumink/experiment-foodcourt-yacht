import type { CSSProperties } from 'react';
import { FloorMap } from '../../components/FloorMap';
import { FakeQr } from '../../components/FakeQr';
import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { usePrefs } from '../../state/prefs';
import { statusOf, useNow, useOrders } from '../../state/orders';
import { byId } from '../../data/restaurants';
import { splitCode } from '../../lib/codes';
import { money, plural } from '../../i18n';
import type { Order, OrderStatus } from '../../types';
import { useApp } from '../appState';
import { TopBar } from '../ui';
import { B } from '../strings';

const label = (st: OrderStatus, o: Order) =>
  st === 'cooking' ? (o.mode === 'table' ? B.st_cooking_table : B.st_cooking) : st === 'delivering' ? B.st_delivering : st === 'ready' ? B.st_ready : o.mode === 'table' ? B.st_done_table : B.st_done;

/** «Спасибо! Ваши коды заказа» — как в терминале, но на телефоне */
export function CodesScreen({ orderIds }: { orderIds: string[] }) {
  const { t, lang } = usePrefs();
  const { go, table } = useApp();
  const all = useOrders();
  const now = useNow(1000);
  const orders = orderIds.map((id) => all.find((o) => o.id === id)).filter((o): o is Order => !!o);
  const mode = orders[0]?.mode ?? 'table';

  return (
    <section className="m-screen">
      <TopBar onBack={() => go({ name: 'home' })} />
      <div className="m-scroll m-pad">
        <div className="m-codes-hero">
          <span className="m-paid-ico m-paid-ico--sm" aria-hidden="true">
            <Icon name="check" size={30} stroke={3.2} />
          </span>
          <h1>{t(B.thanks)}</h1>
          <p className="m-muted">{mode === 'table' ? `${t(B.soonTable)} №${table}` : t(B.pickupLead)}</p>
        </div>

        <ul className="m-codes">
          {orders.map((o) => {
            const r = byId[o.restaurantId];
            const st = statusOf(o, now);
            const { prefix, num } = splitCode(o.code);
            return (
              <li key={o.id} className={`m-code is-${st}`} style={{ '--brand': r.brand, '--ui': r.ui } as CSSProperties}>
                <LogoTile r={r} size={64} radius={16} />
                <span className="m-code-main">
                  <span className="m-code-rest">{r.name}</span>
                  <span className="m-code-value" aria-label={`${r.name}: ${o.code}`}>
                    <span className="m-code-prefix">{prefix}</span>
                    <span className="m-code-num">{num}</span>
                  </span>
                  <span className="m-muted m-small">
                    {o.itemsCount} {plural(o.itemsCount, lang, ['позиция', 'позиции', 'позиций'], ['item', 'items'])} · {money(o.total)}
                  </span>
                </span>
                <span className={`m-status m-status--${st}`} aria-live="polite">
                  <Icon name={st === 'cooking' ? 'clock' : st === 'delivering' ? 'table' : 'check'} size={14} stroke={2.6} />
                  {t(label(st, o))}
                </span>
              </li>
            );
          })}
        </ul>

        {mode === 'pickup' && (
          <div className="m-codes-map">
            <h2 className="m-section">
              <Icon name="pin" size={18} /> {t(B.whereCollect)}
            </h2>
            <div className="m-codes-map-box">
              <FloorMap mode="locate" scale={326 / 1080} highlight={orders.map((o) => o.restaurantId)} myTable={table} />
            </div>
          </div>
        )}

        <div className="m-codes-qr">
          <FakeQr seed={orderIds.join(',')} size={120} />
          <span className="m-muted m-small">{lang === 'ru' ? 'Покажите на кассе, если спросят' : 'Show at the counter if asked'}</span>
        </div>
        <div className="m-bottom-space" />
      </div>
      <div className="m-cartbar-wrap m-two-btns">
        <button type="button" className="m-btn m-btn--ghost" onClick={() => go({ name: 'home' })}>
          {t(B.orderMore)}
        </button>
        <button type="button" className="m-btn m-btn--primary grow" onClick={() => go({ name: 'track' })}>
          {t(B.track)}
          <Icon name="next" size={20} />
        </button>
      </div>
    </section>
  );
}
