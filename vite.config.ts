import path from 'node:path';
import { type Plugin, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Link previews (WhatsApp, Instagram, Facebook) only load absolute image URLs.
 * The site URL comes from SITE_URL or, on Vercel, the project's production domain.
 */
function absoluteShareImage(): Plugin {
  const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const site = (process.env.SITE_URL ?? (domain ? `https://${domain}` : '')).replace(/\/$/, '');
  return {
    name: 'absolute-share-image',
    transformIndexHtml: (html) => (site ? html.replaceAll('content="/icons/og.png"', `content="${site}/icons/og.png"`) : html),
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    absoluteShareImage(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      // the glob below already precaches the icons
      includeManifestIcons: false,
      manifest: {
        name: 'CalmabyEli',
        short_name: 'CalmabyEli',
        description:
          'Meditaciones guiadas, respiración y descanso para mujeres, de la mano de Eli. Bajá un cambio, soltá la autoexigencia y dormí mejor.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#17231f',
        theme_color: '#17231f',
        categories: ['health', 'lifestyle', 'medical'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Respirar', url: '/respirar', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Sesiones con Eli', url: '/eli', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Dormir', url: '/dormir', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Temporizador', url: '/temporizador', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        // Spanish only needs the latin subsets; social image isn't needed offline.
        globIgnores: ['**/*vietnamese*', '**/*latin-ext*', 'icons/og.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/audio\//, /^\/captions\//],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'mf-audio',
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 80 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/captions/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'mf-captions', expiration: { maxEntries: 120 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: { port: 3000, host: true },
  preview: { port: 4173, host: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
