import numpy as np, re
from scipy.spatial import cKDTree
def parse_cubics(d):
    toks=re.findall(r'[MCZ]|-?\d+\.?\d*',d)
    pts=[];cur=None;i=0;segs=[];cmd=None
    while i<len(toks):
        t=toks[i]
        if t in 'MCZ': cmd=t;i+=1;continue
        if cmd=='M': cur=(float(toks[i]),float(toks[i+1]));start=cur;i+=2
        elif cmd=='C':
            p=[float(x) for x in toks[i:i+6]];i+=6
            segs.append((cur,(p[0],p[1]),(p[2],p[3]),(p[4],p[5])));cur=(p[4],p[5])
    return segs
def sample(segs,n=4000):
    out=[]
    t=np.linspace(0,1,n)[:,None]
    for a,b,c,d in segs:
        a,b,c,d=map(np.array,(a,b,c,d))
        out.append((1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t**2*c+t**3*d)
    return np.vstack(out)
tl="M500.39 287.94C501.66 321.72 480.42 354.72 433.43 354.11C393.86 353.60 374.30 327.83 370.20 303.50C364.20 267.89 384.73 227.15 437.34 228.30C479.02 229.20 499.28 258.68 500.39 287.94Z"
mk="M 500.44 291.29 C 500.44 258.74 478.73 228.25 435.02 228.25 C 391.05 228.25 369.20 258.74 369.20 291.29 C 369.20 323.73 391.05 354.12 435.02 354.12 C 478.73 354.12 500.44 323.73 500.44 291.29 Z".replace(' C ','C').replace('M ','M')
mk="M 500.44 291.29 C 500.44 258.74 478.73 228.25 435.02 228.25 C 391.05 228.25 369.20 258.74 369.20 291.29 C 369.20 323.73 391.05 354.12 435.02 354.12 C 478.73 354.12 500.44 323.73 500.44 291.29 Z"
A=sample(parse_cubics(tl));B=sample(parse_cubics(mk))
d,_=cKDTree(B).query(A)
# signed: inside B? use radial from centre
c=np.array([435.02,291.29])
ra=np.linalg.norm(A-c,axis=1)
ang=np.degrees(np.arctan2(A[:,1]-c[1],A[:,0]-c[0]))
# radial of B at same angle
angB=np.degrees(np.arctan2(B[:,1]-c[1],B[:,0]-c[0])); rb=np.linalg.norm(B-c,axis=1)
o=np.argsort(angB); rbi=np.interp(ang,angB[o],rb[o],period=360)
s=ra-rbi
print('dist tl->mk: mean %.3f p95 %.3f max %.3f'%(d.mean(),np.percentile(d,95),d.max()))
print('signed radial tl-mk: mean %.3f min %.3f max %.3f'%(s.mean(),s.min(),s.max()))
for a0 in range(-180,180,30):
    m=(ang>=a0)&(ang<a0+30); print(a0, '%.3f'%s[m].mean())
print('bbox tl',A.min(0),A.max(0)); print('bbox mk',B.min(0),B.max(0))
