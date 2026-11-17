import type { CSSProperties } from 'react';
import { KioskFrame } from '../../components/KioskFrame';
import { LogoTile } from '../../components/Logo';
import { Icon } from '../../components/Icon';
import { advanceOrder, ordersStore, statusOf, useNow, useOrders } from '../../state/orders';
import { restaurants } from '../../data/restaurants';
import { nextCode, splitCode } from '../../lib/codes';
import { usePrefs } from '../../state/prefs';
import { S } from '../../i18n';
import { TABLE_COUNT } from '../../data/floor';
import type { Order, RestaurantId } from '../../types';

const seedDemo = () => {
  const now = Date.now();
  const out: Order[] = [];
  for (let i = 0; i < 16; i++) {
    const r = restaurants[Math.floor(Math.random() * restaurants.length)];
    const table = Math.random() < 0.3;
    const readyAt = now + (Math.random() * 70_000 - 25_000);
    out.push({
      id: `demo-${now}-${i}`,
      restaurantId: r.id as RestaurantId,
      code: nextCode(r.id),
      mode: table ? 'table' : 'pickup',
      table: table ? 1 + Math.floor(Math.random() * TABLE_COUNT) : undefined,
      itemsCount: 1 + Math.floor(Math.random() * 4),
      total: 300 + Math.floor(Math.random() * 900),
      createdAt: now,
      readyAt,
      doneAt: readyAt + (table ? 40_000 : 90_000),
    });
  }
  ordersStore.add(out);
};

/** ТВ-табло выдачи: по плитке на ресторан, код читается вместе с логотипом */
export function PickupBoard() {
  const { t, lang, setLang } = usePrefs();
  const orders = useOrders();
  const now = useNow(1000);
  const clock = new Date(now).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <KioskFrame w={1920} h={1080}>
      <div className="board">
        <header className="board-head">
          <h1>{t(S.board)}</h1>
          <p className="board-hint">
            <Icon name="star" size={28} /> {t(S.boardHint)}
          </p>
          <span className="board-clock">{clock}</span>
        </header>
        <div className="board-grid">
          {restaurants.map((r) => {
            const mine = orders.filter((o) => o.restaurantId === r.id).sort((a, b) => a.readyAt - b.readyAt);
            const ready = mine.filter((o) => statusOf(o, now) === 'ready');
            const cooking = mine.filter((o) => statusOf(o, now) === 'cooking');
            const delivering = mine.filter((o) => statusOf(o, now) === 'delivering');
            return (
              <section key={r.id} className="board-tile" style={{ '--brand': r.brand, '--on-brand': r.onBrand, '--ui': r.ui } as CSSProperties} aria-label={r.name}>
                <header className="board-tile-head brand-surface">
                  <LogoTile r={r} size={72} radius={16} />
                  <h2>{r.name}</h2>
                </header>
                <div className="board-tile-body">
                  <div className="board-col board-col--ready">
                    <h3>
                      <Icon name="check" size={24} stroke={3} /> {t(S.boardReady)}
                    </h3>
                    <ul>
                      {ready.slice(0, 4).map((o) => (
                        <li key={o.id}>
                          <button type="button" className="board-code is-ready" onClick={() => advanceOrder(o)} title="demo: выдать">
                            <span className="code-prefix">{splitCode(o.code).prefix}</span>
                            {splitCode(o.code).num}
                          </button>
                        </li>
                      ))}
                      {!ready.length && <li className="board-empty">—</li>}
                    </ul>
                  </div>
                  <div className="board-col">
                    <h3>
                      <Icon name="clock" size={24} /> {t(S.boardCooking)}
                    </h3>
                    <ul className="board-small">
                      {cooking.slice(0, 6).map((o) => (
                        <li key={o.id}>
                          <button type="button" className="board-code" onClick={() => advanceOrder(o)} title="demo: готово">
                            {splitCode(o.code).num}
                            {o.mode === 'table' && <Icon name="table" size={18} />}
                          </button>
                        </li>
                      ))}
                      {!cooking.length && <li className="board-empty">—</li>}
                    </ul>
                    {delivering.length > 0 && (
                      <>
                        <h3>
                          <Icon name="table" size={24} /> {t(S.boardTable)}
                        </h3>
                        <ul className="board-small">
                          {delivering.slice(0, 3).map((o) => (
                            <li key={o.id}>
                              <button type="button" className="board-code is-table" onClick={() => advanceOrder(o)}>
                                {splitCode(o.code).num} → {o.table}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        <footer className="board-foot">
          <span>{lang === 'ru' ? 'Демо: клик по коду переключает статус' : 'Demo: click a code to advance it'}</span>
          <button type="button" onClick={seedDemo}>
            {t(S.demoOrders)}
          </button>
          <button type="button" onClick={() => ordersStore.clear()}>
            {t(S.clear)}
          </button>
          <button type="button" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}>
            {t(S.langSwitch)}
          </button>
          <a href="#/kiosk">{lang === 'ru' ? '← Терминал' : '← Kiosk'}</a>
        </footer>
      </div>
    </KioskFrame>
  );
}
