import type { CSSProperties } from 'react';
import { restaurants } from '../../data/restaurants';
import { Logo } from '../../components/Logo';
import { Icon } from '../../components/Icon';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { statusOf, useNow, useOrders } from '../../state/orders';
import { useApp } from '../appState';
import { CartBar, TopBar } from '../ui';
import { A, B } from '../strings';
import { FloorMap } from '../../components/FloorMap';

export function HomeScreen() {
  const { t } = usePrefs();
  const { lines } = useCart();
  const { go, table, myOrders, homeView, setHomeView } = useApp();
  const orders = useOrders();
  const now = useNow(2000);
  const active = orders.filter((o) => myOrders.includes(o.id) && statusOf(o, now) !== 'done');
  const delivering = active.filter((o) => statusOf(o, now) === 'delivering').length;

  return (
    <section className="m-screen">
      <TopBar />
      <div className="m-scroll">
        <div className="m-hero">
          <h1>{t(A.heroTitle)}</h1>
          <p>
            {t(A.heroLead)} <strong>№{table}</strong>
          </p>
        </div>

        {active.length > 0 && (
          <button type="button" className="m-active" onClick={() => go({ name: 'track' })}>
            <span className="m-active-ico">
              <Icon name={delivering ? 'table' : 'clock'} size={24} />
            </span>
            <span className="m-active-text">
              <strong>{t(A.activeOrder)}</strong>
              <span>{delivering ? t(A.st_delivering) : t(A.st_cooking)}</span>
            </span>
            <span className="m-active-go">
              {t(A.activeOrderOpen)} <Icon name="next" size={18} />
            </span>
          </button>
        )}

        <div className="m-section-row">
          <h2 className="m-section">{t(A.restaurants)}</h2>
          <div className="m-seg" role="tablist" aria-label={t(A.restaurants)}>
            {(['list', 'map'] as const).map((v) => (
              <button key={v} type="button" role="tab" aria-selected={homeView === v} className="m-seg-btn" onClick={() => setHomeView(v)}>
                <Icon name={v === 'list' ? 'bag' : 'pin'} size={16} />
                {t(v === 'list' ? B.list : B.map)}
              </button>
            ))}
          </div>
        </div>
        {homeView === 'map' ? (
          <div className="m-home-map">
            <FloorMap mode="select" scale={358 / 1080} myTable={table} onRestaurant={(rid) => go({ name: 'rest', rid })} counts={Object.fromEntries(lines.map((l) => [l.restaurantId, lines.filter((x) => x.restaurantId === l.restaurantId).reduce((s, x) => s + x.qty, 0)]))} />
            <p className="m-muted m-small m-center">
              <span className="m-legend-dot" /> {t(B.yourTable)} — №{table}
            </p>
            <div className="m-bottom-space" />
          </div>
        ) : (
        <div className="m-rest-grid">
          {restaurants.map((r) => {
            const count = lines.filter((l) => l.restaurantId === r.id).reduce((s, l) => s + l.qty, 0);
            const ratio = r.logo.w / r.logo.h;
            const h = ratio > 1 ? 88 / ratio : 88;
            return (
              <button key={r.id} type="button" className="m-rest" style={{ '--brand': r.brand } as CSSProperties} onClick={() => go({ name: 'rest', rid: r.id })}>
                <span className="m-rest-logo">
                  <Logo spec={r.logo} height={h} />
                  {count > 0 && <span className="m-badge">{count}</span>}
                </span>
                <span className="m-rest-body">
                  <span className="m-rest-name">{r.name}</span>
                  <span className="m-rest-tag">{t(r.tagline)}</span>
                  {r.loyalty && (
                    <span className="m-chip">
                      <Icon name="star" size={14} /> {t(r.loyalty.name)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        )}
      </div>
      <CartBar />
    </section>
  );
}
