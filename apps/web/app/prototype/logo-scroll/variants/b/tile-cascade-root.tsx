// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
"use client";

// The only client code in variant B (~1 KB): a wrapper div that hosts data-b-docked / data-b-wag-run.
// Server-rendered header, hero and sections pass through as children (never imported into the client graph).
import { useEffect, useRef, type ReactNode } from "react";
import { initTileCascade } from "./tile-cascade-behaviour";
import styles from "./tile-cascade.module.css";

export function TileCascadeRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    return el ? initTileCascade(el) : undefined;
  }, []);
  return (
    <div ref={ref} className={styles.root} data-b-root="">
      {children}
    </div>
  );
}
