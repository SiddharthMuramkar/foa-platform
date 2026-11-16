// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant A "Whole logo" generator.
//   node apps/web/app/prototype/brand-kit/variants/a/build.mjs
// (Node 24 strips the types from ../../fixtures.ts on import and may print a harmless MODULE_TYPELESS_PACKAGE_JSON
// warning; add --no-warnings to hide it.) Needs system Chrome for the text layers (CHROME_PATH overrides).
//
// Every logo pixel comes from public/brand/foa-logo-flat.png through sharp: resize() = scale only (aspect
// kept; icons are scaled as a whole square so the logo's proportions stay exact), composite() = position and
// opacity. No recolouring, no redrawing, no outline. The logo always sits on white (its own JPEG background)
// or on a white plate/backing, because no transparent cut-out exists (see logo.ts).
//
// Text (OG tagline, judging label, certificate copy, seal) is drawn by system Chrome (playwright-core) with the
// self-hosted Plus Jakarta Sans 400/700 TTFs in ./fonts, then composited with sharp. Reason: sharp's macOS
// build renders text through CoreText and ignores fontconfig/fontfile, so it would silently fall back to
// Helvetica. The production worker (Linux) can render the same TTFs with sharp/librsvg directly; the
// stamping itself (FR-STAMP-03) is plain sharp.composite with the settings in ./stamp-settings.json.
//
// Writes public/prototype/brand-kit/a/* (the 8 kit files + comparison extras) and ./report.json
// (measurements the page shows: safe zone, wordmark size per icon, watermark contrast, corner stats).
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright-core';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const WEB = fileURLToPath(new URL('../../../../../', import.meta.url));
const OUT = path.join(WEB, 'public/prototype/brand-kit/a');
const LOGO = path.join(WEB, 'public/brand/foa-logo-flat.png');
const ARTWORK = path.join(WEB, 'public/prototype/brand-kit/fixtures/artwork-2400x1800.jpg');
const QR = path.join(WEB, 'public/prototype/brand-kit/fixtures/qr-placeholder.svg');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const S = JSON.parse(await readFile(path.join(HERE, 'stamp-settings.json'), 'utf8'));
const GEO = JSON.parse(await readFile(path.join(WEB, 'app/prototype/brand-kit/logo-geometry.json'), 'utf8'));
// Shared fixtures (read-only). Node 24 strips the TypeScript types on import.
const FX = await import(path.join(WEB, 'app/prototype/brand-kit/fixtures.ts'));
const LW = GEO.flat.width;
const LH = GEO.flat.height;

await mkdir(OUT, { recursive: true });
const report = {
  '//': 'PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13). Written by build.mjs; read by variant-a.tsx.',
  files: {},
};

// ---------------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------------
const out = (f) => path.join(OUT, f);
async function save(file, buf) {
  await writeFile(out(file), buf);
  const m = await sharp(buf).metadata();
  report.files[file] = { width: m.width, height: m.height, bytes: (await stat(out(file))).size };
}
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
const logoAt = (w) => sharp(LOGO).resize({ width: w, kernel: 'lanczos3' }).png().toBuffer({ resolveWithObject: true });
/** Apply an opacity to an image by scaling its alpha channel (position/opacity are the only allowed changes). */
const withOpacity = async (buf, a) =>
  sharp(await sharp(buf).ensureAlpha().png().toBuffer()).linear([1, 1, 1, a], [0, 0, 0, 0]).png().toBuffer();

const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

// Text layers: system Chrome + self-hosted Plus Jakarta Sans (see header).
const FONT_CSS = await (async () => {
  const f400 = (await readFile(path.join(HERE, 'fonts/PlusJakartaSans-400.ttf'))).toString('base64');
  const f700 = (await readFile(path.join(HERE, 'fonts/PlusJakartaSans-700.ttf'))).toString('base64');
  return `@font-face{font-family:"PJS";font-weight:400;src:url(data:font/ttf;base64,${f400}) format("truetype")}
@font-face{font-family:"PJS";font-weight:700;src:url(data:font/ttf;base64,${f700}) format("truetype")}`;
})();
let browser;
async function textLayer(w, h, body, css = '') {
  browser ??= await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
html,body{margin:0;padding:0;background:transparent;width:${w}px;height:${h}px;overflow:hidden}
body{position:relative;font-family:"PJS",sans-serif;-webkit-font-smoothing:antialiased;font-kerning:normal}
p{margin:0}
${css}</style></head><body>${body}</body></html>`,
    { waitUntil: 'load' },
  );
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => document.fonts.check('700 20px PJS') && document.fonts.check('400 20px PJS'));
  if (!ok) throw new Error('Plus Jakarta Sans did not load in the text layer');
  const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
  return buf;
}

// ---------------------------------------------------------------------------------------------------------
// 1. Icons: the whole logo, scaled as one square so its proportions stay exact, on a white plate.
// ---------------------------------------------------------------------------------------------------------
async function squareIcon({ size, logoWidth, radius = 0, plate = true }) {
  const C = Math.round(LW / (logoWidth / size)); // square canvas in logo px
  const left = Math.round((C - LW) / 2);
  const top = Math.round((C - LH) / 2);
  const background = plate ? { r: 255, g: 255, b: 255, alpha: 1 } : { r: 255, g: 255, b: 255, alpha: 0 };
  let img = await sharp({ create: { width: C, height: C, channels: 4, background } })
    .composite([{ input: LOGO, left, top }])
    .png()
    .toBuffer();
  img = await sharp(img).resize(size, size, { kernel: 'lanczos3' }).png().toBuffer();
  if (radius > 0) {
    const mask = svg(size, size, `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/>`);
    img = await sharp(img).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  }
  return img;
}

async function buildIcons() {
  const wordmarkFrac = GEO.groups.wordmark.h / LH; // wordmark box height as a share of logo height
  const letterFrac = GEO.groups['letter-f'].h / LH;
  const markFrac = GEO.groups.mark.w / LW;
  const sizes = [];
  for (const f of S.icons.favicon) {
    await save(f.file, await squareIcon({ size: f.size, logoWidth: f.logoWidth, radius: f.radius }));
    await save(f.bare, await squareIcon({ size: f.size, logoWidth: f.size, plate: false }));
    sizes.push({ file: f.file, size: f.size, logoWidth: f.logoWidth });
  }
  const at = S.icons.appleTouch;
  await save(at.file, await sharp(await squareIcon({ size: at.size, logoWidth: at.logoWidth })).flatten({ background: '#FFFFFF' }).png().toBuffer());
  sizes.push({ file: at.file, size: at.size, logoWidth: at.logoWidth });

  const mk = S.icons.maskable;
  const diag = Math.hypot(LW, LH);
  const mw = (mk.logoDiagonal * LW) / diag;
  await save(mk.file, await sharp(await squareIcon({ size: mk.size, logoWidth: mw })).flatten({ background: '#FFFFFF' }).png().toBuffer());
  sizes.push({ file: mk.file, size: mk.size, logoWidth: Math.round(mw * 10) / 10 });

  report.icons = sizes.map((s) => {
    const logoH = (s.logoWidth * LH) / LW;
    return {
      ...s,
      logoHeight: Math.round(logoH * 10) / 10,
      letterPx: Math.round(logoH * letterFrac * 10) / 10,
      wordmarkPx: Math.round(logoH * wordmarkFrac * 10) / 10,
      markPx: Math.round(s.logoWidth * markFrac * 10) / 10,
    };
  });
  const halfDiag = (mw * Math.hypot(1, LH / LW)) / 2;
  report.safeZone = {
    safeRadius: mk.safeDiameter / 2,
    logoCornerRadius: Math.round(halfDiag * 10) / 10,
    inside: halfDiag <= mk.safeDiameter / 2,
    logoWidthShare: Math.round((mw / mk.size) * 1000) / 10,
  };
}

// ---------------------------------------------------------------------------------------------------------
// 2. OG card 1200x630: white band left with the logo top-left, Artwork right (never cropped).
// ---------------------------------------------------------------------------------------------------------
async function buildOg() {
  const o = S.og;
  const slotW = o.width - o.bandWidth;
  const art = await sharp(ARTWORK).resize(slotW, o.height, { fit: 'contain', background: o.mat }).png().toBuffer();
  const { data: logo, info } = await logoAt(o.logoWidth);
  const textTop = o.margin + info.height + 56;
  const text = await textLayer(
    o.width,
    o.height,
    `<i class="bar"></i><p class="tag">${o.tagline}</p><p class="foot">${o.footer}</p><i class="rule"></i>`,
    `.bar{position:absolute;left:${o.margin + 6}px;top:${textTop - 22}px;width:48px;height:5px;border-radius:3px;background:#0055A5}
.tag{position:absolute;left:${o.margin + 6}px;top:${textTop}px;width:${o.bandWidth - 2 * o.margin - 12}px;font-weight:700;font-size:35px;line-height:1.16;letter-spacing:-0.01em;color:#1A1A1A}
.foot{position:absolute;left:${o.margin + 6}px;bottom:${o.margin + 4}px;font-size:22px;color:#5A5650}
.rule{position:absolute;left:${o.bandWidth}px;top:0;width:1px;height:100%;background:${o.divider}}`,
  );
  const card = await sharp({ create: { width: o.width, height: o.height, channels: 3, background: '#FFFFFF' } })
    .composite([
      { input: art, left: o.bandWidth, top: 0 },
      { input: logo, left: o.margin, top: o.margin },
      { input: text, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await save('og-card.png', card);
  report.og = { logoWidth: info.width, logoHeight: info.height, logoBox: { x: o.margin, y: o.margin, w: info.width, h: info.height } };
}

// ---------------------------------------------------------------------------------------------------------
// 3. Watermark (gallery preview 1600x1200, social kit): full logo, corner, ghosted on a soft white backing.
// ---------------------------------------------------------------------------------------------------------
function place(p, W, H, w, h, m) {
  switch (p) {
    case 'top-left':
      return { left: m, top: m };
    case 'top-right':
      return { left: W - m - w, top: m };
    case 'bottom-left':
      return { left: m, top: H - m - h };
    default:
      return { left: W - m - w, top: H - m - h };
  }
}

async function stamp(baseBuf, W, H, p, { opacity = p.opacity, auto = true } = {}) {
  const long = Math.max(W, H);
  const { data: logo, info } = await logoAt(Math.max(p.minLogoWidth, Math.round(long * p.scale)));
  const pad = Math.round(info.width * p.backing.pad);
  const bw = info.width + 2 * pad;
  const bh = info.height + 2 * pad;
  const m = Math.round(long * p.margin);
  const { left, top } = place(p.placement, W, H, bw, bh, m);

  // Busy/dark rule: measure the corner under the stamp; raise the backing if it is dark or busy.
  const st = await sharp(baseBuf).extract({ left, top, width: bw, height: bh }).greyscale().stats();
  const luma = st.channels[0].mean / 255;
  const std = st.channels[0].stdev / 255;
  const busy = auto && (luma < p.busy.lumaBelow || std > p.busy.stdAbove);
  const backingOpacity = busy ? p.busy.backingOpacity : p.backing.opacity;

  const f = p.backing.feather;
  const r = Math.round(bh * p.backing.radius);
  const backing = svg(
    bw + 4 * f,
    bh + 4 * f,
    `<defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f / 2}"/></filter></defs>
<rect x="${2 * f}" y="${2 * f}" width="${bw}" height="${bh}" rx="${r}" fill="${p.backing.colour}" fill-opacity="${backingOpacity}" filter="url(#s)"/>`,
  );
  // multiply: the logo's white JPEG background drops out instead of printing a pale rectangle; on white the
  // colours are exact. libvips multiplies a semi-transparent source in premultiplied form (which darkens the
  // white), so multiply at full strength on a patch first, then lay that patch over at `opacity`:
  // out = (1 - opacity) * base + opacity * (base * logo).
  const backed = await sharp(baseBuf)
    .composite([{ input: backing, left: left - 2 * f, top: top - 2 * f }])
    .png()
    .toBuffer();
  const region = { left: left + pad, top: top + pad, width: info.width, height: info.height };
  const patch = await sharp(await sharp(backed).extract(region).png().toBuffer())
    .composite([{ input: logo, blend: p.blend }])
    .png()
    .toBuffer();
  const buf = await sharp(backed)
    .composite([{ input: await withOpacity(patch, opacity), left: region.left, top: region.top }])
    .png()
    .toBuffer();
  return {
    buf,
    logo,
    box: { left, top, w: bw, h: bh, logoLeft: left + pad, logoTop: top + pad, logoW: info.width, logoH: info.height },
    busy,
    luma: Math.round(luma * 100) / 100,
    std: Math.round(std * 100) / 100,
    backingOpacity,
  };
}

/** Contrast inside the stamped logo, measured on output pixels: letters vs tiles, wordmark text vs its ground. */
async function measure(res) {
  const { data: L, info } = await sharp(res.logo).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: O } = await sharp(res.buf)
    .extract({ left: res.box.logoLeft, top: res.box.logoTop, width: info.width, height: info.height })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const k = info.width / LW;
  const g = GEO.groups;
  const inB = (x, y, b) => x >= b.x * k && x < (b.x + b.w) * k && y >= b.y * k && y < (b.y + b.h) * k;
  const acc = { letter: [0, 0, 0, 0], tile: [0, 0, 0, 0], text: [0, 0, 0, 0], ground: [0, 0, 0, 0] };
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 3;
      const [r, gg, b] = [L[i], L[i + 1], L[i + 2]];
      const mx = Math.max(r, gg, b);
      const mn = Math.min(r, gg, b);
      let set = null;
      if (inB(x, y, g['letter-f']) || inB(x, y, g['letter-a'])) {
        if (mn > 225) set = 'letter';
      } else if ((inB(x, y, g['tile-red']) || inB(x, y, g['tile-blue'])) && mx - mn > 120) set = 'tile';
      else if (inB(x, y, g.wordmark)) {
        if (mx < 80) set = 'text';
        else if (mn > 235) set = 'ground';
      }
      if (!set) continue;
      const a = acc[set];
      a[0] += O[i];
      a[1] += O[i + 1];
      a[2] += O[i + 2];
      a[3]++;
    }
  const mean = (a) => [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
  return { lettersVsTiles: ratio(mean(acc.letter), mean(acc.tile)), wordmark: ratio(mean(acc.text), mean(acc.ground)) };
}

async function buildWatermark() {
  const p = S.preview;
  const W = 1600;
  const H = 1200;
  const light = await sharp(ARTWORK).resize(W, H).png().toBuffer();
  // Dark test surface: the same procedural fixture, inverted. Not real Artwork; only for contrast checks.
  const dark = await sharp(light).negate({ alpha: false }).png().toBuffer();
  const crop = { left: W - 440, top: H - 300, width: 440, height: 300 };

  const main = await stamp(light, W, H, p);
  await save('preview-watermarked.jpg', await sharp(main.buf).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
  const mainDark = await stamp(dark, W, H, p);
  await save('preview-watermarked-dark.jpg', await sharp(mainDark.buf).jpeg({ quality: 82, mozjpeg: true }).toBuffer());

  const ladder = [];
  for (const op of p.ladder) {
    const tag = String(Math.round(op * 100));
    const l = await stamp(light, W, H, p, { opacity: op });
    const d = await stamp(dark, W, H, p, { opacity: op });
    await save(`wm-crop-light-op${tag}.png`, await sharp(l.buf).extract(crop).png().toBuffer());
    await save(`wm-crop-dark-op${tag}.png`, await sharp(d.buf).extract(crop).png().toBuffer());
    ladder.push({ opacity: op, light: await measure(l), dark: await measure(d) });
  }
  const noRule = await stamp(light, W, H, p, { auto: false });
  await save('wm-crop-light-op18-norule.png', await sharp(noRule.buf).extract(crop).png().toBuffer());

  // Reference: the unaltered logo on white.
  const { data: ref } = await logoAt(main.box.logoW);
  const refRes = { buf: await sharp({ create: { width: main.box.logoW, height: main.box.logoH, channels: 3, background: '#FFFFFF' } }).composite([{ input: ref }]).png().toBuffer(), logo: ref, box: { logoLeft: 0, logoTop: 0 } };

  report.watermark = {
    crop,
    box: main.box,
    reference: await measure(refRes),
    light: { luma: main.luma, std: main.std, busy: main.busy, backingOpacity: main.backingOpacity },
    dark: { luma: mainDark.luma, std: mainDark.std, busy: mainDark.busy, backingOpacity: mainDark.backingOpacity },
    noRule: { backingOpacity: noRule.backingOpacity },
    ladder,
  };
}

// ---------------------------------------------------------------------------------------------------------
// 4. Judging derivative 2560x1920: a small label top-left (opposite corner to the public watermark).
// ---------------------------------------------------------------------------------------------------------
async function buildJudging() {
  const j = S.judging;
  const W = 2560;
  const H = 1920;
  const base = await sharp(ARTWORK).resize(W, H).png().toBuffer();
  const { data: logo, info } = await logoAt(Math.round(W * j.scale));
  const pad = 26;
  const gap = 28;
  const textW = 330;
  const lw = pad + info.width + gap + textW + pad;
  const lh = pad + info.height + pad;
  const text = await textLayer(
    textW,
    info.height,
    `<div class="t"><p class="a">${j.text}</p><p class="b">${j.subtext}</p></div>`,
    `.t{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:8px}
.a{font-weight:700;font-size:36px;letter-spacing:0.12em;color:#1A1A1A;line-height:1}
.b{font-size:23px;color:#5A5650;line-height:1.2}`,
  );
  const plate = svg(lw, lh, `<rect width="${lw}" height="${lh}" rx="18" fill="${j.plate.colour}" fill-opacity="${j.plate.opacity}"/>`);
  const label = await sharp({ create: { width: lw, height: lh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: plate, left: 0, top: 0 },
      { input: logo, left: pad, top: pad },
      { input: text, left: pad + info.width + gap, top: pad },
    ])
    .png()
    .toBuffer();
  const m = Math.round(W * j.margin);
  const pos = place(j.placement, W, H, lw, lh, m);
  const img = await sharp(base)
    .composite([{ input: await withOpacity(label, j.opacity), ...pos }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await save('judging-marked.jpg', img);
  const cropBox = { left: 0, top: 0, width: Math.min(W, pos.left + lw + 120), height: Math.min(H, pos.top + lh + 100) };
  await save('judging-crop.png', await sharp(img).extract(cropBox).png().toBuffer());
  report.judging = { label: { ...pos, w: lw, h: lh }, logoWidth: info.width, crop: cropBox };
}

// ---------------------------------------------------------------------------------------------------------
// 5. Certificate share image 1080x1350 (FR-CERT-03 / FR-STAMP-02): logo, seal, number, QR to /verify.
// ---------------------------------------------------------------------------------------------------------
async function buildCertificate() {
  const c = S.certificate;
  const cs = FX.certificateShare;
  const W = c.width;
  const H = c.height;
  const { data: logo, info } = await logoAt(c.logoWidth);
  const logoLeft = Math.round((W - info.width) / 2);
  const gold = c.sealColour;
  const ring = 'FRIENDS OF ANIMALS · ' + cs.competition.toUpperCase() + ' · ';
  const seal = `<svg class="seal" width="300" height="300" viewBox="0 0 300 300" aria-hidden="true">
  <defs><path id="ring" d="M150,150 m-121,0 a121,121 0 1,1 242,0 a121,121 0 1,1 -242,0"/></defs>
  <circle cx="150" cy="150" r="144" fill="#FBF5E6" stroke="${gold}" stroke-width="4"/>
  <circle cx="150" cy="150" r="102" fill="none" stroke="${gold}" stroke-width="2"/>
  <text font-family="PJS" font-weight="700" font-size="17.5" fill="${gold}"><textPath href="#ring" startOffset="0" textLength="${(2 * Math.PI * 121 - 6).toFixed(1)}" lengthAdjust="spacing">${ring}</textPath></text>
  <polygon fill="${gold}" points="${star(150, 92, 15, 6.5)}"/>
  <text x="150" y="168" text-anchor="middle" font-family="PJS" font-weight="700" font-size="56" fill="${gold}">GOLD</text>
  <text x="150" y="200" text-anchor="middle" font-family="PJS" font-weight="700" font-size="17" letter-spacing="4" fill="${gold}">${cs.type}</text>
</svg>`;
  const qrLeft = 650;
  const qrTop = 856;
  const text = await textLayer(
    W,
    H,
    `<i class="frame"></i>
<p class="eyebrow">${cs.title.toUpperCase()}</p>
<p class="to">Awarded to</p>
<p class="name">${cs.recipientDisplayName}</p>
<p class="award">${cs.award}</p>
<p class="comp">${cs.competition} · ${cs.school}</p>
<i class="div"></i>
${seal}
<p class="num">${cs.number}</p>
<p class="issued">Issued ${cs.issuedOnLabel}</p>
<p class="verify">Scan or visit<br>${cs.verifyUrlLabel}</p>`,
    `.frame{position:absolute;inset:40px;border:2px solid #CFC7B8;border-radius:28px}
.eyebrow,.to,.name,.award,.comp{position:absolute;left:0;right:0;text-align:center}
.eyebrow{top:${c.logoTop + info.height + 62}px;font-weight:700;font-size:26px;letter-spacing:0.16em;color:${c.accent}}
.to{top:${c.logoTop + info.height + 118}px;font-size:26px;color:#5A5650}
.name{top:${c.logoTop + info.height + 156}px;font-weight:700;font-size:100px;line-height:1.05;letter-spacing:-0.02em;color:#1A1A1A}
.award{top:${c.logoTop + info.height + 284}px;font-weight:700;font-size:36px;color:#1A1A1A}
.comp{top:${c.logoTop + info.height + 336}px;font-size:28px;color:#5A5650}
.div{position:absolute;left:${W / 2 - 70}px;top:${c.logoTop + info.height + 410}px;width:140px;height:2px;background:#D9D4CA}
.seal{position:absolute;left:132px;top:${qrTop - 14}px}
.num{position:absolute;left:${qrLeft - 80}px;width:${c.qrSize + 160}px;top:${qrTop + c.qrSize + 22}px;text-align:center;font-weight:700;font-size:27px;letter-spacing:0.02em;color:#1A1A1A}
.issued{position:absolute;left:${qrLeft - 80}px;width:${c.qrSize + 160}px;top:${qrTop + c.qrSize + 62}px;text-align:center;font-size:22px;color:#5A5650}
.verify{position:absolute;left:${qrLeft - 160}px;width:${c.qrSize + 320}px;top:${qrTop + c.qrSize + 100}px;text-align:center;font-size:20px;line-height:1.35;color:#5A5650}`,
  );
  const qr = await sharp(QR, { density: (72 * c.qrSize) / cs.qr.width }).resize(c.qrSize, c.qrSize, { kernel: 'nearest' }).png().toBuffer();
  const img = await sharp({ create: { width: W, height: H, channels: 3, background: '#FFFFFF' } })
    .composite([
      { input: logo, left: logoLeft, top: c.logoTop },
      { input: qr, left: qrLeft, top: qrTop },
      { input: text, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await save('certificate-share.png', img);
  report.certificate = { logo: { x: logoLeft, y: c.logoTop, w: info.width, h: info.height }, qr: { x: qrLeft, y: qrTop, size: c.qrSize } };
}

function star(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 ? r : R;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ---------------------------------------------------------------------------------------------------------
try {
  await buildIcons();
  await buildOg();
  await buildWatermark();
  await buildJudging();
  await buildCertificate();
} finally {
  await browser?.close();
}
await writeFile(path.join(HERE, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`variant A: ${Object.keys(report.files).length} files → ${OUT}`);
console.log(JSON.stringify({ icons: report.icons, safeZone: report.safeZone, watermark: { light: report.watermark.light, dark: report.watermark.dark, reference: report.watermark.reference, ladder: report.watermark.ladder } }, null, 1));
