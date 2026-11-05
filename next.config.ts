import type { NextConfig } from "next";

// The site is exported to plain HTML in `out/` and uploaded to static hosting.
// `trailingSlash` makes every route a folder with an index.html, which Apache-style
// hosts serve without any rewrite rules.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
