import { useState } from 'react';
import { CheckoutHeader, useCheckoutSteps } from '../../components/CheckoutHeader';
import { BottomBar } from '../../components/BottomBar';
import { FloorMap } from '../../components/FloorMap';
import { Icon } from '../../components/Icon';
import { Numpad } from '../../components/Numpad';
import { useSize } from '../../components/useSize';
import { usePrefs } from '../../state/prefs';
import { useSession } from '../../state/session';
import { TABLE_COUNT } from '../../data/floor';
import { S } from '../../i18n';
import type { FulfillmentMode } from '../../types';

const TABLE_VIEW = { x: 110, y: 149, w: 860, h: 1611 };

export function FulfillmentScreen() {
  const { t, lang } = usePrefs();
  const { go, mode, setMode, table, setTable } = useSession();
  const steps = useCheckoutSteps();
  const [typed, setTyped] = useState(table ? String(table) : '');
  const [ref, size] = useSize<HTMLDivElement>();
  // Для выбора стола показываем только зал со столами (края ресторанов для ориентира)
  const scale = size.h ? Math.min(0.9, size.h / TABLE_VIEW.h, size.w / TABLE_VIEW.w) : 0.5;

  const pick = (n: number) => {
    setTable(n);
    setTyped(String(n));
  };
  const digit = (d: string) => {
    const next = (typed + d).replace(/^0+/, '').slice(0, 2);
    setTyped(next);
    const n = Number(next);
    setTable(n >= 1 && n <= TABLE_COUNT ? n : null);
  };
  const backspace = () => {
    const next = typed.slice(0, -1);
    setTyped(next);
    const n = Number(next);
    setTable(n >= 1 && n <= TABLE_COUNT ? n : null);
  };

  const ready = mode === 'pickup' || (mode === 'table' && !!table);
  const next = steps[steps.indexOf('fulfillment') + 1];
  const badTable = typed !== '' && !table;

  const Option = ({ m, icon, title, hint }: { m: FulfillmentMode; icon: string; title: string; hint: string }) => (
    <button type="button" role="radio" aria-checked={mode === m} className={`choice${mode === m ? ' is-on' : ''}`} onClick={() => setMode(m)}>
      <span className="choice-ico">
        <Icon name={icon} size={56} stroke={2} />
      </span>
      <span className="choice-title">{title}</span>
      <span className="choice-hint">{hint}</span>
      <span className="choice-mark" aria-hidden="true">
        {mode === m && <Icon name="check" size={30} stroke={3.4} />}
      </span>
    </button>
  );

  return (
    <section className="screen screen--fulfillment">
      <CheckoutHeader step="fulfillment" title={t(S.howToGet)} onBack={() => go({ name: 'cart' })} />
      <div className="screen-body fulfillment-body">
        <div className="choices" role="radiogroup" aria-label={t(S.howToGet)}>
          <Option m="pickup" icon="bag" title={t(S.pickup)} hint={t(S.pickupHint)} />
          <Option m="table" icon="table" title={t(S.toTable)} hint={t(S.toTableHint)} />
        </div>

        {mode === 'table' && (
          <div className="table-picker">
            <div className="table-map" ref={ref}>
              <FloorMap mode="table" scale={scale} view={TABLE_VIEW} title={t(S.tapYourTable)} selectedTable={table} onTable={pick} showTerminal />
            </div>
            <div className="table-side">
              <div className={`table-display${table ? ' is-set' : ''}${badTable ? ' is-bad' : ''}`} aria-live="polite">
                <span className="table-display-label">{t(S.table)}</span>
                <span className="table-display-num">{typed || '—'}</span>
                {badTable && <span className="table-display-err">{lang === 'ru' ? `Столы 1–${TABLE_COUNT}` : `Tables 1–${TABLE_COUNT}`}</span>}
              </div>
              <p className="muted center">{t(S.orEnterTable)}</p>
              <Numpad onDigit={digit} onBack={backspace} label={t(S.orEnterTable)} />
            </div>
          </div>
        )}
      </div>
      <BottomBar>
        <button type="button" className="btn btn-primary btn-xl grow" disabled={!ready} onClick={() => go({ name: next })}>
          <span>{mode === 'table' && !table ? t(S.tableNotChosen) : t(S.continue)}</span>
          <Icon name="next" size={36} />
        </button>
      </BottomBar>
    </section>
  );
}
