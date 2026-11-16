// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export type SwitcherVariant = { key: string; name: string };

type Props = {
  variants: SwitcherVariant[];
  /** Search param that holds the variant key. */
  param?: string;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  return el.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])") !== null;
}

/**
 * Fixed bottom-centre pill: ← "<key> (<name>)" →. Arrow buttons and ←/→ keys cycle with wrap and
 * update ?<param>= via router.replace, keeping other params. Hidden with ?shot=1, and in production
 * unless NEXT_PUBLIC_PROTOTYPE=1.
 */
export default function PrototypeSwitcher({ variants, param = "variant" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hiddenInProd = process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_PROTOTYPE !== "1";
  const shot = searchParams.get("shot") === "1";

  const currentKey = searchParams.get(param)?.toUpperCase();
  const foundIndex = variants.findIndex((v) => v.key.toUpperCase() === currentKey);
  const index = foundIndex === -1 ? 0 : foundIndex;
  const current = variants[index];

  const go = useCallback(
    (delta: number) => {
      if (variants.length === 0) return;
      const next = variants[(index + delta + variants.length) % variants.length];
      const params = new URLSearchParams(searchParams.toString());
      params.set(param, next.key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [index, param, pathname, router, searchParams, variants],
  );

  useEffect(() => {
    if (hiddenInProd || shot) return;
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return;
      e.preventDefault();
      go(e.key === "ArrowLeft" ? -1 : 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, hiddenInProd, shot]);

  if (hiddenInProd || shot || !current) return null;

  const btn =
    "inline-flex size-11 items-center justify-center rounded-full text-xl leading-none hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <div
      role="group"
      aria-label="Prototype variant switcher"
      className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full p-1 shadow-lg ring-2 ring-white/80"
      style={{ background: "var(--switcher-bg)", color: "var(--switcher-fg)" }}
    >
      <button type="button" className={btn} aria-label="Previous variant" onClick={() => go(-1)}>
        <span aria-hidden="true">←</span>
      </button>
      <span aria-live="polite" className="min-w-36 px-2 text-center text-sm font-bold whitespace-nowrap">
        {current.key} ({current.name})
      </span>
      <button type="button" className={btn} aria-label="Next variant" onClick={() => go(1)}>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
