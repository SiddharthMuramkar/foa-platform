from PIL import Image
import sys
im = Image.open(sys.argv[1]).convert('RGB')
W,H = im.size
px = im.load()
def cls(c):
    r,g,b = c
    if r>200 and g>200 and b>200: return 'W'
    if r<70 and g<70 and b<70: return 'K'
    if r>150 and g<90 and b<90: return 'R'
    if g>130 and r<90 and b<90: return 'G'
    if b>180 and r<110 and g<140: return 'B'
    return '?'
# bounding boxes per class in top half
top = 520
boxes = {}
for y in range(top):
    for x in range(W):
        k = cls(px[x,y])
        if k in 'RGBK':
            b = boxes.setdefault(k,[W,H,0,0])
            b[0]=min(b[0],x); b[1]=min(b[1],y); b[2]=max(b[2],x); b[3]=max(b[3],y)
print(boxes)
# horizontal scan at a row through tiles above the letters
for y in (80, 150, 300):
    row = ''.join(cls(px[x,y]) for x in range(W))
    # run-length
    runs=[]; prev=None; start=0
    for i,c in enumerate(row+'#'):
        if c!=prev:
            if prev is not None: runs.append((prev,start,i-1))
            prev=c; start=i
    print(y, [r for r in runs if r[2]-r[1]>=1])
