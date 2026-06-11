import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: [
          'index.html',
          'manifest.webmanifest',
          'assets/*.js',   // pre-cache entry + all lazy vendor chunks (supabase, swr, idb, lucide…)
          'assets/*.css',
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
        icons: []
      }
    })
  ],
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
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('swr')) {
              return 'swr';
            }
            if (id.includes('idb-keyval')) {
              return 'idb';
            }
            if (id.includes('react-window')) {
              return 'react-window';
            }
            if (id.includes('lucide-react')) {
              return 'lucide';
            }
          }
        }
      }
    }
  },
}));
