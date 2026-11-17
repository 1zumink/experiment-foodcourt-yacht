import { Icon } from './Icon';

export function Numpad({ onDigit, onBack, label }: { onDigit: (d: string) => void; onBack: () => void; label: string }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];
  return (
    <div className="numpad" role="group" aria-label={label}>
      {keys.map((k, i) =>
        k === '' ? (
          <span key={i} />
        ) : k === 'back' ? (
          <button key={i} type="button" className="numpad-key" onClick={onBack} aria-label="Backspace">
            <Icon name="backspace" size={40} />
          </button>
        ) : (
          <button key={i} type="button" className="numpad-key" onClick={() => onDigit(k)}>
            {k}
          </button>
        ),
      )}
    </div>
  );
}
