import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    // Pin the hot-reload socket. When the dev server is reached through a proxy
    // the client cannot always infer its own port, and falls back to
    // "ws://localhost:undefined", which throws on every page load.
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 5173,
    },
  },
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


