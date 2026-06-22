import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const BACKEND_URL = process.env.API_INTERNAL_URL ?? "http://localhost:8001/api/v1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["lh3.googleusercontent.com", "localhost"],
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
