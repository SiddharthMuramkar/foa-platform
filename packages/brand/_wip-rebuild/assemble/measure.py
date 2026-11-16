"""Per-group + whole-image metrics of the final SVG vs the raster (resvg 8x/4x/1x, Chrome 4x/1x)."""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from mlib import *

svg = open(sys.argv[1] if len(sys.argv) > 1 else SVG).read()
CH = {s: np.asarray(Image.open(f'{A}/chrome/chrome_{s}x.png').convert('RGB')).astype(np.float32) for s in (1, 4)}

TOES = [f'mark-paw-toe-{i}' for i in range(1, 5)]
GLY = re.findall(r'id="(wm-\d+-\w)"', svg)
CTX = [
    dict(roi=(71, 46, 305, 400), fg=RED, bg=WHITE, mode='fill', ids=['tile-red']),
    dict(roi=(305, 47, 566, 400), fg=GREEN, bg=WHITE, mode='fill', ids=['tile-green']),
    dict(roi=(566, 46, 808, 400), fg=BLUE, bg=WHITE, mode='fill', ids=['tile-blue']),
    dict(roi=(78, 53, 298, 393), fg=WHITE, bg=RED, mode='assign', ids=['letter-f'], report=['letter-f']),
    dict(roi=(312, 54, 559, 393), fg=WHITE, bg=GREEN, mode='assign',
         ids=['letter-o'] + TOES + ['mark-paw-pad', 'mark-hands-shape'], report=['letter-o']),
    dict(roi=(573, 53, 801, 393), fg=WHITE, bg=BLUE, mode='assign', ids=['letter-a'], report=['letter-a']),
    dict(roi=(360, 220, 510, 362), fg=GREEN, bg=WHITE, mode='fill', ids=['mark-disc']),
    dict(roi=(360, 220, 510, 362), fg=WHITE, bg=GREEN, mode='assign',
         ids=['letter-o'] + TOES + ['mark-paw-pad', 'mark-hands-shape'],
         report=TOES + ['mark-paw-pad', 'mark-hands-shape'],
         unions={'mark-paw': TOES + ['mark-paw-pad'], 'mark-hands': ['mark-hands-shape'],
                 'mark (white symbols)': TOES + ['mark-paw-pad', 'mark-hands-shape']}),
    dict(roi=(70, 410, 808, 477), fg=BLACK, bg=WHITE, mode='assign', ids=GLY, report=GLY,
         unions={'wordmark': GLY}),
]

def images(roi, s, who):
    x0, y0, x1, y1 = roi
    if who == 'resvg':
        return render(svg, roi, s)
    return CH[s][y0 * s:y1 * s, x0 * s:x1 * s]

def masks(img, ctx, seeds):
    m = proj(img, ctx['fg'], ctx['bg']) > 0.5
    out = {}
    if ctx['mode'] == 'fill':
        i = ctx['ids'][0]
        out[i] = largest_overlap_component(ndi.binary_fill_holes(m), seeds[i])
    else:
        out = assign(m, seeds)
        for u, members in ctx.get('unions', {}).items():
            out[u] = np.logical_or.reduce([out[k] for k in members])
    return out

def run(who, s):
    res = {}
    for ctx in CTX:
        roi = ctx['roi']
        seeds = {i: render(isolate(svg, i), roi, s, bg=False) > 0.5 for i in ctx['ids']}
        R = masks(images(roi, s, who), ctx, seeds)
        G = masks(raster_up(roi, s), ctx, seeds)
        keys = (ctx['ids'] if ctx['mode'] == 'fill' else ctx['report']) + list(ctx.get('unions', {}))
        for k in keys:
            mt = metric(R[k], G[k], s)
            if mt['at'] is not None:
                mt['at'] = (round(roi[0] + (mt['at'][0] + .5) / s, 1), round(roi[1] + (mt['at'][1] + .5) / s, 1))
            res[k] = mt
    return res

def whole(who, s):
    roi = (70, 44, 810, 478)
    img = images(roi, s, who); ref = raster_up(roi, s)
    yb = (405 - roi[1]) * s
    def labels(im):
        L = np.zeros(im.shape[:2], np.int8)
        cols = np.array([WHITE, RED, GREEN, BLUE], np.float32)
        top = im[:yb]
        d = ((top[..., None, :] - cols) ** 2).sum(-1)
        L[:yb] = np.argmin(d, -1)
        L[yb:] = np.where(proj(im[yb:], BLACK, WHITE) > 0.5, 4, 0)
        return L
    Lr, Lg = labels(img), labels(ref)
    out = dict(agreement=float((Lr == Lg).mean()))
    for k, n in enumerate(['white', 'red', 'green', 'blue', 'black']):
        a, b = Lr == k, Lg == k
        out[f'iou_{n}'] = float((a & b).sum() / (a | b).sum())
    def lb(L):
        b = np.zeros(L.shape, bool)
        b[:-1] |= L[:-1] != L[1:]; b[1:] |= L[1:] != L[:-1]
        b[:, :-1] |= L[:, :-1] != L[:, 1:]; b[:, 1:] |= L[:, 1:] != L[:, :-1]
        return b
    br, bg_ = lb(Lr), lb(Lg)
    d = ndi.distance_transform_edt(~bg_)[br] / s
    out.update(bnd_mean=float(d.mean()), bnd_p95=float(np.percentile(d, 95)), bnd_max=float(d.max()))
    return out

def pixel_err(who):
    roi = (70, 44, 810, 478)
    img = images(roi, 1, who); ref = raster_up(roi, 1)
    e = np.abs(img - ref)
    mse = (e ** 2).mean()
    return dict(mae=float(e.mean()), rmse=float(np.sqrt(mse)), psnr=float(10 * np.log10(255 ** 2 / mse)),
                p99_maxch=float(np.percentile(e.max(-1), 99)), frac_gt32=float((e.max(-1) > 32).mean()))

out = {}
for who, s in [('resvg', 8), ('resvg', 4), ('chrome', 4), ('resvg', 1), ('chrome', 1)]:
    out[f'{who}{s}x'] = dict(parts=run(who, s), whole=whole(who, s))
    print('done', who, s, flush=True)
out['pixel_1x'] = {w: pixel_err(w) for w in ('resvg', 'chrome')}
r1 = render(svg, (70, 44, 810, 478), 1); r4 = render(svg, (70, 44, 810, 478), 4)
out['chrome_vs_resvg'] = dict(mad_1x=float(np.abs(r1 - CH[1][44:478, 70:810]).mean()),
                              mad_4x=float(np.abs(r4 - CH[4][176:1912, 280:3240]).mean()),
                              max_1x=float(np.abs(r1 - CH[1][44:478, 70:810]).max()))
tag = sys.argv[2] if len(sys.argv) > 2 else 'final'
json.dump(out, open(f'{A}/metrics_{tag}.json', 'w'), indent=1, default=str)
T = dict(iou=0.98, mean=0.35, p95=0.75)
for k, v in out['resvg8x']['parts'].items():
    ok = v['iou'] >= T['iou'] and v['mean'] <= T['mean'] and v['p95'] <= T['p95']
    c4 = out['chrome4x']['parts'][k]
    print(f"{k:24s} IoU {v['iou']:.4f} mean {v['mean']:.3f} p95 {v['p95']:.3f} max {v['max']:.2f}@{v['at']}  {'PASS' if ok else 'FAIL'} | chrome4x {c4['iou']:.4f}/{c4['mean']:.3f}/{c4['p95']:.3f}")
for k in ('resvg8x', 'resvg4x', 'chrome4x', 'resvg1x', 'chrome1x'):
    print(k, {a: round(b, 4) for a, b in out[k]['whole'].items()})
print(out['pixel_1x']); print(out['chrome_vs_resvg'])
