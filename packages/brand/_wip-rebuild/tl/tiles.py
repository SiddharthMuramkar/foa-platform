import numpy as np, json, sys
sys.path.insert(0, '.')
from lib import *

Y = load_Y()
tiles = {'red': (RED, 76, 300, 50, 395), 'green': (GREEN, 309, 561, 51, 396), 'blue': (BLUE, 570, 804, 50, 395)}
out = {}
for nm, (col, xa, xb, ya, yb) in tiles.items():
    f = cov(Y, col, WHITE)
    W = 3
    res = {}
    rows = np.arange(ya + 6, yb - 5)
    cols = np.arange(xa + 6, xb - 5)
    # left: window cols xa-W .. xa+W ; inside is >= xa+W+1
    a, b = xa - W, xa + W + 1
    L = b - f[rows][:, a:b].sum(1)
    a, b = xb - W, xb + W + 1
    R = a + f[rows][:, a:b].sum(1)
    a, b = ya - W, ya + W + 1
    T = b - f[:, cols][a:b].sum(0)
    a, b = yb - W, yb + W + 1
    B = a + f[:, cols][a:b].sum(0)
    for k, v, s in (('L', L, rows), ('R', R, rows), ('T', T, cols), ('B', B, cols)):
        p = np.polyfit(s + 0.5, v, 1)
        res[k] = dict(med=float(np.median(v)), mean=float(v.mean()), std=float(v.std()), slope=float(p[0]))
    out[nm] = res
    print(nm, {k: (round(r['med'], 3), round(r['mean'], 3), round(r['std'], 3), '%.2e' % r['slope']) for k, r in res.items()})
    x0, x1, y0, y1 = res['L']['mean'], res['R']['mean'], res['T']['mean'], res['B']['mean']
    # corner check: compare measured coverage around corners vs sharp-rect prediction
    def pred(i, j):
        ox = max(0, min(i + 1, x1) - max(i, x0)); oy = max(0, min(j + 1, y1) - max(j, y0))
        return ox * oy
    for cn, (ci, cj) in {'TL': (int(x0), int(y0)), 'TR': (int(x1), int(y0)), 'BL': (int(x0), int(y1)), 'BR': (int(x1), int(y1))}.items():
        mm = []; pp = []
        for j in range(cj - 3, cj + 4):
            for i in range(ci - 3, ci + 4):
                mm.append(f[j, i]); pp.append(pred(i, j))
        mm = np.array(mm).reshape(7, 7); pp = np.array(pp).reshape(7, 7)
        print('  ', cn, 'sum meas-pred %.3f' % (mm.sum() - pp.sum()), 'max|d| %.3f' % np.abs(mm - pp).max())
json.dump(out, open('tiles_edges.json', 'w'), indent=1)
