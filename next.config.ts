import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      '@tanstack/react-query',
      'lucide-react',
      'date-fns',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configurações para permitir carregamento de scripts externos (Memed e Firebase)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self' https://*.vercel.app; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.vercel.app https://integrations.memed.com.br https://partners.memed.com.br https://prescricao.memed.com.br https://cdn.memed.com.br https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.vercel.app; " +
              "img-src 'self' data: https: blob:; " +
              "font-src 'self' data: https://fonts.gstatic.com; " +
              "connect-src 'self' blob: https://*.vercel.app https://viacep.com.br https://integrations.memed.com.br https://integrations.api.memed.com.br https://partners.memed.com.br https://prescricao.memed.com.br https://api.memed.com.br https://sherlock-api.memed.com.br https://rudderstack.memed.com.br https://cdn.memed.com.br https://firebasestorage.googleapis.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://*.agora.io wss://*.agora.io https://*.edge.agora.io wss://*.edge.agora.io https://*.sd-rtn.com wss://*.sd-rtn.com https://*.edge.sd-rtn.com wss://*.edge.sd-rtn.com https://www.googletagmanager.com https://www.google-analytics.com; " +
              "script-src-elem 'self' 'unsafe-inline' blob: https://*.vercel.app https://integrations.memed.com.br https://partners.memed.com.br https://prescricao.memed.com.br https://cdn.memed.com.br https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com; " +
              "worker-src 'self' blob: https://*.vercel.app; " +
              "frame-src 'self' https://*.vercel.app https://integrations.memed.com.br https://partners.memed.com.br https://prescricao.memed.com.br https://*.firebaseapp.com; " +
              "frame-ancestors 'self';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
