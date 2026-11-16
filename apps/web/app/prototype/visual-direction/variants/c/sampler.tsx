// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Component sampler: how shadcn-style primitives (Button, Input, Card, Badge, Tabs) look in this direction.
import type { CSSProperties } from "react";
import { home } from "../../fixtures";
import { Badge, Eyebrow, SplitButton, TriMarker, tile } from "./parts";
import { CompetitionCard } from "./sections";
import Tabs from "./tabs";

const h3 = "text-[0.8125rem] font-extrabold tracking-[0.08em] uppercase";

const surfaces = [
  { name: "Blue", token: "--c-blue", on: "--c-on-blue", note: "white 6.9:1" },
  { name: "Green", token: "--c-green", on: "--c-on-green", note: "near-black 6.3:1" },
  { name: "Red tint", token: "--c-red-tint", on: "--c-red-text", note: "solid red = Donate only" },
] as const;

export function Sampler() {
  return (
    <section aria-labelledby="c-sampler-h" className="flex flex-col gap-(--c-gap) border-t-2 border-dashed border-(--c-field) pt-(--c-section)">
      <div className="flex flex-col gap-2 pb-2">
        <Eyebrow marker={<TriMarker />}>Prototype only</Eyebrow>
        <h2 id="c-sampler-h" className="text-[1.875rem] leading-none font-extrabold tracking-[-0.02em] lg:text-[2.75rem]">
          Component sampler
        </h2>
        <p className="c-muted max-w-[44rem] text-base leading-relaxed">
          shadcn/ui primitives re-skinned for the mosaic: square corners, no shadows, the logo colours used verbatim as
          surfaces, and a 3&nbsp;px split between blocks, the logo&rsquo;s own tile gap.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-(--c-gap) lg:grid-cols-12">
        {/* Buttons */}
        <div className={`${tile("paper")} flex flex-col gap-5 p-5 lg:col-span-7 lg:p-6`}>
          <h3 className={h3}>Buttons</h3>
          <div className="flex flex-wrap gap-3">
            <SplitButton tone="primary" href="#sampler">
              Enter a Competition
            </SplitButton>
            <SplitButton tone="secondary" href="#sampler">
              View results
            </SplitButton>
            <SplitButton tone="donate" href="#donate">
              Donate
            </SplitButton>
          </div>
          <div className="flex flex-wrap gap-3">
            <SplitButton tone="primary" small type="button">
              Small primary
            </SplitButton>
            <SplitButton tone="secondary" small type="button">
              Small secondary
            </SplitButton>
          </div>
          <div className={`${tile("blue")} flex flex-wrap items-center gap-3 p-4`}>
            <p className="w-full text-sm font-extrabold">On a blue tile, secondary inverts itself:</p>
            <SplitButton tone="secondary" href="#sampler">
              Read our impact report
            </SplitButton>
            <SplitButton tone="primary" href="#sampler">
              Take part
            </SplitButton>
          </div>
        </div>

        {/* Input */}
        <div className={`${tile("paper")} flex flex-col gap-5 p-5 lg:col-span-5 lg:p-6`}>
          <h3 className={h3}>Text input</h3>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-s-email" className="c-label">
              Email address
            </label>
            <p id="c-s-email-hint" className="c-hint">
              We send the receipt and certificate here.
            </p>
            <input id="c-s-email" className="c-field" type="email" autoComplete="off" aria-describedby="c-s-email-hint" placeholder="name@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-s-school" className="c-label">
              School name
            </label>
            <input
              id="c-s-school"
              className="c-field"
              type="text"
              autoComplete="off"
              defaultValue="Sunrise"
              aria-invalid="true"
              aria-describedby="c-s-school-error"
            />
            <p id="c-s-school-error" className="c-error">
              <span className="c-error__icon" aria-hidden="true">
                !
              </span>
              <span>
                <span className="sr-only">Error: </span>Choose your School from the list, or add it as a new School.
              </span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="flex flex-col gap-(--c-gap) lg:col-span-4">
          <p className={`${h3} c-muted`}>Card</p>
          <CompetitionCard c={home.competitions.items[0]} className="flex-1" />
        </div>

        {/* Badges + surfaces */}
        <div className={`${tile("paper")} flex flex-col gap-5 p-5 lg:col-span-4 lg:p-6`}>
          <h3 className={h3}>Badges</h3>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">Registration open</Badge>
            <Badge tone="blue">Drawing</Badge>
            <Badge tone="neutral">Category A, ages 6–10</Badge>
            <Badge tone="award">Gold</Badge>
            <Badge tone="placeholder">Placeholder</Badge>
          </div>
          <h3 className={`${h3} mt-2`}>Surfaces and on-colours</h3>
          <ul className="grid grid-cols-3 gap-[3px]">
            {surfaces.map((s) => (
              <li
                key={s.name}
                className="flex aspect-[3/4] flex-col justify-between p-2.5"
                style={{ background: `var(${s.token})`, color: `var(${s.on})` } as CSSProperties}
              >
                <span className="text-[1.75rem] leading-none font-extrabold">Aa</span>
                <span className="text-xs leading-tight font-extrabold">
                  {s.name}
                  <br />
                  {s.note}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tabs */}
        <div className={`${tile("paper")} flex flex-col gap-5 p-5 lg:col-span-4 lg:p-6`}>
          <h3 className={h3}>Tabs</h3>
          <Tabs
            label="Art forms"
            items={[
              { label: "Drawing", body: "Pencil, crayon or ink on paper. Upload up to 3 photos of your Artwork." },
              { label: "Painting", body: "Watercolour, acrylic or poster colour. Photograph it flat in daylight." },
              { label: "Photography", body: "Your own photo of a community animal. No people’s faces, please." },
            ]}
          />
          <ul className="c-muted mt-auto flex flex-col gap-1.5 text-sm leading-snug">
            <li>Selected tab: logo blue fill, 800 weight and a solid square, so the state is never colour alone.</li>
            <li>Focus: 3&nbsp;px ring, offset into the gutter.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
