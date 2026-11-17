import type { MenuCategory } from '../../types';
import { l } from '../../i18n';
import { burgerExtras, burgerRemove, comboDrink, comboSide, o, single } from './_shared';

const doneness = single('doneness', 'Прожарка', 'Doneness', [
  o('mr', 'Medium rare', 'Medium rare'),
  o('m', 'Medium', 'Medium'),
  o('mw', 'Medium well', 'Medium well'),
  o('wd', 'Well done', 'Well done'),
], { defaultId: 'm' });

const combo = { price: 199, groups: [comboSide([['fries', 'Картофель фри', 'Fries'], ['sweet', 'Батат фри', 'Sweet potato fries'], ['slaw', 'Коул-слоу', 'Coleslaw']]), comboDrink] };

export const franklinsMenu: MenuCategory[] = [
  {
    id: 'burgers',
    title: l('Бургеры', 'Burgers'),
    items: [
      { id: 'franklin', name: l('Франклин', 'Franklin'), desc: l('Мраморная говядина, чеддер, маринованный лук, фирменный соус', 'Marbled beef, cheddar, pickled onion, house sauce'), price: 459, emoji: '🍔', kcal: 720, tags: ['hit'], groups: [doneness, burgerExtras, burgerRemove], combo },
      { id: 'bbq', name: l('Барбекю', 'BBQ'), desc: l('Говядина, бекон, луковые кольца, соус барбекю', 'Beef, bacon, onion rings, BBQ sauce'), price: 499, emoji: '🍔', kcal: 820, groups: [doneness, burgerExtras, burgerRemove], combo },
      { id: 'blue', name: l('Блю чиз', 'Blue cheese'), desc: l('Говядина, дорблю, груша, руккола', 'Beef, blue cheese, pear, rocket'), price: 529, emoji: '🧀', kcal: 760, tags: ['new'], groups: [doneness, burgerRemove], combo },
      { id: 'veggie', name: l('Вегги', 'Veggie'), desc: l('Котлета из нута, томаты, авокадо', 'Chickpea patty, tomato, avocado'), price: 429, emoji: '🥑', kcal: 560, tags: ['veg'], groups: [burgerRemove], combo },
    ],
  },
  {
    id: 'sides',
    title: l('Гарниры', 'Sides'),
    items: [
      { id: 'fries', name: l('Картофель фри', 'Fries'), desc: l('С трюфельной солью', 'With truffle salt'), price: 179, emoji: '🍟', tags: ['veg'] },
      { id: 'sweet', name: l('Батат фри', 'Sweet potato fries'), desc: l('С соусом блю чиз', 'With blue cheese dip'), price: 229, emoji: '🍠', tags: ['veg'] },
    ],
  },
  {
    id: 'drinks',
    title: l('Лимонады и шейки', 'Lemonades & shakes'),
    items: [
      { id: 'lemonade', name: l('Лимонад домашний', 'Homemade lemonade'), desc: l('0,4 л', '0.4 L'), price: 189, emoji: '🍋', groups: [single('taste', 'Вкус', 'Flavour', [o('classic', 'Классический', 'Classic'), o('berry', 'Ягодный', 'Berry'), o('mango', 'Манго-маракуйя', 'Mango-passion')], { defaultId: 'classic' })] },
      { id: 'shake', name: l('Милкшейк', 'Milkshake'), desc: l('0,4 л', '0.4 L'), price: 259, emoji: '🥤', groups: [single('taste', 'Вкус', 'Flavour', [o('van', 'Ваниль', 'Vanilla'), o('choc', 'Шоколад', 'Chocolate'), o('salt', 'Солёная карамель', 'Salted caramel', 30)], { defaultId: 'van' })] },
    ],
  },
];
