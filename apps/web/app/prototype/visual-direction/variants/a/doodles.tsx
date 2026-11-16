// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant A "Sunlit storybook": hand-coded SVG accents (no AI imagery, SPEC §4.8).
// All decorative: aria-hidden, focusable=false, colour via currentColor so tokens drive them.
import type { CSSProperties, SVGProps } from "react";

type DoodleProps = Omit<SVGProps<SVGSVGElement>, "children"> & { style?: CSSProperties };

const deco = { "aria-hidden": true, focusable: false } as const;

/** Hand-drawn underline that "draws in" under the hero accent words. */
export function Squiggle(props: DoodleProps) {
  return (
    <svg viewBox="0 0 300 24" fill="none" preserveAspectRatio="none" {...deco} {...props}>
      <path
        className="a-squiggle-path"
        d="M4 15c22-11 40 9 66-1s38-12 62 0 40 10 64-1 40-10 62 1c12 6 24 4 38-2"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}

export function Paw(props: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" {...deco} {...props}>
      <path d="M20 20.5c-5.6 0-10.8 5.9-10.8 10.5 0 3.2 2.7 4.6 5.3 4.6 2.4 0 3.5-1.2 5.5-1.2s3.1 1.2 5.5 1.2c2.6 0 5.3-1.4 5.3-4.6 0-4.6-5.2-10.5-10.8-10.5z" />
      <ellipse cx="8.6" cy="17.4" rx="3.6" ry="4.7" transform="rotate(-22 8.6 17.4)" />
      <ellipse cx="15.6" cy="9.6" rx="3.8" ry="5.1" transform="rotate(-6 15.6 9.6)" />
      <ellipse cx="24.6" cy="9.6" rx="3.8" ry="5.1" transform="rotate(8 24.6 9.6)" />
      <ellipse cx="31.6" cy="17.6" rx="3.6" ry="4.7" transform="rotate(24 31.6 17.6)" />
    </svg>
  );
}

/** A little trail of paw prints walking across a corner. Each print fades in once (motion-safe only). */
export function PawTrail({ className, style }: { className?: string; style?: CSSProperties }) {
  const steps = [
    { x: 0, y: 46, r: 64 },
    { x: 26, y: 26, r: 50 },
    { x: 58, y: 34, r: 70 },
    { x: 84, y: 10, r: 56 },
  ];
  return (
    <svg viewBox="0 0 120 80" fill="currentColor" className={className} style={style} {...deco}>
      {steps.map((s, i) => (
        <g
          key={i}
          className="a-paw-step"
          style={{ "--a-i": i } as CSSProperties}
          transform={`translate(${s.x} ${s.y}) rotate(${s.r} 12 12) scale(0.6)`}
        >
          <path d="M20 20.5c-5.6 0-10.8 5.9-10.8 10.5 0 3.2 2.7 4.6 5.3 4.6 2.4 0 3.5-1.2 5.5-1.2s3.1 1.2 5.5 1.2c2.6 0 5.3-1.4 5.3-4.6 0-4.6-5.2-10.5-10.8-10.5z" />
          <ellipse cx="8.6" cy="17.4" rx="3.6" ry="4.7" />
          <ellipse cx="15.6" cy="9.6" rx="3.8" ry="5.1" />
          <ellipse cx="24.6" cy="9.6" rx="3.8" ry="5.1" />
          <ellipse cx="31.6" cy="17.6" rx="3.6" ry="4.7" />
        </g>
      ))}
    </svg>
  );
}

export function Sparkle(props: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...deco} {...props}>
      <path d="M12 1.5c.9 5.6 3.9 8.8 10 10.5-6.1 1.7-9.1 4.9-10 10.5-.9-5.6-3.9-8.8-10-10.5 6.1-1.7 9.1-4.9 10-10.5z" />
    </svg>
  );
}

/** Hand-drawn loop, used as a section flourish. */
export function Curl(props: DoodleProps) {
  return (
    <svg viewBox="0 0 120 40" fill="none" {...deco} {...props}>
      <path
        d="M4 30c14-2 26-10 30-20 3-7-6-9-9-2-4 10 8 20 22 18 16-2 22-16 34-18 9-1 15 5 15 12"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Heart(props: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...deco} {...props}>
      <path d="M12 21c-.7-.5-9-5.9-9-11.6C3 6.4 5.3 4 8.1 4c1.8 0 3.2 1 3.9 2.5C12.7 5 14.1 4 15.9 4 18.7 4 21 6.4 21 9.4 21 15.1 12.7 20.5 12 21z" />
    </svg>
  );
}

/** Hand-drawn arrow for "see all" links. */
export function Arrow(props: DoodleProps) {
  return (
    <svg viewBox="0 0 32 20" fill="none" {...deco} {...props}>
      <path
        d="M2 11c8-1 16-2 26-1M21 3c3 2 6 5 8 7-3 2-5 4-8 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Soft wave edge that tops a band (fill = the band's colour via currentColor). */
export function WaveEdge(props: DoodleProps) {
  return (
    <svg viewBox="0 0 1440 56" preserveAspectRatio="none" fill="currentColor" {...deco} {...props}>
      <path d="M0 30C160 6 330 2 520 24s390 34 560 12 270-28 360-10V56H0z" />
    </svg>
  );
}

export function Rosette(props: DoodleProps) {
  return (
    <svg viewBox="0 0 24 28" fill="none" {...deco} {...props}>
      <path d="M8 16l-3 10 4-2 2 3 2-8M16 16l3 10-4-2-2 3-2-8" fill="currentColor" opacity=".55" />
      <circle cx="12" cy="10" r="8" fill="currentColor" />
      <circle cx="12" cy="10" r="4.2" fill="none" stroke="var(--a-surface)" strokeWidth="1.8" />
    </svg>
  );
}

/* --------------------------------------------------------------- impact icons (stroke, 48 grid) */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconTreated(props: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" {...deco} {...props}>
      <path {...stroke} d="M24 41c-2-1.5-17-10.5-17-21.5C7 13.6 11.3 9 16.4 9c3.4 0 6 1.9 7.6 4.7C25.6 10.9 28.2 9 31.6 9 36.7 9 41 13.6 41 19.5 41 30.5 26 39.5 24 41z" />
      <path {...stroke} d="M24 18.5v12M18 24.5h12" />
    </svg>
  );
}

export function IconHome(props: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" {...deco} {...props}>
      <path {...stroke} d="M7 22.5L24 8l17 14.5M11.5 19v20.5h25V19" />
      <path {...stroke} d="M24 35c-1-.8-6-3.9-6-7.4 0-1.9 1.4-3.3 3.1-3.3 1.2 0 2.3.7 2.9 1.7.6-1 1.7-1.7 2.9-1.7 1.7 0 3.1 1.4 3.1 3.3 0 3.5-5 6.6-6 7.4z" />
    </svg>
  );
}

export function IconBrush(props: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" {...deco} {...props}>
      <path {...stroke} d="M38.5 7.5c-5 3-13 10.5-16.5 15.5l3.5 3.5c5-3.5 12.5-11.5 15.5-16.5z" />
      <path {...stroke} d="M21 25c-4-.5-7 2-7.5 5.5-.4 3-2 4.5-5 5 3 3.5 9.5 4 13.5.5 2.6-2.3 2.6-6 2.5-7.5" />
      <path {...stroke} d="M33 31.5l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" />
    </svg>
  );
}
