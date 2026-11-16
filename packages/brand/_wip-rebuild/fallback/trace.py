"""Trace FOA wordmark band into per-glyph potrace paths; measure vs raster."""
import io, json, sys, time
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import potrace
import resvg_py

import os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = HERE + '/../../foa-logo.jpg'
W, H = 910, 512
BX0, BX1, BY0, BY1 = 77, 801, 416, 471  # wordmark bbox (exclusive end)
PAD = 6
X0, X1, Y0, Y1 = BX0 - PAD, BX1 + PAD, BY0 - PAD, BY1 + PAD
UP = 8
TEXT = "FriendsofAnimals"

full = np.asarray(Image.open(SRC).convert('L'), dtype=np.float32)[:H]
band = full[Y0:Y1, X0:X1]


def upsample(a, s):
    im = Image.fromarray(a.astype(np.float32), mode='F')
    return np.asarray(im.resize((a.shape[1] * s, a.shape[0] * s), Image.LANCZOS))


def segment(mask):
    lab, n = ndi.label(mask, structure=np.ones((3, 3)))
    objs = ndi.find_objects(lab)
    comps = []
    for i, sl in enumerate(objs):
        area = int((lab[sl] == i + 1).sum())
        if area < 4 * UP * UP:  # drop specks < ~4 raster px
            continue
        comps.append(dict(id=i + 1, y0=sl[0].start, y1=sl[0].stop, x0=sl[1].start, x1=sl[1].stop, area=area))
    # merge dots (small, sitting above a stem with overlapping x-range)
    comps.sort(key=lambda c: -c['area'])
    groups = []
    for c in comps:
        host = None
        for g in groups:
            gx0, gx1 = g['x0'], g['x1']
            ov = min(gx1, c['x1']) - max(gx0, c['x0'])
            if ov > 0.5 * (c['x1'] - c['x0']) and (c['y1'] <= g['y0'] + 2 * UP or g['y1'] <= c['y0'] + 2 * UP):
                host = g
                break
        if host is not None and c['area'] < 0.5 * host['area']:
            host['ids'].append(c['id'])
            host['x0'] = min(host['x0'], c['x0']); host['x1'] = max(host['x1'], c['x1'])
            host['y0'] = min(host['y0'], c['y0']); host['y1'] = max(host['y1'], c['y1'])
        else:
            groups.append(dict(ids=[c['id']], x0=c['x0'], x1=c['x1'], y0=c['y0'], y1=c['y1'], area=c['area']))
    groups.sort(key=lambda g: (g['x0'] + g['x1']) / 2)
    return lab, groups


def fmt(v):
    s = f"{v:.3f}".rstrip('0').rstrip('.')
    return s if s != '-0' else '0'


def trace_glyph(lab, g, params):
    m = np.isin(lab[g['y0']:g['y1'], g['x0']:g['x1']], g['ids'])
    m = np.pad(m, 2)
    oy, ox = g['y0'] - 2, g['x0'] - 2
    bm = potrace.Bitmap(~m)  # Bitmap inverts: pass background=True
    path = bm.trace(turdsize=params['turdsize'], turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                    alphamax=params['alphamax'], opticurve=params['opticurve'],
                    opttolerance=params['opttolerance'])

    def P(p):
        return fmt(X0 + (ox + p.x) / UP), fmt(Y0 + (oy + p.y) / UP)

    d = []
    for curve in path:
        sx, sy = P(curve.start_point)
        d.append(f"M{sx} {sy}")
        for seg in curve:
            if seg.is_corner:
                a, b = P(seg.c), P(seg.end_point)
                d.append(f"L{a[0]} {a[1]}L{b[0]} {b[1]}")
            else:
                a, b, c = P(seg.c1), P(seg.c2), P(seg.end_point)
                d.append(f"C{a[0]} {a[1]} {b[0]} {b[1]} {c[0]} {c[1]}")
        d.append("Z")
    return ''.join(d), len(path)


def build_svg(params):
    up = upsample(band, UP)
    mask = up < params['thresh']
    lab, groups = segment(mask)
    assert len(groups) == len(TEXT), (len(groups), [(g['x0'] / UP + X0) for g in groups])
    paths = []
    for i, (g, ch) in enumerate(zip(groups, TEXT)):
        d, n = trace_glyph(lab, g, params)
        paths.append(f'    <path id="wm-{i}-{ch}" d="{d}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">\n'
           f'  <g id="wordmark" fill="#000000" fill-rule="evenodd">\n' + '\n'.join(paths) +
           '\n  </g>\n</svg>\n')
    return svg, len(groups)


def render(svg, s):
    png = resvg_py.svg_to_bytes(svg_string=svg, width=W * s, height=H * s)
    a = np.asarray(Image.open(io.BytesIO(bytes(png))).convert('RGBA'), dtype=np.float32)
    alpha = a[..., 3] / 255.0
    return 255.0 * (1 - alpha)  # composited on white, black fill


def edges(m):
    return m & ~ndi.binary_erosion(m, structure=np.ones((3, 3)), border_value=0)


def metrics(svg, s):
    r = render(svg, s)[Y0 * s:Y1 * s, X0 * s:X1 * s]
    ref = band if s == 1 else upsample(band, s)
    A, B = r < 127.5, ref < 127.5
    iou = float((A & B).sum() / (A | B).sum())
    eA, eB = edges(A), edges(B)
    dA = ndi.distance_transform_edt(~eA)
    dB = ndi.distance_transform_edt(~eB)
    dev = np.concatenate([dB[eA], dA[eB]]) / s
    return dict(iou=round(iou, 5), mean_px=round(float(dev.mean()), 4), p95_px=round(float(np.percentile(dev, 95)), 4),
                max_px=round(float(dev.max()), 3), grey_mae=round(float(np.abs(r - ref).mean()), 3)), r, ref


if __name__ == '__main__':
    params = dict(thresh=127.5, alphamax=0.8, opticurve=True, opttolerance=0.2, turdsize=16)
    for kv in sys.argv[1:]:
        k, v = kv.split('=')
        params[k] = (v == 'True') if k == 'opticurve' else float(v)
    params['turdsize'] = int(params['turdsize'])
    t = time.time()
    svg, n = build_svg(params)
    m1, _, _ = metrics(svg, 1)
    m4, _, _ = metrics(svg, 4)
    print(json.dumps(dict(params=params, glyphs=n, m1=m1, m4=m4, secs=round(time.time() - t, 1))))
    open(HERE + f"/cand_{params['thresh']}_{params['alphamax']}_{params['opttolerance']}.svg", 'w').write(svg)
