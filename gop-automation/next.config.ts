/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

