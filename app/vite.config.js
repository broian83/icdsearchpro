import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,md}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10MB to accommodate icd10.json
      },
      manifest: {
        name: 'ICD Search Pro',
        short_name: 'ICD Search',
        description: 'Smart Offline ICD-10 & ICD-9 Search',
        theme_color: '#00B4A4',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
