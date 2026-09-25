import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // pdfjs-dist (PDF a Word) necesita sus "standard fonts" (métricas de
    // fuentes como Helvetica) para extraer texto sin perder caracteres en
    // PDFs que usan fuentes estándar no incrustadas — se copian a un asset
    // público y se referencian como `standardFontDataUrl`. Así queda
    // sincronizado automáticamente si se actualiza pdfjs-dist más adelante.
    viteStaticCopy({
      targets: [{ src: 'node_modules/pdfjs-dist/standard_fonts/*', dest: 'pdfjs-standard-fonts' }],
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 usa funciones de Sass (red(), @import, etc.) que Dart
        // Sass ya marca como deprecadas de cara a Sass 3.0. Es un problema de
        // Bootstrap, no de nuestro theme.scss — `quietDeps` silencia avisos
        // que vienen de dependencias (node_modules), no los de código propio.
        quietDeps: true,
      },
    },
  },
})
