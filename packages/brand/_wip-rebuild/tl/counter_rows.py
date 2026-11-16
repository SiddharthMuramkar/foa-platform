from lib import *
np.set_printoptions(precision=3, suppress=True, linewidth=220)
Y=load_Y(); f=cov(Y,WHITE,BLUE)
def edges_row(j, x0=580, x1=795):
  row=f[j,x0:x1]
  m=row>0.5
  tr=np.nonzero(np.diff(m.astype(int)))[0]
  out=[]
  for i in tr:
    a=i-2; b=i+4
    seg=row[a:b]
    out.append(x0+b-seg.sum() if not m[i] else x0+a+seg.sum())
  return out
cl=[];cr=[]
for j in range(226,306):
  e=edges_row(j)
  if len(e)==4: cl.append((j+.5,e[1])); cr.append((j+.5,e[2]))
cl=np.array(cl); cr=np.array(cr)
np.save('cl.npy',cl); np.save('cr.npy',cr)
print('first rows', cl[:4], cr[:4])
for nm,a in (('L',cl),('R',cr)):
  w=8
  print(nm,' '.join('%.0f:%.4f'%(a[k+w//2,0], np.polyfit(a[k:k+w,0],a[k:k+w,1],1)[0]) for k in range(0,len(a)-w,4)))
