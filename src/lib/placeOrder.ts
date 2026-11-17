import type { CartLine, FulfillmentMode, Order, RestaurantId } from '../types';
import type { LoyaltyAccount } from './price';
import { discountFor, groupCart } from './price';
import { nextCode } from './codes';
import { ordersStore } from '../state/orders';

/** Создаёт по заказу на каждый ресторан из корзины. Время готовки ускорено для демо (20–40 с). */
export function placeOrders(
  lines: CartLine[],
  mode: FulfillmentMode,
  table: number | null,
  accounts: Partial<Record<RestaurantId, LoyaltyAccount>>,
): Order[] {
  const now = Date.now();
  const orders = groupCart(lines).map((g, i) => {
    const readyAt = now + 20_000 + Math.random() * 20_000 + i * 3000;
    return {
      id: `${now.toString(36)}-${g.restaurant.id}`,
      restaurantId: g.restaurant.id,
      code: nextCode(g.restaurant.id),
      mode,
      table: mode === 'table' ? table ?? undefined : undefined,
      itemsCount: g.count,
      total: g.subtotal - discountFor(g, accounts[g.restaurant.id]),
      createdAt: now,
      readyAt,
      doneAt: readyAt + (mode === 'table' ? 40_000 : 90_000),
    } satisfies Order;
  });
  ordersStore.add(orders);
  return orders;
}
