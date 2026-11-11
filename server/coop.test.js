const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createCoop } = require('./coop');
const { server } = require('../serve');

function world() {
  return { map: Array.from({ length: 15 }, () => Array(23).fill(0)), start: { x: 1, y: 1 },
    exitCell: { x: 10, y: 10 }, crystals: [{ x: 2, y: 1, done: false }, { x: 3, y: 1, done: false }],
    pickups: [{ x: 4, y: 1, type: 'oil' }], needed: 1, totalMines: 2, city: { name: 'Кардымово', km: 32 } };
}
function setup() {
  let time = 0;
  const coop = createCoop({ now: () => time });
  const call = data => JSON.parse(JSON.stringify(coop.handle(data, randomUUID)));
  const join = () => call({ action: 'join', world: world(), skin: 0 });
  const act = (player, action, extra = {}) => call({ id: player.id, token: player.token, level: 1, action, ...extra });
  return { call, join, act, tick: ms => { time += ms; } };
}

test('players share a world; credentials stay private; movement is synchronized', () => {
  const { join, act } = setup();
  const a = join(), b = join();
  assert.equal(a.session.id, b.session.id);
  assert.equal(b.session.players.length, 2);
  assert.ok(b.session.players.every(p => !p.token));
  const moved = act(a, 'sync', { x: 5, y: 6, dir: -1, score: 42, state: 'question' });
  assert.equal(moved.session.players[0].x, 5);
  assert.equal(act(b, 'sync').session.players[0].score, 42);
  assert.throws(() => act({ ...a, token: b.token }, 'sync'), /Подключение завершено/);
});

test('crystal ownership prevents double answers and failed answers release it', () => {
  const { join, act } = setup(); const a = join(), b = join();
  assert.equal(act(a, 'lock', { index: 0 }).allowed, true);
  assert.equal(act(b, 'lock', { index: 0 }).allowed, false);
  assert.equal(act(b, 'answer', { index: 0, ok: true }).session.runOre, 0);
  act(a, 'answer', { index: 0, ok: false });
  assert.equal(act(b, 'lock', { index: 0 }).allowed, true);
  assert.equal(act(b, 'answer', { index: 0, ok: true }).session.runOre, 1);
  assert.equal(act(b, 'answer', { index: 0, ok: true }).session.runOre, 1);
  assert.equal(act(a, 'lock', { index: 0 }).allowed, false);
});

test('pickup is granted once; level advances once even for simultaneous requests', () => {
  const { join, act } = setup(); const a = join(), b = join();
  assert.equal(act(a, 'pickup', { x: 4, y: 1 }).pickup.type, 'oil');
  assert.equal(act(b, 'pickup', { x: 4, y: 1 }).pickup, null);
  assert.equal(act(a, 'advance', { world: world() }).session.level, 1);
  act(a, 'lock', { index: 0 }); act(a, 'answer', { index: 0, ok: true });
  const next = act(a, 'advance', { world: world() });
  assert.equal(next.session.level, 2);
  assert.equal(act(b, 'advance', { world: world() }).session.level, 2);
  act(a, 'lock', { index: 0, level: 2 }); act(a, 'answer', { index: 0, ok: true, level: 2 });
  assert.equal(act(a, 'advance', { level: 2 }).session.finished, true);
});

test('late join gets progress; disconnect frees locks; empty session resets', () => {
  const { join, act, tick } = setup(); const a = join(); join();
  act(a, 'lock', { index: 0 }); act(a, 'answer', { index: 0, ok: true });
  act(a, 'lock', { index: 1 });
  const b = join(); assert.equal(b.session.runOre, 1);
  tick(10000); act(b, 'sync'); tick(6000);
  const teammate = join();
  assert.equal(act(b, 'lock', { index: 1 }).allowed, true);
  act(teammate, 'leave');
  act(b, 'leave');
  const c = join(); assert.notEqual(c.session.id, a.session.id); assert.equal(c.session.runOre, 0);
});

test('capacity and malformed world validation', () => {
  const { join, call } = setup();
  assert.throws(() => call({ action: 'join', world: {} }), /Некорректная карта/);
  for (let n = 0; n < 8; n++) join();
  assert.throws(join, /8 мест/);
});

test('HTTP API, malformed URLs and private files', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    assert.equal((await fetch(base + '/')).status, 200);
    assert.equal((await fetch(base + '/%ZZ')).status, 400);
    assert.equal((await fetch(base + '/.git/config')).status, 404);
    assert.equal((await fetch(base + '/server/coop.js')).status, 404);
    assert.equal((await fetch(base + '/api/coop', { method: 'POST', body: '{' })).status, 400);
    const response = await fetch(base + '/api/coop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join', world: world() }) });
    assert.equal(response.status, 200); assert.equal((await response.json()).session.players.length, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
