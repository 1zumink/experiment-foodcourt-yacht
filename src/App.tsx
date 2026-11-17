import { lazy, Suspense, useEffect, useState } from 'react';
import { PrefsProvider, usePrefs } from './state/prefs';
import { CartProvider } from './state/cart';
import { SessionProvider, useSession } from './state/session';
import { KioskFrame } from './components/KioskFrame';
import { IdleGuard } from './components/IdleGuard';
import { Icon } from './components/Icon';
import { MapScreen } from './screens/kiosk/MapScreen';
import { MenuScreen } from './screens/kiosk/MenuScreen';
import { CartScreen } from './screens/kiosk/CartScreen';
import { FulfillmentScreen } from './screens/kiosk/FulfillmentScreen';
import { LoyaltyScreen } from './screens/kiosk/LoyaltyScreen';
import { PaymentScreen } from './screens/kiosk/PaymentScreen';
import { CodesScreen } from './screens/kiosk/CodesScreen';
import { PickupBoard } from './screens/display/PickupBoard';
import { MobileApp } from './app/MobileApp';
import { S } from './i18n';
import { Hub } from './hub/Hub';

const YachtApp = lazy(() => import('./yacht/YachtApp'));

function Screens() {
  const { screen } = useSession();
  switch (screen.name) {
    case 'map':
      return <MapScreen />;
    case 'menu':
      return <MenuScreen key={screen.rid} rid={screen.rid} />;
    case 'cart':
      return <CartScreen />;
    case 'fulfillment':
      return <FulfillmentScreen />;
    case 'loyalty':
      return <LoyaltyScreen />;
    case 'payment':
      return <PaymentScreen />;
    case 'codes':
      return <CodesScreen orderIds={screen.orderIds} />;
  }
}

function Kiosk() {
  const { t, lang, low, setLow } = usePrefs();
  return (
    <>
      <KioskFrame>
        {low && (
          <div className="low-banner">
            <Icon name="down" size={96} stroke={1.6} />
            <p>{t(S.a11yLowBanner)}</p>
            <button type="button" className="btn btn-ghost" onClick={() => setLow(false)}>
              {t(S.a11yLow)}: {lang === 'ru' ? 'выключить' : 'turn off'}
            </button>
          </div>
        )}
        <Screens />
        <IdleGuard />
      </KioskFrame>
      <nav className="demo-link">
        <a href="#/display" target="_blank" rel="noreferrer">
          Табло выдачи ↗
        </a>
        <a href="#/app?table=14" target="_blank" rel="noreferrer">
          Приложение (стол 14) ↗
        </a>
        <a href="#/">← Эксперимент</a>
      </nav>
    </>
  );
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  if (hash === '' || hash === '#' || hash === '#/') return <Hub />;
  if (hash.startsWith('#/yacht')) {
    return (
      <Suspense fallback={<div className="y-loading">Яхта загружается…</div>}>
        <YachtApp />
      </Suspense>
    );
  }
  if (hash.startsWith('#/app')) return <MobileApp />;
  if (hash.startsWith('#/display')) {
    return (
      <PrefsProvider applyToRoot={false}>
        <PickupBoard />
      </PrefsProvider>
    );
  }
  return (
    <PrefsProvider>
      <CartProvider>
        <SessionProvider>
          <Kiosk />
        </SessionProvider>
      </CartProvider>
    </PrefsProvider>
  );
}
