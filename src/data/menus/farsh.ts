import type { MenuCategory } from '../../types';
import { l } from '../../i18n';
import { burgerExtras, burgerRemove, comboDrink, comboSide, o, single } from './_shared';

const doneness = single('doneness', 'Прожарка', 'Doneness', [
  o('m', 'Medium', 'Medium'),
  o('mw', 'Medium well', 'Medium well'),
  o('wd', 'Well done', 'Well done'),
], { defaultId: 'm' });

const combo = { price: 219, groups: [comboSide([['fries', 'Картофель фри', 'Fries'], ['wedges', 'Картофельные дольки', 'Potato wedges']]), comboDrink] };

export const farshMenu: MenuCategory[] = [
  {
    id: 'burgers',
    title: l('Бургеры', 'Burgers'),
    items: [
      { id: 'classic', name: l('Классический', 'Classic'), desc: l('Котлета из мраморной говядины, чеддер, томаты, соус', 'Marbled beef, cheddar, tomato, sauce'), price: 490, emoji: '🍔', kcal: 690, tags: ['hit'], groups: [doneness, burgerExtras, burgerRemove], combo },
      { id: 'truffle', name: l('Трюфельный', 'Truffle'), desc: l('Трюфельный майонез, грибы, пармезан', 'Truffle mayo, mushrooms, parmesan'), price: 590, emoji: '🍄', kcal: 740, groups: [doneness, burgerRemove], combo },
      { id: 'hot', name: l('Острый', 'Hot'), desc: l('Халапеньо, острый соус, пеппер-джек', 'Jalapeño, hot sauce, pepper jack'), price: 540, emoji: '🌶️', kcal: 710, tags: ['spicy'], groups: [doneness, burgerExtras, burgerRemove], combo },
    ],
  },
  {
    id: 'meat',
    title: l('Мясная лавка', 'From the butcher'),
    items: [
      { id: 'steak', name: l('Стейк-сэндвич', 'Steak sandwich'), desc: l('Говяжья вырезка на чиабатте', 'Beef tenderloin on ciabatta'), price: 690, emoji: '🥩', groups: [doneness] },
      { id: 'hotdog', name: l('Хот-дог с колбаской', 'Sausage hot dog'), desc: l('Домашняя колбаска, горчица, лук', 'House sausage, mustard, onion'), price: 390, emoji: '🌭' },
    ],
  },
  {
    id: 'drinks',
    title: l('Сайды и напитки', 'Sides & drinks'),
    items: [
      { id: 'fries', name: l('Картофель фри', 'Fries'), desc: l('С соусом на выбор', 'With a dip'), price: 190, emoji: '🍟', tags: ['veg'] },
      { id: 'lemonade', name: l('Лимонад', 'Lemonade'), desc: l('0,4 л', '0.4 L'), price: 220, emoji: '🍹' },
      { id: 'kvass', name: l('Квас', 'Kvass'), desc: l('0,4 л', '0.4 L'), price: 150, emoji: '🍺' },
    ],
  },
];
