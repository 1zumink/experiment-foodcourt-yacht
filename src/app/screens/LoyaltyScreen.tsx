import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { discountFor, earnFor, giftAvailable, groupCart, lookupAccounts, maxSpend, type CartGroup } from '../../lib/price';
import { S, money } from '../../i18n';
import type { RestaurantId } from '../../types';
import { useApp } from '../appState';
import { MainBar, StepHead } from '../ui';
import { A, B } from '../strings';

export function LoyaltyScreen() {
  const { t, lang } = usePrefs();
  const { lines } = useCart();
  const { go, loyalty, setLoyalty } = useApp();
  const groups = groupCart(lines);
  const withProgram = groups.filter((g) => g.restaurant.loyalty);
  const acc = loyalty.accounts;
  const pts = lang === 'ru' ? 'баллов' : 'pts';

  const setPhone = (v: string) => setLoyalty({ phone: v.replace(/\D/g, '').replace(/^[78](?=\d{10})/, '').slice(0, 10), looked: false, accounts: {} });
  const find = () => setLoyalty({ ...loyalty, looked: true, accounts: lookupAccounts(loyalty.phone, withProgram.map((g) => g.restaurant.id)) });
  const toggleUse = (rid: RestaurantId) => {
    const a = acc[rid];
    if (a) setLoyalty({ ...loyalty, accounts: { ...acc, [rid]: { ...a, use: !a.use } } });
  };

  const row = (g: CartGroup) => {
    const lo = g.restaurant.loyalty;
    const a = acc[g.restaurant.id];
    if (!lo)
      return (
        <li key={g.restaurant.id} className="m-loy is-none">
          <LogoTile r={g.restaurant} size={40} radius={10} />
          <div className="m-loy-body">
            <strong>{g.restaurant.name}</strong>
            <span className="m-muted">{t(S.noLoyalty)}</span>
          </div>
        </li>
      );
    const unit = lo.kind === 'points' ? pts : t(S.stamps);
    let canUse = 0;
    let useLabel = '';
    if (a?.status === 'found' && lo.kind === 'points') {
      canUse = maxSpend(g, a);
      useLabel = `${t(S.spendPoints)} ${canUse} ${pts}`;
    }
    if (a?.status === 'found' && giftAvailable(g, a)) {
      canUse = discountFor(g, { ...a, use: true });
      useLabel = t(S.useGift);
    }
    const goal = lo.stampsGoal ?? 6;
    return (
      <li key={g.restaurant.id} className="m-loy">
        <LogoTile r={g.restaurant} size={40} radius={10} />
        <div className="m-loy-body">
          <strong>{t(lo.name)}</strong>
          {!a ? (
            <span className="m-muted">{g.restaurant.name}</span>
          ) : a.status === 'new' ? (
            <span className="m-muted">{t(S.cardNew)}</span>
          ) : lo.kind === 'points' ? (
            <span className="m-muted">
              <Icon name="check" size={13} stroke={3} /> {t(S.cardFound)} · {t(S.balance)}: {a.balance} {pts}
            </span>
          ) : (
            <span className="m-stamps" aria-label={`${a.balance}/${goal}`}>
              {Array.from({ length: goal }, (_, i) => (
                <span key={i} className={`m-stamp${i < a.balance ? ' is-on' : ''}${i === goal - 1 ? ' is-gift' : ''}`}>
                  {i === goal - 1 ? <Icon name="gift" size={13} /> : i < a.balance ? <Icon name="check" size={11} stroke={3} /> : null}
                </span>
              ))}
            </span>
          )}
          {a && (
            <span className="m-ok">
              +{earnFor(g, a)} {unit}
            </span>
          )}
        </div>
        {a && canUse > 0 && (
          <button type="button" role="switch" aria-checked={a.use} className={`m-use${a.use ? ' is-on' : ''}`} onClick={() => toggleUse(g.restaurant.id)}>
            <span>
              {useLabel}
              <strong> −{money(canUse)}</strong>
            </span>
            <span className="m-switch" aria-hidden="true" />
          </button>
        )}
      </li>
    );
  };

  return (
    <section className="m-screen">
      <StepHead step="loyalty" title={t(B.bonusTitle)} onBack={() => go({ name: 'fulfillment' })} />
      <div className="m-scroll m-pad">
        <p className="m-muted m-small">{t(A.bonusLead)}</p>
        <form
          className="m-phone-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (loyalty.phone.length === 10) find();
          }}
        >
          <span className="m-phone-prefix">+7</span>
          <input
            className="m-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            aria-label={t(S.phone)}
            placeholder={t(A.phonePh)}
            value={loyalty.phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button type="submit" className="m-btn m-btn--primary m-btn--sm" disabled={loyalty.phone.length !== 10 || loyalty.looked}>
            {loyalty.looked ? <Icon name="check" size={18} stroke={3} /> : t(A.find)}
          </button>
        </form>
        <p className="m-muted m-small m-note">
          <Icon name="qr" size={14} /> {t(S.showQr)}
        </p>
        <ul className="m-loy-list m-loy-list--page">{groups.map(row)}</ul>
        <div className="m-bottom-space" />
      </div>
      <MainBar label={loyalty.looked ? t(B.continue) : t(B.skip)} onClick={() => go({ name: 'payment' })} />
    </section>
  );
}
