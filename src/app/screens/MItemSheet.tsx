import type { CSSProperties } from 'react';
import type { MenuItem, ModGroup, Restaurant } from '../../types';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { usePrefs } from '../../state/prefs';
import { useItemConfig } from '../../lib/useItemConfig';
import { S, money } from '../../i18n';
import { MStepper } from '../ui';
import { A } from '../strings';

export function MItemSheet({ r, item, onClose, onAdded }: { r: Restaurant; item: MenuItem; onClose: () => void; onAdded: (name: string) => void }) {
  const { t } = usePrefs();
  const c = useItemConfig(r, item);
  const vars = { '--brand': r.brand, '--on-brand': r.onBrand, '--ui': r.ui } as CSSProperties;

  const group = (g: ModGroup) => {
    const cur = c.sel[g.id] ?? [];
    const full = g.type === 'multi' && !!g.max && cur.length >= g.max;
    return (
      <fieldset key={g.id} className={`m-group${c.flash === g.id ? ' is-flash' : ''}`} data-group={g.id}>
        <legend>
          <span>{t(g.title)}</span>
          <span className={`m-req${g.required && !cur.length ? ' is-missing' : ''}`}>
            {g.required ? t(S.required) : g.max ? `${t(S.upTo)} ${g.max}` : t(S.optional)}
          </span>
        </legend>
        <div role={g.type === 'single' ? 'radiogroup' : 'group'} aria-label={t(g.title)}>
          {g.options.map((o) => {
            const on = cur.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                role={g.type === 'single' ? 'radio' : 'checkbox'}
                aria-checked={on}
                disabled={!on && full}
                className={`m-opt m-opt--${g.type}${on ? ' is-on' : ''}`}
                onClick={() => c.toggle(g, o.id)}
              >
                <span className="m-mark" aria-hidden="true">
                  {on && <Icon name="check" size={16} stroke={3.4} />}
                </span>
                <span className="m-opt-name">{t(o.name)}</span>
                {o.price > 0 && <span className="m-opt-price">+{money(o.price)}</span>}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  };

  return (
    <Sheet onClose={onClose} label={t(item.name)} className="m-sheet">
      <div className="m-sheet-inner" style={vars}>
        <button type="button" className="m-icon-btn m-sheet-close" onClick={onClose} aria-label={t(S.close)}>
          <Icon name="close" size={22} />
        </button>
        <div className="m-sheet-body" ref={c.bodyRef}>
          <div className="m-sheet-hero" aria-hidden="true">
            {item.emoji}
          </div>
          <h2 className="m-sheet-title">{t(item.name)}</h2>
          <p className="m-muted">
            {t(item.desc)}
            {item.kcal ? ` · ${item.kcal} ${t(S.kcal)}` : ''}
          </p>
          {(item.groups ?? []).map(group)}
          {item.combo && (
            <button type="button" role="switch" aria-checked={c.combo} className={`m-combo${c.combo ? ' is-on' : ''}`} onClick={() => c.setCombo(!c.combo)}>
              <span aria-hidden="true">🍟🥤</span>
              <span className="m-combo-text">
                <strong>
                  {t(S.makeCombo)} +{money(item.combo.price)}
                </strong>
                <span>{t(S.comboHint)}</span>
              </span>
              <span className="m-switch" aria-hidden="true" />
            </button>
          )}
          {c.combo && item.combo?.groups.map(group)}
        </div>
        <div className="m-sheet-foot">
          <MStepper value={c.qty} min={1} onChange={c.setQty} label={t(S.items)} />
          <button
            type="button"
            className={`m-btn m-btn--brand grow${c.missing.length ? ' is-soft' : ''}`}
            onClick={() => c.submit() && onAdded(t(item.name))}
          >
            {c.missing.length ? (
              `${t(S.chooseRequired)}: ${t(c.missing[0].title).toLowerCase()}`
            ) : (
              <>
                <span>{t(A.addToCart)}</span>
                <span aria-live="polite">{money(c.unit * c.qty)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
