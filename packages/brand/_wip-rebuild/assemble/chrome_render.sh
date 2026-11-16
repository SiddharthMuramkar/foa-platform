#!/bin/zsh
# Render final SVG in headless Chrome at 1x and 4x on the raster pixel grid (viewport = raster px 0..910 x 0..500).
set -e
A=/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/assemble
SVG=/Users/siddharth/Developer/foa-platform-wt-6-logo-svg/packages/brand/foa-logo.svg
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# measurement copy: only the root viewport changes (raster-grid window, explicit size); geometry untouched
sed -E '1s|viewBox="[^"]+" role="img"|viewBox="0 0 910 500" width="910" height="500" role="img"|' "$SVG" > $A/chrome/m.svg
head -1 $A/chrome/m.svg
cat > $A/chrome/m.html <<H
<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;overflow:hidden}img{display:block}</style></head><body><img src="m.svg" width="910" height="500"></body></html>
H
# as-shipped file (tight viewBox, no width/height) sized by CSS, sanity check for clipping
cp "$SVG" $A/chrome/shipped.svg
cat > $A/chrome/shipped.html <<H
<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;overflow:hidden}img{display:block;width:729.75px;margin:20px}</style></head><body><img src="shipped.svg" alt="Friends of Animals"></body></html>
H
for s in 1 4; do
  "$CH" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
    --user-data-dir=$A/chrome/prof --force-device-scale-factor=$s --window-size=910,500 \
    --screenshot=$A/chrome/chrome_${s}x.png file://$A/chrome/m.html 2>/dev/null
done
"$CH" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
    --user-data-dir=$A/chrome/prof --force-device-scale-factor=1 --window-size=780,470 \
    --screenshot=$A/chrome/chrome_shipped.png file://$A/chrome/shipped.html 2>/dev/null
"$CH" --version
