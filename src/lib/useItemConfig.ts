import { useRef, useState } from 'react';
import type { MenuItem, ModGroup, Restaurant } from '../types';
import { useCart } from '../state/cart';
import { activeGroups, defaultSel, lineKey, missingRequired, unitPrice } from './price';

/** Состояние карточки блюда: выбор опций, комбо, количество, проверка обязательных групп. Общее для киоска и приложения. */
export function useItemConfig(r: Restaurant, item: MenuItem) {
  const cart = useCart();
  const [combo, setCombo] = useState(false);
  const [sel, setSel] = useState<Record<string, string[]>>(() => defaultSel(item));
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const groups = activeGroups(item, combo);
  const unit = unitPrice(item, combo, sel);
  const missing = missingRequired(item, combo, sel);

  const toggle = (g: ModGroup, id: string) => {
    setSel((s) => {
      const cur = s[g.id] ?? [];
      if (g.type === 'single') return { ...s, [g.id]: [id] };
      if (cur.includes(id)) return { ...s, [g.id]: cur.filter((x) => x !== id) };
      if (g.max && cur.length >= g.max) return s;
      return { ...s, [g.id]: [...cur, id] };
    });
  };

  /** Добавляет в корзину; если не хватает обязательного выбора — подсвечивает группу и возвращает false */
  const submit = () => {
    if (missing.length) {
      const g = missing[0];
      setFlash(g.id);
      bodyRef.current?.querySelector(`[data-group="${g.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setFlash(null), 1200);
      return false;
    }
    // Чистим выбор от неактивных групп (например, комбо выключили)
    const active = new Set(groups.map((g) => g.id));
    const clean = Object.fromEntries(Object.entries(sel).filter(([k, v]) => active.has(k) && v.length));
    cart.add({ key: lineKey(r.id, item.id, combo, clean), restaurantId: r.id, itemId: item.id, qty, combo, sel: clean, unit });
    return true;
  };

  return { combo, setCombo, sel, toggle, qty, setQty, flash, bodyRef, groups, unit, missing, submit };
}
