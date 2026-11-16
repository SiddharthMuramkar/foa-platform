// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant A component sampler: tabs (the only client island in variant A, well under 1 KB of app code).
// WAI-ARIA tabs pattern: roving tabindex, ←/→/Home/End, automatic activation. Look: a pill "tray" where the
// selected tab becomes a raised surface pill with the chunky lip used by buttons.
"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

export type SamplerTab = { label: string; body: string };

export default function SamplerTabs({ tabs, label }: { tabs: readonly SamplerTab[]; label: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight"
        ? active === last ? 0 : active + 1
        : event.key === "ArrowLeft"
          ? active === 0 ? last : active - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    // The page-level prototype switcher also listens for ←/→; keep the keypress inside the tablist.
    event.stopPropagation();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="a-tabs" onKeyDown={onKeyDown}>
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${base}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            className="a-tab a-display"
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.label}
          id={`${base}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="a-tabpanel"
        >
          {tab.body}
        </div>
      ))}
    </div>
  );
}
