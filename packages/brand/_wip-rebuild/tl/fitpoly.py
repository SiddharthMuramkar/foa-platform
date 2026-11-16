import numpy as np


def tls_line(P):
    """total least squares line: returns (n, c) with n.x = c, |n|=1"""
    m = P.mean(0)
    U, s, Vt = np.linalg.svd(P - m)
    n = Vt[1]
    return n, n @ m


def axis_line(P, axis):
    """axis-aligned line: axis='v' -> x=c (n=(1,0)), 'h' -> y=c"""
    if axis == 'v':
        return np.array([1.0, 0.0]), P[:, 0].mean()
    return np.array([0.0, 1.0]), P[:, 1].mean()


def intersect(l1, l2):
    A = np.array([l1[0], l2[0]]); b = np.array([l1[1], l2[1]])
    return np.linalg.solve(A, b)


def assign(P, ring, margin=2.0, maxd=1.5):
    """assign points to edges of ring (list of vertices). returns list of index arrays"""
    V = np.asarray(ring, float); k = len(V)
    best = np.full(len(P), -1); bestd = np.full(len(P), np.inf)
    for i in range(k):
        a, b = V[i], V[(i + 1) % k]
        d = b - a; L = np.linalg.norm(d); u = d / L
        t = (P - a) @ u
        dist = np.abs((P - a) @ np.array([-u[1], u[0]]))
        ok = (t > margin) & (t < L - margin) & (dist < maxd) & (dist < bestd)
        best[ok] = i; bestd[ok] = dist[ok]
    return [np.nonzero(best == i)[0] for i in range(k)]


def fit_ring(P, ring, axes=None, iters=4, margin=2.0, maxd=1.5, groups=None):
    """axes: list per edge of None/'v'/'h' constraint. groups: list of lists of edge
    indices forced collinear. Returns vertices, lines, per-edge stats"""
    ring = np.asarray(ring, float); k = len(ring)
    for it in range(iters):
        idx = assign(P, ring, margin, maxd)
        lines = [None] * k
        done = set()
        if groups:
            for g in groups:
                Q = np.vstack([P[idx[i]] for i in g])
                l = tls_line(Q)
                for i in g:
                    lines[i] = l; done.add(i)
        for i in range(k):
            if i in done:
                continue
            ax = axes[i] if axes else None
            lines[i] = axis_line(P[idx[i]], ax) if ax else tls_line(P[idx[i]])
        newring = np.array([intersect(lines[(i - 1) % k], lines[i]) for i in range(k)])
        ring = newring
    idx = assign(P, ring, margin, maxd)
    stats = []
    for i in range(k):
        n, c = lines[i]
        r = P[idx[i]] @ n - c
        ang = np.degrees(np.arctan2(-n[0], n[1])) % 180
        stats.append(dict(n=len(idx[i]), rms=float(np.sqrt((r ** 2).mean())) if len(r) else np.nan, ang=float(ang)))
    return ring, lines, stats


def poly_path(rings, nd=2):
    s = []
    for r in rings:
        s.append('M' + ' '.join(f'{x:.{nd}f} {y:.{nd}f}' for x, y in r) + 'Z')
    return ''.join(s)
