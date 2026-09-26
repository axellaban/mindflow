// Deterministic brand assets without a browser. Requires sharp.
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const sharp = require(require.resolve('sharp', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const root = new URL('../../', import.meta.url);
const mark = await readFile(new URL('public/favicon.svg', root));
for (const [size, name, scale] of [[192, 'icon-192.png', .64], [512, 'icon-512.png', .64], [512, 'icon-maskable-512.png', .52], [180, 'apple-touch-icon.png', .64]]) {
  const logo = await sharp(mark).resize(Math.round(size * scale)).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#17231f' } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toFile(new URL(`public/icons/${name}`, root).pathname);
}
const type = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#17231f"/>
  <text x="80" y="230" font-family="Georgia, serif" font-size="66" fill="#f4f1e9">Calma<tspan font-style="italic" fill="#c5d5bc">byEli</tspan></text>
  <text x="80" y="320" font-family="Georgia, serif" font-size="42" fill="#f4f1e9">Un momento para vos.</text>
  <text x="80" y="380" font-family="sans-serif" font-size="24" fill="#c8d0c6">Meditaciones, respiración y descanso.</text>
  <text x="80" y="535" font-family="sans-serif" font-size="20" fill="#a5b3a9">MINDFULNESS CON ELI CURCIO</text>
</svg>`);
const portrait = await sharp(new URL('public/eli/eli.jpg', root).pathname).resize(300, 400, { fit: 'cover' }).png().toBuffer();
await sharp(type).composite([{ input: portrait, left: 810, top: 115 }]).png().toFile(new URL('public/icons/og.png', root).pathname);
console.log('Updated CalmabyEli icons and social card.');
