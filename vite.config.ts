import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa: funciona igual en local y en GitHub Pages (/clase-e1598/)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Solo los paquetes en sí (no sus dependencias compartidas), para que
        // three / r3f / pdf.js se carguen de forma diferida.
        manualChunks(id) {
          if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'react'
          if (/\/node_modules\/(react|react-dom|scheduler|zustand|use-sync-external-store)\//.test(id)) return 'react'
          if (id.includes('/node_modules/three/')) return 'three'
          if (id.includes('/node_modules/@react-three/')) return 'r3f'
          if (id.includes('/node_modules/pdfjs-dist/')) return 'pdf'
        },
      },
    },
  },
})
