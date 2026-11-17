import type { Restaurant, RestaurantId } from '../types';
import { l } from '../i18n';
import { vkusnoMenu } from './menus/vkusno';
import { bkMenu } from './menus/bk';
import { kroshkaMenu } from './menus/kroshka';
import { franklinsMenu } from './menus/franklins';
import { farshMenu } from './menus/farsh';
import { teremokMenu } from './menus/teremok';
import { rosticsMenu } from './menus/rostics';
import { dodoMenu } from './menus/dodo';

const F = `${import.meta.env.BASE_URL}figma/`;
// Скругления панелей: верхние — снизу, левые — справа, правые — слева (как в макете Figma, узел 3:2)
const TOP = '0 0 30px 30px';
const LEFT = '0 30px 30px 0';
const RIGHT = '30px 0 0 30px';

export const restaurants: Restaurant[] = [
  {
    id: 'vkusno',
    name: 'Вкусно — и точка',
    tagline: l('Бургеры, картофель, десерты', 'Burgers, fries, desserts'),
    brand: '#264f36',
    onBrand: '#ffffff',
    ui: '#264f36',
    codePrefix: 'ВТ',
    loyalty: null,
    logo: { w: 137, h: 137, parts: [{ src: F + 'vkusno.png', x: 0, y: 0, w: 137, h: 137, img: { left: -59.5, top: -14.16, width: 219, height: 128.32 } }] },
    map: { x: 30, y: 0, w: 500, h: 149, radius: TOP, logoX: 211, logoY: 6 },
    menu: vkusnoMenu,
  },
  {
    id: 'bk',
    name: 'Burger King',
    tagline: l('Бургеры на огне', 'Flame-grilled burgers'),
    brand: '#f5ebdc',
    onBrand: '#502314',
    ui: '#c2220a',
    codePrefix: 'BK',
    loyalty: { name: l('Королевские бонусы', 'Royal rewards'), kind: 'points', earnRate: 0.05, maxSpendShare: 0.3 },
    logo: { w: 125, h: 137, parts: [{ src: F + 'burgerking.png', x: 0, y: 0, w: 125, h: 137 }] },
    map: { x: 550, y: 0, w: 500, h: 149, radius: TOP, logoX: 737, logoY: 6 },
    menu: bkMenu,
  },
  {
    id: 'kroshka',
    name: 'Крошка Картошка',
    tagline: l('Печёный картофель с начинками', 'Baked potatoes with fillings'),
    brand: '#2b6507',
    onBrand: '#ffffff',
    ui: '#2b6507',
    codePrefix: 'КК',
    loyalty: null,
    logo: { w: 139, h: 139, parts: [{ src: F + 'kroshka.png', x: 0, y: 0, w: 139, h: 139, round: true }] },
    map: { x: 0, y: 265, w: 149, h: 450, radius: LEFT, logoX: 4, logoY: 420 },
    menu: kroshkaMenu,
  },
  {
    id: 'franklins',
    name: 'Франклинс Бургер',
    tagline: l('Крафтовые бургеры', 'Craft burgers'),
    brand: '#2b2a29',
    onBrand: '#ffffff',
    ui: '#2b2a29',
    codePrefix: 'ФБ',
    loyalty: { name: l('Клуб Франклинс', 'Franklins Club'), kind: 'points', earnRate: 0.07, maxSpendShare: 0.5 },
    logo: { w: 149, h: 105, parts: [{ src: F + 'franklins.png', x: 0, y: 0, w: 149, h: 105, img: { left: -0.68, top: -0.21, width: 100.68, height: 100.42 } }] },
    map: { x: 0, y: 735, w: 149, h: 450, radius: LEFT, logoX: 0, logoY: 907 },
    menu: franklinsMenu,
  },
  {
    id: 'farsh',
    name: 'FARШ',
    tagline: l('Бургерная мясной лавки', "Butcher's burger bar"),
    brand: '#010101',
    onBrand: '#ffffff',
    ui: '#010101',
    codePrefix: 'ФШ',
    loyalty: null,
    logo: { w: 149, h: 149, parts: [{ src: F + 'farsh.png', x: 0, y: 0, w: 149, h: 149 }] },
    map: { x: 0, y: 1205, w: 149, h: 450, radius: LEFT, logoX: 0, logoY: 1355 },
    menu: farshMenu,
  },
  {
    id: 'teremok',
    name: 'Теремок',
    tagline: l('Блины, супы, каши', 'Blini, soups, porridge'),
    brand: '#bd001e',
    onBrand: '#ffffff',
    ui: '#bd001e',
    codePrefix: 'ТМ',
    loyalty: { name: l('Блинная карта', 'Blini card'), kind: 'stamps', stampsGoal: 6 },
    logo: { w: 139, h: 240, parts: [{ src: F + 'teremok.png', x: 0, y: 0, w: 139, h: 240, img: { left: -98.69, top: -3.7, width: 298, height: 107.4 } }] },
    map: { x: 931, y: 265, w: 149, h: 450, radius: RIGHT, logoX: 936, logoY: 370 },
    menu: teremokMenu,
  },
  {
    id: 'rostics',
    name: "Rostic's",
    tagline: l('Курица и твистеры', 'Chicken and twisters'),
    brand: '#ec1b28',
    onBrand: '#ffffff',
    ui: '#c4121f',
    codePrefix: 'RS',
    loyalty: { name: l("Баллы Rostic's", "Rostic's points"), kind: 'points', earnRate: 0.05, maxSpendShare: 0.3 },
    logo: { w: 137, h: 137, parts: [{ src: F + 'rostics.png', x: 0, y: 0, w: 137, h: 137, img: { left: -37, top: -37, width: 174, height: 174 } }] },
    map: { x: 931, y: 735, w: 149, h: 450, radius: RIGHT, logoX: 937, logoY: 891 },
    menu: rosticsMenu,
  },
  {
    id: 'dodo',
    name: 'Додо Пицца',
    tagline: l('Пицца, закуски, десерты', 'Pizza, snacks, desserts'),
    brand: '#ff6900',
    onBrand: '#ffffff',
    ui: '#b84a00',
    codePrefix: 'ДП',
    loyalty: { name: l('Додокоины', 'Dodo coins'), kind: 'points', earnRate: 0.1, maxSpendShare: 0.5 },
    logo: {
      w: 121,
      h: 205.37,
      parts: [
        { src: F + 'dodo-bird.png', x: 0, y: 0, w: 121, h: 121 },
        { src: F + 'dodo-text.png', x: 0.064, y: 120.955, w: 120.936, h: 84.412, img: { left: -118.12, top: -145.19, width: 268.46, height: 384.62 } },
      ],
    },
    map: { x: 931, y: 1205, w: 149, h: 450, radius: RIGHT, logoX: 945, logoY: 1326.82 },
    menu: dodoMenu,
  },
];

export const byId = Object.fromEntries(restaurants.map((r) => [r.id, r])) as Record<RestaurantId, Restaurant>;

export const findItem = (rid: RestaurantId, itemId: string) => {
  for (const c of byId[rid].menu) {
    const it = c.items.find((i) => i.id === itemId);
    if (it) return it;
  }
  throw new Error(`Unknown item ${rid}/${itemId}`);
};
