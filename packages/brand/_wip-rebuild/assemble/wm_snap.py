"""Iteration fix for the wordmark: geometric least-squares snap of each glyph outline onto the
raster's 0.5 iso-contour (8x Lanczos field, same field as the metric). Structure-preserving:
nodes move with their handles, handles only change length (tangent directions fixed, so smooth
joins stay smooth and extrema stay axis-aligned), and nodes joined by exact H/V lines share their
x / y variable so stems and bars stay straight. Robust loss so JPEG-filled crotches do not pull."""
import sys, re, json
import numpy as np
from scipy import ndimage as ndi
from scipy.optimize import least_squares
from mlib import *

SRCFRAG = sys.argv[1]; DST = sys.argv[2]
FSCALE = float(sys.argv[3]) if len(sys.argv) > 3 else 0.05
CORNER_EXCL = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
REG = 0.02
frag = open(SRCFRAG).read()
roi = (70, 410, 808, 477); S = 8
T = proj(raster_up(roi, S), BLACK, WHITE).astype(np.float64)   # ink coverage field

def field(P):
    c = (P[:, 0] - roi[0]) * S - 0.5; r = (P[:, 1] - roi[1]) * S - 0.5
    return ndi.map_coordinates(T, [r, c], order=1, mode='nearest')
gy, gx = np.gradient(T)
def grad(P):
    c = (P[:, 0] - roi[0]) * S - 0.5; r = (P[:, 1] - roi[1]) * S - 0.5
    return np.c_[ndi.map_coordinates(gx, [r, c], order=1), ndi.map_coordinates(gy, [r, c], order=1)] * S

def parse(d):
    t = re.findall(r'[MLCZ]|-?\d*\.?\d+', d); i = 0; subs = []; cmd = None
    while i < len(t):
        if t[i] in 'MLCZ':
            cmd = t[i]; i += 1
            if cmd == 'Z': subs[-1]['closed'] = True; continue
        if cmd == 'M':
            subs.append(dict(nodes=[np.array([float(t[i]), float(t[i+1])])], segs=[], closed=False)); i += 2; cmd = 'L'
        elif cmd == 'L':
            subs[-1]['nodes'].append(np.array([float(t[i]), float(t[i+1])])); subs[-1]['segs'].append(('L',)); i += 2
        elif cmd == 'C':
            a = [float(x) for x in t[i:i+6]]; i += 6
            subs[-1]['segs'].append(('C', np.array(a[0:2]), np.array(a[2:4])))
            subs[-1]['nodes'].append(np.array(a[4:6]))
    out = []
    for s in subs:
        n, g = s['nodes'], s['segs']
        if np.allclose(n[-1], n[0], atol=1e-9) and len(n) > 1:
            n = n[:-1]           # last segment already returns to start
        else:
            g = g + [('L',)]     # Z adds a closing line
        segs = []
        for k, sg in enumerate(g):
            a, b = k, (k + 1) % len(n)
            if sg[0] == 'L': segs.append(dict(t='L', a=a, b=b))
            else: segs.append(dict(t='C', a=a, b=b, h1=sg[1] - n[a], h2=sg[2] - n[b]))
        out.append(dict(nodes=np.array(n), segs=segs))
    return out

class Glyph:
    def __init__(self, d):
        self.subs = parse(d)
        # union-find over node coordinates for exact H/V lines
        self.keys = [(si, ni) for si, s in enumerate(self.subs) for ni in range(len(s['nodes']))]
        idx = {k: j for j, k in enumerate(self.keys)}; N = len(self.keys)
        px = list(range(N)); py = list(range(N))
        def f(p, a):
            while p[a] != a: p[a] = p[p[a]]; a = p[a]
            return a
        for si, s in enumerate(self.subs):
            for sg in s['segs']:
                if sg['t'] != 'L': continue
                A, B = s['nodes'][sg['a']], s['nodes'][sg['b']]
                ia, ib = idx[(si, sg['a'])], idx[(si, sg['b'])]
                if abs(A[0] - B[0]) < 0.006: px[f(px, ia)] = f(px, ib)
                if abs(A[1] - B[1]) < 0.006: py[f(py, ia)] = f(py, ib)
        rx = [f(px, j) for j in range(N)]; ry = [f(py, j) for j in range(N)]
        ux = sorted(set(rx)); uy = sorted(set(ry))
        self.xv = np.array([ux.index(r) for r in rx]); self.yv = np.array([uy.index(r) for r in ry])
        P0 = np.vstack([s['nodes'] for s in self.subs])
        self.x0 = np.array([P0[self.xv == k, 0].mean() for k in range(len(ux))])
        self.y0 = np.array([P0[self.yv == k, 1].mean() for k in range(len(uy))])
        self.nh = sum(2 for s in self.subs for sg in s['segs'] if sg['t'] == 'C')
        self.nx, self.ny = len(ux), len(uy)
        self.npar = self.nx + self.ny + self.nh
        self.off = np.cumsum([0] + [len(s['nodes']) for s in self.subs])
        # corners (turning angle > 25 deg)
        self.samples = self._samples()
    def nodes(self, p):
        X = self.x0 + p[:self.nx]; Y = self.y0 + p[self.nx:self.nx + self.ny]
        return np.c_[X[self.xv], Y[self.yv]]
    def ctrl(self, p):
        P = self.nodes(p); hs = p[self.nx + self.ny:]; out = []; h = 0
        for si, s in enumerate(self.subs):
            o = self.off[si]
            for sg in s['segs']:
                A, B = P[o + sg['a']], P[o + sg['b']]
                if sg['t'] == 'L': out.append(('L', A, B))
                else:
                    out.append(('C', A, A + sg['h1'] * (1 + hs[h]), B + sg['h2'] * (1 + hs[h + 1]), B)); h += 2
        return out
    def _samples(self):
        segs = self.ctrl(np.zeros(self.npar)); P = self.nodes(np.zeros(self.npar))
        # tangent in/out per node
        corners = []
        for si, s in enumerate(self.subs):
            o = self.off[si]; n = len(s['nodes'])
            tin = {}; tout = {}
            for sg in s['segs']:
                A, B = s['nodes'][sg['a']], s['nodes'][sg['b']]
                if sg['t'] == 'L': d0 = d1 = B - A
                else:
                    d0 = sg['h1'] if np.linalg.norm(sg['h1']) > 1e-6 else B - A
                    d1 = -sg['h2'] if np.linalg.norm(sg['h2']) > 1e-6 else B - A
                tout[sg['a']] = d0; tin[sg['b']] = d1
            for k in range(n):
                a, b = tin[k], tout[k]
                c = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12)
                if np.degrees(np.arccos(np.clip(c, -1, 1))) > 25: corners.append(s['nodes'][k])
        self.corners = np.array(corners) if corners else np.zeros((0, 2))
        samp = []
        for j, sg in enumerate(segs):
            pts = self._eval(sg, np.linspace(0, 1, 400))
            L = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
            n = max(int(L[-1] / 0.2), 2)
            ts = np.interp(np.linspace(0, L[-1], n + 2)[1:-1], L, np.linspace(0, 1, 400))
            for t in ts:
                q = self._eval(sg, np.array([t]))[0]
                if len(self.corners) and np.min(np.linalg.norm(self.corners - q, axis=1)) < CORNER_EXCL: continue
                samp.append((j, t))
        return samp
    @staticmethod
    def _eval(sg, t):
        t = t[:, None]
        if sg[0] == 'L': return (1 - t) * sg[1] + t * sg[2]
        _, a, b, c, d = sg
        return (1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t**2*c + t**3*d
    def points(self, p):
        segs = self.ctrl(p)
        return np.vstack([self._eval(segs[j], np.array([t])) for j, t in self.samples])
    def resid(self, p):
        return np.r_[field(self.points(p)) - 0.5, REG * p]
    def d(self, p):
        out = []
        for si, s in enumerate(self.subs):
            segs = self.ctrl(p)[sum(len(x['segs']) for x in self.subs[:si]):][:len(s['segs'])]
            f = lambda v: f'{v:.2f}'.rstrip('0').rstrip('.')
            out.append(f'M{f(segs[0][1][0])} {f(segs[0][1][1])}')
            for k, sg in enumerate(segs):
                last = (k == len(segs) - 1)
                if sg[0] == 'L':
                    if last: continue    # closing line implied by Z
                    out.append(f'L{f(sg[2][0])} {f(sg[2][1])}')
                else:
                    out.append('C' + ' '.join(f(v) for v in (*sg[2], *sg[3], *sg[4])))
            out.append('Z')
        return ''.join(out)

def dist_px(g, p):
    P = g.points(p); r = field(P) - 0.5; gn = np.linalg.norm(grad(P), axis=1)
    return np.abs(r) / np.maximum(gn, 0.2)

paths = re.findall(r'(<path id="(wm-\d+-\w)" fill="#000000" d="([^"]+)"/>)', frag)
new = frag; report = {}
for full, gid, d in paths:
    g = Glyph(d)
    p0 = np.zeros(g.npar)
    sol = least_squares(g.resid, p0, loss='soft_l1', f_scale=FSCALE, diff_step=1e-3, x_scale=0.1, max_nfev=200)
    d0, d1 = dist_px(g, p0), dist_px(g, sol.x)
    mv = np.abs(g.nodes(sol.x) - g.nodes(p0)).max()
    report[gid] = dict(n=len(g.samples), params=g.npar, before_med=float(np.median(d0)), after_med=float(np.median(d1)),
                       before_p90=float(np.percentile(d0, 90)), after_p90=float(np.percentile(d1, 90)), max_node_move=float(mv))
    print(f"{gid:8s} samples {len(g.samples):5d} par {g.npar:3d}  |d| median {np.median(d0):.3f}->{np.median(d1):.3f}  p90 {np.percentile(d0,90):.3f}->{np.percentile(d1,90):.3f}  max node move {mv:.3f}", flush=True)
    nd = g.d(sol.x)
    new = new.replace(full, f'<path id="{gid}" fill="#000000" d="{nd}"/>')
open(DST, 'w').write(new)
json.dump(report, open(DST + '.json', 'w'), indent=1)
