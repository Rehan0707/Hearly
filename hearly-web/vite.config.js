import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-vendor',
              test: /node_modules[\\/](?:three|@react-three[\\/]fiber)[\\/]/,
              minSize: 0,
              maxSize: 350_000,
              priority: 30,
            },
            {
              name: 'motion-vendor',
              test: /node_modules[\\/](?:framer-motion|motion)[\\/]/,
              minSize: 20_000,
              priority: 20,
            },
            {
              name: 'gsap-vendor',
              test: /node_modules[\\/]gsap[\\/]/,
              minSize: 20_000,
              priority: 20,
            },
            {
              name: 'supabase-vendor',
              test: /node_modules[\\/]@supabase[\\/]/,
              minSize: 20_000,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              minSize: 20_000,
              priority: 0,
            },
          ],
        },
      },
    },
  },
})
