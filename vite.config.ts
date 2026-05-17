import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Production-grade minification
    minify: 'esbuild',
    cssMinify: true,
    
    // 2. Aggressive Chunk Splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-fb';
            if (id.includes('lucide-react')) return 'vendor-ico';
            if (id.includes('react-router') || id.includes('remix-run')) return 'vendor-router';
            if (id.includes('react-dom')) return 'vendor-react-dom';
            return 'vendor-core';
          }
        },
        // Better naming for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // 3. Performance & Stability
    chunkSizeWarningLimit: 600,
    reportCompressedSize: false, // Speeds up builds
    sourcemap: false,
    
    // 4. Asset handling
    assetsInlineLimit: 2048, // Inline very small assets only
  },
  // Optimize CSS with LightningCSS
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        android: 80 << 16,
        chrome: 90 << 16,
      }
    }
  },
  server: {
    host: true,
    hmr: { overlay: false }
  },
  optimizeDeps: {
    include: [
      'firebase/app', 
      'firebase/auth', 
      'firebase/firestore',
      'firebase/messaging', 
      'react-router-dom', 
      'react-hot-toast',
      'lucide-react'
    ]
  }
})
