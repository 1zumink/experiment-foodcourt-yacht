import { CheckoutHeader } from '../../components/CheckoutHeader';
import { BottomBar } from '../../components/BottomBar';
import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { Numpad } from '../../components/Numpad';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { useSession } from '../../state/session';
import { discountFor, earnFor, giftAvailable, groupCart, lookupAccounts, maxSpend, type CartGroup } from '../../lib/price';
import { S, money } from '../../i18n';
import type { RestaurantId } from '../../types';

const fmtPhone = (d: string) => {
  const p = d.padEnd(10, '_');
  return `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`;
};

export function LoyaltyScreen() {
  const { t, lang } = usePrefs();
  const { lines } = useCart();
  const { go, loyalty, setLoyalty } = useSession();
  const groups = groupCart(lines);
  const withProgram = groups.filter((g) => g.restaurant.loyalty);
  const { phone, looked, accounts } = loyalty;

  const setPhone = (p: string) => setLoyalty({ phone: p, looked: false, accounts: {} });
  const find = (p = phone) =>
    setLoyalty({ phone: p, looked: true, accounts: lookupAccounts(p, withProgram.map((g) => g.restaurant.id)) });
  const toggleUse = (rid: RestaurantId) => {
    const acc = accounts[rid];
    if (!acc) return;
    setLoyalty({ ...loyalty, accounts: { ...accounts, [rid]: { ...acc, use: !acc.use } } });
  };

  const pts = lang === 'ru' ? 'баллов' : 'pts';

  const renderStatus = (g: CartGroup) => {
    const lo = g.restaurant.loyalty;
    if (!lo) return <span className="muted">{t(S.noLoyalty)}</span>;
    const acc = accounts[g.restaurant.id];
    if (!looked || !acc) return <span className="muted">{t(lo.name)}</span>;
    const earn = earnFor(g, acc);
    if (acc.status === 'new') {
      return (
        <span className="loy-status">
          <span>{t(S.cardNew)}</span>
          <span className="loy-earn">
            {t(S.willEarn)} +{earn} {lo.kind === 'points' ? pts : t(S.stamps)}
          </span>
        </span>
      );
    }
    if (lo.kind === 'points') {
      const spend = maxSpend(g, acc);
      return (
        <span className="loy-status">
          <span>
            <Icon name="check" size={24} stroke={3} /> {t(S.cardFound)} · {t(S.balance)}: <strong>{acc.balance}</strong> {pts}
          </span>
          <span className="loy-earn">
            {t(S.willEarn)} +{earn} {pts}
          </span>
          {spend > 0 && (
            <button type="button" role="switch" aria-checked={acc.use} className={`loy-use${acc.use ? ' is-on' : ''}`} onClick={() => toggleUse(g.restaurant.id)}>
              <span>
                {t(S.spendPoints)} {spend} {pts} <strong>−{money(spend)}</strong>
              </span>
              <span className="switch" aria-hidden="true">
                <span className="switch-knob">{acc.use && <Icon name="check" size={24} stroke={3.4} />}</span>
              </span>
            </button>
          )}
        </span>
      );
    }
    const goal = lo.stampsGoal ?? 6;
    const gift = giftAvailable(g, acc);
    return (
      <span className="loy-status">
        <span className="stamps" aria-label={`${acc.balance} / ${goal}`}>
          {Array.from({ length: goal }, (_, i) => (
            <span key={i} className={`stamp${i < acc.balance ? ' is-on' : ''}${i === goal - 1 ? ' is-gift' : ''}`}>
              {i === goal - 1 ? <Icon name="gift" size={26} /> : i < acc.balance ? <Icon name="check" size={22} stroke={3} /> : null}
            </span>
          ))}
        </span>
        {gift ? (
          <button type="button" role="switch" aria-checked={acc.use} className={`loy-use${acc.use ? ' is-on' : ''}`} onClick={() => toggleUse(g.restaurant.id)}>
            <span>
              {t(S.useGift)} <strong>−{money(discountFor(g, { ...acc, use: true }))}</strong>
            </span>
            <span className="switch" aria-hidden="true">
              <span className="switch-knob">{acc.use && <Icon name="check" size={24} stroke={3.4} />}</span>
            </span>
          </button>
        ) : (
          <span className="loy-earn">
            {t(S.willEarn)} +1 · {acc.balance + 1}/{goal}
          </span>
        )}
      </span>
    );
  };

  return (
    <section className="screen screen--loyalty">
      <CheckoutHeader step="loyalty" title={t(S.loyaltyTitle)} onBack={() => go({ name: 'fulfillment' })} />
      <div className="screen-body">
        <p className="lead">{t(S.loyaltyLead)}</p>

        <div className="phone-panel">
          <div className="phone-left">
            <label className="phone-label" htmlFor="phone-out">
              {t(S.phone)}
            </label>
            <output id="phone-out" className={`phone-display${phone.length === 10 ? ' is-full' : ''}`} aria-live="polite">
              {fmtPhone(phone)}
            </output>
            <button type="button" className="btn btn-primary btn-xl" disabled={phone.length !== 10 || looked} onClick={() => find()}>
              {looked ? <Icon name="check" size={32} stroke={3} /> : null}
              {t(S.findCards)}
            </button>
            <p className="muted small">
              <Icon name="qr" size={24} /> {t(S.showQr)}
            </p>
            <button type="button" className="link-btn" onClick={() => find('9161234567')}>
              {lang === 'ru' ? 'Демо: «отсканировать» QR' : 'Demo: “scan” QR'}
            </button>
            <p className="muted small">{t(S.phoneNote)}</p>
          </div>
          <Numpad
            label={t(S.phone)}
            onDigit={(d) => phone.length < 10 && setPhone(phone + d)}
            onBack={() => setPhone(phone.slice(0, -1))}
          />
        </div>

        <ul className="loy-list">
          {groups.map((g) => (
            <li key={g.restaurant.id} className={`loy-card${g.restaurant.loyalty ? '' : ' is-none'}`}>
              <LogoTile r={g.restaurant} size={96} radius={22} />
              <div className="loy-body">
                <span className="loy-name">{g.restaurant.name}</span>
                {renderStatus(g)}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <BottomBar>
        <button type="button" className={`btn btn-xl grow ${looked ? 'btn-primary' : 'btn-ghost'}`} onClick={() => go({ name: 'payment' })}>
          <span>{looked ? t(S.continue) : t(S.skip)}</span>
          <Icon name="next" size={36} />
        </button>
      </BottomBar>
    </section>
  );
}
