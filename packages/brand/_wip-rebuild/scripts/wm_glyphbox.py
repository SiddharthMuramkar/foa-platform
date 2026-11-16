import numpy as np
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
im=np.asarray(Image.open('/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/foa-logo.jpg').convert('L')).astype(float)
C=np.clip((254.66-im)/254.66,0,1)
runs=[(75, 124), (129, 158), (161, 172), (177, 221), (228, 266), (273, 316), (322, 361), (390, 436), (438, 468), (489, 550), (556, 594), (605, 615), (622, 689), (697, 740), (747, 757), (761, 801)]
chars="FriendsofAnimals"
def edges(p):
    idx=np.where(p>0.03)[0]; a=idx[0]; b=idx[-1]
    lo=a+1-p[a]-(p[a+1] if p[a+1]<0.9 else 0)*0 ; hi=b+p[b]
    # better: lo = a+1 - p[a] assuming next is full
    return a+ (1-p[a]) , b+p[b]
boxes=[]
for (x0,x1),c in zip(runs,chars):
    sub=C[405:480,x0-2:x1+3]
    colmax=sub.max(0); rowmax=sub.max(1)
    l,r=edges(colmax); t,b=edges(rowmax)
    boxes.append((x0-2+l,405+t,x0-2+r,405+b))
    print(c, 'x %.2f-%.2f w %.2f  y %.2f-%.2f'%(x0-2+l,x0-2+r,r-l,405+t,405+b))
np.save('/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/rboxes.npy',np.array(boxes))
for p,i in [('/System/Library/Fonts/Helvetica.ttc',0),('/System/Library/Fonts/HelveticaNeue.ttc',10),('/System/Library/Fonts/Helvetica.ttc',1)]:
    f=TTFont(p,fontNumber=i); gs=f.getGlyphSet(); cmap=f.getBestCmap(); s=1000/f['head'].unitsPerEm
    capu=None; out=[]
    ratios=[]
    for k,c in enumerate(chars):
        bp=BoundsPen(gs); gs[cmap[ord(c)]].draw(bp); xb=bp.bounds
        w=(xb[2]-xb[0])*s
        rw=boxes[k][2]-boxes[k][0]
        ratios.append(rw/w)
    sy=53.08/717
    print(f['name'].getDebugName(4), 'px/unit per glyph (x):',' '.join('%s%.4f'%(c,r) for c,r in zip(chars,ratios)), ' -> xscale vs sy=%.4f:'%sy, ' '.join('%.3f'%(r/sy) for r in ratios))
