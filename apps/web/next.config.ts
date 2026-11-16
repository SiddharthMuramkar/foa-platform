// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NFR-01: AVIF/WebP for raster images served through next/image.
  images: { formats: ["image/avif", "image/webp"] },
  // Keep dev screenshots clean (the prototype switcher is the only overlay).
  devIndicators: false,
  // Don't let `next dev` (run by agents) drop an AGENTS.md into the throwaway app.
  agentRules: false,
};

export default nextConfig;
