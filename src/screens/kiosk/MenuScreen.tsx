import { useEffect, useState, type CSSProperties } from 'react';
import type { MenuItem, RestaurantId } from '../../types';
import { byId } from '../../data/restaurants';
import { LogoTile } from '../../components/Logo';
import { Icon } from '../../components/Icon';
import { BottomBar, CartButton } from '../../components/BottomBar';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { useSession } from '../../state/session';
import { S, money } from '../../i18n';
import { ItemSheet } from './ItemSheet';
import { fromPrice } from '../../lib/price';

export function MenuScreen({ rid }: { rid: RestaurantId }) {
  const r = byId[rid];
  const { t, lang } = usePrefs();
  const { lines, count } = useCart();
  const { go } = useSession();
  const [cat, setCat] = useState(r.menu[0].id);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const category = r.menu.find((c) => c.id === cat) ?? r.menu[0];
  const qtyOf = (id: string) => lines.filter((l) => l.restaurantId === rid && l.itemId === id).reduce((s, l) => s + l.qty, 0);
  const vars = { '--brand': r.brand, '--on-brand': r.onBrand, '--ui': r.ui } as CSSProperties;

  return (
    <section className="screen screen--menu" style={vars}>
      <header className="menu-head brand-surface">
        <button type="button" className="back-btn back-btn--on-brand" onClick={() => go({ name: 'map' })}>
          <Icon name="back" size={36} />
          <span>{t(S.toRestaurants)}</span>
        </button>
        <div className="menu-head-main">
          <LogoTile r={r} size={156} radius={32} />
          <div className="menu-head-text">
            <h1 data-screen-title tabIndex={-1}>
              {r.name}
            </h1>
            <p>{t(r.tagline)}</p>
            {r.loyalty && (
              <span className="chip chip--on-brand">
                <Icon name="star" size={26} />
                {t(r.loyalty.name)}
              </span>
            )}
          </div>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label={r.name}>
        {r.menu.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={c.id === cat} className="tab" onClick={() => setCat(c.id)}>
            {t(c.title)}
          </button>
        ))}
      </nav>

      <div className="screen-body" role="tabpanel" aria-label={t(category.title)}>
        <div className="item-grid">
          {category.items.map((it) => {
            const q = qtyOf(it.id);
            return (
              <button key={it.id} type="button" className="item-card" onClick={() => setItem(it)}>
                <span className="item-pic" aria-hidden="true">
                  <span className="item-emoji">{it.emoji}</span>
                  {it.tags?.length ? (
                    <span className="item-tags">
                      {it.tags.map((tg) => (
                        <span key={tg} className={`tag tag--${tg}`}>
                          {t(S[`tag_${tg}`])}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  {q > 0 && (
                    <span className="item-qty">
                      <Icon name="check" size={24} stroke={3.2} /> {q}
                    </span>
                  )}
                </span>
                <span className="item-name">{t(it.name)}</span>
                <span className="item-desc">{t(it.desc)}</span>
                <span className="item-foot">
                  <span className="item-price">
                    {(() => {
                      const p = fromPrice(it);
                      return p.from ? `${lang === 'ru' ? 'от' : 'from'} ${money(p.price)}` : money(p.price);
                    })()}
                  </span>
                  {it.combo && <span className="item-combo">{t(S.combo)}</span>}
                  <span className="item-add" aria-hidden="true">
                    <Icon name="plus" size={36} stroke={3} />
                  </span>
                </span>
                {q > 0 && <span className="sr-only">, {q} {t(S.inCart)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={32} stroke={3} /> {toast}
        </div>
      )}

      <BottomBar>{count > 0 ? <CartButton /> : <p className="map-hint"><span>{t(S.oneCartHint)}</span></p>}</BottomBar>

      {item && (
        <ItemSheet
          r={r}
          item={item}
          onClose={() => setItem(null)}
          onAdded={(name) => {
            setItem(null);
            setToast(name);
          }}
        />
      )}
    </section>
  );
}
