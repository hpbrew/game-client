import { defineConfig } from "vite"
import { createHtmlPlugin } from "vite-plugin-html"

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/game-client/" : "/",
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
  resolve: {
    alias: {
      "/shared": "/src/shared",
      "/entities": "/src/entities",
      "/objects": "/src/objects",
      "/scenes": "/src/scenes",
      "/resources": "/src/not_my_resources",
    },
  },
  server: {
    open: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build: {
    outDir: "dist",
  },
})
