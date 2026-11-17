import { useEffect } from 'react';
import { CartProvider } from '../state/cart';
import { PrefsProvider } from '../state/prefs';
import { AppStateProvider, useApp } from './appState';
import { TableScreen } from './screens/TableScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RestaurantScreen } from './screens/RestaurantScreen';
import { CartScreen } from './screens/CartScreen';
import { TrackScreen } from './screens/TrackScreen';
import { FulfillmentScreen } from './screens/FulfillmentScreen';
import { TablePickScreen } from './screens/TablePickScreen';
import { LoyaltyScreen } from './screens/LoyaltyScreen';
import { PaymentScreen } from './screens/PaymentScreen';
import { CodesScreen } from './screens/CodesScreen';
import '../styles/mobile.css';

function Screens() {
  const { screen } = useApp();
  switch (screen.name) {
    case 'table':
      return <TableScreen />;
    case 'home':
      return <HomeScreen />;
    case 'rest':
      return <RestaurantScreen key={screen.rid} rid={screen.rid} />;
    case 'cart':
      return <CartScreen />;
    case 'fulfillment':
      return <FulfillmentScreen />;
    case 'tablePick':
      return <TablePickScreen />;
    case 'loyalty':
      return <LoyaltyScreen />;
    case 'payment':
      return <PaymentScreen />;
    case 'codes':
      return <CodesScreen orderIds={screen.orderIds} />;
    case 'track':
      return <TrackScreen />;
  }
}

/** Приложение для заказа за столом: гость сканирует QR на столе (#/app?table=14), заказ всегда приносят к столу */
export function MobileApp() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.surface = 'app';
    return () => {
      delete root.dataset.surface;
    };
  }, []);
  return (
    <PrefsProvider>
      <CartProvider>
        <AppStateProvider>
          <div className="m-stage">
            <div className="m-phone">
              <Screens />
            </div>
            <aside className="m-demo">
              <a href="#/display" target="_blank" rel="noreferrer">
                Табло выдачи ↗
              </a>
              <a href="#/kiosk">Терминал</a>
              <a href="#/">← Эксперимент</a>
            </aside>
          </div>
        </AppStateProvider>
      </CartProvider>
    </PrefsProvider>
  );
}
