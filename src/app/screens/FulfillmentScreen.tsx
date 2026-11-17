import type { ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { usePrefs } from '../../state/prefs';
import type { FulfillmentMode } from '../../types';
import { useApp } from '../appState';
import { MainBar, StepHead, useSteps } from '../ui';
import { B } from '../strings';

export function FulfillmentScreen() {
  const { t } = usePrefs();
  const { go, mode, setMode, table } = useApp();
  const steps = useSteps();
  const next = steps[steps.indexOf('fulfillment') + 1];

  const Choice = ({ m, ico, title, hint, extra }: { m: FulfillmentMode; ico: string; title: string; hint: string; extra?: ReactNode }) => (
    <div className={`m-choice${mode === m ? ' is-on' : ''}`}>
      <button type="button" role="radio" aria-checked={mode === m} className="m-choice-main" onClick={() => setMode(m)}>
        <span className="m-choice-ico">
          <Icon name={ico} size={26} stroke={2} />
        </span>
        <span className="m-choice-text">
          <strong>{title}</strong>
          <span>{hint}</span>
        </span>
        <span className="m-mark m-mark--round" aria-hidden="true">
          {mode === m && <Icon name="check" size={14} stroke={3.4} />}
        </span>
      </button>
      {extra}
    </div>
  );

  return (
    <section className="m-screen">
      <StepHead step="fulfillment" title={t(B.howGet)} onBack={() => go({ name: 'cart' })} />
      <div className="m-scroll m-pad">
        <div className="m-choices" role="radiogroup" aria-label={t(B.howGet)}>
          <Choice
            m="table"
            ico="table"
            title={`${t(B.toTable)} №${table}`}
            hint={t(B.toTableHint)}
            extra={
              <button type="button" className="m-link m-choice-link" onClick={() => go({ name: 'tablePick' })}>
                <Icon name="pin" size={16} /> {t(B.otherTable)}
              </button>
            }
          />
          <Choice m="pickup" ico="bag" title={t(B.pickup)} hint={t(B.pickupHint)} />
        </div>
      </div>
      <MainBar label={t(B.continue)} onClick={() => go({ name: next })} />
    </section>
  );
}
