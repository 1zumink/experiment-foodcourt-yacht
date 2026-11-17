import type { MenuCategory } from '../../types';
import { l } from '../../i18n';
import { burgerExtras, burgerRemove, comboDrink, comboSide, drinkSize, o, sauces, single } from './_shared';

const combo = { price: 159, groups: [comboSide([['fries', 'Картофель фри M', 'Fries M'], ['rustic', 'Картофель по-деревенски', 'Rustic potatoes']]), comboDrink] };

export const vkusnoMenu: MenuCategory[] = [
  {
    id: 'burgers',
    title: l('Бургеры', 'Burgers'),
    items: [
      { id: 'grand', name: l('Гранд бургер', 'Grand burger'), desc: l('Две котлеты из говядины, сыр, салат, фирменный соус', 'Two beef patties, cheese, lettuce, signature sauce'), price: 289, emoji: '🍔', kcal: 520, tags: ['hit'], groups: [burgerExtras, burgerRemove], combo },
      { id: 'cheese', name: l('Чизбургер', 'Cheeseburger'), desc: l('Котлета из говядины, сыр, огурцы, кетчуп', 'Beef patty, cheese, pickles, ketchup'), price: 99, emoji: '🍔', kcal: 300, groups: [burgerExtras, burgerRemove], combo },
      { id: 'double', name: l('Двойной чизбургер', 'Double cheeseburger'), desc: l('Две котлеты и два ломтика сыра', 'Two patties, two slices of cheese'), price: 179, emoji: '🍔', kcal: 450, groups: [burgerExtras, burgerRemove], combo },
      { id: 'chicken', name: l('Чикен бургер', 'Chicken burger'), desc: l('Курица в хрустящей панировке, салат, майонез', 'Crispy chicken, lettuce, mayo'), price: 149, emoji: '🍗', kcal: 380, groups: [burgerRemove], combo },
    ],
  },
  {
    id: 'sides',
    title: l('Картофель и закуски', 'Sides'),
    items: [
      { id: 'fries', name: l('Картофель фри', 'Fries'), desc: l('Золотистый, с солью', 'Golden and salted'), price: 89, emoji: '🍟', kcal: 340, groups: [single('size', 'Размер', 'Size', [o('s', 'Маленький', 'Small'), o('m', 'Средний', 'Medium', 30), o('l', 'Большой', 'Large', 60)], { defaultId: 'm' })] },
      { id: 'nuggets', name: l('Наггетсы, 6 шт', 'Nuggets, 6 pcs'), desc: l('Из куриного филе', 'Chicken breast'), price: 149, emoji: '🍗', kcal: 270, groups: [sauces('sauce', true)] },
    ],
  },
  {
    id: 'drinks',
    title: l('Напитки', 'Drinks'),
    items: [
      { id: 'cola', name: l('Кола', 'Cola'), desc: l('Со льдом', 'With ice'), price: 99, emoji: '🥤', groups: [drinkSize] },
      { id: 'coffee', name: l('Капучино', 'Cappuccino'), desc: l('0,3 л', '0.3 L'), price: 139, emoji: '☕', groups: [single('milk', 'Молоко', 'Milk', [o('cow', 'Обычное', 'Regular'), o('oat', 'Овсяное', 'Oat', 40)], { defaultId: 'cow' })] },
    ],
  },
  {
    id: 'desserts',
    title: l('Десерты', 'Desserts'),
    items: [
      { id: 'sundae', name: l('Мороженое', 'Sundae'), desc: l('Пломбир с топпингом', 'Soft serve with topping'), price: 99, emoji: '🍦', groups: [single('top', 'Топпинг', 'Topping', [o('choc', 'Шоколадный', 'Chocolate'), o('straw', 'Клубничный', 'Strawberry'), o('caramel', 'Карамельный', 'Caramel')])] },
      { id: 'pie', name: l('Пирожок вишнёвый', 'Cherry pie'), desc: l('Горячий, хрустящий', 'Hot and crispy'), price: 79, emoji: '🥧' },
    ],
  },
];
