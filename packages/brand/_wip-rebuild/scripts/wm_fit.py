"""Fit every candidate face to the raster wordmark. Usage: wm_fit.py [face_key ...]

Stages (each starts from the previous one):
  A  pure scaled face: global sx, sy, baseline + per-glyph x position
  E  A + global stroke emboldening (ex, ey px per side)
  W  E + global lowercase vertical warp (x-height scale a, ascender scale b; caps own linear scale)
  B  per-glyph free fit: tx, sx, baseline, a, b (+ global emboldening from W, re-fitted per glyph)
"""
import sys, json, time
import numpy as np
from scipy.optimize import minimize
sys.path.insert(0, '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/scripts')
import wmlib as L

FD = L.WORK + '/fonts/'
SUP = '/System/Library/Fonts/Supplemental/'
FACES = {
    'helv':        ('/System/Library/Fonts/Helvetica.ttc', 0),
    'helv-bold':   ('/System/Library/Fonts/Helvetica.ttc', 1),
    'helv-light':  ('/System/Library/Fonts/Helvetica.ttc', 4),
    'neue':        ('/System/Library/Fonts/HelveticaNeue.ttc', 0),
    'neue-medium': ('/System/Library/Fonts/HelveticaNeue.ttc', 10),
    'neue-bold':   ('/System/Library/Fonts/HelveticaNeue.ttc', 1),
    'neue-light':  ('/System/Library/Fonts/HelveticaNeue.ttc', 7),
    'neue-thin':   ('/System/Library/Fonts/HelveticaNeue.ttc', 12),
    'neue-ultralight': ('/System/Library/Fonts/HelveticaNeue.ttc', 5),
    'neue-cond-bold':  ('/System/Library/Fonts/HelveticaNeue.ttc', 4),
    'neue-cond-black': ('/System/Library/Fonts/HelveticaNeue.ttc', 9),
    'arial':       (SUP + 'Arial.ttf', 0),
    'arial-bold':  (SUP + 'Arial Bold.ttf', 0),
    'arial-narrow': (SUP + 'Arial Narrow.ttf', 0),
    'arial-narrow-bold': (SUP + 'Arial Narrow Bold.ttf', 0),
    'arial-black': (SUP + 'Arial Black.ttf', 0),
    'heros':       (FD + 'heros/texgyreheros-regular.otf', 0),
    'heros-bold':  (FD + 'heros/texgyreheros-bold.otf', 0),
    'nimbus':      (FD + 'nimbus/NimbusSans-Regular.otf', 0),
    'nimbus-bold': (FD + 'nimbus/NimbusSans-Bold.otf', 0),
}
CAPS = {0, 9}  # F, A
N = len(L.CHARS)
CAP_PX = 470.05 - 416.6
XH_PX = 470.05 - 434.6

def load(key):
    if key.startswith('mm:'):
        import wm_mm
        return wm_mm.load(key)
    return L.load_ttf(*FACES[key])

def glyph_win(i, pad=4):
    x0, y0, x1, y1 = L.RBOX[i]
    X0 = int(np.floor(x0)) - pad; X1 = int(np.ceil(x1)) + pad
    return (X0, 408, X1 - X0, 70)

class Model:
    def __init__(self, glyphs, m):
        self.g = glyphs; self.k = float(m['xh']); self.cap = float(m['cap']); self.m = m
        self.P = [None] * N
        self.emb = [None] * N
        self.bb = [L.bounds_of(c) for c in glyphs]
        self.cx = [(b[0] + b[2]) / 2 for b in self.bb]
        self.fw = [b[2] - b[0] for b in self.bb]

    def kk(self, i):
        return 1e9 if i in CAPS else self.k

    def d(self, i, p=None, emb='self', nd=3):
        e = self.emb[i] if emb == 'self' else emb
        return L.glyph_to_d(self.g[i], p or self.P[i], self.kk(i), nd, e)

    def ds(self, nd=3):
        return [self.d(i, nd=nd) for i in range(N)]

    def centre_px(self, i):
        return self.P[i]['tx'] + self.P[i]['sx'] * self.cx[i]

def sse(ds, win, ss=None):
    if ss is None:
        ss = 4 if win[2] > 200 else 8
    r = L.render_cov(ds, win, ss)
    return float(((r - L.target(win)) ** 2).sum())

def opt(f, x0, step=0.5, tol=1e-3, maxfev=3000):
    """Powell with explicit per-parameter step directions (all params in ~px units)."""
    x0 = np.asarray(x0, float)
    direc = np.eye(len(x0)) * step
    r = minimize(f, x0, method='Powell', options=dict(direc=direc, xtol=tol, ftol=1e-7, maxfev=maxfev))
    return r.x, r.fun

def init_params(model):
    sy = CAP_PX / model.cap
    ratios = [(L.RBOX[i][2] - L.RBOX[i][0]) / model.fw[i] for i in range(N)]
    sx = float(np.median(ratios))
    for i in range(N):
        cxr = (L.RBOX[i][0] + L.RBOX[i][2]) / 2
        model.P[i] = dict(tx=cxr - sx * model.cx[i], sx=sx, base=470.05, a=sy, b=sy)

def fit_tx(model, pad=4):
    for i in range(N):
        win = glyph_win(i, pad)
        others = [model.d(j) for j in range(N) if j != i and abs(j - i) <= 1]
        def f(v):
            p = dict(model.P[i]); p['tx'] = v[0]
            return sse(others + [model.d(i, p)], win)
        x, _ = opt(f, [model.P[i]['tx']], step=0.5, tol=1e-3)
        model.P[i]['tx'] = float(x[0])

def global_stage(model, mode, iters=3):
    """mode 'A': [sx, sy, base]; 'E': + [ex, ey]; 'W': + lowercase [a, b] and caps [c] separately."""
    REFW = 40.0
    for it in range(iters):
        fit_tx(model)
        P0 = [dict(p) for p in model.P]
        cen = [model.centre_px(i) for i in range(N)]
        sx0 = P0[1]['sx']; sy0 = P0[1]['a']; b0 = P0[1]['b']; c0 = P0[0]['a']; base0 = P0[1]['base']
        e0 = model.emb[1] or (0.0, 0.0)
        def apply(v):
            dW, dH, base = v[0], v[1], v[2]
            sx = sx0 * (1 + dW / REFW)
            if mode == 'A' or mode == 'E':
                a = b = c = sy0 * (1 + dH / CAP_PX)
            else:
                a = sy0 * (1 + dH / XH_PX)
                b = b0 * (1 + v[5] / (CAP_PX - XH_PX))
                c = c0 * (1 + v[6] / CAP_PX)
            emb = (e0[0] + v[3], e0[1] + v[4]) if mode in ('E', 'W') else None
            for i in range(N):
                if i in CAPS:
                    model.P[i] = dict(tx=cen[i] - sx * model.cx[i], sx=sx, base=base, a=c, b=c)
                else:
                    model.P[i] = dict(tx=cen[i] - sx * model.cx[i], sx=sx, base=base, a=a, b=b)
                model.emb[i] = emb
        def f(v):
            apply(v)
            return sse(model.ds(), L.WIN)
        x0 = [0, 0, base0] + ([0, 0] if mode in ('E', 'W') else []) + ([0, 0] if mode == 'W' else [])
        x, _ = opt(f, x0, step=0.3, tol=1e-3)
        apply(x)
    fit_tx(model)

def stageB(model, sweeps=2, fit_emb=True):
    for s in range(sweeps):
        for i in range(N):
            win = glyph_win(i)
            others = [model.d(j) for j in range(N) if j != i and abs(j - i) <= 1]
            p0 = dict(model.P[i]); e0 = model.emb[i] or (0.0, 0.0)
            lin = i in CAPS
            W0 = p0['sx'] * model.fw[i]
            H0 = p0['a'] * (model.cap if lin else model.k)
            Hb = p0['b'] * (model.cap - model.k)
            cen0 = p0['tx'] + p0['sx'] * model.cx[i]
            def mk(v):
                sx = p0['sx'] * (1 + v[1] / W0)
                a = p0['a'] * (1 + v[3] / H0)
                b = a if lin else p0['b'] * (1 + v[4] / Hb)
                p = dict(tx=cen0 + v[0] - sx * model.cx[i], sx=sx, base=p0['base'] + v[2], a=a, b=b)
                e = (e0[0] + v[-2], e0[1] + v[-1]) if fit_emb else model.emb[i]
                return p, e
            def f(v):
                p, e = mk(v)
                return sse(others + [model.d(i, p, emb=e)], win)
            x0 = [0, 0, 0, 0] + ([] if lin else [0]) + ([0, 0] if fit_emb else [])
            x, _ = opt(f, x0, step=0.3, tol=1e-3)
            model.P[i], model.emb[i] = mk(x)

def summarize(model):
    return L.metric(model.ds())

def run(key, stages='AEWB', quiet=False):
    t = time.time()
    glyphs, m = load(key)
    model = Model(glyphs, m)
    init_params(model)
    res = {'face': key, 'm': {k: float(v) for k, v in m.items()}}
    for st in stages:
        if st in 'AEW':
            global_stage(model, st)
        elif st == 'B':
            stageB(model)
        res[st] = summarize(model)
        res['P' + st] = [dict(p) for p in model.P]
        res['emb' + st] = [e for e in model.emb]
    res['sec'] = time.time() - t
    if not quiet:
        s = '%-18s' % key
        for st in stages:
            r = res[st]; s += ' | %s IoU %.4f mean %.3f p95 %.3f' % (st, r['iou'], r['mean'], r['p95'])
        pa = res['P' + stages[0]][1]
        s += ' | %.0fs' % res['sec']
        print(s, flush=True)
    return res, model

if __name__ == '__main__':
    keys = sys.argv[1:] or list(FACES)
    allres = []
    for k in keys:
        r, _ = run(k)
        allres.append(r)
        out = L.WORK + '/fit_results_%s.json' % ('all' if not sys.argv[1:] else '_'.join(k.replace(':', '') for k in keys))
        json.dump(allres, open(out, 'w'), indent=1, default=float)
    print('saved', out)

def per_glyph_metric(model, ds=None):
    out = []
    ds = ds or model.ds()
    for i in range(N):
        win = glyph_win(i, pad=3)
        others = [ds[j] for j in range(N) if j != i and abs(j - i) <= 1]
        x0, y0, x1, y1 = L.RBOX[i]
        w = win[2] * 8; h = win[3] * 8
        reg = np.zeros((h, w), bool)
        c0 = int((x0 - 1.5 - win[0]) * 8); c1 = int((x1 + 1.5 - win[0]) * 8)
        reg[:, max(c0, 0):min(c1, w)] = True
        out.append(L.metric(others + [ds[i]], win, mask_region=reg))
    return out
