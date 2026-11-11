const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const copy = value => JSON.parse(JSON.stringify(value));

function validateWorld(world) {
  if (!world || !Array.isArray(world.map) || world.map.length !== 15 ||
      !world.map.every(row => Array.isArray(row) && row.length === 23 && row.every(v => v === 0 || v === 1)) ||
      !Array.isArray(world.crystals) || world.crystals.length > 20 ||
      !Array.isArray(world.pickups) || world.pickups.length > 10 ||
      !Number.isInteger(world.needed) || world.needed < 1 || world.needed > 6 ||
      !Number.isInteger(world.totalMines) || world.totalMines < 2 || world.totalMines > 5 ||
      typeof world.city?.name !== 'string' || !Number.isFinite(world.city.km)) fail(400, 'Некорректная карта');
  const validCell = cell => cell && Number.isInteger(cell.x) && Number.isInteger(cell.y) && world.map[cell.y]?.[cell.x] === 0;
  if (![world.start, world.exitCell, ...world.crystals, ...world.pickups].every(validCell)) fail(400, 'Некорректные клетки');
  return copy(world);
}

function createCoop({ now = Date.now, state = null } = {}) {
  let session = state?.session || null;
  const players = new Map(state?.players || []);
  const cleanup = () => {
    for (const [id, player] of players) if (now() - player.lastSeen > 15000) players.delete(id);
    if (!players.size) session = null;
    if (session) for (const crystal of session.world.crystals) if (crystal.owner && !players.has(crystal.owner)) delete crystal.owner;
  };
  const snapshot = (id, extra = {}) => ({ id, ...extra, session: session && {
    id: session.id, level: session.level, finished: session.finished, runOre: session.runOre, world: session.world,
    players: [...players.values()].map(({ lastSeen, token, ...player }) => player)
  } });
  return { exportState: () => copy({ session, players: [...players.entries()] }), handle(input, uuid) {
    cleanup();
    if (!input || typeof input !== 'object') fail(400, 'Некорректный запрос');
    if (input.action === 'join') {
      if (players.size >= 8) fail(409, 'Все 8 мест заняты. Попробуйте позже.');
      if (session?.finished) fail(409, 'Команда завершила поход. Дождитесь выхода игроков.');
      if (!session) session = { id: uuid(), level: 1, finished: false, runOre: 0, world: validateWorld(input.world) };
      const id = uuid(), start = session.world.start;
      const number = Math.max(0, ...[...players.values()].map(p => p.number)) + 1;
      const token = uuid();
      players.set(id, { id, token, name: 'Игрок ' + number, number,
        x: start.x, y: start.y, dir: 1, skin: Math.min(2, Math.max(0, Math.round(Number(input.skin) || 0))),
        state: 'playing', score: 0, lastSeen: now() });
      return snapshot(id, { token });
    }
    const player = players.get(input.id);
    if (!player || !session || input.token !== player.token) fail(410, 'Подключение завершено. Присоединитесь снова.');
    player.lastSeen = now();
    if (input.action === 'leave') { players.delete(input.id); cleanup(); return { left: true }; }
    const world = session.world;
    const sameLevel = input.level === session.level;
    // Без второго участника игровые действия приостановлены и на сервере.
    if (players.size < 2 && !['sync', 'release'].includes(input.action)) {
      return snapshot(input.id, { allowed: false, pickup: null, waiting: true });
    }
    if (input.action === 'sync') {
      if (players.size >= 2 && sameLevel && Number.isInteger(input.x) && Number.isInteger(input.y) && world.map[input.y]?.[input.x] === 0) {
        player.x = input.x; player.y = input.y;
      }
      player.dir = input.dir === -1 ? -1 : 1;
      player.state = ['playing', 'question', 'dead'].includes(input.state) ? input.state : 'playing';
      if (Number.isFinite(input.score)) player.score = Math.max(0, Math.round(input.score));
    } else if (input.action === 'lock') {
      const crystal = sameLevel && world.crystals[input.index];
      const allowed = crystal && !crystal.done && (!crystal.owner || crystal.owner === input.id);
      if (allowed) crystal.owner = input.id;
      return snapshot(input.id, { allowed: !!allowed });
    } else if (input.action === 'answer' || input.action === 'release') {
      const crystal = sameLevel && world.crystals[input.index];
      if (crystal?.owner === input.id) {
        delete crystal.owner;
        if (input.action === 'answer' && input.ok === true && !crystal.done) { crystal.done = true; session.runOre++; }
      }
    } else if (input.action === 'pickup') {
      const index = sameLevel ? world.pickups.findIndex(p => p.x === input.x && p.y === input.y) : -1;
      const pickup = index >= 0 ? world.pickups.splice(index, 1)[0] : null;
      return snapshot(input.id, { pickup });
    } else if (input.action === 'advance') {
      if (sameLevel && !session.finished && world.crystals.filter(c => c.done).length >= world.needed) {
        if (session.level >= world.totalMines) session.finished = true;
        else {
          const next = validateWorld(input.world);
          next.city = world.city; next.totalMines = world.totalMines;
          session.world = next; session.level++;
          for (const p of players.values()) { p.x = next.start.x; p.y = next.start.y; p.state = 'playing'; }
        }
      }
    } else fail(400, 'Неизвестное действие');
    return snapshot(input.id);
  } };
}
module.exports = { createCoop };
