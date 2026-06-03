// Generates app icon / adaptive icon / splash icon / favicon from the Navlonix
// monogram (single source: src/components/brand/NavlonixMonogram.tsx viewBox).
// Pure-JS rasterizer using pngjs — no external image tools required.
//
// Usage: node scripts/generate-brand-assets.mjs
//
// Output (overwrites in place):
//   assets/icon.png            1024x1024  solid orange + centered white M (iOS rounds corners)
//   assets/adaptive-icon.png   1024x1024  transparent + centered white M (Android applies adaptiveIcon.backgroundColor)
//   assets/splash-icon.png     1024x1024  transparent + centered white M (splash.backgroundColor renders orange around it)
//   assets/favicon.png         48x48      solid orange + centered white M

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS = path.resolve(__dirname, '..', 'assets');

// Monogram geometry — kept in sync with NavlonixMonogram.tsx viewBox 0 0 64 64.
const VIEW = 64;
const STROKE_VB = 6.75; // viewBox units (line width)
const STROKES = [
  // M body left vertical
  [[16, 48], [16, 21]],
  // M body right vertical
  [[48, 48], [48, 21]],
  // M middle diagonal
  [[16, 21], [48, 48]],
  // Left up-arrow chevron
  [[9, 28], [16, 19], [23, 28]],
  // Right up-arrow chevron
  [[41, 28], [48, 19], [55, 28]],
];

const ORANGE = [0xff, 0x7a, 0x1a, 255];
const WHITE = [0xff, 0xff, 0xff, 255];
const TRANSPARENT = [0, 0, 0, 0];

function distSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function distMonogram(vx, vy) {
  let m = Infinity;
  for (const stroke of STROKES) {
    for (let i = 0; i < stroke.length - 1; i++) {
      const d = distSegment(vx, vy, stroke[i][0], stroke[i][1], stroke[i + 1][0], stroke[i + 1][1]);
      if (d < m) m = d;
    }
  }
  return m;
}

function rasterize({ size, markScale, bg }) {
  const png = new PNG({ width: size, height: size });
  const markPx = size * markScale;
  const pxPerVb = markPx / VIEW;
  const offset = (size - markPx) / 2;
  const strokeR = STROKE_VB / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      png.data[idx] = bg[0];
      png.data[idx + 1] = bg[1];
      png.data[idx + 2] = bg[2];
      png.data[idx + 3] = bg[3];

      const vx = (x - offset) / pxPerVb;
      const vy = (y - offset) / pxPerVb;
      // Bounding rejection: skip pixels clearly outside the stroke envelope.
      if (vx < -strokeR || vx > VIEW + strokeR || vy < -strokeR || vy > VIEW + strokeR) continue;

      const d = distMonogram(vx, vy);
      // SDF anti-alias: convert "viewBox distance to edge" to canvas-pixel coverage.
      const cov = (strokeR - d) * pxPerVb + 0.5;
      const aa = cov < 0 ? 0 : cov > 1 ? 1 : cov;
      if (aa === 0) continue;

      png.data[idx] = Math.round(bg[0] * (1 - aa) + WHITE[0] * aa);
      png.data[idx + 1] = Math.round(bg[1] * (1 - aa) + WHITE[1] * aa);
      png.data[idx + 2] = Math.round(bg[2] * (1 - aa) + WHITE[2] * aa);
      png.data[idx + 3] = Math.round(bg[3] * (1 - aa) + 255 * aa);
    }
  }
  return png;
}

function write(png, filename) {
  return new Promise((resolve, reject) => {
    const out = path.join(ASSETS, filename);
    png
      .pack()
      .pipe(fs.createWriteStream(out))
      .on('finish', () => {
        console.log(`  wrote ${filename}`);
        resolve();
      })
      .on('error', reject);
  });
}

console.log(`Generating brand assets into ${ASSETS}`);
// iOS / general — orange fills entire canvas; iOS rounds corners on its own
await write(rasterize({ size: 1024, markScale: 0.6, bg: ORANGE }), 'icon.png');
// Android adaptive foreground — transparent; app.json adaptiveIcon.backgroundColor fills orange
await write(rasterize({ size: 1024, markScale: 0.45, bg: TRANSPARENT }), 'adaptive-icon.png');
// Splash — transparent monogram; app.json splash.backgroundColor fills orange ground
await write(rasterize({ size: 1024, markScale: 0.38, bg: TRANSPARENT }), 'splash-icon.png');
// Favicon — keep 48x48; orange tile + white M
await write(rasterize({ size: 48, markScale: 0.62, bg: ORANGE }), 'favicon.png');
console.log('Done.');
