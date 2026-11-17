import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '../types';

const KEY = 'fc.orders';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('fc-orders') : null;
const listeners = new Set<() => void>();

const load = (): Order[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

let cache: Order[] = load();

const emit = () => listeners.forEach((l) => l());

const save = (list: Order[], broadcast = true) => {
  const now = Date.now();
  // Выданные заказы держим ещё 2 минуты, потом чистим
  cache = list.filter((o) => o.doneAt > now - 120_000);
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  if (broadcast) channel?.postMessage('changed');
  emit();
};

const reload = () => {
  cache = load();
  emit();
};

channel?.addEventListener('message', reload);
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) reload();
  });
}

export const ordersStore = {
  all: () => cache,
  add: (orders: Order[]) => save([...cache, ...orders]),
  update: (id: string, patch: Partial<Order>) => save(cache.map((o) => (o.id === id ? { ...o, ...patch } : o))),
  clear: () => save([]),
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export const statusOf = (o: Order, now: number): OrderStatus => {
  if (now < o.readyAt) return 'cooking';
  if (now < o.doneAt) return o.mode === 'table' ? 'delivering' : 'ready';
  return 'done';
};

/** Переключение статуса вручную (клик по коду на табло) */
export const advanceOrder = (o: Order) => {
  const now = Date.now();
  const st = statusOf(o, now);
  if (st === 'cooking') ordersStore.update(o.id, { readyAt: now, doneAt: Math.max(o.doneAt, now + 60_000) });
  else if (st === 'ready' || st === 'delivering') ordersStore.update(o.id, { doneAt: now });
};

export const useOrders = () => {
  const [list, setList] = useState(ordersStore.all());
  useEffect(() => ordersStore.subscribe(() => setList(ordersStore.all())), []);
  return list;
};

export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
};
