// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant C: open/upcoming Competitions (FR-PUB-01) as alternating islands: light, page, light.
// Competition data only (SG-01: no child names, ages, schools or artworks).
// The fixture's per-card tile accent is NOT used: card 1's accent is red, and red is Donate-only. Status colour instead
// (success = open, accent = upcoming), both measured: success 5.6 / 8.2, accent 6.9 / 6.6 (light island / dark card).
import { competitions, competitionsSection, type CompetitionCard } from "../../fixtures";
import { Island } from "./island";

function Card({ c, tone }: { c: CompetitionCard; tone: "light" | "page" }) {
  const open = c.status === "REGISTRATION_OPEN";
  return (
    <Island
      as="article"
      tone={tone}
      className="group relative flex h-full flex-col rounded-3xl p-5 sm:p-6 motion-safe:transition-transform motion-safe:hover:-translate-y-1"
    >
      <p className={`inline-flex items-center gap-2 text-sm font-bold ${open ? "text-success" : "text-accent"}`}>
        <span aria-hidden="true" className={`size-2 rounded-full ${open ? "bg-success" : "bg-accent"}`} />
        {c.statusLabel}
      </p>
      <h3 className="mt-3 text-xl leading-tight font-bold">
        {/* Stretched link: the whole card is the target; focus ring sits on the title. */}
        <a href={c.href} className="rounded-sm after:absolute after:inset-0 after:rounded-3xl after:content-['']">
          {c.title}
        </a>
      </h3>
      <p className="mt-1.5 text-ink-muted">{c.theme}</p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 text-sm">
        <div>
          <dt className="text-ink-muted">Dates</dt>
          <dd className="mt-0.5 font-bold">{c.dateLabel}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Fee</dt>
          <dd className="mt-0.5 font-bold">{c.feeLabel}</dd>
        </div>
      </dl>

      <ul aria-label="Age categories" className="mt-4 flex flex-wrap gap-1.5">
        {c.ageCategoryLabels.map((a) => (
          <li key={a} className="rounded-full px-2.5 py-1 text-xs font-bold text-ink-muted ring-1 ring-line ring-inset">
            {a}
          </li>
        ))}
      </ul>

      <p aria-hidden="true" className="mt-auto pt-6 text-sm font-bold text-accent">
        View Competition <span className="inline-block motion-safe:transition-transform motion-safe:group-hover:translate-x-1">→</span>
      </p>
    </Island>
  );
}

export function IslandCompetitions() {
  return (
    <section id="competitions" aria-labelledby="c-comp-title" className="mt-10 md:mt-14">
      {/* Section head sits straight on the canvas: text only, no logo. */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 px-1">
        <h2 id="c-comp-title" className="text-2xl font-bold tracking-tight lg:text-3xl">
          {competitionsSection.heading}
        </h2>
        <a
          href={competitionsSection.more.href}
          className="inline-flex min-h-11 items-center font-bold text-accent underline-offset-4 hover:underline"
        >
          {competitionsSection.more.label} <span aria-hidden="true">&nbsp;→</span>
        </a>
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-3 md:gap-4">
        {competitions.map((c, i) => (
          <li key={c.slug}>
            <Card c={c} tone={i % 2 === 0 ? "light" : "page"} />
          </li>
        ))}
      </ul>
    </section>
  );
}
