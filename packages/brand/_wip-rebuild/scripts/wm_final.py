"""Final assembly: refined Heros outlines -> clean micro-segment in 'e' counter -> write parts/wordmark.svg -> verify."""
import sys, json, io
sys.path.insert(0, '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/scripts')
import numpy as np, resvg_py
from PIL import Image
import wm_refine as R, wmlib as L, wm_write as W, wm_fit as F
from wm_refine_par import ser

o = json.load(open(L.WORK + '/refined_heros.json'))
css = [R.build_from(c) for c in o['contours']]
# 'e' counter: Heros has a 6-unit micro-curve at the eye/bar corner (424,312)->(423,306); emboldening flipped it
# into a 0.2 px self-overlap. Collapse it to a plain corner on the bar line.
c = css[3][1]
N = c['N']
assert np.linalg.norm(N[1] - N[0]) < 0.8 and c['seg'][0][0] == 'C' and c['seg'][1][0] == 'L'
N0 = np.array([N[0][0], N[1][1]])
c['N'] = np.vstack([N0[None], N[2:]])
c['seg'] = c['seg'][1:]
json.dump(dict(face='heros', contours=[ser(cs) for cs in css]), open(L.WORK + '/refined_heros_final.json', 'w'))
ds = [R.to_d(cs, 2) for cs in css]
out = L.WORK + '/parts/wordmark.svg'
W.write_svg(out, ds, comment='FOA wordmark "Friends of Animals"; glyph outlines derived from TeX Gyre Heros Regular (GUST e-foundry, GUST Font License = LPPL 1.3c), fitted to the source raster; user units = raster px')
m, ps = W.measure_file(out)
print('file metric', {k: round(v, 4) for k, v in m.items()})
for pid, _, d in ps:
    a = L.render([d], L.WIN, 4)
    s = '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="%d %d %d %d"><path d="%s" fill="#000" fill-rule="evenodd"/></svg>' % (L.WIN[2] * 4, L.WIN[3] * 4, *L.WIN, d)
    b = np.asarray(Image.open(io.BytesIO(bytes(resvg_py.svg_to_bytes(svg_string=s)))))[..., 3] / 255
    if np.abs(a - b).max() > 0.01:
        print('winding/self-overlap issue in', pid)
print('evenodd check done')
