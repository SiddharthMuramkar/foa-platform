"""Compose final FOA logo SVG from the three part fragments."""
import re, sys, os
import xml.etree.ElementTree as ET
import numpy as np

W = '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/Users/siddharth/Developer/foa-platform-wt-6-logo-svg/packages/brand/foa-logo.svg'
NS = '{http://www.w3.org/2000/svg}'

def fmt(v):
    s = f'{float(v):.2f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

NUM = re.compile(r'-?\d*\.?\d+(?:[eE][-+]?\d+)?')
def tok(d):
    return re.findall(r'[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?', d)

ARGN = dict(M=2, L=2, H=1, V=1, C=6, S=4, Q=4, T=2, A=7, Z=0)
def clean_d(d):
    """Re-emit absolute path data compactly: 2-dec numbers, implicit separators."""
    t = tok(d); out = []; i = 0; cmd = None; prev = None
    while i < len(t):
        if re.fullmatch(r'[A-Za-z]', t[i]):
            cmd = t[i]; i += 1
            assert cmd.isupper(), 'relative command found'
            if cmd == 'Z': out.append('Z'); prev = 'Z'; continue
            emit = cmd
        else:
            emit = None  # implicit repeat
        n = ARGN[cmd]; args = t[i:i + n]; i += n
        if cmd == 'A':
            a = [fmt(args[0]), fmt(args[1]), fmt(args[2]), str(int(float(args[3]))), str(int(float(args[4]))), fmt(args[5]), fmt(args[6])]
        else:
            a = [fmt(x) for x in args]
        s = ' '.join(a)
        if emit:
            out.append(emit + s)
        else:
            out.append(' ' + s)
        prev = cmd
    return ''.join(out)

def load(p):
    return ET.parse(p).getroot()

tl = load(f'{W}/parts/tiles_letters.svg')
mk = load(f'{W}/parts/mark.svg')
wm = load(f'{W}/parts/wordmark.svg')

def find(root, gid):
    for el in root.iter():
        if el.get('id') == gid:
            return el
    raise KeyError(gid)

disc_d = find(mk, 'mark-disc').get('d')

lines = []
# --- tiles + letters
for gid in ('tile-red', 'tile-green', 'tile-blue'):
    r = find(tl, gid)[0]
    lines.append(f'<g id="{gid}"><rect x="{fmt(r.get("x"))}" y="{fmt(r.get("y"))}" width="{fmt(r.get("width"))}" height="{fmt(r.get("height"))}" fill="{r.get("fill")}"/></g>')
for gid in ('letter-f', 'letter-o', 'letter-a'):
    p = find(tl, gid)[0]
    d = p.get('d')
    if gid == 'letter-o':
        # outer subpath from tiles-letters builder; inner (hole) = mark-disc path verbatim
        outer = d.split('Z')[0] + 'Z'
        d = outer + disc_d
    fr = f' fill-rule="{p.get("fill-rule")}"' if p.get('fill-rule') else ''
    lines.append(f'<g id="{gid}"><path d="{clean_d(d)}" fill="{p.get("fill")}"{fr}/></g>')
# --- mark
lines.append('<g id="mark">')
lines.append(f'<path id="mark-disc" d="{clean_d(disc_d)}" fill="{find(mk, "mark-disc").get("fill")}"/>')
lines.append('<g id="mark-paw" fill="#FFFFFF">')
for c in find(mk, 'mark-paw'):
    assert c.get('fill') == '#FFFFFF'
    lines.append(f'<path id="{c.get("id")}" d="{clean_d(c.get("d"))}"/>')
lines.append('</g>')
lines.append('<g id="mark-hands" fill="#FFFFFF">')
for c in find(mk, 'mark-hands'):
    assert c.get('fill') == '#FFFFFF'
    lines.append(f'<path id="{c.get("id")}" d="{clean_d(c.get("d"))}"/>')
lines.append('</g>')
lines.append('</g>')
# --- wordmark
lines.append('<g id="wordmark" fill="#000000">')
lines.append('<!-- wordmark outlines derived from TeX Gyre Heros (GUST e-foundry), GUST Font License -->')
for c in find(wm, 'wordmark'):
    if c.tag != NS + 'path':
        continue
    assert c.get('fill') == '#000000'
    lines.append(f'<path id="{c.get("id")}" d="{clean_d(c.get("d"))}"/>')
lines.append('</g>')

body = '\n'.join(lines)

# ---- tight bounds from exact geometry (sampled curves + rect corners)
def path_points(d):
    t = tok(d); i = 0; cmd = None; cur = np.zeros(2); start = cur; pts = []
    tt = np.linspace(0, 1, 2001)[:, None]
    while i < len(t):
        if re.fullmatch(r'[A-Za-z]', t[i]):
            cmd = t[i]; i += 1
            if cmd == 'Z': cur = start; continue
        n = ARGN[cmd]; a = [float(x) for x in t[i:i + n]]; i += n
        if cmd == 'M': cur = np.array(a); start = cur; pts.append(cur[None])
        elif cmd == 'L': cur = np.array(a); pts.append(cur[None])
        elif cmd == 'H': cur = np.array([a[0], cur[1]]); pts.append(cur[None])
        elif cmd == 'V': cur = np.array([cur[0], a[0]]); pts.append(cur[None])
        elif cmd == 'C':
            p0, p1, p2, p3 = cur, np.array(a[0:2]), np.array(a[2:4]), np.array(a[4:6])
            pts.append((1-tt)**3*p0 + 3*(1-tt)**2*tt*p1 + 3*(1-tt)*tt**2*p2 + tt**3*p3); cur = p3
        elif cmd == 'A':
            # arc to centre param (SVG F.6.5)
            rx, ry, phi, fa, fs, x, y = a; phi = np.radians(phi)
            x1, y1 = cur; x2, y2 = x, y
            c, s = np.cos(phi), np.sin(phi)
            dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
            x1p = c*dx + s*dy; y1p = -s*dx + c*dy
            lam = x1p**2/rx**2 + y1p**2/ry**2
            if lam > 1: rx *= np.sqrt(lam); ry *= np.sqrt(lam)
            num = rx**2*ry**2 - rx**2*y1p**2 - ry**2*x1p**2
            den = rx**2*y1p**2 + ry**2*x1p**2
            co = np.sqrt(max(num, 0) / den) * (-1 if fa == fs else 1)
            cxp = co*rx*y1p/ry; cyp = -co*ry*x1p/rx
            cx = c*cxp - s*cyp + (x1 + x2)/2; cy = s*cxp + c*cyp + (y1 + y2)/2
            def ang(u, v): return np.arctan2(u[0]*v[1]-u[1]*v[0], u[0]*v[0]+u[1]*v[1])
            th1 = ang((1, 0), ((x1p-cxp)/rx, (y1p-cyp)/ry))
            dth = ang(((x1p-cxp)/rx, (y1p-cyp)/ry), ((-x1p-cxp)/rx, (-y1p-cyp)/ry))
            if not fs and dth > 0: dth -= 2*np.pi
            if fs and dth < 0: dth += 2*np.pi
            th = th1 + dth*tt[:, 0]
            pts.append(np.c_[cx + rx*np.cos(th)*c - ry*np.sin(th)*s, cy + rx*np.cos(th)*s + ry*np.sin(th)*c])
            cur = np.array([x2, y2])
    return np.vstack(pts)

allp = []
for m in re.finditer(r'<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"', body):
    x, y, w, h = map(float, m.groups()); allp.append(np.array([[x, y], [x+w, y+h]]))
for m in re.finditer(r' d="([^"]+)"', body):
    allp.append(path_points(m.group(1)))
P = np.vstack(allp)
x0, y0 = np.floor(np.round(P.min(0)*100, 6))/100
x1, y1 = np.ceil(np.round(P.max(0)*100, 6))/100
vb = f'{fmt(x0)} {fmt(y0)} {fmt(x1-x0)} {fmt(y1-y0)}'
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img">\n'
       f'<title>Friends of Animals</title>\n{body}\n</svg>\n')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w').write(svg)
print('bounds', P.min(0), P.max(0)); print('viewBox', vb); print('bytes', len(svg.encode()))
