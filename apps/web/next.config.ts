// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NFR-01: AVIF first, WebP fallback.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Tailwind v4 via its dedicated loader (create-next-app 16.4 default) instead of @tailwindcss/postcss.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
