import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js', // FORCES Vite to load  PostCSS configurations in production builds
  },
  server: {
    port: 3000,
    host: true
  }
})