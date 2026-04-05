import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@telemetry': fileURLToPath(new URL('../../telemetry', import.meta.url)),
      '@backend': path.resolve(__dirname, '../../backend/src'),
      '@nlp': path.resolve(__dirname, '../../nlp/src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    // Do NOT include pdfjs-dist here — it is huge and pre-bundling it causes OOM.
    // It is loaded lazily via dynamic import() in pdfParser.ts.
    exclude: ['pdfjs-dist'],
  },
})


