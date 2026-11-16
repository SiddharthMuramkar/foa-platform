import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im=np.asarray(Image.open('/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/foa-logo.jpg').convert('RGB')).astype(float)
print(im.shape)
reg=im[405:482,60:820]
lum=reg.mean(2)
# background stats
bgmask=lum>240
print('bg mean',reg[bgmask].mean(0), 'n',bgmask.sum())
# ink core: erode dark mask
dark=lum<80
core=ndi.binary_erosion(dark,iterations=2)
print('core n',core.sum(),'core mean',reg[core].mean(0),'median',np.median(reg[core],0), 'std',reg[core].std(0))
core1=ndi.binary_erosion(dark,iterations=1)
print('core1 mean',reg[core1].mean(0),'median',np.median(reg[core1],0))
# histogram of lum
h,_=np.histogram(lum,bins=26,range=(0,260)); print(h)
# row/col profiles
ink=(255-lum)/255
rows=ink.sum(1); 
for y,v in enumerate(rows):
    if v>0.5: print(405+y, round(v,1), end='; ')
print()
cols=ink.sum(0)
runs=[];inrun=False
for x,v in enumerate(cols):
    if v>0.3 and not inrun: s=x;inrun=True
    if v<=0.3 and inrun: runs.append((60+s,60+x-1));inrun=False
print(runs, len(runs))
