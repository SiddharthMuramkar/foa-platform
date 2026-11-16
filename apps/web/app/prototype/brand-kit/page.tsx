// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// /prototype/brand-kit?variant=A|B|C[&theme=light|dark][&shot=1]
//   variant  which brief to show (default A)
//   theme    forces a theme for screenshots; default follows prefers-color-scheme
//   shot     1 = screenshot mode: hides the prototype switcher
import { Suspense, type ComponentType } from "react";
import type { Metadata } from "next";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { ThemeSync } from "./theme-sync";
import { kitAsset, type Theme, type VariantKey, type VariantProps } from "./fixtures";
import VariantA, { name as nameA } from "./variants/variant-a";
import VariantB, { name as nameB } from "./variants/variant-b";
import VariantC, { name as nameC } from "./variants/variant-c";

const VARIANTS: { key: "A" | "B" | "C"; dir: VariantKey; name: string; Component: ComponentType<VariantProps> }[] = [
  { key: "A", dir: "a", name: nameA, Component: VariantA },
  { key: "B", dir: "b", name: nameB, Component: VariantB },
  { key: "C", dir: "c", name: nameC, Component: VariantC },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function resolve(sp: Record<string, string | string[] | undefined>) {
  const key = (first(sp.variant) ?? "A").toUpperCase();
  const variant = VARIANTS.find((v) => v.key === key) ?? VARIANTS[0];
  const t = first(sp.theme);
  const theme: Theme | undefined = t === "light" || t === "dark" ? t : undefined;
  const shot = first(sp.shot) === "1";
  return { variant, theme, shot };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { variant } = resolve(await searchParams);
  const i16 = kitAsset(variant.dir, "icon16");
  const i32 = kitAsset(variant.dir, "icon32");
  const i180 = kitAsset(variant.dir, "icon180");
  return {
    title: `Brand kit ${variant.key} (${variant.name}) · FOA prototype`,
    description: "Throwaway prototype for issue #13: icons, OG card, watermark and stamp.",
    robots: { index: false, follow: false },
    icons: {
      icon: [
        { url: i16.src, sizes: "16x16", type: "image/png" },
        { url: i32.src, sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: i180.src, sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function BrandKitPage({ searchParams }: { searchParams: SearchParams }) {
  const { variant, theme, shot } = resolve(await searchParams);
  const { Component } = variant;

  return (
    <div
      data-theme={theme}
      data-variant={variant.key}
      data-shot={shot ? "1" : undefined}
      className="min-h-dvh bg-bk-bg text-bk-fg"
    >
      <ThemeSync theme={theme} />
      <Component theme={theme} shot={shot} />
      <Suspense fallback={null}>
        <PrototypeSwitcher variants={VARIANTS.map(({ key, name }) => ({ key, name }))} />
      </Suspense>
    </div>
  );
}
