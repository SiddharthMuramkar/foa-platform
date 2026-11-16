// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Screenshot a brand-kit variant with system Chrome (playwright-core, no browser download).
//   node apps/web/scripts/shoot.mjs --variant A --out /abs/dir [--base http://localhost:3113] [--full]
// Writes <out>/<variant>-<phone|desktop>-<light|dark>.png at 390x844 and 1440x900, ?shot=1&theme=…,
// with prefers-reduced-motion: reduce. Needs the app running (pnpm brand-kit, or next start -p 3113).
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const variant = (arg('variant', 'A') || 'A').toUpperCase();
const base = arg('base', 'http://localhost:3113');
const out = path.resolve(arg('out', path.join(os.tmpdir(), 'foa-brand-kit-shots')));
const fullPage = process.argv.includes('--full');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  for (const [label, viewport] of [
    ['phone', { width: 390, height: 844 }],
    ['desktop', { width: 1440, height: 900 }],
  ]) {
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({
        viewport,
        deviceScaleFactor: label === 'phone' ? 2 : 1,
        colorScheme: theme,
        reducedMotion: 'reduce',
      });
      const page = await ctx.newPage();
      await page.goto(`${base}/prototype/brand-kit?variant=${variant}&theme=${theme}&shot=1`, { waitUntil: 'networkidle' });
      const file = path.join(out, `${variant}-${label}-${theme}.png`);
      await page.screenshot({ path: file, fullPage });
      console.log(file);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
