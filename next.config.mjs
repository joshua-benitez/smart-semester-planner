/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  typescript: {
    // Type checking is handled by separate script
    ignoreBuildErrors: false
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'hooks']
  }
}

export default nextConfig