import type { MenuCategory } from '../../types';
import { l } from '../../i18n';
import { drinkSize, multi, o, single } from './_shared';

const blinFill = multi('fill', 'Начинки', 'Fillings', [
  o('ham', 'Ветчина', 'Ham', 70),
  o('cheese', 'Сыр', 'Cheese', 60),
  o('mush', 'Грибы', 'Mushrooms', 60),
  o('chicken', 'Курица', 'Chicken', 90),
  o('cottage', 'Творог', 'Cottage cheese', 60),
  o('jam', 'Варенье', 'Jam', 40),
  o('condensed', 'Сгущёнка', 'Condensed milk', 40),
  o('sourcream', 'Сметана', 'Sour cream', 30),
], 3);

export const teremokMenu: MenuCategory[] = [
  {
    id: 'blini',
    title: l('Блины', 'Blini'),
    items: [
      { id: 'build', name: l('Блин «Собери сам»', 'Build your blin'), desc: l('Тонкий блин + до 3 начинок', 'Thin crepe + up to 3 fillings'), price: 99, emoji: '🥞', tags: ['hit'], groups: [blinFill] },
      { id: 'ham-cheese', name: l('С ветчиной и сыром', 'Ham & cheese'), desc: l('Горячий, с хрустящей корочкой', 'Hot and crispy'), price: 219, emoji: '🥞', kcal: 390 },
      { id: 'caviar', name: l('С красной икрой', 'With red caviar'), desc: l('И сливочным маслом', 'With butter'), price: 449, emoji: '🥞' },
      { id: 'sweet', name: l('Со сгущёнкой', 'Condensed milk'), desc: l('Сладкий классический', 'Sweet classic'), price: 149, emoji: '🥞', tags: ['veg'] },
    ],
  },
  {
    id: 'soups',
    title: l('Супы и каши', 'Soups & porridge'),
    items: [
      { id: 'borsch', name: l('Борщ', 'Borscht'), desc: l('Со сметаной и зеленью', 'With sour cream and herbs'), price: 249, emoji: '🍲', groups: [single('bread', 'Хлеб', 'Bread', [o('none', 'Без хлеба', 'No bread'), o('rye', 'Бородинский', 'Rye', 20), o('garlic', 'Пампушка с чесноком', 'Garlic bun', 40)], { defaultId: 'none' })] },
      { id: 'solyanka', name: l('Солянка мясная', 'Meat solyanka'), desc: l('С лимоном и оливками', 'With lemon and olives'), price: 289, emoji: '🍲' },
      { id: 'kasha', name: l('Гречка с грибами', 'Buckwheat with mushrooms'), desc: l('С жареным луком', 'With fried onion'), price: 199, emoji: '🍚', tags: ['veg'] },
    ],
  },
  {
    id: 'drinks',
    title: l('Напитки', 'Drinks'),
    items: [
      { id: 'mors', name: l('Морс', 'Mors'), desc: l('Клюква или брусника', 'Cranberry or lingonberry'), price: 99, emoji: '🧃', groups: [drinkSize] },
      { id: 'kvass', name: l('Квас', 'Kvass'), desc: l('Хлебный', 'Bread kvass'), price: 99, emoji: '🍺', groups: [drinkSize] },
      { id: 'tea', name: l('Чай с чабрецом', 'Thyme tea'), desc: l('0,3 л', '0.3 L'), price: 89, emoji: '🍵' },
    ],
  },
];
