import { useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { A11yPanel } from './A11yPanel';
import { usePrefs } from '../state/prefs';
import { useCart } from '../state/cart';
import { useSession } from '../state/session';
import { S, money } from '../i18n';

/** Нижняя панель: доступность и язык всегда под рукой, справа — главное действие экрана */
export function BottomBar({ children }: { children?: ReactNode }) {
  const { t, lang, setLang } = usePrefs();
  const [open, setOpen] = useState(false);
  return (
    <footer className="bottombar">
      <div className="bottombar-tools">
        <button type="button" className="tool-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <Icon name="a11y" size={40} />
          <span>{t(S.a11y)}</span>
        </button>
        <button type="button" className="tool-btn" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} lang={lang === 'ru' ? 'en' : 'ru'}>
          <Icon name="globe" size={40} />
          <span>{t(S.langSwitch)}</span>
        </button>
      </div>
      <div className="bottombar-main">{children}</div>
      {open && <A11yPanel onClose={() => setOpen(false)} />}
    </footer>
  );
}

export function CartButton() {
  const { t } = usePrefs();
  const { count, total } = useCart();
  const { go } = useSession();
  return (
    <button type="button" className="btn btn-primary btn-xl cart-cta" onClick={() => go({ name: 'cart' })}>
      <span className="cart-cta-ico">
        <Icon name="cart" size={40} />
        <span className="cart-cta-count">{count}</span>
      </span>
      <span className="cart-cta-label">{t(S.cart)}</span>
      <span className="cart-cta-total" aria-live="polite">
        {money(total)}
      </span>
      <Icon name="next" size={36} />
    </button>
  );
}
