"""Minimal reader for the macOS Helvetica LT MM (Weight x Width multiple master Type 1) -> instance outlines.
key format: 'mm:<weight 0..1>:<width 0..1>'"""
import io, re, sys
import numpy as np
from fontTools.misc.macRes import ResourceReader
from fontTools.misc.eexec import decrypt
sys.path.insert(0, '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/scripts')
import wmlib as L

PATH = '/System/Library/Fonts/HelveLTMM'
_cache = {}

def _read():
    if 'subrs' in _cache:
        return _cache['subrs'], _cache['cs']
    r = ResourceReader(io.BytesIO(open(PATH, 'rb').read()))
    binary = b''
    for x in sorted(r['POST'], key=lambda x: x.id):
        if x.data[0] == 2:
            binary += x.data[2:]
        elif x.data[0] == 5:
            break
    txt, _ = decrypt(binary, 55665)
    txt = txt[4:]
    def cs_decrypt(b):
        d, _ = decrypt(b, 4330)
        return d[4:]
    subrs = {}
    pos = txt.find(b'/Subrs')
    pat = re.compile(rb'dup (\d+) (\d+) RD ')
    i = pos
    cspos = txt.find(b'/CharStrings')
    while True:
        m = pat.search(txt, i)
        if not m or m.start() > cspos:
            break
        n = int(m.group(2)); s = m.end()
        subrs[int(m.group(1))] = cs_decrypt(txt[s:s + n])
        i = s + n
    cs = {}
    pat2 = re.compile(rb'/([A-Za-z0-9_.]+) (\d+) RD ')
    i = cspos
    while True:
        m = pat2.search(txt, i)
        if not m:
            break
        n = int(m.group(2)); s = m.end()
        cs[m.group(1).decode()] = cs_decrypt(txt[s:s + n])
        i = s + n
    _cache['subrs'] = subrs; _cache['cs'] = cs
    return subrs, cs

NBLEND = {14: 1, 15: 2, 16: 3, 17: 4, 18: 6}

class Interp:
    def __init__(self, subrs, weights):
        self.subrs = subrs; self.w = weights; self.k = len(weights)
        self.st = []; self.ps = []
        self.cur = np.zeros(2); self.contours = []; self.con = None
        self.flex = None

    def _moveto(self, p):
        if self.con:
            self.contours.append(self.con)
        self.con = [('moveTo', [tuple(p)])]

    def run(self, code):
        i = 0; st = self.st
        while i < len(code):
            b = code[i]
            if b >= 32:
                if b <= 246:
                    st.append(b - 139); i += 1
                elif b <= 250:
                    st.append((b - 247) * 256 + code[i + 1] + 108); i += 2
                elif b <= 254:
                    st.append(-(b - 251) * 256 - code[i + 1] - 108); i += 2
                else:
                    v = int.from_bytes(code[i + 1:i + 5], 'big', signed=True); st.append(v); i += 5
                continue
            i += 1
            if b == 12:
                b = 1200 + code[i]; i += 1
            if self.op(b):
                return True
        return False

    def op(self, b):
        st = self.st
        if b == 13:  # hsbw
            sbx, wx = st[-2], st[-1]; st.clear()
            self.cur = np.array([float(sbx), 0.0]); self.width = wx
        elif b == 1207:  # sbw
            sbx, sby, wx, wy = st[-4:]; st.clear(); self.cur = np.array([float(sbx), float(sby)]); self.width = wx
        elif b in (1, 3, 1201, 1202):  # hstem vstem vstem3 hstem3
            st.clear()
        elif b == 1200:  # dotsection
            st.clear()
        elif b in (21, 22, 4):  # rmoveto hmoveto vmoveto
            if b == 21:
                d = np.array([st[-2], st[-1]], float)
            elif b == 22:
                d = np.array([st[-1], 0.0])
            else:
                d = np.array([0.0, st[-1]])
            st.clear()
            self.cur = self.cur + d
            if self.flex is not None:
                self.flex.append(self.cur.copy())
            else:
                self._moveto(self.cur)
        elif b in (5, 6, 7):  # rlineto hlineto vlineto
            if b == 5:
                d = np.array([st[-2], st[-1]], float)
            elif b == 6:
                d = np.array([st[-1], 0.0])
            else:
                d = np.array([0.0, st[-1]])
            st.clear(); self.cur = self.cur + d
            self.con.append(('lineTo', [tuple(self.cur)]))
        elif b in (8, 30, 31):  # rrcurveto vhcurveto hvcurveto
            if b == 8:
                a = st[-6:]; d1 = (a[0], a[1]); d2 = (a[2], a[3]); d3 = (a[4], a[5])
            elif b == 30:
                a = st[-4:]; d1 = (0, a[0]); d2 = (a[1], a[2]); d3 = (a[3], 0)
            else:
                a = st[-4:]; d1 = (a[0], 0); d2 = (a[1], a[2]); d3 = (0, a[3])
            st.clear()
            p1 = self.cur + d1; p2 = p1 + d2; p3 = p2 + d3
            self.con.append(('curveTo', [tuple(p1), tuple(p2), tuple(p3)]))
            self.cur = p3
        elif b == 9:  # closepath
            st.clear()
        elif b == 14:  # endchar
            st.clear()
            if self.con:
                self.contours.append(self.con); self.con = None
            return True
        elif b == 10:  # callsubr
            n = int(st.pop())
            if self.run(self.subrs[n]):
                return True
        elif b == 11:  # return
            return 'ret'
        elif b == 1212:  # div
            y = st.pop(); x = st.pop(); st.append(x / y)
        elif b == 1216:  # callothersubr
            idx = int(st.pop()); n = int(st.pop())
            args = st[len(st) - n:] if n else []
            del st[len(st) - n:]
            if idx in NBLEND:
                m = NBLEND[idx]
                base = args[:m]; res = []
                for j in range(m):
                    v = base[j]
                    for t in range(1, self.k):
                        v += self.w[t] * args[m + j * (self.k - 1) + (t - 1)]
                    res.append(v)
                # pops must deliver results in original order -> push reversed onto ps stack
                self.ps.extend(reversed(res))
            elif idx == 1:
                self.flex = []
            elif idx == 2:
                pass
            elif idx == 0:
                pts = self.flex; self.flex = None
                # pts[0] reference point, pts[1..6] two bezier curves
                c = [('curveTo', [tuple(pts[1]), tuple(pts[2]), tuple(pts[3])]),
                     ('curveTo', [tuple(pts[4]), tuple(pts[5]), tuple(pts[6])])]
                self.con.extend(c)
                self.cur = pts[6].copy()
                self.ps.extend([pts[6][1], pts[6][0]])
            elif idx == 3:
                self.ps.extend(reversed(args))
            else:
                self.ps.extend(reversed(args))
        elif b == 1217:  # pop
            st.append(self.ps.pop())
        elif b == 1233:  # setcurrentpoint
            y = st.pop(); x = st.pop(); self.cur = np.array([x, y], float)
        elif b == 1206:  # seac
            raise NotImplementedError('seac')
        else:
            raise ValueError('op %d' % b)
        return False

    def run(self, code, _depth=[0]):
        i = 0; st = self.st
        while i < len(code):
            b = code[i]
            if b >= 32:
                if b <= 246:
                    st.append(b - 139); i += 1
                elif b <= 250:
                    st.append((b - 247) * 256 + code[i + 1] + 108); i += 2
                elif b <= 254:
                    st.append(-(b - 251) * 256 - code[i + 1] - 108); i += 2
                else:
                    v = int.from_bytes(code[i + 1:i + 5], 'big', signed=True); st.append(v); i += 5
                continue
            i += 1
            if b == 12:
                b = 1200 + code[i]; i += 1
            r = self.op(b)
            if r == 'ret':
                return False
            if r:
                return True
        return False

def weights(w, d):
    return [(1 - w) * (1 - d), w * (1 - d), (1 - w) * d, w * d]

def glyph(name, w, d):
    subrs, cs = _read()
    it = Interp(subrs, weights(w, d))
    it.run(cs[name])
    return it.contours, it.width

def load(key):
    _, w, d = key.split(':')
    w = float(w); d = float(d)
    out = []
    for c in L.CHARS:
        cons, _ = glyph(c, w, d)
        out.append(cons)
    return out, L.metrics_from(out)

if __name__ == '__main__':
    for w, d in [(0, 0), (1, 0), (0, 1), (1, 1), (0.5, 1)]:
        g, m = load('mm:%g:%g' % (w, d))
        bb = [L.bounds_of(c) for c in g]
        istem = min((L.bounds_of([c]) for c in g[2]), key=lambda b: b[1])
        print(w, d, m, 'F w %.0f' % (bb[0][2] - bb[0][0]), 'i stem w %.0f' % (istem[2] - istem[0]), 'o w %.0f' % (bb[7][2] - bb[7][0]))
