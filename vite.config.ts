import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Только dev: принимает слепки экранов (JSON и PNG 3D-сцены) для сборки макетов в Figma */
function figmaCaptures(): Plugin {
  const dir = join(process.cwd(), '.figma-captures');
  return {
    name: 'figma-captures',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__fig/save', (req, res) => {
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? '';
        if (req.method !== 'POST' || !/^[\w.-]+$/.test(name)) {
          res.statusCode = 400;
          res.end('bad request');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          mkdirSync(dir, { recursive: true });
          const buf = Buffer.concat(chunks);
          writeFileSync(join(dir, name), buf);
          res.end(String(buf.length));
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), figmaCaptures()],
  server: { port: 5173 },
});
