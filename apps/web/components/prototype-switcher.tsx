// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type SwitcherVariant = { key: string; name: string };

type Props = {
  variants: readonly SwitcherVariant[];
  /** Active variant key as resolved by the server (handles a missing or unknown ?variant=). */
  current: string;
};

// Hidden in production unless NEXT_PUBLIC_PROTOTYPE=1 (set in apps/web/.env.production for preview deploys).
const ENABLED =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PROTOTYPE === "1";

const EDITABLE = 'input, textarea, [contenteditable]:not([contenteditable="false"])';

export default function PrototypeSwitcher({ variants, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hidden = !ENABLED || searchParams.get("shot") === "1" || variants.length === 0;
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  const go = useCallback(
    (delta: number) => {
      const next = variants[(index + delta + variants.length) % variants.length];
      const params = new URLSearchParams(searchParams.toString()); // keep theme, shot, etc.
      params.set("variant", next.key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [variants, index, searchParams, pathname, router],
  );

  useEffect(() => {
    if (hidden) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return; // leave browser shortcuts alone
      const target = e.target;
      if (target instanceof Element && target.closest(EDITABLE)) return;
      e.preventDefault();
      go(e.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hidden, go]);

  if (hidden) return null;
  const active = variants[index];

  const arrow =
    "grid size-11 place-items-center rounded-full text-lg leading-none text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd400]";

  return (
    <nav
      aria-label="Prototype variants"
      className="fixed left-1/2 z-[2147483647] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black p-1 font-sans text-white shadow-[0_6px_24px_rgba(0,0,0,0.45)] ring-2 ring-white print:hidden"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <button type="button" className={arrow} onClick={() => go(-1)} aria-label="Previous variant">
        <span aria-hidden="true">←</span>
      </button>
      <span aria-live="polite" className="min-w-36 px-2 text-center text-sm font-bold whitespace-nowrap">
        {active.key} ({active.name})
      </span>
      <button type="button" className={arrow} onClick={() => go(1)} aria-label="Next variant">
        <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}
