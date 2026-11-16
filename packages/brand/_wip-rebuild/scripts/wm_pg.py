"""per-glyph metric breakdown from saved fit json"""
import sys, json
sys.path.insert(0, '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/scripts')
import wm_fit as F, wmlib as L
import numpy as np

def model_from(key, stage='B'):
    r = json.load(open(L.WORK + '/fit_results_%s.json' % key.replace(':', '')))[0]
    g, m = F.load(key)
    mo = F.Model(g, m)
    mo.P = [dict(p) for p in r['P' + stage]]
    mo.emb = [tuple(e) if e is not None else None for e in r['emb' + stage]]
    return mo

if __name__ == '__main__':
    for key in sys.argv[1:]:
        mo = model_from(key)
        pg = F.per_glyph_metric(mo) if hasattr(F, 'per_glyph_metric') else None
        print(key, ' '.join('%s:%.2f/%.2f' % (L.CHARS[i], d['mean'], d['p95']) for i, d in enumerate(pg)))
