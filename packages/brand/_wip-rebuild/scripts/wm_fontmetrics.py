from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
F='/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/fonts/'
faces=[('/System/Library/Fonts/Helvetica.ttc',i) for i in (0,1,4)]+[('/System/Library/Fonts/HelveticaNeue.ttc',i) for i in (0,10,1,7,12,5)]+[('/System/Library/Fonts/Supplemental/Arial.ttf',0),('/System/Library/Fonts/Supplemental/Arial Bold.ttf',0),(F+'heros/texgyreheros-regular.otf',0),(F+'heros/texgyreheros-bold.otf',0),(F+'nimbus/NimbusSans-Regular.otf',0),(F+'nimbus/NimbusSans-Bold.otf',0)]
def contours_bounds(gs,name):
    rp=DecomposingRecordingPen(gs); gs[name].draw(rp)
    out=[];cur=[]
    for op,args in rp.value:
        if op in('moveTo',):cur=list(args)
        elif op in('closePath','endPath'):
            xs=[p[0] for p in cur];ys=[p[1] for p in cur];out.append((min(xs),min(ys),max(xs),max(ys)));cur=[]
        else: cur+=list(args)
    return out
for p,i in faces:
    f=TTFont(p,fontNumber=i); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm
    def b(c):
        bp=BoundsPen(gs); gs[cmap[ord(c)]].draw(bp); return bp.bounds
    s=1000/upm
    F_=b('F'); l=b('l'); x=b('x'); n=b('n')
    ib=sorted(contours_bounds(gs,cmap[ord('i')]),key=lambda t:t[1])
    stem=ib[0]; dot=ib[-1]
    cap=F_[3]*s; xh=x[3]*s
    print(f"{f['name'].getDebugName(4):28s} cap {cap:.0f} l {l[3]*s:.0f} x {xh:.0f} istem {stem[3]*s:.0f} dot {dot[1]*s:.0f}-{dot[3]*s:.0f} x/cap {xh/cap:.3f} istem/l {stem[3]/l[3]:.3f} dotbot/l {dot[1]/l[3]:.3f} istemW {(stem[2]-stem[0])*s:.0f} stemW/l {(stem[2]-stem[0])/l[3]:.3f}")
