import { Sheet } from './Sheet';
import { Icon } from './Icon';
import { usePrefs } from '../state/prefs';
import { S } from '../i18n';

function Toggle({ icon, label, hint, on, set }: { icon: string; label: string; hint?: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button type="button" className={`toggle-row${on ? ' is-on' : ''}`} role="switch" aria-checked={on} onClick={() => set(!on)}>
      <span className="toggle-ico">
        <Icon name={icon} size={40} />
      </span>
      <span className="toggle-text">
        <span className="toggle-label">{label}</span>
        {hint && <span className="toggle-hint">{hint}</span>}
      </span>
      <span className="switch" aria-hidden="true">
        <span className="switch-knob">{on && <Icon name="check" size={24} stroke={3.4} />}</span>
      </span>
    </button>
  );
}

export function A11yPanel({ onClose }: { onClose: () => void }) {
  const p = usePrefs();
  return (
    <Sheet onClose={onClose} label={p.t(S.a11y)}>
      <div className="sheet-head">
        <h2>{p.t(S.a11y)}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label={p.t(S.close)}>
          <Icon name="close" size={36} />
        </button>
      </div>
      <div className="toggle-list">
        <Toggle icon="text" label={p.t(S.a11yLarge)} on={p.large} set={p.setLarge} />
        <Toggle icon="contrast" label={p.t(S.a11yContrast)} on={p.contrast} set={p.setContrast} />
        <Toggle icon="down" label={p.t(S.a11yLow)} hint={p.t(S.a11yLowHint)} on={p.low} set={p.setLow} />
        <Toggle icon="globe" label="English" on={p.lang === 'en'} set={(v) => p.setLang(v ? 'en' : 'ru')} />
      </div>
    </Sheet>
  );
}
