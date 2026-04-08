/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
