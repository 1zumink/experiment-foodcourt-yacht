import type { MenuCategory, ModGroup } from '../../types';
import { l } from '../../i18n';
import { drinkSize, multi, o, sauces, single } from './_shared';

const pizzaGroups = (base: number): ModGroup[] => [
  single('size', 'Размер', 'Size', [
    o('25', '25 см', '25 cm'),
    o('30', '30 см', '30 cm', Math.round(base * 0.35)),
    o('35', '35 см', '35 cm', Math.round(base * 0.7)),
  ], { defaultId: '30' }),
  single('dough', 'Тесто', 'Crust', [o('trad', 'Традиционное', 'Traditional'), o('thin', 'Тонкое', 'Thin')], { defaultId: 'trad' }),
  multi('add', 'Добавить', 'Add', [
    o('mozz', 'Моцарелла', 'Mozzarella', 79),
    o('pep', 'Пепперони', 'Pepperoni', 99),
    o('mush', 'Шампиньоны', 'Mushrooms', 69),
    o('jal', 'Халапеньо', 'Jalapeño', 59),
    o('bacon', 'Бекон', 'Bacon', 99),
  ], 5),
];

export const dodoMenu: MenuCategory[] = [
  {
    id: 'pizza',
    title: l('Пицца', 'Pizza'),
    items: [
      { id: 'pepperoni', name: l('Пепперони', 'Pepperoni'), desc: l('Пикантная пепперони, моцарелла, томатный соус', 'Spicy pepperoni, mozzarella, tomato sauce'), price: 489, emoji: '🍕', tags: ['hit'], groups: pizzaGroups(489) },
      { id: 'margarita', name: l('Маргарита', 'Margherita'), desc: l('Моцарелла, томаты, итальянские травы', 'Mozzarella, tomatoes, Italian herbs'), price: 439, emoji: '🍕', tags: ['veg'], groups: pizzaGroups(439) },
      { id: 'four-cheese', name: l('Четыре сыра', 'Four cheese'), desc: l('Моцарелла, чеддер, пармезан, дорблю', 'Mozzarella, cheddar, parmesan, blue cheese'), price: 539, emoji: '🧀', tags: ['veg'], groups: pizzaGroups(539) },
      { id: 'bbq-chicken', name: l('Цыплёнок барбекю', 'BBQ chicken'), desc: l('Курица, бекон, лук, соус барбекю', 'Chicken, bacon, onion, BBQ sauce'), price: 559, emoji: '🍕', tags: ['new'], groups: pizzaGroups(559) },
      { id: 'slice', name: l('Пицца кусочком', 'Pizza by the slice'), desc: l('Быстро — 2 минуты', 'Fast — 2 minutes'), price: 149, emoji: '🍕', groups: [single('kind', 'Какая', 'Which', [o('pep', 'Пепперони', 'Pepperoni'), o('marg', 'Маргарита', 'Margherita'), o('cheese', 'Сырная', 'Cheese')], { defaultId: 'pep' })] },
    ],
  },
  {
    id: 'snacks',
    title: l('Закуски', 'Snacks'),
    items: [
      { id: 'dodster', name: l('Додстер', 'Dodster'), desc: l('Горячий ролл с курицей', 'Hot chicken wrap'), price: 219, emoji: '🌯', groups: [single('style', 'Вариант', 'Style', [o('orig', 'Классический', 'Classic'), o('hot', 'Острый', 'Spicy')], { defaultId: 'orig' })] },
      { id: 'wings', name: l('Куриные крылья', 'Chicken wings'), desc: l('Запечённые, 6 штук', 'Baked, 6 pieces'), price: 289, emoji: '🍗', groups: [sauces('sauce', true)] },
      { id: 'potato', name: l('Картофель из печи', 'Oven potatoes'), desc: l('С травами', 'With herbs'), price: 169, emoji: '🥔', tags: ['veg'] },
    ],
  },
  {
    id: 'drinks',
    title: l('Напитки и десерты', 'Drinks & desserts'),
    items: [
      { id: 'cola', name: l('Кола', 'Cola'), desc: l('Со льдом', 'With ice'), price: 109, emoji: '🥤', groups: [drinkSize] },
      { id: 'cheesecake', name: l('Чизкейк', 'Cheesecake'), desc: l('Нью-Йорк', 'New York'), price: 179, emoji: '🍰' },
      { id: 'cookie', name: l('Печенье', 'Cookie'), desc: l('С шоколадом, 2 шт', 'Chocolate chip, 2 pcs'), price: 99, emoji: '🍪' },
    ],
  },
];
