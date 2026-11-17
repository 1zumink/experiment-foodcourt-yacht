import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { FulfillmentMode, RestaurantId } from '../types';
import type { LoyaltyAccount } from '../lib/price';
import { useCart } from './cart';
import { usePrefs } from './prefs';

export type Screen =
  | { name: 'map' }
  | { name: 'menu'; rid: RestaurantId }
  | { name: 'cart' }
  | { name: 'fulfillment' }
  | { name: 'loyalty' }
  | { name: 'payment' }
  | { name: 'codes'; orderIds: string[] };

export interface LoyaltyState {
  phone: string;
  looked: boolean;
  accounts: Partial<Record<RestaurantId, LoyaltyAccount>>;
}

interface Session {
  screen: Screen;
  go: (s: Screen) => void;
  mode: FulfillmentMode | null;
  table: number | null;
  setMode: (m: FulfillmentMode | null) => void;
  setTable: (n: number | null) => void;
  loyalty: LoyaltyState;
  setLoyalty: (l: LoyaltyState) => void;
  reset: () => void;
}

const emptyLoyalty: LoyaltyState = { phone: '', looked: false, accounts: {} };

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const cart = useCart();
  const prefs = usePrefs();
  const [screen, setScreen] = useState<Screen>({ name: 'map' });
  const [mode, setMode] = useState<FulfillmentMode | null>(null);
  const [table, setTable] = useState<number | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyState>(emptyLoyalty);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    // Новый экран — фокус на заголовок, чтобы экранные дикторы прочитали, где мы
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-screen-title]')?.focus());
  }, []);

  const reset = useCallback(() => {
    cart.clear();
    setMode(null);
    setTable(null);
    setLoyalty(emptyLoyalty);
    prefs.resetPrefs();
    setScreen({ name: 'map' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.clear, prefs.resetPrefs]);

  const value = useMemo<Session>(
    () => ({ screen, go, mode, table, setMode, setTable, loyalty, setLoyalty, reset }),
    [screen, go, mode, table, loyalty, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('SessionProvider missing');
  return v;
};
