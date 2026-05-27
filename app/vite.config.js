import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      proxy: {
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => `/v1beta/models/gemini-3.5-flash:generateContent?key=${env.VITE_GEMINI_API_KEY}`
        }
      }
    },
    preview: {
      proxy: {
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => `/v1beta/models/gemini-3.5-flash:generateContent?key=${env.VITE_GEMINI_API_KEY}`
        }
      }
    },
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
        name: 'ICD Pro',
        short_name: 'ICD Pro',
        description: 'Smart Offline ICD-10 & ICD-9 Search',
        theme_color: '#00B4A4',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icdsearchpro_transparan.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icdsearchpro_transparan.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
  }
})
