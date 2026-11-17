// Геометрия карты фудкорта из Figma (узел 3:2, кадр 1080×1920)
export const MAP_W = 1080;
// Карта выше макета на 80px: внизу у входа стоит терминал
export const MAP_H = 1760;

export interface TableSpot {
  n: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const COLS: [number, number][] = [
  [203, 154],
  [377, 153],
  [550, 153],
  [723, 154],
];
const ROWS = [265, 380, 500, 615, 735, 850, 970, 1085, 1205, 1320, 1440, 1555];
// В середине карты вместо 4 столов — «Вы здесь»
const HOLE = new Set(['377:850', '550:850', '377:970', '550:970']);

export const tables: TableSpot[] = (() => {
  const out: TableSpot[] = [];
  let n = 1;
  for (const y of ROWS) {
    for (const [x, w] of COLS) {
      if (HOLE.has(`${x}:${y}`)) continue;
      out.push({ n: n++, x, y, w, h: 100 });
    }
  }
  return out;
})();

export const TABLE_COUNT = tables.length;

/** Дерево в центре зала (зелёный круг в макете Figma) */
export const tree = { x: 429, y: 850, w: 221, h: 220 };

/** Терминал самообслуживания — у входа, под нижним рядом столов */
export const terminalSpot = { x: 430, y: 1680, w: 220, h: 64 };
export const terminalPoint = { x: terminalSpot.x + terminalSpot.w / 2, y: terminalSpot.y };
