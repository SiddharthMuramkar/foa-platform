// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant B "cards": an editorial ruled index (numbered rows under a heavy section rule) rather than a card grid,
// matching the masthead metaphor. Competition data only (SG-01: no child names, ages, schools or artworks).
// Status colours come from the logo: green = registration open, blue = upcoming. Red is reserved for Donate, so
// the fixture's per-card tile accent is deliberately not used.
import { competitions, competitionsSection, type CompetitionCard } from "../../fixtures";
import { container, textLink } from "./ui";

function Status({ card }: { card: CompetitionCard }) {
  const open = card.status === "REGISTRATION_OPEN";
  return (
    <p className={`flex items-center gap-2 text-sm font-bold ${open ? "text-success" : "text-accent"}`}>
      <span
        aria-hidden="true"
        className={open ? "size-2 rounded-full bg-success" : "size-2 rounded-full border-2 border-accent"}
      />
      {card.statusLabel}
    </p>
  );
}

export function Competitions() {
  return (
    <section id="competitions" aria-labelledby="b-comp-title" className="bg-canvas text-ink">
      <div className={`${container} pt-4 pb-16 md:pb-24`}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-ink pb-4">
          <h2 id="b-comp-title" className="text-2xl font-bold tracking-tight md:text-4xl">
            {competitionsSection.heading}
          </h2>
          <a href={competitionsSection.more.href} className={`font-bold text-accent ${textLink}`}>
            {competitionsSection.more.label}
            <span aria-hidden="true"> →</span>
          </a>
        </div>
        <ol className="divide-y divide-line">
          {competitions.map((card, i) => (
            <li key={card.slug}>
              <a
                href={card.href}
                className="group grid grid-cols-[2.25rem_1fr] gap-x-3 gap-y-4 py-6 md:-mx-4 md:grid-cols-[3.5rem_minmax(0,1fr)_13rem_9rem_1.5rem] md:items-center md:gap-x-8 md:rounded-lg md:px-4 md:py-8 md:hover:bg-surface motion-safe:transition-colors"
              >
                <span aria-hidden="true" className="pt-0.5 text-sm font-bold text-ink-muted tabular-nums md:pt-0 md:text-lg">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <Status card={card} />
                  <h3 className="mt-2 text-xl font-bold tracking-tight md:text-2xl">
                    <span className="decoration-2 underline-offset-4 group-hover:underline">{card.title}</span>
                  </h3>
                  <p className="mt-1 text-ink-muted">{card.theme}</p>
                </div>
                <dl className="col-start-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm md:col-start-auto md:block md:space-y-1">
                  <dt className="text-ink-muted md:sr-only">Dates</dt>
                  <dd className="font-bold">{card.dateLabel}</dd>
                  <dt className="text-ink-muted md:sr-only">Age categories</dt>
                  <dd className="text-ink-muted md:text-ink">{card.ageCategoryLabels.join(" · ")}</dd>
                </dl>
                <p className="col-start-2 text-sm font-bold md:col-start-auto md:text-base">{card.feeLabel}</p>
                <span
                  aria-hidden="true"
                  className="hidden text-xl text-ink-muted md:block motion-safe:transition-transform md:group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
