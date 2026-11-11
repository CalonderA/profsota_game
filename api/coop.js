const { createRedisCoop, createRedisCommand } = require('../server/redis-coop');

// Обработчик Vercel: состояние общее для всех экземпляров функции.
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
  if (req.method !== 'POST') return send(405, { error: 'Требуется POST' });
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== host) return send(403, { error: 'Другой источник запроса' }); }
    catch { return send(403, { error: 'Некорректный источник запроса' }); }
  }
  try {
    let input = req.body;
    if (input === undefined) {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 65536) return send(413, { error: 'Слишком большой запрос' });
      }
      input = body;
    }
    if (Buffer.isBuffer(input)) input = input.toString('utf8');
    if (typeof input === 'string') {
      if (Buffer.byteLength(input) > 65536) return send(413, { error: 'Слишком большой запрос' });
      try { input = JSON.parse(input); }
      catch { return send(400, { error: 'Некорректный запрос' }); }
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return send(400, { error: 'Некорректный запрос' });
    const coop = createRedisCoop({ command: createRedisCommand(), key: process.env.COOP_STORAGE_KEY || 'profsota:coop:v1' });
    return send(200, await coop.handle(input));
  } catch (error) {
    return send(error.status || 503, { error: error.status ? error.message : 'Сервер совместной игры временно недоступен. Попробуйте ещё раз.' });
  }
};
