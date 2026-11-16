import numpy as np
from PIL import Image
from mlib import *
im = Image.open(SRC); im.draft('YCbCr', im.size); Y = np.asarray(im)[..., 0].astype(float)
L = RASTER.astype(float) @ [0.299, 0.587, 0.114]
def stem(name, xa, xb, rows):
    ws = []; cr = []
    for y in rows:
        f = np.clip((254.66 - Y[y, xa:xb]) / 254.66, 0, 1)   # coverage of ink
        ws.append(f.sum())
        # 0.5 crossings on 8x Lanczos row
        t = proj(raster_up((xa, y, xb, y + 1), 8), BLACK, WHITE)[4]
        m = t > 0.5; idx = np.nonzero(m[1:] != m[:-1])[0]
        xs = [xa + (i + .5 + (0.5 - t[i]) / (t[i + 1] - t[i])) / 8 for i in idx]
        cr.append(xs)
    cr = np.array([c for c in cr if len(c) == 2])
    print(f'{name}: coverage width {np.mean(ws):.3f} (sd {np.std(ws):.3f}); 0.5-crossing L {cr[:,0].mean():.3f} R {cr[:,1].mean():.3f} width {np.mean(cr[:,1]-cr[:,0]):.3f}')
stem('i (Friends) stem', 157, 177, range(440, 466))
stem('i (Animals) stem', 600, 621, range(440, 466))
stem('l stem', 742, 762, range(420, 466))
stem('i (Animals) dot', 600, 621, range(418, 423))
stem('i (Friends) dot', 157, 177, range(418, 423))
stem('F stem', 70, 92, range(447, 466))
