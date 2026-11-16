// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
// Review audit: rendered-text contrast, motion, CLS, images, overflow for /prototype/brand-kit.
import { chromium } from '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/protos/brand-kit/tools/node_modules/playwright-core/index.mjs';
import { writeFileSync } from 'node:fs';

const OUT = '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/protos/brand-kit/review';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const results = {};

const inPage = () => {
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) {
      // color(srgb r g b / a)
      const c = s.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
      if (c) return [c[1] * 255, c[2] * 255, c[3] * 255, c[4] === undefined ? 1 : +c[4]];
      return null;
    }
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
  };
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const [h, l] = [L(a), L(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
  const over = (fg, bg) => { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; };
  function bgOf(el) {
    const stack = [];
    let unknown = null;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !unknown) unknown = 'bg-image:' + cs.backgroundImage.slice(0, 40);
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { stack.push(c); if (c[3] >= 1) break; }
    }
    let bg = [255, 255, 255, 1];
    if (stack.length && stack[stack.length - 1][3] >= 1) bg = stack[stack.length - 1];
    else { const hc = parse(getComputedStyle(document.documentElement).backgroundColor); if (hc) bg = hc; }
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i][3] < 1) bg = over(stack[i], bg);
    return { bg, unknown };
  }
  const rows = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (el.closest('[data-prototype-switcher],script,style,noscript,.sr-only')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let op = 1;
    for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const fg0 = parse(cs.color);
    const { bg, unknown } = bgOf(el);
    const fg = over([fg0[0], fg0[1], fg0[2], fg0[3] * op], bg);
    const size = parseFloat(cs.fontSize);
    const weight = +cs.fontWeight;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const cr = ratio(fg, bg);
    rows.push({ text: t.textContent.trim().slice(0, 60), tag: el.tagName, cls: (el.className && el.className.baseVal === undefined ? el.className : '').slice(0, 80), fg: fg.slice(0, 3).map(Math.round), bg: bg.slice(0, 3).map(Math.round), ratio: Math.round(cr * 100) / 100, size, weight, large, need: large ? 3 : 4.5, unknown, op });
  }
  // Motion
  const motion = [];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const an = cs.animationName !== 'none' ? cs.animationName + ' ' + cs.animationDuration + ' x' + cs.animationIterationCount : null;
    const tr = cs.transitionProperty !== 'all' || cs.transitionDuration !== '0s' ? (cs.transitionDuration !== '0s' ? cs.transitionProperty + ' ' + cs.transitionDuration : null) : null;
    if (an || tr) motion.push({ tag: el.tagName, cls: String(el.className?.baseVal ?? el.className).slice(0, 80), an, tr });
  }
  // Images
  const imgs = [...document.images].map((i) => ({ src: i.currentSrc.replace(location.origin, '').slice(0, 90), wAttr: i.getAttribute('width'), hAttr: i.getAttribute('height'), loading: i.loading, fetchpriority: i.getAttribute('fetchpriority'), nat: [i.naturalWidth, i.naturalHeight], box: [Math.round(i.getBoundingClientRect().width), Math.round(i.getBoundingClientRect().height)], top: Math.round(i.getBoundingClientRect().top + scrollY), sizes: i.sizes, complete: i.complete }));
  // Overflow
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 0.5 || r.left < -0.5) {
      // ignore if clipped by an overflow ancestor
      let clipped = false;
      for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
        const o = getComputedStyle(e);
        if (o.overflowX !== 'visible') { const pr = e.getBoundingClientRect(); if (pr.right <= vw + 0.5 && pr.left >= -0.5) { clipped = true; break; } }
      }
      if (!clipped && getComputedStyle(el).position !== 'fixed') offenders.push({ tag: el.tagName, cls: String(el.className?.baseVal ?? el.className).slice(0, 60), l: Math.round(r.left), r: Math.round(r.right) });
    }
  }
  return { rows, motion, imgs, scrollW: document.documentElement.scrollWidth, vw, offenders: offenders.slice(0, 20), nOff: offenders.length };
};

for (const v of ['A', 'B', 'C']) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    for (const theme of ['light', 'dark']) {
      for (const mode of ['forced', 'os']) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'no-preference' });
        const page = await ctx.newPage();
        await page.addInitScript(() => {
          window.__cls = 0; window.__shifts = [];
          new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: e.value, src: e.sources?.map((s) => (s.node?.nodeName || '') + '.' + String(s.node?.className?.baseVal ?? s.node?.className ?? '').slice(0, 40)) }); } } }).observe({ type: 'layout-shift', buffered: true });
        });
        const url = `http://localhost:3113/prototype/brand-kit?variant=${v}&shot=1` + (mode === 'forced' ? `&theme=${theme}` : '');
        await page.goto(url, { waitUntil: 'networkidle' });
        // scroll through to load lazy images and observe shifts
        const H = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < H; y += h * 0.8) { await page.evaluate((yy) => scrollTo(0, yy), y); await page.waitForTimeout(60); }
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => scrollTo(0, 0));
        const data = await page.evaluate(inPage);
        data.cls = await page.evaluate(() => window.__cls);
        data.shifts = await page.evaluate(() => window.__shifts.slice(0, 10));
        results[`${v}-${w}-${theme}-${mode}`] = data;
        await ctx.close();
      }
    }
  }
}
// Reduced-motion: compare computed motion with reduce
for (const v of ['A', 'B', 'C']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:3113/prototype/brand-kit?variant=${v}&shot=1`, { waitUntil: 'networkidle' });
  results[`${v}-reduce`] = { motion: (await page.evaluate(inPage)).motion };
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/audit.json`, JSON.stringify(results, null, 1));
for (const [k, d] of Object.entries(results)) {
  if (!d.rows) { console.log(k, 'motion', JSON.stringify(d.motion)); continue; }
  const fails = d.rows.filter((r) => r.ratio < r.need);
  console.log(`${k}: texts ${d.rows.length}, fails ${fails.length}, unknownBg ${d.rows.filter((r) => r.unknown).length}, scrollW ${d.scrollW}/${d.vw}, off ${d.nOff}, CLS ${d.cls.toFixed(4)}, motion ${d.motion.length}`);
}
