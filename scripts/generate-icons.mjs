// Renders the app icons and iOS startup images from src/assets/app-icon.svg into public/.
// Run with `npm run icons` after changing the icon. The output is committed.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const root = new URL('../', import.meta.url);
const out = (path) => new URL(`public/${path}`, root);
const source = readFileSync(new URL('src/assets/app-icon.svg', root), 'utf8');
const splashScreens = JSON.parse(readFileSync(new URL('scripts/splash-screens.json', root), 'utf8'));

const BG = '#161826';
/** iOS-style corner radius, as a share of the icon size */
const CORNER = 0.225;

/** The icon's inner markup, in its own 240×240 units. */
const inner = source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const doc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

/** The icon placed at (x, y) with the given size, optionally with rounded corners. */
function icon(x, y, size, { rounded = false, contentScale = 1 } = {}) {
  let body = inner;
  if (contentScale !== 1) {
    const t = `translate(120 120) scale(${contentScale}) translate(-120 -120)`;
    body = body.replace('<g id="content">', `<g id="content" transform="${t}">`);
  }
  const placed = `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 240 240">${body}</svg>`;
  if (!rounded) return placed;
  const r = size * CORNER;
  return `<clipPath id="corner"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}"/></clipPath><g clip-path="url(#corner)">${placed}</g>`;
}

function png(path, svg) {
  const data = new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
  writeFileSync(out(path), data);
  console.log(`${path}  ${(data.length / 1024).toFixed(1)} kB`);
}

mkdirSync(out('icons'), { recursive: true });
mkdirSync(out('splash'), { recursive: true });

// Browser tab
writeFileSync(out('favicon.svg'), doc(240, 240, icon(0, 0, 240, { rounded: true })) + '\n');
console.log('favicon.svg');

// Manifest icons. Maskable: launchers crop to their own shape, so the content
// shrinks into the central 80 % while the background stays full bleed.
for (const size of [192, 512]) png(`icons/icon-${size}.png`, doc(size, size, icon(0, 0, size)));
png('icons/icon-maskable-512.png', doc(512, 512, icon(0, 0, 512, { contentScale: 0.8 })));

// iOS home screen (iOS rounds the corners itself)
png('icons/apple-touch-icon.png', doc(180, 180, icon(0, 0, 180)));

// iOS startup images: the icon centered on the night background, one per screen size.
const SPLASH_ICON = 128;
for (const { w, h, dpr } of splashScreens) {
  const W = w * dpr;
  const H = h * dpr;
  const s = SPLASH_ICON * dpr;
  const body = `<rect width="${W}" height="${H}" fill="${BG}"/>` + icon((W - s) / 2, (H - s) / 2, s, { rounded: true });
  png(`splash/splash-${w}x${h}@${dpr}.png`, doc(W, H, body));
}
