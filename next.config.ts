import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Turbopack-native alias to prevent pdfjs-dist from trying to load
  // the optional 'canvas' native module in the browser bundle.
  turbopack: {
    resolveAlias: {
      canvas: { browser: './lib/canvas-stub.ts' },
    },
  },
};

export default nextConfig;
