// Готовит загрузку в Figma из .figma-captures:
//  - <сцена>__<устройство>.data.png — контейнер с массивом слепков экранов этой группы
//  - builder.data.png — код сборщика (строка)
//  - manifest.json — список файлов для загрузки (имя файла = имя узла-приёмника в Figma)
//
//   node scripts/figma/bundle.mjs [папка-слепков] [фильтр-групп через запятую]
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packBytes } from './pack.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] ?? '.figma-captures';
const only = process.argv[3]?.split(',');
const out = join(src, 'out');
mkdirSync(out, { recursive: true });

const groups = new Map();
for (const f of readdirSync(src).filter((f) => f.endsWith('.json')).sort()) {
  const [scene, device, id] = f.replace('.json', '').split('__');
  const g = `${scene}__${device}`;
  if (only && !only.includes(g)) continue;
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push({ id, png: f.replace('.json', '.png'), spec: JSON.parse(readFileSync(join(src, f), 'utf8')) });
}

const uploads = [];
const builder = readFileSync(join(here, 'builder.js'), 'utf8');
writeFileSync(join(out, 'builder.data.png'), packBytes(Buffer.from(JSON.stringify(builder))));
uploads.push({ name: 'builder.data.png', path: join(out, 'builder.data.png') });

for (const [g, items] of groups) {
  const file = `${g}.data.png`;
  writeFileSync(join(out, file), packBytes(Buffer.from(JSON.stringify(items))));
  uploads.push({ name: file, path: join(out, file) });
  for (const it of items) uploads.push({ name: it.png, path: join(src, it.png) });
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(uploads, null, 1));
console.log(uploads.length, 'files;', [...groups.keys()].join(' '));
