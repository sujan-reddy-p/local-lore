import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.LOCAL_LORE_DIST_DIR ?? ".next",
  // Keep local and Vercel tracing scoped to this standalone project. A separate
  // lockfile elsewhere in the user's home directory must not widen the build root.
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  allowedDevOrigins:["127.0.0.1"],
  async headers() {
    return [{
      source: "/maps/:archive.pmtiles",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
};

export default nextConfig;
