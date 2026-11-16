// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stop `next dev` from writing apps/web/AGENTS.md into the prototype tree.
  agentRules: false,
  // inline-logo.tsx reads the logo SVG from public/ at request time (the route is dynamic),
  // so the serverless trace must include it.
  outputFileTracingIncludes: {
    "/prototype/logo-scroll": ["./public/brand/**/*"],
  },
};

export default nextConfig;
