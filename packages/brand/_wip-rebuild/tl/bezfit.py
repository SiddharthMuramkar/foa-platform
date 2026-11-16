"""Closed G1 cubic Bezier curve fit to unordered edge points."""
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial import cKDTree


def unpack(p, N):
    p = np.asarray(p).reshape(N, 5)
    P = p[:, :2]; al = p[:, 2]; hin = p[:, 3]; hout = p[:, 4]
    T = np.c_[np.cos(al), np.sin(al)]
    segs = []
    for k in range(N):
        j = (k + 1) % N
        segs.append((P[k], P[k] + hout[k] * T[k], P[j] - hin[j] * T[j], P[j]))
    return segs


def sample(segs, m=600):
    t = np.linspace(0, 1, m, endpoint=False)[:, None]
    out = []
    for a, b, c, d in segs:
        out.append((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d)
    return np.vstack(out)


def signed_dist(C, X):
    """signed distance from X to closed polyline C (point-to-segment)."""
    tree = cKDTree(C)
    _, i = tree.query(X)
    n = len(C)
    best = np.full(len(X), np.inf); sgn = np.zeros(len(X))
    for off in (-1, 0):
        a = C[(i + off) % n]; b = C[(i + off + 1) % n]
        d = b - a; L2 = (d * d).sum(1)
        t = np.clip(((X - a) * d).sum(1) / L2, 0, 1)
        q = a + t[:, None] * d
        dist = np.sqrt(((X - q) ** 2).sum(1))
        cr = d[:, 0] * (X[:, 1] - a[:, 1]) - d[:, 1] * (X[:, 0] - a[:, 0])
        upd = dist < best
        best[upd] = dist[upd]; sgn[upd] = np.sign(cr[upd])
    return best * sgn


def fit(X, p0, N, m=400):
    fn = lambda p: signed_dist(sample(unpack(p, N), m), X)
    s = least_squares(fn, p0, x_scale='jac', max_nfev=4000)
    return s.x, s.fun


def init_from_param(curve, dcurve, ts, kappa=0.5523):
    """curve(t)->(x,y), dcurve(t)->(dx,dy); ts on-curve params (increasing, in [0,2pi))."""
    N = len(ts); p = []
    for k, t in enumerate(ts):
        P = curve(t); D = dcurve(t)
        al = np.arctan2(D[1], D[0])
        tp = ts[k - 1]; tn = ts[(k + 1) % N]
        dtp = (t - tp) % (2 * np.pi); dtn = (tn - t) % (2 * np.pi)
        sp = np.hypot(*D)
        p += [P[0], P[1], al, sp * dtp * kappa * 4 / np.pi / 2 * (np.pi / 2) / 1.0 * 0.6366, sp * dtn * 0.6366 * kappa * 4 / np.pi / 2 * (np.pi / 2)]
    return np.array(p)


def path_d(segs, nd=2):
    f = lambda q: f'{q[0]:.{nd}f} {q[1]:.{nd}f}'
    s = 'M' + f(segs[0][0])
    for a, b, c, d in segs:
        s += 'C' + f(b) + ' ' + f(c) + ' ' + f(d)
    return s + 'Z'
