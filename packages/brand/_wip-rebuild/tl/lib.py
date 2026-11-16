"""Shared helpers for tiles+letters fitting and metric."""
import io
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import resvg_py

SRC = '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/foa-logo.jpg'

RED = (203, 35, 34)
GREEN = (1, 173, 1)
BLUE = (38, 63, 241)
WHITE = (255, 255, 255)
HEX = {RED: '#CB2322', GREEN: '#01AD01', BLUE: '#263FF1', WHITE: '#FFFFFF'}


def luma_of(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def load_Y():
    im = Image.open(SRC)
    im.draft('YCbCr', im.size)
    return np.asarray(im)[..., 0].astype(float)


def load_RGB():
    return np.asarray(Image.open(SRC).convert('RGB')).astype(float)


def cov(Y, fg, bg):
    """coverage of fg colour (0..1) from raw luma"""
    yf, yb = luma_of(fg), luma_of(bg)
    return (Y - yb) / (yf - yb)


def crossings(F, x0, y0, level=0.5):
    """sub-pixel level crossings of field F (pixel-centred). Returns Nx2 (x,y) in
    raster coords (pixel (i,j) centre at (i+.5, j+.5)). F is a crop with origin x0,y0."""
    pts = []
    a, b = F[:, :-1], F[:, 1:]
    m = (a - level) * (b - level) < 0
    jj, ii = np.nonzero(m)
    t = (level - a[m]) / (b[m] - a[m])
    pts.append(np.c_[x0 + ii + 0.5 + t, y0 + jj + 0.5])
    a, b = F[:-1, :], F[1:, :]
    m = (a - level) * (b - level) < 0
    jj, ii = np.nonzero(m)
    t = (level - a[m]) / (b[m] - a[m])
    pts.append(np.c_[x0 + ii + 0.5, y0 + jj + 0.5 + t])
    return np.vstack(pts)


# ---------------------------------------------------------------- metric
S = 8


def render_mask(svg_inner, roi):
    x0, y0, x1, y1 = roi
    w, h = x1 - x0, y1 - y0
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}" '
           f'width="{w*S}" height="{h*S}">{svg_inner}</svg>')
    png = resvg_py.svg_to_bytes(svg_string=svg)
    a = np.asarray(Image.open(io.BytesIO(bytes(png))).convert('RGBA'))[..., 3]
    return a > 127


def raster_t(roi, fg, bg, mode='rgb', margin=6):
    """Lanczos-upscaled projection coefficient (0=bg,1=fg) over roi at S x."""
    x0, y0, x1, y1 = roi
    im = Image.open(SRC).convert('RGB')
    box = (x0 - margin, y0 - margin, x1 + margin, y1 + margin)
    c = im.crop(box)
    up = np.asarray(c.resize((c.width * S, c.height * S), Image.LANCZOS)).astype(float)
    up = up[margin * S:-margin * S, margin * S:-margin * S]
    fg = np.array(fg, float); bg = np.array(bg, float)
    if mode == 'rgb':
        d = fg - bg
        return ((up - bg) @ d) / (d @ d)
    else:  # luma
        L = up @ np.array([0.299, 0.587, 0.114])
        return (L - luma_of(bg)) / (luma_of(fg) - luma_of(bg))


def boundary(m):
    return m & ~ndi.binary_erosion(m, structure=ndi.generate_binary_structure(2, 1), border_value=0)


def metric(rmask, smask, exclude=None):
    """rmask: rendered; smask: raster ref. exclude: bool array of ref-boundary pixels
    to ignore (none by default)."""
    inter = (rmask & smask).sum(); uni = (rmask | smask).sum()
    iou = inter / uni
    rb = boundary(rmask); sb = boundary(smask)
    dt = ndi.distance_transform_edt(~sb) / S
    d = dt[rb]
    return dict(iou=float(iou), mean=float(d.mean()), p95=float(np.percentile(d, 95)),
                max=float(d.max()), n=int(rb.sum())), dt, rb


def area_points(F, x0, y0, half=3, maxstep=1.0):
    """Edge points by coverage integration (each pixel contributes its coverage f).
    Row-integrated where the edge is steep (|dx/dy|<=maxstep), column-integrated where
    shallow. F: coverage crop (1=inside) with origin x0,y0. Returns Nx2 (x,y)."""
    m = F > 0.5
    pts = []
    for axis in (1, 0):  # 1: along rows (x positions), 0: along columns
        G = F if axis == 1 else F.T
        M = m if axis == 1 else m.T
        nl, nw = G.shape
        cross = {}
        for j in range(nl):
            tr = np.nonzero(M[j, 1:] != M[j, :-1])[0]
            cross[j] = tr
        for j in range(1, nl - 1):
            for i in cross[j]:
                a, b = i - half + 1, i + half + 1
                if a < 0 or b > nw:
                    continue
                inner = cross[j][(cross[j] >= a) & (cross[j] < b - 1)]
                if len(inner) != 1:
                    continue
                # steepness test: neighbours must have a transition within maxstep
                ok = True
                for jj in (j - 1, j + 1):
                    c = cross[jj]
                    if not len(c) or np.abs(c - i).min() > maxstep:
                        ok = False
                if not ok:
                    continue
                s = G[j, a:b].sum()
                e = (b - s) if not M[j, i] else (a + s)
                if axis == 1:
                    pts.append((x0 + e, y0 + j + 0.5))
                else:
                    pts.append((x0 + j + 0.5, y0 + e))
    return np.array(pts)
