"""Final fits for tiles + F/O/A, writes SVG fragment and per-part metric."""
import numpy as np, json, sys
from scipy import ndimage as ndi
from PIL import Image
sys.path.insert(0, '.')
from lib import *
from fitpoly import *
import bezfit

OUT = '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/parts/tiles_letters.svg'
Y = load_Y()
R2 = lambda v: float(f'{v:.2f}')
fmt = lambda v: f'{v:.2f}'

# ------------------------------------------------------------ tiles (0.5-crossing, axis lines)
TILES = {'tile-red': (RED, 76, 300, 50, 395), 'tile-green': (GREEN, 309, 561, 51, 396), 'tile-blue': (BLUE, 570, 804, 50, 395)}
tile_edges = {}
_te = json.load(open('tiles_edges.json'))   # coverage-integrated edges (tiles.py)
for gid in TILES:
    e = _te[gid.split('-')[1]]
    tile_edges[gid] = dict(L=e['L']['mean'], R=e['R']['mean'], T=e['T']['mean'], B=e['B']['mean'],
                           sd=[e[k]['std'] for k in 'LRTB'], n=[0, 0, 0, 0])

# ------------------------------------------------------------ letters
PF = np.load('QF.npy'); PA = np.load('QA.npy')   # coverage-integrated edge points
lf = json.load(open('letters_fit.json'))
F_ring, _, F_st = fit_ring(PF, lf['F_axis'], axes=['h', 'v'] * 5, maxd=1.2, iters=3, margin=2.5)
a2 = json.load(open('A_fit2.json'))
A_out, _, A_ost = fit_ring(PA, a2['outer'], axes=['h', None, 'h', None, 'h', None, 'h', None], maxd=1.2, iters=4, margin=2.5)
# both A feet sit on one baseline (measured 371.855 vs 371.854): use the point-weighted joint value
_w = np.array([A_ost[2]['n'], A_ost[6]['n']], float)
_yb = (A_out[2, 1] * _w[0] + A_out[6, 1] * _w[1]) / _w.sum()
A_out[[2, 3, 6, 7], 1] = _yb
A_cnt, _, A_cst = fit_ring(PA, a2['counter5'], axes=[None, None, 'h', None, None], maxd=1.2, iters=4, margin=2.5)
# simple-triangle counter alternative (for the report)
A_tri, _, A_tst = fit_ring(PA, lf['A_in_free'], axes=[None, 'h', None], maxd=1.5, iters=4, margin=2.5)

ob = json.load(open('O_bez_area.json'))
O_out = bezfit.unpack(ob['outer_4'], 4); O_in = bezfit.unpack(ob['inner_4'], 4)

# ------------------------------------------------------------ svg
def tile_rect(gid, col):
    e = tile_edges[gid]
    x, y = R2(e['L']), R2(e['T']); w = R2(R2(e['R']) - x); h = R2(R2(e['B']) - y)
    return f'<g id="{gid}"><rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}" fill="{HEX[col]}"/></g>'


def letter_f(ring=F_ring):
    return f'<g id="letter-f"><path d="{poly_path([ring])}" fill="#FFFFFF"/></g>'


def letter_a(outer=A_out, cnt=A_cnt):
    return f'<g id="letter-a"><path d="{poly_path([outer, cnt])}" fill="#FFFFFF" fill-rule="evenodd"/></g>'


def letter_o(o=O_out, i=O_in):
    return f'<g id="letter-o"><path d="{bezfit.path_d(o)}{bezfit.path_d(i)}" fill="#FFFFFF" fill-rule="evenodd"/></g>'


GROUPS = {
    'tile-red': tile_rect('tile-red', RED), 'tile-green': tile_rect('tile-green', GREEN), 'tile-blue': tile_rect('tile-blue', BLUE),
    'letter-f': letter_f(), 'letter-o': letter_o(), 'letter-a': letter_a(),
}
order = ['tile-red', 'tile-green', 'tile-blue', 'letter-f', 'letter-o', 'letter-a']
svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="910" height="1024" viewBox="0 0 910 1024">\n'
       + '\n'.join(GROUPS[k] for k in order) + '\n</svg>\n')
open(OUT, 'w').write(svg)

# ------------------------------------------------------------ metric
def raster_mask(gid, roi, mode):
    if gid.startswith('tile'):
        col = TILES[gid][0]
        t = raster_t(roi, col, WHITE, mode)
        m = t > 0.5
        lab, n = ndi.label(m); sz = ndi.sum(m, lab, range(1, n + 1))
        m = lab == (np.argmax(sz) + 1)
        return ndi.binary_fill_holes(m)
    col = {'letter-f': RED, 'letter-o': GREEN, 'letter-a': BLUE}[gid]
    t = raster_t(roi, WHITE, col, mode)
    m = t > 0.5
    lab, n = ndi.label(m); sz = ndi.sum(m, lab, range(1, n + 1))
    return lab == (np.argmax(sz) + 1)   # letter = largest white component (drops paw parts)


ROI = {'tile-red': (66, 40, 306, 406), 'tile-green': (304, 41, 566, 406), 'tile-blue': (565, 40, 814, 406),
       'letter-f': (82, 56, 296, 391), 'letter-o': (315, 57, 556, 391), 'letter-a': (576, 56, 799, 391)}


def evaluate(gid, inner, mode='rgb', save=None):
    roi = ROI[gid]
    rm = render_mask(inner, roi)
    sm = raster_mask(gid, roi, mode)
    met, dt, rb = metric(rm, sm)
    if save:
        # deviation heat: rendered boundary coloured by distance
        x0, y0, x1, y1 = roi
        img = np.zeros(rm.shape + (3,), np.uint8)
        img[sm] = (90, 90, 90)
        d = dt.copy(); yy, xx = np.nonzero(rb)
        v = np.clip(d[yy, xx] / 0.75, 0, 1)
        img[yy, xx] = np.c_[255 * v, 255 * (1 - v), 0 * v].astype(np.uint8)
        Image.fromarray(img).save(save)
    # locate worst deviations (source px coords)
    yy, xx = np.nonzero(rb); d = dt[yy, xx]
    o = np.argsort(-d)[:400]
    hot = np.c_[roi[0] + xx[o] / S, roi[1] + yy[o] / S, d[o]]
    return met, hot


if __name__ == '__main__':
    res = {}
    for gid in order:
        r = {}
        for mode in ('rgb', 'luma'):
            met, hot = evaluate(gid, GROUPS[gid], mode, save=f'diag_{gid}_{mode}.png' if mode == 'rgb' else None)
            r[mode] = met
            if mode == 'rgb':
                # cluster worst points
                cl = {}
                for x, y, d in hot[:200]:
                    k = (int(x // 6) * 6, int(y // 6) * 6); cl[k] = max(cl.get(k, 0), d)
                r['worst'] = sorted(cl.items(), key=lambda kv: -kv[1])[:6]
        res[gid] = r
        print(gid, 'RGB iou %.4f mean %.3f p95 %.3f max %.3f | luma iou %.4f mean %.3f p95 %.3f max %.3f' % (
            r['rgb']['iou'], r['rgb']['mean'], r['rgb']['p95'], r['rgb']['max'], r['luma']['iou'], r['luma']['mean'], r['luma']['p95'], r['luma']['max']))
        print('    worst (x,y)->dev:', [(k, round(v, 2)) for k, v in r['worst']])
    for k, v in tile_edges.items():
        print(k, {kk: (round(vv, 3) if not isinstance(vv, list) else [round(q, 3) for q in vv]) for kk, vv in v.items()})
    print('F verts', F_ring.round(3).tolist())
    print('A outer', A_out.round(3).tolist()); print('A counter', A_cnt.round(3).tolist())
    print('A edge stats outer', [(s['n'], round(s['rms'], 3), round(s['ang'], 3)) for s in A_ost])
    print('A edge stats cnt', [(s['n'], round(s['rms'], 3), round(s['ang'], 3)) for s in A_cst])
    # triangle-counter alternative metric
    met, _ = evaluate('letter-a', letter_a(A_out, A_tri), 'rgb')
    print('A with plain triangular counter:', {k: round(v, 4) for k, v in met.items()})
    json.dump(dict(res=res, F=F_ring.tolist(), A_out=A_out.tolist(), A_cnt=A_cnt.tolist(),
                   tiles={k: {kk: (float(vv) if not isinstance(vv, list) else vv) for kk, vv in v.items()} for k, v in tile_edges.items()}),
              open('build_result.json', 'w'), indent=1, default=float)

    # ---- O alternatives: circle / axis ellipse / rotated ellipse (fitted on the same coverage points)
    from scipy.optimize import least_squares
    def resid_ellipse(p, X):
        cx, cy, a, b, th = p
        c, s = np.cos(th), np.sin(th)
        u = (X[:, 0]-cx)*c+(X[:, 1]-cy)*s; v = -(X[:, 0]-cx)*s+(X[:, 1]-cy)*c
        F = (u/a)**2+(v/b)**2-1; gu = 2*u/a**2; gv = 2*v/b**2
        return F/np.sqrt(gu**2+gv**2)
    def efit(X, kind):
        cx, cy = X.mean(0); r = np.sqrt(((X-[cx, cy])**2).sum(1)).mean()
        if kind == 'circle': g = lambda q: [q[0], q[1], q[2], q[2], 0.0]; q0 = [cx, cy, r]
        elif kind == 'axis': g = lambda q: [q[0], q[1], q[2], q[3], 0.0]; q0 = [cx, cy, r, r*0.9]
        else: g = lambda q: list(q); q0 = [cx, cy, r, r*0.9, 0.01]
        s = least_squares(lambda q: resid_ellipse(g(q), X), q0)
        return g(s.x), s.fun
    def ell_d(p):
        cx, cy, a, b, th = p; c, s = np.cos(th), np.sin(th)
        p1 = (cx+a*c, cy+a*s); p2 = (cx-a*c, cy-a*s); deg = np.degrees(th)
        return (f'M{p1[0]:.2f} {p1[1]:.2f}A{a:.2f} {b:.2f} {deg:.2f} 1 1 {p2[0]:.2f} {p2[1]:.2f}'
                f'A{a:.2f} {b:.2f} {deg:.2f} 1 1 {p1[0]:.2f} {p1[1]:.2f}Z')
    Qo = np.load('QO_outer.npy'); Qi = np.load('QO_inner.npy')
    for kind in ('circle', 'axis', 'rot'):
        po, ro_ = efit(Qo, kind); pi, ri_ = efit(Qi, kind)
        inner = f'<g id="letter-o"><path d="{ell_d(po)}{ell_d(pi)}" fill="#FFFFFF" fill-rule="evenodd"/></g>'
        met, _ = evaluate('letter-o', inner, 'rgb')
        print(f'O {kind:6s} outer {np.round(po,3).tolist()} rms {np.sqrt((ro_**2).mean()):.3f} | inner {np.round(pi,3).tolist()} rms {np.sqrt((ri_**2).mean()):.3f} | metric',
              {k: round(v, 4) for k, v in met.items()})
    for nm, X in (('outer', Qo), ('inner', Qi)):
        r = bezfit.signed_dist(bezfit.sample(O_out if nm == 'outer' else O_in, 400), X)
        print(f'O bezier4 {nm} rms {np.sqrt((r**2).mean()):.4f} p95 {np.percentile(np.abs(r),95):.3f}')
