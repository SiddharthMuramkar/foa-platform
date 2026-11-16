import numpy as np, json, sys, warnings, logging
logging.disable(logging.WARNING)
from fontTools.ttLib import TTFont, TTCollection
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.basePen import decomposeQuadraticSegment
from scipy.optimize import least_squares

FONTS = {
 'Helvetica Bold': ('/System/Library/Fonts/Helvetica.ttc', 1),
 'Helvetica': ('/System/Library/Fonts/Helvetica.ttc', 0),
 'Helvetica Neue Bold': ('/System/Library/Fonts/HelveticaNeue.ttc', 1),
 'Helvetica Neue Medium': ('/System/Library/Fonts/HelveticaNeue.ttc', 10),
 'Arial Bold': ('/System/Library/Fonts/Supplemental/Arial Bold.ttf', None),
 'Arial': ('/System/Library/Fonts/Supplemental/Arial.ttf', None),
}

def glyph_rings(name, ch):
    path, idx = FONTS[name]
    f = TTCollection(path).fonts[idx] if idx is not None else TTFont(path)
    gs = f.getGlyphSet(); g = gs[f.getBestCmap()[ord(ch)]]
    pen = RecordingPen(); g.draw(pen)
    rings = []; cur = []; ncurve = 0
    for op, args in pen.value:
        if op == 'moveTo': cur = [args[0]]
        elif op == 'lineTo': cur.append(args[0])
        elif op == 'qCurveTo':
            ncurve += 1
            pts = list(args)
            if pts[-1] is None: pts = pts[:-1]
            for (c, e) in decomposeQuadraticSegment(pts):
                s = np.array(cur[-1]); c = np.array(c); e = np.array(e)
                for t in np.linspace(0, 1, 9)[1:]:
                    cur.append(tuple((1-t)**2*s + 2*(1-t)*t*c + t**2*e))
        elif op == 'curveTo':
            ncurve += 1
            s = np.array(cur[-1]); c1, c2, e = map(np.array, args)
            for t in np.linspace(0, 1, 9)[1:]:
                cur.append(tuple((1-t)**3*s+3*(1-t)**2*t*c1+3*(1-t)*t**2*c2+t**3*e))
        elif op in ('closePath', 'endPath'):
            r = np.array(cur, float)
            if np.allclose(r[0], r[-1]): r = r[:-1]
            rings.append(r)
    return rings, ncurve

def segs_of(rings):
    A = []; B = []
    for r in rings:
        A.append(r); B.append(np.roll(r, -1, 0))
    return np.vstack(A), np.vstack(B)

def dist_to_segs(X, A, B):
    d = B - A; L2 = (d*d).sum(1)
    t = np.clip(((X[:, None, :] - A[None]) * d[None]).sum(2) / L2[None], 0, 1)
    Q = A[None] + t[..., None] * d[None]
    D = np.sqrt(((X[:, None, :] - Q)**2).sum(2))
    return D.min(1)

def transform(rings, p):
    sx, sy, tx, ty = p
    return [np.c_[r[:, 0]*sx + tx, -r[:, 1]*sy + ty] for r in rings]

def fit_glyph(name, ch, X, bbox):
    rings, nc = glyph_rings(name, ch)
    allp = np.vstack(rings)
    gx0, gx1 = allp[:, 0].min(), allp[:, 0].max(); gy0, gy1 = allp[:, 1].min(), allp[:, 1].max()
    x0, y0, x1, y1 = bbox
    sy = (y1 - y0) / (gy1 - gy0); sx = (x1 - x0) / (gx1 - gx0)
    p0 = [sx, sy, x0 - gx0*sx, y1 + gy0*sy]
    def fn(p):
        A, B = segs_of(transform(rings, p)); return dist_to_segs(X, A, B)
    s = least_squares(fn, p0, loss='soft_l1', f_scale=0.5)
    r = fn(s.x)
    return s.x, r, transform(rings, s.x), nc

if __name__ == '__main__':
    PF = np.load('PF.npy'); PA = np.load('PA.npy')
    out = {}
    for ch, X, bbox in (('F', PF, (131.07, 210.39, 260.28, 371.89)), ('A', PA, (586.55, 210.38, 784.57, 371.89))):
        for name in FONTS:
            p, r, R, nc = fit_glyph(name, ch, X, bbox)
            print(ch, '%-22s' % name, 'sx/sy=%.4f' % (p[0]/p[1]), 'rms %.3f p95 %.3f max %.3f' % (np.sqrt((r**2).mean()), np.percentile(r, 95), r.max()), 'curves', nc, 'nverts', sum(len(q) for q in R))
            out[ch + '|' + name] = dict(p=p.tolist(), rings=[q.tolist() for q in R], rms=float(np.sqrt((r**2).mean())))
    json.dump(out, open('glyph_fits.json', 'w'))
