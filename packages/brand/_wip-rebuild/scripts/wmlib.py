"""Wordmark fitting library: target coverage, glyph outline sources, transforms, rendering, metric."""
import io
import numpy as np
from PIL import Image
import resvg_py
from scipy import ndimage as ndi
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

RASTER = '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/foa-logo.jpg'
WORK = '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work'
CHARS = "FriendsofAnimals"
BG = 254.66  # measured white around wordmark
INK = 0.0    # measured wordmark core (median 0,0,0)
# metric / fitting window (x0, y0, w, h) in raster px
WIN = (68, 408, 742, 70)

_L = np.asarray(Image.open(RASTER).convert('L')).astype(float)
COV = np.clip((BG - _L) / (BG - INK), 0, 1)

RBOX = np.load(WORK + '/rboxes.npy')  # per-glyph raster ink boxes x0,y0,x1,y1

# ---------------------------------------------------------------- outlines
def load_ttf(path, idx=0):
    f = TTFont(path, fontNumber=idx)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    out = []
    for c in CHARS:
        rp = DecomposingRecordingPen(gs)
        gs[cmap[ord(c)]].draw(rp)
        out.append(split_contours(rp.value))
    m = metrics_from(out, f)
    return out, m

def split_contours(value):
    """recording-pen value -> list of contours, each a list of (op, [pts])"""
    cons, cur = [], []
    for op, args in value:
        if op == 'moveTo':
            cur = [(op, list(args))]
        elif op in ('closePath', 'endPath'):
            if cur:
                cons.append(cur)
            cur = []
        else:
            cur.append((op, list(args)))
    if cur:
        cons.append(cur)
    return cons

def bounds_of(cons):
    pts = [p for con in cons for op, a in con for p in a]
    a = np.array(pts, float)
    return a[:, 0].min(), a[:, 1].min(), a[:, 0].max(), a[:, 1].max()

def metrics_from(glyphs, f=None):
    # cap from F, x-height from i stem (lowest contour), ascender from l
    F = bounds_of(glyphs[0])
    istem = min((bounds_of([c]) for c in glyphs[2]), key=lambda b: b[1])
    return dict(cap=F[3], xh=istem[3], upm=(f['head'].unitsPerEm if f is not None else 1000))

# ---------------------------------------------------------------- transform
def warp_y(v, a, b, k):
    v = np.asarray(v, float)
    return np.where(v <= k, a * v, a * k + b * (v - k))

def transform_contours(cons, p, k):
    """-> list of contours; each = list of (op, Nx2 array) in raster px (y down)."""
    out = []
    for con in cons:
        c2 = []
        for op, args in con:
            pts = np.array(args, float).reshape(-1, 2)
            X = p['tx'] + p['sx'] * pts[:, 0]
            Y = p['base'] - warp_y(pts[:, 1], p['a'], p['b'], k)
            c2.append((op, np.stack([X, Y], 1)))
        out.append(c2)
    return out

def _area(P):
    x, y = P[:, 0], P[:, 1]
    return 0.5 * float((x * np.roll(y, -1) - np.roll(x, -1) * y).sum())

def embolden(tcons, ex, ey):
    """FreeType-style XY emboldening of transformed contours: every point (on and off curve)
    moves along the miter of its neighbouring control-polygon edges; ex/ey = growth per side in px."""
    if not ex and not ey:
        return tcons
    loops = []
    for con in tcons:
        P = np.concatenate([a for _, a in con], 0)
        loops.append(P)
    big = max(range(len(loops)), key=lambda i: abs(_area(loops[i])))
    sig = 1.0 if _area(loops[big]) > 0 else -1.0
    out = []
    for con, P in zip(tcons, loops):
        n = len(P)
        closed_dup = n > 1 and np.allclose(P[0], P[-1])
        Q = P[:-1] if closed_dup else P
        m = len(Q)
        S = np.zeros_like(Q)
        for i in range(m):
            # previous / next distinct points
            j = (i - 1) % m
            while np.allclose(Q[j], Q[i]) and j != i:
                j = (j - 1) % m
            l = (i + 1) % m
            while np.allclose(Q[l], Q[i]) and l != i:
                l = (l + 1) % m
            ein = Q[i] - Q[j]; eout = Q[l] - Q[i]
            nin = np.linalg.norm(ein); nout = np.linalg.norm(eout)
            if nin == 0 or nout == 0:
                continue
            ein /= nin; eout /= nout
            d = float(ein @ eout)
            if d <= -0.9375:
                continue
            nrm_in = sig * np.array([ein[1], -ein[0]])
            nrm_out = sig * np.array([eout[1], -eout[0]])
            s = (nrm_in + nrm_out) / (1.0 + d)
            S[i] = s * np.array([ex, ey])
        if closed_dup:
            S = np.concatenate([S, S[:1]], 0)
        Pn = P + S
        c2 = []; o = 0
        for op, a in con:
            c2.append((op, Pn[o:o + len(a)])); o += len(a)
        out.append(c2)
    return out

def contours_to_d(tcons, nd=2):
    fmt = '%%.%df' % nd
    parts = []
    for con in tcons:
        for op, pts in con:
            X, Y = pts[:, 0], pts[:, 1]
            if op == 'qCurveTo' and len(pts) > 2:
                parts.append(_expand_q(X, Y, fmt))
                continue
            cmd = {'moveTo': 'M', 'lineTo': 'L', 'curveTo': 'C', 'qCurveTo': 'Q'}[op]
            parts.append(cmd + ' '.join((fmt % x) + ' ' + (fmt % y) for x, y in zip(X, Y)))
        parts.append('Z')
    return ''.join(parts)

def glyph_to_d(cons, p, k, nd=2, emb=None):
    """p = dict(tx, sx, base, a, b). X = tx + sx*u ; Y = base - warp(v); emb = (ex, ey) px or None."""
    t = transform_contours(cons, p, k)
    if emb is not None:
        t = embolden(t, *emb)
    return contours_to_d(t, nd)

def _expand_q(X, Y, fmt):
    pts = list(zip(X, Y))
    out = []
    offs, on = pts[:-1], pts[-1]
    for i in range(len(offs)):
        c = offs[i]
        if i < len(offs) - 1:
            n = offs[i + 1]
            e = ((c[0] + n[0]) / 2, (c[1] + n[1]) / 2)
        else:
            e = on
        out.append('Q' + (fmt % c[0]) + ' ' + (fmt % c[1]) + ' ' + (fmt % e[0]) + ' ' + (fmt % e[1]))
    return ''.join(out)

# ---------------------------------------------------------------- render
def render(ds, win=WIN, scale=1):
    x0, y0, w, h = win
    body = ''.join('<path d="%s" fill="#000"/>' % d for d in ds)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="%s %s %s %s">%s</svg>'
           % (round(w * scale), round(h * scale), x0, y0, w, h, body))
    png = resvg_py.svg_to_bytes(svg_string=svg)
    a = np.asarray(Image.open(io.BytesIO(bytes(png))))
    return a[..., 3].astype(float) / 255.0

def render_cov(ds, win=WIN, ss=8):
    """exact-ish coverage at source resolution: resvg/tiny-skia quantises AA to ~1/4 output px,
    so render at ss x and box-average (precision ~1/(4*ss) px)."""
    r = render(ds, win, ss)
    return r.reshape(win[3], ss, win[2], ss).mean((1, 3))

def target(win=WIN):
    x0, y0, w, h = win
    return COV[y0:y0 + h, x0:x0 + w]

# ---------------------------------------------------------------- metric
_TGT8 = {}
def raster_mask8(win=WIN):
    if win in _TGT8:
        return _TGT8[win]
    x0, y0, w, h = win
    crop = Image.fromarray(_L[y0:y0 + h, x0:x0 + w].astype(np.float32), mode='F')
    up = np.asarray(crop.resize((w * 8, h * 8), Image.LANCZOS))
    m = up < (BG + INK) / 2
    _TGT8[win] = m
    return m

def boundary(m):
    return m & ~ndi.binary_erosion(m, structure=np.ones((3, 3), bool), border_value=0)

def metric(ds, win=WIN, mask_region=None, return_maps=False):
    r = render(ds, win, 8) >= 0.5
    t = raster_mask8(win)
    if mask_region is not None:
        r = r & mask_region
        t = t & mask_region
    inter = (r & t).sum(); uni = (r | t).sum()
    iou = inter / uni
    br, bt = boundary(r), boundary(t)
    dt = ndi.distance_transform_edt(~bt) / 8.0
    d = dt[br]
    dt2 = ndi.distance_transform_edt(~br) / 8.0
    d2 = dt2[bt]
    res = dict(iou=float(iou), mean=float(d.mean()), p95=float(np.percentile(d, 95)),
               rmean=float(d2.mean()), rp95=float(np.percentile(d2, 95)))
    if return_maps:
        res['r'] = r; res['t'] = t; res['dt'] = dt; res['br'] = br
    return res
