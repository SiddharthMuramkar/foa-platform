// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type PrototypeVariant = { key: string; name: string };

type Props = {
  variants: readonly PrototypeVariant[];
  /** Query param that holds the variant key. */
  param?: string;
};

const SHOW =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PROTOTYPE === "1";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return true;
  return el.isContentEditable;
}

/**
 * Fixed bottom-centre pill: ← "<key> (<name>)" →. Arrows and keyboard ←/→ cycle with wrap and
 * update ?variant= via router.replace, keeping every other param. Hidden when ?shot=1 and in
 * production unless NEXT_PUBLIC_PROTOTYPE=1. Must be rendered inside <Suspense> (useSearchParams).
 */
export function PrototypeSwitcher({ variants, param = "variant" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get(param);
  const found = variants.findIndex((v) => v.key.toLowerCase() === (raw ?? "").toLowerCase());
  const index = found === -1 ? 0 : found;
  const current = variants[index];
  const hidden = !SHOW || searchParams.get("shot") === "1" || variants.length === 0;

  // Latest requested index, so fast repeated presses don't read a stale URL before replace lands.
  const pending = useRef(index);
  useEffect(() => {
    pending.current = index;
  }, [index]);

  const go = useCallback(
    (delta: number) => {
      if (variants.length === 0) return;
      const nextIndex = (pending.current + delta + variants.length) % variants.length;
      pending.current = nextIndex;
      const params = new URLSearchParams(searchParams.toString());
      params.set(param, variants[nextIndex].key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [variants, searchParams, param, pathname, router],
  );

  useEffect(() => {
    if (hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return;
      e.preventDefault();
      go(e.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, hidden]);

  if (hidden || !current) return null;

  const btn =
    "grid size-11 place-items-center rounded-full text-xl leading-none text-white hover:bg-white/15 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#FFD23F]";

  return (
    <nav
      aria-label="Prototype variant switcher"
      data-prototype-switcher=""
      className="fixed left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#111111] px-1.5 py-1 text-white shadow-[0_6px_24px_rgba(0,0,0,0.35)] ring-2 ring-white"
      style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
    >
      <button type="button" className={btn} onClick={() => go(-1)} aria-label="Previous variant">
        <span aria-hidden="true">←</span>
      </button>
      <span aria-live="polite" className="min-w-0 whitespace-nowrap px-2 text-sm font-bold">
        {current.key} ({current.name})
      </span>
      <button type="button" className={btn} onClick={() => go(1)} aria-label="Next variant">
        <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}

export default PrototypeSwitcher;
