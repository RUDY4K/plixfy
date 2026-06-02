import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
      {
        protocol: "https",
        hostname: "playgama.com",
      },
      {
        protocol: "https",
        hostname: "**.playgama.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "^plixfy\\.com$" }],
        destination: "https://www.plixfy.com/:path*",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;