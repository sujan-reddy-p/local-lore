import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep local and Vercel tracing scoped to this standalone project. A separate
  // lockfile elsewhere in the user's home directory must not widen the build root.
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  allowedDevOrigins:["127.0.0.1"],
};

export default nextConfig;
