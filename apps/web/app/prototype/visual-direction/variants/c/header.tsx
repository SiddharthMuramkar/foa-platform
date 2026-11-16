// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Header as a row of tiles: logo plate | nav tile | Sign in | solid red Donate (the only red fill up here).
// Phones: logo plate | Menu (<details>, no JS) | Donate.
import Image from "next/image";
import { home } from "../../fixtures";
import { logo } from "../../logo";
import { CloseIcon, MenuIcon, PawIcon, tile } from "./parts";

const { nav } = home;

export function Logo({ className }: { className: string }) {
  // Never altered: only scaled. Sits on a light plate so the black wordmark always reads.
  return (
    <Image
      src={logo.svg}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      unoptimized
      className={className}
    />
  );
}

export function Header() {
  return (
    <header className="relative grid grid-cols-[auto_1fr_auto] gap-(--c-gap) lg:grid-cols-[auto_1fr_auto_auto]">
      <a href="#c-top" className={`${tile("plate")} flex items-center px-2.5 py-2 lg:px-3`} aria-label={`${logo.alt}, home`}>
        <Logo className="h-12 w-auto lg:h-[60px]" />
      </a>

      {/* Desktop nav tile */}
      <nav aria-label="Main" className={`${tile("paper")} hidden items-stretch lg:flex`}>
        <ul className="flex w-full items-stretch">
          {nav.items.map((item) => (
            <li key={item.href} className="flex">
              <a
                href={item.href}
                className="flex items-center px-4 text-[0.9375rem] font-extrabold no-underline transition-colors hover:bg-(--c-paper-2) xl:px-5"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a
        href={nav.signIn.href}
        className={`${tile("canvas")} c-link-tile hidden items-center px-5 text-[0.9375rem] font-extrabold shadow-[inset_0_0_0_2px_var(--c-ink)] lg:flex`}
      >
        {nav.signIn.label}
      </a>

      {/* Phone menu tile */}
      <details className="c-menu lg:hidden">
        <summary className={`${tile("paper")} c-link-tile flex min-h-16 items-center justify-center gap-2 px-4 font-extrabold`}>
          <span className="c-menu__open flex items-center gap-2">
            <span className="size-5">
              <MenuIcon />
            </span>
            Menu
          </span>
          <span className="c-menu__close flex items-center gap-2">
            <span className="size-5">
              <CloseIcon />
            </span>
            Close
          </span>
        </summary>
        <nav aria-label="Main" className="absolute inset-x-0 top-full z-30 pt-(--c-gap)">
          <ul className="grid grid-cols-2 gap-(--c-gap) bg-(--c-canvas) pb-(--c-gap)">
            {nav.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`${tile("paper")} c-link-tile flex min-h-14 items-center px-4 text-lg font-extrabold`}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={nav.signIn.href}
                className={`${tile("canvas")} c-link-tile flex min-h-14 items-center px-4 text-lg font-extrabold shadow-[inset_0_0_0_2px_var(--c-ink)]`}
              >
                {nav.signIn.label}
              </a>
            </li>
          </ul>
        </nav>
      </details>

      <a
        href={nav.donate.href}
        className={`${tile("red")} c-link-tile flex items-center gap-2.5 px-4 text-base font-extrabold lg:px-6 lg:text-lg`}
      >
        <span className="size-5" aria-hidden="true">
          <PawIcon />
        </span>
        {nav.donate.label}
      </a>
    </header>
  );
}
