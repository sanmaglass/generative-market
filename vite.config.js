import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB for AI model
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Generative Market',
        short_name: 'GenMarket',
        description: 'Crea imágenes de productos profesionales con IA en segundos',
        theme_color: '#060614',
        background_color: '#060614',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['@imgly/background-removal']
  },
  server: {
    // Accessible from phone on the same WiFi
    host: true,
    port: 5173,
    headers: {
      // Enable Cross-Origin Isolation → unlocks WASM multi-threading (3-4x faster AI)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
})
