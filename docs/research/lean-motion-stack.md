# Lean motion stack for scroll and page animation

Research for [#4](https://github.com/SiddharthMuramkar/foa-platform/issues/4) (map [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2), unblocks [#9](https://github.com/SiddharthMuramkar/foa-platform/issues/9)). Date: 2026-11-16. Constraints: SPEC §3.1 (Next.js 16, React 19, Tailwind v4), NFR-01 (170 KB gzipped route JS, INP < 200 ms, CLS < 0.1), NFR-11 (last 2 versions of Chrome, Safari with iOS ≥ 16, Firefox, Edge, Samsung Internet), NFR-A11Y (reduced motion respected).

## Answer

- Go CSS-first with **no animation library in the base bundle**.
- Logo dock: CSS scroll-driven animation (runs off the main thread). It is Baseline "newly available" since 27 Oct 2026 (Chrome 115, Safari 26, Firefox 159).
- Page transitions: React 19.3 `<ViewTransition>` through Next.js 16.4, which needs no config. Micro-interactions: CSS transitions plus `@starting-style`.
- Unsupported browsers (mostly iOS 16–18 Safari; in Apple's June 2026 data 14% of iPhones were on iOS 18 and 7% on older versions, some of them below the iOS 16 floor): the logo gets a CSS transition toggled by an IntersectionObserver, and pages swap instantly.
- Motion (MIT, `LazyMotion` + `m` is about 5–6 KB to start, if the bundler keeps the feature bundle in an async chunk) is the fallback option only if prototype #9 needs springs, gestures or layout animation. GSAP is rejected: about 45 KB gzipped, runs on the main thread, and uses a proprietary Webflow licence.

## Findings

### 1. CSS-first

Current browser versions (caniuse data updated 2026-11-11): Chrome 157, Edge 156, Firefox 160, Safari 27.1–27.2, iOS Safari 26.6–27.0, Samsung Internet 30–31. The **last 2 versions of every NFR-11 browser support every feature below that FOA uses**. The exception is cross-document View Transitions, which Firefox has not shipped and FOA does not need. The only real gap is the explicit **iOS ≥ 16** floor.

| Feature | Chrome/Edge | Firefox | Safari / iOS | Samsung | Gap against NFR-11 | What unsupported browsers show |
|---|---|---|---|---|---|---|
| Scroll-driven animations (`animation-timeline: scroll()/view()`) | 115 | **159 (27 Oct 2026)** | 26 | 23 | iOS 16–18.x | Nothing animates; the element keeps its non-animated style. Gate with `@supports (animation-timeline: scroll())` |
| Same-document View Transitions | 111 | 144 | 18.0 | 22 (MDN BCD; caniuse says 23) | iOS 16–17.x | DOM updates instantly. Next.js docs: "your application works normally; the transitions do not animate" |
| `view-transition-class` (React's custom per-type animations use it) | 125 | 144 | 18.2 | 27 | iOS 16–18.1 | Class-targeted CSS is ignored |
| Cross-document View Transitions (`@view-transition`) | 126 | **none** (Nightly preview only) | 18.2 | 28 per MDN BCD; caniuse lists no support | Firefox (all), iOS 16–18.1 | Normal navigation. App Router soft navigations do not use it, so FOA does not need it |
| `@starting-style` | 117 | 129 | 17.5 | 24 | iOS 16–17.4 | The element appears in its final state with no entry transition |

- **React / Next.js**: `<ViewTransition>` and `addTransitionType` are **stable in React 19.3** (released 2026-09-09). Next.js 16.4 docs: "View transitions work in the App Router with no configuration". (The 16.3 docs already said this, through the App Router's React canary; 16.4 is the first to point at stable React 19.3.) `next/link` has had a `transitionTypes` prop since 16.2; it drives direction-aware enter and exit animations. Only Transition updates animate (`startTransition`, `<Suspense>` reveals, `useDeferredValue`). Browser back and forward (popstate) navigations carry no transition type, and React skips their animations.
- **Scroll-driven animation details**: declare `animation-timeline` *after* the `animation` shorthand (MDN timelines guide). Set `animation-duration: 1ms` for consistent behaviour in Firefox (same guide). An element with `overflow: hidden` is still a scroll container, so `scroll(nearest)` can bind to the wrong element; `overflow: clip` does not create one (MDN `overflow` reference). Firefox's stable Web Platform Test (WPT) pass rate for this feature is 64% (Safari 82%, Chrome 88%; webstatus.dev), so expect early bugs in Firefox. Firefox's experimental build scores 94%, so fixes are on the way.
- **Tailwind v4**: `motion-safe:` / `motion-reduce:` variants and a `starting:` variant (which wraps `@starting-style`). Note that Tailwind v4 itself **targets Safari 16.4+**.
- **Real share of the gap**: Apple App Store data (7 Jun 2026) puts iOS 26 on 79% of all iPhones. Per AppleInsider's reading of the same data, 14% were on iOS 18 and 7% on older versions. In practice, about 21% of iPhones then had no scroll-driven animations and about 7% had no View Transitions. Part of that 7% is on iOS 15 or older, below the NFR-11 floor, so the in-scope iOS 16–18 share was between 14% and 21%. iOS 27 has shipped since then, so the share is lower now but not zero.

### 2. Libraries

**Bundle cost**, measured here. Method: esbuild 0.25 minified ESM, `NODE_ENV=production`, `gzip -9`, reported as the increase over a React 19.3.1 + `react-dom/client` baseline of **69.1 KB**. These are approximate: Turbopack output will differ by a few KB. The verification pass re-ran the same packages with its own entry files (baseline 67.5 KB); its results are in the last column.

| Setup | Added gzipped JS | Re-measured |
|---|---|---|
| Motion 14.14 `motion.div` (full component) | +47.7 KB (vendor: ~43 KB, "impossible to tree shake smaller") | +50.4 KB |
| `LazyMotion` + `m`, features loaded async | **+5.1 KB initial** (vendor: ~5 KB); `domAnimation` then loads later (about +27 KB) | +5.9 KB with no feature bundle referenced. With esbuild code splitting, the async `features.js` import was hoisted into a shared chunk that loads up front (+34.7 KB initial), so check the split in the real build |
| `LazyMotion` + `m` + `domAnimation` loaded sync (hover/tap/exit) | +31.8 KB (vendor: +18 KB for `domAnimation`, +28 KB for `domMax`) | +34.1 KB |
| Logo dock in Motion: `m` + `useScroll` + `useTransform` + `useReducedMotion`, no features | +13.0 KB | +14.1 KB |
| `useScroll` alone | +5.3 KB | not re-measured |
| Motion vanilla `animate` + `scroll` (no React) | 29.2 KB; `motion/mini` `animate` = 3.3 KB | not re-measured |
| GSAP 3.15.1 core | 27.8 KB | 27.8 KB |
| GSAP core + ScrollTrigger | 45.3 KB | 45.4 KB |
| GSAP + ScrollTrigger + `@gsap/react` `useGSAP` | +45.7 KB | +46.0 KB |
| CSS-only approach (scroll-driven animations, View Transitions, `@starting-style`) | 0 KB (plus about 1 KB if an IntersectionObserver fallback island is added) | — |

**React 19 / Server Components**

- Motion: peer `react ^18 || ^19`. It is client-only: use `"use client"`, or `motion/react-client` when importing into a Server Component. `<LazyMotion strict>` throws if a full `motion` component sneaks in.
- GSAP: `@gsap/react` 2.1.2 has peer `react >=17`. `useGSAP` must live in a `"use client"` file. It uses an isomorphic layout effect and cleans up via `gsap.context()`.

**Licence**

- Motion: **MIT** (npm `license` field, 14.14.0).
- GSAP: Webflow's **"Standard 'no charge' License"** (effective 30 Apr 2025). It is free for commercial use, including all plugins, but it is **not open source**:
  - It forbids use in visual no-code animation builders that compete with Webflow.
  - Webflow "may terminate this GSAP License … in its discretion if you fail to comply".
  - Webflow can amend the terms (continuing to use newer versions means accepting them).
  - FOA's use would be permitted, but it is a proprietary dependency in a public repo.

### 3. Cost and accessibility

**Main-thread cost**

- *CSS scroll-driven animations*: run off the main thread for compositor-friendly properties (`transform`, `opacity`, `filter`, `clip-path`). Chrome's case study shows a CSS progress bar is unaffected by heavy main-thread JS, while the scroll-listener version janks.
- *View Transitions*: snapshot pseudo-elements are animated by the compositor. However, a document-scoped transition **puts an overlay over the page that blocks pointer events** and obscures `position: fixed` headers and popovers until it ends (Chrome docs). Keep transitions short (≤ 300 ms). Use `::view-transition { pointer-events: none }` when only parts of the page move. Even then, named participants such as an anchored header are not hit-tested until the transition ends (Next.js guide). Element-scoped transitions (`element.startViewTransition()`) avoid the overlay, but they are Chromium-only (Chrome 147+) and should not be relied on.
- *`@starting-style`*: plain CSS transitions, no JS.
- *Motion*: a hybrid engine using the Web Animations API (WAAPI).
  - `useScroll` uses the native `ScrollTimeline` where available, so it is hardware-accelerated in Chrome, Safari 26+ and Firefox 159+ when progress values feed `opacity`, `transform`, `filter` or `clip-path`. Elsewhere it falls back to JS scroll handling on the main thread.
  - Motion's own performance audit notes that Safari does not compositor-accelerate `linear()` easing, so its default springs run on the main thread there.
  - Hydration adds main-thread work in proportion to the JS shipped.
- *GSAP*: every tween runs in `gsap.ticker` on `requestAnimationFrame` on the main thread. ScrollTrigger reads scroll position on the main thread and has no `ScrollTimeline` path. `normalizeScroll` moves scrolling itself onto the JS thread.
- *INP / CLS*: scrolling is not an INP interaction, but taps and clicks are, and long tasks during hydration hurt INP. Changes to `transform` do not count as layout shifts. The dock must therefore animate `transform` only, inside a header whose height is reserved.

**`prefers-reduced-motion`**

| Approach | Built-in handling | What FOA must do |
|---|---|---|
| CSS (scroll-driven animations, transitions, `@starting-style`) | none | Wrap motion in `@media (prefers-reduced-motion: no-preference)` / Tailwind `motion-safe:` |
| View Transitions (React/Next.js) | **none**: "React doesn't automatically disable animations" | Global CSS that sets `::view-transition-*(*)` `animation-duration: 0s` under `reduce` (snippet in the Next.js guide) |
| Motion | `MotionConfig reducedMotion="user"` turns off transform and layout animations but keeps opacity and colour. The **default is `"never"`** | Set `"user"` at the root. Scroll-linked style values are **not** covered: gate them with `useReducedMotion()` (Motion's own parallax example does this) |
| GSAP | none | Add a `gsap.matchMedia()` condition `"(prefers-reduced-motion: reduce)"` around every animation |

WCAG context: 2.3.3 Animation from Interactions is AAA. 2.2.2 Pause, Stop, Hide is level A and applies to any auto-moving content longer than 5 s, such as carousels or looping hero motion. NFR-A11Y already requires that reduced motion is respected.

## Recommendation

1. **No animation dependency by default.** CSS plus React/Next.js built-ins cover the need. This fits "every dependency must justify itself" and leaves the 170 KB budget to the product.
2. **Logo scroll interaction (input to #9)**
   - Use a CSS scroll-driven animation on a wrapper around the unchanged logo SVG. Animate `transform` (translate and scale) only; never width, height or colour.

     ```css
     @media (prefers-reduced-motion: no-preference) {
       @supports (animation-timeline: scroll()) {
         .hero-logo { animation: logo-dock 1ms linear both; animation-timeline: scroll(root block); animation-range: 0 40vh; }
       }
     }
     @keyframes logo-dock { to { transform: translate(var(--dock-x), var(--dock-y)) scale(var(--dock-scale)); } }
     ```

   - **Fallback** (no scroll-driven animations: iOS 16–18, Firefox ≤ 158): a tiny client island with an IntersectionObserver sentinel toggles `data-docked`. A 200 ms CSS transition then moves the logo between the hero and docked states. The move is time-based, not tied to scroll position, and needs no library.
   - **Reduced motion**: no translate or scale. Show the static hero logo plus the static header logo (an opacity cross-fade at most).
   - Reserve the header height so CLS stays 0. If page transitions are used, give the header its own `view-transition-name` so it is not snapshotted with the page. Header links cannot be clicked while a transition runs, which is another reason to keep transitions short.
   - Paw hover/tap feedback: CSS `:hover` / `:active` transform under `motion-safe:`.
3. **Micro-interactions**
   - CSS transitions on `transform` / `opacity`, 150–250 ms, via Tailwind `motion-safe:`.
   - Use `starting:` (`@starting-style`) for popover, dialog and toast entry. The fallback is instant appearance.
   - Keep dashboards calm: focus, hover and press feedback only, with no route slides.
4. **Page transitions**
   - On public pages only: `<ViewTransition>` crossfades or short directional slides (`Link transitionTypes`), with `default="none"` and the reduced-motion CSS.
   - Pin Next.js ≥ 16.4 / React ≥ 19.3. The fallback is an instant swap. Browser back and forward also swap instantly, because popstate navigations do not animate.
5. **Escalation path**: add **Motion** only if the #9 prototype shows CSS cannot deliver. Examples:
   - spring physics on tap, or drag;
   - layout or shared-element animation in browsers without View Transitions;
   - the product owner wants an identical scroll-linked dock on iOS < 26.

   If Motion is added: `LazyMotion strict` + `m` only, with async `domAnimation`, `MotionConfig reducedMotion="user"` plus `useReducedMotion` for scroll-linked values, and scoped to the client island that needs it. Expected cost: about 5–6 KB to start, about 13–14 KB for a `useScroll` dock, and about 27–28 KB loaded later. Check in the Turbopack build that `domAnimation` really lands in an async chunk. Never use the full `motion` component.
6. **Reject GSAP**: GSAP plus ScrollTrigger is about 45 KB, roughly 3× a Motion `useScroll` dock and 45 KB more than CSS. It does all its work on the main thread. Its licence is proprietary: Webflow can amend it and can terminate it for non-compliance.

## Open risks

- Firefox only shipped scroll-driven animations on 27 Oct 2026 (WPT 64%). The dock must be tested in Firefox 159/160.
- The iOS 16–18 fallback carries real traffic (14–21% of iPhones in June 2026). Playwright's WebKit is current WebKit, not iOS 16 Safari, so the fallback needs a check on a real device or BrowserStack.
- Tailwind v4 targets Safari 16.4+. NFR-11's "iOS ≥ 16" in practice means iOS 16.4; SPEC should say so.
- Budget headroom: React + ReactDOM alone is about 68–69 KB gzipped (40% of 170 KB), before the Next.js client runtime. Next.js 16 removed `First Load JS` from `next build` output, so NFR-01 needs Lighthouse CI or a `next analyze` budget check per route.
- Document-scoped View Transitions block input and cover fixed headers while they run, and Next.js warns that Safari "may behave differently". Keep transitions short and test them with the sticky header.
- The bundle numbers are esbuild approximations; re-measure in the real Next.js build. If Motion is added, check that the bundler does not hoist the async `domAnimation` import into the initial chunk. esbuild did, which raised initial JS from about 6 KB to about 35 KB.

## Sources

All accessed 2026-11-16 unless dated otherwise.

- Webstatus.dev (web-features Baseline data): [scroll-driven animations](https://webstatus.dev/features/scroll-driven-animations), [view transitions](https://webstatus.dev/features/view-transitions), [cross-document view transitions](https://webstatus.dev/features/cross-document-view-transitions), [view-transition-class](https://webstatus.dev/features/view-transition-class), [@starting-style](https://webstatus.dev/features/starting-style)
- caniuse: [animation-timeline: scroll()](https://caniuse.com/mdn-css_properties_animation-timeline_scroll), [View Transitions](https://caniuse.com/view-transitions), [cross-document View Transitions](https://caniuse.com/cross-document-view-transitions); browser versions from [caniuse data-2.0.json](https://github.com/Fyrd/caniuse/blob/main/fulldata-json/data-2.0.json) (updated 2026-11-11)
- MDN browser-compat-data 8.1.9 (2026-11-12) for the Samsung Internet column and `Element.startViewTransition()`; webstatus.dev API for WPT scores
- MDN: [Firefox 159 release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159) (released 2026-10-27); [Scroll-driven animation timelines](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timelines) (2026-10-07); [`overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow) (`hidden` vs `clip` scroll containers)
- React: [React 19.3 release post](https://react.dev/blog/2026/09/09/react-19-3) (2026-09-09); [`<ViewTransition>` reference](https://react.dev/reference/react/ViewTransition)
- Next.js v16.4.5 docs: [View Transitions guide](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/view-transitions.mdx); [Link `transitionTypes`](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/02-components/link.mdx); [v16 upgrade guide (First Load JS removed)](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/upgrading/version-16.mdx); [`next analyze` CLI](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/06-cli/next.mdx). Next.js v16.3.0 [View Transitions guide](https://github.com/vercel/next.js/blob/v16.3.0/docs/01-app/02-guides/view-transitions.mdx) (no-config via React canary)
- Motion docs: [LazyMotion](https://motion.dev/docs/react-lazy-motion), [reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size), [useScroll](https://motion.dev/docs/react-use-scroll), [scroll animations FAQ](https://motion.dev/docs/react-scroll-animations), [accessibility](https://motion.dev/docs/react-accessibility), [MotionConfig](https://motion.dev/docs/react-motion-config), [installation (Next.js)](https://motion.dev/docs/react-installation)
- Motion repo: [performance audit](https://github.com/motiondivision/motion/blob/v14.9.1/plans/PERFORMANCE_AUDIT.md) (v14.9.1)
- GSAP: [Standard "No Charge" License](https://gsap.com/standard-license) (effective 2025-04-30, modified 2025-05-30); [React & GSAP](https://gsap.com/resources/React/); [gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/); [gsap.ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker/); [ScrollTrigger.normalizeScroll()](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.normalizeScroll()/)
- npm registry (2026-11-16): motion 14.14.0 (MIT), gsap 3.15.1, @gsap/react 2.1.2, next 16.4.6, react 19.3.1
- Tailwind CSS docs: [compatibility](https://tailwindcss.com/docs/compatibility); [hover, focus and other states (`motion-safe`, `starting`)](https://tailwindcss.com/docs/hover-focus-and-other-states)
- Chrome for Developers: [scroll-driven animations performance case study](https://developer.chrome.com/blog/scroll-animation-performance-case-study); [group element transitions](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/group-element-transitions) (2026-08-27); [scoped component transitions](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/scoped-component-transitions) (2026-10-26)
- web.dev: [INP](https://web.dev/articles/inp) (scroll and hover are excluded); [Optimize CLS](https://web.dev/articles/optimize-cls) (`transform` animations do not count toward CLS; animating `top`/`left` does)
- Apple: [App Store iOS usage](https://developer.apple.com/support/app-store) (measured 2026-06-07); breakdown via [AppleInsider](https://appleinsider.com/articles/26/06/10/fewer-iphone-users-are-updating-to-ios-26-than-they-did-with-ios-18) (2026-06-10)
- W3C: [WCAG 2.2 Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); [WCAG 2.2 Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- Bundle measurement: local esbuild 0.25.0 build of the packages above (method in §2), re-run independently during verification

## Verification (2026-11-16)

An adversarial pass checked 54 claims against primary sources (webstatus.dev, MDN BCD, caniuse data, MDN, react.dev, Next.js docs at v16.4.5, motion.dev, gsap.com licence and docs, the npm registry, web.dev, W3C and Apple), and re-ran the bundle measurement. It made 9 corrections:

- Cross-document View Transitions are the exception to "the last 2 versions support everything".
- The Samsung Internet versions were filled in, and the BCD and caniuse disagreement on cross-document View Transitions is noted.
- The current iOS Safari versions were corrected.
- Chrome's WPT score is 88%, not 89%.
- The iOS 16–18 share is 14–21%, not 21%.
- The `overflow: clip` advice is now cited to MDN's `overflow` reference.
- The `LazyMotion` starting cost is now 5–6 KB, with the async-chunk caveat.
- The GSAP size and licence wording were tightened.
- Next.js no-config support is dated to 16.3, `transitionTypes` to 16.2, and two gaps were added: back and forward navigations do not animate, and a named header is not clickable during a transition.
