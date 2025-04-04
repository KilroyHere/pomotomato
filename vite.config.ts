import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/pomotomato/', // For GitHub Pages deployment
  plugins: [react()],
  build: {
    assetsInlineLimit: 0, // Keep small assets as separate files
    rollupOptions: {
      // Make sure env files are treated as external
      external: ['env.js', 'env.template.js'],
    },
  },
})
