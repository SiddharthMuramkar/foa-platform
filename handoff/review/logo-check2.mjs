// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
import { createRequire } from 'node:module';
const WEB = '/Users/siddharth/Developer/foa-platform-wt-13-brand-kit/apps/web/';
const sharp = createRequire(WEB + 'package.json')('sharp');
const FLAT = WEB + 'public/brand/foa-logo-flat.png';
const ref = await sharp(FLAT).resize(288, 168, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
let best = null;
for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
  const out = await sharp(WEB + 'public/prototype/brand-kit/b/og-card.png').extract({ left: 876 + dx, top: 426 + dy, width: 288, height: 168 }).removeAlpha().raw().toBuffer();
  let s = 0, m = 0; for (let i = 0; i < out.length; i++) { const d = Math.abs(out[i] - ref[i]); s += d; m = Math.max(m, d); }
  if (!best || s < best.s) best = { dx, dy, s: s / out.length, m };
}
console.log(best);
const m = await sharp(WEB + 'public/prototype/brand-kit/b/og-card.png').metadata(); console.log(m.width, m.height);
