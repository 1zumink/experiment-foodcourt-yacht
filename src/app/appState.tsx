import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FulfillmentMode, RestaurantId } from '../types';
import type { LoyaltyState } from '../state/session';

export type AppScreen =
  | { name: 'table' }
  | { name: 'home' }
  | { name: 'rest'; rid: RestaurantId }
  | { name: 'cart' }
  | { name: 'fulfillment' }
  | { name: 'tablePick' }
  | { name: 'loyalty' }
  | { name: 'payment' }
  | { name: 'codes'; orderIds: string[] }
  | { name: 'track' };

interface AppState {
  screen: AppScreen;
  go: (s: AppScreen) => void;
  table: number | null;
  setTable: (n: number) => void;
  mode: FulfillmentMode;
  setMode: (m: FulfillmentMode) => void;
  homeView: 'list' | 'map';
  setHomeView: (v: 'list' | 'map') => void;
  myOrders: string[];
  addMyOrders: (ids: string[]) => void;
  loyalty: LoyaltyState;
  setLoyalty: (l: LoyaltyState) => void;
}

const ORDERS_KEY = 'fc.app.myOrders';
const TABLE_KEY = 'fc.app.table';

const readJson = <T,>(storage: Storage | undefined, key: string, fallback: T): T => {
  try {
    const v = storage?.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (storage: Storage | undefined, key: string, v: unknown) => {
  try {
    storage?.setItem(key, JSON.stringify(v));
  } catch {
    /* приватный режим */
  }
};

/** Стол приходит из QR (#/app?table=14), иначе — из сессии, иначе спрашиваем */
const tableFromUrl = () => {
  const q = window.location.hash.split('?')[1];
  const n = Number(new URLSearchParams(q).get('table'));
  return Number.isInteger(n) && n > 0 ? n : null;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [table, setTableState] = useState<number | null>(() => tableFromUrl() ?? readJson<number | null>(sessionStorage, TABLE_KEY, null));
  const [screen, setScreen] = useState<AppScreen>(() => (table ? { name: 'home' } : { name: 'table' }));
  const [mode, setMode] = useState<FulfillmentMode>('table');
  const [homeView, setHomeView] = useState<'list' | 'map'>('list');
  const [myOrders, setMyOrders] = useState<string[]>(() => readJson<string[]>(localStorage, ORDERS_KEY, []));
  const [loyalty, setLoyalty] = useState<LoyaltyState>({ phone: '', looked: false, accounts: {} });

  useEffect(() => writeJson(sessionStorage, TABLE_KEY, table), [table]);
  useEffect(() => writeJson(localStorage, ORDERS_KEY, myOrders.slice(-20)), [myOrders]);

  const go = useCallback((s: AppScreen) => {
    setScreen(s);
    document.querySelector('.m-scroll')?.scrollTo({ top: 0 });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      screen,
      go,
      table,
      setTable: setTableState,
      mode,
      setMode,
      homeView,
      setHomeView,
      myOrders,
      addMyOrders: (ids) => setMyOrders((cur) => [...cur, ...ids]),
      loyalty,
      setLoyalty,
    }),
    [screen, go, table, mode, homeView, myOrders, loyalty],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('AppStateProvider missing');
  return v;
};
