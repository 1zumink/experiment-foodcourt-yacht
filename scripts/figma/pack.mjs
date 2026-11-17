// Упаковка JSON-слепков экранов в PNG-«контейнеры» для загрузки в Figma.
// Плагин Figma не умеет fetch, но читает байты картинки (getBytesAsync).
// PNG собирается без сжатия (deflate level 0) — сборщик в Figma читает его без inflate.
//
//   node scripts/figma/pack.mjs <файл.json | папка> [папка-назначения]
//
// Формат полезной нагрузки: 4 байта длины (big endian) + UTF-8 JSON, RGB-пиксели, фильтр 0.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

const W = 1024;

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

export function packBytes(payload) {
  const body = Buffer.concat([Buffer.alloc(4), payload]);
  body.writeUInt32BE(payload.length, 0);
  const rowBytes = W * 3;
  const rows = Math.max(1, Math.ceil(body.length / rowBytes));
  const raw = Buffer.alloc(rows * (rowBytes + 1));
  for (let r = 0; r < rows; r++) {
    raw[r * (rowBytes + 1)] = 0;
    body.copy(raw, r * (rowBytes + 1) + 1, r * rowBytes, Math.min(body.length, (r + 1) * rowBytes));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(rows, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 0 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const [, , src, outDir] = process.argv;
if (src && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = statSync(src).isDirectory()
    ? readdirSync(src)
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(src, f))
    : [src];
  const dest = outDir ?? (statSync(src).isDirectory() ? join(src, 'packed') : '.');
  mkdirSync(dest, { recursive: true });
  for (const f of files) {
    const out = join(dest, basename(f, '.json') + '.data.png');
    const png = packBytes(readFileSync(f));
    writeFileSync(out, png);
    console.log(out, png.length);
  }
}
