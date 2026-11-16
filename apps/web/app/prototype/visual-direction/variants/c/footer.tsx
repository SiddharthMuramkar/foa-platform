// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Footer as tiles: logo plate, three link-group tiles, utility row, social tile.
import { home } from "../../fixtures";
import { Logo } from "./header";
import { tile } from "./parts";

export function Footer() {
  const { footer } = home;
  return (
    <footer id="about" className="grid grid-cols-2 gap-(--c-gap) lg:grid-cols-12">
      <div className={`${tile("plate")} col-span-2 flex flex-col justify-between gap-5 p-5 lg:col-span-3 lg:p-6`}>
        <Logo className="h-[72px] w-auto self-start lg:h-[84px]" />
        <p className="c-muted text-sm leading-snug">Children’s art that helps animals, across India.</p>
      </div>
      {footer.groups.map((g, i) => (
        <nav
          key={g.heading}
          aria-label={`Footer: ${g.heading}`}
          className={`${tile("paper")} p-5 lg:col-span-3 lg:p-6 ${i === 2 ? "col-span-2" : ""}`}
        >
          <h2 className="text-[0.8125rem] font-extrabold tracking-[0.08em] uppercase">{g.heading}</h2>
          <ul className={`mt-3 grid gap-x-4 ${i === 2 ? "grid-cols-2 lg:grid-cols-1" : ""}`}>
            {g.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex min-h-10 items-center text-[0.9375rem] underline-offset-[0.2em] hover:underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ))}
      <div className={`${tile("paper")} col-span-2 flex flex-col gap-3 p-5 lg:col-span-8 lg:flex-row lg:items-center lg:justify-between lg:p-6`}>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {footer.utility.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="c-link inline-flex min-h-10 items-center text-[0.9375rem]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="c-muted text-sm">{footer.legalLine}</p>
      </div>
      <div className={`${tile("ink")} col-span-2 flex flex-col gap-3 p-5 lg:col-span-4 lg:p-6`}>
        <h2 className="text-[0.8125rem] font-extrabold tracking-[0.08em] uppercase">Follow FOA</h2>
        <ul className="grid grid-cols-2 gap-[3px] sm:grid-cols-4">
          {footer.social.map((s) => (
            <li key={s}>
              <a
                href={`#${s.toLowerCase()}`}
                className="flex min-h-11 items-center justify-center px-2 text-sm font-extrabold shadow-[inset_0_0_0_2px_var(--c-canvas)] transition-colors hover:bg-(--c-canvas) hover:text-(--c-ink)"
              >
                {s}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
