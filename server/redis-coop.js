const { randomUUID } = require('crypto');
const { createCoop } = require('./coop');

// Проверка и запись выполняются атомарно, чтобы параллельные запросы не теряли прогресс.
const SAVE_STATE = `
local current = redis.call('GET', KEYS[1])
if (current or '') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', 120)
return 1
`;

function createRedisCoop({ command, key = 'profsota:coop:v1', now = Date.now, uuid = randomUUID }) {
  return { async handle(input) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const previous = await command(['GET', key]);
      const coop = createCoop({ now, state: previous ? JSON.parse(previous) : null });
      const result = coop.handle(input, uuid);
      const next = JSON.stringify(coop.exportState());
      if (await command(['EVAL', SAVE_STATE, 1, key, previous || '', next])) return result;
      // Небольшая задержка снижает число повторных столкновений запросов.
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 35));
    }
    throw Object.assign(new Error('Сервер занят. Попробуйте подключиться ещё раз.'), { status: 503 });
  } };
}

function createRedisCommand(env = process.env, fetchRequest = fetch) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) throw Object.assign(new Error('Совместная игра ещё не настроена: подключите Upstash Redis к проекту Vercel и выполните Redeploy.'), { status: 503 });
  if (!url.startsWith('https://')) throw Object.assign(new Error('Неверная настройка адреса хранилища.'), { status: 503 });
  return async args => {
    const response = await fetchRequest(url, { method: 'POST', headers: {
      Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'
    }, body: JSON.stringify(args), signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('Хранилище недоступно');
    const body = await response.json();
    if (body.error) throw new Error('Ошибка хранилища');
    return body.result;
  };
}
module.exports = { createRedisCoop, createRedisCommand };
