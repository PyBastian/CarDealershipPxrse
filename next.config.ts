import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  images: { formats: ["image/avif", "image/webp"] }
};

export default nextConfig;
