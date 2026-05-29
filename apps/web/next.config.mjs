/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@about-fit/domain", "@about-fit/platform-presets"],
};

export default nextConfig;
