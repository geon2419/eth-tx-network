import type { NextConfig } from "next";

const hasSourceMaps = process.env.SOURCE_MAPS === "true";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.wgsl": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  reactCompiler: true,
  productionBrowserSourceMaps: hasSourceMaps,
  experimental: {
    optimizePackageImports: ["echarts"],
  },
};

export default nextConfig;
