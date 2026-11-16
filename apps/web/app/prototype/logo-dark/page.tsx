// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// /prototype/logo-dark?variant=A|B|C[&theme=light|dark][&shot=1]
//   theme: forces a theme for screenshots; default follows prefers-color-scheme (SPEC §4.8).
//   shot=1: hides the prototype switcher.
import type { Metadata } from "next";
import { Suspense } from "react";
import PrototypeSwitcher from "@/components/prototype-switcher";
import type { ThemeSetting } from "./fixtures";
import VariantA, { name as nameA } from "./variants/variant-a";
import VariantB, { name as nameB } from "./variants/variant-b";
import VariantC, { name as nameC } from "./variants/variant-c";

export const metadata: Metadata = {
  title: "Logo on dark backgrounds — prototype #14",
  robots: { index: false, follow: false },
};

const VARIANTS = [
  { key: "A", name: nameA, Component: VariantA },
  { key: "B", name: nameB, Component: VariantB },
  { key: "C", name: nameC, Component: VariantC },
] as const;

const SWITCHER_VARIANTS = VARIANTS.map(({ key, name }) => ({ key, name }));

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LogoDarkPrototype({ searchParams }: PageProps<"/prototype/logo-dark">) {
  const params = await searchParams;
  const requested = first(params.variant)?.toUpperCase();
  const active = VARIANTS.find((v) => v.key === requested) ?? VARIANTS[0];
  const themeParam = first(params.theme);
  const theme: ThemeSetting = themeParam === "light" || themeParam === "dark" ? themeParam : "system";
  const shot = first(params.shot) === "1";
  const { Component } = active;

  return (
    <div
      data-theme={theme}
      data-variant={active.key}
      className="proto-root min-h-dvh bg-canvas font-sans text-ink"
    >
      <Component theme={theme} shot={shot} />
      <Suspense fallback={null}>
        <PrototypeSwitcher variants={SWITCHER_VARIANTS} current={active.key} />
      </Suspense>
    </div>
  );
}
