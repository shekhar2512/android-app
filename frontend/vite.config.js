import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Thinkboard Notes App',
        short_name: 'Thinkboard',
        theme_color: '#FFA500', 
        background_color: '#1E1E1E',
        display: 'standalone', 
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        shortcuts: [
          {
            name: "Create New Note",
            short_name: "New Note",
            description: "Quickly write a new thought",
            url: "/create", // Where the app should open when they tap this
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          },
         // ADD THIS SECOND SHORTCUT HERE:
          {
            name: "Search Notes",
            short_name: "Search",
            description: "Find an existing note",
            url: "/?action=search", 
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      },
      
      // ADD THIS NEW WORKBOX SECTION:
      workbox: {
        runtimeCaching: [
          {
            // Tell it to intercept any requests going to your Render API
            urlPattern: /^https:\/\/thinkbooardd\.onrender\.com\/api\/.*/i,
            // Use the NetworkFirst strategy
            handler: 'NetworkFirst',
            options: {
              cacheName: 'thinkboard-api-cache',
              expiration: {
                maxEntries: 50, // Keep the last 50 requests
                maxAgeSeconds: 60 * 60 * 24 * 7 // Keep them for 1 week
              },
              cacheableResponse: {
                statuses: [0, 200] // Only cache successful responses
              }
            }
          }
        ]
      }
    })
  ],
})