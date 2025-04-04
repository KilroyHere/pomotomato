import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/pomotomato/',
  plugins: [react()],
  // Make sure env.js is included in the build
  build: {
    assetsInlineLimit: 0, // Disable inlining assets
    rollupOptions: {
      // Preserve env.js as external resource
      external: ['env.js'],
    },
  },
})
