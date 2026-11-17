import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { CartLine } from '../types';

type Action =
  | { type: 'add'; line: CartLine }
  | { type: 'qty'; key: string; qty: number }
  | { type: 'clear' };

const reducer = (state: CartLine[], a: Action): CartLine[] => {
  switch (a.type) {
    case 'add': {
      const ex = state.find((l) => l.key === a.line.key);
      if (ex) return state.map((l) => (l.key === a.line.key ? { ...l, qty: l.qty + a.line.qty } : l));
      return [...state, a.line];
    }
    case 'qty':
      return a.qty <= 0 ? state.filter((l) => l.key !== a.key) : state.map((l) => (l.key === a.key ? { ...l, qty: a.qty } : l));
    case 'clear':
      return [];
  }
};

interface Cart {
  lines: CartLine[];
  count: number;
  total: number;
  add: (line: CartLine) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

const Ctx = createContext<Cart | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const value = useMemo<Cart>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * l.unit, 0),
      add: (line) => dispatch({ type: 'add', line }),
      setQty: (key, qty) => dispatch({ type: 'qty', key, qty }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [lines],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('CartProvider missing');
  return v;
};
