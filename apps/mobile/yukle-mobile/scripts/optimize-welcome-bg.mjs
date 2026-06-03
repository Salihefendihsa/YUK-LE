// Mobile için welcome ekranı arka planı: web cta-bg.png (2752x1536, 7.9MB)
// → 1080x600 RGB-only PNG (~600-900KB). Sharp/ImageMagick yok — pure JS box filter.
// Tek seferlik üretim: node scripts/optimize-welcome-bg.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC = path.resolve(__dirname, '..', '..', '..', 'web', 'public', 'cta-bg.png');
const DST = path.resolve(__dirname, '..', 'assets', 'welcome-bg.png');
const DST_W = 1080;
const DST_H = 600;

function readPng(file) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(new PNG())
      .on('parsed', function () {
        resolve(this);
      })
      .on('error', reject);
  });
}

function writePng(png, file) {
  return new Promise((resolve, reject) => {
    png.pack().pipe(fs.createWriteStream(file)).on('finish', resolve).on('error', reject);
  });
}

console.log(`Reading ${path.relative(process.cwd(), SRC)}…`);
const src = await readPng(SRC);
console.log(`  source ${src.width}x${src.height}`);

// Aspect-ratio koru: 2752/1536 ≈ 1.792, hedef 1080/600 = 1.8 — yakın, küçük crop yeterli.
// Crop yerine doğrudan scale (estetik fark yok). Box-average downsample (anti-alias).
const scaleX = src.width / DST_W;
const scaleY = src.height / DST_H;

// pngjs encoder, colorType:2 (RGB) set edildiğinde 4-byte RGBA buffer ile stride
// mismatch yapıyor → renkler kayıyor. Varsayılan RGBA bırakıp alpha=255 sabit
// veriyoruz; PNG decoders bu durumda gerekirse RGB olarak yorumlar.
const dst = new PNG({ width: DST_W, height: DST_H });

for (let y = 0; y < DST_H; y++) {
  const sy0 = Math.floor(y * scaleY);
  const sy1 = Math.min(src.height, Math.ceil((y + 1) * scaleY));
  for (let x = 0; x < DST_W; x++) {
    const sx0 = Math.floor(x * scaleX);
    const sx1 = Math.min(src.width, Math.ceil((x + 1) * scaleX));

    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let sy = sy0; sy < sy1; sy++) {
      for (let sx = sx0; sx < sx1; sx++) {
        const i = (sy * src.width + sx) * 4;
        r += src.data[i];
        g += src.data[i + 1];
        b += src.data[i + 2];
        n++;
      }
    }
    if (n === 0) {
      const i = (sy0 * src.width + sx0) * 4;
      r = src.data[i];
      g = src.data[i + 1];
      b = src.data[i + 2];
      n = 1;
    }
    const dIdx = (y * DST_W + x) * 4;
    dst.data[dIdx] = Math.round(r / n);
    dst.data[dIdx + 1] = Math.round(g / n);
    dst.data[dIdx + 2] = Math.round(b / n);
    dst.data[dIdx + 3] = 255;
  }
}

console.log(`Writing ${path.relative(process.cwd(), DST)}…`);
await writePng(dst, DST);
const sz = fs.statSync(DST).size;
console.log(`  done — ${DST_W}x${DST_H}, ${(sz / 1024).toFixed(1)} KB`);
