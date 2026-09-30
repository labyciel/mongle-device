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
mukfist:["................",".....######.....","...##oooooo##...","..#oooooooooo#..","..#o##oooo##o#..","..#oo#oooo#oo#..","..#oooooooooo#..","..#ooo####ooo#..","###oooooooooo###","#oo#oooooooo#oo#","#ooo#oooooo#ooo#","#ooo#oooooo#ooo#",".###oooooooo###.","...#oo#..#oo#...","...###....###...","................"],
mukpebble:["................","................","......####......","....##oooo##....","...#oooooooo#...","..#oooooooooo#..","..#oo##oo##oo#..",".#ooo#.oo#.ooo#.",".#oooooooooooo#.",".#oooo#oo#oooo#.",".#ooooo##ooooo#.",".#oooooooooooo#.","..#oooooooooo#..","..##oo####oo##..","...###....###...","................"],
jjicrab:["................","##............##","#o#..........#o#","#oo#........#oo#",".#o#........#o#.","..##.######.##..","...##oooooo##...","..#o#oooooo#o#..",".#o##########o#.",".#oo#.#oo#.#oo#.",".#oooooooooooo#.","..#oo######oo#..","..#oooooooooo#..","...#o#.##.#o#...","..##.#....#.##..","................"],
jjibunny:["....#......#....","...#o#....#o#...","...#o#....#o#...","...#o#....#o#...","....#o####o#....","...#oooooooo#...","..#oo#oooo#oo#..","..#oo#oooo#oo#..","..#oooo##oooo#..","...#oooooooo#...","..#oooooooooo#..",".#o#oooooooo#o#.","..#oooooooooo#..","...#ooo##ooo#...","..###......###..","................"],
ppashield:["................","................","#.#.#......#.#.#","#o#o#......#o#o#","#ooo#.####.#ooo#",".#ooo#oooo#ooo#.","..#oooooooooo#..","..#o##oooo##o#..","..#o#.#oo#.#o#..","..############..","..#oooooooooo#..","..#o#oooooo#o#..","..#oooooooooo#..","..############..","...##......##...","................"],
ppahand:["................","...#.#.#.#......","...#o#o#o#......","...#o#o#o#..##..","..##o#o#o####o#.","..#ooooooooo#o#.",".#oooooooooooo#.",".#oo##oooo##oo#.",".#oo#.#oo#.#oo#.",".#oooooooooooo#.",".#ooooo##ooooo#.","..#oooooooooo#..","...#oooooooo#...","....#oo##oo#....","....###..###....","................"],
b_drop:["................", "......##.##.....", ".....#oo#oo#....", "........#.......", "......####......", "....##oooo##....", "...#oooooooo#...", "..#oooooooooo#..", "..#oo#oooo#oo#..", ".#ooo#oooo#ooo#.", ".#oooooooooooo#.", ".#ooooo##ooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...##########...", "................"],
b_fluff:["................", "................", "................", "...#........#...", "...##......##...", "...#o######o#...", "..#oooooooooo#..", ".#oooooooooooo#.", ".#oo##oooo##oo#.", ".#oooooooooooo#.", "#ooooo#oo#ooooo#", "#oooooo##oooooo#", "#oooooooooooooo#", ".#oooooooooooo#.", "..#o#o####o#o#..", "...#.#....#.#..."],
b_slug:["................", "................", "................", "................", "................", ".#...#..........", "..#.#...........", "..###...........", ".#ooo##.........", "#o#o#oo##.......", "#oooooooo##.....", "#oo##ooooooo##..", "#ooooooooooooo#.", ".#oooooooooooo#.", "..##############", "................"],
r_horn:["................", "................", "................", "....#......#....", "....##....##....", "....########....", "...#oooooooo#...", "..#oooooooooo#..", "..#o#.oooo#.o#..", "..#o##oooo##o#..", "..#oooo##oooo#..", ".#oooooooooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###..."],
r_wing2:["................", "................", "................", "................", "................", "....########....", "...#oooooooo#...", "#.#oooooooooo#.#", "###o#.oooo#.o###", "#o#o##oooo##o#o#", ".##oooo##oooo##.", ".#oooooooooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###..."],
r_shell2:["................", "................", ".....######.....", "...##o#oo#o##...", "..#o#oo##oo#o#..", ".##############.", "...#oooooooo#...", "..#oooooooooo#..", "..#o#.oooo#.o#..", "..#o##oooo##o#..", "..#oooo##oooo#..", ".#oooooooooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###..."],
r_guard:["................", "................", "................", ".....#....#.....", ".....##..##.....", "....########....", "...#oooooooo#...", "..#oooooooooo#..", "..#o#.oooo#.o#..", "..#o##oooo##o#..", "..#oooo##oooo#..", ".#oooo####oooo#.", ".#ooo#oooo#ooo#.", "..#oo#oooo#oo#..", "...##o####o##...", "...###....###..."],
r_bolt:[".........##.....", "........##......", ".......####.....", ".........##.....", "........##......", "....########....", "...#oooooooo#...", "..#oooooooooo#..", "..#o#.oooo#.o#..", "..#o##oooo##o#..", "..#oooo##oooo#..", ".#oooooooooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###..."],
r_band:["................", "................", "................", "................", "................", "....########....", "...#oooooooo#.##", "..############..", "..#o#.oooo#.o#.#", "..#o##oooo##o#..", "..#oooo##oooo#..", ".#oooooooooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###..."],
c_muk_atk:["................", ".###........###.", "#o#o#......#o#o#", "#ooo#.####.#ooo#", ".####oooooo####.", "..#oooooooooo#..", ".#oooooooooooo#.", ".#o##oooooo##o#.", ".#oo#.oooo#.oo#.", ".#oo##oooo##oo#.", ".#ooooo##ooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "..#oooooooooo#..", "..##o##..##o##..", "..####....####.."],
c_muk_def:["................", "................", ".....######.....", "...##o#oo#o##...", "..#o#oo##oo#o#..", ".#oo#oooooo#oo#.", "################", "#oooooooooooooo#", "#ooo###oo###ooo#", "#oooooooooooooo#", "#oooooo##oooooo#", ".#oooooooooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "..##o##..##o##..", "..####....####.."],
c_muk_all:["................", "................", "##............##", "#o#..######..#o#", ".#o##oooooo##o#.", "..#oooooooooo#..", ".#oooooooooooo#.", ".#oo#.oooo#.oo#.", ".#oo##oooo##oo#.", ".#oooo#oo#oooo#.", ".#ooooo##ooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...#oooooooo#...", "...##o#..#o##...", "...###....###..."],
c_jji_def:["................", "................", ".###........###.", "#oo.#......#.oo#", "#ooo#......#ooo#", ".###.######.###.", "..#.#oooooo#.#..", "...#oooooooo#...", "..#oo#.oo#.oo#..", "..#oo##oo##oo#..", "..#oooo##oooo#..", ".#oooooooooooo#.", ".#o#o#o##o#o#o#.", "..#oooooooooo#..", "..#.#.#..#.#.#..", "................"],
c_jji_all:["...#........#...", "...##......##...", "...#o#....#o#...", "...#o#....#o#...", "....#o#..#o#....", "....#oo##oo#....", "...#oooooooo#...", "..#oooooooooo#..", "..#o#.oooo#.o#..", "..#o##oooo##o#..", "..#oooo##oooo#..", "..#oooooooooo#..", ".#o#oooooooo#o#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###..."],
j_blade_arms:["................", "#..............#", "##............##", ".##..........##.", "..##.######.##..", "...##oooooo##...", "..#oooooooooo#..", ".#o##oooooo##o#.", ".#oo#.oooo#.oo#.", ".#oo##oooo##oo#.", ".#ooooo##ooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###...", "................"],
j_crest_bird:["....#......#....", ".....#....#.....", "......#..#......", ".....######.....", "....#oooooo#....", "...#o##oo##o#...", "...#o#.oo#.o#...", "...#o##oo##o#...", "#..#ooo##ooo#..#", "##.#oooooooo#.##", "#o##oooooooo##o#", ".#oooooooooooo#.", "..###oooooo###..", "....#oooooo#....", ".....##..##.....", "....###..###...."],
j_cross_horn:["................", "..##........##..", "...##......##...", "....##....##....", ".....##..##.....", "......####......", ".....#o##o#.....", "...##oooooo##...", "..#oooooooooo#..", "..#o##oooo##o#..", "..#o#.oooo#.o#..", "..#oooo##oooo#..", ".#o#oooooooo#o#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###..."],
c_ppa_atk:["................", ".......##.......", "......#oo#......", ".....######.....", "....#oooooo#....", "#..#oooooooo#..#", "##.#o#.oo#.o#.##", "#o##o##oo##o##o#", "#oo#ooo##ooo#oo#", "#ooo#oooooo#ooo#", ".#oo#oooooo#oo#.", "..###oooooo###..", "....#oooooo#....", "....#oooooo#....", ".....######.....", "....##....##...."],
c_ppa_def:["......####......", "....##oooo##....", "..##oo#oo#oo##..", ".#oo#oo##oo#oo#.", "################", ".......##.......", "....########....", "...#oooooooo#...", "..#o#.oooo#.o#..", "..#o##oooo##o#..", "..#oooo##oooo#..", ".#oooooooooooo#.", ".#oooooooooooo#.", "..#oooooooooo#..", "...##o#..#o##...", "...###....###..."],
c_ppa_all:["................", "................", "................", "...#.#.#.#.#....", "..#o#o#o#o#o#...", "..#ooooooooo#...", ".#ooooooooooo#..", ".#oo#.ooo#.oo#..", ".#oo##ooo##oo#..", ".#oooo###oooo#..", ".#ooooooooooo#..", "#o#ooooooooo#o#.", ".#ooooooooooo#..", "..#ooooooooo#...", "..##o#...#o##...", "..###.....###..."]
};
// key는 모습(look) 이름이거나 예전 형태(form) 이름
const spriteOf = key => S[key] || S[(C.FORMS[key] || {}).sprite] || S.b_drop;
const lookOf = o => (o && (o.look || o.form)) || 'egg';
// 화면에 보이는 종류 표시: 모습 이름(C.LOOKS)은 개발용이라 화면에 쓰지 않고 단계·타입·형태로만 표시
function kindText(o) {
  if (!o) return '';
  const stage = o.stage || 'adult';
  if (stage === 'egg') return '알';
  if (stage === 'baby') return '유체';
  if (stage === 'rookie') return `아성체 · ${{ atk: '공격', def: '방어', spd: '속도' }[C.rookieSide(o.form)]} 쪽`;
  return `${o.type ? C.TYPES[o.type].name + ' 타입' : '성체'}${o.style ? ' · ' + C.STYLES[o.style].name : ''}`;
}
// 공격 손 (위에서부터 묵·찌·빠). '#' 테두리, 'o' 밝은 속. 손 모양 점만 그리고 주변은 몬스터가 그대로 보임
const HANDS = {
  muk: [".#.#.#.#.","#o#o#o#o#","#o#o#o#o#","#####o#o#","#oooo#oo#","#####ooo#",".#ooooo#.","..#####.."],
  jji: [".#...#..","#o#.#o#.","#o#.#o#.",".#o#o#..","##ooo##.","#oooooo#","#####oo#",".#ooooo#","..#####."],
  ppa: [".....#.....","...##o##...","..#o#o#o##.","..#o#o#o#o#",".##o#o#o#o#","#o#ooooooo#","#ooooooooo#",".#ooooooo#.","..#######.."]
};
// 공격형이 공격할 때 쓰는 큰 손 (참고 그림 기반 12칸 크기)
const HANDS_BIG = {
  muk: [".##.##.##...","#oo#oo#oo##.","#oo#oo#oo#o#","#oo#oo#oo#o#","#oo#oo#oo#o#","#######oo#o#","#oooooo#ooo#","########ooo#","#ooooooooo#.",".#oooooooo#.","..#oooooo#..","...######..."],
  jji: [".##.....##.","#oo#...#oo#","#oo#...#oo#",".#oo#.#oo#.",".#oo#.#oo#.","..#oo#oo#..",".#oooooo###","########oo#","#ooooooo#o#","########oo#",".#ooooooo#.","..#######.."],
  ppa: ["......#......","....##o##....","...#o#o#o#...","...#o#o#o##..","...#o#o#o#o#.","...#o#o#o#o#.",".#.#o#o#o#o#.","#o#oooooooo#.","#oooooooooo#.",".#ooooooooo#.","..#ooooooo#..","...#######..."]
};
// 체력바: 1칸 = 체력 35, 한 줄 16칸 넘으면 아래 줄로
const HP_PER_CELL = 35, HP_ROW = 16;
// 배틀 연출 타이밍 (ms): 손이 톡 붙는 순간 / 손이 사라지는 순간 / 깜빡임 끝 / 다음 공격
const HIT = { land: 80, handEnd: 450, end: 720, next: 950 };
const POOP = ["...#....","..#o#...","..###...",".#ooo#..",".#####..","#ooooo#.","#######.","........"];

// ---------- 상태 ----------
const TOKEN_KEY = 'mongle-token';
let token = null; try { token = localStorage.getItem(TOKEN_KEY); } catch (e) {}
let nick = '', pet = null, mine = [], maxEntries = 2, allowFast = false;   // 테스트 모드(빠른 성장)는 서버가 허용할 때만 보임
let fighterId = null, picks = [];   // 출전할 내 몽글이, 무작위로 뽑힌 상대들
let offset = 0;            // 서버시계 - 내 시계 (ms)
let mode = 'idle', train = null, battle = null, evo = null, busy = false, evoKey = null, warming = false, lastSync = 0;
let arena = [];
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
    if (warming && pet && pet.stage !== 'egg') { warming = false; clearInterval(warmT); warmT = null; }   // 품다가 부화함
    // 진화: 서버가 진화시킨 뒤 아직 안 본 장면(evoUnseen)이 있으면 보여 주고, 다 보면 서버에 알림
    const e = pet && pet.evoUnseen, key = e && `${e.from}>${e.to}@${e.at}`;
    if (e && key !== evoKey) {
      evoKey = key;
      evo = { from: e.from, to: e.to, until: performance.now() + 1800 };
      setTimeout(() => {
        const b0 = C.bstats(pet);
        toast(pet.stage === 'adult' ? `성체로 진화했어요! ${kindText(pet)}` : pet.stage === 'baby' ? `부화했어요! 체력 ${b0.hp} · 공격력 ${b0.atk} · 방어력 ${b0.def} · 속도 ${b0.spd}` : `${C.STAGE_KO[pet.stage]}(으)로 진화했어요!`);
        api('/seen', {}).then(apply).catch(() => {});
      }, 1800);
    }
    void prevForm;
  }
  if ('mine' in data) {
    mine = data.mine || [];
    if (!mine.some(e => e.id === fighterId)) fighterId = mine.length ? mine[0].id : null;
  }
  if (data.maxEntries) maxEntries = data.maxEntries;
  if ('allowFast' in data) allowFast = data.allowFast;
  if (data.nick) nick = data.nick;
}
async function run(fn, onErr = toast) {
  if (busy) return; busy = true; render();
  try { await fn(); } catch (e) { onErr(e.message); }
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
function logoutLocal() { token = null; pet = null; mine = []; fighterId = null; picks = []; try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} mode = 'idle'; train = null; battle = null; show(); }

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
function spr(g, ox, oy, flip) { for (let y = 0; y < g.length; y++) { const r = g[y]; for (let x = 0; x < r.length; x++) { const c = r[flip ? r.length - 1 - x : x]; if (c === '#') px(ox + x, oy + y, 2); else if (c === 'o') px(ox + x, oy + y, 1); else if (c === 'h') px(ox + x, oy + y, 3); } } }
function rect(x, y, w, h, v) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, v); }
function flush(invert) {
  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue('--lcd').trim(), on = cs.getPropertyValue('--lcd-on').trim(), mid = cs.getPropertyValue('--lcd-mid').trim(), gh = cs.getPropertyValue('--lcd-ghost').trim(), hi = cs.getPropertyValue('--lcd-hi').trim() || '#C8D4AA';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = fb[y * W + x]; if (invert) v = v ? 0 : 2; ctx.fillStyle = v === 2 ? on : v === 1 ? mid : v === 3 ? hi : gh; ctx.fillRect(x * P, y * P, P - 1, P - 1); }
}
// 방어막: 몸 바로 바깥 한 겹 (상하좌우로 맞닿은 빈칸)
function shield(g, ox, oy, flip, v) {
  const w = g[0].length, h = g.length, filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && g[y][flip ? w - 1 - x : x] !== '.';
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++)
    if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) px(ox + x, oy + y, v);
}
// 최대 체력만큼 칸, 남은 체력만큼 진한 칸 (남아 있으면 최소 1칸)
function hpBar(x0, cur, max) {
  const n = Math.max(4, Math.round(max / HP_PER_CELL)), on = cur <= 0 ? 0 : Math.max(1, Math.ceil(n * cur / max));
  for (let i = 0; i < n; i++) px(x0 + (i % HP_ROW), i < HP_ROW ? 1 : 2, i < on ? 2 : 1);
}
const styleOf = form => (C.FORMS[form] || {}).style;
function drawSprite(canvas, form) {
  const c = canvas.getContext('2d'); canvas.width = 16; canvas.height = 16;
  const cs = getComputedStyle(document.documentElement);
  const on = cs.getPropertyValue('--lcd-on').trim(), mid = cs.getPropertyValue('--lcd-mid').trim();
  spriteOf(form).forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; c.fillStyle = ch === '#' ? on : mid; c.fillRect(x, y, 1, 1); }));
}

// ---------- 밥 먹기 연출 ----------
// 모습별 입 위치 (16×16 그림 안의 x, y, 너비, 높이). 새 모습을 추가하면 여기에도 넣어야 입이 벌어져요
const MOUTH = {
  b_drop:{x:7,y:11,w:2,h:1}, b_fluff:{x:6,y:10,w:4,h:2}, b_slug:{x:3,y:11,w:2,h:1},
  r_horn:{x:7,y:10,w:2,h:1}, r_wing2:{x:7,y:10,w:2,h:1}, r_shell2:{x:7,y:10,w:2,h:1}, r_guard:{x:7,y:10,w:2,h:1}, r_bolt:{x:7,y:10,w:2,h:1}, r_band:{x:7,y:10,w:2,h:1},
  mukfist:{x:6,y:7,w:4,h:1}, ironshell:{x:4,y:10,w:8,h:1}, mukpebble:{x:6,y:9,w:4,h:2},
  c_muk_atk:{x:7,y:10,w:2,h:1}, c_muk_def:{x:7,y:10,w:2,h:1}, c_muk_all:{x:6,y:9,w:4,h:2},
  jjibunny:{x:7,y:8,w:2,h:1}, c_jji_def:{x:7,y:10,w:2,h:1}, c_jji_all:{x:7,y:10,w:2,h:1},
  j_blade_arms:{x:7,y:10,w:2,h:1}, j_crest_bird:{x:7,y:8,w:2,h:1}, j_cross_horn:{x:7,y:11,w:2,h:1},
  galewing:{x:7,y:7,w:2,h:1}, c_ppa_atk:{x:7,y:8,w:2,h:1}, c_ppa_def:{x:7,y:10,w:2,h:1}, c_ppa_all:{x:6,y:9,w:3,h:1}
};
// 뼈 달린 고기 (14×14). 몽글이 쪽(왼쪽 아래)부터 한 입씩: 0 온전 → 1 → 2 → 3 뼈만. h = 밝은 칸(뼈·윤기)
const MEAT = [["..........#...", ".........#h#..", "........#hh##.", "......####hhh#", "....##ohoo#h#.", "...#oohooo##..", "...#ohoooo#...", "..#ooooooo#...", "..##ooooo#....", ".#h#ooooo#....", "#hhh##o##.....", ".##hh##.......", "..#h#.........", "...#.........."],
   ["..........#...", ".........#h#..", "........#hh##.", "......####hhh#", "....##ohoo#h#.", "...#oohooo##..", "...#ohoooo#...", "....#ooooo#...", "..#.##ooo#....", ".#h#h##oo#....", "#hhh#..##.....", ".##hh#........", "..#h#.........", "...#.........."],
   ["..........#...", ".........#h#..", "........#hh##.", "......####hhh#", ".....#ohoo#h#.", "......#ooo##..", "......##oo#...", ".....#h##o#...", "..#.#h#..#....", ".#h#h#........", "#hhh#.........", ".##hh#........", "..#h#.........", "...#.........."],
   ["..........#...", ".........#h#..", "........#hh##.", ".........#hhh#", "........#h#h#.", ".......#h#.#..", "......#h#.....", ".....#h#......", "..#.#h#.......", ".#h#h#........", "#hhh#.........", ".##hh#........", "..#h#.........", "...#.........."]];
// 입 벌린 그림: 원래 입을 지우고 그 자리에 세로 3칸짜리 벌린 입을 그림
function openMouth(g, m) {
  const a = g.map(r => r.split(''));
  for (let y = m.y; y < m.y + m.h; y++) for (let x = m.x; x < m.x + m.w; x++) if (a[y][x] === '#') a[y][x] = 'o';
  const W = Math.max(4, m.w % 2 ? m.w + 1 : m.w), x0 = Math.round(m.x + m.w / 2 - W / 2), y0 = m.y;
  const put = (x, y) => { if (y >= 0 && y < 16 && x >= 0 && x < 16) a[y][x] = '#'; };
  for (let x = x0 + 1; x < x0 + W - 1; x++) { put(x, y0); put(x, y0 + 2); }
  for (let x = x0; x < x0 + W; x++) put(x, y0 + 1);
  return a.map(r => r.join(''));
}
const OPEN_CACHE = {};
const openOf = key => OPEN_CACHE[key] || (OPEN_CACHE[key] = MOUTH[key] ? openMouth(spriteOf(key), MOUTH[key]) : spriteOf(key));
// 3번 씹기: 벌림 200ms(고기 쪽으로 1칸) + 다묾 220ms(한 입) → 통통 두 번 → 뼈가 0.7초 남았다 사라짐
const EAT = { open: 200, close: 220, hop: 180, bone: 700, chomps: 3 };
EAT.total = EAT.chomps * (EAT.open + EAT.close) + EAT.hop * 4 + EAT.bone;
let eat = null;   // { t0 } 밥 먹는 중
const eating = () => !!eat && performance.now() - eat.t0 < (eat.refuse ? REFUSE.total : EAT.total);
function eatState(t) {
  const cyc = EAT.open + EAT.close, end = EAT.chomps * cyc;
  if (t < end) {
    const i = Math.floor(t / cyc), p = t - i * cyc, open = p < EAT.open;
    return { open, lean: open ? 1 : 0, bite: Math.min(3, open ? i : i + 1), hop: 0, crumb: open ? -1 : p - EAT.open };
  }
  const h = t - end;
  return { open: false, lean: 0, bite: 3, hop: h < EAT.hop * 4 && !(Math.floor(h / EAT.hop) % 2) ? -1 : 0, crumb: -1, gone: h >= EAT.hop * 4 };
}
// 배부를 때: 고기는 놓이지만 먹지 않고 얼굴을 좌우로 돌림 (거절)
const REFUSE = { steps: [0, -1, 1, -1, 1, 0], step: 250 };
REFUSE.total = REFUSE.steps.length * REFUSE.step;
// 얼굴 돌리기: 몸 안쪽의 진한 칸(눈·입 같은 얼굴)을 한 칸 옆으로 옮긴 그림
const TURN_CACHE = {};
function faceTurn(key, dir) {
  const ck = key + dir; if (TURN_CACHE[ck]) return TURN_CACHE[ck];
  const g = spriteOf(key), m = MOUTH[key], maxY = m ? m.y + m.h - 1 : 11;   // 입 줄까지만 (팔·발은 그대로)
  return TURN_CACHE[ck] = g.map((r, y) => {
    if (y > maxY) return r;
    const a = [...r], first = r.search(/[^.]/), last = r.length - 1 - [...r].reverse().join('').search(/[^.]/);
    if (first < 0) return r;
    const feats = [];
    for (let x = first + 1; x < last; x++) if (r[x] === '#' && (r[x - 1] === 'o' || r[x + 1] === 'o')) { feats.push(x); a[x] = 'o'; }
    feats.forEach(x => { const nx = x + dir; a[nx > first && nx < last ? nx : x] = '#'; });
    return a.join('');
  });
}
function drawRefuse(t) {
  const key = lookOf(pet), m = MOUTH[key] || { y: 10 }, px0 = 6, py0 = 2;
  const dir = REFUSE.steps[Math.min(REFUSE.steps.length - 1, Math.floor(t / REFUSE.step))];
  spr(dir ? faceTurn(key, dir) : spriteOf(key), px0 + dir, py0, false);
  const fx = px0 + 17, fy = Math.max(0, Math.min(H - MEAT[0].length, py0 + m.y - 7));
  spr(MEAT[0], fx, fy, false);
}
function drawEat(t) {
  const key = lookOf(pet), m = MOUTH[key] || { y: 10 }, st = eatState(t), px0 = 6, py0 = 2;
  spr(st.open ? openOf(key) : spriteOf(key), px0 + st.lean, py0 + st.hop, false);
  const fx = px0 + 17, fy = Math.max(0, Math.min(H - MEAT[0].length, py0 + m.y - 7));
  if (!st.gone) spr(MEAT[st.bite], fx, fy, false);
  if (st.crumb >= 0 && st.bite > 0) {
    const d = Math.min(3, Math.floor(st.crumb / 60)), cx = fx + [0, 4, 6, 7][st.bite], cy = fy + [0, 10, 8, 7][st.bite];
    px(cx, cy + d, 2); if (st.crumb > 60) px(cx - 2, cy + 1 + d, 1);
  }
}

// ---------- 체력 훈련 (줄넘기 왕복) ----------
// 작은 숫자 (3×5), 왼쪽 위 성공 횟수용
const DIG = { 0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'], 3: ['###', '..#', '###', '..#', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '###', '..#', '###'], 6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '###'] };
const num = (n, x, y) => String(n).split('').forEach((d, i) => spr(DIG[d], x + i * 4, y, false));
// 줄: 양손(몸 양옆 가운데)을 잇는 곡선. th=0 머리 위 → π/2 몸 앞 → π 발밑 → 3π/2 몸 뒤
const ROPE_MS = 380, HAND_L = 11, HAND_R = 28, HAND_Y = 9, ROPE_R = 8, ROPE_PX = 12;
function drawJumpRope(th, g, py, behind) {
  const apex = HAND_Y - ROPE_R * Math.cos(th), cx = (HAND_L + HAND_R) / 2, half = (HAND_R - HAND_L) / 2;
  const onBody = (x, y) => { const bx = x - ROPE_PX, by = y - py; return by >= 0 && by < 16 && bx >= 0 && bx < 16 && g[by][bx] !== '.'; };
  let prev = null;
  for (let x = HAND_L; x <= HAND_R; x++) {
    const u = (x - cx) / half, y = Math.round(HAND_Y + (apex - HAND_Y) * (1 - u * u));
    const ys = prev === null || prev === y ? [y] : Array.from({ length: Math.abs(y - prev) }, (_, i) => prev + Math.sign(y - prev) * (i + 1));
    ys.forEach(yy => { const on = onBody(x, yy); if (!(behind && on)) px(x, yy, on ? 3 : 2); });
    prev = y;
  }
  px(HAND_L, HAND_Y, 2); px(HAND_R, HAND_Y, 2);   // 줄 손잡이
}
function drawRope(t, tr, p, st) {
  // 몽글이 + 줄넘기: 성공하면 줄이 한 바퀴 돌고, 줄이 발밑을 지날 때 폴짝
  const g = spriteOf(lookOf(pet)), rp = (t - tr.rope) / ROPE_MS, turning = rp >= 0 && rp < 1, th = turning ? rp * 2 * Math.PI : 0;
  const up = turning ? Math.round(2 * Math.sin(Math.PI * C.clamp((rp - 0.2) / 0.6, 0, 1))) : 0;
  const back = Math.sin(th) < 0;
  if (back) drawJumpRope(th, g, -up, true);
  spr(g, ROPE_PX, -up, false);
  if (!back) drawJumpRope(th, g, -up, false);
  num(st.ok, 1, 1);
  // 막대: 가운데 줄 + 양끝 구역(위아래로 두껍게) + 구역 경계선
  const X = 2;
  for (let i = 0; i < p.len; i++) { const z = i < p.zone || i >= p.len - p.zone; px(X + i, 18, 1); if (z) { px(X + i, 17, 1); px(X + i, 19, 1); } }
  for (const x of [X + p.zone - 1, X + p.len - p.zone]) for (let y = 16; y <= 19; y++) px(x, y, 2);
  // 가고 있는 쪽 구역은 위에서 깜빡임
  if (!tr.done && Math.floor(t / 250) % 2) { const z0 = st.dir > 0 ? p.len - p.zone : 0; for (let i = 0; i < p.zone; i++) px(X + z0 + i, 16, 1); }
  // 원: 성공 직후 밝게 번쩍
  const cx = X + Math.round(st.pos), lit = t - tr.flash < 140;
  [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => px(cx + dx, 18 + dy, lit ? 3 : 2));
  if (!lit) px(cx, 18, 3);
}

// ---------- 속도 훈련 (폭탄 피하기) ----------
// 3줄(경계선 x=0|13|26|39), 몽글이는 8×8로 줄여서 아래(11~18줄), 폭탄 몸통이 줄 한가운데 오도록 x+2
const D_LANE_X = [1, 14, 27], D_PET_Y = 11, D_BX = 2;
const BOMB = [
  ['......h', '.....#.', '...oo..', '..####.', '.#h####', '.#h####', '.######', '..####.'],
  ['.....h.', '.....#h', '...oo..', '..####.', '.#h####', '.#h####', '.######', '..####.']
];
const BOOM = [
  ['.........', '.........', '....h....', '...hhh...', '..hh#hh..', '...hhh...', '....h....', '.........', '.........'],
  ['....#....', '.#..h..#.', '..#.h.#..', '...hhh...', '#hhh#hhh#', '...hhh...', '..#.h.#..', '.#..h..#.', '....#....'],
  ['#...#...#', '.........', '..h...h..', '.........', 'h.......h', '.........', '..h...h..', '.........', '#...#...#']
];
// 16×16 모습을 8×8로 (2×2칸마다: 진한 칸 2개 이상 → 진하게, 칠한 칸 2개 이상 → 중간색)
const MINI = {};
function miniOf(key) {
  if (MINI[key]) return MINI[key];
  const g = spriteOf(key), out = [];
  for (let Y = 0; Y < 8; Y++) { let r = ''; for (let X = 0; X < 8; X++) {
    const b = [g[2 * Y][2 * X], g[2 * Y][2 * X + 1], g[2 * Y + 1][2 * X], g[2 * Y + 1][2 * X + 1]], h = b.filter(c => c === '#').length, o = b.filter(c => c === 'o').length;
    r += h >= 2 ? '#' : h + o >= 2 ? 'o' : h === 1 ? '#' : '.'; } out.push(r); }
  return MINI[key] = out;
}
function drawDodge(t, tr, p, st, at) {
  // 줄 경계선: 떨어지는 속도에 맞춰 흐르는 점선
  const off = Math.floor(C.dodgeDist(p, at)) % 3;
  for (let y = 0; y < H; y++) if ((y + 3 - off) % 3 !== 0) [0, 13, 26, 39].forEach(x => px(x, y, 1));
  // 폭탄 (부딪힌 폭탄은 터지는 그림으로 바뀜)
  const bf = BOMB[Math.floor(t / 140) % 2];
  for (let i = 0; i < p.maxOk + 2; i++) {
    const y = C.dodgeWaveY(p, i, at); if (y + p.bombH - 1 < 0) break; if (y >= H) continue;
    tr.plan[i].forEach(l => { if (tr.done && st.over === 'hit' && i === st.hitWave && l === st.lane) return; spr(bf, D_LANE_X[l] + D_BX, y, false); });
  }
  // 몽글이 (옮긴 직전 줄에 잔상 점), 부딪히면 깜빡 + 펑
  if (t - tr.movedAt < 90) { const fx = D_LANE_X[tr.from] + 2; px(fx + 2, D_PET_Y + 4, 1); px(fx + 5, D_PET_Y + 4, 1); }
  const since = tr.done ? Math.max(0, t - tr.doneAt) : 0;
  if (!(tr.done && st.over === 'hit' && Math.floor(since / 120) % 2)) spr(miniOf(lookOf(pet)), D_LANE_X[st.lane] + 2, D_PET_Y, false);
  if (tr.done && st.over === 'hit' && since < 390) spr(BOOM[Math.floor(since / 130)], D_LANE_X[st.lane] + 2, D_PET_Y - 1, false);
  // 준비 중: 세 줄 위쪽 가운데 깜빡
  if (at < p.ready && Math.floor(t / 200) % 2) D_LANE_X.forEach(x => { px(x + 5, 1, 2); px(x + 6, 1, 2); });
}

// ---------- 방어 훈련 (조준점 막기) ----------
// 몽글이를 액정(400×200)에 꽉 차게 키워 그림. 막을 곳 5군데: 몸 크기 직사각형 네 꼭짓점(안쪽 3칸) + 정가운데
const G_R = 3.6, G_INSET = 3, GUARD_LAYOUT = {};
function guardLayout(key) {
  if (GUARD_LAYOUT[key]) return GUARD_LAYOUT[key];
  const g = spriteOf(key); let x0 = 16, x1 = -1, y0 = 16, y1 = -1;
  g.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
  const w = x1 - x0 + 1, h = y1 - y0 + 1, S = Math.floor(Math.min(196 / (h + 2), 396 / (w + 2)));
  const L = x0 + G_INSET, R = x1 + 1 - G_INSET, T = y0 + G_INSET, B = y1 + 1 - G_INSET;
  return GUARD_LAYOUT[key] = { g, x0, y0, w, h, S, OX: Math.floor((400 - w * S) / 2), OY: Math.floor((200 - h * S) / 2),
    spots: [[L, T], [R, T], [L, B], [R, B], [x0 + w / 2, y0 + h / 2]] };
}
function guardTap(e, tr, st, at) {
  const Lo = guardLayout(lookOf(pet)), r = cv.getBoundingClientRect();
  const gx = Lo.x0 + ((e.clientX - r.left) / r.width * 400 - Lo.OX) / Lo.S, gy = Lo.y0 + ((e.clientY - r.top) / r.height * 200 - Lo.OY) / Lo.S;
  const spot = tr.plan[st.ok].spot, [sx, sy] = Lo.spots[spot], hit = Math.hypot(gx - sx, gy - sy) <= G_R;
  if (hit) tr.hits.push({ at: performance.now(), x: sx, y: sy });
  return { t: Math.round(at), v: hit ? spot : -1 };
}
function drawGuard(t, tr, p, st, at) {
  const now = performance.now();
  const Lo = guardLayout(lookOf(pet)), S = Lo.S, cs = getComputedStyle(document.documentElement), col = k => cs.getPropertyValue(k).trim();
  const K = { bg: col('--lcd'), gh: col('--lcd-ghost'), mid: col('--lcd-mid'), on: col('--lcd-on'), hi: col('--lcd-hi') || '#C8D4AA' };
  const dot = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Lo.OX + (x - Lo.x0) * S, Lo.OY + (y - Lo.y0) * S, S - 1, S - 1); };
  ctx.fillStyle = K.bg; ctx.fillRect(0, 0, 400, 200);
  for (let y = -1; y * S < 200; y++) for (let x = -1; x * S < 400; x++) { ctx.fillStyle = K.gh; ctx.fillRect(Lo.OX % S + x * S, Lo.OY % S + y * S, S - 1, S - 1); }
  Lo.g.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') dot(x, y, c === '#' ? K.on : K.mid); }));
  // 막은 자리: 방패가 잠깐 번쩍
  const last = tr.hits[tr.hits.length - 1];
  if (last && now - last.at < 260) ['.###.', '#hhh#', '#hhh#', '.#h#.', '..#..'].forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') dot(Math.floor(last.x) - 2 + x, Math.floor(last.y) - 2 + y, c === 'h' ? K.hi : K.on); }));
  // 조준점 + 남은 시간 막대 (3연속이면 옆에 점 3개)
  if (!tr.done && at >= st.appear && st.ok < p.maxOk) {
    const w = C.shrinkWindow(p, st.ok), left = 1 - (at - st.appear) / w, plan = tr.plan[st.ok], [sx, sy] = Lo.spots[plan.spot];
    const cx = Lo.OX + (sx - Lo.x0) * S, cy = Lo.OY + (sy - Lo.y0) * S;
    if (!(left < 0.3 && Math.floor(t / 80) % 2)) {
      const r = S * 2.4, a = S, b = S * 3.6, shape = () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { ctx.moveTo(cx + dx * a, cy + dy * a); ctx.lineTo(cx + dx * b, cy + dy * b); }); };
      ctx.lineCap = 'square'; ctx.strokeStyle = K.on; ctx.lineWidth = 9; shape(); ctx.stroke(); ctx.strokeStyle = K.hi; ctx.lineWidth = 4; shape(); ctx.stroke();
      ctx.fillStyle = K.on; ctx.fillRect(cx - 5, cy - 5, 10, 10); ctx.fillStyle = K.hi; ctx.fillRect(cx - 3, cy - 3, 6, 6);
    }
    if (plan.step) for (let k = 0; k < 3; k++) { const x = cx + S * 4.3, y = cy - S * 1.6 + k * S * 1.6; ctx.fillStyle = K.on; ctx.fillRect(x - 8, y - 8, 16, 16); ctx.fillStyle = k < plan.step ? K.hi : K.mid; ctx.fillRect(x - 5, y - 5, 10, 10); }
    ctx.fillStyle = K.on; ctx.fillRect(4, 3, Math.max(0, 392 * left), 5);
  }
  if (at < p.ready && Math.floor(t / 200) % 2) { ctx.fillStyle = K.on; ctx.fillRect(4, 3, 392, 5); }
  if (tr.done && tr.final.over !== 'max' && now - tr.doneAt < 300 && Math.floor((now - tr.doneAt) / 100) % 2 === 0) { ctx.fillStyle = 'rgba(36,48,32,.55)'; ctx.fillRect(0, 0, 400, 200); }
}

// ---------- 공격 훈련 (묵찌빠) ----------
// 오른쪽 상대 손을 보고 이기는 손(까만 말풍선이면 지는 손)을 냄. 맞히면 내 손이 날아가 상대 손을 때림
function drawRps(t, tr, p, st, at) {
  const now = performance.now(), fx = tr.fx, since = fx ? now - fx.at : 1e9;
  spr(spriteOf(lookOf(pet)), 2 + (fx && fx.good && since < 160 ? 1 : 0), 3, false);
  const showing = !tr.done && at >= st.appear && st.ok < p.maxOk, q = tr.plan[Math.min(st.ok, p.maxOk - 1)];
  const opHand = showing ? q.op : fx && since < 350 ? fx.op : null;
  if (opHand) {
    const hit = fx && since < 350 && !showing, shake = hit && fx.good ? (Math.floor(since / 50) % 2 ? 1 : -1) : 0;
    if (!(hit && fx.good && Math.floor(since / 70) % 2)) spr(HANDS_BIG[opHand], 25 + shake, 4, true);
  }
  if (fx && since < 350) {
    const x = Math.round(17 + 8 * Math.min(1, since / 120)), g = HANDS[fx.mine];
    g.forEach((r, y) => [...r].forEach((c, xx) => { if (c === '#') px(x + 2 + xx, 6 + y, 2); else if (c === 'o') px(x + 2 + xx, 6 + y, 3); }));
    if (fx.good && since > 120 && since < 260) [[23, 3], [37, 3], [23, 16], [37, 16]].forEach(([a, b]) => px(a, b, 3));
  }
  if (showing) { const left = 1 - (at - st.appear) / C.shrinkWindow(p, st.ok); for (let x = 0; x < Math.round(40 * left); x++) px(x, 0, 2); }
  if (at < p.ready && Math.floor(t / 200) % 2) for (let x = 0; x < 40; x++) px(x, 0, 2);
  const ask = $('ask'); ask.hidden = !showing;
  if (showing) { ask.className = 'ask ' + (q.lose ? 'lose' : 'win'); ask.textContent = q.lose ? '지는 손!' : '이기는 손!'; }
}

// ---------- 훈련 게임 공통 ----------
// run: 규칙(core), plan: 씨앗으로 만든 순서, draw: 그리기, pads: 이 게임에서 보일 버튼, result: 결과 두 줄, boom: 결과 전 기다림(ms)
const GAMES = {
  rope:  { run: C.ropeRun,  draw: drawRope,  pads: 'bStop', result: ['성공', '체력'], boom: 0, label: n => `성공 ${n}` },
  dodge: { run: C.dodgeRun, draw: drawDodge, pads: 'dPads', result: ['피한 수', '속도'], boom: 400, plan: C.dodgeWaves, label: n => `피함 ${n}` },
  guard: { run: C.guardRun, draw: drawGuard, pads: null,    result: ['방어 성공', '방어력'], boom: 300, plan: C.guardPlan, label: n => `방어 ${n}`, direct: true },
  rps:   { run: C.rpsRun,   draw: drawRps,   pads: 'rpsPad', result: ['공격 성공', '공격력'], boom: 450, plan: C.rpsPlan, label: n => `공격 ${n}` }
};
const trainAt = tr => tr.done ? tr.final.endAt : performance.now() - tr.t0;
const trainState = tr => tr.done ? tr.final : GAMES[tr.params.game].run(tr.params, tr.taps, trainAt(tr), tr.plan);
// 입력 하나를 기록하고 끝났으면 마무리
function trainInput(make) {
  const tr = train; if (!tr || tr.done) return;
  const at = performance.now() - tr.t0, st = trainState(tr);
  if (st.over || at < (st.appear != null ? st.appear : tr.params.ready)) return;   // 준비 중·문제가 뜨기 전은 무시
  const tap = make(tr, st, at); if (tap == null) return;
  tr.taps.push(tap);
  const after = GAMES[tr.params.game].run(tr.params, tr.taps, at, tr.plan);
  if (after.ok > st.ok) tr.flash = tr.rope = performance.now();
  if (after.over) finishGame(after);
}
function drawTraining(t) {
  const tr = train, G = GAMES[tr.params.game], st = trainState(tr);
  if (!tr.done && st.over) finishGame(st);
  G.draw(t, tr, tr.params, st, trainAt(tr));
  if (G.label) $('lcdR').textContent = G.label(st.ok);
  // 끝나는 순간 화면 깜빡 (다 성공한 경우 빼고)
  return tr.done && tr.final.over !== 'max' && t - tr.doneAt < 450 && Math.floor((t - tr.doneAt) / 150) % 2 === 0;
}

function frame(t) {
  fb.fill(0); let inv = false;
  if (!pet) spr(S.egg, 12, 2, false);
  else if (evo && t < evo.until) { const ph = Math.floor(t / 150) % 2; spr(spriteOf(ph ? evo.to : evo.from), 12, 2, false); inv = ph === 1; }
  else if (mode === 'train' && train) {
    inv = drawTraining(t);
    if (GAMES[train.params.game].direct) { requestAnimationFrame(frame); return; }   // 방어는 캔버스에 직접 크게 그림
  }
  else if (mode === 'battle' && battle) {
    const b = battle, fx = b.fx && t < b.fx.at + HIT.end ? b.fx : null;
    const since = fx ? t - fx.at : 0, handOn = fx && since < HIT.handEnd;
    const blink = fx && !fx.miss && !handOn && Math.floor(t / 70) % 2;          // 맞은 쪽 깜빡임
    const dodge = fx && fx.miss && !handOn ? 3 : 0;                              // 빗나가면 살짝 피함
    [['me', b.me, 2, false], ['op', b.op, 22, true]].forEach(([who, m, x0, flip]) => {
      const hit = fx && fx.target === who, g = spriteOf(lookOf(m)), ox = x0 + (hit ? (who === 'me' ? -dodge : dodge) : 0);
      // 방어형은 방어막을 두름. 맞는 동안엔 방어막이 진하게 번쩍
      if (styleOf(m.form) === 'def') shield(g, ox, 4, flip, hit && !fx.miss && (blink || (handOn && since >= HIT.land)) ? 2 : 1);
      if (!(blink && hit)) spr(g, ox, 4, flip);
    });
    if (handOn) {
      // 공격하는 쪽 타입의 손을 상대 몬스터 몸 위에 덮어씌움 (손 모양 점만)
      const set = fx.big ? HANDS_BIG : HANDS;                                      // 공격형은 큰 손
      const g = set[fx.type] || set.muk, w = g[0].length, h = g.length, flip = fx.target === 'me';
      const ox = (fx.target === 'op' ? 30 : 10) - Math.floor(w / 2), oy = 11 - Math.floor(h / 2) + (since < HIT.land ? -2 : 0);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = g[y][flip ? w - 1 - x : x];
        if (c === '#') px(ox + x, oy + y, 2); else if (c === 'o') px(ox + x, oy + y, 3);
      }
      if (fx.strong && since >= HIT.land && Math.floor(t / 90) % 2)             // 상성 유리: 네 귀퉁이 번쩍
        [[-2, -2], [w + 1, -2], [-2, h + 1], [w + 1, h + 1]].forEach(([dx, dy]) => px(ox + dx, oy + dy, 2));
    }
    hpBar(2, b.mh, b.me.hp); hpBar(22, b.oh, b.op.hp);
  }
  else if (eat && eat.refuse && pet.stage !== 'egg' && t - eat.t0 < REFUSE.total) drawRefuse(t - eat.t0);   // 배불러서 거절
  else if (eat && !eat.refuse && pet.stage !== 'egg' && t - eat.t0 < EAT.total) drawEat(t - eat.t0);   // 밥 먹는 중 (똥은 잠깐 가림)
  else if (pet.stage === 'egg' && warming) {
    const w = Math.floor(t / 120) % 4; spr(S.egg, 12 + (w === 1 ? 1 : w === 3 ? -1 : 0), 2, false);
    // 따뜻한 김: 알 양옆에서 올라가는 점
    const k = Math.floor(t / 150) % 4; [[9, 12 - k * 2], [30, 13 - k * 2], [8, 6 - k], [31, 7 - k]].forEach(([x, y]) => px(x, y, 3));
  }
  else if (pet.stage === 'egg') { const w = Math.floor(t / 500) % 4; spr(S.egg, 12 + (w === 1 ? 1 : w === 3 ? -1 : 0), 2, false); }
  else {
    if (t - lastStep > 700) { lastStep = t; const d = Math.random() < .5 ? -1 : 1; wx = C.clamp(wx + d, 1, 14); facing = d; }
    const bob = Math.floor(t / 350) % 2; spr(spriteOf(lookOf(pet)), wx, 2 + bob, facing < 0);
    const spots = [[24, 12], [32, 12], [24, 3], [32, 3]]; for (let i = 0; i < pet.poops; i++) spr(POOP, spots[i][0], spots[i][1], false);
    if (pet.hunger < 20 || pet.mood < 20) { rect(1, 1, 1, 4, 2); px(1, 6, 2); }   // 배고픔·심심 알림 (오른쪽 위는 묵·찌·빠 자리)
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
    : kindText(v);
  renderTendency(v);
  $('sStage').textContent = C.STAGE_KO[v.stage];
  // 성장(다음 진화까지)과 건강도
  const needG = C.RULES.grow[v.stage], nowMs = serverNow();
  if (needG) { const pctG = Math.floor(100 * Math.min(1, v.grow / needG)); $('mGrow').style.width = pctG + '%'; $('mGrow').className = 'xp'; $('nGrow').textContent = pctG + '%'; }
  else { $('mGrow').style.width = '100%'; $('nGrow').textContent = '완료'; }
  const hv = C.health(v), showH = v.stage !== 'egg' && v.stage !== 'adult';
  ['lHealth', 'bHealth', 'nHealth'].forEach(id => $(id).hidden = !showH);
  if (showH) meter('mHealth', 'nHealth', hv, 100, hv < C.RULES.healthHalf ? 'bad' : hv < C.RULES.healthFull ? 'warn' : '');
  meter('mHun', 'nHun', v.hunger, 100); meter('mMood', 'nMood', v.mood, 100); meter('mEn', 'nEn', v.energy, C.RULES.maxEnergy);
  // 알일 때는 배부름·기분·에너지가 필요 없어서 숨김
  ['Hun', 'Mood', 'En'].forEach(k => ['l', 'b', 'n'].forEach(p => $(p + k).hidden = v.stage === 'egg'));
  const left = C.evoLeft(v, nowMs), rate = C.growRate(v, nowMs);
  const dur = sec => { sec = Math.ceil(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s2 = sec % 60; return h ? `${h}시간 ${m}분` : m ? `${m}분 ${s2}초` : `${s2}초`; };
  const nextName = { egg: '부화', baby: '아성체 진화', rookie: '성체 진화' }[v.stage];
  const onArena = isOnArena(v);
  $('sNext').textContent = v.stage === 'egg' ? `부화까지 약 ${dur(left)}.` + (rate > 1 ? ' 품는 중이라 10배로 흘러요!' : ' 품기를 누르고 있으면 10배로 빨라져요.')
    : nextName ? (left === null ? `건강도가 ${C.RULES.healthHalf}% 밑이라 성장이 멈췄어요. 밥·놀기·청소로 돌봐 주세요.`
      : `${nextName}까지 약 ${dur(left)}` + (rate < 1 ? ` (건강도가 ${C.RULES.healthFull}% 밑이라 0.5배속)` : '') + '.')
    : onArena ? '결투장에 올라갔어요. 이제 새 알을 받아 다음 몽글이를 키워 보세요.'
    : '다 자랐어요! 더 이상 자라지 않아요. 결투장 탭에서 등록해 랭킹에 도전하세요.';
  $('statCard').hidden = v.stage === 'egg';   // 알은 아직 능력치가 없음 (부화할 때 생김)
  $('vHp').textContent = bs.hp; $('vAtk').textContent = bs.atk; $('vDef').textContent = bs.def; $('vSpd').textContent = bs.spd;
  // 밥 먹는 연출·훈련·통신 중에는 다른 버튼을 막음 (한 번에 하나씩)
  const egg = v.stage === 'egg', adult = v.stage === 'adult', lock = busy || mode !== 'idle' || eating();
  // 성체는 더 돌보거나 키울 수 없음
  $('bFeed').disabled = egg || adult || lock; $('bPlay').disabled = egg || adult || lock; $('bClean').disabled = egg || adult || lock || v.poops === 0;
  $('bMainLbl').textContent = egg ? '품기' : '훈련'; $('bMain').disabled = adult || lock;
  document.querySelectorAll('[data-train]').forEach(b => b.disabled = egg || lock || v.energy < C.RULES.trainCost);
  if (egg || adult || lock) closeTrainPop();
  // 새 알 받기 안내
  const names = mine.map(e => e.name).join(', ');
  $('resetHint').textContent = adult && onArena ? `결투장의 몽글이(${names})는 그대로 남아요. 새 알로 다음 몽글이를 키워 보세요.`
    : adult ? `아직 결투장에 등록하지 않았어요. 새 알을 받으면 ${v.name}은(는) 사라져요.`
    : mine.length ? `지금 키우는 ${v.name}은(는) 사라져요. 결투장의 몽글이(${names})는 그대로 남아요.`
    : `지금 키우는 ${v.name}은(는) 사라져요.`;
  $('resetWarn').textContent = adult && onArena ? '새 알을 받을까요?' : `${v.name}은(는) 사라지고 되돌릴 수 없어요.`;
  $('bReset').className = adult && onArena ? 'btn primary' : 'btn';
  $('resetCard').hidden = !adult;   // 새 알 받기는 성체일 때만
  if (!adult) { $('resetConfirm').hidden = true; $('bReset').hidden = false; }
  $('fastCard').hidden = !allowFast;
  $('bFast').textContent = v.fast ? '끄기' : '켜기'; $('bFast').setAttribute('aria-pressed', !!v.fast); $('bFast').className = v.fast ? 'btn primary' : 'btn'; $('bFast').disabled = lock;
  $('lcdL').textContent = v.name;
  // 화면에서 흘려 본 시간으로 진화할 때가 됐으면 서버에 바로 물어봄 (서버가 진화시키고 장면을 보냄)
  if (v.stage !== pet.stage && mode === 'idle' && !busy && Date.now() - lastSync > 3000) { lastSync = Date.now(); loadMe().catch(() => {}); }
  $('lcdR').textContent = egg ? '부화 대기' : `${v.stage === 'adult' ? kindText(v) : C.STAGE_KO[v.stage]}${v.poops ? ' · 똥' + v.poops : ''}`;
  renderArena(v);
}
// 기기 화면 오른쪽 위 묵·찌·빠: 가장 높은 타입 점수만 검게 (성체는 정해진 타입). 알·훈련·배틀 중엔 숨김
function renderTendency(v) {
  const box = $('tend'), show = !!v && v.stage !== 'egg' && mode === 'idle';
  box.hidden = !show;
  if (!show) return;
  const total = C.TYPE_ORDER.reduce((s, t) => s + (v.care[t] || 0), 0);
  const top = v.stage === 'adult' ? v.type : total ? C.topType(v.care) : null;
  const pct = C.tendency(v.care);
  box.querySelectorAll('span').forEach(el => { el.classList.toggle('top', el.dataset.t === top); });
  box.setAttribute('aria-label', top ? `타입 점수: ${C.TYPES[top].name}` + (v.stage === 'adult' ? ' 타입' : ` (묵 ${pct.muk}%, 찌 ${pct.jji}%, 빠 ${pct.ppa}%)`) : '타입 점수: 아직 없음');
}
// 지금 키우는 몽글이가 결투장에 올라가 있는지 (알을 받은 시각으로 구분)
const entryOf = v => v ? mine.find(e => e.born === v.born) || null : null;
const isOnArena = v => !!entryOf(v);
const energyOf = e => C.arenaEnergy(e, serverNow());
const fighter = () => mine.find(e => e.id === fighterId) || null;
const rankText = e => (e.tied ? '공동 ' : '') + e.rank + '위';

// 무작위 상대 3마리 (내 몽글이 제외). 목록이 바뀌어 사라진 상대는 채워 넣음
function refreshPicks(force) {
  const pool = arena.filter(o => !o.mine);
  const alive = force ? [] : picks.filter(id => pool.some(o => o.id === id));
  const rest = pool.filter(o => !alive.includes(o.id)).map(o => o.id);
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  picks = alive.concat(rest).slice(0, C.RULES.pickCount);
}

function renderArena(v) {
  v = v || pet; if (!v) return;
  const adult = v.stage === 'adult', lock = busy || mode !== 'idle', onArena = isOnArena(v), full = mine.length >= maxEntries;
  // 내 결투장 몽글이 (최대 2)
  $('slotCount').textContent = `${mine.length}/${maxEntries}`;
  const box = $('myEntries'); box.innerHTML = '';
  mine.forEach(e => box.appendChild(entryRow(e, v, { self: true, lock })));
  const canReg = adult && !onArena, picking = !$('replacePick').hidden;
  $('bReg').hidden = !canReg || picking;
  $('bReg').disabled = lock;
  $('bReg').textContent = full ? `${v.name}(으)로 교체 등록` : `${v.name}을(를) 결투장에 등록`;
  const f = fighter();
  $('regInfo').textContent = !mine.length && !adult ? `지금 키우는 ${v.name}이(가) 성체가 되면 등록할 수 있어요.`
    : !mine.length ? '다 자란 몽글이를 결투장에 올려 랭킹에 도전하세요.'
    : canReg && full ? `${v.name}이(가) 다 자랐어요. 자리가 꽉 차서, 등록하려면 한 마리를 내려야 해요.`
    : canReg ? `${v.name}이(가) 다 자랐어요. 한 자리가 비어 있어요.`
    : mine.length > 1 ? `출전: ${f ? f.name : '-'}. 위에서 출전할 몽글이를 골라요.`
    : `새 몽글이를 키우는 동안에도 ${mine[0].name}(으)로 배틀할 수 있어요.`;
  // 상대 고르기
  const pl = $('pickList'); pl.innerHTML = '';
  const pool = arena.filter(o => !o.mine);
  $('bReroll').disabled = pool.length <= C.RULES.pickCount;
  $('pickHint').textContent = !pool.length ? '아직 다른 트레이너가 등록한 성체가 없어요.'
    : !mine.length ? '결투장에 몽글이를 등록하면 도전할 수 있어요.'
    : f ? `${f.name}(으)로 도전해요. 등록된 성체 중 ${Math.min(C.RULES.pickCount, pool.length)}마리가 무작위로 나와요.` : '';
  picks.map(id => pool.find(o => o.id === id)).filter(Boolean).forEach(o => pl.appendChild(entryRow(o, v, { challenge: true, lock })));
  // 랭킹
  const list = $('arenaList'); list.innerHTML = '';
  if (!arena.length) list.innerHTML = '<p class="hint">아직 아무도 등록하지 않았어요. 첫 성체를 올려 보세요.</p>';
  arena.forEach(o => list.appendChild(entryRow(o, v, {})));
}
function entryRow(o, v, opt) {
  const d = document.createElement('div'); d.className = 'foe' + (opt.self ? ' me' : '');
  const c = document.createElement('canvas'); drawSprite(c, lookOf(o));
  const meta = document.createElement('div'); meta.className = 'meta';
  const nm = document.createElement('div'); nm.className = 'nm';
  if (o.rank) { const r = document.createElement('span'); r.className = 'rank'; r.textContent = rankText(o); nm.appendChild(r); }
  nm.appendChild(document.createTextNode(o.name));
  const tag = (txt, cls) => { const t = document.createElement('span'); t.className = 'tag' + (cls ? ' ' + cls : ''); t.textContent = txt; nm.appendChild(t); };
  if (o.mine && !opt.self) tag('내 몽글이'); if (o.usedFast) tag('테스트', 'test');
  if (o.type) tag(C.TYPES[o.type].name, 'type');
  const f = fighter();
  if (opt.challenge && f && o.type) { const m = C.typeMult(f.type, o.type); if (m > 1) tag('상성 유리', 'adv'); else if (m < 1) tag('상성 불리', 'dis'); }
  const sub = document.createElement('div'); sub.className = 'sub';
  sub.textContent = kindText(o) + (opt.self ? ` · ${o.wins}승 ${o.losses}패` : ` · ${o.trainer} · ${o.wins}승 ${o.losses}패`);
  const st = document.createElement('div'); st.className = 'st'; st.textContent = `체력 ${o.hp} · 공격력 ${o.atk} · 방어력 ${o.def} · 속도 ${o.spd}`;
  meta.append(nm, sub, st);
  if (opt.self) {
    // 남은 도전 횟수 + 출전 고르기
    const e = energyOf(o), M = C.RULES.arenaMax, en = document.createElement('div'); en.className = 'en';
    const bar = document.createElement('div'); bar.className = 'bar'; const fill = document.createElement('b');
    fill.style.width = (100 * e / M) + '%'; if (e < C.RULES.battleCost) fill.className = 'bad'; bar.appendChild(fill);
    const num = document.createElement('span'), left = C.arenaNextIn(o, serverNow());
    num.textContent = `도전 ${e}/${M}` + (e < M ? ` · ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} 뒤 +1` : '');
    en.append(bar, num); meta.appendChild(en);
    d.append(c, meta);
    if (mine.length > 1) {
      const b = document.createElement('button'); b.className = 'btn pick'; b.textContent = '출전';
      b.setAttribute('aria-pressed', o.id === fighterId); b.disabled = opt.lock;
      b.addEventListener('click', () => { fighterId = o.id; renderArena(); });
      d.appendChild(b);
    }
    return d;
  }
  if (!opt.challenge) { d.append(c, meta); d.style.gridTemplateColumns = '56px 1fr'; return d; }
  const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = '도전';
  b.disabled = !f || opt.lock || energyOf(f) < C.RULES.battleCost;
  b.addEventListener('click', () => startBattle(o.id));
  d.append(c, meta, b); return d;
}

// ---------- 행동 ----------
// 돌봄 반응은 기기 화면 가운데 위 말풍선으로 (다른 알림은 아래쪽 토스트 그대로)
let sayT;
function say(m) { if (!m) return; const t = $('say'); t.textContent = m; t.classList.add('on'); clearTimeout(sayT); sayT = setTimeout(() => t.classList.remove('on'), 2200); }
const doAction = type => run(async () => {
  const d = await api('/action', { type }); apply(d); say(d.msg);
  if (type === 'feed') { const refuse = !!d.refuse; eat = { t0: performance.now(), refuse }; wx = 6; facing = 1; render(); setTimeout(render, (refuse ? REFUSE.total : EAT.total) + 30); }   // 고기 먹기 / 배부르면 거절 (끝나면 버튼 다시 켬)
}, say);
$('bFeed').onclick = () => doAction('feed');
$('bPlay').onclick = () => doAction('play');
$('bClean').onclick = () => doAction('clean');
$('bFast').onclick = () => doAction('fast');
// 훈련 버튼: 알이면 품기, 아니면 오른쪽에 훈련 종류가 위에서 아래로 펼쳐짐
function closeTrainPop() { $('trainPop').hidden = true; $('bMain').setAttribute('aria-expanded', 'false'); }
function openTrainPop() {
  const pop = $('trainPop'), dev = document.querySelector('.device'), btn = $('bMain').querySelector('i');
  pop.hidden = false; $('bMain').setAttribute('aria-expanded', 'true');
  // 다시 그려서 등장 애니메이션을 처음부터
  pop.querySelectorAll('button').forEach(b => { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; });
  const d = dev.getBoundingClientRect(), r = btn.getBoundingClientRect(), w = pop.offsetWidth;
  // 항상 훈련 버튼 오른쪽. 기기 테두리 밖으로 나가도 되지만 화면(뷰포트) 밖으로는 안 나가게
  const maxLeft = document.documentElement.clientWidth - 6 - w - d.left;
  let left = Math.min(r.right - d.left + 8, maxLeft);
  pop.style.left = left + 'px';
  pop.style.top = (r.top - d.top - 8) + 'px';
  render();
  const first = pop.querySelector('button:not(:disabled)'); if (first) first.focus({ preventScroll: true });
}
// 알 품기: 누르고 있는 동안 서버에 '품는 중'을 알림 (1분마다 연장), 떼면 끝
let warmT = null;
function warmOn() {
  if (!pet || pet.stage !== 'egg' || warming || $('bMain').disabled) return;
  warming = true; say('따뜻하게 품는 중… 10배!');
  const send = () => api('/warm', { on: true }).then(apply).catch(e => { say(e.message); warmOff(); });
  send(); warmT = setInterval(send, 60000);
}
function warmOff() {
  if (!warming) return;
  warming = false; clearInterval(warmT); warmT = null;
  $('say').classList.remove('on');
  api('/warm', { on: false }).then(apply).catch(() => {});
}
$('bMain').addEventListener('pointerdown', e => { if (pet && pet.stage === 'egg') { e.preventDefault(); warmOn(); } });
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('bMain').addEventListener(ev, warmOff));
$('bMain').addEventListener('keydown', e => { if (pet && pet.stage === 'egg' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); if (!e.repeat) warmOn(); } });
$('bMain').addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') warmOff(); });
window.addEventListener('blur', warmOff);
$('bMain').addEventListener('contextmenu', e => { if (pet && pet.stage === 'egg') e.preventDefault(); });
$('bMain').onclick = e => {
  e.stopPropagation();
  if (pet.stage === 'egg') return;
  if ($('trainPop').hidden) openTrainPop(); else closeTrainPop();
};
document.addEventListener('click', e => { if (!$('trainPop').hidden && !$('trainPop').contains(e.target)) closeTrainPop(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('trainPop').hidden) { closeTrainPop(); $('bMain').focus(); } });

$('bStart').onclick = () => run(async () => { const d = await api('/pet', { name: $('nameIn').value.trim() }); apply(d); show(); toast(d.msg); });
$('nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('bStart').click(); });
$('bReset').onclick = () => { $('resetConfirm').hidden = false; $('bReset').hidden = true; };
$('bResetNo').onclick = () => { $('resetConfirm').hidden = true; $('bReset').hidden = false; };
$('bResetYes').onclick = () => { $('resetConfirm').hidden = true; $('bReset').hidden = false; pet = null; $('nameIn').value = ''; show(); };

// ---------- 훈련 ----------
const PADS = ['bStop', 'dPads', 'rpsPad'];
document.querySelectorAll('[data-train]').forEach(b => b.onclick = () => run(async () => {
  closeTrainPop();
  const d = await api('/train/start', { kind: b.dataset.train });
  apply(d);
  const p = d.train.params, G = GAMES[p.game];
  train = { params: p, t0: performance.now(), taps: [], plan: G.plan ? G.plan(p) : null, rope: -1e9, flash: 0, from: 1, movedAt: -1e9, hits: [], fx: null };
  mode = 'train'; $('pad').hidden = true;
  PADS.forEach(id => $(id).hidden = id !== G.pads);
  $('bStop').textContent = '터치!';
  document.querySelectorAll('#bStop, #dPads button, #rpsPad button').forEach(x => x.disabled = false);
  document.body.classList.add('gaming');   // 게임 중 스크롤·확대 막기
  renderTendency(pet);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));
// 끝나면: 서버에 입력을 한 번 보내고, 화면 가운데 두 줄 결과 2초 → 대기 화면
async function finishGame(st) {
  const tr = train; if (!tr || tr.done) return;
  const G = GAMES[tr.params.game], shownAt = performance.now();
  tr.done = true; tr.final = st; tr.doneAt = shownAt;
  $('bStop').textContent = '훈련 끝!'; document.querySelectorAll('#bStop, #dPads button, #rpsPad button').forEach(x => x.disabled = true); $('ask').hidden = true;
  let ok = Math.min(C.TRAIN_MAX, st.ok), err = null, d = null;
  try { d = await api('/train/stop', { taps: tr.taps }); ok = d.ok; } catch (e) { err = e.message; }
  setTimeout(() => {
    const [a, b] = G.result;
    $('resA').textContent = `${a} ${ok}번`; $('resB').textContent = `${b} +${ok}`; $('result').hidden = false;
    setTimeout(() => {
      $('result').hidden = true;
      train = null; mode = 'idle';
      PADS.forEach(id => $(id).hidden = true); $('pad').hidden = false;
      document.body.classList.remove('gaming');
      if (d) apply(d); else render();
      if (err) toast(err);
    }, 2000);
  }, Math.max(0, G.boom - (performance.now() - shownAt)));
}
// 입력 → 게임별 기록
const ropeTap = () => trainInput((tr, st, at) => Math.round(at));
function dodgeMove(dir) {
  trainInput((tr, st, at) => {
    if (st.lane + dir < 0 || st.lane + dir > 2) return null;
    tr.from = st.lane; tr.movedAt = performance.now();
    return { t: Math.round(at), d: dir };
  });
}
function rpsPlay(h) {
  trainInput((tr, st, at) => {
    const q = tr.plan[st.ok];
    tr.fx = { at: performance.now(), mine: h, op: q.op, good: h === C.rpsAnswer(q) };
    return { t: Math.round(at), v: h };
  });
}
const gameOn = g => mode === 'train' && train && train.params.game === g;
// 체력: 화면 어디든 / 속도: 화면 왼쪽 반·오른쪽 반 / 방어: 조준점을 직접 / 공격: 묵·찌·빠 버튼
document.addEventListener('pointerdown', e => {
  if (e.button > 0 || !train || mode !== 'train') return;
  if (gameOn('rope')) { e.preventDefault(); ropeTap(); }
  else if (gameOn('dodge')) { e.preventDefault(); dodgeMove(e.clientX < window.innerWidth / 2 ? -1 : 1); }
  else if (gameOn('guard')) { e.preventDefault(); trainInput((tr, st, at) => guardTap(e, tr, st, at)); }
}, { passive: false });
document.querySelectorAll('#rpsPad [data-h]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); rpsPlay(b.dataset.h); }));
document.addEventListener('keydown', e => {
  if (mode !== 'train' || !train) return;
  if (gameOn('dodge') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); dodgeMove(e.key === 'ArrowLeft' ? -1 : 1); }
  else if (gameOn('rope') && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); if (!e.repeat) ropeTap(); }
  else if (gameOn('rps') && { 1: 1, 2: 1, 3: 1 }[e.key]) { e.preventDefault(); rpsPlay(C.TYPE_ORDER[e.key - 1]); }
});
// 묵·찌·빠 버튼 아이콘 (작은 손 도트)
document.querySelectorAll('#rpsPad [data-h]').forEach(b => {
  const c = b.querySelector('canvas'), x = c.getContext('2d'), g = HANDS[b.dataset.h], ox = Math.floor((12 - g[0].length) / 2), oy = Math.floor((12 - g.length) / 2);
  g.forEach((r, y) => [...r].forEach((ch, xx) => { if (ch !== '.') { x.fillStyle = ch === '#' ? '#3A1606' : '#F4C9A8'; x.fillRect(ox + xx, oy + y, 1, 1); } }));
});

// ---------- 결투장 ----------
async function loadArena() { try { const d = await api('/arena'); arena = d.list; refreshPicks(false); renderArena(); } catch (e) { toast(e.message); } }
$('bReroll').onclick = () => { refreshPicks(true); renderArena(); };
$('bRefresh').onclick = loadArena;
const doRegister = replace => run(async () => {
  $('replacePick').hidden = true;
  const d = await api('/register', replace ? { replace } : {}); apply(d); toast(d.msg);
  const e = entryOf(pet); if (e) fighterId = e.id;
  await loadArena();
});
$('bReg').onclick = () => {
  if (mine.length < maxEntries) return doRegister();
  // 자리가 꽉 찼으면 내릴 몽글이를 고름
  $('replaceWarn').textContent = `어느 몽글이를 내릴까요? 내린 몽글이의 전적은 사라지고, ${pet.name}이(가) 0승 0패로 시작해요.`;
  const bx = $('replaceBtns'); bx.innerHTML = '';
  mine.forEach(e => {
    const b = document.createElement('button'); b.className = 'btn';
    b.textContent = `${e.name} 내리기 (${rankText(e)} · ${e.wins}승 ${e.losses}패)`;
    b.addEventListener('click', () => doRegister(e.id));
    bx.appendChild(b);
  });
  $('replacePick').hidden = false; renderArena();
};
$('bReplaceNo').onclick = () => { $('replacePick').hidden = true; renderArena(); };

let battleTimer = null;
function startBattle(id) {
  run(async () => {
    const d = await api('/battle', { opponent: id, fighter: fighterId });
    const b = d.battle;
    battle = { mult: b.mult, me: b.me, op: b.op, mh: b.me.hp, oh: b.op.hp, events: b.events, win: b.win, i: 0, fx: null, result: d };
    mode = 'battle'; renderTendency(pet); $('battleCard').hidden = false; $('battleTitle').textContent = `${b.me.name} vs ${b.op.name}`; $('battleLog').innerHTML = '';
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
  if (e.stunned) return [`${A}은(는) 기절해서 움직이지 못했다!`, 'miss'];
  // 기술 이름: 두번때리기(성향) → 타입 기술 순서로 붙임
  const names = [e.style, e.skill].filter(Boolean).map(x => x + '!').join(' ');
  const act = names ? `${A}의 ${names}` : `${A}의 공격`;
  if (e.miss) return [`${act}${names ? '' : '!'} ${D}이(가) 피했다.`, 'miss'];
  const eff = e.eff === 'up' ? ' · 효과가 굉장해!' : e.eff === 'down' ? ' · 효과가 별로…' : '';
  if (e.reflect) return [`${act} → ${D}의 ${e.reflect}! 공격을 되돌려 ${A}에게 ${e.dmg} 피해`, 'hit'];
  return [`${act}${e.crit ? ' (치명타!)' : ''} → ${D}에게 ${e.dmg} 피해${eff}${e.stun ? ` · ${e.stun}! ${D} 기절` : ''}`, 'hit'];
}
function step() {
  const b = battle; if (!b) return;
  if (b.i >= b.events.length) return finishBattle();
  const e = b.events[b.i++];
  const A = e.who === 'me' ? b.me : b.op;
  if (e.stunned) {                                   // 기절: 손 없이 로그만
    b.fx = null; const [t, c] = describe(e); logLine(t, c);
    battleTimer = setTimeout(step, HIT.next); return;
  }
  b.fx = { at: performance.now(), type: A.type, big: styleOf(A.form) === 'atk', target: e.who === 'me' ? 'op' : 'me', miss: !!e.miss, strong: e.eff === 'up' || !!e.skill || !!e.style };
  // 손이 사라지는 순간 체력이 줄고 로그가 나옴
  b.pending = e;
  battleTimer = setTimeout(() => {
    b.pending = null;
    if (!e.miss) { b.mh = e.mh; b.oh = e.oh; }
    const [t, c] = describe(e); logLine(t, c);
    battleTimer = setTimeout(step, HIT.next - HIT.handEnd);
  }, HIT.handEnd);
}
$('bSkip').onclick = () => {
  const b = battle; if (!b) return; clearTimeout(battleTimer);
  if (b.pending) { const e = b.pending; b.pending = null; if (!e.miss) { b.mh = e.mh; b.oh = e.oh; } const [t, c] = describe(e); logLine(t, c); }
  while (b.i < b.events.length) { const e = b.events[b.i++]; if (!e.miss) { b.mh = e.mh; b.oh = e.oh; } const [t, c] = describe(e); logLine(t, c); }
  b.fx = null; finishBattle();
};
function finishBattle() {
  const b = battle; if (!b || b.done) return; b.done = true;
  logLine(b.win ? `승리! ${b.me.name}이(가) 이겼다.` : `패배… ${b.op.name}이(가) 이겼다.`, 'end');
  apply(b.result);
  setTimeout(() => { battle = null; mode = 'idle'; render(); loadArena(); }, 1400);
}

// ---------- 탭 ----------
['care', 'arena', 'rank'].forEach(k => $('t-' + k).onclick = () => {
  ['care', 'arena', 'rank'].forEach(j => { $('t-' + j).setAttribute('aria-selected', j === k); $('p-' + j).hidden = j !== k; });
  if (k === 'arena' || k === 'rank') loadArena();
});

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
