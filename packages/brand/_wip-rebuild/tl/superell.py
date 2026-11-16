import numpy as np, json
from scipy.optimize import least_squares
def G_dist(p,X):
    cx,cy,a,b,n,th=p[:6]
    c,s=np.cos(th),np.sin(th)
    dx=X[:,0]-cx; dy=X[:,1]-cy
    u=dx*c+dy*s; v=-dx*s+dy*c
    au=np.abs(u/a)+1e-12; av=np.abs(v/b)+1e-12
    S=au**n+av**n
    G=S**(1/n)-1
    # gradient wrt u,v
    gu=S**(1/n-1)*au**(n-1)*np.sign(u)/a; gv=S**(1/n-1)*av**(n-1)*np.sign(v)/b
    return G/np.sqrt(gu**2+gv**2)
def G_dist_skew(p,X):
    # superellipse with shear: x' = u - k*v  (k = skew)
    cx,cy,a,b,n,th,k=p
    c,s=np.cos(th),np.sin(th)
    dx=X[:,0]-cx; dy=X[:,1]-cy
    u=dx*c+dy*s; v=-dx*s+dy*c
    u=u-k*v
    au=np.abs(u/a)+1e-12; av=np.abs(v/b)+1e-12
    S=au**n+av**n
    G=S**(1/n)-1
    gu=S**(1/n-1)*au**(n-1)*np.sign(u)/a; gv=S**(1/n-1)*av**(n-1)*np.sign(v)/b
    # chain rule: d/dv_orig = gv - k*gu ; d/du_orig = gu
    return G/np.sqrt(gu**2+(gv-k*gu)**2)
res={}
o=json.load(open('O_fit.json'))
for nm in ('outer','inner'):
    X=np.load('O_%s.npy'%nm)
    q=o[nm+'_axis']
    s=least_squares(lambda p:G_dist(p,X),[q[0],q[1],q[2],q[3],2.2,0.0])
    r=s.fun; print(nm,'superell rot',s.x.round(4),'rms %.4f max %.3f p95 %.3f'%(np.sqrt((r**2).mean()),np.abs(r).max(),np.percentile(np.abs(r),95)))
    res[nm+'_se']=s.x.tolist()
    s2=least_squares(lambda p:G_dist_skew(p,X),list(s.x)+[0.0])
    r=s2.fun; print(nm,'superell rot+skew',s2.x.round(4),'rms %.4f max %.3f p95 %.3f'%(np.sqrt((r**2).mean()),np.abs(r).max(),np.percentile(np.abs(r),95)))
    res[nm+'_sesk']=s2.x.tolist()
    # angular residual profile
    p=s2.x; cx,cy=p[0],p[1]
    ang=np.arctan2(X[:,1]-cy,X[:,0]-cx)
    bins=np.linspace(-np.pi,np.pi,25)
    print('   ',' '.join('%4.0f:%+.2f'%(np.degrees((bins[i]+bins[i+1])/2), r[(ang>=bins[i])&(ang<bins[i+1])].mean()) for i in range(24)))
json.dump(res,open('O_se.json','w'),indent=1)
