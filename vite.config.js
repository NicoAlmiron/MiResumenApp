import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
