/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./plans/**/*.md", "./data/**/*.json"],
    },
  },
};

export default nextConfig;
