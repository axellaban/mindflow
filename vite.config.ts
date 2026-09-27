import path from 'node:path';
import { type Plugin, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/** The public site URL: SITE_URL or, on Vercel, the project's production domain. */
const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = (process.env.SITE_URL ?? (domain ? `https://${domain}` : '')).replace(/\/$/, '');

/** Link previews (WhatsApp, Instagram, Facebook) only load absolute image URLs. */
function absoluteShareImage(): Plugin {
  return {
    name: 'absolute-share-image',
    transformIndexHtml: (html) => (site ? html.replaceAll('content="/icons/og.png"', `content="${site}/icons/og.png"`) : html),
  };
}

/**
 * robots.txt and sitemap.xml, plus a copy of the page for /eli with her own title, description
 * and preview image: Eli shares that link from Instagram and WhatsApp, whose previews don't run JS.
 */
function sitePages(): Plugin {
  return {
    name: 'site-pages',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ''}` });
      if (site) {
        const urls = ['/', '/eli'].map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n');
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        });
      }
      const index = bundle['index.html'];
      if (!index || index.type !== 'asset') return;
      const title = 'Sesiones 1:1 con Eli · CalmabyEli';
      const description = 'Mindfulness para mujeres, online y a tu medida: bajá un cambio, soltá la autoexigencia y descansá de verdad. Agendá tu sesión con Eli.';
      const eli = String(index.source)
        .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
        .replace(/(<meta\s+name="description"\s+content=")[^"]*"/, `$1${description}"`)
        .replace(/(<meta\s+property="og:title"\s+content=")[^"]*"/, `$1${title}"`)
        .replace(/(<meta\s+property="og:description"\s+content=")[^"]*"/, `$1${description}"`)
        .replace(/(<meta\s+property="og:image:alt"\s+content=")[^"]*"/, '$1Eli Curcio, profesora de mindfulness: sesiones 1:1 online."')
        .replaceAll('/icons/og.png"', '/icons/og-eli.jpg"')
        .replace('</head>', site ? `  <meta property="og:url" content="${site}/eli" />\n    <link rel="canonical" href="${site}/eli" />\n  </head>` : '</head>');
      // and it starts loading Eli's screen and photo right away instead of after the app boots
      const page = Object.values(bundle).find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith('/src/pages/EliPage.tsx'));
      const early =
        page && page.type === 'chunk'
          ? [page.fileName, ...page.imports]
              .filter((f) => !eli.includes(`/${f}"`))
              .map((f) => `<link rel="modulepreload" crossorigin href="/${f}">`)
          : [];
      early.push('<link rel="preload" as="image" href="/eli/eli.webp" fetchpriority="high">');
      this.emitFile({ type: 'asset', fileName: 'eli/index.html', source: eli.replace('</head>', `  ${early.join('\n    ')}\n  </head>`) });
    },
  };
}

/**
 * First paint without waiting for anything: the stylesheet moves below the HTML's loading screen
 * (so the screen shows as soon as the page arrives, while scripts still wait for the styles) and
 * the two fonts every screen uses start downloading right away.
 */
function fastFirstPaint(): Plugin {
  return {
    name: 'fast-first-paint',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const fonts = Object.keys(ctx.bundle ?? {}).filter((f) => /(cormorant-garamond-latin-wght-normal|jost-latin-wght-normal)-[\w-]+\.woff2$/.test(f));
        const preload = fonts.map((f) => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin>`).join('\n    ');
        let out = html;
        const css = out.match(/\n?\s*<link rel="stylesheet"[^>]*>/);
        if (css && out.includes('<div id="root"></div>')) {
          out = out.replace(css[0], '').replace('<div id="root"></div>', `${css[0].trim()}\n    <div id="root"></div>`);
        }
        return preload ? out.replace('</head>', `  ${preload}\n  </head>`) : out;
      },
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    absoluteShareImage(),
    fastFirstPaint(),
    sitePages(),
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
        background_color: '#0f2330',
        theme_color: '#0f2330',
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
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}'],
        // Spanish only needs the latin subsets; social image isn't needed offline.
        globIgnores: ['**/*vietnamese*', '**/*latin-ext*', '**/*cyrillic*', 'icons/og*', 'eli/index.html'],
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
