import type { MenuCategory } from '../../types';
import { l } from '../../i18n';
import { comboDrink, comboSide, drinkSize, o, sauces, single } from './_shared';

const combo = { price: 149, groups: [comboSide([['fries', 'Картофель фри', 'Fries'], ['coleslaw', 'Салат коул-слоу', 'Coleslaw'], ['corn', 'Кукуруза', 'Corn']]), comboDrink] };

export const rosticsMenu: MenuCategory[] = [
  {
    id: 'chicken',
    title: l('Курица', 'Chicken'),
    items: [
      { id: 'wings', name: l('Острые крылья', 'Hot wings'), desc: l('Острые, в хрустящей панировке', 'Spicy, extra crispy'), price: 189, emoji: '🍗', kcal: 380, tags: ['spicy', 'hit'], groups: [single('count', 'Количество', 'Pieces', [o('6', '6 шт', '6 pcs'), o('9', '9 шт', '9 pcs', 90), o('12', '12 шт', '12 pcs', 170)], { defaultId: '6' }), sauces()], combo },
      { id: 'strips', name: l('Стрипсы', 'Strips'), desc: l('Филе в оригинальной панировке', 'Fillet in original breading'), price: 199, emoji: '🍗', kcal: 340, groups: [single('count', 'Количество', 'Pieces', [o('3', '3 шт', '3 pcs'), o('5', '5 шт', '5 pcs', 110)], { defaultId: '3' }), sauces('sauce', true)], combo },
      { id: 'drums', name: l('Ножки', 'Drumsticks'), desc: l('3 штуки', '3 pieces'), price: 229, emoji: '🍗', kcal: 420, combo },
      { id: 'basket', name: l('Баскет S', 'Basket S'), desc: l('Крылья, стрипсы, ножки — на компанию', 'Wings, strips, drumsticks — to share'), price: 599, emoji: '🧺', groups: [sauces()] },
    ],
  },
  {
    id: 'burgers',
    title: l('Бургеры и твистеры', 'Burgers & twisters'),
    items: [
      { id: 'twister', name: l('Твистер', 'Twister'), desc: l('Стрипсы, томаты, салат в лаваше', 'Strips, tomato, lettuce in a wrap'), price: 219, emoji: '🌯', groups: [single('style', 'Вариант', 'Style', [o('orig', 'Оригинальный', 'Original'), o('hot', 'Острый', 'Hot')], { defaultId: 'orig' })], combo },
      { id: 'chefburger', name: l('Шефбургер', 'Chef burger'), desc: l('Филе, салат, соус', 'Fillet, lettuce, sauce'), price: 189, emoji: '🍔', combo },
    ],
  },
  {
    id: 'drinks',
    title: l('Напитки', 'Drinks'),
    items: [
      { id: 'cola', name: l('Кола', 'Cola'), desc: l('Со льдом', 'With ice'), price: 99, emoji: '🥤', groups: [drinkSize] },
      { id: 'tea', name: l('Холодный чай', 'Iced tea'), desc: l('Лимон', 'Lemon'), price: 109, emoji: '🧋', groups: [drinkSize] },
    ],
  },
];
