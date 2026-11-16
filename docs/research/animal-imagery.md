# Happy animal imagery: open-licence sources and shortlist

Research for [#5](https://github.com/SiddharthMuramkar/foa-platform/issues/5) (map [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2)), SPEC §4.8. Sources read 16 Nov 2026.

## Answer

Use **Pexels**, the **free tier of Unsplash** (never Unsplash+ or the iStock tiles shown beside results) and the **WordPress Photo Directory** (CC0, moderated, no faces allowed). All three allow commercial and fundraising use with no attribution and ban AI uploads. Wikimedia Commons CC0/CC BY is a case-by-case extra. Pixabay and Openverse/Flickr are only for discovery: both index AI-generated content. No source warrants model releases, so: **no identifiable children** (hands and backs only), identifiable adults never next to a donation ask, and no visible logos or other organisations' names. Keep a typed manifest next to the files, with a `/credits` page built from it. The 24 candidates below are licence-checked and were viewed at thumbnail size.

## 1. Sources and terms

| Source | Licence | Commercial / fundraising | Attribution | Restrictions that matter here | AI content | Verdict |
|---|---|---|---|---|---|---|
| **Unsplash** (free) | [Unsplash License](https://unsplash.com/license): irrevocable, worldwide, "including for commercial purposes" | Yes | Not required, "appreciated" | Can't sell unmodified copies. Can't compile images "to replicate a similar or competing service". [Terms](https://unsplash.com/terms): the licence "does not include the right to use… trademarks, logos, or brands… people's images if they are recognizable". Terms also bar use in ML/AI datasets | Banned ([guidelines](https://help.unsplash.com/en/articles/2534415-unsplash-submission-guidelines), [FAQ](http://help.unsplash.com/en/articles/14790544-do-you-have-ai-generated-content-on-the-site)) | **Use** |
| Unsplash+ | [Unsplash+ License](https://unsplash.com/plus/license): paid, single seat, "cannot be stored on a DAM for broad sharing" ([plus](https://unsplash.com/plus)); bars digital templates | — | — | A public repo is broad sharing | Banned | **Exclude** |
| **Pexels** | [Pexels License](https://www.pexels.com/license/) | Yes (websites, ads and campaigns are listed uses) | Not required. Suggested credit: "Photo by X on Pexels", linked ([help](https://help.pexels.com/hc/en-us/articles/360042790533-What-s-the-appropriate-way-to-give-credit-to-the-photographer)) | Identifiable people never "in a bad light". "Don't imply endorsement… by people or brands on the imagery". Don't redistribute on other stock or wallpaper platforms. [Terms](https://www.pexels.com/terms-of-service/): "We do not warrant that any consents or licenses have been obtained"; commercial use with people "likely" needs consent | Banned ([help](https://help.pexels.com/hc/en-us/articles/27453505326873-Can-I-upload-generative-AI-photos-and-videos-to-Pexels)) | **Use** |
| **WordPress Photo Directory** | [CC0](https://wordpress.org/photos/license), moderated by volunteers | Yes | Not required | [Guidelines](https://wordpress.org/photos/guidelines): photographs only, "must not contain faces of people", no prominent branding. Licence page says to verify CC0 yourself | Photographs only (AI not named) | **Use**, strong for kids' art (no faces by rule) |
| Wikimedia Commons | Per file: CC0, CC BY, CC BY-SA, PD ([reuse guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)) | Per licence | CC BY needs a credit line ([credit line](https://commons.wikimedia.org/wiki/Commons:Credit_line)) | No warranty on licence status. Personality rights are separate: "A free image licence only covers the photographer's rights" ([identifiable people](https://commons.wikimedia.org/wiki/Commons:Photographs_of_identifiable_people)). Most Indian-dog photos are CC BY-SA | Not checked | **Case by case**; CC0 / CC BY only |
| Pixabay | [Content License](https://pixabay.com/service/license-summary/) | Yes, except in "a misleading or deceptive way"; no recognisable trademarks in commercial use | Not required | No standalone redistribution. [Terms](https://pixabay.com/service/terms/): no warranty that consents were obtained | **Allowed** if labelled ([AI guidelines](https://pixabay.com/blog/posts/ai-quality-guidelines-479)); the "hide AI" filter relies on uploader labels | Avoid |
| Openverse | Aggregator; licence per work. "Does not verify licensing information" ([about](https://openverse.org/about)) | Per work | Per work; the API gives an `attribution` string | — | Indexes CC0 Flickr DALL-E images and rawpixel AI images (seen in 16 Nov searches) | **Discovery only**, then verify at the source |
| StockSnap | [CC0](https://stocksnap.io/license) | Yes | Not required | — | Not checked | Fallback |

**Cross-cutting findings**

- **People and children.** No source warrants model releases (Unsplash terms, Pexels terms, Pixabay terms, Commons). CC BY 4.0 does not license "publicity, privacy, and/or other similar personality rights" ([legal code §2(b)(1)](https://creativecommons.org/licenses/by/4.0/legalcode.en)). FOA is a children's charity, and India's DPDP Act s.9 requires "verifiable consent of the parent" before processing a child's personal data ([India Code](https://indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf)). → No identifiable minors in stock imagery, ever. Children appear only as hands or backs. Real faces come later from FOA's own consented photos (SG-02 model).
- **Implied endorsement and fundraising.** Pexels bans implying endorsement by people or brands, CC BY has a "No endorsement" clause (§2(a)(6)) and Pixabay bans misleading use. → Identifiable adults never sit beside Donate, auction or pledge asks, and are never in FOA-stamped OG or social-kit images (FR-STAMP-01). No visible logos, uniforms, bandanas or signs naming other organisations.
- **Stock must not pose as FOA's work.** Stock never stands in for Artwork (gallery, auctions), Impact figures or Stories. Where a page could read as "FOA did this" (rescue on Impact or Welfare pages), caption the image "Illustrative photo". This matches the existing `Asset.usageRights = STOCK_LICENSED` field for CMS uploads (SPEC §5.4).
- **Public repo.** The free licences allow copying and distribution. The limits are: no compiling a competing image service (Unsplash), no listing on other stock platforms (Pexels), no standalone redistribution (Pixabay). A website's asset folder is none of these. Unsplash+ and iStock must never be committed. The repo has no LICENSE file: if one is added for code, it must exclude the imagery folder, whose terms live in the manifest.
- **Modifications.** Resizing, re-encoding and format changes are allowed technical modifications, and under CC 4.0 they "never produce Adapted Material" (§2(a)(4)). Cropping and retouching are adaptations: fine under CC0, Unsplash, Pexels and CC BY, but CC BY needs a note that the image was modified (§3(a)(1)(B)). Skip CC BY-SA to keep this simple.

## 2. Manifest

**Location.** `apps/web/src/assets/imagery/`: one optimised master per image, plus `imagery.ts`. This is web-only content, not brand assets (`packages/brand` stays logo, stamp and tokens per §3.2). Static imports give `next/image` automatic width, height and `blurDataURL`, plus content-hashed immutable caching ([Next 16 docs](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/02-components/image.mdx)). No new dependency.

```ts
// apps/web/src/assets/imagery/imagery.ts
import type { StaticImageData } from "next/image";

export type StockImage = {
  file: StaticImageData;          // static import
  slot: "hero" | "competitions" | "welfare" | "adoption" | "donate" | "empty";
  alt: string;                    // describes the scene, not the mood; ≤ 125 chars
  author: string;                 // as shown on the source page
  sourceUrl: string;              // the photo page, never a CDN URL
  licence: "unsplash" | "pexels" | "cc0" | "cc-by-4.0";
  retrievedOn: string;            // ISO date the licence was checked
  modified: string | null;        // e.g. "cropped 16:9; retouched sign out"
  people: "none" | "hands-only" | "adult-identifiable"; // identifiable minors: not representable
  aiGenerated: false;             // reviewer attests
};

export const imagery = { /* "hero-puppy-running": { file: heroPuppy, … } */ } satisfies Record<string, StockImage>;
```

**One unit test** (Zod is already in the stack; `z.url({ hostname })` and `z.enum` fit, per [Zod 4 docs](https://github.com/colinhacks/zod/blob/v4.6.7/packages/docs/content/api.mdx)) checks that:
- every file in the folder has a manifest entry, and every entry has a file;
- the `sourceUrl` host matches the licence: `unsplash.com` ↔ `unsplash`, `www.pexels.com` ↔ `pexels`, `wordpress.org` / `stocksnap.io` / `commons.wikimedia.org` ↔ `cc0` or `cc-by-4.0`;
- no URL contains `plus.unsplash.com` or `istockphoto`;
- `alt` is non-empty.

**Optimise before commit.** Strip EXIF/GPS. Long edge ≤ 2560 px for heroes and ≤ 1600 px otherwise, JPEG q≈80. That keeps 24 images to single-digit MB, so no LFS. The hero is the LCP image (FR-PUB-01 AC): use `preload`. Phone portrait and desktop landscape crops go through `getImageProps()` + `<picture>`. Next 16 limits `images.qualities` to `[75]` by default.

**Attribution on the site.**
- A `/credits` page generated from the manifest, linked from the footer ("Image credits"). Each row: thumbnail, author (linked), source page, licence (linked), modification note.
- That already satisfies CC BY, whose attribution "may be reasonable" via "a URI or hyperlink to a resource that includes the required information" (§3(a)(2)), so CC BY can be added later with no UI change.
- Per-image captions are optional. Credit formats: "Photo by X on Unsplash", "Photo by X on Pexels", "CC0 photo by X, WordPress Photo Directory", CC BY as title, author, source, licence.
- Credits must not read as the photographer endorsing FOA.

## 3. Shortlist (24)

All 24 were viewed at thumbnail size (no AI tells, no faces of minors, brand and text checked). Licence and author were read off each source page on 16 Nov 2026. Sizes are originals as listed. Unsplash pages give no size; Unsplash's submission minimum is 5 MP.

| # | Slot | Image | Author | Licence | Size | Why it fits | Flags |
|---|---|---|---|---|---|---|---|
| 1 | Hero | [White puppy mid-run, ears flying](https://unsplash.com/photos/qO-PIF84Vxg) | Joe Caione | Unsplash | ≥5 MP | Pure joy; dark green field leaves room for text; landscape | Very popular, so less distinctive |
| 2 | Hero | [Two smiling dogs before yellow flowers](https://unsplash.com/photos/gWNnnzho1ds) | Alvan Nee | Unsplash | ≥5 MP | Warm, bright, friendship; portrait for phone hero | Breed dogs |
| 3 | Hero | [Corgi grinning among flowers](https://unsplash.com/photos/Phv_rG-Ryl0) | Alvan Nee | Unsplash | ≥5 MP | Red/yellow palette sits beside logo red; eyes-closed delight | Breed dog |
| 4 | Hero | [Happy reddish-brown dog in greenery](https://wordpress.org/photos/photo/1006740a19/) | Ahsan Khan | CC0 | ≥1536×2048 | Open-mouthed grin, green tones echo logo green; looks like a real adopted mixed-breed dog | Leash in frame |
| 5 | Hero | [Playful kittens in sunlit park](https://www.pexels.com/photo/playful-kittens-in-sunlit-park-setting-33135220/) | Furkan Aktaş | Pexels | 5184×3456 | Cats at play, natural light; covers cats | — |
| 6 | Competitions | [Toddler's hands drawing with pencils](https://www.pexels.com/photo/38033507/) | Tess h. | Pexels | 6240×4160 | Child making art, no face; soft, honest | — |
| 7 | Competitions | [Child holding a rainbow drawing](https://www.pexels.com/photo/crop-child-with-drawing-in-hands-5622357/) | Allan Mas | Pexels | 6000×4000 | Pride in finished work; face out of frame | Retouch the scribbled name on the drawing |
| 8 | Competitions | [Collaborative handprint canvas](https://wordpress.org/photos/photo/394694648f/) | shivaniiydv | CC0 | 3140×2246 | Group art, multicolour, hands only: School-route energy | — |
| 9 | Competitions | [Crayon rainbow on paper](https://www.pexels.com/photo/colorful-crayons-on-a-bond-paper-with-rainbow-drawing-8014317/) | Cup of Couple | Pexels | 5464×8192 | No people; works as a section backdrop or empty "no Submissions yet" state | — |
| 10 | Welfare | [Mother dog nursing puppies, India](https://www.pexels.com/photo/mother-dog-feeding-puppies-outdoors-in-india-35080708/) | R͜͡AW亗 ŁûçĶý | Pexels | 3072×4096 | Real Indian street life; tender, not distressing | Mother is thin: welfare page only, never hero; caption "Illustrative photo" |
| 11 | Welfare | [Woman feeding a German Shepherd on a road](https://www.pexels.com/photo/woman-feeding-a-dog-12655067/) | salman kazmi | Pexels | 5760×3840 | Care and trust between person and dog | Identifiable adult: keep away from asks; no "FOA volunteer" caption |
| 12 | Welfare | [Kerala street dog trotting with a slipper](https://unsplash.com/photos/earDqniB3tM) | Praswin Prakashan | Unsplash | ≥5 MP | Playful community dog in India (Kasaragod); light humour | Small subject; needs a crop |
| 13 | Welfare | [Collared community dog, tongue out, Kolhapur](https://www.pexels.com/photo/playful-dog-relaxing-outdoors-in-kolhapur-40261160/) | Rishu Bhosale | Pexels | 6000×3376 | Cared-for indie with a collar: the outcome welfare work aims for | Crop out the Marathi signboard |
| 14 | Adoption | [Two playful puppies on dirt](https://wordpress.org/photos/photo/129685cebe/) | Yash Jawale | CC0 | 4032×3024 | Indie puppies at play: "adopt Indian" | Crop the litter at bottom right |
| 15 | Adoption | [Curious puppy, Bangalore](https://wordpress.org/photos/photo/526533c545/) | Yogesh Londhe | CC0 | 6720×4480 | Direct gaze, head tilt: the classic adoption-card shot | — |
| 16 | Adoption | [Indian pariah dog on a green path](https://www.pexels.com/photo/indian-pariah-dog-on-a-lush-green-path-39052700/) | Phenomenal Clicks | Pexels | 3072×4096 | Healthy, alert indie, tail up; local and trustworthy | Phone shot; check sharpness at full size |
| 17 | Adoption | [White paws beside a heart name tag](https://www.pexels.com/photo/dog-pet-paws-dog-tag-4445453/) | Mathew Coulton | Pexels | 6000×4000 | "A name of their own"; calm, no face | The tag reads "Klára"; crop if it distracts |
| 18 | Donate | [Hand holding a dog's paw](https://www.pexels.com/photo/unrecognizable-woman-holding-paw-of-dog-7788657/) | Ivan Babydov | Pexels | 3310×2207 | Trust and partnership; no face, so safe beside the red Donate CTA | — |
| 19 | Donate | [Happy white dog waiting for a treat](https://wordpress.org/photos/photo/5226a128a3/) | Binod Gurung | CC0 | 3024×4032 | Open smile looking up: "what your gift does" | — |
| 20 | Donate | [Golden puppy holding a tulip](https://unsplash.com/photos/Sg3XwuEpybU) | Richard Brutyo | Unsplash | ≥5 MP | "A gift": thank-you or receipt page | Breed dog |
| 21 | Empty state | [Curious kitten looking up](https://www.pexels.com/photo/adorable-tabby-kitten-with-big-eyes-portrait-6247958/) | Helena Lopes | Pexels | 5472×3648 | "Nothing here yet"; plain background, crops to a small square | — |
| 22 | Empty state | [Sleeping Samoyed puppy](https://www.pexels.com/photo/a-cute-dog-sleeping-on-the-floor-3860313/) | Tanya Gorelova | Pexels | 6016×4016 | "All caught up"; soft, low contrast | — |
| 23 | Empty state | [Four kittens huddled asleep](https://wordpress.org/photos/photo/76265d67a1/) | Ajith R N | CC0 | 3824×3000 | "No notifications"; top-down, tidy shape | — |
| 24 | Empty state | [Sleeping husky puppy](https://www.pexels.com/photo/little-puppy-sleeping-15795021/) | Rebeca Medeiros | Pexels | 4000×6000 | Quiet error or loading-fallback mood | — |

**Rejected after viewing:**
- [Kid behind painted hands](https://www.pexels.com/photo/a-kid-with-multicolored-hand-paint-1148998/): child's face visible.
- [Woman feeding husky](https://www.pexels.com/photo/close-up-photo-of-a-woman-feeding-a-dog-9632600/): branded cup.
- [Vet check-up](https://www.pexels.com/photo/cachorro-cao-assistente-check-up-6234610/): identifiable staff, reads as FOA's clinic.
- [Clinic keyboard](https://www.pexels.com/photo/keyboard-hospital-domestic-pets-medical-clinic-9341732/): equipment brand.
- [Crayon tray](https://wordpress.org/photos/photo/49862276d8/): Crayola branding.
- [Adoption-event dog](https://www.pexels.com/photo/adopt-cute-dog-rescue-2773198/): bandana carries another organisation's text.
- [Beagle face](https://unsplash.com/photos/2l0CWTpcChI): 68 M views, generic.

**Gaps:** no acceptable vet or clinic shot; few cats in Indian settings. Both are better filled by FOA's own photos.

## Recommendation

1. Sources, in order: Pexels, then Unsplash (free tier), then the WordPress Photo Directory; Commons CC0/CC BY only with a manual check; Pixabay and Openverse/Flickr for discovery only.
2. Lead the hero and adoption slots with **Indian indie dogs** (#4, #13–16) and keep breed dogs secondary. That is more honest for an India-first charity and less "stock".
3. Replace SPEC §4.8's imagery bullet with this wording:
   > Imagery: curated stock from Pexels, Unsplash (free licence only, never Unsplash+/iStock), the WordPress Photo Directory, or CC0/CC BY Wikimedia Commons; no AI-generated imagery. No identifiable minors; identifiable adults never beside fundraising asks or in stamped share images; no third-party logos or organisation names. Stock never represents Artwork, Impact or FOA's own rescue work, and is captioned "Illustrative photo" where it could. Files live in `apps/web/src/assets/imagery/` with a typed manifest (`imagery.ts`: source URL, author, licence, retrieval date, modifications, people, alt) checked by a unit test; a footer-linked `/credits` page is generated from it.
4. Start the manifest with the 24 above. A human approves full-size crops (flags column) before commit.

## Open risks

- **Uploader title.** Platforms disclaim that uploaders own the rights or hold releases (Pexels and Pixabay terms, Commons). Reverse-image-search hero candidates before launch.
- **Licence drift.** Terms can change for future downloads. Unsplash's grant is "irrevocable"; Pexels' licence page does not say so. `retrievedOn` records the checked date. Re-verify before swapping images.
- **People flags.** #11 (identifiable adult), #7 (child's scribbled name), #13 (signboard) and #14 (litter) need edits or placement rules.
- **Distinctiveness.** #1 is widely used. Owner preference may swap it for an indie shot.
- **Legal review not done.** DPDP and Indian personality-rights law were not analysed beyond s.9. The no-identifiable-minors rule avoids the question rather than answering it.
- **AI rules.** The Unsplash terms bar using images in ML/AI datasets. Never run stock through generative tools (crops and retouching only), which also keeps the no-AI rule.

## Sources (read 16 Nov 2026)

- Unsplash: [license](https://unsplash.com/license), [terms](https://unsplash.com/terms), [Unsplash+ license](https://unsplash.com/plus/license), [Unsplash+](https://unsplash.com/plus), [submission guidelines](https://help.unsplash.com/en/articles/2534415-unsplash-submission-guidelines), [AI FAQ](http://help.unsplash.com/en/articles/14790544-do-you-have-ai-generated-content-on-the-site), [brands and identifiable people](https://help.unsplash.com/en/articles/2646379-what-if-there-s-a-brand-or-identifiable-person-depicted-in-an-image-that-i-download), [credit](https://help.unsplash.com/en/articles/2612337-do-i-have-to-give-credit-to-a-contributor-when-i-use-their-image)
- Pexels: [license](https://www.pexels.com/license/), [terms](https://www.pexels.com/terms-of-service/), [AI uploads](https://help.pexels.com/hc/en-us/articles/27453505326873-Can-I-upload-generative-AI-photos-and-videos-to-Pexels), [credit](https://help.pexels.com/hc/en-us/articles/360042790533-What-s-the-appropriate-way-to-give-credit-to-the-photographer)
- Pixabay: [licence summary](https://pixabay.com/service/license-summary/), [terms](https://pixabay.com/service/terms/), [AI guidelines](https://pixabay.com/blog/posts/ai-quality-guidelines-479)
- WordPress Photo Directory: [license](https://wordpress.org/photos/license), [guidelines](https://wordpress.org/photos/guidelines)
- Openverse: [about](https://openverse.org/about), [sources](https://openverse.org/sources), [API schema](https://api.openverse.org/v1/schema/) (queried 16 Nov 2026)
- Wikimedia Commons: [reuse](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), [identifiable people](https://commons.wikimedia.org/wiki/Commons:Photographs_of_identifiable_people), [credit line](https://commons.wikimedia.org/wiki/Commons:Credit_line)
- StockSnap: [license](https://stocksnap.io/license)
- Creative Commons: [CC BY 4.0 legal code](https://creativecommons.org/licenses/by/4.0/legalcode.en), [attribution practice](https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution)
- India: [DPDP Act 2023, India Code](https://indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf)
- Next.js 16.4 image docs via Context7 ([image.mdx](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/02-components/image.mdx), [v16 upgrade](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/upgrading/version-16.mdx)); Zod 4.6 docs via Context7
- Photo pages: linked in the shortlist table
