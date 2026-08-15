import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    command === 'build' && compression({ algorithm: 'brotliCompress', exclude: [/\.(br)$/, /\.(gz)$/] }),
    command === 'build' && compression({ algorithm: 'gzip', exclude: [/\.(br)$/, /\.(gz)$/] }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}'
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/functions/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 * 7, // 7 days
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: ({ url }) => url.host === 'api.mfapi.in',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'amfi-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      manifest: {
        name: 'Family Wealth Tracker',
        short_name: 'WealthTracker',
        description: 'Secure and modern Family Portfolio Tracker and Wealth Dashboard.',
        theme_color: '#3b82f6',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ].filter(Boolean),
  base: command === 'serve' ? '/' : '/finance/',
  esbuild: command === 'serve' ? {} : {
    pure: ['console.log', 'console.info', 'console.debug', 'console.trace'],
    drop: ['debugger'],
  },
  build: {
    target: 'es2020',           // ~10-15% smaller output; modern mobile supports all ES2020 features
    cssMinify: true,            // deduplicate CSS selectors across chunks
    reportCompressedSize: false, // skip gzip sizing step to speed up builds
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') && !id.includes('react-router') && !id.includes('react-window')) {
              return 'vendor-react';
            }
            if (id.includes('react-router') || id.includes('@remix-run/router')) {
              return 'vendor-router';
            }
            if (id.includes('react-window')) {
              return 'vendor-virtualize';
            }
            if (id.includes('swr') || id.includes('idb-keyval')) {
              return 'vendor-utils';
            }
          }
        }
      }
    }
  },
}));
