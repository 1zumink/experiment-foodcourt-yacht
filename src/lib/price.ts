import type { CartLine, Lang, MenuItem, ModGroup, Restaurant, RestaurantId } from '../types';
import { byId, findItem } from '../data/restaurants';

export const activeGroups = (item: MenuItem, combo: boolean): ModGroup[] => [
  ...(item.groups ?? []),
  ...(combo && item.combo ? item.combo.groups : []),
];

export const defaultSel = (item: MenuItem): Record<string, string[]> => {
  const sel: Record<string, string[]> = {};
  for (const g of item.groups ?? []) if (g.type === 'single' && g.defaultId) sel[g.id] = [g.defaultId];
  return sel;
};

export const unitPrice = (item: MenuItem, combo: boolean, sel: Record<string, string[]>) => {
  let p = item.price + (combo && item.combo ? item.combo.price : 0);
  for (const g of activeGroups(item, combo)) {
    for (const id of sel[g.id] ?? []) p += g.options.find((o) => o.id === id)?.price ?? 0;
  }
  return p;
};

/** Цена «от»: минимальная стоимость с обязательными опциями; from=true, если опции меняют цену */
export const fromPrice = (item: MenuItem) => {
  let price = item.price;
  let from = false;
  for (const g of item.groups ?? []) {
    if (g.type !== 'single' || !(g.required || g.defaultId)) continue;
    const prices = g.options.map((o) => o.price);
    const min = Math.min(...prices);
    if (prices.some((p) => p !== min)) from = true;
    price += min;
  }
  return { price, from };
};

export const missingRequired = (item: MenuItem, combo: boolean, sel: Record<string, string[]>) =>
  activeGroups(item, combo).filter((g) => g.required && !(sel[g.id]?.length));

export const lineKey = (rid: RestaurantId, itemId: string, combo: boolean, sel: Record<string, string[]>) =>
  [rid, itemId, combo ? 'combo' : '', ...Object.keys(sel).sort().map((k) => `${k}=${[...sel[k]].sort().join('+')}`)].join('|');

/** Человекочитаемое описание выбранных опций (без значений по умолчанию с нулевой ценой не скрываем — пусть видно) */
export const describeLine = (line: CartLine, lang: Lang) => {
  const item = findItem(line.restaurantId, line.itemId);
  const parts: string[] = [];
  if (line.combo) parts.push(lang === 'ru' ? 'Комбо' : 'Combo');
  for (const g of activeGroups(item, line.combo)) {
    for (const id of line.sel[g.id] ?? []) {
      const opt = g.options.find((o) => o.id === id);
      if (opt) parts.push(opt.name[lang]);
    }
  }
  return parts.join(', ');
};

export interface CartGroup {
  restaurant: Restaurant;
  lines: CartLine[];
  subtotal: number;
  count: number;
}

export const groupCart = (lines: CartLine[]): CartGroup[] => {
  const map = new Map<RestaurantId, CartGroup>();
  for (const line of lines) {
    let g = map.get(line.restaurantId);
    if (!g) {
      g = { restaurant: byId[line.restaurantId], lines: [], subtotal: 0, count: 0 };
      map.set(line.restaurantId, g);
    }
    g.lines.push(line);
    g.subtotal += line.unit * line.qty;
    g.count += line.qty;
  }
  return [...map.values()];
};

// ——— Лояльность ———

export interface LoyaltyAccount {
  status: 'found' | 'new';
  /** points — баланс баллов; stamps — собранные штампы */
  balance: number;
  use: boolean;
}

export const maxSpend = (g: CartGroup, acc?: LoyaltyAccount) => {
  const lo = g.restaurant.loyalty;
  if (!lo || !acc || lo.kind !== 'points') return 0;
  return Math.min(acc.balance, Math.floor(g.subtotal * (lo.maxSpendShare ?? 0.3)));
};

export const giftAvailable = (g: CartGroup, acc?: LoyaltyAccount) => {
  const lo = g.restaurant.loyalty;
  return !!lo && !!acc && lo.kind === 'stamps' && acc.balance >= (lo.stampsGoal ?? 6) - 1;
};

export const discountFor = (g: CartGroup, acc?: LoyaltyAccount) => {
  if (!acc?.use) return 0;
  const lo = g.restaurant.loyalty;
  if (!lo) return 0;
  if (lo.kind === 'points') return maxSpend(g, acc);
  if (giftAvailable(g, acc)) return Math.min(...g.lines.map((l) => l.unit));
  return 0;
};

export const earnFor = (g: CartGroup, acc?: LoyaltyAccount) => {
  const lo = g.restaurant.loyalty;
  if (!lo || !acc) return 0;
  if (lo.kind === 'points') return Math.floor((g.subtotal - discountFor(g, acc)) * (lo.earnRate ?? 0.05));
  return 1;
};

/** Мок поиска карт по телефону: детерминированно от номера */
export const lookupAccounts = (phone: string, rids: RestaurantId[]) => {
  const out: Partial<Record<RestaurantId, LoyaltyAccount>> = {};
  for (const rid of rids) {
    const lo = byId[rid].loyalty;
    if (!lo) continue;
    let h = 7;
    for (const ch of phone + rid) h = (h * 31 + ch.charCodeAt(0)) % 100003;
    if (h % 5 === 0) out[rid] = { status: 'new', balance: 0, use: false };
    else if (lo.kind === 'points') out[rid] = { status: 'found', balance: 80 + (h % 520), use: true };
    else out[rid] = { status: 'found', balance: 3 + (h % 3), use: true };
  }
  return out;
};
