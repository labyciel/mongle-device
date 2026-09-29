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
const ALLOW_FAST = process.env.ALLOW_FAST !== '0'; // 빠른 성장(테스트) 허용 여부. 끄려면 ALLOW_FAST=0

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'mongle.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, nick TEXT UNIQUE COLLATE NOCASE, pass TEXT, created INTEGER);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, created INTEGER);
CREATE TABLE IF NOT EXISTS pets (user_id INTEGER PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS arena (user_id INTEGER PRIMARY KEY, data TEXT, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, updated INTEGER);
`);

const q = {
  userByNick: db.prepare('SELECT * FROM users WHERE nick = ?'),
  userById: db.prepare('SELECT id, nick FROM users WHERE id = ?'),
  addUser: db.prepare('INSERT INTO users (nick, pass, created) VALUES (?, ?, ?)'),
  addSession: db.prepare('INSERT INTO sessions (token, user_id, created) VALUES (?, ?, ?)'),
  session: db.prepare('SELECT user_id FROM sessions WHERE token = ?'),
  delSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  getPet: db.prepare('SELECT data FROM pets WHERE user_id = ?'),
  putPet: db.prepare('INSERT INTO pets (user_id, data) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data'),
  getReg: db.prepare('SELECT * FROM arena WHERE user_id = ?'),
  putReg: db.prepare(`INSERT INTO arena (user_id, data, wins, losses, updated) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated`),
  delReg: db.prepare('DELETE FROM arena WHERE user_id = ?'),
  addRecord: db.prepare('UPDATE arena SET wins = wins + ?, losses = losses + ? WHERE user_id = ?'),
  listArena: db.prepare(`SELECT a.*, u.nick FROM arena a JOIN users u ON u.id = a.user_id
    ORDER BY a.wins DESC, a.updated DESC LIMIT 200`)
};

// ---------- 비밀번호 ----------
function hashPass(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(pw, salt, 32).toString('hex');
  return salt + ':' + h;
}
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
  Core.advance(pet, Date.now());
  return pet;
}
const savePet = (uid, pet) => q.putPet.run(uid, JSON.stringify(pet));

function payload(uid, pet, extra) {
  const reg = q.getReg.get(uid);
  return Object.assign({
    now: Date.now(),
    pet,
    allowFast: ALLOW_FAST,
    registered: reg ? Object.assign(Core.migrateEntry(JSON.parse(reg.data)), { wins: reg.wins, losses: reg.losses }) : null
  }, extra || {});
}

// ---------- 계정 ----------
app.post('/api/signup', (req, res) => {
  const nick = String(req.body.nick || '').trim(), pass = String(req.body.pass || '');
  if (!/^[\p{L}\p{N}_]{2,12}$/u.test(nick)) return fail(res, 400, '닉네임은 2~12자의 한글, 영문, 숫자, _ 만 쓸 수 있어요.');
  if (pass.length < 4 || pass.length > 64) return fail(res, 400, '비밀번호는 4자 이상이어야 해요.');
  if (q.userByNick.get(nick)) return fail(res, 409, '이미 있는 닉네임이에요.');
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

// 새 알 받기 (처음 시작 또는 초기화). 결투장 등록도 지워집니다.
app.post('/api/pet', auth, throttle, (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 10) || '몽이';
  const pet = Core.newPet(name, Date.now());
  db.transaction(() => { savePet(req.uid, pet); q.delReg.run(req.uid); })();
  trains.delete(req.uid);
  res.json(payload(req.uid, pet, { msg: '알을 받았어요. 품기 버튼을 눌러 주세요.' }));
});

app.post('/api/action', auth, throttle, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  const type = String(req.body.type || '');
  if (type === 'fast' && !ALLOW_FAST) return fail(res, 403, '이 서버에서는 빠른 성장을 쓸 수 없어요.');
  if (trains.has(req.uid)) return fail(res, 409, '훈련 중이에요.');
  const r = Core.applyAction(pet, type);
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { ok: r.ok, msg: r.msg, info: r.info }));
});

// ---------- 훈련 (판정은 서버 시계로) ----------
const trains = new Map(); // uid -> {kind, params, start}
app.post('/api/train/start', auth, throttle, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  const kind = String(req.body.kind || '');
  if (!Core.TRAIN_KINDS.includes(kind)) return fail(res, 400, '훈련 종류를 골라 주세요.');
  if (pet.stage === 'egg') return fail(res, 400, '알은 훈련할 수 없어요.');
  if (pet.energy < Core.RULES.trainCost) return fail(res, 400, '에너지가 부족해요.');
  const params = Core.trainParams(pet);
  trains.set(req.uid, { kind, params, start: Date.now() });
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { train: { kind, params } }));
});

app.post('/api/train/stop', auth, (req, res) => {
  const t = trains.get(req.uid);
  if (!t) return fail(res, 409, '진행 중인 훈련이 없어요.');
  trains.delete(req.uid);
  const pet = loadPet(req.uid);
  const serverElapsed = Date.now() - t.start;
  // 화면에서 잰 시간은 통신 지연만큼 서버 시간보다 짧아야 정상. 2초 넘게 어긋나면 서버 시간으로 판정.
  const clientElapsed = Number(req.body.elapsed);
  const gap = serverElapsed - clientElapsed;
  const used = Number.isFinite(clientElapsed) && gap >= 0 && gap <= 2000 ? clientElapsed : serverElapsed;
  const result = serverElapsed > 60000 ? 'fail' : Core.judge(t.params, used);
  const r = Core.applyTrain(pet, t.kind, result);
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { result, msg: r.msg, info: r.info }));
});

// ---------- 결투장 ----------
function entryFromPet(pet) {
  return Object.assign({ name: pet.name, form: pet.form, type: pet.type, style: pet.style, level: pet.level, usedFast: !!pet.usedFast }, Core.bstats(pet));
}

app.post('/api/register', auth, throttle, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  if (pet.stage !== 'adult') return fail(res, 400, '성체(Lv.50)가 되어야 등록할 수 있어요.');
  const had = !!q.getReg.get(req.uid);
  q.putReg.run(req.uid, JSON.stringify(entryFromPet(pet)), pet.wins, pet.losses, Date.now());
  savePet(req.uid, pet);
  res.json(payload(req.uid, pet, { msg: had ? '등록 정보를 갱신했어요.' : '결투장에 등록했어요!' }));
});

app.get('/api/arena', auth, (req, res) => {
  const list = q.listArena.all().map(r => Object.assign(Core.migrateEntry(JSON.parse(r.data)), {
    id: 'u' + r.user_id, trainer: r.nick, wins: r.wins, losses: r.losses, updated: r.updated, mine: r.user_id === req.uid
  }));
  res.json({ now: Date.now(), list, npcs: Core.NPCS });
});

app.post('/api/battle', auth, throttle, (req, res) => {
  const pet = loadPet(req.uid);
  if (!pet) return fail(res, 404, '먼저 알을 받아 주세요.');
  if (pet.stage !== 'adult') return fail(res, 400, '성체만 배틀할 수 있어요.');
  if (pet.energy < Core.RULES.battleCost) return fail(res, 400, `에너지가 ${Core.RULES.battleCost} 이상 필요해요.`);
  const id = String(req.body.opponent || '');
  let op, opUid = null;
  const npc = Core.NPCS.find(n => n.id === id);
  if (npc) op = npc;
  else {
    const m = /^u(\d+)$/.exec(id);
    const row = m && q.getReg.get(Number(m[1]));
    if (!row) return fail(res, 404, '상대를 찾을 수 없어요. 목록을 새로고침해 주세요.');
    opUid = row.user_id;
    if (opUid === req.uid) return fail(res, 400, '내 몬스터와는 싸울 수 없어요.');
    op = Core.migrateEntry(JSON.parse(row.data));
  }
  const me = Core.side(Object.assign({ name: pet.name, form: pet.form, level: pet.level, type: pet.type }, Core.bstats(pet)));
  const opSide = Core.side(op);
  const sim = Core.simulate(me, opSide);
  const info = Core.applyBattle(pet, me.level, opSide.level, sim.win, !!npc);
  db.transaction(() => {
    savePet(req.uid, pet);
    if (opUid) {
      q.addRecord.run(sim.win ? 1 : 0, sim.win ? 0 : 1, req.uid);  // 내가 등록돼 있으면 내 기록 반영
      q.addRecord.run(sim.win ? 0 : 1, sim.win ? 1 : 0, opUid);    // 상대 기록 반영
    }
  })();
  res.json(payload(req.uid, pet, { battle: { me, op: opSide, events: sim.ev, win: sim.win, mult: Core.typeMult(me.type, opSide.type) }, info }));
});

app.get('/api/health', (req, res) => res.json({ ok: true, now: Date.now() }));

app.listen(PORT, () => {
  console.log(`몽글 디바이스 서버 실행 중: http://localhost:${PORT}`);
  console.log(`데이터 저장 위치: ${DATA_DIR}`);
  if (process.env.RAILWAY_ENVIRONMENT && !process.env.RAILWAY_VOLUME_MOUNT_PATH && !process.env.DATA_DIR)
    console.warn('⚠️ 저장 공간(Volume)이 연결되지 않았어요. 재배포하면 데이터가 사라집니다.');
});
