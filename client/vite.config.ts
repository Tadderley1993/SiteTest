import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import sitemap from 'vite-plugin-sitemap'

const PUBLIC_ROUTES = [
  '/',
  '/why-choose-me',
  '/about',
  '/services',
  '/portfolio',
  '/case-studies',
  '/demo/fintech',
  '/demo/restaurant',
  '/demo/product',
]

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://designsbyta.com',
      dynamicRoutes: PUBLIC_ROUTES,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
  },
  build: {
    rollupOptions: {
      external: ['html2pdf.js'],
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
