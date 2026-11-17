import { useMemo, type CSSProperties } from 'react';
import type { MenuItem, ModGroup, Restaurant } from '../../types';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { Stepper } from '../../components/Stepper';
import { usePrefs } from '../../state/prefs';
import { useItemConfig } from '../../lib/useItemConfig';
import { S, money } from '../../i18n';

export function ItemSheet({ r, item, onClose, onAdded }: { r: Restaurant; item: MenuItem; onClose: () => void; onAdded: (name: string) => void }) {
  const { t } = usePrefs();
  const { combo, setCombo, sel, toggle, qty, setQty, flash, bodyRef, unit, missing, submit: add } = useItemConfig(r, item);
  const vars = { '--brand': r.brand, '--on-brand': r.onBrand, '--ui': r.ui } as CSSProperties;

  const submit = () => {
    if (add()) onAdded(t(item.name));
  };

  const reqText = (g: ModGroup) =>
    g.required ? t(S.required) : g.type === 'multi' && g.max ? `${t(S.optional)} · ${t(S.upTo)} ${g.max}` : t(S.optional);

  const renderGroup = (g: ModGroup) => {
    const cur = sel[g.id] ?? [];
    const full = g.type === 'multi' && !!g.max && cur.length >= g.max;
    return (
      <fieldset key={g.id} className={`mod-group${flash === g.id ? ' is-flash' : ''}`} data-group={g.id}>
        <legend>
          <span>{t(g.title)}</span>
          <span className={`mod-req${g.required && !cur.length ? ' is-missing' : ''}`}>{reqText(g)}</span>
        </legend>
        <div className="mod-options" role={g.type === 'single' ? 'radiogroup' : 'group'} aria-label={t(g.title)}>
          {g.options.map((o) => {
            const on = cur.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                role={g.type === 'single' ? 'radio' : 'checkbox'}
                aria-checked={on}
                disabled={!on && full}
                className={`mod-opt mod-opt--${g.type}${on ? ' is-on' : ''}`}
                onClick={() => toggle(g, o.id)}
              >
                <span className="mod-mark" aria-hidden="true">
                  {on && <Icon name="check" size={26} stroke={3.4} />}
                </span>
                <span className="mod-name">{t(o.name)}</span>
                {o.price > 0 && <span className="mod-price">+{money(o.price)}</span>}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  };

  const baseGroups = useMemo(() => item.groups ?? [], [item]);

  return (
    <Sheet onClose={onClose} label={t(item.name)} className="item-sheet">
      <div style={vars} className="item-sheet-inner">
        <button type="button" className="icon-btn sheet-close" onClick={onClose} aria-label={t(S.close)}>
          <Icon name="close" size={40} />
        </button>
        <div className="item-sheet-body" ref={bodyRef}>
          <div className="item-hero" aria-hidden="true">
            <span>{item.emoji}</span>
          </div>
          <h2 className="item-title">{t(item.name)}</h2>
          <p className="item-lead">
            {t(item.desc)}
            {item.kcal ? <span className="item-kcal"> · {item.kcal} {t(S.kcal)}</span> : null}
          </p>

          {baseGroups.map(renderGroup)}

          {item.combo && (
            <button type="button" role="switch" aria-checked={combo} className={`combo-card${combo ? ' is-on' : ''}`} onClick={() => setCombo(!combo)}>
              <span className="combo-ico" aria-hidden="true">🍟🥤</span>
              <span className="combo-text">
                <span className="combo-title">
                  {t(S.makeCombo)} <strong>+{money(item.combo.price)}</strong>
                </span>
                <span className="combo-hint">{t(S.comboHint)}</span>
              </span>
              <span className="switch" aria-hidden="true">
                <span className="switch-knob">{combo && <Icon name="check" size={24} stroke={3.4} />}</span>
              </span>
            </button>
          )}
          {combo && item.combo?.groups.map(renderGroup)}
        </div>

        <div className="item-sheet-foot">
          <Stepper value={qty} min={1} onChange={setQty} label={t(S.items)} big />
          <button type="button" className={`btn btn-brand btn-xl grow${missing.length ? ' is-soft' : ''}`} onClick={submit}>
            {missing.length ? (
              <span>
                {t(S.chooseRequired)}: {t(missing[0].title).toLowerCase()}
              </span>
            ) : (
              <>
                <span>{t(S.addToCart)}</span>
                <span className="btn-price" aria-live="polite">
                  {money(unit * qty)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
