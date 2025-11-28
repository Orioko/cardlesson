import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';
import { join } from 'path';
import { defineConfig } from 'vite';

const copy404Plugin = () => {
  return {
    name: 'copy-404',
    closeBundle() {
      try {
        const distPath = join(process.cwd(), 'dist');
        const indexPath = join(distPath, 'index.html');
        const notFoundPath = join(distPath, '404.html');
        copyFileSync(indexPath, notFoundPath);
        console.log('✅ 404.html created for GitHub Pages routing support');
      } catch (error) {
        console.error('❌ Failed to create 404.html:', error);
      }
    },
  };
};

export default defineConfig({
  base: '/cardlesson/',
  plugins: [react(), copy404Plugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-i18next')) {
              return 'react-vendor';
            }
            if (id.includes('primereact') || id.includes('primeicons')) {
              return 'prime-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('i18next')) {
              return 'i18n-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
