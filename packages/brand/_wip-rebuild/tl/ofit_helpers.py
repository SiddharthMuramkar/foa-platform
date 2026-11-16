import numpy as np, json
def uv(p,X):
    cx,cy,a,b,th=p
    c,s=np.cos(th),np.sin(th)
    u=(X[:,0]-cx)*c+(X[:,1]-cy)*s; v=-(X[:,0]-cx)*s+(X[:,1]-cy)*c
    return u,v
