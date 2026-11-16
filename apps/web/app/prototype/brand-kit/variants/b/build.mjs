// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant B "Paw mark" asset generator.
//   Run:  node apps/web/app/prototype/brand-kit/variants/b/build.mjs
//   Out:  apps/web/public/prototype/brand-kit/b/*   (KIT_FILES names + a few comparison extras)
//         ./kit-report.json                           (settings + measurements the page renders)
//
// Logo rule: every logo pixel comes from public/brand/foa-logo-flat.png through sharp extract + resize
// (lanczos3) only. No recolouring, no redrawing, no outline or shadow on the logo. Plates, pills, the
// seal rosette and the rejected ring are surfaces AROUND the logo, drawn here as SVG.
//
// Text: sharp renders text with Pango. On macOS Pango's default CoreText backend ignores bundled fonts
// and silently falls back to Helvetica, so we force the fontconfig backend and point it at
// ./fonts/fonts.conf (the two Plus Jakarta Sans weights the site already uses; OFL).
// Node prints a MODULE_TYPELESS_PACKAGE_JSON warning when importing fixtures.ts; it is harmless.

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const WEB = path.resolve(HERE, '../../../../..');
process.env.PANGOCAIRO_BACKEND = 'fc';
process.env.FONTCONFIG_FILE = path.join(HERE, 'fonts/fonts.conf');
const { default: sharp } = await import('sharp');
// Shared, read-only fixtures (SG-01 allow-list). Never invent child data here.
const { artwork, child, childDisplayLineShort, competition, certificateShare, judgingView } = await import(
  path.join(HERE, '../../fixtures.ts')
);

const geo = JSON.parse(await readFile(path.join(HERE, '../../logo-geometry.json'), 'utf8'));
const FLAT = path.join(WEB, 'public/brand/foa-logo-flat.png');
const ARTWORK = path.join(WEB, 'public/prototype/brand-kit/fixtures/artwork-2400x1800.jpg');
const QR = path.join(WEB, 'public/prototype/brand-kit/fixtures/qr-placeholder.svg');
const OUT = path.join(WEB, 'public/prototype/brand-kit/b');
const out = (f) => path.join(OUT, f);
await mkdir(OUT, { recursive: true });

// ---------------------------------------------------------------------------------------------
// Settings (FR-STAMP-03: placement and opacity are settings). The page reads these back from
// kit-report.json so the table and the pixels can't drift apart.
// ---------------------------------------------------------------------------------------------
const SWITCH_PX = 160; // stamp shown < 160 px wide → mark; ≥ 160 px → full logo
const SETTINGS = {
  previewBadge: { element: 'mark + "FOA" label badge', placement: 'bottom-right', opacity: 0.85, heightPct: 4.5, insetPct: 2, minHeightPx: 28 },
  judgingBadge: { element: 'mark + "FOA JUDGING" + Submission number badge', placement: 'top-left', opacity: 0.55, heightPct: 2.5, insetPct: 1.5, minHeightPx: 24 },
  ogStamp: { element: 'full logo (unchanged)', placement: 'bottom of white side panel', opacity: 1, widthPx: 288, minWidthPx: SWITCH_PX },
  certLogo: { element: 'full logo (unchanged)', placement: 'top-centre header', opacity: 1, widthPx: 440, minWidthPx: SWITCH_PX },
  certSeal: { element: 'mark inside a rosette seal', placement: 'bottom-left, beside number and QR', opacity: 1, diameterPx: 264 },
};

// Asset colours (not logo colours: the logo is only ever the raster). Contrast figures in kit-report.
const C = {
  plate: '#FFFFFF',
  ink: '#1A1A1A',
  muted: '#5A5650',
  primary: '#0055A5', // FOA blue, SPEC §4.8
  rule: '#D9D4CA',
  hairline: 'rgba(0,0,0,0.16)',
  sealGold: '#B98A2E',
  sealGoldDeep: '#7A5A14',
  testDark: '#1F2329',
};

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------
const svg = (body, w, h) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Text → RGBA PNG trimmed to ink. `markup` may contain Pango spans (already escaped).
 * Rendered at 4× (dpi 288) and reduced with lanczos3: at dpi 72 Pango rounds glyph advances to whole
 * pixels and small word spaces visibly collapse ("Scanto verify").
 */
const SS = 4;
async function text(markup, { size, bold = false, color = C.ink, width = 0, align = 'left', spacingPt = 0 }) {
  const ls = spacingPt ? ` letter_spacing="${Math.round(spacingPt * 1024 * SS)}"` : ''; // Pango units scale with the render size
  const big = await sharp({
    text: {
      text: `<span foreground="${color}"${ls}>${markup}</span>`,
      font: `Plus Jakarta Sans ${bold ? 'Bold' : 'Regular'} ${size}`,
      rgba: true,
      dpi: 72 * SS,
      align,
      ...(width ? { width: width * SS, wrap: 'word' } : {}),
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  const w = Math.max(1, Math.round(big.info.width / SS));
  const h = Math.max(1, Math.round(big.info.height / SS));
  const buf = await sharp(big.data).resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer();
  return { buf, w, h };
}

/** Multiply an RGBA PNG's alpha by `opacity` (FR-STAMP-03 opacity setting). */
async function withOpacity(buf, opacity) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * opacity);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
};
const mix = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));

// ---------------------------------------------------------------------------------------------
// The mark: exact crop of foa-logo-flat.png. Measure the green disc inside the crop so scaling is
// centred on the disc, and check that anything a round plate clips away is only white O-ring.
// ---------------------------------------------------------------------------------------------
const MK = geo.lockups.mark; // {x,y,w,h} in flat px
const markCrop = await sharp(FLAT).extract({ left: MK.x, top: MK.y, width: MK.w, height: MK.h }).removeAlpha().raw().toBuffer();
const disc = (() => {
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let y = 0; y < MK.h; y++)
    for (let x = 0; x < MK.w; x++) {
      const i = (y * MK.w + x) * 3;
      const [r, g, b] = [markCrop[i], markCrop[i + 1], markCrop[i + 2]];
      if (g > 100 && g - r > 40 && g - b > 40) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
  return { w: x1 - x0 + 1, h: y1 - y0 + 1, cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2 };
})();
/** Darkest channel among crop pixels outside a circle of radius r (crop px) around the disc centre. */
function minOutside(r) {
  let min = 255;
  for (let y = 0; y < MK.h; y++)
    for (let x = 0; x < MK.w; x++) {
      if ((x + 0.5 - disc.cx) ** 2 + (y + 0.5 - disc.cy) ** 2 <= r * r) continue;
      const i = (y * MK.w + x) * 3;
      min = Math.min(min, markCrop[i], markCrop[i + 1], markCrop[i + 2]);
    }
  return min;
}

/** Mark resized so the green disc is `discPx` wide. Returns buffer + disc centre in output px. */
async function markAt(discPx) {
  const s = discPx / disc.w;
  const w = Math.max(1, Math.round(MK.w * s));
  const h = Math.max(1, Math.round(MK.h * s));
  const buf = await sharp(FLAT).extract({ left: MK.x, top: MK.y, width: MK.w, height: MK.h }).resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer();
  return { buf, w, h, scale: Math.round(s * 1000) / 1000, cx: disc.cx * (w / MK.w), cy: disc.cy * (h / MK.h) };
}

/** Full logo (tiles + mark + wordmark), unchanged, resized to `wPx` wide. White background (JPEG source). */
async function logoAt(wPx) {
  const h = Math.round((geo.flat.height * wPx) / geo.flat.width);
  const buf = await sharp(FLAT).resize(wPx, h, { kernel: 'lanczos3' }).png().toBuffer();
  return { buf, w: wPx, h };
}

// Wordmark cap height (dark rows of the name), to justify the switch size with a number.
const wordmarkCap = await (async () => {
  const g = geo.groups.wordmark;
  const { data, info } = await sharp(FLAT).extract({ left: g.x, top: g.y, width: g.w, height: g.h }).greyscale().raw().toBuffer({ resolveWithObject: true });
  let y0 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    let dark = false;
    for (let x = 0; x < info.width; x++) if (data[y * info.width + x] < 100) { dark = true; break; }
    if (dark) { if (y0 < 0) y0 = y; y1 = y; }
  }
  return y1 - y0 + 1;
})();

const report = {
  '//': 'PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13). Written by build.mjs; read by variant-b.tsx.',
  switchPx: SWITCH_PX,
  settings: SETTINGS,
  mark: { cropPx: { w: MK.w, h: MK.h }, discPx: { w: disc.w, h: disc.h } },
  wordmark: {
    capFlatPx: wordmarkCap,
    capAtSwitchPx: Math.round(((wordmarkCap * SWITCH_PX) / geo.flat.width) * 10) / 10,
    capAt120Px: Math.round(((wordmarkCap * 120) / geo.flat.width) * 10) / 10,
  },
  icons: {},
  contrast: {},
  files: {},
};

// ---------------------------------------------------------------------------------------------
// 1. Icons
// ---------------------------------------------------------------------------------------------
/**
 * Transparent `size`² square: white disc plate with the mark centred (green disc `discPx` wide).
 * The plate edge clips only white O-ring pixels; `clippedMinChannel` (≥ 240 = white) proves it.
 */
async function markOnDisc(size, discPx) {
  const m = await markAt(discPx);
  const plate = svg(`<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${C.plate}"/>`, size, size);
  const buf = await sharp(plate)
    .composite([
      { input: m.buf, left: Math.round(size / 2 - m.cx), top: Math.round(size / 2 - m.cy) },
      { input: plate, blend: 'dest-in' },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  const clipRadiusCrop = size / 2 / m.scale;
  return { buf, info: { size, discPx: Math.round(discPx * 10) / 10, scale: m.scale, clippedMinChannel: minOutside(clipRadiusCrop) } };
}

/** Opaque white square (iOS / maskable need full bleed), mark centred. */
async function squareIcon(size, discPx, extra = '') {
  const m = await markAt(discPx);
  const base = svg(`<rect width="${size}" height="${size}" fill="${C.plate}"/>${extra}`, size, size);
  const buf = await sharp(base)
    .composite([{ input: m.buf, left: Math.round(size / 2 - m.cx), top: Math.round(size / 2 - m.cy) }])
    .flatten({ background: C.plate })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { buf, info: { size, discPx, scale: m.scale, upscaled: m.scale > 1 } };
}

for (const [file, size] of [['icon-16.png', 16], ['icon-32.png', 32], ['icon-48.png', 48]]) {
  const { buf, info } = await markOnDisc(size, size * 0.875);
  await writeFile(out(file), buf);
  report.icons[file] = info;
}
{
  const a = await squareIcon(180, 112);
  await writeFile(out('icon-180.png'), a.buf);
  report.icons['icon-180.png'] = a.info;
  const mk = await squareIcon(512, 264);
  await writeFile(out('icon-maskable-512.png'), mk.buf);
  report.icons['icon-maskable-512.png'] = { ...mk.info, safeZoneDiameter: 409.6, markRadiusPx: Math.round((264 / 2) * 10) / 10 };

  // REJECTED comparison: tri-colour ring. Drawing new arcs in the tile colours is new artwork, so it is
  // generated only to show the PO what was ruled out. Never the default.
  const r = 70, sw = 6, cx = 90, cy = 90, gap = 5;
  const arc = (a0, a1, col) => {
    const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0 + gap / 2), [x1, y1] = p(a1 - gap / 2);
    return `<path d="M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  };
  const col = geo.colours;
  const ring = arc(150, 270, col.tileRed) + arc(270, 390, col.tileGreen) + arc(30, 150, col.tileBlue);
  const rej = await squareIcon(180, 100, ring);
  await writeFile(out('icon-180-ring-rejected.png'), rej.buf);
  report.icons['icon-180-ring-rejected.png'] = { ...rej.info, rejected: 'tri-colour ring is new artwork' };
}

// ---------------------------------------------------------------------------------------------
// 2. Badges (watermark + judging). White pill, mark at the left, label set in Plus Jakarta Sans.
// ---------------------------------------------------------------------------------------------
async function badge(height, labelMarkup, labelSize) {
  const pad = Math.max(2, Math.round(height * 0.1));
  const stroke = Math.max(1, Math.round(height / 36));
  // Mark on its own round plate, inset by the hairline, so the crop's square corners never poke
  // past the pill's rounded end (only white O-ring pixels are clipped; see clippedMinChannel).
  const plateD = height - 2 * stroke;
  const m = await markOnDisc(plateD, height - 2 * pad);
  const label = await text(labelMarkup, { size: labelSize, bold: true, color: C.ink, spacingPt: labelSize * 0.04 });
  const gap = Math.round(height * 0.12);
  const right = Math.round(height * 0.34);
  const w = stroke + plateD + gap + label.w + right;
  const pill = svg(
    `<rect x="${stroke / 2}" y="${stroke / 2}" width="${w - stroke}" height="${height - stroke}" rx="${(height - stroke) / 2}" fill="${C.plate}" stroke="${C.hairline}" stroke-width="${stroke}"/>`,
    w,
    height,
  );
  const buf = await sharp(pill)
    .composite([
      { input: m.buf, left: stroke, top: stroke },
      { input: label.buf, left: stroke + plateD + gap, top: Math.round((height - label.h) / 2) },
    ])
    .png()
    .toBuffer();
  return { buf, w, h: height, markScale: m.info.scale, clippedMinChannel: m.info.clippedMinChannel };
}

const S = SETTINGS;
const art1600 = await sharp(ARTWORK).resize(1600, 1200, { kernel: 'lanczos3' }).png().toBuffer();
const previewBadge = await badge(Math.round((1600 * S.previewBadge.heightPct) / 100), 'FOA', 34);
const previewBadgeOp = await withOpacity(previewBadge.buf, S.previewBadge.opacity);
await writeFile(out('badge-preview.png'), previewBadgeOp); // standalone, at default opacity (page ladder)
const pInset = Math.round((1600 * S.previewBadge.insetPct) / 100);
const pPos = { left: 1600 - pInset - previewBadge.w, top: 1200 - pInset - previewBadge.h };
const previewJpg = await sharp(art1600)
  .composite([{ input: previewBadgeOp, ...pPos }])
  .flatten({ background: '#ffffff' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toBuffer();
await writeFile(out('preview-watermarked.jpg'), previewJpg);
// The page shows the 100% corner by CSS-cropping this exact JPEG (no separate crop file): a lossless
// crop of busy hatching weighs 2× the whole JPEG.
const PC = { w: 640, h: 360 };

const art2560 = await sharp(ARTWORK).resize(2560, 1920, { kernel: 'lanczos3' }).png().toBuffer();
const jLabel = `${esc(judgingView.markText)}<span weight="normal" foreground="${C.muted}">  ·  ${esc(judgingView.submissionNumber)}</span>`;
const judgingBadge = await badge(Math.round((2560 * S.judgingBadge.heightPct) / 100), jLabel, 26);
const judgingBadgeOp = await withOpacity(judgingBadge.buf, S.judgingBadge.opacity);
await writeFile(out('badge-judging.png'), judgingBadgeOp);
const jInset = Math.round((2560 * S.judgingBadge.insetPct) / 100);
const judgingJpg = await sharp(art2560)
  .composite([{ input: judgingBadgeOp, left: jInset, top: jInset }])
  .flatten({ background: '#ffffff' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toBuffer();
await writeFile(out('judging-marked.jpg'), judgingJpg);
const JC = { w: 760, h: 240 };
await sharp(judgingJpg).extract({ left: 0, top: 0, width: JC.w, height: JC.h }).png().toFile(out('judging-crop.png'));

// Badge over light / busy / dark test patches (preview scale). The dark patch is the sample Artwork
// darkened procedurally, standing in for a dark painting; no new imagery.
const PATCH = { w: 520, h: 200 };
const patchSrc = {
  light: { left: 1600 - PATCH.w, top: 0 }, // cream paper, top-right
  busy: { left: 1600 - PATCH.w, top: 1200 - PATCH.h }, // hatched hills, bottom-right
};
const patches = {};
for (const [k, pos] of Object.entries(patchSrc)) {
  patches[k] = await sharp(art1600).extract({ ...pos, width: PATCH.w, height: PATCH.h }).png().toBuffer();
}
patches.dark = await sharp(patches.busy).linear(0.22, 6).png().toBuffer();
for (const [k, p] of Object.entries(patches)) {
  await sharp(p)
    .composite([{ input: previewBadgeOp, left: PATCH.w - pInset - previewBadge.w, top: PATCH.h - pInset - previewBadge.h }])
    .png()
    .toFile(out(`badge-on-${k}.png`));
}

// Measured contrast of the badge (after opacity) over each patch, using the mean colour under the badge.
async function meanUnder(buf, left, top, w, h) {
  const { channels } = await sharp(buf).extract({ left, top, width: w, height: h }).stats();
  return channels.slice(0, 3).map((c) => c.mean);
}
const inkRGB = hex(C.ink), plateRGB = hex(C.plate), greenRGB = hex(geo.colours.tileGreen);
for (const [k, p] of Object.entries(patches)) {
  const bg = await meanUnder(p, PATCH.w - pInset - previewBadge.w, PATCH.h - pInset - previewBadge.h, previewBadge.w, previewBadge.h);
  const a = S.previewBadge.opacity;
  const pill = mix(plateRGB, bg, a);
  report.contrast[`preview-${k}`] = {
    bg: bg.map(Math.round),
    labelOnPill: ratio(mix(inkRGB, bg, a), pill),
    markGreenOnPill: ratio(mix(greenRGB, bg, a), pill),
    pillEdgeOnArtwork: ratio(pill, bg),
  };
}
{
  const bg = await meanUnder(art2560, jInset, jInset, judgingBadge.w, judgingBadge.h);
  const a = S.judgingBadge.opacity;
  const darkBg = hex(C.testDark);
  report.contrast.judging = {
    bg: bg.map(Math.round),
    labelOnPill: ratio(mix(inkRGB, bg, a), mix(plateRGB, bg, a)),
    labelOnPillDarkArtwork: ratio(mix(inkRGB, darkBg, a), mix(plateRGB, darkBg, a)),
  };
}
report.contrast.markGreenOnWhite = ratio(greenRGB, plateRGB);
report.contrast.pawWhiteOnGreen = ratio(plateRGB, greenRGB);
report.contrast.whitePlateOnDarkTab = ratio(plateRGB, hex('#202124'));
report.contrast.markGreenOnLightTab = ratio(greenRGB, hex('#DEE1E6'));

// ---------------------------------------------------------------------------------------------
// 3. OG card 1200×630: Artwork uncropped (840×630 = exact 4:3) + white panel; full logo signs off
//    at the bottom of the panel, like an artist's stamp. Title and SG-01 short line on top.
// ---------------------------------------------------------------------------------------------
{
  const W = 1200, H = 630, AW = 840, PAD = 36, TW = W - AW - 2 * PAD;
  const art = await sharp(ARTWORK).resize(AW, H, { kernel: 'lanczos3' }).png().toBuffer();
  const logo = await logoAt(S.ogStamp.widthPx);
  const kicker = await text(esc(competition.title.toUpperCase()), { size: 17, bold: true, color: C.primary, spacingPt: 1.4 });
  const title = await text(esc(artwork.title), { size: 42, bold: true, color: C.ink, width: TW });
  // SG-01 short public line (fixtures.childDisplayLineShort), split so "6–10" never breaks.
  const name = await text(esc(child.displayName), { size: 24, bold: true, color: C.ink });
  const line = await text(esc(`${child.categoryLabel} · ${child.city}`), { size: 21, color: C.muted });
  let y = PAD + 6;
  const layers = [{ input: art, left: 0, top: 0 }, { input: svg(`<rect width="1" height="${H}" fill="${C.rule}"/>`, 1, H), left: AW, top: 0 }];
  layers.push({ input: kicker.buf, left: AW + PAD, top: y }); y += kicker.h + 22;
  layers.push({ input: title.buf, left: AW + PAD, top: y }); y += title.h + 26;
  layers.push({ input: name.buf, left: AW + PAD, top: y }); y += name.h + 12;
  layers.push({ input: line.buf, left: AW + PAD, top: y }); y += line.h;
  const logoTop = H - PAD - logo.h;
  if (y > logoTop - 16) throw new Error(`OG text overlaps logo (${y} > ${logoTop - 16})`);
  layers.push({ input: logo.buf, left: AW + PAD, top: logoTop });
  const og = await sharp({ create: { width: W, height: H, channels: 3, background: C.plate } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(out('og-card.png'), og);
  // Same pixels as JPEG q82, only to show the weight difference (crayon texture makes PNG heavy).
  await sharp(og).jpeg({ quality: 82, mozjpeg: true }).toFile(out('og-card-q82.jpg'));
  report.og = { artworkPx: { w: AW, h: H }, artworkCropped: false, logoPx: { w: logo.w, h: logo.h }, squareCentreCropKeepsLogo: false };
}

// ---------------------------------------------------------------------------------------------
// 4. Certificate share 1080×1350 (FR-CERT-03, FR-STAMP-02): full logo header, seal with the mark,
//    number, QR. Public share image → display name only (SG-01, BR-63).
// ---------------------------------------------------------------------------------------------
{
  const W = 1080, H = 1350, cs = certificateShare;
  const layers = [];
  const frame = svg(
    `<rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${C.rule}" stroke-width="2"/>` +
      `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${C.primary}" stroke-width="3"/>`,
    W,
    H,
  );
  layers.push({ input: frame, left: 0, top: 0 });
  const LOGO_TOP = 100;
  const logo = await logoAt(S.certLogo.widthPx);
  layers.push({ input: logo.buf, left: Math.round((W - logo.w) / 2), top: LOGO_TOP });
  const D = S.certSeal.diameterPx, R = D / 2;
  const rowTop = H - 112 - D; // bottom row (seal · number · QR) anchored to the frame
  layers.push({ input: svg(`<rect width="${W - 192}" height="1" fill="${C.rule}"/>`, W - 192, 1), left: 96, top: rowTop - 52 });
  // Body block, vertically centred between the logo and the divider.
  const items = [
    [await text(esc(cs.title.toUpperCase()), { size: 30, bold: true, color: C.primary, spacingPt: 3 }), 0],
    [await text('Awarded to', { size: 28, color: C.muted }), 56],
    [await text(esc(cs.recipientDisplayName), { size: 108, bold: true, color: C.ink }), 26],
    [await text(esc(cs.award), { size: 36, bold: true, color: C.ink }), 44],
    [await text(`${esc(cs.competition)}  ·  ${esc(cs.school)}`, { size: 27, color: C.muted }), 20],
  ];
  const blockH = items.reduce((a, [t, g]) => a + g + t.h, 0);
  let y = Math.round(LOGO_TOP + logo.h + (rowTop - 52 - (LOGO_TOP + logo.h) - blockH) / 2);
  for (const [t, g] of items) {
    y += g;
    layers.push({ input: t.buf, left: Math.round((W - t.w) / 2), top: y });
    y += t.h;
  }

  // Seal: rosette + white disc + mark (exact pixels) + type label. Rosette is a surface, not the logo.
  const n = 30;
  const bumps = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `<circle cx="${(R + (R - 13) * Math.cos(a)).toFixed(2)}" cy="${(R + (R - 13) * Math.sin(a)).toFixed(2)}" r="13" fill="${C.sealGold}"/>`;
  }).join('');
  const sealBase = svg(
    `${bumps}<circle cx="${R}" cy="${R}" r="${R - 13}" fill="${C.sealGold}"/>` +
      `<circle cx="${R}" cy="${R}" r="${R - 30}" fill="${C.plate}"/>` +
      `<circle cx="${R}" cy="${R}" r="${R - 38}" fill="none" stroke="${C.sealGoldDeep}" stroke-width="2"/>`,
    D,
    D,
  );
  const sm = await markAt(112);
  const sealType = await text(esc(cs.type), { size: 22, bold: true, color: C.ink, spacingPt: 2.2 });
  const sealYear = await text(esc(cs.issuedOn.slice(0, 4)), { size: 18, bold: true, color: C.sealGoldDeep, spacingPt: 1.5 });
  const markTop = Math.round(R - 26 - sm.cy);
  const seal = await sharp(sealBase)
    .composite([
      { input: sm.buf, left: Math.round(R - sm.cx), top: markTop },
      { input: sealType.buf, left: Math.round(R - sealType.w / 2), top: Math.round(R + 44) },
      { input: sealYear.buf, left: Math.round(R - sealYear.w / 2), top: Math.round(R + 44 + sealType.h + 8) },
    ])
    .png()
    .toBuffer();
  layers.push({ input: seal, left: 96, top: rowTop });

  // 37 viewBox units × 6 px = 222 px: whole pixels per module, rendered crisp with no resampling.
  const qrPx = 222;
  const qr = await sharp(QR, { density: (72 * qrPx) / 296 }).resize(qrPx, qrPx, { fit: 'fill', kernel: 'nearest' }).png().toBuffer();
  layers.push({ input: qr, left: W - 96 - qrPx, top: rowTop + Math.round((D - qrPx) / 2) });

  // Middle column: number, date, verify hint. Left-aligned between seal and QR.
  const colX = 96 + D + 36, colW = W - 96 - qrPx - 36 - colX;
  let cy = rowTop + 40;
  for (const [t, opt, gap] of [
    ['Certificate no.', { size: 20, color: C.muted }, 0],
    [esc(cs.number), { size: 25, bold: true, color: C.ink }, 10],
    [`Issued ${esc(cs.issuedOnLabel)}`, { size: 20, color: C.muted }, 26],
    ['Scan to verify, or visit', { size: 20, color: C.muted }, 26],
    ['foaglobal.org/verify', { size: 20, bold: true, color: C.primary }, 8],
  ]) {
    const tt = await text(t, { ...opt, width: colW });
    cy += gap;
    layers.push({ input: tt.buf, left: colX, top: cy });
    cy += tt.h;
  }
  if (y > rowTop - 52 - 24) throw new Error(`certificate body overlaps the bottom row (${y})`);
  await sharp({ create: { width: W, height: H, channels: 3, background: C.plate } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toFile(out('certificate-share.png'));
  report.certificate = { logoPx: { w: logo.w, h: logo.h }, sealPx: D, sealMarkScale: sm.scale, qrPx, qrIsPlaceholder: true };
}

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
report.badges = {
  preview: { w: previewBadge.w, h: previewBadge.h, markScale: previewBadge.markScale, clippedMinChannel: previewBadge.clippedMinChannel, pos: pPos },
  judging: { w: judgingBadge.w, h: judgingBadge.h, markScale: judgingBadge.markScale, clippedMinChannel: judgingBadge.clippedMinChannel, inset: jInset },
};
report.crops = { preview: PC, judging: JC, patch: PATCH };
for (const f of [
  'icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-180.png', 'icon-maskable-512.png', 'icon-180-ring-rejected.png',
  'og-card.png', 'og-card-q82.jpg', 'preview-watermarked.jpg', 'judging-marked.jpg', 'judging-crop.png',
  'certificate-share.png', 'badge-preview.png', 'badge-judging.png', 'badge-on-light.png', 'badge-on-busy.png', 'badge-on-dark.png',
]) {
  const m = await sharp(out(f)).metadata();
  report.files[f] = { w: m.width, h: m.height, bytes: (await stat(out(f))).size };
}
report.safeguarding = { publicLine: childDisplayLineShort, displayName: child.displayName, judgingFields: ['submissionNumber', 'category', 'title'] };
await writeFile(path.join(HERE, 'kit-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ icons: report.icons, contrast: report.contrast, files: report.files }, null, 1));
