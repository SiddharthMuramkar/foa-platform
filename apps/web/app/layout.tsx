// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// SPEC §4.8 / NFR-01: Plus Jakarta Sans, self-hosted by next/font, two weights max.
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "FOA prototypes",
  description: "Throwaway prototypes for FOA platform decisions. Never merge.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${jakarta.variable} antialiased`}>
      <body className="min-h-dvh bg-surface font-sans text-ink">{children}</body>
    </html>
  );
}
