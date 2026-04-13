import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Serve wwwroot as static during dev (css, assets)
  publicDir: '../wwwroot',
  build: {
    outDir: '../wwwroot',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5006',
        changeOrigin: true,
      },
      '/hub': {
        target: 'http://localhost:5006',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
