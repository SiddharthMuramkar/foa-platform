"""Stage R: node-level refinement of the stage-B glyph outlines against the raster coverage.
Each on-curve node may translate (its handles move with it); each handle may lengthen/shorten along its
own direction (so smooth joins stay smooth and extrema stay axis-aligned); nodes joined by a horizontal or
vertical line are tied so straight axis-aligned edges stay axis-aligned.
Usage: wm_refine.py face_key [stage]"""
import sys, json, time
import numpy as np
from scipy.optimize import minimize
sys.path.insert(0, '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/scripts')
import wmlib as L
import wm_fit as F
from wm_pg import model_from

LAM_D = 0.1     # node displacement penalty (per px^2)
LAM_H = 0.1     # handle-tip displacement penalty (per px^2)
# axis-aligned lines are kept axis-aligned by tying node params (see _groups)
SS = 8          # render supersample for the data term (tiny-skia AA is quantised to 1/4 output px)

def build(tcons):
    """transformed contours -> list of dict(N=(M,2), seg=[(type, h1, h2)])"""
    out = []
    for con in tcons:
        nodes = []; segs = []
        cur = None
        for op, pts in con:
            pts = np.asarray(pts, float)
            if op == 'moveTo':
                nodes.append(pts[0]); cur = pts[0]
            elif op == 'lineTo':
                segs.append(('L', None, None)); nodes.append(pts[0]); cur = pts[0]
            elif op == 'curveTo':
                segs.append(('C', pts[0].copy(), pts[1].copy())); nodes.append(pts[2]); cur = pts[2]
            elif op == 'qCurveTo':
                offs, on = pts[:-1], pts[-1]
                for k in range(len(offs)):
                    q = offs[k]
                    e = (offs[k] + offs[k + 1]) / 2 if k < len(offs) - 1 else on
                    a = cur
                    segs.append(('C', a + 2.0 / 3.0 * (q - a), e + 2.0 / 3.0 * (q - e)))
                    nodes.append(e); cur = e
        # closing
        if np.allclose(nodes[-1], nodes[0], atol=1e-6) and len(nodes) > 1:
            nodes.pop()
        else:
            segs.append(('L', None, None))
        out.append(dict(N=np.array(nodes), seg=segs))
    return out

def _groups(c):
    """union nodes joined by vertical lines (shared dx) / horizontal lines (shared dy)"""
    M = len(c['N'])
    px = list(range(M)); py = list(range(M))
    def find(p, i):
        while p[i] != i:
            p[i] = p[p[i]]; i = p[i]
        return i
    for j, (t, h1, h2) in enumerate(c['seg']):
        if t != 'L':
            continue
        a, b = j, (j + 1) % M
        d = c['N'][b] - c['N'][a]
        if abs(d[0]) < 0.02 * abs(d[1]):
            px[find(px, a)] = find(px, b)
        elif abs(d[1]) < 0.02 * abs(d[0]):
            py[find(py, a)] = find(py, b)
    rx = [find(px, i) for i in range(M)]; ry = [find(py, i) for i in range(M)]
    ux = sorted(set(rx)); uy = sorted(set(ry))
    return np.array([ux.index(r) for r in rx]), np.array([uy.index(r) for r in ry]), len(ux), len(uy)

def layout(cs):
    """parameter layout per contour: one dx per x-group, one dy per y-group, 2 handle scales per curve"""
    n = 0; lay = []
    for c in cs:
        gx, gy, nx, ny = _groups(c)
        ncur = sum(1 for s in c['seg'] if s[0] == 'C')
        lay.append((n, gx, gy, nx, ny, ncur)); n += nx + ny + 2 * ncur
    return n, lay

def _D(v, o, gx, gy, nx, ny):
    X = v[o:o + nx]; Y = v[o + nx:o + nx + ny]
    return np.stack([X[gx], Y[gy]], 1)

def apply(cs, lay, v):
    out = []
    for c, (o, gx, gy, nx, ny, ncur) in zip(cs, lay):
        M = len(c['N'])
        D = _D(v, o, gx, gy, nx, ny)
        N = c['N'] + D
        so = o + nx + ny
        S = v[so:so + 2 * ncur].reshape(-1, 2) if ncur else np.zeros((0, 2))
        segs = []; ci = 0
        for j, (t, h1, h2) in enumerate(c['seg']):
            if t == 'L':
                segs.append(('L', None, None))
            else:
                a = j; b = (j + 1) % M
                H1 = N[a] + (1 + S[ci, 0]) * (h1 - c['N'][a])
                H2 = N[b] + (1 + S[ci, 1]) * (h2 - c['N'][b])
                segs.append(('C', H1, H2)); ci += 1
        out.append(dict(N=N, seg=segs))
    return out

def penalty_grad(cs, lay, v):
    """quadratic regulariser (node displacement + handle-tip displacement), value and analytic gradient"""
    pen = 0.0; g = np.zeros_like(v)
    for c, (o, gx, gy, nx, ny, ncur) in zip(cs, lay):
        M = len(c['N'])
        D = _D(v, o, gx, gy, nx, ny)
        pen += LAM_D * float((D ** 2).sum())
        np.add.at(g, o + gx, 2 * LAM_D * D[:, 0])
        np.add.at(g, o + nx + gy, 2 * LAM_D * D[:, 1])
        so = o + nx + ny; ci = 0
        for j, (t, h1, h2) in enumerate(c['seg']):
            if t == 'C':
                a = j; b = (j + 1) % M
                l1 = float(np.sum((h1 - c['N'][a]) ** 2)); l2 = float(np.sum((h2 - c['N'][b]) ** 2))
                s1 = v[so + 2 * ci]; s2 = v[so + 2 * ci + 1]
                pen += LAM_H * (s1 ** 2 * l1 + s2 ** 2 * l2)
                g[so + 2 * ci] += 2 * LAM_H * s1 * l1; g[so + 2 * ci + 1] += 2 * LAM_H * s2 * l2
                ci += 1
    return pen, g

def to_d(cs, nd=3):
    f = '%%.%df' % nd
    P = lambda p: (f % p[0]) + ' ' + (f % p[1])
    parts = []
    for c in cs:
        N = c['N']; M = len(N)
        parts.append('M' + P(N[0]))
        for j, (t, h1, h2) in enumerate(c['seg']):
            b = N[(j + 1) % M]
            if t == 'L':
                if j == len(c['seg']) - 1:
                    continue  # closing line implied by Z
                parts.append('L' + P(b))
            else:
                parts.append('C' + P(h1) + ' ' + P(h2) + ' ' + P(b))
        parts.append('Z')
    return ''.join(parts)

def render_ss(ds, win):
    r = L.render(ds, win, SS)
    h, w = win[3], win[2]
    return r.reshape(h, SS, w, SS).mean((1, 3))

def refine_glyph(cs, others_d, win, maxiter=120, eps=0.05):
    n, lay = layout(cs)
    tgt = L.target(win)
    def data(v):
        d = to_d(apply(cs, lay, v), 4)
        r = render_ss(others_d + [d], win)
        return float(((r - tgt) ** 2).sum())
    def fg(v):
        f = data(v)
        g = np.zeros(n)
        for k in range(n):
            e = np.zeros(n); e[k] = eps
            g[k] = (data(v + e) - data(v - e)) / (2 * eps)
        p, pg = penalty_grad(cs, lay, v)
        return f + p, g + pg
    v0 = np.zeros(n)
    f0 = fg(v0)[0] if False else data(v0)
    res = minimize(fg, v0, jac=True, method='L-BFGS-B', options=dict(maxiter=maxiter))
    return apply(cs, lay, res.x), f0, res.fun, res.x

def run(key, stage='B', sweeps=2, tag=''):
    t0 = time.time()
    mo = model_from(key, stage)
    css = []
    for i in range(F.N):
        t = L.transform_contours(mo.g[i], mo.P[i], mo.kk(i))
        if mo.emb[i] is not None:
            t = L.embolden(t, *mo.emb[i])
        css.append(build(t))
    ds = [to_d(c, 4) for c in css]
    m0 = L.metric([to_d(c, 2) for c in css])
    print(key, 'start  IoU %.4f mean %.3f p95 %.3f' % (m0['iou'], m0['mean'], m0['p95']), flush=True)
    for s in range(sweeps):
        for i in range(F.N):
            win = F.glyph_win(i, 3)
            others = [ds[j] for j in range(F.N) if j != i and abs(j - i) <= 1]
            new, f0, f1, v = refine_glyph(css[i], others, win)
            css[i] = build_from(new)
            ds[i] = to_d(css[i], 4)
        m = L.metric([to_d(c, 2) for c in css])
        print(key, 'sweep %d IoU %.4f mean %.3f p95 %.3f  (%.0fs)' % (s, m['iou'], m['mean'], m['p95'], time.time() - t0), flush=True)
    out = dict(face=key, metric=m, start=m0, contours=[[dict(N=c['N'].tolist(), seg=[(t, None if h1 is None else h1.tolist(), None if h2 is None else h2.tolist()) for t, h1, h2 in c['seg']]) for c in cs] for cs in css])
    json.dump(out, open(L.WORK + '/refined_%s%s.json' % (key.replace(':', ''), tag), 'w'))
    return css, m

def build_from(cs):
    return [dict(N=np.array(c['N'], float), seg=[(t, None if h1 is None else np.array(h1, float), None if h2 is None else np.array(h2, float)) for t, h1, h2 in c['seg']]) for c in cs]

def load_refined(key, tag=''):
    o = json.load(open(L.WORK + '/refined_%s%s.json' % (key.replace(':', ''), tag)))
    return [build_from(cs) for cs in o['contours']], o

if __name__ == '__main__':
    key = sys.argv[1]
    run(key, *(sys.argv[2:3] or ['B']))
