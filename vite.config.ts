import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — loaded on every page
          'vendor-react': ['react', 'react-dom'],
          // Router — small, shared across all pages
          'vendor-router': ['react-router-dom'],
          // Leaflet map library — heavy, only used by map-enabled dashboards
          'vendor-leaflet': ['leaflet'],
          // Lucide icons — tree-shakeable but still worth isolating
          'vendor-lucide': ['lucide-react'],
        },
      },
    },
  },
})


