import type { ModGroup, ModOption } from '../../types';
import { l } from '../../i18n';

export const o = (id: string, ru: string, en: string, price = 0): ModOption => ({ id, name: l(ru, en), price });

export const single = (
  id: string,
  ru: string,
  en: string,
  options: ModOption[],
  opts: { required?: boolean; defaultId?: string } = {},
): ModGroup => ({ id, title: l(ru, en), type: 'single', options, required: opts.required ?? true, defaultId: opts.defaultId });

export const multi = (id: string, ru: string, en: string, options: ModOption[], max?: number): ModGroup => ({
  id,
  title: l(ru, en),
  type: 'multi',
  options,
  max,
});

const sauceOptions: ModOption[] = [
  o('bbq', 'Барбекю', 'BBQ'),
  o('cheese', 'Сырный', 'Cheese'),
  o('sweet', 'Кисло-сладкий', 'Sweet & sour'),
  o('garlic', 'Чесночный', 'Garlic'),
  o('chili', 'Острый чили', 'Hot chili'),
];

export const sauces = (id = 'sauce', required = false): ModGroup =>
  required
    ? single(id, 'Соус', 'Sauce', sauceOptions, { required: true })
    : multi(id, 'Соусы', 'Sauces', sauceOptions.map((x) => ({ ...x, price: 39 })), 2);

export const drinkSize = single('size', 'Объём', 'Size', [
  o('s', '0,3 л', '0.3 L', 0),
  o('m', '0,4 л', '0.4 L', 30),
  o('l', '0,5 л', '0.5 L', 60),
], { defaultId: 's' });

export const comboSide = (sides: [string, string, string][]) =>
  single('combo-side', 'Гарнир в комбо', 'Combo side', sides.map(([id, ru, en]) => o(id, ru, en)));

export const comboDrink = single('combo-drink', 'Напиток в комбо', 'Combo drink', [
  o('cola', 'Кола 0,4', 'Cola 0.4'),
  o('cola-zero', 'Кола без сахара 0,4', 'Cola Zero 0.4'),
  o('lemonade', 'Лимонад 0,4', 'Lemonade 0.4'),
  o('tea', 'Холодный чай 0,4', 'Iced tea 0.4'),
  o('water', 'Вода 0,5', 'Water 0.5'),
]);

export const burgerExtras = multi('extras', 'Добавить', 'Extras', [
  o('cheese', 'Сыр чеддер', 'Cheddar', 40),
  o('bacon', 'Бекон', 'Bacon', 70),
  o('jalapeno', 'Халапеньо', 'Jalapeño', 40),
  o('patty', 'Ещё котлета', 'Extra patty', 120),
], 4);

export const burgerRemove = multi('remove', 'Убрать', 'Remove', [
  o('no-onion', 'Без лука', 'No onion'),
  o('no-pickles', 'Без огурцов', 'No pickles'),
  o('no-sauce', 'Без соуса', 'No sauce'),
]);
