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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
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
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
