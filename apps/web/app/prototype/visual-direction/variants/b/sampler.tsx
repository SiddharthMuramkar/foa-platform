// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Component sampler: how shadcn-style primitives read in "Editorial trust".
// Not part of the home page. Rules on show: ink is the primary affordance; 6px radius; hairlines, no UI shadows;
// logo colours only as 8px tile markers and 3px rules; red solid fill only on Donate; errors use red TEXT + icon.
import type { ReactNode } from "react";
import { home } from "../../fixtures";
import { AlertIcon, Arrow, Badge, btn, cx, keep, Kicker, linkCls, splitDate } from "./parts";
import Tabs from "./tabs";

function Panel({ title, note, className, children }: { title: string; note: string; className?: string; children: ReactNode }) {
  return (
    <div className={cx("flex flex-col rounded-[6px] border border-(--b-line) bg-(--b-surface) p-5 lg:p-6", className)}>
      <h3 className="text-[12px] font-semibold tracking-[0.1em] text-(--b-ink-2) uppercase">{title}</h3>
      <div className="mt-4 flex-1">{children}</div>
      <p className="mt-5 border-t border-(--b-line) pt-3 text-[13px] leading-[1.5] text-(--b-ink-2)">{note}</p>
    </div>
  );
}

const inputBase =
  "b-ease mt-2 block min-h-11 w-full rounded-[6px] border bg-(--b-surface) px-3 text-[16px] text-(--b-ink) placeholder:text-(--b-ink-2)";
const inputCls = cx(inputBase, "border-(--b-control) hover:border-(--b-ink)");
/** Error: red TEXT colour as a 2px edge (border + inset ring); never a red fill. */
const inputErrorCls = cx(inputBase, "border-(--b-red) shadow-[inset_0_0_0_1px_var(--b-red)]");

export function Sampler() {
  const [c1, c2, c3] = home.competitions.items;
  const d = splitDate(c1.closesOn);
  return (
    <section aria-labelledby="b-sampler-h" className="bg-(--b-paper) px-5 pt-14 pb-28 lg:px-10 lg:pt-20">
      <div className="mx-auto max-w-[76rem] border-t-2 border-dashed border-(--b-control) pt-6">
        <Kicker tone="ink">Prototype only · not part of the home page</Kicker>
        <h2 id="b-sampler-h" className="mt-3 text-[28px] leading-[1.12] font-semibold tracking-[-0.02em] lg:text-[36px]">
          Component sampler
        </h2>
        <p className="mt-3 max-w-[70ch] text-[16px] leading-[1.6] text-(--b-ink-2)">
          shadcn/ui primitives, re-skinned. Ink is the primary affordance, corners are 6px, edges are hairlines
          rather than shadows, and the logo colours appear only as 8px tile markers and 3px rules. Solid red is
          reserved for Donate.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Panel
            title="Buttons"
            className="lg:col-span-2"
            note="Primary is ink, not a brand colour, so the one red Donate button always stands out. Sentence case, semibold, an arrow that nudges on hover (static with reduced motion). 44px targets; 36px small."
          >
            <div className="flex flex-wrap items-center gap-3">
              <a href="#competitions" className={btn("primary")}>
                Enter a Competition
                <Arrow />
              </a>
              <a href="#gallery" className={btn("secondary")}>
                View results
              </a>
              <a href="#donate" className={btn("donate")}>
                Donate
              </a>
              <a href="#rules" className={cx(linkCls, "text-[15px]")}>
                Read the rules
                <Arrow />
              </a>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" className={btn("primary", "sm")}>
                Small primary
              </button>
              <button type="button" className={btn("secondary", "sm")}>
                Small secondary
              </button>
              <button type="button" disabled className={btn("disabled", "sm")}>
                Registration closed
              </button>
              <span aria-hidden="true" className={cx(btn("secondary", "sm"), "b-focus-demo")}>
                Focus ring
              </span>
            </div>
          </Panel>

          <Panel
            title="Badges"
            note="Small caps in ink with a tile marker. Meaning lives in the words; the colour only helps you scan. No red badges."
          >
            <ul className="flex flex-wrap gap-2">
              <li>
                <Badge tone="green">Registration open</Badge>
              </li>
              <li>
                <Badge tone="blue">Gold</Badge>
              </li>
              <li>
                <Badge tone="blue">Live auction</Badge>
              </li>
              <li>
                <Badge tone="ink">Results published</Badge>
              </li>
              <li>
                <Badge tone="ink">Closed</Badge>
              </li>
            </ul>
          </Panel>

          <Panel
            title="Text input"
            note="Visible labels above the field, a hint linked with aria-describedby, a 3:1 border. Errors pair red text with an icon and a 2px edge, so they never rely on colour alone."
          >
            <div className="flex flex-col gap-5">
              <div>
                <label htmlFor="b-s-email" className="text-[14px] font-semibold">
                  Email address
                </label>
                <p id="b-s-email-hint" className="mt-0.5 text-[13px] text-(--b-ink-2)">
                  We send receipts and results here.
                </p>
                <input
                  id="b-s-email"
                  type="email"
                  placeholder="name@example.com"
                  aria-describedby="b-s-email-hint"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="b-s-school" className="text-[14px] font-semibold">
                  School name
                </label>
                <input
                  id="b-s-school"
                  defaultValue="Sunrise Pub"
                  aria-invalid="true"
                  aria-describedby="b-s-school-error"
                  className={inputErrorCls}
                />
                <p id="b-s-school-error" className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-(--b-red)">
                  <AlertIcon />
                  Choose your School from the list, or add it as a new School.
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Card"
            note="A wall label, not a floating tile: paper fill, hairline edge, a 3px rule in the section’s logo colour, no shadow. Hover darkens the edge."
          >
            <article className="b-ease relative rounded-[6px] border border-(--b-line) bg-(--b-paper) p-5 hover:border-(--b-ink)">
              <span aria-hidden="true" className="absolute top-[-1px] left-5 h-[3px] w-10 bg-(--b-tile-green)" />
              <Badge tone="green">Registration open</Badge>
              <h4 className="mt-3 text-[19px] leading-snug font-semibold">{c1.title}</h4>
              <p className="mt-1 text-[14px] text-(--b-ink-2)">Theme: “{c1.theme}”</p>
              <dl className="b-num mt-4 grid grid-cols-2 gap-3 border-t border-(--b-line) pt-3 text-[14px]">
                <div>
                  <dt className="text-[12px] text-(--b-ink-2)">Closes</dt>
                  <dd className="font-semibold">
                    {d.day} {d.month} {d.year}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-(--b-ink-2)">Entry</dt>
                  <dd className="font-semibold">{c1.feeLabel}</dd>
                </div>
              </dl>
              <a href={c1.href} className={cx(linkCls, "mt-4 text-[15px]")}>
                Enter<span className="sr-only"> {c1.title}</span>
                <Arrow />
              </a>
            </article>
          </Panel>

          <Panel
            title="Tabs"
            note="Underline tabs on a hairline: the active tab gets a 2px ink bar, never a filled pill. Arrow keys, Home and End move between tabs."
          >
            <Tabs
              label="Competitions by art form"
              items={[c1, c2, c3].map((c) => ({
                label: c.artForm,
                panel: (
                  <p>
                    <span className="font-semibold text-(--b-ink)">{c.title}</span> · {keep(c.categoryLabel)} ·{" "}
                    {c.closesLabel} · Entry {c.feeLabel}
                  </p>
                ),
              }))}
            />
          </Panel>
        </div>
      </div>
    </section>
  );
}
