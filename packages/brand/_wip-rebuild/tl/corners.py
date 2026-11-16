import sys, json, io; sys.path.insert(0,'.')
from lib import *
from fitpoly import poly_path
from PIL import Image
import resvg_py
Y=load_Y()
r=json.load(open('build_result.json'))
def box_cov(rings, roi, ss=16):
    x0,y0,x1,y1=roi; w,h=x1-x0,y1-y0
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}" width="{w*ss}" height="{h*ss}"><path d="{poly_path(rings,4)}" fill="#000" fill-rule="evenodd"/></svg>'
    a=np.asarray(Image.open(io.BytesIO(bytes(resvg_py.svg_to_bytes(svg_string=svg)))).convert('RGBA'))[...,3].astype(float)/255
    return a.reshape(h,ss,w,ss).mean((1,3))
def check(name, rings, col, roi, conv_sign):
    x0,y0,x1,y1=roi
    pred=box_cov(rings,roi); meas=cov(Y,WHITE,col)[y0:y1,x0:x1]
    print(name, 'global sum meas-pred %.2f over %d px'%((meas-pred).sum(), pred.size))
    for ring in rings:
        R=np.array(ring); k=len(R)
        area2=sum(R[i,0]*R[(i+1)%k,1]-R[(i+1)%k,0]*R[i,1] for i in range(k))
        for i in range(k):
            a,b,c=R[i-1],R[i],R[(i+1)%k]
            u=a-b; v=c-b
            th=np.arccos(u@v/np.linalg.norm(u)/np.linalg.norm(v))
            cr=(b-a)[0]*(c-b)[1]-(b-a)[1]*(c-b)[0]
            convex = (cr*area2)>0   # same orientation as ring => convex wrt ring interior
            ci,cj=int(b[0])-x0,int(b[1])-y0
            win=(slice(cj-4,cj+5),slice(ci-4,ci+5))
            d=(meas[win]-pred[win]).sum()
            # material sign: for outer ring convex vertex = white corner; for hole ring convex vertex (of hole) = white reflex corner
            k_area=1/np.tan(th/2)-(np.pi-th)/2
            print('   v(%.2f,%.2f) ang %5.1f %s  sum(meas-pred)=%+.3f  -> equiv fillet r=%.2f px'%(b[0],b[1],np.degrees(th),'convex' if convex else 'reflex',d,np.sqrt(abs(d)/k_area)*np.sign(-d if convex else d)))
F=r['F']; check('F', [F], RED, (100,190,290,390), 1)
check('A', [r['A_out'], r['A_cnt']], BLUE, (570,190,800,390), 1)
