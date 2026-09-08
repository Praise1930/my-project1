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
        // Vite 8 bundles with Rolldown, which takes manualChunks as a
        // function rather than the object map Rollup accepted. Same split as
        // before: the heavy, rarely-changing vendor code is separated from app
        // code so a release does not invalidate it in everyone's cache.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (/[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/.test(id)) return 'vendor-router';
          if (/[\\/]node_modules[\\/]leaflet[\\/]/.test(id)) return 'vendor-leaflet';
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'vendor-lucide';
        },
      },
    },
  },
})


