"""Metric library for the assembled FOA logo (definition from the task brief)."""
import io, re, copy
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import xml.etree.ElementTree as ET
import resvg_py

A = '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/assemble'
SRC = '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/foa-logo.jpg'
SVG = '/Users/siddharth/Developer/foa-platform-wt-6-logo-svg/packages/brand/foa-logo.svg'
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)

RED = (203, 35, 34); GREEN = (1, 173, 1); BLUE = (38, 63, 241); WHITE = (255, 255, 255); BLACK = (0, 0, 0)
RASTER = np.asarray(Image.open(SRC).convert('RGB'))

def set_viewport(svg_text, roi, s):
    x0, y0, x1, y1 = roi
    return re.sub(r'viewBox="[^"]+"', f'viewBox="{x0} {y0} {x1-x0} {y1-y0}" width="{(x1-x0)*s}" height="{(y1-y0)*s}"', svg_text, count=1)

def render(svg_text, roi, s, bg=True):
    png = resvg_py.svg_to_bytes(svg_string=set_viewport(svg_text, roi, s))
    a = np.asarray(Image.open(io.BytesIO(bytes(png))).convert('RGBA')).astype(np.float32)
    if not bg:
        return a[..., 3] / 255.0
    al = a[..., 3:4] / 255.0
    return a[..., :3] * al + 255.0 * (1 - al)   # composite over white (resvg output is premultiplied->straight via PIL)

def isolate(svg_text, keep_id):
    """SVG text with every painted shape removed except those inside/at keep_id."""
    root = ET.fromstring(svg_text)
    parent = {c: p for p in root.iter() for c in p}
    keep = None
    for el in root.iter():
        if el.get('id') == keep_id: keep = el
    assert keep is not None, keep_id
    keepset = set(keep.iter())
    for el in list(root.iter()):
        if el.tag in (f'{{{NS}}}rect', f'{{{NS}}}path') and el not in keepset:
            parent[el].remove(el)
    return ET.tostring(root, encoding='unicode')

def raster_up(roi, s, margin=6):
    x0, y0, x1, y1 = roi
    if s == 1:
        return RASTER[y0:y1, x0:x1].astype(np.float32)
    im = Image.fromarray(RASTER).crop((x0 - margin, y0 - margin, x1 + margin, y1 + margin))
    up = np.asarray(im.resize((im.width * s, im.height * s), Image.LANCZOS)).astype(np.float32)
    return up[margin * s:-margin * s, margin * s:-margin * s]

def proj(img, fg, bg):
    fg = np.array(fg, np.float32); bg = np.array(bg, np.float32); d = fg - bg
    return ((img - bg) @ d) / (d @ d)

def boundary(m):
    return m & ~ndi.binary_erosion(m, structure=ndi.generate_binary_structure(2, 1), border_value=0)

def metric(r, g, s):
    inter = (r & g).sum(); uni = (r | g).sum()
    rb = boundary(r); gb = boundary(g)
    dt = ndi.distance_transform_edt(~gb) / s
    d = dt[rb]
    if d.size == 0:
        return dict(iou=float(inter / max(uni, 1)), mean=np.nan, p95=np.nan, max=np.nan, at=None)
    k = np.argmax(dt * rb)
    yy, xx = np.unravel_index(k, rb.shape)
    return dict(iou=float(inter / uni), mean=float(d.mean()), p95=float(np.percentile(d, 95)),
                max=float(d.max()), at=(xx, yy))

def largest_overlap_component(m, seed):
    lab, n = ndi.label(m)
    if n == 0: return m
    ov = ndi.sum(seed, lab, index=np.arange(1, n + 1))
    return lab == (1 + int(np.argmax(ov)))

def assign(m, seeds):
    """pixel-level nearest-seed assignment of mask m among seeds (dict id->bool)."""
    ids = list(seeds)
    D = np.stack([ndi.distance_transform_edt(~seeds[i]) for i in ids])
    lab = np.argmin(D, axis=0)
    return {i: m & (lab == k) for k, i in enumerate(ids)}
