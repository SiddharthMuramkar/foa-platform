// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
import type { Metadata } from "next";
import "./globals.css";

// No fonts here on purpose: each variant loads its own (next/font, ≤ 2 weights, NFR-01).
export const metadata: Metadata = {
  title: "FOA prototypes",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
