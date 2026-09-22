import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: ['./src/styles'], // [NEW] biar bisa @use 'variables' tanpa path relatif panjang
      },
    },
  },
})
