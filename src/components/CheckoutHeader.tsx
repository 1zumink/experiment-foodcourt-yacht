import { Icon } from './Icon';
import { usePrefs } from '../state/prefs';
import { useCart } from '../state/cart';
import { S } from '../i18n';
import { byId } from '../data/restaurants';

export type CheckoutStep = 'fulfillment' | 'loyalty' | 'payment';

export const useCheckoutSteps = (): CheckoutStep[] => {
  const { lines } = useCart();
  const hasLoyalty = lines.some((l) => byId[l.restaurantId].loyalty);
  return hasLoyalty ? ['fulfillment', 'loyalty', 'payment'] : ['fulfillment', 'payment'];
};

const titles = { fulfillment: S.stepFulfillment, loyalty: S.stepLoyalty, payment: S.stepPayment };

export function CheckoutHeader({ step, title, onBack }: { step: CheckoutStep; title: string; onBack: () => void }) {
  const { t } = usePrefs();
  const steps = useCheckoutSteps();
  const idx = steps.indexOf(step);
  return (
    <header className="co-head">
      <div className="co-head-top">
        <button type="button" className="back-btn" onClick={onBack}>
          <Icon name="back" size={36} />
          <span>{t(S.back)}</span>
        </button>
        <ol className="co-steps" aria-label={`${idx + 1} / ${steps.length}`}>
          {steps.map((s, i) => (
            <li key={s} className={i < idx ? 'is-done' : i === idx ? 'is-current' : ''} aria-current={i === idx ? 'step' : undefined}>
              <span className="co-step-dot">{i < idx ? <Icon name="check" size={22} stroke={3.4} /> : i + 1}</span>
              <span>{t(titles[s])}</span>
            </li>
          ))}
        </ol>
      </div>
      <h1 className="co-title" data-screen-title tabIndex={-1}>
        {title}
      </h1>
    </header>
  );
}
