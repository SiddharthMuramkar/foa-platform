"""Parallel stage-R refinement for one face (all glyphs refined concurrently per sweep).
Usage: wm_refine_par.py face_key [sweeps] [maxiter]"""
import sys, json, time
import numpy as np
from multiprocessing import Pool
sys.path.insert(0, '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/scripts')
import wmlib as L
import wm_fit as F
import wm_refine as R
from wm_pg import model_from

def ser(cs):
    return [dict(N=c['N'].tolist(), seg=[(t, None if h1 is None else h1.tolist(), None if h2 is None else h2.tolist()) for t, h1, h2 in c['seg']]) for c in cs]

def job(args):
    i, cs_s, ds, maxiter = args
    cs = R.build_from(cs_s)
    win = F.glyph_win(i, 3)
    others = [ds[j] for j in range(F.N) if j != i and abs(j - i) <= 1]
    new, f0, f1, v = R.refine_glyph(cs, others, win, maxiter=maxiter)
    return i, ser(new), f0, f1

def initial(key, stage='B'):
    mo = model_from(key, stage)
    css = []
    for i in range(F.N):
        t = L.transform_contours(mo.g[i], mo.P[i], mo.kk(i))
        if mo.emb[i] is not None:
            t = L.embolden(t, *mo.emb[i])
        css.append(R.build(t))
    return css

def run(key, sweeps=2, maxiter=120, procs=16, cont=False):
    t0 = time.time()
    if cont:
        o = json.load(open(L.WORK + '/refined_%s.json' % key.replace(':', '')))
        css = [R.build_from(c) for c in o['contours']]
        prev = o.get('hist', [])
    else:
        css = initial(key)
        prev = []
    ds = [R.to_d(c, 4) for c in css]
    m0 = L.metric([R.to_d(c, 2) for c in css])
    print(key, 'start  IoU %.4f mean %.3f p95 %.3f' % (m0['iou'], m0['mean'], m0['p95']), flush=True)
    hist = prev + [m0]
    with Pool(procs) as pool:
        for s in range(sweeps):
            res = pool.map(job, [(i, ser(css[i]), ds, maxiter) for i in range(F.N)])
            for i, cs_s, f0, f1 in res:
                css[i] = R.build_from(cs_s)
            ds = [R.to_d(c, 4) for c in css]
            m = L.metric([R.to_d(c, 2) for c in css])
            hist.append(m)
            print(key, 'R%d     IoU %.4f mean %.3f p95 %.3f  (%.0fs)' % (s + 1, m['iou'], m['mean'], m['p95'], time.time() - t0), flush=True)
    json.dump(dict(face=key, hist=hist, contours=[ser(c) for c in css]),
              open(L.WORK + '/refined_%s.json' % key.replace(':', ''), 'w'))
    return css, hist

if __name__ == '__main__':
    key = sys.argv[1]
    sweeps = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    maxiter = int(sys.argv[3]) if len(sys.argv) > 3 else 120
    cont = len(sys.argv) > 4 and sys.argv[4] == 'cont'
    run(key, sweeps, maxiter, cont=cont)
