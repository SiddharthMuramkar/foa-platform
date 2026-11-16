// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// /prototype/logo-scroll?variant=A|B|C[&theme=light|dark][&shot=1]
import type { Metadata } from "next";
import { Suspense } from "react";
import PrototypeSwitcher from "@/components/prototype-switcher";
import VariantA, { name as nameA } from "./variants/variant-a";
import VariantB, { name as nameB } from "./variants/variant-b";
import VariantC, { name as nameC } from "./variants/variant-c";

export const metadata: Metadata = {
  title: "Logo scroll interaction · prototype #9",
  robots: { index: false, follow: false },
};

const VARIANTS = [
  { key: "A", name: nameA, Component: VariantA },
  { key: "B", name: nameB, Component: VariantB },
  { key: "C", name: nameC, Component: VariantC },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LogoScrollPrototype({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const key = first(sp.variant)?.toUpperCase();
  const variant = VARIANTS.find((v) => v.key === key) ?? VARIANTS[0];
  const themeParam = first(sp.theme);
  const theme = themeParam === "light" || themeParam === "dark" ? themeParam : undefined;
  const shot = first(sp.shot) === "1";
  const { Component } = variant;

  return (
    // No overflow on this wrapper: it would break position: sticky and scroll(root) timelines.
    <div id="top" data-theme={theme} data-variant={variant.key} className="min-h-dvh bg-surface font-sans text-ink">
      <Component key={variant.key} />
      {!shot && (
        <Suspense fallback={null}>
          <PrototypeSwitcher variants={VARIANTS.map(({ key: k, name }) => ({ key: k, name }))} />
        </Suspense>
      )}
    </div>
  );
}
