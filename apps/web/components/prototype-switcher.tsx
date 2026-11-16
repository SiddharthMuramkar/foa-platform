// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type PrototypeVariant = { key: string; name: string };

// Hidden in production builds unless NEXT_PUBLIC_PROTOTYPE=1 (set in apps/web/.env.production for preview deploys).
const ENABLED =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PROTOTYPE === "1";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !==
    null
  );
}

/**
 * Fixed bottom-centre pill: ← "<key> (<variant name>)" →.
 * Arrows and keyboard ←/→ cycle with wrap and update ?<param>= via router.replace, keeping other params.
 * Hidden when ?shot=1. Render it inside <Suspense> (it reads useSearchParams).
 */
export default function PrototypeSwitcher({
  variants,
  param = "variant",
}: {
  variants: readonly PrototypeVariant[];
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hidden = !ENABLED || searchParams.get("shot") === "1" || variants.length === 0;
  const requested = (searchParams.get(param) ?? "").toUpperCase();
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key.toUpperCase() === requested),
  );
  const current = variants[index];

  const go = useCallback(
    (delta: number) => {
      const next = variants[(index + delta + variants.length) % variants.length];
      const params = new URLSearchParams(searchParams.toString());
      params.set(param, next.key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [index, variants, searchParams, param, pathname, router],
  );

  useEffect(() => {
    if (hidden) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
      if (isEditable(event.target) || isEditable(document.activeElement)) return;
      event.preventDefault();
      go(event.key === "ArrowLeft" ? -1 : 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, hidden]);

  if (hidden || !current) return null;

  const button =
    "grid size-11 shrink-0 place-items-center rounded-full text-xl leading-none hover:bg-white/20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#FFD400]";

  return (
    <nav
      aria-label="Prototype variants"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[2147483647] flex justify-center px-4 font-sans"
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-full bg-black p-1 text-white shadow-[0_6px_24px_rgba(0,0,0,0.4)] ring-2 ring-white">
        <button type="button" className={button} onClick={() => go(-1)} aria-label="Previous variant">
          <span aria-hidden="true">←</span>
        </button>
        <span
          aria-live="polite"
          className="min-w-0 truncate px-2 text-center text-sm font-semibold sm:min-w-48"
        >
          {current.key} ({current.name})
        </span>
        <button type="button" className={button} onClick={() => go(1)} aria-label="Next variant">
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
}
