import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  plugins: [createHtmlPlugin({
    inject: {
      injectOptions: {
        tags: [
          {
            tag: 'script',
            attrs: {
              src: '/src/main.js',
            },
          },
          {
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: '/styles.css',
            },
          },
        ],
      },
    },
  })],
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});