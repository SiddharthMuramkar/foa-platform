from lib import *
from fitpoly import *
import json
PA=np.load('PA.npy'); r=json.load(open('letters_fit.json'))
ro=np.array(r['A_out_free'])
# counter 5-gon: apex, kinkR, bottomR, bottomL, kinkL
C0=[(684.4,233.0),(696.5,262.0),(715.9,305.86),(653.1,305.86),(672.3,262.0)]
for maxd,it in ((2.0,3),(1.2,4)):
  rc,lc,sc=fit_ring(PA,C0 if maxd==2.0 else rc,maxd=maxd,iters=it,margin=2.5)
for v,s in zip(rc,sc): print('  v (%.3f,%.3f) edge n=%d rms=%.3f ang=%.3f'%(v[0],v[1],s['n'],s['rms'],s['ang']))
# outer fit lines again
ro2,lo,so=fit_ring(PA,ro,maxd=1.2,iters=3,margin=2.5)
for v,s in zip(ro2,so): print('  o (%.3f,%.3f) edge n=%d rms=%.3f ang=%.3f'%(v[0],v[1],s['n'],s['rms'],s['ang']))
# collinearity: counter lower-right edge (1: kinkR->bottomR) vs outer edge 3 (bottom-right inner->crossbar right)
for ci,oi,nm in ((1,3,'R'),(3,5,'L')):
  pass
def ang(l): n=l[0]; return np.degrees(np.arctan2(-n[0],n[1]))%180
print('lower counter R ang %.3f  leg inner R ang %.3f'%(ang(lc[1]),ang(lo[3])))
print('lower counter L ang %.3f  leg inner L ang %.3f'%(ang(lc[3]),ang(lo[5])))
# offset between lines at crossbar y
for ci,oi in ((1,3),(3,5)):
  n1,c1=lc[ci]; n2,c2=lo[oi]
  if n1@n2<0: n2,c2=-n2,-c2
  for yy in (305.86,324.62):
    # x on each line at yy
    x1=(c1-n1[1]*yy)/n1[0]; x2=(c2-n2[1]*yy)/n2[0]
    print('   y=%.2f  x_counterline=%.3f x_legline=%.3f diff=%.3f'%(yy,x1,x2,x1-x2))
json.dump(dict(counter5=rc.tolist(),outer=ro2.tolist()),open('A_fit2.json','w'),indent=1)
