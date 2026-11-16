"""Write the wordmark SVG fragment and re-measure it from the written file."""
import sys, re
import numpy as np
sys.path.insert(0, '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/scripts')
import wmlib as L

FILL = '#000000'

def write_svg(path, ds, comment=''):
    lines = ['<svg xmlns="http://www.w3.org/2000/svg" width="910" height="1024" viewBox="0 0 910 1024">']
    if comment:
        lines.append('<!-- %s -->' % comment.replace('--', '-'))
    lines.append('<g id="wordmark">')
    for i, (c, d) in enumerate(zip(L.CHARS, ds)):
        lines.append('<path id="wm-%d-%s" fill="%s" d="%s"/>' % (i, c, FILL, d))
    lines.append('</g>')
    lines.append('</svg>')
    open(path, 'w').write('\n'.join(lines) + '\n')

def read_paths(path):
    s = open(path).read()
    return re.findall(r'<path id="(wm-[^"]+)" fill="([^"]+)" d="([^"]+)"', s)

def measure_file(path):
    ps = read_paths(path)
    ds = [d for _, _, d in ps]
    return L.metric(ds), ps
