"""Write final wordmark_traced.svg, metrics JSON and 4x overlay."""
import io, json, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import trace as T
import resvg_py

params = dict(thresh=124.0, alphamax=0.8, opticurve=True, opttolerance=0.05, turdsize=16)
svg, n = T.build_svg(params)
# per-path fill attrs too, so paths stay correct if lifted out of the group
svg = svg.replace('<path id=', '<path fill="#000000" fill-rule="evenodd" id=')
out_svg = HERE + '/wordmark_traced.svg'
open(out_svg, 'w').write(svg)

m1, r1, ref1 = T.metrics(svg, 1)
m4, r4, ref4 = T.metrics(svg, 4)

# diagnostics for the 1x binary-edge metric
A, B = r1 < 127.5, ref1 < 127.5
eA, eB = T.edges(A), T.edges(B)
dA, dB = ndi.distance_transform_edt(~eA), ndi.distance_transform_edt(~eB)
dev = np.concatenate([dB[eA], dA[eB]])
mm = A ^ B
diag1 = dict(edge_px=int(eA.sum() + eB.sum()), nonzero_dev_frac=round(float((dev > 0).mean()), 4),
             mismatch_px=int(mm.sum()),
             mismatch_render_cov_within_10pct_of_50=round(float((np.abs(r1[mm] - 127.5) < 25.5).mean()), 3),
             mismatch_ref_grey_p5_p95=[round(float(v), 1) for v in np.percentile(ref1[mm], [5, 95])])

# trace fidelity: vector vs the 8x thresholded mask it was traced from
s = 8
r8 = T.render(svg, s)[T.Y0 * s:T.Y1 * s, T.X0 * s:T.X1 * s]
M8 = T.upsample(T.band, 8) < params['thresh']
A8 = r8 < 127.5
e1, e2 = T.edges(A8), T.edges(M8)
d1, d2 = ndi.distance_transform_edt(~e1), ndi.distance_transform_edt(~e2)
dv8 = np.concatenate([d2[e1], d1[e2]]) / s
m8 = dict(iou=round(float((A8 & M8).sum() / (A8 | M8).sum()), 5), mean_px=round(float(dv8.mean()), 4),
          p95_px=round(float(np.percentile(dv8, 95)), 4), max_px=round(float(dv8.max()), 3))

targets = dict(iou=0.98, mean_px=0.35, p95_px=0.75)
def passes(m):
    return dict(iou=m['iou'] >= targets['iou'], mean_px=m['mean_px'] <= targets['mean_px'], p95_px=m['p95_px'] <= targets['p95_px'])

ids = re.findall(r'id="(wm-[^"]+)"', svg)
subpaths = {i: d.count('M') for i, d in re.findall(r'id="(wm-[^"]+)" d="([^"]+)"', svg)}
res = dict(svg=out_svg, source='foa-logo.jpg top half, wordmark band x%d-%d y%d-%d (px, exclusive end)' % (T.X0, T.X1, T.Y0, T.Y1),
           method='band crop pad 6, Lanczos 8x, threshold, 8-conn components (i-dots merged), potracer per glyph',
           params=params, glyph_count=len(ids), glyph_ids=ids, subpaths=subpaths, path_bytes=len(svg),
           targets=targets, metrics_1x=m1, metrics_4x=m4, pass_1x=passes(m1), pass_4x=passes(m4),
           diag_1x=diag1, trace_fidelity_8x_vs_threshold_mask=m8,
           notes='binarised at 127.5; boundary deviation = symmetric distance between inner-edge pixels of both masks, in raster px. '
                 '1x deviations are quantised to {0,1,1.41..}; p95 hits 1.0 when >5% of edge px differ. '
                 'grey_mae = mean |render-ref| grey level over the band.')
json.dump(res, open(HERE + '/wordmark_traced_metrics.json', 'w'), indent=2)

# overlay at 4x: raster grey + red outline of the vector
s = 4
ol = svg.replace('fill="#000000" fill-rule="evenodd"', 'fill="none" stroke="#ff0000" stroke-width="0.3"')
png = resvg_py.svg_to_bytes(svg_string=ol, width=T.W * s, height=T.H * s)
rgba = np.asarray(Image.open(io.BytesIO(bytes(png))).convert('RGBA'), dtype=np.float32)[T.Y0 * s:T.Y1 * s, T.X0 * s:T.X1 * s]
g = ref4.clip(0, 255)
base = 255 - 0.55 * (255 - g)  # lighten raster to mid grey
base = np.repeat(base[..., None], 3, 2)
a = rgba[..., 3:4] / 255.0
comp = base * (1 - a) + rgba[..., :3] * a
Image.fromarray(comp.clip(0, 255).astype(np.uint8)).save(HERE + '/wordmark_traced_overlay_4x.png')
print(json.dumps(dict(glyphs=len(ids), m1=m1, m4=m4, m8=m8, diag1=diag1, subpaths=subpaths), indent=1))
