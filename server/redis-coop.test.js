const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCoop } = require('./coop');
const { randomUUID } = require('node:crypto');
const { createRedisCoop, createRedisCommand } = require('./redis-coop');
const handler = require('../api/coop');

function world() {
  return { map: Array.from({ length: 15 }, () => Array(23).fill(0)), start: { x: 1, y: 1 },
    exitCell: { x: 10, y: 10 }, crystals: [{ x: 2, y: 1, done: false }],
    pickups: [{ x: 4, y: 1, type: 'oil' }], needed: 1, totalMines: 2, city: { name: 'Кардымово', km: 32 } };
}

test('ожидание второго игрока останавливает игровые действия на сервере', () => {
  const coop = createCoop();
  const a = coop.handle({ action: 'join', world: world() }, randomUUID);
  const act = (action, extra = {}) => coop.handle({ action, id: a.id, token: a.token, level: 1, ...extra }, randomUUID);
  assert.equal(act('lock', { index: 0 }).allowed, false);
  assert.equal(act('pickup', { x: 4, y: 1 }).pickup, null);
  assert.equal(act('sync', { x: 5, y: 5 }).session.players[0].x, 1);
  const b = coop.handle({ action: 'join' }, randomUUID);
  assert.equal(act('lock', { index: 0 }).allowed, true);
  coop.handle({ action: 'leave', id: b.id, token: b.token }, randomUUID);
  assert.equal(act('answer', { index: 0, ok: true }).session.runOre, 0);
  assert.equal(act('release', { index: 0 }).session.world.crystals[0].owner, undefined);
});

test('независимые экземпляры функции разделяют сессию без потери параллельных изменений', async () => {
  let stored = null, conflicts = 0;
  const command = async args => {
    await Promise.resolve();
    if (args[0] === 'GET') return stored;
    assert.equal(args[0], 'EVAL');
    if ((stored || '') !== args[4]) { conflicts++; return 0; }
    stored = args[5]; return 1;
  };
  const first = createRedisCoop({ command }), second = createRedisCoop({ command });
  const [a, b] = await Promise.all([first.handle({ action: 'join', world: world() }), second.handle({ action: 'join', world: world() })]);
  assert.equal(a.session.id, b.session.id);
  assert.ok(conflicts > 0);
  const act = (player, action, extra = {}) => createRedisCoop({ command }).handle({ action, id: player.id, token: player.token, level: 1, ...extra });
  const snapshot = await act(a, 'sync');
  assert.equal(snapshot.session.players.length, 2);
  const locks = await Promise.all([act(a, 'lock', { index: 0 }), act(b, 'lock', { index: 0 })]);
  assert.equal(locks.filter(result => result.allowed).length, 1);
  const winner = locks[0].allowed ? a : b;
  const answer = await act(winner, 'answer', { index: 0, ok: true });
  assert.equal(answer.session.runOre, 1);
  assert.ok(answer.session.players.every(player => !player.token));
  assert.equal((await act(a, 'sync')).session.runOre, 1);
});

test('ошибка настройки хранилища понятна; REST-команды проверяют ответы', async () => {
  assert.throws(() => createRedisCommand({}), /Upstash Redis/);
  const command = createRedisCommand({ UPSTASH_REDIS_REST_URL: 'https://example.test', UPSTASH_REDIS_REST_TOKEN: 'test' }, async (url, request) => {
    assert.equal(request.headers.Authorization, 'Bearer test');
    assert.deepEqual(JSON.parse(request.body), ['GET', 'key']);
    return { ok: true, json: async () => ({ result: 'value' }) };
  });
  assert.equal(await command(['GET', 'key']), 'value');
});

test('обработчик Vercel всегда возвращает JSON при неверном методе и запросе', async () => {
  async function invoke(req) {
    const headers = {}; let response;
    const res = { setHeader: (name, value) => { headers[name] = value; }, end: body => { response = JSON.parse(body); } };
    await handler({ headers: { host: 'game.example' }, ...req }, res);
    assert.equal(headers['Content-Type'], 'application/json; charset=utf-8');
    return { status: res.statusCode, body: response };
  }
  assert.equal((await invoke({ method: 'GET' })).status, 405);
  assert.equal((await invoke({ method: 'POST', body: '{' })).status, 400);
  assert.equal((await invoke({ method: 'POST', body: [] })).status, 400);
  assert.equal((await invoke({ method: 'POST', headers: { host: 'game.example', origin: 'https://other.example' } })).status, 403);
});
