// Simple static file server using Node core modules only.
// Serves files from the dist/ folder (one level up from this src/ file).
// Optionally enable cross-origin isolation (COOP+COEP) by setting
// ENABLE_CROSS_ORIGIN_ISOLATION=1 in the environment before starting.

const http = require("http")
const fs = require("fs")
const path = require("path")
const url = require("url")

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174
const ROOT = path.resolve(__dirname, "..", "dist")
const ENABLE_COOP_COEP = !!process.env.ENABLE_CROSS_ORIGIN_ISOLATION

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
}

function safeJoin(root, reqPath) {
  const resolved = path.resolve(root, "." + reqPath)
  if (!resolved.startsWith(root)) return null
  return resolved
}

const server = http.createServer((req, res) => {
  try {
    const parsed = url.parse(req.url || "/")
    let pathname = decodeURIComponent(parsed.pathname || "/")

    // rewrite requests that use /game-client/assets/... to the actual /assets/... path
    if (pathname.startsWith("/game-client")) {
      pathname = pathname.replace("/game-client", "")
    }

    // normalize and default to index.html for directories or root
    if (pathname.endsWith("/")) pathname += "index.html"

    // If a pretty route without extension (e.g. /about), serve index.html
    const hasExt = path.extname(pathname) !== ""
    let filePath = safeJoin(ROOT, pathname)
    if (!filePath) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" })
      return res.end("400 - Bad request")
    }

    // If file doesn't exist and request has no extension, fallback to index.html (SPA)
    if (!fs.existsSync(filePath)) {
      if (!hasExt) {
        filePath = path.join(ROOT, "index.html")
        if (!fs.existsSync(filePath)) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
          return res.end("404 - Not Found")
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
        return res.end("404 - Not Found")
      }
    }

    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      // serve index.html inside directory if present
      const indexFile = path.join(filePath, "index.html")
      if (fs.existsSync(indexFile)) {
        filePath = indexFile
      } else {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" })
        return res.end("403 - Forbidden")
      }
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME[ext] || "application/octet-stream"

    // Decide whether to enable cross-origin isolation for this request.
    // This can be enabled globally via the environment variable
    // ENABLE_CROSS_ORIGIN_ISOLATION=1, or per-request by sending
    // the query parameter `?cross_origin_isolation=1` or the request
    // header `X-Enable-Cross-Origin-Isolation: 1`.
    const enableCoopCoepForRequest =
      ENABLE_COOP_COEP ||
      // check header (case-insensitive) - raw headers are lower-level, so use req.headers
      (req.headers &&
        (req.headers["x-enable-cross-origin-isolation"] === "1" ||
          req.headers["x-enable-cross-origin-isolation"] === "true")) ||
      // check query param
      (parsed.query &&
        parsed.query.indexOf &&
        parsed.query.indexOf("cross_origin_isolation=1") !== -1) ||
      // fallback: check pathname query parsing (safe decode)
      (parsed.search &&
        parsed.search.indexOf("cross_origin_isolation=1") !== -1)

    const headers = {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Cache-Control":
        ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    }

    if (enableCoopCoepForRequest) {
      // These two headers (COOP + COEP) are required to enable
      // cross-origin isolation which in turn allows the use of
      // SharedArrayBuffer on the client.
      headers["Cross-Origin-Opener-Policy"] = "same-origin"
      headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    }

    // Support HEAD requests
    if (req.method === "HEAD") {
      res.writeHead(200, headers)
      return res.end()
    }

    res.writeHead(200, headers)
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
    stream.on("error", (err) => {
      console.error("Stream error:", err)
      if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" })
      res.end("500 - Internal Server Error")
    })
  } catch (err) {
    console.error("Server error:", err)
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
    }
    res.end("500 - Internal Server Error")
  }
})

server.listen(PORT, () => {
  console.log(`Static server for dist/ running at http://localhost:${PORT}/`)
  if (ENABLE_COOP_COEP) {
    console.log("Cross-origin isolation headers enabled (COOP+COEP).")
  } else {
    console.log(
      "To enable cross-origin isolation set ENABLE_CROSS_ORIGIN_ISOLATION=1"
    )
  }
})
