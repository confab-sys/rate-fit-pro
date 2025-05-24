import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true, // Listen on all local IPs
    port: 3002, // Use port 3002
    strictPort: false, // Try another port if 3001 is taken
    open: true // Open browser on start
  },
  base: '/',
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  publicDir: 'public',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'My PWA App',
        short_name: 'PWA',
        start_url: '/',
        display: 'standalone',
        background_color: '#0D1B2A',
        theme_color: '#2ECC71',
        icons: [
          {
            src: '/pwa-icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
