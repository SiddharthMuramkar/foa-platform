// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Keeps ←/→ inside native widgets (radio group, horizontal scroller) so the prototype switcher's window-level
// arrow-key handler doesn't hijack them. Only stops propagation: the browser's default action (move radio
// selection, scroll) still happens. Prototype plumbing, not part of the visual direction.
"use client";

import type { KeyboardEvent, ReactNode } from "react";

function keep(event: KeyboardEvent) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.stopPropagation();
}

export default function ArrowKeyScope({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} onKeyDown={keep}>
      {children}
    </div>
  );
}
