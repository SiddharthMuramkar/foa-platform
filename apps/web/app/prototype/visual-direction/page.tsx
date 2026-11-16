// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// /prototype/visual-direction?variant=A|B|C[&theme=light|dark][&shot=1]
//   variant  which home-page take to render (default A)
//   theme    forces a theme for screenshots; default follows prefers-color-scheme
//   shot     1 hides the prototype switcher
import type { Metadata } from "next";
import { Suspense } from "react";
import PrototypeSwitcher from "@/components/prototype-switcher";
import VariantA, { name as nameA } from "./variants/variant-a";
import VariantB, { name as nameB } from "./variants/variant-b";
import VariantC, { name as nameC } from "./variants/variant-c";

export const metadata: Metadata = {
  title: "Visual direction prototype · FOA #8",
  robots: { index: false, follow: false },
};

const VARIANTS = [
  { key: "A", name: nameA, Component: VariantA },
  { key: "B", name: nameB, Component: VariantB },
  { key: "C", name: nameC, Component: VariantC },
];

type Theme = "light" | "dark" | "system";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VisualDirectionPage({
  searchParams,
}: PageProps<"/prototype/visual-direction">) {
  const params = await searchParams;
  const requested = (first(params.variant) ?? "A").toUpperCase();
  const current = VARIANTS.find((v) => v.key === requested) ?? VARIANTS[0];
  const themeParam = first(params.theme);
  const theme: Theme = themeParam === "light" || themeParam === "dark" ? themeParam : "system";
  const shot = first(params.shot) === "1";
  const { Component } = current;

  return (
    <div data-theme={theme} data-variant={current.key.toLowerCase()} className="min-h-dvh">
      <Component />
      {shot ? null : (
        <Suspense fallback={null}>
          <PrototypeSwitcher variants={VARIANTS.map(({ key, name }) => ({ key, name }))} />
        </Suspense>
      )}
    </div>
  );
}
