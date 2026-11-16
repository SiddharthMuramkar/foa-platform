import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from mlib import *
svg = open(SVG).read()
GLY = re.findall(r'id="(wm-\d+-\w)"', svg)
roi = (70, 410, 808, 477); s = 8
seeds = {i: render(isolate(svg, i), roi, s, bg=False) > 0.5 for i in GLY}
R = assign(proj(render(svg, roi, s), BLACK, WHITE) > 0.5, seeds)
tG = proj(raster_up(roi, s), BLACK, WHITE)
G = assign(tG > 0.5, seeds)
# signed distance field of raster mask (source px): + outside
sdG = (ndi.distance_transform_edt(~G_all) if False else None)
for k in GLY:
    r, g = R[k], G[k]
    per = boundary(g).sum() / s
    ro = (r & ~g).sum() / s**2; go = (g & ~r).sum() / s**2
    sd = (ndi.distance_transform_edt(~g) - ndi.distance_transform_edt(g)) / s
    rb = boundary(r)
    print(f"{k:8s} area {g.sum()/s**2:7.1f} per {per:6.1f} A/P {g.sum()/s**2/per:4.2f} render-only {ro:5.1f} raster-only {go:5.1f} net offset {(ro-go)/per:+.3f}px  abs {(ro+go)/per:.3f}px  sd-mean {sd[rb].mean():+.3f}")
# also: sweep threshold of raster to see IoU sensitivity
m_all = np.logical_or.reduce([R[k] for k in GLY])
for th in (0.4, 0.45, 0.5, 0.55, 0.6):
    g = tG > th
    print(th, 'IoU', ((m_all & g).sum() / (m_all | g).sum()).round(4))
