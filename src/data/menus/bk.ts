import type { MenuCategory } from '../../types';
import { l } from '../../i18n';
import { burgerExtras, burgerRemove, comboDrink, comboSide, drinkSize, sauces } from './_shared';

const combo = { price: 169, groups: [comboSide([['fries', 'Картофель фри', 'Fries'], ['rings', 'Луковые кольца', 'Onion rings'], ['rustic', 'Картофель по-деревенски', 'Rustic potatoes']]), comboDrink] };

export const bkMenu: MenuCategory[] = [
  {
    id: 'burgers',
    title: l('Бургеры с грилем', 'Flame-grilled'),
    items: [
      { id: 'flame', name: l('Флейм бургер', 'Flame burger'), desc: l('Говядина на огне, томаты, салат, лук, майонез', 'Flame-grilled beef, tomato, lettuce, onion, mayo'), price: 299, emoji: '🍔', kcal: 640, tags: ['hit'], groups: [burgerExtras, burgerRemove], combo },
      { id: 'double-flame', name: l('Двойной флейм', 'Double flame'), desc: l('Две котлеты на гриле', 'Two flame-grilled patties'), price: 389, emoji: '🍔', kcal: 900, groups: [burgerExtras, burgerRemove], combo },
      { id: 'angry', name: l('Огненный бургер', 'Angry burger'), desc: l('Халапеньо, острый соус, луковые кольца', 'Jalapeño, hot sauce, onion rings'), price: 329, emoji: '🌶️', kcal: 700, tags: ['spicy'], groups: [burgerExtras, burgerRemove], combo },
      { id: 'long-chicken', name: l('Лонг чикен', 'Long chicken'), desc: l('Куриная котлета в длинной булке', 'Chicken patty in a long bun'), price: 219, emoji: '🥖', kcal: 520, groups: [burgerRemove], combo },
    ],
  },
  {
    id: 'snacks',
    title: l('Закуски', 'Snacks'),
    items: [
      { id: 'nuggets', name: l('Наггетсы, 9 шт', 'Nuggets, 9 pcs'), desc: l('Соус на выбор — обязательно', 'Choose a dipping sauce'), price: 189, emoji: '🍗', kcal: 410, groups: [sauces('sauce', true)] },
      { id: 'rings', name: l('Луковые кольца', 'Onion rings'), desc: l('9 штук', '9 pieces'), price: 129, emoji: '🧅', kcal: 320, tags: ['veg'] },
      { id: 'fries', name: l('Картофель фри', 'Fries'), desc: l('Стандартная порция', 'Regular portion'), price: 99, emoji: '🍟', kcal: 330, tags: ['veg'] },
    ],
  },
  {
    id: 'drinks',
    title: l('Напитки и десерты', 'Drinks & desserts'),
    items: [
      { id: 'cola', name: l('Кола', 'Cola'), desc: l('Со льдом', 'With ice'), price: 99, emoji: '🥤', groups: [drinkSize] },
      { id: 'shake', name: l('Молочный коктейль', 'Milkshake'), desc: l('Ванильный или шоколадный', 'Vanilla or chocolate'), price: 159, emoji: '🥛', groups: [{ ...drinkSize, id: 'taste', title: l('Вкус', 'Flavour'), defaultId: 'van', options: [{ id: 'van', name: l('Ваниль', 'Vanilla'), price: 0 }, { id: 'choc', name: l('Шоколад', 'Chocolate'), price: 0 }, { id: 'straw', name: l('Клубника', 'Strawberry'), price: 0 }] }] },
      { id: 'pie', name: l('Пирожок с яблоком', 'Apple pie'), desc: l('Горячий', 'Hot'), price: 89, emoji: '🥧' },
    ],
  },
];
