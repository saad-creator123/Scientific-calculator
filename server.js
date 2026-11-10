const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Default root to index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Sanitize path to prevent directory traversal
  const safeRelative = pathname.replace(/^(\.\.[\/\\])+/, '').replace(/^\/+/, '');
  let targetPath = path.resolve(__dirname, safeRelative);

  // Security boundary check
  if (!targetPath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(targetPath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(targetPath, 'index.html');
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (indexErr || !indexStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
          res.end('404 Not Found');
          return;
        }
        serveFile(res, indexPath);
      });
      return;
    }

    if (stats.isFile()) {
      serveFile(res, targetPath);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Scientific Calculator server running at:`);
  console.log(`  - Local:   http://localhost:${PORT}/`);
  console.log(`  - Network: http://127.0.0.1:${PORT}/`);
});
