import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { describeLine, groupCart } from '../../lib/price';
import { findItem } from '../../data/restaurants';
import { money } from '../../i18n';
import { useApp } from '../appState';
import { MainBar, MStepper, TopBar } from '../ui';
import { A, B } from '../strings';

export function CartScreen() {
  const { t, lang } = usePrefs();
  const cart = useCart();
  const { go } = useApp();
  const groups = groupCart(cart.lines);

  if (!groups.length) {
    return (
      <section className="m-screen">
        <TopBar onBack={() => go({ name: 'home' })} title={t(A.yourOrder)} />
        <div className="m-empty">
          <Icon name="cart" size={64} stroke={1.5} />
          <p>{t(A.empty)}</p>
          <button type="button" className="m-btn m-btn--primary" onClick={() => go({ name: 'home' })}>
            {t(A.toMenu)}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="m-screen">
      <TopBar onBack={() => go({ name: 'home' })} title={t(A.yourOrder)} />
      <div className="m-scroll m-pad">
        {groups.length > 1 && <p className="m-muted m-small m-lead">{lang === 'ru' ? 'Каждый ресторан готовит свою часть и выдаёт её под своим кодом' : 'Each restaurant prepares its part under its own code'}</p>}
        {groups.map((g) => (
          <section key={g.restaurant.id} className="m-cart-group" aria-label={g.restaurant.name}>
            <header>
              <LogoTile r={g.restaurant} size={36} radius={10} />
              <strong>{g.restaurant.name}</strong>
              <span>{money(g.subtotal)}</span>
            </header>
            <ul>
              {g.lines.map((l) => {
                const it = findItem(l.restaurantId, l.itemId);
                const d = describeLine(l, lang);
                return (
                  <li key={l.key} className="m-cart-line">
                    <span className="m-cart-pic" aria-hidden="true">
                      {it.emoji}
                    </span>
                    <span className="m-cart-text">
                      <span className="m-cart-name">{t(it.name)}</span>
                      {d && <span className="m-muted m-small">{d}</span>}
                      <strong>{money(l.unit * l.qty)}</strong>
                    </span>
                    <MStepper value={l.qty} onChange={(n) => cart.setQty(l.key, n)} label={t(it.name)} />
                  </li>
                );
              })}
            </ul>
            <button type="button" className="m-link" onClick={() => go({ name: 'rest', rid: g.restaurant.id })}>
              <Icon name="plus" size={16} /> {t(A.more)}
            </button>
          </section>
        ))}
        <button type="button" className="m-add-more" onClick={() => go({ name: 'home' })}>
          <Icon name="plus" size={20} /> {lang === 'ru' ? 'Добавить из другого ресторана' : 'Add from another restaurant'}
        </button>
        <div className="m-bottom-space" />
      </div>
      <MainBar label={t(B.checkout)} sum={money(cart.total)} onClick={() => go({ name: 'fulfillment' })} />
    </section>
  );
}
