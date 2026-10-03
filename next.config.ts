import type { NextConfig } from "next";

// Static export: Firebase Hosting serves the generated `out/` folder.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
