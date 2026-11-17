// POST файлов из manifest.json по выданным upload_assets ссылкам (порядок совпадает с nodeIds).
//   node scripts/figma/upload.mjs <manifest.json> <urls.txt> [смещение]
import { readFileSync } from 'node:fs';

const [, , manifestPath, urlsPath, offsetArg] = process.argv;
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const urls = readFileSync(urlsPath, 'utf8').split(/\s+/).filter(Boolean);
const offset = Number(offsetArg ?? 0);

const results = await Promise.all(
  urls.map(async (url, i) => {
    const item = manifest[offset + i];
    const body = readFileSync(item.path);
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body });
    const j = await r.json().catch(() => ({}));
    return `${item.name} ${r.status} ${j.imageHash ?? j.error ?? ''}`;
  }),
);
console.log(results.join('\n'));
