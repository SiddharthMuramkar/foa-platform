import numpy as np
from PIL import Image
im=np.asarray(Image.open('/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/foa-logo.jpg').convert('L')).astype(float)
C=np.clip((254.66-im)/254.66,0,1)
def hrun(y,x0,x1): return C[y,x0:x1+1].sum()
def vrun(x,y0,y1): return C[y0:y1+1,x].sum()
print('F stem width rows 440-465:', np.mean([hrun(y,74,95) for y in range(440,466)]))
print('l stem', np.mean([hrun(y,745,759) for y in range(420,468)]))
print('i stem', np.mean([hrun(y,603,617) for y in range(437,468)]))
print('F top arm thickness x100-120:', np.mean([vrun(x,412,428) for x in range(100,121)]))
print('F mid arm thickness x100-115:', np.mean([vrun(x,435,452) for x in range(100,116)]))
# cap height F stem column-ish: top edge & baseline from row coverage of F stem
for x0,x1,name in [(77,88,'F stem'),(748,756,'l'),(606,614,'i')]:
    prof=C[405:480,x0:x1+1].mean(1)
    idx=np.where(prof>0.02)[0]
    top=405+idx[0]; bot=405+idx[-1]
    tot=prof.sum()
    print(name,'rows',top,bot,'ink height (sum of mean cov)',tot, 'profile top',np.round(prof[idx[0]:idx[0]+3],2),'bottom',np.round(prof[idx[-1]-2:idx[-1]+1],2))
# x-height: n stem (first n, run 228-266) left stem
prof=C[405:480,229:236].mean(1); idx=np.where(prof>0.02)[0]; print('n stem rows',405+idx[0],405+idx[-1],np.round(prof[idx[0]:idx[0]+4],2),np.round(prof[idx[-1]-3:idx[-1]+1],2))
prof=C[405:480,606:615].mean(1); print('i column profile', [(405+i,round(v,2)) for i,v in enumerate(prof) if v>0.02])
