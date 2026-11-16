from lib import *
from scipy import ndimage as ndi
from scipy.optimize import least_squares
import json
np.set_printoptions(precision=4, suppress=True, linewidth=200)
Y=load_Y()
x0,y0,x1,y1=(313,56,558,392)
f=cov(Y,WHITE,GREEN)[y0:y1,x0:x1]
m=f>0.5
lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1)); ring=lab==(np.argmax(sizes)+1)
filled=ndi.binary_fill_holes(ring)
outside=~filled; hole=filled&~ring
P=crossings(f,x0,y0)
# classify by pixel neighborhoods
ix=np.floor(P[:,0]-x0).astype(int); iy=np.floor(P[:,1]-y0).astype(int)
dr=ndi.distance_transform_edt(~ring); do=ndi.distance_transform_edt(~outside); dh=ndi.distance_transform_edt(~hole)
paw=m&~ring; dp=ndi.distance_transform_edt(~paw)
near_ring=dr[iy,ix]<=1.5
outer=near_ring&(do[iy,ix]<=1.5)
inner=near_ring&(dh[iy,ix]<=1.5)&(dp[iy,ix]>3)
Po=P[outer]; Pi=P[inner&~outer]
print('n outer',len(Po),'n inner',len(Pi))
np.save('O_outer.npy',Po); np.save('O_inner.npy',Pi)

def resid_ellipse(p,X):
    cx,cy,a,b,th=p
    c,s=np.cos(th),np.sin(th)
    u=(X[:,0]-cx)*c+(X[:,1]-cy)*s; v=-(X[:,0]-cx)*s+(X[:,1]-cy)*c
    # Sampson-like geometric approx: F/|grad F| with F=(u/a)^2+(v/b)^2-1
    F=(u/a)**2+(v/b)**2-1
    gu=2*u/a**2; gv=2*v/b**2
    return F/np.sqrt(gu**2+gv**2)
def fit(X,kind):
    cx,cy=X.mean(0); r=np.sqrt(((X-[cx,cy])**2).sum(1)).mean()
    if kind=='circle':
        fn=lambda q: resid_ellipse([q[0],q[1],q[2],q[2],0],X); q0=[cx,cy,r]
    elif kind=='axis':
        fn=lambda q: resid_ellipse([q[0],q[1],q[2],q[3],0],X); q0=[cx,cy,r,r*0.9]
    else:
        fn=lambda q: resid_ellipse(q,X); q0=[cx,cy,r,r*0.9,0.05]
    s=least_squares(fn,q0)
    return s.x, s.fun
out={}
for nm,X in (('outer',Po),('inner',Pi)):
    for kind in ('circle','axis','rot'):
        q,r=fit(X,kind)
        print(nm,kind,q.round(4),'rms %.4f max %.3f'%(np.sqrt((r**2).mean()),np.abs(r).max()))
        out[nm+'_'+kind]=q.tolist()
json.dump(out,open('O_fit.json','w'),indent=1)
