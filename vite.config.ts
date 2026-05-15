import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Minification for smaller bundle
    minify: 'esbuild',
    cssMinify: true,
    
    // 2. Reduce chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // 3. Rollup options for better chunking (Vendor splitting)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split heavy dependencies into their own chunks for better caching
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    },
    
    // 4. Source maps are heavy, disable in production for speed
    sourcemap: false,
    
    // 5. Assets inlining limit (small icons stay in CSS)
    assetsInlineLimit: 4096,
  },
  // Optimize CSS for mobile performance
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        android: 90 << 16, // Optimize for modern Android browsers
      }
    }
  }
})
