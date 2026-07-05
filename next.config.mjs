/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this folder (a stray lockfile in the parent
  // dir otherwise confuses Next's root inference).
  outputFileTracingRoot: import.meta.dirname,
  // webgazer touches browser globals; it is only ever imported dynamically
  // on the client, so no special transpile config is required here.
};

export default nextConfig;
