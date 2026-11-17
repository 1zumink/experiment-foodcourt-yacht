import { useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { usePrefs } from '../state/prefs';
import { useCart } from '../state/cart';
import { byId } from '../data/restaurants';
import { useApp } from './appState';
import { A, B } from './strings';
import { S, money } from '../i18n';

function Switch({ on }: { on: boolean }) {
  return <span className="m-switch" aria-hidden="true" data-on={on} />;
}

/** Шторка доступности: крупный текст, контраст, язык */
export function MA11ySheet({ onClose }: { onClose: () => void }) {
  const p = usePrefs();
  const rows: [string, string, boolean, (v: boolean) => void][] = [
    ['text', p.t(B.large), p.large, p.setLarge],
    ['contrast', p.t(B.contrast), p.contrast, p.setContrast],
    ['globe', 'English', p.lang === 'en', (v) => p.setLang(v ? 'en' : 'ru')],
  ];
  return (
    <Sheet onClose={onClose} label={p.t(B.a11y)} className="m-sheet m-a11y">
      <div className="m-a11y-head">
        <h2>{p.t(B.a11y)}</h2>
        <button type="button" className="m-icon-btn" onClick={onClose} aria-label={p.t(S.close)}>
          <Icon name="close" size={22} />
        </button>
      </div>
      <div className="m-a11y-list">
        {rows.map(([ico, label, on, set]) => (
          <button key={ico} type="button" role="switch" aria-checked={on} className="m-a11y-row" onClick={() => set(!on)}>
            <span className="m-a11y-ico">
              <Icon name={ico} size={22} />
            </span>
            <span className="m-a11y-label">{label}</span>
            <Switch on={on} />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function TopRight({ right }: { right?: ReactNode }) {
  const { t, lang, setLang } = usePrefs();
  const [open, setOpen] = useState(false);
  return (
    <div className="m-top-right">
      {right}
      <button type="button" className="m-icon-btn" onClick={() => setOpen(true)} aria-label={t(B.a11y)} aria-haspopup="dialog">
        <Icon name="a11y" size={22} />
      </button>
      <button type="button" className="m-lang" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} lang={lang === 'ru' ? 'en' : 'ru'}>
        {lang === 'ru' ? 'EN' : 'RU'}
      </button>
      {open && <MA11ySheet onClose={() => setOpen(false)} />}
    </div>
  );
}

export function TopBar({ onBack, title, right }: { onBack?: () => void; title?: string; right?: ReactNode }) {
  const { t, lang } = usePrefs();
  const { table, go } = useApp();
  return (
    <header className="m-top">
      {onBack ? (
        <button type="button" className="m-icon-btn" onClick={onBack} aria-label={lang === 'ru' ? 'Назад' : 'Back'}>
          <Icon name="back" size={24} />
        </button>
      ) : (
        <button type="button" className="m-table-pill" onClick={() => go({ name: 'table' })} aria-label={`${t(A.table)} ${table}, ${t(A.change)}`}>
          <Icon name="table" size={20} />
          {t(A.table)} {table}
        </button>
      )}
      {title && <h1 className="m-top-title">{title}</h1>}
      <TopRight right={right} />
    </header>
  );
}

export type Step = 'fulfillment' | 'loyalty' | 'payment';

export const useSteps = (): Step[] => {
  const { lines } = useCart();
  return lines.some((l) => byId[l.restaurantId].loyalty) ? ['fulfillment', 'loyalty', 'payment'] : ['fulfillment', 'payment'];
};

/** Шапка шагов оформления — как в терминале: Получение · Бонусы · Оплата */
export function StepHead({ step, title, onBack }: { step: Step; title: string; onBack: () => void }) {
  const { t } = usePrefs();
  const steps = useSteps();
  const idx = steps.indexOf(step);
  const names = { fulfillment: S.stepFulfillment, loyalty: S.stepLoyalty, payment: S.stepPayment };
  return (
    <>
      <TopBar onBack={onBack} />
      <div className="m-stephead">
        <ol className="m-steps-bar">
          {steps.map((s, i) => (
            <li key={s} className={i < idx ? 'is-done' : i === idx ? 'is-current' : ''} aria-current={i === idx ? 'step' : undefined}>
              <span className="m-step-num">{i < idx ? <Icon name="check" size={12} stroke={3.6} /> : i + 1}</span>
              {t(names[s])}
            </li>
          ))}
        </ol>
        <h1>{title}</h1>
      </div>
    </>
  );
}

export function CartBar() {
  const { t } = usePrefs();
  const { count, total } = useCart();
  const { go } = useApp();
  if (!count) return null;
  return (
    <div className="m-cartbar-wrap">
      <button type="button" className="m-cartbar" onClick={() => go({ name: 'cart' })}>
        <span className="m-cartbar-count">{count}</span>
        <span>{t(A.cart)}</span>
        <span className="m-cartbar-total" aria-live="polite">
          {money(total)}
        </span>
      </button>
    </div>
  );
}

/** Нижняя главная кнопка экрана */
export function MainBar({ label, sum, onClick, disabled }: { label: string; sum?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="m-cartbar-wrap">
      <button type="button" className="m-cartbar m-cartbar--pay" onClick={onClick} disabled={disabled}>
        <span>{label}</span>
        {sum && <span className="m-cartbar-total">{sum}</span>}
        {!sum && <Icon name="next" size={22} />}
      </button>
    </div>
  );
}

export function MStepper({ value, onChange, min = 0, label }: { value: number; onChange: (n: number) => void; min?: number; label: string }) {
  return (
    <div className="m-stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="−1">
        <Icon name={value === 1 && min === 0 ? 'trash' : 'minus'} size={20} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= 20} aria-label="+1">
        <Icon name="plus" size={20} />
      </button>
    </div>
  );
}
