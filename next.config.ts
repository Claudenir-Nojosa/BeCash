// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "raw.githubusercontent.com", "github.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    config.externals = [
      ...config.externals,
      { "@prisma/client": "@prisma/client" },
    ];

    // Adicione esta parte se estiver usando server actions
    if (isServer) {
      config.externals.push({
        "@prisma/client": "@prisma/client",
      });
    }

    return config;
  },
};

export default nextConfig;
