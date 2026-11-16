// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
"use client";

// Tiny client island (WAI-ARIA tabs: roving tabindex, ←/→/Home/End, automatic activation).
// Arrow keys call preventDefault so the prototype switcher (which skips defaultPrevented events) stays put.
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabItem = { label: string; panel: ReactNode };

export default function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = items.length - 1;
    const next =
      event.key === "ArrowRight" ? (active === last ? 0 : active + 1)
      : event.key === "ArrowLeft" ? (active === 0 ? last : active - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex gap-6 overflow-x-auto border-b border-(--b-line)"
      >
        {items.map((item, i) => {
          const selected = i === active;
          return (
            <button
              key={item.label}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${base}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={
                "b-ease -mb-px min-h-11 border-b-2 text-[15px] font-semibold whitespace-nowrap " +
                (selected
                  ? "border-(--b-ink) text-(--b-ink)"
                  : "border-transparent text-(--b-ink-2) hover:border-(--b-control) hover:text-(--b-ink)")
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, i) => (
        <div
          key={item.label}
          id={`${base}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="pt-4 text-[15px] leading-[1.6] text-(--b-ink-2)"
        >
          {item.panel}
        </div>
      ))}
    </div>
  );
}
