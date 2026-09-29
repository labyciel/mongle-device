// 몽글 디바이스 — 화면 코드. 게임 규칙은 core.js, 판정과 저장은 서버가 합니다.
(() => {
const C = window.Core;
const $ = id => document.getElementById(id);

// ---------- 스프라이트 (16x16, '#' 진한 점, 'o' 중간 점) ----------
const S = {
egg:["................","......####......",".....#....#.....","....#......#....","...#..oo....#...","...#.oooo...#...","..#...oo.....#..","..#..........#..","..#.....oo...#..","..#....oooo..#..","..#.....oo...#..","...#........#...","...#........#...","....#......#....",".....######.....","................"],
mongsil:["................","................","................","................","......####......","....##oooo##....","...#oooooooo#...","..#oo#oooo#oo#..","..#oo#oooo#oo#..","..#oooooooooo#..","..#ooo#oo#ooo#..","..#oooo##oooo#..","...#oooooooo#...","....########....","................","................"],
ppulmong:["................","...#........#...","...##......##...","....#.####.#....","....##oooo##....","...#oooooooo#...","..#oo##oo##oo#..","..#oo#.oo#.oo#..","..#oooooooooo#..","..#ooo####ooo#..","...#ooo##ooo#...","..##oooooooo##..",".#o#oooooooo#o#.","...#oo#..#oo#...","...###....###...","................"],
dandanmong:["................","................",".....######.....","...##o#oo#o##...","..#oo#oooo#oo#..",".#oooo####oooo#.",".#o#o#oooo#o#o#.",".##############.","..#oooooooooo#..","..#o##oooo##o#..","..#o#.oooo#.o#..","..#oooo##oooo#..","...#oooooooo#...","...##o#..#o##...","...###....###...","................"],
flamehorn:["#..............#","##............##",".##..######..##.","..##oooooooo##..","..#oo##oo##oo#..",".#ooo#.oo#.ooo#.",".#oooooooooooo#.",".#oo########oo#.","..#o#.#..#.#o#..","..#oo######oo#..",".###oooooooo###.","#oo#oooooooo#oo#","#o#oooo##oooo#o#","..#ooo#..#ooo#..","..#oo#....#oo#..",".####......####."],
ironshell:["................","....########....","..##o#o##o#o##..",".#o#oo#oo#oo#o#.","#oo#oo#oo#oo#oo#","################","#oooooooooooooo#","#oo##oooooo##oo#","#oo#.#oooo#.#oo#","#oooooooooooooo#","#ooo########ooo#",".#oooooooooooo#.","################","##oo#......#oo##","#ooo#......#ooo#","#####......#####"],
galewing:["................","#......##......#","##....####....##","#o#..#oooo#..#o#","#oo##o#oo#o##oo#","#ooo#o.oo.o#ooo#",".#oo#oooooo#oo#.","..#o#oo##oo#o#..","...##oooooo##...",".....#oooo#.....","....#oooooo#....","....#oo##oo#....",".....#o##o#.....","....##.##.##....","....#..#...#....","................"],
scruffy:["................","................","...#..#...#.....","....#.#..#......","....########....","...#oooooooo#...","..#oooooooooo#..","..#o##oooo##o#..","..#oooooooooo#..",".#ooo#oooo#ooo#.",".#oooo####oooo#.",".#oooooooooooo#.","#oooooooooooooo#","#oo#oooooooo#oo#",".##.########.##.","................"],
mukfist:["................",".....######.....","...##oooooo##...","..#oooooooooo#..","..#o##oooo##o#..","..#oo#oooo#oo#..","..#oooooooooo#..","..#ooo####ooo#..","###oooooooooo###","#oo#oooooooo#oo#","#ooo#oooooo#ooo#","#ooo#oooooo#ooo#",".###oooooooo###.","...#oo#..#oo#...","...###....###...","................"],
mukpebble:["................","................","......####......","....##oooo##....","...#oooooooo#...","..#oooooooooo#..","..#oo##oo##oo#..",".#ooo#.oo#.ooo#.",".#oooooooooooo#.",".#oooo#oo#oooo#.",".#ooooo##ooooo#.",".#oooooooooooo#.","..#oooooooooo#..","..##oo####oo##..","...###....###...","................"],
jjicrab:["................","##............##","#o#..........#o#","#oo#........#oo#",".#o#........#o#.","..##.######.##..","...##oooooo##...","..#o#oooooo#o#..",".#o##########o#.",".#oo#.#oo#.#oo#.",".#oooooooooooo#.","..#oo######oo#..","..#oooooooooo#..","...#o#.##.#o#...","..##.#....#.##..","................"],
jjibunny:["....#......#....","...#o#....#o#...","...#o#....#o#...","...#o#....#o#...","....#o####o#....","...#oooooooo#...","..#oo#oooo#oo#..","..#oo#oooo#oo#..","..#oooo##oooo#..","...#oooooooo#...","..#oooooooooo#..",".#o#oooooooo#o#.","..#oooooooooo#..","...#ooo##ooo#...","..###......###..","................"],
ppashield:["................","................","#.#.#......#.#.#","#o#o#......#o#o#","#ooo#.####.#ooo#",".#ooo#oooo#ooo#.","..#oooooooooo#..","..#o##oooo##o#..","..#o#.#oo#.#o#..","..############..","..#oooooooooo#..","..#o#oooooo#o#..","..#oooooooooo#..","..############..","...##......##...","................"],
ppahand:["................","...#.#.#.#......","...#o#o#o#......","...#o#o#o#..##..","..##o#o#o####o#.","..#ooooooooo#o#.",".#oooooooooooo#.",".#oo##oooo##oo#.",".#oo#.#oo#.#oo#.",".#oooooooooooo#.",".#ooooo##ooooo#.","..#oooooooooo#..","...#oooooooo#...","....#oo##oo#....","....###..###....","................"]
};
const spriteOf = form => S[(C.FORMS[form] || {}).sprite || form] || S.mongsil;
const POOP = ["...#....","..#o#...","..###...",".#ooo#..",".#####..","#ooooo#.","#######.","........"];

// ---------- 상태 ----------
const TOKEN_KEY = 'mongle-token';
let token = null; try { token = localStorage.getItem(TOKEN_KEY); } catch (e) {}
let nick = '', pet = null, registered = null, allowFast = true;
let offset = 0;            // 서버시계 - 내 시계 (ms)
let mode = 'idle', train = null, battle = null, evo = null, busy = false;
let arena = [], npcs = C.NPCS;
let wx = 8, facing = 1, lastStep = 0;
const serverNow = () => Date.now() + offset;

let toastT;
function toast(m) { if (!m) return; const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }

// ---------- 서버 통신 ----------
async function api(path, body) {
  const opt = { method: body === undefined ? 'GET' : 'POST', headers: {} };
  if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  if (token) opt.headers['Authorization'] = 'Bearer ' + token;
  const sent = Date.now();
  let res;
  try { res = await fetch('/api' + path, opt); }
  catch (e) { throw new Error('서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.'); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/login') { logoutLocal(); throw new Error(data.error || '다시 로그인해 주세요.'); }
  if (!res.ok) throw new Error(data.error || '요청을 처리하지 못했어요.');
  if (data.now) { const rtt = Date.now() - sent; offset = data.now + rtt / 2 - Date.now(); }
  return data;
}
function apply(data) {
  if ('pet' in data) {
    const prevForm = pet && pet.form;
    pet = data.pet;
    if (data.info && data.info.evos && data.info.evos.length) {
      const e = data.info.evos[data.info.evos.length - 1];
      evo = { from: e.from, to: e.to, until: performance.now() + 1800 };
      setTimeout(() => toast(`진화했어요! ${C.FORMS[e.from].name} → ${C.FORMS[e.to].name}`), 1800);
    } else if (data.info && data.info.ups) toast(`레벨 업! Lv.${pet.level}`);
    void prevForm;
  }
  if ('registered' in data) registered = data.registered;
  if ('allowFast' in data) allowFast = data.allowFast;
  if (data.nick) nick = data.nick;
}
async function run(fn) {
  if (busy) return; busy = true; render();
  try { await fn(); } catch (e) { toast(e.message); }
  busy = false; render();
}

// ---------- 화면 전환 ----------
function show() {
  $('loginCard').hidden = !!token;
  $('startCard').hidden = !token || !!pet;
  $('game').hidden = !token || !pet;
  $('pad').hidden = !token || !pet || mode === 'train';
  if (!token) { $('lcdL').textContent = 'LOGIN'; $('lcdR').textContent = ''; }
  else if (!pet) { $('lcdL').textContent = 'NEW EGG'; $('lcdR').textContent = ''; }
  render();
}
function logoutLocal() { token = null; pet = null; registered = null; try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} mode = 'idle'; train = null; battle = null; show(); }

// ---------- 로그인 ----------
async function doAuth(kind) {
  $('loginErr').textContent = '';
  try {
    const d = await api('/' + kind, { nick: $('nickIn').value.trim(), pass: $('passIn').value });
    token = d.token; nick = d.nick; try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
    $('passIn').value = '';
    await loadMe();
  } catch (e) { $('loginErr').textContent = e.message; }
}
$('bSignup').onclick = () => doAuth('signup');
$('bLogin').onclick = () => doAuth('login');
$('passIn').addEventListener('keydown', e => { if (e.key === 'Enter') doAuth('login'); });
$('bLogout').onclick = async () => { try { await api('/logout', {}); } catch (e) {} logoutLocal(); };

async function loadMe() { const d = await api('/me'); apply(d); show(); }

// ---------- LCD ----------
const cv = $('lcd'), ctx = cv.getContext('2d'); const W = 40, H = 20, P = 10;
const fb = new Uint8Array(W * H);
const px = (x, y, v) => { if (x >= 0 && x < W && y >= 0 && y < H) fb[y * W + x] = v; };
function spr(g, ox, oy, flip) { for (let y = 0; y < g.length; y++) { const r = g[y]; for (let x = 0; x < r.length; x++) { const c = r[flip ? r.length - 1 - x : x]; if (c === '#') px(ox + x, oy + y, 2); else if (c === 'o') px(ox + x, oy + y, 1); } } }
function rect(x, y, w, h, v) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, v); }
function flush(invert) {
  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue('--lcd').trim(), on = cs.getPropertyValue('--lcd-on').trim(), mid = cs.getPropertyValue('--lcd-mid').trim(), gh = cs.getPropertyValue('--lcd-ghost').trim();
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = fb[y * W + x]; if (invert) v = v ? 0 : 2; ctx.fillStyle = v === 2 ? on : v === 1 ? mid : gh; ctx.fillRect(x * P, y * P, P - 1, P - 1); }
}
function drawSprite(canvas, form) {
  const c = canvas.getContext('2d'); canvas.width = 16; canvas.height = 16;
  const cs = getComputedStyle(document.documentElement);
  const on = cs.getPropertyValue('--lcd-on').trim(), mid = cs.getPropertyValue('--lcd-mid').trim();
  spriteOf(form).forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; c.fillStyle = ch === '#' ? on : mid; c.fillRect(x, y, 1, 1); }));
}

function frame(t) {
  fb.fill(0); let inv = false;
  if (!pet) spr(S.egg, 12, 2, false);
  else if (evo && t < evo.until) { const ph = Math.floor(t / 150) % 2; spr(spriteOf(ph ? evo.to : evo.from), 12, 2, false); inv = ph === 1; }
  else if (mode === 'train' && train) {
    spr(spriteOf(pet.form), 12, 0, false);
    const x0 = 2, len = C.BAR, p = train.params;
    for (let i = 0; i < len; i++) { px(x0 + i, 17, 1); px(x0 + i, 19, 1); }
    rect(x0 + p.z0, 17, p.zw, 3, 1); rect(x0 + p.zc - 1, 17, 3, 3, 2);
    const m = Math.round(C.markerPos(p, performance.now() - train.t0)); rect(x0 + m, 16, 1, 4, 2);
  }
  else if (mode === 'battle' && battle) {
    const b = battle, mx = 2 + (b.lunge === 'me' ? 3 : 0), ox = 22 - (b.lunge === 'op' ? 3 : 0);
    if (!(b.flash === 'me' && Math.floor(t / 80) % 2)) spr(spriteOf(b.me.form), mx, 4, false);
    if (!(b.flash === 'op' && Math.floor(t / 80) % 2)) spr(spriteOf(b.op.form), ox, 4, true);
    const hb = (x, cur, max) => { const w = Math.max(0, Math.round(16 * cur / max)); for (let i = 0; i < 16; i++) px(x + i, 1, i < w ? 2 : 1); };
    hb(2, b.mh, b.me.hp); hb(22, b.oh, b.op.hp);
  }
  else if (pet.stage === 'egg') { const w = Math.floor(t / 500) % 4; spr(S.egg, 12 + (w === 1 ? 1 : w === 3 ? -1 : 0), 2, false); }
  else {
    if (t - lastStep > 700) { lastStep = t; const d = Math.random() < .5 ? -1 : 1; wx = C.clamp(wx + d, 1, 14); facing = d; }
    const bob = Math.floor(t / 350) % 2; spr(spriteOf(pet.form), wx, 2 + bob, facing < 0);
    const spots = [[24, 12], [32, 12], [24, 3], [32, 3]]; for (let i = 0; i < pet.poops; i++) spr(POOP, spots[i][0], spots[i][1], false);
    if (pet.hunger < 20 || pet.mood < 20) { rect(38, 1, 1, 4, 2); px(38, 6, 2); }
  }
  flush(inv);
  requestAnimationFrame(frame);
}

// ---------- 패널 ----------
function meter(id, nid, v, max, cls) { const el = $(id); el.style.width = (100 * C.clamp(v / max, 0, 1)) + '%'; el.className = cls || (v < 25 ? 'bad' : v < 50 ? 'warn' : ''); $(nid).textContent = `${Math.round(v)}/${max}`; }
function render() {
  if (!pet) return;
  // 화면 표시용으로만 서버 시각까지 흘려봄 (저장은 서버가 함)
  const v = JSON.parse(JSON.stringify(pet)); C.advance(v, serverNow());
  const f = C.FORMS[v.form], bs = C.bstats(v);
  $('whoNick').textContent = nick;
  $('sName').textContent = v.name;
  $('sForm').textContent = v.stage === 'egg' ? '알 · 부화까지 품어 주세요'
    : v.stage === 'adult' ? `${f.name} · ${C.TYPES[v.type].name} 타입 · ${C.STYLES[v.style].name}` : f.name;
  renderTendency(v);
  $('sStage').textContent = C.STAGE_KO[v.stage]; $('sLv').textContent = v.level;
  meter('mXp', 'nXp', v.exp, C.need(v.level), 'xp');
  meter('mHun', 'nHun', v.hunger, 100); meter('mMood', 'nMood', v.mood, 100); meter('mEn', 'nEn', v.energy, 100);
  const nextL = v.stage === 'egg' ? 10 : v.stage === 'baby' ? 30 : v.stage === 'rookie' ? 50 : null;
  $('sNext').textContent = nextL ? `Lv.${nextL}에 다음 단계로 진화해요.` : '다 자랐어요. 결투장에 등록할 수 있어요.';
  $('vHp').textContent = bs.hp; $('vAtk').textContent = bs.atk; $('vDef').textContent = bs.def; $('vSpd').textContent = bs.spd;
  $('vMis').textContent = v.mistakes; $('vRec').textContent = `${v.wins}승 ${v.losses}패`;
  const egg = v.stage === 'egg', lock = busy || mode !== 'idle';
  $('bFeed').disabled = egg || lock; $('bPlay').disabled = egg || lock; $('bClean').disabled = egg || lock || v.poops === 0;
  $('bMainLbl').textContent = egg ? '품기' : '훈련'; $('bMain').disabled = lock;
  document.querySelectorAll('[data-train]').forEach(b => b.disabled = egg || lock || v.energy < C.RULES.trainCost);
  $('trainCard').hidden = egg;
  $('fastCard').hidden = !allowFast;
  $('bFast').textContent = v.fast ? '끄기' : '켜기'; $('bFast').setAttribute('aria-pressed', !!v.fast); $('bFast').className = v.fast ? 'btn primary' : 'btn'; $('bFast').disabled = lock;
  $('lcdL').textContent = `${v.name} Lv.${v.level}`;
  $('lcdR').textContent = egg ? '부화 대기' : `${f.name}${v.poops ? ' · 똥' + v.poops : ''}`;
  renderArena(v);
}
function renderTendency(v) {
  const box = $('tendCard');
  box.hidden = v.stage === 'egg';
  if (v.stage === 'egg') return;
  const pct = C.tendency(v.care);
  C.TYPE_ORDER.forEach(t => { $('tb-' + t).style.width = pct[t] + '%'; $('tn-' + t).textContent = pct[t] + '%'; });
  if (v.stage === 'adult') {
    const T = C.TYPES[v.type], beatsMe = C.TYPE_ORDER.find(t => C.TYPES[t].beats === v.type);
    $('tendHint').textContent = `타입이 ${T.name}(으)로 정해졌어요. ${C.TYPES[T.beats].name}에 강하고 ${C.TYPES[beatsMe].name}에 약해요.`;
  } else {
    const t = C.topType(v.care), st = C.decideStyle(v);
    $('tendHint').textContent = `지금 성체가 되면: ${C.TYPES[t].name} 타입 · ${C.STYLES[st].name}. 밥은 묵, 훈련은 찌, 놀아주기는 빠 성향을 키워요.`;
  }
}
function renderArena(v) {
  v = v || pet; if (!v) return;
  const adult = v.stage === 'adult', lock = busy || mode !== 'idle';
  $('bReg').disabled = !adult || lock;
  $('bReg').textContent = registered ? '현재 상태로 등록 갱신' : '현재 상태로 결투장 등록';
  $('regInfo').textContent = !adult ? `성체(Lv.50)가 되면 등록할 수 있어요. 지금 Lv.${v.level}.`
    : registered ? `등록됨 · ${C.FORMS[registered.form].name} Lv.${registered.level} · ${registered.wins}승 ${registered.losses}패` : '아직 등록하지 않았어요.';
  const list = $('arenaList'); list.innerHTML = '';
  if (!arena.length) list.innerHTML = '<p class="hint">아직 아무도 등록하지 않았어요. 첫 성체를 올려 보세요.</p>';
  arena.forEach(o => list.appendChild(foeRow(o, v, lock)));
  const nl = $('npcList'); nl.innerHTML = ''; npcs.forEach(n => nl.appendChild(foeRow(n, v, lock)));
}
function foeRow(o, v, lock) {
  const d = document.createElement('div'); d.className = 'foe';
  const c = document.createElement('canvas'); drawSprite(c, o.form);
  const meta = document.createElement('div'); meta.className = 'meta';
  const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = o.name;
  const tag = (txt, cls) => { const t = document.createElement('span'); t.className = 'tag' + (cls ? ' ' + cls : ''); t.textContent = txt; nm.appendChild(t); };
  if (o.mine) tag('내 몬스터'); if (o.npc) tag('연습'); if (o.usedFast) tag('테스트', 'test');
  if (o.type) tag(C.TYPES[o.type].name, 'type');
  if (!o.mine && v.stage === 'adult' && o.type) {
    const m = C.typeMult(v.type, o.type);
    if (m > 1) tag('상성 유리', 'adv'); else if (m < 1) tag('상성 불리', 'dis');
  }
  const sub = document.createElement('div'); sub.className = 'sub';
  sub.textContent = `${(C.FORMS[o.form] || {}).name || '?'}${o.style ? ' · ' + C.STYLES[o.style].name : ''} · Lv.${o.level}` + (o.npc ? '' : ` · ${o.trainer} · ${o.wins}승 ${o.losses}패`);
  const st = document.createElement('div'); st.className = 'st'; st.textContent = `체력 ${o.hp} · 공격력 ${o.atk} · 방어력 ${o.def} · 속도 ${o.spd}`;
  meta.append(nm, sub, st);
  const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = '도전';
  b.disabled = o.mine || v.stage !== 'adult' || lock || v.energy < C.RULES.battleCost;
  b.addEventListener('click', () => startBattle(o.id));
  d.append(c, meta, b); return d;
}

// ---------- 행동 ----------
const doAction = type => run(async () => { const d = await api('/action', { type }); apply(d); toast(d.msg); });
$('bFeed').onclick = () => doAction('feed');
$('bPlay').onclick = () => doAction('play');
$('bClean').onclick = () => doAction('clean');
$('bFast').onclick = () => doAction('fast');
$('bMain').onclick = () => { if (pet.stage === 'egg') doAction('warm'); else $('trainCard').scrollIntoView({ behavior: 'smooth', block: 'center' }); };

$('bStart').onclick = () => run(async () => { const d = await api('/pet', { name: $('nameIn').value.trim() }); apply(d); show(); toast(d.msg); });
$('nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('bStart').click(); });
$('bReset').onclick = () => { $('resetConfirm').hidden = false; $('bReset').hidden = true; };
$('bResetNo').onclick = () => { $('resetConfirm').hidden = true; $('bReset').hidden = false; };
$('bResetYes').onclick = () => { $('resetConfirm').hidden = true; $('bReset').hidden = false; pet = null; registered = null; $('nameIn').value = ''; show(); };

// ---------- 훈련 ----------
document.querySelectorAll('[data-train]').forEach(b => b.onclick = () => run(async () => {
  const d = await api('/train/start', { kind: b.dataset.train });
  apply(d);
  train = { params: d.train.params, t0: performance.now() };
  mode = 'train'; $('pad').hidden = true; $('bStop').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' }); $('bStop').focus({ preventScroll: true });
}));
let stopping = false;
async function stopTrain() {
  if (mode !== 'train' || !train || stopping) return;
  stopping = true;
  const elapsed = performance.now() - train.t0;
  train.frozen = true;
  try { const d = await api('/train/stop', { elapsed }); apply(d); toast(d.msg); }
  catch (e) { toast(e.message); }
  train = null; mode = 'idle'; stopping = false;
  $('bStop').hidden = true; $('pad').hidden = false; render();
}
$('bStop').onclick = stopTrain;
cv.addEventListener('click', () => { if (mode === 'train') stopTrain(); });
document.addEventListener('keydown', e => { if (mode === 'train' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); stopTrain(); } });

// ---------- 결투장 ----------
async function loadArena() { try { const d = await api('/arena'); arena = d.list; npcs = d.npcs; renderArena(); } catch (e) { toast(e.message); } }
$('bRefresh').onclick = loadArena;
$('bReg').onclick = () => run(async () => { const d = await api('/register', {}); apply(d); toast(d.msg); await loadArena(); });

let battleTimer = null;
function startBattle(id) {
  run(async () => {
    const d = await api('/battle', { opponent: id });
    const b = d.battle;
    battle = { mult: b.mult, me: b.me, op: b.op, mh: b.me.hp, oh: b.op.hp, events: b.events, win: b.win, i: 0, lunge: null, flash: null, result: d };
    mode = 'battle'; $('battleCard').hidden = false; $('battleTitle').textContent = `${b.me.name} vs ${b.op.name}`; $('battleLog').innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (b.me.type && b.op.type) {
      const tn = C.TYPES, m = b.mult;
      logLine(`상성: ${tn[b.me.type].name} vs ${tn[b.op.type].name} → ` + (m > 1 ? `유리! 주는 피해 ${C.ADV}배` : m < 1 ? `불리… 주는 피해 ${C.DIS}배` : '보통'), 'miss');
    }
    step();
  });
}
function logLine(txt, cls) { const li = document.createElement('li'); li.textContent = txt; li.className = cls || ''; const L = $('battleLog'); L.appendChild(li); L.scrollTop = L.scrollHeight; }
function describe(e) {
  const A = e.who === 'me' ? battle.me.name : battle.op.name, D = e.who === 'me' ? battle.op.name : battle.me.name;
  return e.miss ? [`${A}의 공격! ${D}이(가) 피했다.`, 'miss'] : [`${A}의 공격${e.crit ? ' (치명타!)' : ''} → ${D}에게 ${e.dmg} 피해${e.eff === 'up' ? ' · 효과가 굉장해!' : e.eff === 'down' ? ' · 효과가 별로…' : ''}`, 'hit'];
}
function step() {
  const b = battle; if (!b) return;
  if (b.i >= b.events.length) return finishBattle();
  const e = b.events[b.i++]; b.lunge = e.who; b.flash = e.miss ? null : (e.who === 'me' ? 'op' : 'me');
  if (!e.miss) { b.mh = e.mh; b.oh = e.oh; }
  const [t, c] = describe(e); logLine(t, c);
  battleTimer = setTimeout(() => { b.lunge = null; b.flash = null; battleTimer = setTimeout(step, 260); }, 440);
}
$('bSkip').onclick = () => {
  const b = battle; if (!b) return; clearTimeout(battleTimer);
  while (b.i < b.events.length) { const e = b.events[b.i++]; if (!e.miss) { b.mh = e.mh; b.oh = e.oh; } const [t, c] = describe(e); logLine(t, c); }
  b.lunge = b.flash = null; finishBattle();
};
function finishBattle() {
  const b = battle; if (!b || b.done) return; b.done = true;
  logLine(b.win ? `승리! ${b.me.name}이(가) 이겼다.` : `패배… ${b.op.name}이(가) 이겼다.`, 'end');
  apply(b.result);
  setTimeout(() => { battle = null; mode = 'idle'; render(); loadArena(); }, 1400);
}

// ---------- 탭 / 진화표 ----------
['care', 'arena', 'dex'].forEach(k => $('t-' + k).onclick = () => {
  ['care', 'arena', 'dex'].forEach(j => { $('t-' + j).setAttribute('aria-selected', j === k); $('p-' + j).hidden = j !== k; });
  if (k === 'arena') loadArena();
});
(function buildDex() {
  const d = $('dex');
  const item = (k, desc) => { const it = document.createElement('div'); const c = document.createElement('canvas'); drawSprite(c, k); const p = document.createElement('p'); const b = document.createElement('b'); b.textContent = C.FORMS[k].name; p.append(b, desc || C.FORMS[k].how); it.append(c, p); return it; };
  const section = (title, keys, descs) => {
    const hh = document.createElement('p'); hh.className = 'stageh'; hh.textContent = title; d.appendChild(hh);
    const g = document.createElement('div'); g.className = 'dex'; keys.forEach((k, i) => g.appendChild(item(k, descs && descs[i]))); d.appendChild(g);
  };
  section('유체', ['mongsil']);
  section('아성체', ['ppulmong', 'dandanmong']);
  C.TYPE_ORDER.forEach(t => {
    const T = C.TYPES[t], weak = C.TYPE_ORDER.find(x => C.TYPES[x].beats === t);
    section(`성체 · ${T.name} — ${C.TYPES[T.beats].name}에 강하고 ${C.TYPES[weak].name}에 약해요`,
      ['atk', 'def', 'all'].map(s => `${t}_${s}`), ['atk', 'def', 'all'].map(s => `${C.STYLES[s].name} · ${C.STYLES[s].how}`));
  });
  section('특별 성체', ['scruffy_muk'], ['돌봄 실수 8회 이상이면 이 모습이 돼요. 타입은 성향대로 정해져요.']);
})();

// ---------- 시작 ----------
setInterval(() => {
  $('clock').textContent = new Date(serverNow()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (pet && mode === 'idle' && !busy) render();
}, 1000);
// 30초마다 서버와 다시 맞춤
setInterval(() => { if (token && mode === 'idle' && !busy && !document.hidden) loadMe().catch(() => {}); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && token && mode === 'idle') loadMe().catch(() => {}); });

requestAnimationFrame(frame);
show();
if (token) loadMe().catch(e => toast(e.message));
})();
