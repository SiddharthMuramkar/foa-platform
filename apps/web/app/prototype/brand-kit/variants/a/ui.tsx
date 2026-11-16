// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant A building blocks. Server components only (no client JS, NFR-01). Colours come from the
// --va-* custom properties that variant-a.tsx writes from its `tokens` export, plus the shared bk-* tokens.
import Image from "next/image";
import type { ReactNode } from "react";
import report from "./report.json";

export const A_DIR = "/prototype/brand-kit/a";
export const aSrc = (file: string) => `${A_DIR}/${file}`;

export type FileKey = keyof typeof report.files;
/** Real width/height of a generated file (from report.json, written by build.mjs). */
export function aFile(file: FileKey) {
  const f = report.files[file];
  return { src: aSrc(file), width: f.width, height: f.height, kb: Math.round(f.bytes / 102.4) / 10 };
}

export function Section({
  id,
  n,
  title,
  ships,
  spec,
  children,
}: {
  id: string;
  n: number;
  title: string;
  ships: ReactNode;
  spec: string[];
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 border-t border-bk-border pt-10">
      <div className="flex items-baseline gap-3">
        <span aria-hidden="true" className="text-sm font-bold tabular-nums text-bk-muted">
          {String(n).padStart(2, "0")}
        </span>
        <h2 id={`${id}-h`} className="text-xl font-bold leading-tight sm:text-2xl">
          {title}
        </h2>
      </div>
      <p className="mt-2 text-sm text-bk-muted">
        Ships as <span className="text-bk-fg">{ships}</span>
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Spec references">
        {spec.map((s) => (
          <li key={s} className="rounded-full border border-bk-border px-2 py-0.5 text-xs text-bk-muted">
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-10">{children}</div>
    </section>
  );
}

export function Sub({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-bold">{title}</h3>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <figcaption className="mt-2 text-sm leading-relaxed text-bk-muted">{children}</figcaption>;
}

/** "Open the real file" link: every figure points at the exact generated pixels. */
export function OpenFile({ file, label }: { file: FileKey; label?: string }) {
  const f = aFile(file);
  return (
    <a
      href={f.src}
      className="text-sm font-bold text-bk-primary underline decoration-1 underline-offset-4 hover:decoration-2"
    >
      {label ?? `Open ${file}`}
      <span className="font-normal text-bk-muted">
        {" "}
        ({f.width}×{f.height}, {f.kb} KB)
      </span>
    </a>
  );
}

/** Spec card: a short definition list next to each derivative. */
export function SpecCard({ rows, title = "Stamp spec" }: { rows: [string, ReactNode][]; title?: string }) {
  return (
    <div className="rounded-xl border border-bk-border bg-bk-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-bk-muted">{title}</p>
      <dl className="mt-3 grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-bk-muted">{k}</dt>
            <dd className="min-w-0">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Callout({ tone, title, children }: { tone: "ok" | "warn"; title: string; children: ReactNode }) {
  const c =
    tone === "ok"
      ? "bg-(--va-ok-soft) text-(--va-ok-text) border-(--va-ok-border)"
      : "bg-(--va-warn-soft) text-(--va-warn-text) border-(--va-warn-border)";
  return (
    <div className={`rounded-xl border p-4 ${c}`} role="note">
      <p className="font-bold">{title}</p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/** A small icon drawn at N× with nearest-neighbour scaling, on a checkerboard so transparency shows. */
export function Magnified({ file, scale, label }: { file: FileKey; scale: number; label: string }) {
  const f = aFile(file);
  return (
    <figure className="flex flex-col items-start">
      <div className="va-checker rounded-md p-2">
        <Image
          unoptimized
          src={f.src}
          width={f.width}
          height={f.height}
          alt={`${label}, ${f.width} by ${f.height} pixels, enlarged ${scale} times`}
          style={{ width: f.width * scale, height: f.height * scale }}
          className="[image-rendering:pixelated]"
        />
      </div>
      <figcaption className="mt-2 text-xs text-bk-muted">
        <span className="font-bold text-bk-fg">{label}</span> · {f.width} px ×{scale}
      </figcaption>
    </figure>
  );
}

/** Horizontal-scroll well for true-size (100%) views wider than a phone. The page itself never scrolls sideways. */
export function TrueSize({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      className="overflow-x-auto rounded-xl border border-bk-border bg-(--va-sunken) p-3"
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      {children}
    </div>
  );
}
