// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
// Review: compare the logo region in each generated asset with a plain scale of foa-logo-flat.png.
import { createRequire } from 'node:module';
const WEB = '/Users/siddharth/Developer/foa-platform-wt-13-brand-kit/apps/web/';
const require = createRequire(WEB + 'package.json');
const sharp = require('sharp');
const FLAT = WEB + 'public/brand/foa-logo-flat.png';
const K = WEB + 'public/prototype/brand-kit/';

async function cmp(label, file, left, top, width, kernel = 'lanczos3') {
  const ref = await sharp(FLAT).resize({ width, kernel }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = ref.info;
  const out = await sharp(K + file).extract({ left, top, width: w, height: h }).removeAlpha().raw().toBuffer();
  let max = 0, sum = 0, n90 = 0;
  for (let i = 0; i < out.length; i++) { const d = Math.abs(out[i] - ref.data[i]); max = Math.max(max, d); sum += d; if (d > 24) n90++; }
  console.log(`${label.padEnd(28)} ${file.padEnd(28)} box ${left},${top} ${w}x${h}  meanΔ ${(sum / out.length).toFixed(2)}  maxΔ ${max}  px>24: ${(n90 / out.length * 100).toFixed(2)}%`);
}

await cmp('A og logo', 'a/og-card.png', 28, 28, 304);
await cmp('A certificate logo', 'a/certificate-share.png', 320, 92, 440);
await cmp('B og logo', 'b/og-card.png', 876, 630 - 36 - 168, 288);
await cmp('B certificate logo', 'b/certificate-share.png', 320, 100, 440);
await cmp('C og logo', 'c/og-card.png', 802, 48, 330, 'lanczos3');
await cmp('C certificate logo', 'c/certificate-share.png', 340, 84, 400);
await cmp('C preview logo (JPEG)', 'c/preview-watermarked.jpg', 12, 1200 - 117 + 12, 160);

// B markAt: the resize it performs (fit: fill, w and h rounded separately).
const MK = { w: 134, h: 129 }, discW = 133;
for (const [label, discPx] of [['icon-16', 14], ['icon-32', 28], ['icon-48', 42], ['icon-180', 112], ['maskable-512', 264], ['preview badge', 72 - 2 * Math.max(2, Math.round(72 * 0.1))], ['judging badge', 64 - 2 * Math.max(2, Math.round(64 * 0.1))]]) {
  const s = discPx / discW;
  const w = Math.max(1, Math.round(MK.w * s)), h = Math.max(1, Math.round(MK.h * s));
  const src = MK.w / MK.h, got = w / h;
  console.log(`B mark ${label.padEnd(14)} ${w}x${h}  aspect ${got.toFixed(4)} vs source ${src.toFixed(4)}  distortion ${(((got / src) - 1) * 100).toFixed(2)}%`);
}
