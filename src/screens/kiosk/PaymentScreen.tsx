import { useEffect, useState } from 'react';
import { CheckoutHeader, useCheckoutSteps } from '../../components/CheckoutHeader';
import { BottomBar } from '../../components/BottomBar';
import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { FakeQr } from '../../components/FakeQr';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { useSession } from '../../state/session';
import { discountFor, earnFor, groupCart } from '../../lib/price';
import { placeOrders } from '../../lib/placeOrder';
import { S, money } from '../../i18n';

type Phase = 'choose' | 'card' | 'sbp' | 'processing' | 'paid';

export function PaymentScreen() {
  const { t, lang } = usePrefs();
  const cart = useCart();
  const { go, loyalty, mode, table } = useSession();
  const steps = useCheckoutSteps();
  const [phase, setPhase] = useState<Phase>('choose');
  const groups = groupCart(cart.lines);
  const acc = loyalty.accounts;
  const discount = groups.reduce((s, g) => s + discountFor(g, acc[g.restaurant.id]), 0);
  const total = cart.total - discount;
  const prev = steps[steps.indexOf('payment') - 1];

  useEffect(() => {
    let id: ReturnType<typeof setTimeout> | undefined;
    if (phase === 'card') id = setTimeout(() => setPhase('processing'), 2600);
    if (phase === 'sbp') id = setTimeout(() => setPhase('processing'), 8000);
    if (phase === 'processing') id = setTimeout(() => setPhase('paid'), 1400);
    if (phase === 'paid')
      id = setTimeout(() => {
        const orders = placeOrders(cart.lines, mode ?? 'pickup', table, acc);
        cart.clear();
        go({ name: 'codes', orderIds: orders.map((o) => o.id) });
      }, 1200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const pts = lang === 'ru' ? 'баллов' : 'pts';

  return (
    <section className="screen screen--payment">
      <CheckoutHeader step="payment" title={t(S.payTitle)} onBack={() => go({ name: prev })} />
      <div className="screen-body">
        <div className="summary">
          {groups.map((g) => {
            const a = acc[g.restaurant.id];
            const d = discountFor(g, a);
            const e = earnFor(g, a);
            return (
              <div key={g.restaurant.id} className="summary-row">
                <LogoTile r={g.restaurant} size={72} radius={18} />
                <span className="summary-name">
                  {g.restaurant.name}
                  {a && e > 0 && (
                    <span className="summary-earn">
                      +{e} {g.restaurant.loyalty?.kind === 'points' ? pts : t(S.stamps)}
                    </span>
                  )}
                </span>
                <span className="summary-sum">
                  {d > 0 && <s className="muted">{money(g.subtotal)}</s>}
                  <strong>{money(g.subtotal - d)}</strong>
                </span>
              </div>
            );
          })}
          {discount > 0 && (
            <div className="summary-line">
              <span>{t(S.discount)}</span>
              <span>−{money(discount)}</span>
            </div>
          )}
          <div className="summary-total">
            <span>{t(S.total)}</span>
            <strong aria-live="polite">{money(total)}</strong>
          </div>
          <div className="summary-meta">
            <Icon name={mode === 'table' ? 'table' : 'bag'} size={30} />
            {mode === 'table' ? `${t(S.toTable)} · ${t(S.table)} ${table}` : t(S.pickup)}
          </div>
        </div>

        <h2 className="section-title">{lang === 'ru' ? 'Способ оплаты' : 'Payment method'}</h2>
        <div className="pay-methods">
          <button type="button" className="pay-method" onClick={() => setPhase('card')}>
            <span className="pay-ico">
              <Icon name="card" size={64} stroke={1.8} />
            </span>
            <span className="pay-title">{t(S.byCard)}</span>
            <span className="pay-hint">{t(S.byCardHint)}</span>
          </button>
          <button type="button" className="pay-method" onClick={() => setPhase('sbp')}>
            <span className="pay-ico">
              <Icon name="qr" size={64} stroke={1.8} />
            </span>
            <span className="pay-title">{t(S.bySbp)}</span>
            <span className="pay-hint">{t(S.bySbpHint)}</span>
          </button>
        </div>
      </div>
      <BottomBar>
        <p className="pay-total-hint">
          {t(S.total)}: <strong>{money(total)}</strong>
        </p>
      </BottomBar>

      {phase !== 'choose' && (
        <div className="sheet-layer">
          <div className="sheet-backdrop" />
          <div className="modal pay-modal" role="alertdialog" aria-modal="true" aria-live="assertive">
            {phase === 'card' && (
              <>
                <div className="pay-anim" aria-hidden="true">
                  <span className="pay-anim-card">
                    <Icon name="card" size={120} stroke={1.4} />
                  </span>
                  <span className="pay-anim-arrow">
                    <Icon name="down" size={80} />
                  </span>
                </div>
                <h2>{t(S.tapCard)}</h2>
                <p className="modal-sum">{money(total)}</p>
                <p className="muted">{t(S.readerBelow)}</p>
              </>
            )}
            {phase === 'sbp' && (
              <>
                <FakeQr seed={`pay-${total}`} size={360} />
                <h2>{t(S.scanQr)}</h2>
                <p className="modal-sum">{money(total)}</p>
                <button type="button" className="btn btn-primary btn-xl" onClick={() => setPhase('processing')}>
                  {t(S.iPaid)}
                </button>
              </>
            )}
            {phase === 'processing' && (
              <>
                <span className="spinner" aria-hidden="true" />
                <h2>{t(S.processing)}</h2>
              </>
            )}
            {phase === 'paid' && (
              <>
                <span className="paid-ico" aria-hidden="true">
                  <Icon name="check" size={120} stroke={3} />
                </span>
                <h2>{t(S.paid)}</h2>
              </>
            )}
            {(phase === 'card' || phase === 'sbp') && (
              <button type="button" className="btn btn-ghost btn-xl" onClick={() => setPhase('choose')}>
                {t(S.cancel)}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
