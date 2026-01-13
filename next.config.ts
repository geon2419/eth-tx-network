import type { NextConfig } from "next";

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
};

export default nextConfig;
