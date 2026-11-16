"""overlay helper: raster mask vs rendered mask at 8x -> colour image (white both-out, black both-in, red raster-only, blue render-only)"""
import numpy as np
from PIL import Image
import sys
sys.path.insert(0, '/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/scripts')
import wmlib as L

def overlay(ds, path, win=L.WIN, crop=None, scale=8):
    mm = L.metric(ds, win, return_maps=True)
    r, t = mm['r'], mm['t']
    img = np.full(r.shape + (3,), 255, np.uint8)
    img[r & t] = (0, 0, 0)
    img[t & ~r] = (230, 40, 40)
    img[r & ~t] = (40, 90, 255)
    im = Image.fromarray(img)
    if crop:
        x0, x1 = crop
        im = im.crop(((x0 - win[0]) * 8, 0, (x1 - win[0]) * 8, im.size[1]))
    if scale != 8:
        im = im.resize((im.size[0] * scale // 8, im.size[1] * scale // 8), Image.LANCZOS)
    im.save(path)
    return mm
