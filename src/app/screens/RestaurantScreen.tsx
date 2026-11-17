import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { MenuItem, RestaurantId } from '../../types';
import { byId } from '../../data/restaurants';
import { LogoTile } from '../../components/Logo';
import { Icon } from '../../components/Icon';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { fromPrice } from '../../lib/price';
import { S, money } from '../../i18n';
import { useApp } from '../appState';
import { CartBar, TopBar } from '../ui';
import { MItemSheet } from './MItemSheet';
import { A } from '../strings';

export function RestaurantScreen({ rid }: { rid: RestaurantId }) {
  const r = byId[rid];
  const { t, lang } = usePrefs();
  const { lines } = useCart();
  const { go } = useApp();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [cat, setCat] = useState(r.menu[0].id);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  // Подсветка таба по прокрутке
  const onScroll = () => {
    const root = scrollRef.current;
    if (!root) return;
    let current = r.menu[0].id;
    for (const c of r.menu) {
      const el = root.querySelector<HTMLElement>(`[data-cat="${c.id}"]`);
      if (el && el.offsetTop - root.scrollTop < 140) current = c.id;
    }
    setCat(current);
  };

  const jump = (id: string) => {
    const root = scrollRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-cat="${id}"]`);
    if (root && el) root.scrollTo({ top: el.offsetTop - 64, behavior: 'smooth' });
  };

  const qtyOf = (id: string) => lines.filter((l) => l.restaurantId === rid && l.itemId === id).reduce((s, l) => s + l.qty, 0);
  const vars = { '--brand': r.brand, '--on-brand': r.onBrand, '--ui': r.ui } as CSSProperties;

  return (
    <section className="m-screen" style={vars}>
      <TopBar onBack={() => go({ name: 'home' })} />
      <div className="m-scroll" ref={scrollRef} onScroll={onScroll}>
        <div className="m-rest-hero">
          <LogoTile r={r} size={84} radius={20} />
          <div>
            <h1>{r.name}</h1>
            <p>{t(r.tagline)}</p>
            {r.loyalty && (
              <span className="m-chip m-chip--on-brand">
                <Icon name="star" size={14} /> {t(r.loyalty.name)}
              </span>
            )}
          </div>
        </div>
        <nav className="m-tabs" aria-label={r.name}>
          {r.menu.map((c) => (
            <button key={c.id} type="button" className="m-tab" aria-current={c.id === cat} onClick={() => jump(c.id)}>
              {t(c.title)}
            </button>
          ))}
        </nav>
        {r.menu.map((c) => (
          <section key={c.id} data-cat={c.id} className="m-cat">
            <h2 className="m-section">{t(c.title)}</h2>
            <ul className="m-items">
              {c.items.map((it) => {
                const q = qtyOf(it.id);
                const p = fromPrice(it);
                return (
                  <li key={it.id}>
                    <button type="button" className="m-item" onClick={() => setItem(it)}>
                      <span className="m-item-text">
                        <span className="m-item-name">
                          {t(it.name)}
                          {it.tags?.includes('spicy') && <span aria-label={t(S.tag_spicy)}> 🌶</span>}
                        </span>
                        <span className="m-item-desc">{t(it.desc)}</span>
                        <span className="m-item-price">
                          {p.from ? `${lang === 'ru' ? 'от' : 'from'} ` : ''}
                          {money(p.price)}
                          {it.combo && <span className="m-item-combo">{t(S.combo)}</span>}
                        </span>
                      </span>
                      <span className="m-item-pic" aria-hidden="true">
                        {it.emoji}
                        <span className={`m-item-add${q ? ' has-qty' : ''}`}>{q ? q : <Icon name="plus" size={20} stroke={3} />}</span>
                      </span>
                      {q > 0 && <span className="sr-only">, {q} {t(S.inCart)}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <div className="m-bottom-space" />
      </div>
      {toast && (
        <div className="m-toast" role="status">
          <Icon name="check" size={18} stroke={3} /> {t(A.added)}: {toast}
        </div>
      )}
      <CartBar />
      {item && (
        <MItemSheet
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
