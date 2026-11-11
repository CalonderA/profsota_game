// Сервер игры и общего совместного прохождения. Дополнительные зависимости не нужны.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID } = require('crypto');
const { createCoop } = require('./server/coop');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8787;
const coop = createCoop();
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const json = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  let url;
  try { url = new URL(req.url, 'http://' + req.headers.host); }
  catch { return json(400, { error: 'Некорректный адрес' }); }
  if (url.pathname === '/api/coop') {
    if (req.method !== 'POST') return json(405, { error: 'Требуется POST' });
    if (req.headers.origin && req.headers.origin !== url.origin) return json(403, { error: 'Другой источник запроса' });
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 65536) return json(413, { error: 'Слишком большой запрос' });
      }
      return json(200, coop.handle(JSON.parse(body), randomUUID));
    } catch (err) { return json(err.status || 400, { error: err.status ? err.message : 'Некорректный запрос' }); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(405, { error: 'Метод не поддерживается' });
  let p;
  try { p = decodeURIComponent(url.pathname); } catch { return json(400, { error: 'Некорректный адрес' }); }
  if (!['/', '/index.html', '/questions.json'].includes(p) && !p.startsWith('/assets/')) return json(404, { error: 'Файл не найден' });
  if (p === '/') p = '/index.html';
  const file = path.resolve(ROOT, '.' + p);
  const relative = path.relative(ROOT, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return json(403, { error: 'Доступ запрещён' });
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Не найдено: ' + p);
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});
if (require.main === module) server.listen(PORT, '0.0.0.0', () => {
  console.log('Шахта Знаний: http://127.0.0.1:' + PORT + '/');
  for (const addresses of Object.values(os.networkInterfaces())) for (const address of addresses || []) {
    if (address.family === 'IPv4' && !address.internal) console.log('Для телефонов в той же Wi-Fi сети: http://' + address.address + ':' + PORT + '/');
  }
});
module.exports = { server, coop };
