// Serves the exported site from `out/` the way an Apache-style static host does:
// `/path/` resolves to `/path/index.html`, unknown paths get `404.html` with a real
// 404 status. Usage: `npm run preview` (after `npm run build`), then open
// http://localhost:4173/.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT ?? 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

if (!existsSync(root)) {
  console.error("No out/ folder. Run `npm run build` first.");
  process.exit(1);
}

function contentType(filePath) {
  // Mirrors the ForceType rule in public/.htaccess for the extension-less image.
  if (filePath.endsWith("opengraph-image")) return "image/png";
  return types[extname(filePath)] ?? "application/octet-stream";
}

function send(res, status, filePath) {
  res.writeHead(status, { "Content-Type": contentType(filePath) });
  createReadStream(filePath).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(root, safe);

  if (!filePath.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    if (!pathname.endsWith("/")) {
      res.writeHead(301, { Location: `${pathname}/${url.search}` }).end();
      return;
    }
    filePath = join(filePath, "index.html");
  }
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    send(res, 200, filePath);
    return;
  }
  const notFound = join(root, "404.html");
  if (existsSync(notFound)) {
    send(res, 404, notFound);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}).listen(port, () => {
  console.log(`Serving out/ at http://localhost:${port}/`);
});
