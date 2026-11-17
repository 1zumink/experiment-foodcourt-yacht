import { Icon } from './Icon';

export function Stepper({ value, onChange, min = 0, label, big }: { value: number; onChange: (n: number) => void; min?: number; label: string; big?: boolean }) {
  return (
    <div className={`stepper${big ? ' stepper--big' : ''}`} role="group" aria-label={label}>
      <button type="button" className="stepper-btn" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="−1">
        <Icon name={value === 1 && min === 0 ? 'trash' : 'minus'} size={big ? 36 : 30} />
      </button>
      <output className="stepper-val" aria-live="polite">
        {value}
      </output>
      <button type="button" className="stepper-btn" onClick={() => onChange(value + 1)} disabled={value >= 20} aria-label="+1">
        <Icon name="plus" size={big ? 36 : 30} />
      </button>
    </div>
  );
}
