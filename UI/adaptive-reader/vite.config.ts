import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import path from 'path'

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
})
