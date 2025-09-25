import { defineConfig } from "vite"
import { createHtmlPlugin } from "vite-plugin-html"

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/game-client" : "/",
  plugins: [
    createHtmlPlugin({
      inject: {
        injectOptions: {
          tags: [
            {
              tag: "script",
              attrs: {
                src: "/src/main.js",
              },
            },
            {
              tag: "link",
              attrs: {
                rel: "stylesheet",
                href: "/styles.css",
              },
            },
          ],
        },
      },
    }),
  ],
  server: {
    open: true,
  },
  build: {
    outDir: "dist",
  },
})
