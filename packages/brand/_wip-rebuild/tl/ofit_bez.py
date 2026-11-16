import numpy as np, json, sys
sys.path.insert(0,'.')
from bezfit import *
se=json.load(open('O_se.json'))
out={}
for nm in ('outer','inner'):
    X=np.load('O_%s.npy'%nm)
    cx,cy,a,b,n,th=se[nm+'_se']
    c,s=np.cos(th),np.sin(th)
    def curve(t):
        u=a*np.cos(t); v=b*np.sin(t); return np.array([cx+u*c-v*s, cy+u*s+v*c])
    def dcurve(t):
        u=-a*np.sin(t); v=b*np.cos(t); return np.array([u*c-v*s, u*s+v*c])
    for N in (4,8):
        ts=np.arange(N)*2*np.pi/N
        p0=[]
        for k,t in enumerate(ts):
            P=curve(t); D=dcurve(t); dt=2*np.pi/N
            sp=np.hypot(*D); al=np.arctan2(D[1],D[0])
            h=sp*dt/3*(4/3*np.tan(dt/4))/(dt/3)  # exact circle-handle scale
            h*=1.08  # squarer
            p0+= [P[0],P[1],al,h,h]
        p,r=fit(X,np.array(p0),N)
        print(nm,'N=%d rms %.4f p95 %.3f max %.3f'%(N,np.sqrt((r**2).mean()),np.percentile(np.abs(r),95),np.abs(r).max()))
        out['%s_%d'%(nm,N)]=p.tolist()
        segs=unpack(p,N)
        ang=np.arctan2(X[:,1]-cy,X[:,0]-cx); bins=np.linspace(-np.pi,np.pi,25)
        print('   ',' '.join('%4.0f:%+.2f'%(np.degrees((bins[i]+bins[i+1])/2), r[(ang>=bins[i])&(ang<bins[i+1])].mean()) for i in range(24)))
        if N==4:
            print('   on-curve:',np.array(p).reshape(N,5)[:,:3].round(3).tolist())
json.dump(out,open('O_bez.json','w'),indent=1)
