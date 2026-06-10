import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom']
  },
  server: {
    // Ensure we're using HTTP instead of HTTPS for local development
    https: false,
    host: true,
    port: 5173,
    hmr: {
      overlay: false, // Disable the error overlay that appears when there's an error
    },
    open: true,  // Automatically open browser when server starts
    watch: {
      usePolling: true  // Use polling for more reliable file watching
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps in production for faster builds
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit to 1000 KB
    minify: 'esbuild', // Use esbuild for faster minification
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  // Optimize dependencies to avoid unnecessary re-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})