/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This keeps things simple for both Vercel and Render.
  // If you later want a smaller Docker image or custom server, you can set output: 'standalone'.
  // output: 'standalone',
};

module.exports = nextConfig;
