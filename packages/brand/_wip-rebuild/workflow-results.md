# Workflow results: logo-svg (run wf_d6928704-9a2)

## build:tiles-letters
```json
{
  "fragment_path": "/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/parts/tiles_letters.svg",
  "groups": [
    {
      "id": "tile-red",
      "description": "rect x75.10 y49.59 w226.25 h346.65 (edges 75.10/301.35/49.59/396.24), fill #CB2322, square corners"
    },
    {
      "id": "tile-green",
      "description": "rect x308.75 y50.65 w253.56 h346.31 (edges 308.75/562.31/50.65/396.96), fill #01AD01, square corners"
    },
    {
      "id": "tile-blue",
      "description": "rect x569.72 y49.57 w235.13 h346.68 (edges 569.72/804.85/49.57/396.25), fill #263FF1, square corners. Gaps between tiles: 7.40 and 7.41 px"
    },
    {
      "id": "letter-f",
      "description": "white 10-vertex axis-aligned polygon: stem x131.13-168.80, cap 210.49, baseline 371.86, top arm to x260.35 (bottom 230.88), middle arm 280.89-301.15 to x253.86; sharp corners"
    },
    {
      "id": "letter-o",
      "description": "white ring, one path fill-rule evenodd: outer and inner each a closed 4-segment cubic Bezier (not an ellipse, more like a superellipse). Inner subpath = green-disc boundary (hole, transparent over tile-green), ready for the paw mark. Overshoots cap/baseline: top 208.18, bottom 374.14"
    },
    {
      "id": "letter-a",
      "description": "white path fill-rule evenodd: outer 8-gon with flat apex (662.49-708.62 at y210.47), crossbar bottom 324.56, baseline 371.85. Counter is a 5-gon, not a triangle: pointed apex (684.24,231.36), sides kink at y~260.1/261.0, counter bottom 305.78"
    }
  ],
  "metrics": [
    {
      "id": "tile-red",
      "iou": 0.9991,
      "mean_px": 0.063,
      "p95_px": 0.125
    },
    {
      "id": "tile-green",
      "iou": 0.9995,
      "mean_px": 0.038,
      "p95_px": 0.125
    },
    {
      "id": "tile-blue",
      "iou": 0.9991,
      "mean_px": 0.062,
      "p95_px": 0.125
    },
    {
      "id": "letter-f",
      "iou": 0.9977,
      "mean_px": 0.03,
      "p95_px": 0.125
    },
    {
      "id": "letter-o",
      "iou": 0.9973,
      "mean_px": 0.044,
      "p95_px": 0.125
    },
    {
      "id": "letter-a",
      "iou": 0.9969,
      "mean_px": 0.049,
      "p95_px": 0.125
    }
  ],
  "method": "The JPEG is 4:2:0 chroma-subsampled, so I decoded the raw Y channel (PIL draft('YCbCr')) and used it for full-resolution edges. Coverage f = (Y - Y_bg)/(Y_fg - Y_bg); flat lumas are white 255, red 85, green 102, blue 76. Edge points come from coverage integration per the convention: along a row (steep edges) or a column (shallow edges), edge = window end minus the summed f in a 6 px window. Tiles: one sub-pixel value per side (std <= 0.002 px; free-fit slope ~0). F and A: polygon fit. Points go to their nearest edge (vertices +-2.5 px excluded), each edge gets a total-least-squares line (horizontal/vertical edges constrained after a free fit showed <= 0.016 deg tilt), and corners are line intersections. Edge rms: F 0.001-0.019 px, A 0.005-0.039 px. O: least-squares fits on outer (595 pts) and inner (403 pts) edge points. Rms by model, outer/inner: circle 8.07/1.06 px; axis-aligned ellipse 0.99/0.53; rotated ellipse 0.94/0.53 (theta -1.1 deg); rotated superellipse 0.148/0.084 (n=2.18/2.14); closed G1 4-segment cubic Bezier (orthogonal distance) 0.027/0.027. The Bezier was kept because the best ellipse fails the target (IoU 0.955, mean 0.66, p95 1.38). Glyph test: Helvetica Bold, Helvetica, Helvetica Neue Bold/Medium, Arial Bold and Arial, each with free x-scale, y-scale and offset. Best rms was F 1.49 px and A 1.50 px; Helvetica Bold gave F 3.33 / A 4.28 px and Arial Bold F 3.07 / A 3.22 px. Every glyph is far worse than the fitted polygons (<= 0.04 px), so the polygons are used. Corner check: compared measured and predicted box coverage summed in a 9x9 window at each vertex. No fillets found: tile corners show excess coverage, and any F/A rounding is < ~0.7 px, below what the raster can resolve. Metric as specified: resvg 8x vs raster 8x Lanczos, thresholded at the RGB-projection midpoint. For tiles the coloured component has holes filled; letters use the largest white component (drops the paw parts); boundary distance comes from the EDT of the raster boundary. A luma-threshold variant agrees (e.g. tile-blue 0.026 mean). Headless Chrome render matches resvg (mean abs diff 0.2/255).",
  "notes": "Fragment is at the fragment_path, viewBox 0 0 910 1024. It uses absolute coordinates with 2 decimals, fill / fill-rule attributes only, and no CSS, transforms, strokes or rasters. Group order: tile-red, tile-green, tile-blue, letter-f, letter-o, letter-a. Letters must be drawn after the tiles.\n\nColours: the raster's flat tile colours equal the fixed colours exactly (203,35,34 / 1,173,1 / 38,63,241). Wordmark colour is #000000: median of core pixels 0,0,0, mean 0.84 from JPEG noise.\n\nO hole: the inner Bezier subpath IS the green-disc boundary. The hole is transparent, so tile-green shows through and the paw mark can be layered inside it. If the mark part draws its own green disc, it should reuse the same inner subpath:\nM500.39 287.94C501.66 321.72 480.42 354.72 433.43 354.11C393.86 353.60 374.30 327.83 370.20 303.50C364.20 267.89 384.73 227.15 437.34 228.30C479.02 229.20 499.28 258.68 500.39 287.94Z\n- The O overshoots: top 208.18, bottom 374.14, against cap 210.47-210.49 and baseline 371.85-371.86 for F and A.\n- The inner and outer O are not concentric (centres differ by ~0.1 px), and only the outer one is rotated (about -1.1 deg).\n\nA counter: kept as measured, not a triangle. The upper sides are steeper (68.98 / 110.08 deg) than the lower sides (65.26 / 115.01 deg), with kinks at y\u2248260.1 (right) and 261.0 (left). The lower counter sides are not collinear with the leg inner edges below the crossbar (offset ~2.6 px).\n- A plain triangle counter scores worse: mean 0.092, p95 0.40, max 1.12.\n- The outer legs are mirror-symmetric (64.81 / 115.19 deg). The inner edges are asymmetric by 0.4-1 deg; kept as measured.\n\nWhere max deviation sits: all at sharp corners in the thresholded reference, which blur and JPEG round off.\n- Tile corners: 0.45-0.53 px.\n- F corners: 0.53 px.\n- A foot corners: 0.56-0.62 px.\n- A counter apex (41 deg tip): 0.76 px.\n- Coverage sums suggest the counter tip may be ~0.3 px higher/blunter. That is within blur, so I left it at the line intersection.\n\np95 = 0.125 is exactly one 8x sub-pixel (the metric's resolution).\n\nEdge convention: edges follow the coverage-sum rule as specified. The 0.5-crossing positions differ by up to 0.11 px where the JPEG edge profile is lopsided (e.g. red tile right edge 301.35 vs 301.24). That explains why mean deviation against the threshold metric is 0.03-0.06 rather than 0.\n\nPaw mark and wordmark were not touched. No git or GitHub actions.\n\nScripts and diagnostics are in /private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/tl:\n- build.py regenerates the fragment and the metrics.\n- Other scripts: lib.py, tiles.py, letters.py, counter5.py, ofit.py, superell.py, ofit_bez.py, glyphfit.py, corners.py.\n- Fit results are saved as JSON there; per-part deviation maps are diag_*_rgb.png."
}
```

## build:mark
```json
{
  "fragment_path": "/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/parts/mark.svg",
  "groups": [
    {
      "id": "mark",
      "description": "Top-level group for the paw-and-hands mark inside the O. Paint order: disc, then paw, then hands. Absolute raster coordinates, no transforms."
    },
    {
      "id": "mark-disc",
      "description": "Green #01AD01 disc in the O's hole, fitted to the green/white boundary. It is NOT a circle or an ellipse. It is a squircle made of 4 cubic Beziers, with on-curve points at the extremes R(500.44,291.29), T(435.02,228.25), L(369.20,291.29), B(435.02,354.12) and axis-parallel tangents there. Handle length at L/R = 0.5164*b (vertical); at T/B = 0.6681*a (horizontal). Centre (435.024,291.287); a_right 65.42, a_left 65.82, b_top 63.04, b_bottom 62.83."
    },
    {
      "id": "mark-paw",
      "description": "White #FFFFFF paw: mark-paw-toe-1..4 (upper-left, upper-right, lower-left, lower-right) are exact rotated ellipses written as 4 quarter-arc A commands, with no transform. Toe 1: c(420.690,263.783) a18.626 b12.905 rot 74.92deg. Toe 2: c(453.164,263.491) a18.720 b12.844 rot -68.93deg. Toe 3: c(400.875,287.885) a16.839 b12.089 rot 44.55deg. Toe 4: c(471.859,287.450) a16.847 b12.079 rot -57.10deg. mark-paw-pad is a traced path with 4 sharp corners: apex and 3 at the bottom."
    },
    {
      "id": "mark-hands",
      "description": "White #FFFFFF cupped hands, one connected shape (mark-hands-shape). Traced path with sharp corners at the top centre notch, the bottom centre point and the two obtuse bends on the bottom edge. Fingertips, thumb tips and the ends of the thumb/finger gaps are round."
    }
  ],
  "metrics": [
    {
      "id": "mark-disc",
      "iou": 0.9987,
      "mean_px": 0.035,
      "p95_px": 0.125
    },
    {
      "id": "mark-paw",
      "iou": 0.9942,
      "mean_px": 0.034,
      "p95_px": 0.125
    },
    {
      "id": "mark-hands",
      "iou": 0.9918,
      "mean_px": 0.034,
      "p95_px": 0.125
    },
    {
      "id": "mark-paw-toe-1",
      "iou": 0.9947,
      "mean_px": 0.032,
      "p95_px": 0.125
    },
    {
      "id": "mark-paw-toe-2",
      "iou": 0.9935,
      "mean_px": 0.038,
      "p95_px": 0.125
    },
    {
      "id": "mark-paw-toe-3",
      "iou": 0.995,
      "mean_px": 0.028,
      "p95_px": 0.125
    },
    {
      "id": "mark-paw-toe-4",
      "iou": 0.9939,
      "mean_px": 0.033,
      "p95_px": 0.125
    },
    {
      "id": "mark-paw-pad",
      "iou": 0.994,
      "mean_px": 0.039,
      "p95_px": 0.125
    }
  ],
  "method": "Metric as specified. Raster crop x355-516, y212-370 upscaled 8x with Lanczos, then projected onto the line between the measured green (2,173,2) and white (255,255,255) and thresholded at 0.5. SVG rendered with resvg_py 0.5.0 at 8x on the same grid. Deviation = distance transform to the raster boundary, in source px.\n\nDisc: about 4100 sub-pixel 0.5-crossings on the hole boundary. A circle (mean 0.87, p95 2.0) and an ellipse (mean 0.45, p95 0.79) both miss the target, and the ellipse residual shows a clear 4-fold pattern. So I fitted a 4-cubic squircle by geometric least squares: residual rms 0.053, p95 0.10, max 0.18 px.\n\nToes: Fitzgibbon fit refined by exact geometric least squares. Residual rms 0.045-0.056 px, max 0.14 px, so exact ellipses are used.\n\nPad and hands: Gaussian pre-smooth of the 8x field (sigma 0.5 source px), threshold 0.5, then potracer 0.0.4 with turdsize 64, alphamax 1.0, opttolerance 1.0 (8x px = 0.125 source px) and turnpolicy minority. Output divided by 8 and offset back to source coordinates. The smoothing removes JPEG wobble: inflections with curvature radius under 10 px drop from 64 to 7 on the hands and from 10 to 0 on the pad. Total turning falls to the level of the clean shape, and the shapes do not shift (signed offset under 0.01 px, centroid shift under 0.04 px).\n\nSharp corners: potrace corners do not land on the real ones, so I found them myself. For each candidate tip, I intersected the arm tangents and compared how far the raster's 0.5-contour retreats from that point with a simulated anti-aliased sharp wedge (resvg 1x, then Lanczos 8x). Where retreat matched (pad 0.54/0.46, 0.40/0.41, 0.31/0.39, apex 0.18/0.20; hands notch 0.45/0.49, bottom point 0.23/0.31), I put a true corner at the tangent intersection, joined with G1 arc-like cubics 2 px on each side so no new inflections appear. Fingertips, thumb tips and the ends of the thumb/finger gaps retreat 1.0-1.9 px against 0.34-0.59 for a sharp wedge, so they are genuinely round and stay round.\n\nChecked against headless Chrome: largest difference against resvg is 67/255, on anti-aliased edge pixels only, so the geometry agrees.",
  "notes": "1. ASSEMBLER: the O's inner hole is a squircle, not an ellipse. Build the O ring's inner contour from exactly the mark-disc path data, copied verbatim, and paint the disc above the ring so the shared edge never seams. If the O-ring agent fits its own ellipse, that edge will be off by up to 0.8 px at the diagonals.\n2. The design is not mirror-symmetric, so I did not symmetrise anything. Toe rotations are 74.92 vs -68.93 deg and 44.55 vs -57.10 deg; the vertical axis sits at about x 437.1 for the upper toes and 435.9 for the lower ones.\n3. The task listed fingertips as sharp corners, but the raster shows them round, so they were kept round. Sharp corners used: pad (436.02,278.48), (413.76,308.13), (458.29,307.22), (437.27,316.53); hands (436.95,321.96), (436.84,338.47), (410.33,334.10), (463.58,333.72). The last two are obtuse (about 152 deg); at that angle sharp and tightly rounded look the same, so they are a judgement call either way, with deviation under 0.05 px.\n4. Green gaps are kept as narrow as in the raster: pad-hands 1.75 px, lower-left toe to pad 1.62, upper toes to pad 2.2-2.4, toe to toe 4-5.6. Green inside the disc in the full render vs the raster: IoU 0.9943.\n5. The p95 of 0.125 for every part is the 8x metric's own resolution (one 8x pixel), not the fit error. The geometric fits are finer: disc rms 0.053 px, toes about 0.05 px. Largest deviations are 0.45 px at the pad's two bottom corners and 0.375 px at the hands' top notch: there a sharp corner meets the raster's blurred tip, which a simulated sharp wedge reproduces, so this is not JPEG ringing. No JPEG ringing problems were found.\n6. Colours: fills use the specified #01AD01 and #FFFFFF; the raster's green measures (2,173,2), about #02AD02. Wordmark colour from the raster: #000000 (median of the core pixels in x77-800, y416-470 is 0,0,0; mean 0.8).\n7. Format: fill is set on every path. No CSS, transforms, strokes or rasters. The root svg has viewBox 0 0 910 1024 with width 910 and height 1024. Coordinates and arc parameters use 2 decimals.\n8. Reproduce from /private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/mark/: build_ph.py 2.0 (pad and hands; needs au.npy and ph_ds.pkl, made by the earlier steps in common.py and trace.py), then build_mark.py, then eval_mark.py. Visual check: /private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/mark/side_by_side.png. Nothing outside the work dir was touched; no git or GitHub."
}
```

## build:wordmark
```json
{
  "fragment_path": "/private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/parts/wordmark.svg",
  "groups": [
    {
      "id": "wordmark",
      "description": "Black (#000000) wordmark 'Friends of Animals'. 16 <path> glyph outlines, id wm-<index>-<char> (wm-0-F ... wm-15-s), fill attribute on each path, nonzero winding (checked: evenodd renders the same, so no self-overlaps). Absolute raster-px coords, 2 decimals, no transforms/CSS/strokes. Coordinate bbox x 76.40-801.08, y 415.96-470.92. viewBox 0 0 910 1024. File size 6.3 KB."
    }
  ],
  "metrics": [
    {
      "id": "wordmark",
      "iou": 0.9765,
      "mean_px": 0.0805,
      "p95_px": 0.25
    },
    {
      "id": "wm-0-F",
      "iou": 0.975,
      "mean_px": 0.094,
      "p95_px": 0.25
    },
    {
      "id": "wm-1-r",
      "iou": 0.963,
      "mean_px": 0.129,
      "p95_px": 0.38
    },
    {
      "id": "wm-2-i",
      "iou": 0.981,
      "mean_px": 0.063,
      "p95_px": 0.12
    },
    {
      "id": "wm-3-e",
      "iou": 0.976,
      "mean_px": 0.071,
      "p95_px": 0.12
    },
    {
      "id": "wm-4-n",
      "iou": 0.974,
      "mean_px": 0.099,
      "p95_px": 0.25
    },
    {
      "id": "wm-5-d",
      "iou": 0.976,
      "mean_px": 0.089,
      "p95_px": 0.38
    },
    {
      "id": "wm-6-s",
      "iou": 0.981,
      "mean_px": 0.053,
      "p95_px": 0.12
    },
    {
      "id": "wm-7-o",
      "iou": 0.986,
      "mean_px": 0.044,
      "p95_px": 0.12
    },
    {
      "id": "wm-8-f",
      "iou": 0.977,
      "mean_px": 0.068,
      "p95_px": 0.12
    },
    {
      "id": "wm-9-A",
      "iou": 0.988,
      "mean_px": 0.049,
      "p95_px": 0.12
    },
    {
      "id": "wm-10-n",
      "iou": 0.974,
      "mean_px": 0.099,
      "p95_px": 0.25
    },
    {
      "id": "wm-11-i",
      "iou": 0.955,
      "mean_px": 0.154,
      "p95_px": 0.28
    },
    {
      "id": "wm-12-m",
      "iou": 0.967,
      "mean_px": 0.123,
      "p95_px": 0.25
    },
    {
      "id": "wm-13-a",
      "iou": 0.98,
      "mean_px": 0.058,
      "p95_px": 0.18
    },
    {
      "id": "wm-14-l",
      "iou": 0.97,
      "mean_px": 0.12,
      "p95_px": 0.12
    },
    {
      "id": "wm-15-s",
      "iou": 0.981,
      "mean_px": 0.053,
      "p95_px": 0.12
    }
  ],
  "method": "Followed the metric definition: resvg render at 8x, raster Lanczos-8x thresholded at 127.3 (midpoint of white 254.66 and black 0), distance transform. Whole-word numbers are from the written file, rendered over window x68-810, y408-478. Per-glyph numbers use each glyph's own column band (+/-1.5 px) with its neighbours drawn.\nSteps:\n(1) Coverage target = (254.66-L)/254.66. Glyph boxes come from anti-aliased edge profiles.\n(2) Loaded the 16 glyphs with a fontTools DecomposingRecordingPen from every candidate face: Helvetica.ttc (Regular, Bold, Light); HelveticaNeue.ttc (Regular, Medium, Bold, Light, Thin, UltraLight, Condensed Bold, Condensed Black); Arial, Arial Bold, Arial Narrow, Arial Narrow Bold, Arial Black; TeX Gyre Heros Regular/Bold (CTAN); Nimbus Sans Regular/Bold (URW base35, GitHub). I also wrote a reader for /System/Library/Fonts/HelveLTMM, a Helvetica LT multiple-master font with Weight x Width axes, and scored instances at weight 0.3 and 0.45, width 1.\n(3) Fitted each face in stages by minimising coverage SSE with Powell. Renders are supersampled 4-8x because tiny-skia anti-aliasing is quantised to 1/4 output px.\n- A: one global x-scale, y-scale and baseline, plus a per-glyph x position.\n- E: A plus global outline emboldening (separate x/y amounts, FreeType-style).\n- W: E plus a global piecewise vertical scale for lowercase (one factor below x-height, one above); caps keep their own linear scale.\n- B: per glyph, free x-position, x-scale, baseline, the two vertical factors and emboldening.\n(4) Stage R, on the best proprietary face (Helvetica Neue) and both clones: node-level refinement of the stage-B outlines against the raster coverage (L-BFGS, central differences at 8x).\n- Each on-curve node moves with its handles. Handles only change length along their own direction, so smooth joins stay smooth and extrema stay axis-aligned.\n- Nodes joined by horizontal or vertical lines are tied, so straight stems and bars stay straight.\n- Weak quadratic regulariser on node movement. 4 sweeps for Heros (converged).\n(5) Collapsed one inherited 0.2 px self-overlap: a micro-segment from TeX Gyre Heros at the corner of the 'e' eye and crossbar. Wrote paths at 2 decimals and re-measured from the file.\n(6) Cross-check in headless Chrome at 4x: mean |coverage difference| vs resvg 0.001, 4x mask IoU 0.994.",
  "notes": "FACE AND LICENCE\n- Outlines come from TeX Gyre Heros Regular: GUST Font License = LaTeX Project Public License (LPPL) 1.3c; it asks, but does not require, that derived works carry a new name.\n- Shapes are a modified derivative (per-glyph scale, emboldening, node refinement), not verbatim font outlines. For the public repo, add a credit: \"wordmark outlines derived from TeX Gyre Heros (GUST e-foundry), GUST Font License\".\n- Nimbus Sans would score the same, but its licence is AGPL-3.0; the exception only covers embedding in PostScript/PDF documents. So Heros was chosen over Nimbus.\n- No proprietary outlines are in the fragment.\n\nWORDMARK COLOUR\n- Measured core = (0,0,0); eroded-core mean 0.8. Use #000000.\n\nIDENTIFICATION\n- The original is not a scaled cut of any available face. It looks like a true extended grotesque in the Helvetica style.\n- Its x-height/cap ratio is 0.668 (x-height about 35.7 px, cap about 53.5 px, baseline about 470.0). Every Helvetica, Neue, Arial, Heros and Nimbus cut is 0.72-0.74, and no scaling can change that ratio.\n- Stage W needs a lowercase/cap vertical scale of 0.89-0.90 for every face.\n- Terminals (f, r, s, a spur) are longer than in Helvetica.\n- Best pure horizontal scaling (stage A): Helvetica Neue Medium at about 123% width (IoU 0.810, mean 0.729, p95 2.63), with no emboldening needed. Regular cuts need x-scale/y-scale about 1.28-1.38 plus about 0.8-1.0 px/side vertical-stem emboldening.\n- Helvetica LT MM widest instance is only normal width; nothing on this Mac is extended.\n\nCANDIDATE SCORES\nFormat: stage A IoU/mean/p95 ; stage B IoU/mean/p95.\n- neue: .760/.848/2.35 ; .947/.190/0.53 (best proprietary)\n- neue-light: .591/1.474/3.50 ; .946/.200/0.52\n- helv-light: .584/1.509/3.50 ; .944/.206/0.62\n- helv: .764/.844/2.25 ; .943/.207/0.62\n- nimbus: .753/.884/2.56 ; .940/.216/0.62\n- arial-narrow: .769/.837/2.58 ; .940/.217/0.75\n- arial: .769/.832/2.62 ; .940/.218/0.75\n- neue-medium: .810/.729/2.62 ; .933/.225/0.67\n- heros: .752/.887/2.50 ; .935/.232/0.79\n- neue-thin: .397/1.868/4.14 ; .935/.238/0.75\n- neue-ultralight: .215/1.969/4.25 ; .927/.267/0.84\n- neue-bold: .731/1.194/3.00 ; .919/.281/1.12\n- arial-narrow-bold: .735/1.166/3.12 ; .918/.288/1.08\n- arial-bold: .736/1.159/3.12 ; .917/.292/0.98\n- HelveLTMM w0.3: .754/.909/2.88 ; .915/.308/1.00\n- HelveLTMM w0.45: .717/1.205/3.36 ; .907/.312/1.00\n- helv-bold: .712/1.272/3.62 ; .906/.324/1.12\n- nimbus-bold: .717/1.251/3.25 ; .908/.327/1.12\n- heros-bold: .714/1.298/3.20 ; .901/.344/1.25\n- arial-black: .625/1.923/5.29 ; .878/.428/1.68\n- neue-cond-bold: .663/1.483/4.62 ; .884/.431/1.55\n- neue-cond-black: .578/2.075/6.06 ; .849/.537/2.13\nStage R (deliverable stage):\n- Helvetica Neue: .9777/.076/0.25\n- Nimbus: .9759/.083/0.25\n- Heros: .9765/.080/0.25\nBoth clones are within 0.05 px of the best proprietary face at both stage B and stage R, so the clone rule applies.\nTwo older MM result files are stale (1x renders, not reported): work/fit_results_mm0.61.json and work/fit_results_mm0.450.8.json.\n\nTARGETS\n- mean (0.08) and p95 (0.25) are met.\n- IoU 0.9765 misses 0.98. This is a thin-stroke limit, not a fitting fault: ink area/perimeter is about 3.2 px, so IoU is roughly 1 - mean_abs_error/3.2. Reaching 0.98 needs about 0.065 px mean error, which means following JPEG noise.\n- The refinement plateaued at 0.9765. A uniform +/-0.03 px offset changes IoU by less than 0.0003.\n- Bicubic or bilinear instead of Lanczos changes the reference mask by only IoU 0.997, so the reference itself is not the limit.\n\nJPEG HOTSPOTS\n- The largest deviations, 1.1-1.5 px, sit at the acute arch/stem crotches of n, n and m (x about 237.5, 565.3, 631.9; y about 439). JPEG blur fills these narrow notches in the raster, while the outline keeps the sharp crotch a vector original would have.\n- Corners of the i dots and the F are slightly rounded by blur in the raster.\n\nFILES (all under /private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/logo/work/)\n- Fallbacks using pure font geometry without node refinement, stage B: renders/wordmark_heros_B.svg (IoU .935/mean .234/p95 .79) and renders/wordmark_nimbus_B.svg.\n- Final refined contours: refined_heros_final.json.\n- Final overlays: renders/final_overlay_left.png and renders/final_overlay_right.png.\n- Scripts: scripts/wm_*.py (wmlib = render/metric, wm_fit = stages, wm_refine(_par) = stage R, wm_final = assembly).\n- Downloaded fonts and licence texts: fonts/heros and fonts/nimbus.\n- Decrypted HelveLTMM data and the Helvetica Neue stage-B SVG were deleted. refined_neue.json still holds Helvetica-Neue-derived outlines: scratch only, do not ship.\n- No git, GitHub or repo files touched."
}
```
