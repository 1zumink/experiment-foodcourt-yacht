export type Lang = 'ru' | 'en';
/** Локализованная строка */
export type L = { ru: string; en: string };

export type RestaurantId =
  | 'vkusno'
  | 'bk'
  | 'kroshka'
  | 'franklins'
  | 'farsh'
  | 'teremok'
  | 'rostics'
  | 'dodo';

export interface ModOption {
  id: string;
  name: L;
  price: number;
}

export interface ModGroup {
  id: string;
  title: L;
  type: 'single' | 'multi';
  required?: boolean;
  /** Для multi — максимум выбранных опций */
  max?: number;
  /** Для single — опция, выбранная по умолчанию */
  defaultId?: string;
  options: ModOption[];
}

export type ItemTag = 'hit' | 'new' | 'spicy' | 'veg';

export interface MenuItem {
  id: string;
  name: L;
  desc: L;
  price: number;
  emoji: string;
  kcal?: number;
  tags?: ItemTag[];
  groups?: ModGroup[];
  /** Комбо: доплата и группы, которые становятся активны при включении */
  combo?: { price: number; groups: ModGroup[] };
}

export interface MenuCategory {
  id: string;
  title: L;
  items: MenuItem[];
}

export interface Loyalty {
  name: L;
  /** points — баллы 1 балл = 1 ₽; stamps — штампы, каждый N-й заказ подарок */
  kind: 'points' | 'stamps';
  /** points: доля начисления от суммы */
  earnRate?: number;
  /** points: максимальная доля суммы, которую можно оплатить баллами */
  maxSpendShare?: number;
  /** stamps: сколько штампов нужно для подарка */
  stampsGoal?: number;
}

export interface LogoPart {
  src: string;
  /** Позиция и размер внутри логотипа, px в масштабе макета */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Кадрирование картинки (проценты от размера части), как в Figma */
  img?: { left: number; top: number; width: number; height: number };
  round?: boolean;
}

export interface LogoSpec {
  w: number;
  h: number;
  parts: LogoPart[];
}

export interface Restaurant {
  id: RestaurantId;
  name: string;
  tagline: L;
  /** Фон панели на карте и плиток логотипа */
  brand: string;
  /** Цвет текста на brand */
  onBrand: string;
  /** Цвет кнопок/акцентов на белом, проходит контраст 4.5:1 с белым текстом */
  ui: string;
  codePrefix: string;
  loyalty: Loyalty | null;
  logo: LogoSpec;
  /** Панель на карте фудкорта (координаты макета 1080×1920) */
  map: { x: number; y: number; w: number; h: number; radius: string; logoX: number; logoY: number };
  menu: MenuCategory[];
}

export interface CartLine {
  key: string;
  restaurantId: RestaurantId;
  itemId: string;
  qty: number;
  combo: boolean;
  /** groupId → выбранные optionId */
  sel: Record<string, string[]>;
  unit: number;
}

export type FulfillmentMode = 'pickup' | 'table';

export interface Order {
  id: string;
  restaurantId: RestaurantId;
  code: string;
  mode: FulfillmentMode;
  table?: number;
  itemsCount: number;
  total: number;
  createdAt: number;
  readyAt: number;
  doneAt: number;
}

export type OrderStatus = 'cooking' | 'ready' | 'delivering' | 'done';
