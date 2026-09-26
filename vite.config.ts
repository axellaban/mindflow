import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      // the glob below already precaches the icons
      includeManifestIcons: false,
      manifest: {
        name: 'MindFlow — Meditación y sueño',
        short_name: 'MindFlow',
        description:
          'Meditaciones guiadas, historias para dormir, respiración y paisajes sonoros para vivir con más calma.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#070B1E',
        theme_color: '#070B1E',
        categories: ['health', 'lifestyle', 'medical'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Respirar', url: '/respirar', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Dormir', url: '/dormir', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Temporizador', url: '/temporizador', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
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
