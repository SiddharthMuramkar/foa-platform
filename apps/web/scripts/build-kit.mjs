// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Shared kit generator (setup stage). Produces:
//   public/brand/foa-logo-flat.png            exact crop of the FLAT logo (white bg, no pixel changes)
//   public/brand/parts/foa-{tiles,mark,wordmark}-flat.png   exact rectangular crops of that PNG
//   public/brand/foa-logo-standin.svg         stand-in SVG with the real SVG's group ids (raster clipped per group)
//   public/prototype/brand-kit/fixtures/artwork-2400x1800.jpg   procedural crayon-like sample Artwork (no AI imagery)
//   public/prototype/brand-kit/fixtures/qr-placeholder.svg      non-scannable QR-shaped placeholder
//   public/prototype/brand-kit/{a,b,c}/<asset>                  grey placeholders, written only if missing
//
// Variant builders own public/prototype/brand-kit/<x>/** and overwrite the placeholders with their own
// generator (app/prototype/brand-kit/variants/<x>/build.mjs). Re-running this script never clobbers
// their output unless you pass --force-placeholders.
//
// Run: pnpm --dir apps/web run build-kit   (or: node apps/web/scripts/build-kit.mjs)

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const r = (...p) => path.join(WEB, ...p);
const FORCE = process.argv.includes('--force-placeholders');

const geo = JSON.parse(await readFile(r('app/prototype/brand-kit/logo-geometry.json'), 'utf8'));

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 1. Logo: exact crop of the flat variant. extract() copies pixels; PNG is lossless.
// ---------------------------------------------------------------------------
async function buildLogo() {
  await mkdir(r('public/brand/parts'), { recursive: true });
  const { x, y, w, h } = geo.source.flatCrop;
  const flat = await sharp(r(geo.source.file))
    .extract({ left: x, top: y, width: w, height: h })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(r('public/brand/foa-logo-flat.png'), flat);

  for (const name of ['tiles', 'mark', 'wordmark']) {
    const b = geo.lockups[name];
    await sharp(flat)
      .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
      .png({ compressionLevel: 9 })
      .toFile(r(`public/brand/parts/foa-${name}-flat.png`));
  }

  // Stand-in SVG: same group ids as the real rebuild (issue #6). Each group shows the exact raster
  // pixels clipped to that group's bounding box, so rendering is pixel-identical to the PNG while
  // code can already target #mark, #tile-red, #wordmark, ... Swap to the real SVG via logo.ts.
  const b64 = flat.toString('base64');
  const g = geo.groups;
  const pad = 2;
  const clip = (id) => {
    const b = g[id];
    return `<clipPath id="clip-${id}"><rect x="${b.x - pad}" y="${b.y - pad}" width="${b.w + 2 * pad}" height="${b.h + 2 * pad}"/></clipPath>`;
  };
  const use = (id) =>
    `<g id="${id}" data-standin="raster-clip"><use href="#raster" clip-path="url(#clip-${id})"/></g>`;
  const ids = Object.keys(g).filter((k) => k !== 'mark');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13) -->
<!-- STAND-IN for packages/brand/foa-logo.svg (issue #6). Raster pixels of the flat logo, clipped per group.
     Group ids match the real file: tile-red, tile-green, tile-blue, letter-f, letter-o, letter-a,
     mark (mark-disc, mark-paw, mark-hands), wordmark. Not a vector; do not ship. -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${geo.flat.width} ${geo.flat.height}" width="${geo.flat.width}" height="${geo.flat.height}" role="img" aria-label="Friends of Animals logo">
  <title>Friends of Animals</title>
  <defs>
    <image id="raster" x="0" y="0" width="${geo.flat.width}" height="${geo.flat.height}" href="data:image/png;base64,${b64}" xlink:href="data:image/png;base64,${b64}"/>
    ${ids.map(clip).join('\n    ')}
  </defs>
  <!-- base layer: the whole flat raster, so the render is pixel-identical to foa-logo-flat.png even where
       JPEG edge ringing spills past a group's box; the groups below repeat their pixels on top. -->
  <use id="raster-base" href="#raster"/>
  ${use('tile-red')}
  ${use('tile-green')}
  ${use('tile-blue')}
  ${use('letter-f')}
  ${use('letter-o')}
  ${use('letter-a')}
  <g id="mark">
    ${use('mark-disc')}
    ${use('mark-paw')}
    ${use('mark-hands')}
  </g>
  ${use('wordmark')}
</svg>
`;
  await writeFile(r('public/brand/foa-logo-standin.svg'), svg);
}

// ---------------------------------------------------------------------------
// 2. Fixture Artwork: procedural, seeded "crayon" drawing. Deterministic. Not AI imagery.
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function artworkSvg(W, H, seed = 2027) {
  const rnd = mulberry32(seed);
  const rr = (a, b) => a + (b - a) * rnd();
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const crayons = ['#E8432E', '#F59B23', '#F7D23E', '#53B848', '#2E86DE', '#7B4FC9', '#E85A9B', '#1FB5A6'];
  const parts = [];

  // Wobbly line through points (crayon stroke).
  const wobble = (pts, colour, width, opacity = 0.9) => {
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2 + rr(-18, 18);
      const cy = (y0 + y1) / 2 + rr(-18, 18);
      d += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    parts.push(
      `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`,
    );
  };

  // Hatch-fill a closed shape: scribble lines clipped to the shape, then outline it.
  let clipN = 0;
  const hatched = (shapeEl, colour, angle, gap, width, outline = true) => {
    const id = `c${clipN++}`;
    parts.push(`<clipPath id="${id}">${shapeEl}</clipPath>`);
    const lines = [];
    const L = Math.hypot(W, H);
    for (let o = -L; o < L; o += gap + rr(-gap * 0.3, gap * 0.3)) {
      const a = (angle * Math.PI) / 180;
      const cx = W / 2 + Math.cos(a + Math.PI / 2) * o;
      const cy = H / 2 + Math.sin(a + Math.PI / 2) * o;
      const dx = Math.cos(a) * L;
      const dy = Math.sin(a) * L;
      lines.push(
        `M${(cx - dx).toFixed(0)},${(cy - dy + rr(-6, 6)).toFixed(0)} L${(cx + dx).toFixed(0)},${(cy + dy + rr(-6, 6)).toFixed(0)}`,
      );
    }
    parts.push(
      `<g clip-path="url(#${id})"><path d="${lines.join(' ')}" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" opacity="0.85"/></g>`,
    );
    if (outline) parts.push(shapeEl.replace('/>', ` fill="none" stroke="${colour}" stroke-width="${width * 1.6}" opacity="0.95"/>`));
  };

  // Sun (top-left) with rays.
  const sx = W * 0.18;
  const sy = H * 0.2;
  const sr = H * 0.11;
  hatched(`<circle cx="${sx}" cy="${sy}" r="${sr}"/>`, '#F7C21E', -35, 16, 9);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rr(-0.08, 0.08);
    const r0 = sr * 1.25;
    const r1 = sr * rr(1.6, 1.9);
    wobble(
      [
        [sx + Math.cos(a) * r0, sy + Math.sin(a) * r0],
        [sx + Math.cos(a) * r1, sy + Math.sin(a) * r1],
      ],
      '#F59B23',
      14,
    );
  }

  // Rolling hills: three hatched bands.
  const hillCols = ['#53B848', '#1FB5A6', '#2E9E44'];
  hillCols.forEach((c, i) => {
    const base = H * (0.62 + i * 0.12);
    let d = `M0,${H} L0,${base}`;
    for (let x = 0; x <= W; x += W / 6) d += ` Q${x + W / 12},${base - rr(60, 180)} ${x + W / 6},${base + rr(-30, 30)}`;
    d += ` L${W},${H} Z`;
    hatched(`<path d="${d}"/>`, c, 20 + i * 25, 18, 10);
  });

  // Abstract blobs.
  for (let i = 0; i < 6; i++) {
    const cx = rr(W * 0.35, W * 0.95);
    const cy = rr(H * 0.12, H * 0.55);
    const rad = rr(70, 170);
    let d = '';
    const n = 9;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const rk = rad * rr(0.75, 1.2);
      const px = cx + Math.cos(a) * rk;
      const py = cy + Math.sin(a) * rk;
      d += k === 0 ? `M${px.toFixed(0)},${py.toFixed(0)}` : ` T${px.toFixed(0)},${py.toFixed(0)}`;
    }
    d += ' Z';
    hatched(`<path d="${d}"/>`, pick(crayons), rr(0, 180), 14, 8);
  }

  // Zigzags and spirals.
  for (let i = 0; i < 5; i++) {
    const y = rr(H * 0.08, H * 0.58);
    const x0 = rr(W * 0.3, W * 0.6);
    const pts = [];
    for (let k = 0; k < 9; k++) pts.push([x0 + k * rr(40, 70), y + (k % 2 ? -1 : 1) * rr(25, 55)]);
    wobble(pts, pick(crayons), rr(10, 18));
  }
  for (let i = 0; i < 3; i++) {
    const cx = rr(W * 0.4, W * 0.9);
    const cy = rr(H * 0.65, H * 0.9);
    const pts = [];
    for (let t = 0; t < 26; t++) {
      const a = t * 0.55;
      const rad = 8 + t * 6;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    wobble(pts, pick(['#E85A9B', '#7B4FC9', '#E8432E']), 12);
  }

  // Dots.
  for (let i = 0; i < 60; i++) {
    parts.push(
      `<circle cx="${rr(0, W).toFixed(0)}" cy="${rr(0, H * 0.6).toFixed(0)}" r="${rr(6, 16).toFixed(0)}" fill="${pick(crayons)}" opacity="0.8"/>`,
    );
  }

  // Paper + crayon grain: alpha-mask the drawing with fractal noise, then roughen edges.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="11" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.98  0 0 0 0 0.96  0 0 0 0 0.91  0 0 0 0.18 0.82"/>
    </filter>
    <filter id="crayon" x="-2%" y="-2%" width="104%" height="104%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="mask"/>
      <feComposite in="SourceGraphic" in2="mask" operator="in" result="grained"/>
      <feTurbulence type="turbulence" baseFrequency="0.035" numOctaves="2" seed="3" result="warp"/>
      <feDisplacementMap in="grained" in2="warp" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#FBF7EE"/>
  <rect width="${W}" height="${H}" filter="url(#paper)"/>
  <g filter="url(#crayon)">
    ${parts.join('\n    ')}
  </g>
</svg>`;
}

async function buildFixtures() {
  const dir = r('public/prototype/brand-kit/fixtures');
  await mkdir(dir, { recursive: true });
  const W = 2400;
  const H = 1800;
  await sharp(Buffer.from(artworkSvg(W, H)))
    .flatten({ background: '#FBF7EE' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(dir, 'artwork-2400x1800.jpg'));

  // QR-shaped placeholder: three finder squares + seeded modules. Deliberately NOT a valid QR code.
  const N = 29;
  const rnd = mulberry32(42);
  const cells = [];
  const finder = (fx, fy) => {
    cells.push(`<path d="M${fx},${fy}h7v7h-7z M${fx + 1},${fy + 1}v5h5v-5z" fill-rule="evenodd"/>`);
    cells.push(`<rect x="${fx + 2}" y="${fy + 2}" width="3" height="3"/>`);
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() < 0.48) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  const q = 4;
  const qr = `<?xml version="1.0" encoding="UTF-8"?>
<!-- PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13) -->
<!-- QR PLACEHOLDER: random modules, not scannable. Real certificates use the qrcode package -> /verify/<number>. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-q} ${-q} ${N + 2 * q} ${N + 2 * q}" width="${(N + 2 * q) * 8}" height="${(N + 2 * q) * 8}" shape-rendering="crispEdges">
  <rect x="${-q}" y="${-q}" width="${N + 2 * q}" height="${N + 2 * q}" fill="#FFFFFF"/>
  <g fill="#000000">${cells.join('')}</g>
</svg>
`;
  await writeFile(path.join(dir, 'qr-placeholder.svg'), qr);
}

// ---------------------------------------------------------------------------
// 3. Per-variant placeholders (same file names the builders must produce).
// ---------------------------------------------------------------------------
export const KIT_ASSETS = [
  { file: 'icon-16.png', w: 16, h: 16 },
  { file: 'icon-32.png', w: 32, h: 32 },
  { file: 'icon-180.png', w: 180, h: 180 },
  { file: 'icon-maskable-512.png', w: 512, h: 512 },
  { file: 'og-card.png', w: 1200, h: 630 },
  { file: 'preview-watermarked.jpg', w: 1600, h: 1200 },
  { file: 'judging-marked.jpg', w: 2560, h: 1920 },
  { file: 'certificate-share.png', w: 1080, h: 1350 },
];

async function buildPlaceholders() {
  for (const v of ['a', 'b', 'c']) {
    const dir = r('public/prototype/brand-kit', v);
    await mkdir(dir, { recursive: true });
    for (const a of KIT_ASSETS) {
      const out = path.join(dir, a.file);
      if (!FORCE && (await exists(out))) continue;
      const text = `${v.toUpperCase()} · ${a.file} · placeholder`;
      const fs = Math.max(8, Math.min(Math.round(a.h / 12), Math.floor((a.w * 0.9) / (text.length * 0.56))));
      const label =
        a.w >= 120
          ? `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-size="${fs}" fill="#5B5B5B">${text}</text>`
          : '';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}">
  <defs><pattern id="h" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="12" fill="#E4E1DA"/></pattern></defs>
  <rect width="100%" height="100%" fill="#EFECE6"/><rect width="100%" height="100%" fill="url(#h)"/>
  ${label}
</svg>`;
      const img = sharp(Buffer.from(svg));
      if (a.file.endsWith('.jpg')) await img.jpeg({ quality: 70 }).toFile(out);
      else await img.png().toFile(out);
    }
  }
}

await buildLogo();
await buildFixtures();
await buildPlaceholders();
console.log('build-kit: logo, parts, stand-in SVG, fixtures and placeholders written to', r('public'));
