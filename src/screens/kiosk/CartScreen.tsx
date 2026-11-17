import { BottomBar } from '../../components/BottomBar';
import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { Stepper } from '../../components/Stepper';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { useSession } from '../../state/session';
import { describeLine, groupCart } from '../../lib/price';
import { findItem } from '../../data/restaurants';
import { S, money, plural } from '../../i18n';

export function CartScreen() {
  const { t, lang } = usePrefs();
  const cart = useCart();
  const { go } = useSession();
  const groups = groupCart(cart.lines);

  return (
    <section className="screen screen--cart">
      <header className="plain-head">
        <button type="button" className="back-btn" onClick={() => go({ name: 'map' })}>
          <Icon name="back" size={36} />
          <span>{t(S.toRestaurants)}</span>
        </button>
        <h1 data-screen-title tabIndex={-1}>
          {t(S.cartTitle)}
        </h1>
        {groups.length > 1 && <p className="lead">{t(S.cartNote)}</p>}
      </header>

      <div className="screen-body">
        {groups.length === 0 ? (
          <div className="empty">
            <span className="empty-ico">
              <Icon name="cart" size={96} stroke={1.6} />
            </span>
            <p>{t(S.emptyCart)}</p>
            <button type="button" className="btn btn-primary btn-xl" onClick={() => go({ name: 'map' })}>
              {t(S.chooseRestaurant)}
            </button>
          </div>
        ) : (
          <div className="cart-groups">
            {groups.map((g) => (
              <section key={g.restaurant.id} className="cart-group" aria-label={g.restaurant.name}>
                <header className="cart-group-head" style={{ ['--brand' as string]: g.restaurant.brand }}>
                  <LogoTile r={g.restaurant} size={88} radius={20} />
                  <div>
                    <h2>{g.restaurant.name}</h2>
                    <span className="muted">
                      {g.count} {plural(g.count, lang, ['позиция', 'позиции', 'позиций'], ['item', 'items'])}
                    </span>
                  </div>
                  <strong className="cart-group-sum">{money(g.subtotal)}</strong>
                </header>
                <ul className="cart-lines">
                  {g.lines.map((l) => {
                    const it = findItem(l.restaurantId, l.itemId);
                    const desc = describeLine(l, lang);
                    return (
                      <li key={l.key} className="cart-line">
                        <span className="cart-line-pic" aria-hidden="true">
                          {it.emoji}
                        </span>
                        <span className="cart-line-text">
                          <span className="cart-line-name">{t(it.name)}</span>
                          {desc && <span className="cart-line-desc">{desc}</span>}
                          <span className="cart-line-price">{money(l.unit * l.qty)}</span>
                        </span>
                        <Stepper value={l.qty} onChange={(n) => cart.setQty(l.key, n)} label={t(it.name)} />
                      </li>
                    );
                  })}
                </ul>
                <button type="button" className="link-btn" onClick={() => go({ name: 'menu', rid: g.restaurant.id })}>
                  <Icon name="plus" size={28} /> {lang === 'ru' ? `Ещё из «${g.restaurant.name}»` : `More from ${g.restaurant.name}`}
                </button>
              </section>
            ))}
            <button type="button" className="add-more" onClick={() => go({ name: 'map' })}>
              <Icon name="plus" size={36} />
              {t(S.addFromAnother)}
            </button>
          </div>
        )}
      </div>

      <BottomBar>
        {groups.length > 0 && (
          <button type="button" className="btn btn-primary btn-xl grow" onClick={() => go({ name: 'fulfillment' })}>
            <span>{t(S.checkout)}</span>
            <span className="btn-price" aria-live="polite">
              {money(cart.total)}
            </span>
            <Icon name="next" size={36} />
          </button>
        )}
      </BottomBar>
    </section>
  );
}
