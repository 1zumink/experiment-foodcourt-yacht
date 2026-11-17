import type { MenuCategory } from '../../types';
import { l } from '../../i18n';
import { drinkSize, multi, o, single } from './_shared';

const fillings = multi('fill', 'Начинки', 'Fillings', [
  o('cheese', 'Сыр', 'Cheese', 60),
  o('bacon', 'Бекон с луком', 'Bacon & onion', 110),
  o('mush', 'Грибы со сметаной', 'Mushrooms & sour cream', 110),
  o('chicken', 'Курица в соусе', 'Chicken in sauce', 130),
  o('salmon', 'Сёмга с огурцом', 'Salmon & cucumber', 190),
  o('cabbage', 'Капустный салат', 'Coleslaw', 70),
  o('dill', 'Сливочное масло с укропом', 'Dill butter', 30),
], 3);

export const kroshkaMenu: MenuCategory[] = [
  {
    id: 'potato',
    title: l('Картошка', 'Baked potato'),
    items: [
      { id: 'build', name: l('Картошка «Собери сам»', 'Build your potato'), desc: l('Печёный картофель со сливочным маслом и сыром + до 3 начинок', 'Baked potato with butter and cheese + up to 3 fillings'), price: 219, emoji: '🥔', kcal: 420, tags: ['hit'], groups: [fillings] },
      { id: 'classic', name: l('С маслом и сыром', 'Butter & cheese'), desc: l('Классика', 'The classic'), price: 189, emoji: '🥔', kcal: 380, tags: ['veg'] },
      { id: 'mush', name: l('С грибами', 'With mushrooms'), desc: l('Шампиньоны в сметане', 'Champignons in sour cream'), price: 299, emoji: '🍄', kcal: 450, tags: ['veg'] },
      { id: 'salmon', name: l('С сёмгой', 'With salmon'), desc: l('Слабосолёная сёмга, огурец, сливочный соус', 'Cured salmon, cucumber, cream sauce'), price: 389, emoji: '🐟', kcal: 470 },
    ],
  },
  {
    id: 'soups',
    title: l('Супы и салаты', 'Soups & salads'),
    items: [
      { id: 'cream', name: l('Суп-пюре грибной', 'Mushroom cream soup'), desc: l('С гренками', 'With croutons'), price: 199, emoji: '🍲', tags: ['veg'] },
      { id: 'salad', name: l('Салат с курицей', 'Chicken salad'), desc: l('Овощи, курица, заправка', 'Veggies, chicken, dressing'), price: 229, emoji: '🥗', groups: [single('dress', 'Заправка', 'Dressing', [o('oil', 'Масло', 'Oil'), o('sour', 'Сметана', 'Sour cream')])] },
    ],
  },
  {
    id: 'drinks',
    title: l('Напитки', 'Drinks'),
    items: [
      { id: 'mors', name: l('Морс клюквенный', 'Cranberry mors'), desc: l('Домашний', 'Homemade'), price: 89, emoji: '🧃', groups: [drinkSize] },
      { id: 'tea', name: l('Чай', 'Tea'), desc: l('Чёрный или зелёный', 'Black or green'), price: 69, emoji: '🍵', groups: [single('kind', 'Чай', 'Tea', [o('black', 'Чёрный', 'Black'), o('green', 'Зелёный', 'Green')], { defaultId: 'black' })] },
    ],
  },
];
