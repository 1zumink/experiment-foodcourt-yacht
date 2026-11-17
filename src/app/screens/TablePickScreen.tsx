import { useState } from 'react';
import { FloorMap } from '../../components/FloorMap';
import { usePrefs } from '../../state/prefs';
import { TABLE_COUNT } from '../../data/floor';
import { useApp } from '../appState';
import { MainBar, TopBar } from '../ui';
import { A, B } from '../strings';

const VIEW = { x: 110, y: 149, w: 860, h: 1530 };

/** Выбор другого стола: та же карта зала, что в терминале */
export function TablePickScreen() {
  const { t } = usePrefs();
  const { go, table, setTable, setMode } = useApp();
  const [n, setN] = useState<number | null>(table);
  const [val, setVal] = useState(table ? String(table) : '');
  const valid = !!n && n >= 1 && n <= TABLE_COUNT;

  return (
    <section className="m-screen">
      <TopBar onBack={() => go({ name: 'fulfillment' })} title={t(B.pickTitle)} />
      <div className="m-scroll m-pad">
        <p className="m-muted m-small m-center">{t(B.pickLead)}</p>
        <div className="m-pick-row">
          <input
            className={`m-input m-input--big${val && !valid ? ' is-bad' : ''}`}
            inputMode="numeric"
            aria-label={t(A.tableNum)}
            value={val}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 2);
              setVal(v);
              setN(Number(v) || null);
            }}
          />
          <span className="m-hint">
            {t(A.tableRange)} {TABLE_COUNT}
          </span>
        </div>
        <div className="m-pick-map">
          <FloorMap
            mode="table"
            scale={358 / VIEW.w}
            view={VIEW}
            selectedTable={n}
            onTable={(x) => {
              setN(x);
              setVal(String(x));
            }}
          />
        </div>
        <div className="m-bottom-space" />
      </div>
      <MainBar
        label={valid ? `${t(B.done)} · ${t(A.table)} ${n}` : t(B.done)}
        disabled={!valid}
        onClick={() => {
          if (!n) return;
          setTable(n);
          setMode('table');
          go({ name: 'fulfillment' });
        }}
      />
    </section>
  );
}
