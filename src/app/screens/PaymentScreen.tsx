import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { LogoTile } from '../../components/Logo';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { discountFor, earnFor, groupCart } from '../../lib/price';
import { placeOrders } from '../../lib/placeOrder';
import { S, money } from '../../i18n';
import { useApp } from '../appState';
import { MainBar, StepHead, useSteps } from '../ui';
import { A, B } from '../strings';

type Pay = 'card' | 'sbp';
type Phase = 'idle' | 'card' | 'sbp' | 'processing' | 'paid';

export function PaymentScreen() {
  const { t, lang } = usePrefs();
  const cart = useCart();
  const { go, table, mode, loyalty, setLoyalty, addMyOrders } = useApp();
  const steps = useSteps();
  const [pay, setPay] = useState<Pay>('card');
  const [phase, setPhase] = useState<Phase>('idle');
  const groups = groupCart(cart.lines);
  const acc = loyalty.accounts;
  const discount = groups.reduce((s, g) => s + discountFor(g, acc[g.restaurant.id]), 0);
  const total = cart.total - discount;
  const prev = steps[steps.indexOf('payment') - 1];
  const pts = lang === 'ru' ? 'баллов' : 'pts';

  useEffect(() => {
    let id: ReturnType<typeof setTimeout> | undefined;
    if (phase === 'card') id = setTimeout(() => setPhase('processing'), 2400);
    if (phase === 'sbp') id = setTimeout(() => setPhase('processing'), 6000);
    if (phase === 'processing') id = setTimeout(() => setPhase('paid'), 1400);
    if (phase === 'paid')
      id = setTimeout(() => {
        const orders = placeOrders(cart.lines, mode, table, acc);
        addMyOrders(orders.map((o) => o.id));
        cart.clear();
        setLoyalty({ phone: loyalty.phone, looked: false, accounts: {} });
        go({ name: 'codes', orderIds: orders.map((o) => o.id) });
      }, 1100);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <section className="m-screen">
      <StepHead step="payment" title={t(B.payTitle)} onBack={() => go({ name: prev })} />
      <div className="m-scroll m-pad">
        <section className="m-card m-summary">
          {groups.map((g) => {
            const a = acc[g.restaurant.id];
            const d = discountFor(g, a);
            const e = earnFor(g, a);
            return (
              <div key={g.restaurant.id} className="m-sum-row">
                <LogoTile r={g.restaurant} size={36} radius={10} />
                <span className="m-sum-name">
                  <strong>{g.restaurant.name}</strong>
                  {a && e > 0 && (
                    <span className="m-ok m-small">
                      +{e} {g.restaurant.loyalty?.kind === 'points' ? pts : t(S.stamps)}
                    </span>
                  )}
                </span>
                <span className="m-sum-val">
                  {d > 0 && <s className="m-muted m-small">{money(g.subtotal)}</s>}
                  <strong>{money(g.subtotal - d)}</strong>
                </span>
              </div>
            );
          })}
          {discount > 0 && (
            <div className="m-sum-line m-ok">
              <span>{t(S.discount)}</span>
              <span>−{money(discount)}</span>
            </div>
          )}
          <div className="m-total">
            <span>{t(S.total)}</span>
            <strong>{money(total)}</strong>
          </div>
          <div className="m-sum-meta">
            <Icon name={mode === 'table' ? 'table' : 'bag'} size={16} />
            {mode === 'table' ? `${t(B.toTable)} №${table}` : t(B.pickup)}
          </div>
        </section>

        <h2 className="m-section">{t(B.payWith)}</h2>
        <div className="m-pay" role="radiogroup" aria-label={t(B.payWith)}>
          {(['card', 'sbp'] as Pay[]).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={pay === p} className={`m-pay-opt${pay === p ? ' is-on' : ''}`} onClick={() => setPay(p)}>
              <Icon name={p === 'card' ? 'card' : 'qr'} size={24} />
              {p === 'card' ? t(A.card) : t(A.sbp)}
              <span className="m-mark m-mark--round" aria-hidden="true">
                {pay === p && <Icon name="check" size={14} stroke={3.4} />}
              </span>
            </button>
          ))}
        </div>
        <div className="m-bottom-space" />
      </div>
      <MainBar label={t(A.pay)} sum={money(total)} onClick={() => setPhase(pay)} disabled={phase !== 'idle'} />

      {phase !== 'idle' && (
        <div className="sheet-layer">
          <div className="sheet-backdrop" />
          <div className="m-pay-modal" role="alertdialog" aria-live="assertive">
            {phase === 'card' && (
              <>
                <span className="m-pay-ico">
                  <Icon name="phone" size={40} stroke={1.8} />
                </span>
                <strong>{t(B.cardConfirm)}</strong>
                <span className="m-muted m-small m-center">{t(B.cardConfirmLead)}</span>
                <span className="m-pay-sum">{money(total)}</span>
              </>
            )}
            {phase === 'sbp' && (
              <>
                <span className="m-pay-ico">
                  <Icon name="qr" size={40} stroke={1.8} />
                </span>
                <strong>{t(B.sbpTitle)}</strong>
                <span className="m-muted m-small m-center">{t(B.sbpLead)}</span>
                <span className="m-pay-sum">{money(total)}</span>
                <button type="button" className="m-btn m-btn--primary m-btn--wide" onClick={() => setPhase('processing')}>
                  {t(B.iPaid)}
                </button>
              </>
            )}
            {phase === 'processing' && (
              <>
                <span className="m-spin" aria-hidden="true" />
                <strong>{t(B.processing)}</strong>
                <span className="m-muted">{money(total)}</span>
              </>
            )}
            {phase === 'paid' && (
              <>
                <span className="m-paid-ico" aria-hidden="true">
                  <Icon name="check" size={48} stroke={3} />
                </span>
                <strong>{t(B.paid)}</strong>
              </>
            )}
            {(phase === 'card' || phase === 'sbp') && (
              <button type="button" className="m-btn m-btn--ghost m-btn--wide" onClick={() => setPhase('idle')}>
                {t(B.cancel)}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
