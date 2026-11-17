import type { RestaurantId } from '../types';
import { byId } from '../data/restaurants';

const KEY = 'fc.counters';

const read = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};

/** Следующий код выдачи ресторана: префикс + 3 цифры. У каждого ресторана свой счётчик — номера между ресторанами могут совпадать. */
export const nextCode = (rid: RestaurantId) => {
  const counters = read();
  const prev = counters[rid] ?? 20 + Math.floor(Math.random() * 60);
  const n = (prev % 999) + 1;
  counters[rid] = n;
  try {
    localStorage.setItem(KEY, JSON.stringify(counters));
  } catch {
    /* приватный режим — ок */
  }
  return `${byId[rid].codePrefix}-${String(n).padStart(3, '0')}`;
};

export const splitCode = (code: string) => {
  const [prefix, num] = code.split('-');
  return { prefix, num };
};
