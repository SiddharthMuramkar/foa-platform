import numpy as np, json, sys
from scipy import ndimage as ndi
sys.path.insert(0, '.')
from lib import *
from fitpoly import *

np.set_printoptions(precision=3, suppress=True, linewidth=160)
Y = load_Y()


def letter_points(col, roi):
    x0, y0, x1, y1 = roi
    f = cov(Y, WHITE, col)[y0:y1, x0:x1]
    return crossings(f, x0, y0)


def show(name, ring, stats):
    print(name)
    for v, s in zip(ring, stats):
        print('   v (%.3f, %.3f)   next edge n=%d rms=%.3f ang=%.4f' % (v[0], v[1], s['n'], s['rms'], s['ang']))


res = {}
# ---------------- F
PF = letter_points(RED, (85, 60, 295, 388))
F0 = [(131, 210), (260, 210), (260, 231), (169, 231), (169, 280), (254, 280), (254, 302), (169, 302), (169, 372), (131, 372)]
ring, lines, st = fit_ring(PF, F0, maxd=3, iters=2)
ring, lines, st = fit_ring(PF, ring, maxd=1.5, iters=3)
show('F free', ring, st)
res['F_free'] = ring.tolist()
axes = ['h', 'v', 'h', 'v', 'h', 'v', 'h', 'v', 'h', 'v']
ringA, lines, st = fit_ring(PF, ring, axes=axes, maxd=1.5, iters=3)
show('F axis-aligned', ringA, st)
res['F_axis'] = ringA.tolist()

# ---------------- A
PA = letter_points(BLUE, (578, 60, 797, 388))
A_out0 = [(662.5, 210), (708.75, 210), (785, 372), (745, 372), (722.5, 324.5), (646, 324.5), (625.5, 372), (586, 372)]
A_in0 = [(683.75, 231), (716, 305), (652.5, 305)]
ro, lo, so = fit_ring(PA, A_out0, maxd=3, iters=2)
ro, lo, so = fit_ring(PA, ro, maxd=1.5, iters=3)
show('A outer free', ro, so)
ri, li, si = fit_ring(PA, A_in0, maxd=3, iters=2)
ri, li, si = fit_ring(PA, ri, maxd=1.5, iters=3)
show('A counter free', ri, si)
res['A_out_free'] = ro.tolist(); res['A_in_free'] = ri.tolist()
# collinearity check: outer edges 3 (inner right leg: (745,372)->(722.5,324.5)) and 5 ((646,324.5)->(625.5,372))
# vs counter edges 0 (apex->bottom right) and 2 (bottom left->apex)
for (i, j, nm) in ((3, 0, 'right inner'), (5, 2, 'left inner')):
    n1, c1 = lo[i]; n2, c2 = li[j]
    if n1 @ n2 < 0: n2, c2 = -n2, -c2
    a1 = np.degrees(np.arctan2(-n1[0], n1[1])); a2 = np.degrees(np.arctan2(-n2[0], n2[1]))
    # distance of counter line from leg segment midpoint
    mid = (ro[i] + ro[(i + 1) % 8]) / 2
    print(f'  {nm}: leg ang {a1 % 180:.3f} counter ang {a2 % 180:.3f}; leg-mid to counter line {mid @ n2 - c2:.3f}px')
json.dump(res, open('letters_fit.json', 'w'), indent=1)
np.save('PF.npy', PF); np.save('PA.npy', PA)
