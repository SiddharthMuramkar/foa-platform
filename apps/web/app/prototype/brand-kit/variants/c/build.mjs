// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant C "Tile trio" generator.
//   node apps/web/app/prototype/brand-kit/variants/c/build.mjs
// Writes public/prototype/brand-kit/c/* (the 8 kit files plus comparison crops) and ./report.json
// (measurements the page quotes). Deterministic: same inputs give the same pixels.
//
// Logo rule: every logo pixel comes from public/brand/foa-logo-flat.png through sharp extract + resize
// only. Never recoloured, redrawn, rotated, outlined or masked. White plates and the tri-colour rule are
// surfaces placed AROUND the logo. Child data comes from ../../fixtures.ts (SG-01 allow-list only).

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const WEB = path.resolve(HERE, '../../../../..');
const OUT = path.join(WEB, 'public/prototype/brand-kit/c');

// Text in images uses the site font (SPEC §4.8): only Plus Jakarta Sans 400/700 from ./fonts is visible to
// fontconfig, and Pango must use fontconfig (on macOS it defaults to Core Text). Set before sharp loads.
process.env.FONTCONFIG_FILE = path.join(HERE, 'fonts/fonts.conf');
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const { default: sharp } = await import('sharp');
const { artwork, child, competition, certificateShare, judgingView } = await import('../../fixtures.ts');

const geo = JSON.parse(await readFile(path.join(WEB, 'app/prototype/brand-kit/logo-geometry.json'), 'utf8'));
const ADV = JSON.parse(await readFile(path.join(HERE, 'fonts/advances.json'), 'utf8'));
const FLAT = await readFile(path.join(WEB, 'public/brand/foa-logo-flat.png'));
const ARTWORK = await readFile(path.join(WEB, 'public', artwork.src));
const QR_SVG = await readFile(path.join(WEB, 'public', certificateShare.qr.src));

const FLAT_W = geo.flat.width;
const FLAT_H = geo.flat.height;
// The three tiles with their letters, no wordmark. Box = tile antialiasing + JPEG ringing (measured: the
// first/last rows and columns that are not pure white are x 2..733, y 2..352), plus 1 px of white.
const TILES = { left: 1, top: 1, width: 735, height: 353 };
const COL = geo.colours;
const TILE_FILLS = [COL.tileRed, COL.tileGreen, COL.tileBlue];
const G = geo.groups;
// Tile rhythm in logo px: red, gap, green, gap, blue (225, 8, 253, 8, 235). The tri-colour rule copies it.
const RHYTHM = [
  G['tile-red'].w,
  G['tile-green'].x - (G['tile-red'].x + G['tile-red'].w),
  G['tile-green'].w,
  G['tile-blue'].x - (G['tile-green'].x + G['tile-green'].w),
  G['tile-blue'].w,
];

// Image colours (also exported as tokens by variant-c.tsx).
const IMG = {
  paper: '#FFFFFF',
  ink: '#1A1A1A',
  muted: '#5A5650',
  rule: '#D9D4CA',
  primary: '#0055A5', // FOA blue (SPEC §4.8)
};
const FONT = "'Plus Jakarta Sans'";

// ---------------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (w, h, body) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);

function textWidth(s, size, weight = 400, ls = 0) {
  const t = ADV[String(weight)];
  let u = 0;
  for (const ch of s) u += t[ch] ?? 600;
  return (u * size) / 1000 + ls * [...s].length;
}

function text(s, { x, y, size, weight = 400, fill = IMG.ink, anchor = 'start', ls = 0, extra = '' }) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${
    ls ? ` letter-spacing="${ls}"` : ''
  }${extra ? ` ${extra}` : ''}>${esc(s)}</text>`;
}

function wrap(s, size, weight, maxW) {
  const lines = [];
  let line = '';
  for (const word of s.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, size, weight) > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Tri-colour rule: red | gap | green | gap | blue in the logo's own tile proportions, snapped to whole px. */
function triRule(x, y, w, h, gapFill = null) {
  const total = RHYTHM.reduce((a, b) => a + b, 0);
  let acc = 0;
  let out = '';
  RHYTHM.forEach((seg, i) => {
    const x0 = Math.round(x + (acc / total) * w);
    acc += seg;
    const x1 = Math.round(x + (acc / total) * w);
    const fill = i % 2 === 0 ? TILE_FILLS[i / 2] : gapFill;
    if (fill) out += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" fill="${fill}"/>`;
  });
  return out;
}

/** Full logo or the tile trio, scaled (lanczos3) from the flat PNG. Returns { data, info }. */
const logoFull = (width) => sharp(FLAT).resize({ width }).png().toBuffer({ resolveWithObject: true });
const logoTiles = (width) =>
  sharp(FLAT).extract(TILES).resize({ width }).png().toBuffer({ resolveWithObject: true });

/** Relative luminance and contrast (WCAG 2.x) for measured colours. */
const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((p, q) => q - p);
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
};
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const blend = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
async function meanRgb(buf, region) {
  const { channels } = await sharp(buf).extract(region).stats();
  return channels.slice(0, 3).map((c) => c.mean);
}

const report = {
  '//': 'PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13). Written by build.mjs; quoted by variant-c.tsx.',
};

// ---------------------------------------------------------------------------------------------------------
// 1. Icons: tile trio (or, for comparison only, the whole logo) on a white plate.
//    Built on a canvas where the logo sits at its NATIVE crop size, then the whole canvas is scaled once,
//    so the logo pixels are resampled exactly once and keep their exact aspect (no integer rounding squash).
// ---------------------------------------------------------------------------------------------------------
async function icon({ size, part = 'tiles', frac, plate }) {
  const src = part === 'tiles' ? TILES : { left: 0, top: 0, width: FLAT_W, height: FLAT_H };
  const S = Math.round(src.width / frac);
  const piece = await sharp(FLAT).extract(src).png().toBuffer();
  const rx = plate === 'rounded' ? Math.round(S * 0.1875) : 0;
  const base = svg(S, S, `<rect width="${S}" height="${S}" rx="${rx}" fill="${IMG.paper}"/>`);
  const left = Math.round((S - src.width) / 2);
  const top = Math.round((S - src.height) / 2);
  if (rx && top < rx) throw new Error(`logo would overlap the plate's rounded corner at ${size}px`);
  const hi = await sharp(base).composite([{ input: piece, left, top }]).png().toBuffer();
  const out = sharp(hi).resize(size, size);
  const buf = await (plate === 'rounded' ? out.png() : out.flatten({ background: IMG.paper }).png()).toBuffer();
  const scale = size / S;
  return {
    buf,
    logoPx: { w: +(src.width * scale).toFixed(2), h: +(src.height * scale).toFixed(2) },
    letterPx: +(G['letter-f'].h * scale).toFixed(2),
    gapPx: +(RHYTHM[1] * scale).toFixed(2),
  };
}

// Favicons: rounded white plate (transparent corners), trio fills 94 % of the width.
// apple-touch-icon: opaque square (iOS masks it), trio 84 % wide.
// Maskable 512: opaque square, trio sized so its corners sit at 96 % of the 80 % safe circle (r = 204.8 px).
const SAFE_R = 512 * 0.4;
const trioAspect = TILES.width / TILES.height;
const maskW = 2 * SAFE_R * 0.96 * Math.cos(Math.atan(1 / trioAspect));
const ICONS = [
  { file: 'icon-16.png', size: 16, frac: 0.94, plate: 'rounded' },
  { file: 'icon-32.png', size: 32, frac: 0.94, plate: 'rounded' },
  { file: 'icon-48.png', size: 48, frac: 0.94, plate: 'rounded' },
  { file: 'icon-180.png', size: 180, frac: 152 / 180, plate: 'square' },
  { file: 'icon-maskable-512.png', size: 512, frac: maskW / 512, plate: 'square' },
  // Comparison only (not shipped): what the WHOLE logo does at favicon sizes.
  { file: 'compare-wholelogo-16.png', size: 16, frac: 0.94, plate: 'rounded', part: 'full' },
  { file: 'compare-wholelogo-32.png', size: 32, frac: 0.94, plate: 'rounded', part: 'full' },
];

async function buildIcons() {
  report.icons = {};
  for (const spec of ICONS) {
    const r = await icon(spec);
    await writeFile(path.join(OUT, spec.file), r.buf);
    report.icons[spec.file] = { size: spec.size, logoPx: r.logoPx, letterPx: r.letterPx, gapPx: r.gapPx };
  }
  const m = report.icons['icon-maskable-512.png'].logoPx;
  report.maskable = {
    safeRadius: SAFE_R,
    trioHalfDiagonal: +(Math.hypot(m.w, m.h) / 2).toFixed(1),
  };
}

// ---------------------------------------------------------------------------------------------------------
// 2. OG card 1200x630: Artwork inside a tile-rhythm frame (left), whole logo + text (right).
// ---------------------------------------------------------------------------------------------------------
async function buildOg() {
  const W = 1200;
  const H = 630;
  const art = { x: 40, y: 45, w: 720, h: 540 };
  const t = 10;
  const f = { x: art.x - t, y: art.y - t, w: art.w + 2 * t, h: art.h + 2 * t };
  const artBuf = await sharp(ARTWORK).resize(art.w, art.h, { fit: 'cover' }).toBuffer();
  const logo = await logoFull(330);
  const X = 806;
  const maxW = W - 30 - X;

  const frame =
    triRule(f.x, f.y, f.w, t) +
    triRule(f.x, f.y + f.h - t, f.w, t) +
    `<rect x="${f.x}" y="${f.y}" width="${t}" height="${f.h}" fill="${COL.tileRed}"/>` +
    `<rect x="${f.x + f.w - t}" y="${f.y}" width="${t}" height="${f.h}" fill="${COL.tileBlue}"/>`;

  const titleLines = wrap(artwork.title, 40, 700, maxW);
  let y = 318;
  let body = `<rect width="${W}" height="${H}" fill="${IMG.paper}"/>${frame}`;
  for (const line of titleLines) {
    body += text(line, { x: X, y, size: 40, weight: 700 });
    y += 48;
  }
  y += 4;
  body += text(`${child.displayName} · ${child.categoryLabel}`, { x: X, y, size: 22 });
  y += 32;
  body += text(`${child.city}, ${child.state}`, { x: X, y, size: 22, fill: IMG.muted });
  y += 44;
  body += text(competition.title, { x: X, y, size: 22, weight: 700 });
  body += text('foaglobal.org/gallery', { x: X, y: f.y + f.h - 14, size: 22, fill: IMG.primary });

  const png = await sharp(svg(W, H, body))
    .composite([
      { input: artBuf, left: art.x, top: art.y },
      { input: logo.data, left: X - 4, top: 48 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(OUT, 'og-card.png'), png);
  // Comparison only: the crayon texture makes a lossless PNG heavy; the same card as JPEG q85.
  await writeFile(path.join(OUT, 'og-card-q85.jpg'), await sharp(png).jpeg({ quality: 85, mozjpeg: true }).toBuffer());
  report.og = {
    logoWidth: 330,
    logoBox: { x: X - 4, y: 48, w: 330, h: logo.info.height },
    // A square centre-crop (compact chat previews) keeps x 285..915 of the card.
    squareCropKeepsLogo: X - 4 >= 285 && X - 4 + 330 <= 915,
    titleLines,
  };
}

// ---------------------------------------------------------------------------------------------------------
// 3. Gallery preview 1600x1200: white plate with the whole logo flush in the bottom-left corner, and the
//    tri-colour rule running from the plate to the right edge.
// ---------------------------------------------------------------------------------------------------------
const WM = { logoWidth: 160, pad: 12, radius: 10, strip: 10, opacity: 1 };

async function previewBase({ dark = false } = {}) {
  const img = sharp(ARTWORK).resize(1600, 1200);
  return (dark ? img.linear(0.28, 0) : img).png().toBuffer();
}

async function preview(base, { strip = true } = {}) {
  const W = 1600;
  const H = 1200;
  const logo = await logoFull(WM.logoWidth);
  const pw = WM.logoWidth + 2 * WM.pad;
  const ph = logo.info.height + 2 * WM.pad;
  const py = H - ph;
  const r = WM.radius;
  const plate = `<path d="M0,${py} H${pw - r} A${r},${r} 0 0 1 ${pw},${py + r} V${H} H0 Z" fill="${IMG.paper}"/>`;
  const rule = strip ? triRule(pw, H - WM.strip, W - pw, WM.strip, IMG.paper) : '';
  const jpg = await sharp(base)
    .composite([
      { input: svg(W, H, rule + plate) },
      { input: logo.data, left: WM.pad, top: py + WM.pad },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return { jpg, plate: { w: pw, h: ph }, logoH: logo.info.height };
}

async function buildPreview() {
  const light = await previewBase();
  const dark = await previewBase({ dark: true });
  const main = await preview(light);
  await writeFile(path.join(OUT, 'preview-watermarked.jpg'), main.jpg);
  // 100 % crops of two comparison renders (the page crops the real preview file with CSS). Crops of the
  // q82 output, re-saved at q92 to keep them light.
  const crop = { left: 0, top: 1200 - 260, width: 720, height: 260 };
  const cropOut = async (jpg, file) =>
    writeFile(path.join(OUT, file), await sharp(jpg).extract(crop).jpeg({ quality: 92 }).toBuffer());
  await cropOut((await preview(dark)).jpg, 'wm-crop-dark.jpg');
  await cropOut((await preview(light, { strip: false })).jpg, 'wm-crop-nostrip.jpg');

  // Plate against the art right above it (where the plate's edge is visible).
  const above = { left: 0, top: 1200 - main.plate.h - 60, width: main.plate.w, height: 60 };
  const paper = hexRgb(IMG.paper);
  report.watermark = {
    ...WM,
    plate: main.plate,
    logoHeight: main.logoH,
    wordmarkHeightPx: +((G.wordmark.h * WM.logoWidth) / FLAT_W).toFixed(1),
    tileLetterHeightPx: +((G['letter-f'].h * WM.logoWidth) / FLAT_W).toFixed(1),
    areaPct: +(((main.plate.w * main.plate.h + (1600 - main.plate.w) * WM.strip) / (1600 * 1200)) * 100).toFixed(2),
    plateVsArtFixture: contrast(paper, await meanRgb(light, above)),
    plateVsArtDark: contrast(paper, await meanRgb(dark, above)),
    crop,
  };
}

// ---------------------------------------------------------------------------------------------------------
// 4. Judging derivative 2560x1920: upright units (tile trio + "FOA JUDGING") on a sheared lattice so they
//    repeat along diagonals. Units are never rotated: rotation is not on the logo's allowed list.
// ---------------------------------------------------------------------------------------------------------
const JM = { opacity: 0.09, trioWidth: 96, fontSize: 40, dx: 820, dy: 330, shift: 273 };

async function judging(base) {
  const W = 2560;
  const H = 1920;
  const PAD = 600;
  const CW = W + 2 * PAD;
  const CH = H + 2 * PAD;
  const trio = await logoTiles(JM.trioWidth);
  const trioA = await sharp(trio.data).ensureAlpha(JM.opacity).png().toBuffer();
  const th = trio.info.height;
  const label = judgingView.markText;
  const gap = 16;
  const ls = 2;
  const unitW = JM.trioWidth + gap + textWidth(label, JM.fontSize, 700, ls);
  const comps = [];
  const units = []; // unit boxes in image px, to pick the 100 % crop
  let texts = '';
  for (let j = 0; j * JM.dy + th <= CH; j++) {
    for (let i = -1; i * JM.dx <= CW; i++) {
      const x = Math.round(i * JM.dx + ((j * JM.shift) % JM.dx));
      const y = Math.round(j * JM.dy + 40);
      if (x < 0 || x + unitW > CW) continue;
      comps.push({ input: trioA, left: x, top: y });
      units.push({ x: x - PAD, y: y - PAD, w: unitW, h: th });
      texts += text(label, {
        x: x + JM.trioWidth + gap,
        y: y + Math.round(th / 2 + JM.fontSize * 0.35),
        size: JM.fontSize,
        weight: 700,
        ls,
        fill: IMG.ink,
        extra: `stroke="${IMG.paper}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"`,
      });
    }
  }
  const layer = await sharp({ create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([...comps, { input: svg(CW, CH, `<g opacity="${JM.opacity}">${texts}</g>`), left: 0, top: 0 }])
    .png()
    .toBuffer();
  const overlay = await sharp(layer).extract({ left: PAD, top: PAD, width: W, height: H }).png().toBuffer();
  const jpg = await sharp(base).composite([{ input: overlay }]).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return { jpg, units };
}

async function buildJudging() {
  const base = await sharp(ARTWORK).resize(2560, 1920).png().toBuffer();
  const dark = await sharp(ARTWORK).resize(2560, 1920).linear(0.28, 0).png().toBuffer();
  const { jpg, units } = await judging(base);
  await writeFile(path.join(OUT, 'judging-marked.jpg'), jpg);
  // 720x360 window centred on the unit nearest the image centre.
  const u = units
    .filter((q) => q.x >= 0 && q.y >= 0 && q.x + q.w <= 2560 && q.y + q.h <= 1920)
    .sort((a, b) => Math.hypot(a.x + a.w / 2 - 1280, a.y - 960) - Math.hypot(b.x + b.w / 2 - 1280, b.y - 960))[0];
  const cw = 720;
  const ch = 360;
  const crop = {
    left: Math.max(0, Math.min(2560 - cw, Math.round(u.x + u.w / 2 - cw / 2))),
    top: Math.max(0, Math.min(1920 - ch, Math.round(u.y + u.h / 2 - ch / 2))),
    width: cw,
    height: ch,
  };
  // 100 % crop of the same mark over a darkened copy (the page crops the real file with CSS for the light case).
  await writeFile(
    path.join(OUT, 'judging-crop-dark.jpg'),
    await sharp((await judging(dark)).jpg).extract(crop).jpeg({ quality: 92 }).toBuffer(),
  );
  const paperRgb = await meanRgb(base, { left: 0, top: 0, width: 2560, height: 1100 });
  const darkRgb = await meanRgb(dark, { left: 0, top: 0, width: 2560, height: 1100 });
  report.judging = {
    ...JM,
    inkOnLightArt: contrast(blend(hexRgb(IMG.ink), paperRgb, JM.opacity), paperRgb),
    haloOnDarkArt: contrast(blend(hexRgb(IMG.paper), darkRgb, JM.opacity), darkRgb),
    crop,
  };
}

// ---------------------------------------------------------------------------------------------------------
// 5. Certificate share image 1080x1350 (FR-CERT-03, FR-STAMP-02): whole logo as the header, seal with the
//    tile trio bottom-left, QR bottom-right, number + verify URL along the bottom, tri-colour rule top/bottom.
//    Public image: display name only (SG-01, BR-63).
// ---------------------------------------------------------------------------------------------------------
function seal(cx, cy) {
  const R1 = 128;
  const R2 = 96;
  const rText = 104;
  const fs = 17;
  const chars = [...'FOA · CERTIFICATE OF ACHIEVEMENT · 2027 · '];
  const adv = chars.map((ch) => ((ADV['700'][ch] ?? 600) * fs) / 1000);
  const spare = (2 * Math.PI * rText - adv.reduce((a, b) => a + b, 0)) / chars.length;
  let s = 0;
  let out = `<circle cx="${cx}" cy="${cy}" r="${R1}" fill="none" stroke="${IMG.primary}" stroke-width="5"/>`;
  out += `<circle cx="${cx}" cy="${cy}" r="${R2}" fill="none" stroke="${IMG.primary}" stroke-width="2"/>`;
  chars.forEach((ch, i) => {
    const mid = s + (adv[i] + spare) / 2;
    const deg = ((mid / rText) * 180) / Math.PI;
    if (ch.trim())
      out += `<text x="${cx}" y="${cy - rText}" transform="rotate(${deg.toFixed(3)} ${cx} ${cy})" text-anchor="middle" font-family="${FONT}" font-size="${fs}" font-weight="700" fill="${IMG.primary}">${esc(ch)}</text>`;
    s += adv[i] + spare;
  });
  return { svg: out, innerR: R2, letterSpacing: +spare.toFixed(2) };
}

async function buildCertificate() {
  const W = 1080;
  const H = 1350;
  const c = certificateShare;
  const logo = await logoFull(400);
  const sealC = { x: 270, y: 1010 };
  const sl = seal(sealC.x, sealC.y);
  const trio = await logoTiles(140);
  const qrSize = 222; // 37 modules x 6 px: crisp, whole-pixel modules
  const qr = await sharp(QR_SVG, { density: (72 * qrSize) / 296 })
    .resize(qrSize, qrSize, { kernel: 'nearest' })
    .png()
    .toBuffer();
  const qrPos = { x: 810 - qrSize / 2, y: 899 };
  const mid = W / 2;

  let body = `<rect width="${W}" height="${H}" fill="${IMG.paper}"/>`;
  body += triRule(0, 0, W, 14, null) + triRule(0, H - 14, W, 14, null);
  body += `<rect x="36" y="40" width="${W - 72}" height="${H - 80}" fill="none" stroke="${IMG.rule}" stroke-width="2"/>`;
  body += text(c.title, { x: mid, y: 404, size: 54, weight: 700, anchor: 'middle' });
  body += text(c.type, { x: mid, y: 452, size: 22, weight: 700, anchor: 'middle', fill: IMG.muted, ls: 6 });
  body += text('Awarded to', { x: mid, y: 522, size: 26, anchor: 'middle', fill: IMG.muted });
  body += text(c.recipientDisplayName, { x: mid, y: 616, size: 88, weight: 700, anchor: 'middle' });
  body += text(c.award, { x: mid, y: 684, size: 34, weight: 700, anchor: 'middle' });
  body += text(c.competition, { x: mid, y: 736, size: 30, anchor: 'middle' });
  body += text(c.school, { x: mid, y: 780, size: 26, anchor: 'middle', fill: IMG.muted });
  body += `<line x1="140" y1="836" x2="${W - 140}" y2="836" stroke="${IMG.rule}" stroke-width="2"/>`;
  body += sl.svg;
  body += text(`Issued ${c.issuedOnLabel}`, { x: sealC.x, y: 1176, size: 22, anchor: 'middle', fill: IMG.muted });
  body += text('Scan to verify', { x: qrPos.x + qrSize / 2, y: 1150, size: 22, anchor: 'middle', fill: IMG.muted });
  body += text(`Certificate no. ${c.number}`, { x: mid, y: 1236, size: 26, weight: 700, anchor: 'middle' });
  body += text(`Verify at ${c.verifyUrlLabel}`, { x: mid, y: 1274, size: 22, anchor: 'middle', fill: IMG.primary });

  const png = await sharp(svg(W, H, body))
    .composite([
      { input: logo.data, left: Math.round((W - 400) / 2), top: 84 },
      { input: trio.data, left: sealC.x - 70, top: Math.round(sealC.y - trio.info.height / 2) },
      { input: qr, left: qrPos.x, top: qrPos.y },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(OUT, 'certificate-share.png'), png);
  report.certificate = {
    logoWidth: 400,
    logoBox: { x: Math.round((W - 400) / 2), y: 84, w: 400, h: logo.info.height },
    sealTrioWidth: 140,
    sealRingLetterSpacing: sl.letterSpacing,
    qrSize,
  };
}

// ---------------------------------------------------------------------------------------------------------
await mkdir(OUT, { recursive: true });
await buildIcons();
await buildOg();
await buildPreview();
await buildJudging();
await buildCertificate();

report.files = {};
for (const f of [...ICONS.map((i) => i.file), 'og-card.png', 'og-card-q85.jpg', 'preview-watermarked.jpg', 'judging-marked.jpg', 'certificate-share.png']) {
  report.files[f] = (await stat(path.join(OUT, f))).size;
}
await writeFile(path.join(HERE, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log('variant C kit written to', OUT);
