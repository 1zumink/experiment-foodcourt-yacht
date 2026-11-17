import { useState } from 'react';
import { FakeQr } from '../../components/FakeQr';
import { FloorMap } from '../../components/FloorMap';
import { Icon } from '../../components/Icon';
import { usePrefs } from '../../state/prefs';
import { TABLE_COUNT } from '../../data/floor';
import { useApp } from '../appState';
import { A } from '../strings';

/** Вход: стол из QR-кода на столе. Если открыли без кода — просим ввести номер. */
export function TableScreen() {
  const { t, lang, setLang } = usePrefs();
  const { table, setTable, go } = useApp();
  const [val, setVal] = useState(table ? String(table) : '');
  const n = Number(val);
  const valid = Number.isInteger(n) && n >= 1 && n <= TABLE_COUNT;

  const start = (num: number) => {
    setTable(num);
    go({ name: 'home' });
  };

  return (
    <section className="m-screen">
      <div className="m-scroll m-pad">
        <div className="m-top m-top--plain">
          <span />
          <button type="button" className="m-lang" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}>
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
        </div>
        <div className="m-scan">
          <div className="m-scan-qr">
            <FakeQr seed="table-sign" size={150} />
            <span className="m-scan-frame" aria-hidden="true" />
          </div>
          <h1>{t(A.scanTitle)}</h1>
          <p className="m-muted">{t(A.scanLead)}</p>
        </div>

        <form
          className="m-table-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) start(n);
          }}
        >
          <label htmlFor="m-table">{t(A.orType)}</label>
          <div className="m-table-row">
            <input
              id="m-table"
              className={`m-input m-input--big${val && !valid ? ' is-bad' : ''}`}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              placeholder="14"
              value={val}
              onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 2))}
              aria-describedby="m-table-hint"
            />
            <button type="submit" className="m-btn m-btn--primary grow" disabled={!valid}>
              {t(A.start)}
              <Icon name="next" size={22} />
            </button>
          </div>
          <span id="m-table-hint" className={`m-hint${val && !valid ? ' is-bad' : ''}`}>
            {t(A.tableRange)} {TABLE_COUNT}
          </span>
        </form>

        {valid && (
          <div className="m-table-map">
            <span className="m-label">{t(A.thisTable)}</span>
            <FloorMap mode="locate" scale={0.3} myTable={n} />
          </div>
        )}

        {!valid && (
          <button type="button" className="m-link" onClick={() => start(14)}>
            {t(A.demoTable)}
          </button>
        )}
      </div>
    </section>
  );
}
