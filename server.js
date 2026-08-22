const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8788;
const PUBLIC_DIR = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let pathname = new URL(req.url, 'http://localhost').pathname;

  if (pathname === '/') {
    pathname = 'index.html';
  } else {
    pathname = pathname.replace(/^\/+/, '');
  }

  const filePath = path.join(PUBLIC_DIR, pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream'
    });

    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`VRF Field Service Guide running on port ${PORT}`);
});
