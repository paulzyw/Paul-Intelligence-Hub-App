import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    publicDir: 'public', 


    
    plugins: [react(), tailwindcss()],
    
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'motion/react',
        'lucide-react',
        '@supabase/supabase-js',
        'ogl',
        'recharts',
        'date-fns',
        'dompurify',
        'clsx',
        'tailwind-merge',
        'react-markdown'
      ],
    },
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      copyPublicDir: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      target: 'es2020',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Heavy editor dependencies (TipTap, TinyMCE, lowlight syntax highlighting)
              if (
                id.includes('@tiptap') || 
                id.includes('@tinymce') || 
                id.includes('lowlight') || 
                id.includes('highlight.js') ||
                id.includes('react-quill')
              ) {
                return 'vendor-editor';
              }
              // PDF compilation engine
              if (id.includes('pagedjs')) {
                return 'vendor-pagedjs';
              }
              // Data visualization & charts
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              // 3D WebGL library
              if (id.includes('ogl')) {
                return 'vendor-ogl';
              }
              // Supabase ecosystem
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              // Animation library
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              // Lucide icons
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              // Core React framework
              if (
                id.includes('react-router') || 
                id.includes('react-dom') || 
                id.includes('/react/')
              ) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },

    server: {
      cors: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
