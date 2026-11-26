import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';
import { join } from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

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

// Content-Security-Policy для продакшн-сборки (на GitHub Pages заголовки задать нельзя, поэтому <meta>).
// Если на страницу и попадёт чужой скрипт, он не сможет загрузиться с другого сайта
// и не отправит токен входа никуда, кроме нашего API.
// В dev-режиме не включается: Vite там использует inline-скрипты.
const cspPlugin = (apiUrl: string): Plugin => {
  let apiOrigin = '';
  try {
    apiOrigin = new URL(apiUrl).origin;
  } catch {
    throw new Error(
      `VITE_API_URL должен быть адресом вида https://api.example.com, получено: "${apiUrl}"`
    );
  }
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    // PrimeReact задаёт часть стилей атрибутом style
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`
      );
    },
  };
};

export default defineConfig(({ mode }) => ({
  base: '/cardlesson/',
  plugins: [
    react(),
    copy404Plugin(),
    cspPlugin(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || 'http://localhost:8080'),
  ],
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
}));
