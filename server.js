// 몽글 디바이스 서버
// - 모든 시간 계산은 이 서버의 시계(Date.now)로 합니다.
// - 몬스터 상태, 결투장, 배틀 결과는 전부 서버가 계산하고 저장합니다.
const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Core = require('./public/core.js');

const PORT = process.env.PORT || 3000;
// 저장 위치: 직접 지정(DATA_DIR) > Railway 저장 공간(자동) > 이 폴더 안의 data
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
// 빠른 성장(테스트 모드): 관리자 계정(admin)으로 로그인했을 때만 보이고 쓸 수 있음
const ADMIN_NICK = 'admin', ADMIN_PASS = process.env.ADMIN_PASS || '1133';

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'mongle.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, nick TEXT UNIQUE COLLATE NOCASE, pass TEXT, created INTEGER);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, created INTEGER);
CREATE TABLE IF NOT EXISTS pets (user_id INTEGER PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS arena (user_id INTEGER PRIMARY KEY, data TEXT, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, updated INTEGER);
-- 결투장 몽글이 (한 계정당 최대 RULES.maxEntries 마리)
CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, data TEXT, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, created INTEGER);
CREATE INDEX IF NOT EXISTS entries_user ON entries(user_id);
-- 몽글이끼리 맞붙은 결과 (랭킹 동점 처리용): winner가 loser를 n번 이김
CREATE TABLE IF NOT EXISTS matches (winner INTEGER, loser INTEGER, n INTEGER DEFAULT 0, PRIMARY KEY (winner, loser));
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
`);
// 이전 버전(계정당 1마리) 결투장 데이터를 한 번만 옮김
if (!db.prepare("SELECT v FROM meta WHERE k = 'arena_v2'").get()) {
  db.transaction(() => {
    db.exec('INSERT INTO entries (user_id, data, wins, losses, created) SELECT user_id, data, wins, losses, updated FROM arena');
    db.prepare("INSERT INTO meta (k, v) VALUES ('arena_v2', '1')").run();
  })();
}

const q = {
  setPass: db.prepare('UPDATE users SET pass = ? WHERE id = ?'),
  userByNick: db.prepare('SELECT * FROM users WHERE nick = ?'),
  userById: db.prepare('SELECT id, nick FROM users WHERE id = ?'),
  addUser: db.prepare('INSERT INTO users (nick, pass, created) VALUES (?, ?, ?)'),
  addSession: db.prepare('INSERT INTO sessions (token, user_id, created) VALUES (?, ?, ?)'),
  session: db.prepare('SELECT user_id FROM sessions WHERE token = ?'),
  delSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  getPet: db.prepare('SELECT data FROM pets WHERE user_id = ?'),
  putPet: db.prepare('INSERT INTO pets (user_id, data) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data'),
  myEntries: db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY created'),
  getEntry: db.prepare('SELECT * FROM entries WHERE id = ?'),
  addEntry: db.prepare('INSERT INTO entries (user_id, data, wins, losses, created) VALUES (?, ?, 0, 0, ?)'),
  delEntry: db.prepare('DELETE FROM entries WHERE id = ?'),
  delMatches: db.prepare('DELETE FROM matches WHERE winner = ? OR loser = ?'),
  setEntryData: db.prepare('UPDATE entries SET data = ? WHERE id = ?'),
  addRecord: db.prepare('UPDATE entries SET wins = wins + ?, losses = losses + ? WHERE id = ?'),
  addMatch: db.prepare('INSERT INTO matches (winner, loser, n) VALUES (?, ?, 1) ON CONFLICT(winner, loser) DO UPDATE SET n = n + 1'),
  allMatches: db.prepare('SELECT * FROM matches'),
  listEntries: db.prepare('SELECT e.*, u.nick FROM entries e JOIN users u ON u.id = e.user_id')
};

// ---------- 비밀번호 ----------
function hashPass(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(pw, salt, 32).toString('hex');
  return salt + ':' + h;
}
// 관리자 계정은 서버가 켜질 때 만들어 둠 (비밀번호는 ADMIN_PASS, 기본 1133). 다른 사람은 admin으로 가입할 수 없음
const ADMIN_ID = (() => {
  const u = q.userByNick.get(ADMIN_NICK);
  if (u) { q.setPass.run(hashPass(ADMIN_PASS), u.id); return u.id; }
  return Number(q.addUser.run(ADMIN_NICK, hashPass(ADMIN_PASS), Date.now()).lastInsertRowid);
})();
const fastOK = uid => uid === ADMIN_ID;
function checkPass(pw, stored) {
  const [salt, h] = stored.split(':');
  const test = crypto.scryptSync(pw, salt, 32);
  return crypto.timingSafeEqual(test, Buffer.from(h, 'hex'));
}

// ---------- 공통 ----------
const app = express();
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const fail = (res, code, msg) => res.status(code).json({ error: msg });

function auth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.get('authorization') || '');
  const row = m && q.session.get(m[1]);
  if (!row) return fail(res, 401, '다시 로그인해 주세요.');
  req.uid = row.user_id; req.token = m[1];
  next();
}

// 너무 빠른 연타 방지
const lastHit = new Map();
function throttle(req, res, next) {
  const now = Date.now(), t = lastHit.get(req.uid) || 0;
  if (now - t < 250) return fail(res, 429, '조금 천천히 눌러 주세요.');
  lastHit.set(req.uid, now); next();
}

function loadPet(uid) {
  const row = q.getPet.get(uid);
  if (!row) return null;
  const pet = JSON.parse(row.data);
  if (!fastOK(uid)) pet.fast = false;   // 관리자가 아니면 테스트 모드는 늘 꺼짐
  Core.advance(pet, Date.now());
  return pet;
}
const savePet = (uid, pet) => q.putPet.run(uid, JSON.stringify(pet));

// 결투장 전체를 랭킹 순서로 (승-패 → 승 → 맞대결 → 공동 순위)
function rankedArena(viewerUid) {
  const now = Date.now(), H = {};
  q.allMatches.all().forEach(m => { H[m.winner + '-' + m.loser] = m.n; });
  const list = q.listEntries.all().map(r => Object.assign(Core.migrateEntry(JSON.parse(r.data)), {
    id: r.id, uid: r.user_id, trainer: r.nick, wins: r.wins, losses: r.losses, registeredAt: r.created,
    mine: r.user_id === viewerUid
  }));
  const ranked = Core.rankEntries(list, (a, b) => H[a + '-' + b] || 0);
  ranked.forEach(e => { e.id = 'e' + e.id; e.energyNow = Core.arenaEnergy(e, now); });
  return ranked;
}
// 내 결투장 몽글이들 (등록한 순서, 순위·에너지 포함)
function myEntries(uid) {
  const list = rankedArena(uid);
  return list.filter(e => e.uid === uid).sort((a, b) => a.registeredAt - b.registeredAt)
    .map(e => Object.assign({}, e, { total: list.length }));
}
function payload(uid, pet, extra) {
  return Object.assign({ now: Date.now(), pet, allowFast: fastOK(uid), mine: myEntries(uid), maxEntries: Core.RULES.maxEntries }, extra || {});
}

// ---------- 계정 ----------
app.post('/api/signup', (req, res) => {
  const nick = String(req.body.nick || '').trim(), pass = String(req.body.pass || '');
  if (!/^[\p{L}\p{N}_]{2,12}$/u.test(nick)) return fail(res, 400, '닉네임은 2~12자의 한글, 영문, 숫자, _ 만 쓸 수 있어요.');
  if (pass.length < 4 || pass.length > 64) return fail(res, 400, '비밀번호는 4자 이상이어야 해요.');
  if (q.userByNick.get(nick) || nick.toLowerCase() === ADMIN_NICK) return fail(res, 409, '이미 있는 닉네임이에요.');
  const info = q.addUser.run(nick, hashPass(pass), Date.now());
  const token = crypto.randomBytes(24).toString('hex');
  q.addSession.run(token, info.lastInsertRowid, Date.now());
  res.json({ token, nick });
});

const loginFails = new Map();
app.post('/api/login', (req, res) => {
  const nick = String(req.body.nick || '').trim(), pass = String(req.body.pass || '');
  const key = nick.toLowerCase(), f = loginFails.get(key) || { n: 0, until: 0 };
  if (f.until > Date.now()) return fail(res, 429, '로그인 시도가 많아요. 1분 뒤에 다시 해 주세요.');
  const u = q.userByNick.get(nick);
  if (!u || !checkPass(pass, u.pass)) {
    f.n++; if (f.n >= 5) { f.n = 0; f.until = Date.now() + 60000; }
    loginFails.set(key, f);
    return fail(res, 401, '닉네임 또는 비밀번호가 맞지 않아요.');
  }
  loginFails.delete(key);
  const token = crypto.randomBytes(24).toString('hex');
  q.addSession.run(token, u.id, Date.now());
  res.json({ token, nick: u.nick });
});

app.post('/api/logout', auth, (req, res) => { q.delSession.run(req.token); res.json({ ok: true }); });

// ---------- 내 몬스터 ----------
app.get('/api/me', auth, (req, res) => {
  const u = q.userById.get(req.uid);
  const pet = loadPet(req.uid);
  if (pet) savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { nick: u.nick }));
});

// 새 알 받기. 결투장에 등록된 몽글이는 그대로 남습니다.
app.post('/api/pet', auth, throttle, (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 10) || '몽이';
  const pet = Core.newPet(name, Date.now());
  savePet(req.uid, pet);
  trains.delete(req.uid);
  res.json(payload(req.uid, pet, { msg: '알을 받았어요. 10분 뒤 부화해요. 품기를 누르고 있으면 10배 빨라져요.' }));
});

// 알 품기: 누르고 있는 동안 시간 10배 (on: 누르기 시작/계속, off: 뗌). 연타 제한 없음
app.post('/api/warm', auth, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  const r = Core.warm(pet, !!req.body.on, Date.now());
  if (!r.ok) return fail(res, 400, r.msg);
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { msg: r.msg }));
});
// 진화 장면을 봤음 → 다음 단계 성장이 이어서 쌓일 수 있음
app.post('/api/seen', auth, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  pet.evoUnseen = null;
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, {}));
});

app.post('/api/action', auth, throttle, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  const type = String(req.body.type || '');
  if (type === 'fast' && !fastOK(req.uid)) return fail(res, 403, '빠른 성장은 관리자만 쓸 수 있어요.');
  if (trains.has(req.uid)) return fail(res, 409, '훈련 중이에요.');
  const r = Core.applyAction(pet, type);
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { ok: r.ok, msg: r.msg, info: r.info, refuse: !!r.refuse }));
});

// ---------- 훈련 (시작 1번 + 끝 1번, 판정은 서버가 다시 계산) ----------
const trains = new Map(); // uid -> {kind, params, start}
app.post('/api/train/start', auth, throttle, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  const kind = String(req.body.kind || '');
  if (!Core.TRAIN_KINDS.includes(kind)) return fail(res, 400, '훈련 종류를 골라 주세요.');
  if (pet.stage === 'egg') return fail(res, 400, '알은 훈련할 수 없어요.');
  if (pet.stage === 'adult') return fail(res, 400, '다 자란 몽글이는 더 훈련할 수 없어요.');
  if (pet.energy < Core.RULES.trainCost) return fail(res, 400, '에너지가 부족해요.');
  const params = Core.trainParams(pet, null, kind);
  trains.set(req.uid, { kind, params, start: Date.now() });
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { train: { kind, params } }));
});

app.post('/api/train/stop', auth, (req, res) => {
  const t = trains.get(req.uid);
  if (!t) return fail(res, 409, '진행 중인 훈련이 없어요.');
  trains.delete(req.uid);
  const pet = loadPet(req.uid);
  // 화면이 보낸 입력(taps)으로 서버가 같은 규칙에서 성공 수를 다시 셈
  const ok = Core.trainJudge(t.params, req.body.taps, Date.now() - t.start);
  const r = Core.applyTraining(pet, t.kind, ok);
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { result: t.params.game, ok, msg: r.msg }));
});

// ---------- 결투장 ----------

// 성체를 결투장에 등록. 계정당 최대 2마리, 꽉 찼으면 replace로 교체할 몽글이를 골라야 함 (교체된 몽글이 기록은 삭제)
app.post('/api/register', auth, throttle, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  if (pet.stage !== 'adult') return fail(res, 400, '성체가 되어야 등록할 수 있어요.');
  const rows = q.myEntries.all(req.uid);
  if (rows.some(r => JSON.parse(r.data).born === pet.born)) return fail(res, 409, '이미 결투장에 올라가 있는 몽글이에요.');
  let replaced = null;
  if (rows.length >= Core.RULES.maxEntries) {
    const m = /^e(\d+)$/.exec(String(req.body.replace || ''));
    replaced = m && rows.find(r => r.id === Number(m[1]));
    if (!replaced) return fail(res, 409, `결투장 자리가 꽉 찼어요. 교체할 몽글이를 골라 주세요.`);
  }
  const now = Date.now();
  db.transaction(() => {
    if (replaced) { q.delEntry.run(replaced.id); q.delMatches.run(replaced.id, replaced.id); }
    q.addEntry.run(req.uid, JSON.stringify(Core.entryFromPet(pet)), now);
  })();
  savePet(req.uid, pet);
  const oldName = replaced && JSON.parse(replaced.data).name;
  res.json(payload(req.uid, pet, { msg: oldName ? `${oldName} 대신 ${pet.name}이(가) 결투장에 올라갔어요!` : '결투장에 등록했어요!' }));
});

app.get('/api/arena', auth, (req, res) => {
  res.json({ now: Date.now(), list: rankedArena(req.uid).map(Core.publicEntry) });
});

// 배틀: 내 결투장 몽글이(fighter) 중 하나가 상대(opponent)와 싸움
app.post('/api/battle', auth, throttle, (req, res) => {
  const rows = q.myEntries.all(req.uid);
  if (!rows.length) return fail(res, 400, '먼저 성체를 결투장에 등록해 주세요.');
  const fm = /^e(\d+)$/.exec(String(req.body.fighter || ''));
  const frow = fm ? rows.find(r => r.id === Number(fm[1])) : rows.length === 1 ? rows[0] : null;
  if (!frow) return fail(res, 400, '출전할 몽글이를 골라 주세요.');
  const mine = Core.migrateEntry(JSON.parse(frow.data)), now = Date.now();
  if (Core.arenaEnergy(mine, now) < Core.RULES.battleCost) {
    const m = Math.ceil(Core.arenaNextIn(mine, now) / 60);
    return fail(res, 400, `${mine.name}의 도전 횟수가 없어요. ${m}분 뒤에 1번 회복돼요.`);
  }
  const om = /^e(\d+)$/.exec(String(req.body.opponent || ''));
  const orow = om && q.getEntry.get(Number(om[1]));
  if (!orow) return fail(res, 404, '상대를 찾을 수 없어요. 목록을 새로고침해 주세요.');
  if (orow.user_id === req.uid) return fail(res, 400, '내 몽글이끼리는 싸울 수 없어요.');
  const op = Core.migrateEntry(JSON.parse(orow.data));
  const me = Core.side(mine), opSide = Core.side(op);
  const sim = Core.simulate(me, opSide);
  Core.spendArenaEnergy(mine, now, Core.RULES.battleCost);
  db.transaction(() => {
    q.setEntryData.run(JSON.stringify(mine), frow.id);
    q.addRecord.run(sim.win ? 1 : 0, sim.win ? 0 : 1, frow.id);
    q.addRecord.run(sim.win ? 0 : 1, sim.win ? 1 : 0, orow.id);
    q.addMatch.run(sim.win ? frow.id : orow.id, sim.win ? orow.id : frow.id);
  })();
  const pet = loadPet(req.uid);
  res.json(payload(req.uid, pet, { battle: { fighter: 'e' + frow.id, me, op: opSide, events: sim.ev, win: sim.win, mult: Core.typeMult(me.type, opSide.type) } }));
});

app.get('/api/health', (req, res) => res.json({ ok: true, now: Date.now() }));

app.listen(PORT, () => {
  console.log(`몽글 디바이스 서버 실행 중: http://localhost:${PORT}`);
  console.log(`데이터 저장 위치: ${DATA_DIR}`);
  if (process.env.RAILWAY_ENVIRONMENT && !process.env.RAILWAY_VOLUME_MOUNT_PATH && !process.env.DATA_DIR)
    console.warn('⚠️ 저장 공간(Volume)이 연결되지 않았어요. 재배포하면 데이터가 사라집니다.');
});
