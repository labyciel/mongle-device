// 몽글 디바이스 — 게임 규칙 (서버와 브라우저가 같은 파일을 사용합니다)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ---------- 타입 (묵·찌·빠) ----------
  // beats: 이 타입이 유리한 상대
  const TYPES = {
    muk: { name: '묵', beats: 'jji' },
    jji: { name: '찌', beats: 'ppa' },
    ppa: { name: '빠', beats: 'muk' }
  };
  const TYPE_ORDER = ['muk', 'jji', 'ppa'];
  const ADV = 1.3, DIS = 0.8;   // 유리할 때 / 불리할 때 주는 피해 배수

  // ---------- 성체 형태 (공격형·방어형·만능형 + 꾀죄죄) ----------
  const STYLES = {
    atk:     { name: '공격형',   how: '공격력이 방어력보다 30% 이상 높음', mult: { atk: 1.3, def: 0.95 } },
    def:     { name: '방어형',   how: '방어력이 공격력보다 30% 이상 높음', mult: { def: 1.3, hp: 1.15, atk: 0.95 } },
    all:     { name: '만능형',   how: '공격력과 방어력이 비슷함',          mult: { hp: 1.08, atk: 1.12, def: 1.12, spd: 1.05 } }
  };
  const ADULT_NAMES = {
    muk: { atk: '묵주먹', def: '묵바위', all: '묵돌이' },
    jji: { atk: '찌칼날', def: '찌집게', all: '찌깡총' },
    ppa: { atk: '빠폭풍', def: '빠방패', all: '빠펄럭' }
  };
  // 화면에서 쓰는 그림 이름
  const ADULT_SPRITES = {
    muk: { atk: 'mukfist', def: 'ironshell', all: 'mukpebble' },
    jji: { atk: 'flamehorn', def: 'jjicrab', all: 'jjibunny' },
    ppa: { atk: 'galewing', def: 'ppashield', all: 'ppahand' }
  };

  const FORMS = {
    egg:        { name: '알',     stage: 'egg' },
    mongsil:    { name: '몽실',   stage: 'baby',   how: 'Lv.10에 알에서 부화' },
    ppulmong:   { name: '뿔몽',   stage: 'rookie', atk: 1.15, how: 'Lv.30 · 공격력 ≥ 방어력' },
    dandanmong: { name: '단단몽', stage: 'rookie', def: 1.15, hp: 1.05, how: 'Lv.30 · 방어력 > 공격력' }
  };
  TYPE_ORDER.forEach(t => {
    ['atk', 'def', 'all'].forEach(s => {
      FORMS[`${t}_${s}`] = Object.assign({ name: ADULT_NAMES[t][s], stage: 'adult', type: t, style: s, sprite: ADULT_SPRITES[t][s],
        how: `Lv.50 · ${TYPES[t].name} 성향 · ${STYLES[s].name}` }, STYLES[s].mult);
    });
  });
  // 이전 버전 성체 → 새 타입 (기존 저장 데이터 변환용)
  const LEGACY = { flamehorn: 'jji', ironshell: 'muk', galewing: 'ppa', scruffy: 'muk' };

  const STAGE_KO = { egg: '알', baby: '유체', rookie: '아성체', adult: '성체' };

  // ---------- 모습 (도트 그림) ----------
  // LOOKS의 이름은 개발할 때 부르기 위한 이름이에요. 게임 화면에는 표시하지 않아요 (사용자 결정).
  // 같은 단계·타입 안에서 부화/진화할 때 무작위로 정해짐. 그림 데이터는 app.js의 S (키가 같음)
  const LOOKS = {
    egg: '알',
    b_drop: '방울몽', b_fluff: '복슬몽', b_slug: '꼬물몽',
    r_horn: '뿔몽', r_wing2: '날개몽', r_shell2: '단단몽', r_guard: '방패몽',
    mukfist: '묵주먹', ironshell: '묵바위', mukpebble: '묵돌이', c_muk_atk: '묵버럭', c_muk_def: '묵졸음', c_muk_all: '묵만세',
    jjibunny: '찌깡총', c_jji_def: '찌집게', c_jji_all: '찌토끼', j_blade_arms: '찌가위손', j_crest_bird: '찌볏새', j_cross_horn: '찌뿔이',
    galewing: '빠폭풍', c_ppa_atk: '빠파닥', c_ppa_def: '빠우산', c_ppa_all: '빠손볏',
    // 예전 버전 모습 (기존 몽글이 표시용)
    mongsil: '몽실', ppulmong: '뿔몽', dandanmong: '단단몽', flamehorn: '찌칼날', jjicrab: '찌집게', ppashield: '빠방패', ppahand: '빠펄럭'
  };
  const POOLS = {
    baby: ['b_drop', 'b_fluff', 'b_slug'],
    rookie: { atk: ['r_horn', 'r_wing2'], def: ['r_shell2', 'r_guard'] },   // 공격력 ≥ 방어력이면 atk 쪽
    adult: {
      muk: ['mukfist', 'ironshell', 'mukpebble', 'c_muk_atk', 'c_muk_def', 'c_muk_all'],
      jji: ['jjibunny', 'c_jji_def', 'c_jji_all', 'j_blade_arms', 'j_crest_bird', 'j_cross_horn'],
      ppa: ['galewing', 'c_ppa_atk', 'c_ppa_def', 'c_ppa_all']
    }
  };
  const pickRandom = (pool, rnd) => pool[Math.floor((rnd || Math.random)() * pool.length) % pool.length];
  // 예전 데이터용: 같은 몽글이는 늘 같은 모습이 나오도록 born 값으로 고름
  function pickStable(pool, seed) {
    let h = 0; const str = String(seed);
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return pool[Math.abs(h) % pool.length];
  }
  // 모습이 없는 (예전) 몽글이·등록 정보의 모습을 정함
  function legacyLook(o) {
    const seed = (o.born || 0) + ':' + (o.name || '');
    if (o.stage === 'egg') return 'egg';
    if (o.stage === 'baby') return pickStable(POOLS.baby, seed);
    if (o.stage === 'rookie') return pickStable(POOLS.rookie[o.form === 'dandanmong' ? 'def' : 'atk'], seed);
    const f = FORMS[o.form] || {};
    const pool = POOLS.adult[f.type || 'muk'];
    return pool.includes(f.sprite) ? f.sprite : pickStable(pool, seed);
  }
  const lookName = o => (o && LOOKS[o.look]) || ((FORMS[o && o.form] || {}).name) || '?';
  const STAT_KO = { hp: '체력', atk: '공격력', def: '방어력', spd: '속도' };

  // 시간·행동 규칙
  const RULES = {
    base: { hpMin: 50, hpMax: 70, sum: 30, min: 5 },   // 알 받을 때 기본 능력치 (체력 범위, 공격+방어+속도 합, 각 최솟값)
    energyEvery: 10, energyEveryFast: 2,
    hungerEvery: 90, moodEvery: 120, poopEvery: 1500,
    maxOffline: 12 * 3600,
    fastExp: 8,
    maxLevel: 50,                 // 레벨 50에서 성체가 되고 성장이 끝남
    trainCost: 12,
    // 결투장 도전 횟수 (몽글이마다 따로): 등록 때 10번, 최대 10번, 10분마다 1번 회복, 도전 1회에 1번
    arenaMax: 10, battleCost: 1, arenaEnergyEvery: 600,
    maxEntries: 2,                // 한 계정당 결투장에 올릴 수 있는 몽글이 수
    pickCount: 3,                 // 결투장에서 무작위로 보여주는 상대 수         // 결투장 몽글이 배틀 에너지: 10초마다 +1 (최대 100)
    // 성향 점수: 밥 → 묵, 훈련 → 찌, 놀기 → 빠
    carePoints: { feed: 2, train: 1, play: 3 }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const need = l => 8 + l * 3;

  // 알을 받을 때 정해지는 기본 능력치 (무작위)
  //  체력 50~70, 공격력+방어력+속도 = 30 (각각 최소 5). 나머지 15를 가능한 나눔 136가지 중 하나로 고르게 뽑음
  function rollBase(rnd = Math.random) {
    const R = RULES.base, int = n => Math.min(n - 1, Math.floor(rnd() * n));
    const hp = R.hpMin + int(R.hpMax - R.hpMin + 1);
    const spare = R.sum - 3 * R.min, combos = [];
    for (let a = 0; a <= spare; a++) for (let d = 0; d <= spare - a; d++) combos.push([a, d, spare - a - d]);
    const [a, d, sp] = combos[int(combos.length)];
    return { hp, atk: R.min + a, def: R.min + d, spd: R.min + sp };
  }
  // 예전 몽글이·허수아비는 기본 능력치가 없음 → 예전 공식(Lv.1부터 성장)과 똑같은 값
  const OLD_BASE = { hp: 60, atk: 8, def: 5, spd: 5 };

  function newPet(name, now, rnd = Math.random) {
    return {
      v: 3, name, stage: 'egg', form: 'egg', look: 'egg', type: null, style: null, level: 1, exp: 0,
      base: rollBase(rnd),
      hunger: 80, mood: 80, energy: 100, poops: 0, mistakes: 0,
      hp: 0, atk: 0, def: 0, spd: 0, wins: 0, losses: 0,
      care: { muk: 0, jji: 0, ppa: 0 },
      fast: false, usedFast: false,
      born: now, last: now,
      acc: { h: 0, m: 0, e: 0, p: 0 }, flags: { starve: false, dirty: false }
    };
  }

  // ---------- 타입·형태 결정 ----------
  function topType(care) {
    let best = TYPE_ORDER[0];
    TYPE_ORDER.forEach(t => { if ((care[t] || 0) > (care[best] || 0)) best = t; });
    return best;
  }
  function tendency(care) {
    const total = TYPE_ORDER.reduce((s, t) => s + (care[t] || 0), 0);
    const out = {};
    TYPE_ORDER.forEach(t => { out[t] = total ? Math.round(100 * (care[t] || 0) / total) : 0; });
    return out;
  }
  function decideStyle(pet) {
    const a = pet.atk, d = pet.def;
    if (a >= d * 1.3 && a - d >= 3) return 'atk';
    if (d >= a * 1.3 && d - a >= 3) return 'def';
    return 'all';
  }
  function adultForm(type, style) { return `${type}_${style}`; }

  // 이전 버전 저장 데이터를 지금 규칙에 맞춤 (여러 번 불러도 안전)
  function migrate(pet) {
    if (!pet) return pet;
    if (!pet.care) pet.care = { muk: 0, jji: 0, ppa: 0 };
    if (typeof pet.hp !== 'number') pet.hp = 0;
    if (pet.level > RULES.maxLevel) { pet.level = RULES.maxLevel; pet.exp = 0; }
    // 꾀죄죄몽은 없어짐: 예전 꾀죄죄몽은 같은 타입의 보통 형태로
    if (pet.stage === 'adult' && /^scruffy/.test(pet.form)) {
      pet.type = pet.form.split('_')[1] || LEGACY.scruffy; pet.style = decideStyle(pet);
      pet.form = adultForm(pet.type, pet.style); if (pet.look === 'scruffy') delete pet.look;
    }
    if (pet.stage === 'adult' && !(FORMS[pet.form] && FORMS[pet.form].type)) {
      pet.type = LEGACY[pet.form] || topType(pet.care);
      pet.style = decideStyle(pet);
      pet.form = adultForm(pet.type, pet.style);
    }
    if (pet.stage === 'adult' && FORMS[pet.form]) { pet.type = FORMS[pet.form].type; pet.style = FORMS[pet.form].style; }
    if (!pet.look) pet.look = legacyLook(pet);
    pet.v = 3;
    return pet;
  }
  // 결투장 등록 정보 변환 (이전 버전 등록분에 타입이 없을 때)
  function migrateEntry(e) {
    if (!e) return e;
    if (/^scruffy_/.test(e.form)) { e.form = e.form.split('_')[1] + '_all'; if (e.look === 'scruffy') delete e.look; }   // 꾀죄죄몽 → 만능형
    if (!(FORMS[e.form] && FORMS[e.form].type)) {
      const t = e.type || LEGACY[e.form] || 'muk';
      e.form = `${t}_all`;
    }
    e.type = FORMS[e.form].type; e.style = FORMS[e.form].style;
    if (!e.look) e.look = legacyLook(Object.assign({ stage: 'adult' }, e));
    if (e.tv !== 2) { e.tv = 2; e.energy = RULES.arenaMax; delete e.energyAt; }   // 예전 배틀 에너지(0~100) → 도전 횟수 10번으로
    return e;
  }

  // ---------- 시간 ----------
  function tick(pet, sec) {
    const a = pet.acc;
    const ei = pet.fast ? RULES.energyEveryFast : RULES.energyEvery;
    a.e += sec; let n = Math.floor(a.e / ei); a.e -= n * ei; pet.energy = Math.min(100, pet.energy + n);
    if (pet.stage === 'egg' || pet.stage === 'adult') return;   // 알과 성체는 배고픔·기분·똥 없음
    a.h += sec; n = Math.floor(a.h / RULES.hungerEvery); a.h -= n * RULES.hungerEvery; pet.hunger = Math.max(0, pet.hunger - n);
    a.m += sec * (pet.poops >= 2 ? 1.6 : 1); n = Math.floor(a.m / RULES.moodEvery); a.m -= n * RULES.moodEvery; pet.mood = Math.max(0, pet.mood - n);
    a.p += sec; n = Math.floor(a.p / RULES.poopEvery); a.p -= n * RULES.poopEvery; pet.poops = Math.min(4, pet.poops + n);
    if (pet.hunger === 0 && !pet.flags.starve) { pet.mistakes++; pet.flags.starve = true; }
    if (pet.hunger > 20) pet.flags.starve = false;
    if (pet.poops >= 4 && !pet.flags.dirty) { pet.mistakes++; pet.flags.dirty = true; }
  }
  // now 시점까지 시간을 흘려보냄. 시계가 거꾸로 가면 무시.
  function advance(pet, now) {
    migrate(pet);
    const dt = (now - pet.last) / 1000;
    if (dt > 0) { tick(pet, Math.min(dt, RULES.maxOffline)); pet.last = now; }
  }

  // ---------- 성장 ----------
  // 진화: 형태(form)는 규칙대로, 모습(look)은 그 단계·타입 안에서 무작위
  function checkEvo(pet, rnd) {
    const from = pet.look || pet.form; let to = null, look = null;
    if (pet.stage === 'egg' && pet.level >= 10) { to = 'mongsil'; pet.stage = 'baby'; look = pickRandom(POOLS.baby, rnd); }
    else if (pet.stage === 'baby' && pet.level >= 30) {
      const side = pet.atk >= pet.def ? 'atk' : 'def';
      to = side === 'atk' ? 'ppulmong' : 'dandanmong'; pet.stage = 'rookie'; look = pickRandom(POOLS.rookie[side], rnd);
    }
    else if (pet.stage === 'rookie' && pet.level >= 50) {
      pet.stage = 'adult';
      pet.type = topType(pet.care);       // 묵·찌·빠는 성향으로 결정
      pet.style = decideStyle(pet);       // 공격형·방어형·만능형은 능력치로 결정
      to = adultForm(pet.type, pet.style);
      look = pickRandom(POOLS.adult[pet.type], rnd);   // 모습은 타입 안에서 무작위
    }
    if (to) { pet.form = to; pet.look = look; return { from, to: look }; }
    return null;
  }
  function gainExp(pet, x) {
    if (pet.stage === 'adult' || pet.level >= RULES.maxLevel) return { ups: 0, evos: [] };
    pet.exp += Math.round(x * (pet.fast ? RULES.fastExp : 1));
    let ups = 0; const evos = [];
    while (pet.level < RULES.maxLevel && pet.exp >= need(pet.level)) {
      pet.exp -= need(pet.level); pet.level++; ups++;
      const e = checkEvo(pet); if (e) evos.push(e);
    }
    if (pet.level >= RULES.maxLevel) pet.exp = 0;
    return { ups, evos };
  }

  // 배틀용 능력치 4종: 체력·공격력·방어력·속도
  function bstats(p) {
    // 기본 능력치(알 받을 때 무작위) + 레벨 성장(Lv.1은 0) + 훈련, 그 뒤 형태 배율
    const f = FORMS[p.form] || {}, L = p.base ? p.level - 1 : p.level, b = p.base || OLD_BASE;
    return {
      hp:  Math.round((b.hp  + L * 8   + (p.hp || 0) * 6) * (f.hp || 1)),
      atk: Math.round((b.atk + L * 1.2 + p.atk * 1.6) * (f.atk || 1)),
      def: Math.round((b.def + L * 0.8 + p.def * 1.4) * (f.def || 1)),
      spd: Math.round((b.spd + L * 0.8 + p.spd * 1.6) * (f.spd || 1))
    };
  }

  // 밥/놀기/청소/품기/빠른성장. {ok, msg, info}
  function addCare(pet, kind) {
    if (pet.stage === 'adult') return;           // 성체가 되면 타입이 고정됨
    const t = { feed: 'muk', train: 'jji', play: 'ppa' }[kind];
    pet.care[t] = (pet.care[t] || 0) + RULES.carePoints[kind];
  }
  function applyAction(pet, type) {
    migrate(pet);
    const egg = pet.stage === 'egg';
    if (type === 'fast') { pet.fast = !pet.fast; if (pet.fast) pet.usedFast = true; return { ok: true, msg: pet.fast ? '빠른 성장을 켰어요.' : '빠른 성장을 껐어요.' }; }
    if (type === 'warm') {
      if (!egg) return { ok: false, msg: '이미 부화했어요.' };
      if (pet.energy < 5) return { ok: false, msg: '에너지가 부족해요. 잠시 쉬어 주세요.' };
      pet.energy -= 5; const info = gainExp(pet, 20);
      return { ok: true, msg: info.evos.length ? '' : '알이 따뜻해졌어요.', info };
    }
    if (egg) return { ok: false, msg: '알은 품어 주기만 할 수 있어요.' };
    if (pet.stage === 'adult') return { ok: false, msg: '다 자란 몽글이는 더 돌보거나 키울 수 없어요. 결투장에 등록해 보세요.' };
    if (type === 'feed') {
      if (pet.hunger >= 100) { pet.mood = Math.max(0, pet.mood - 5); return { ok: true, msg: '배불러서 싫대요.' }; }
      pet.hunger = Math.min(100, pet.hunger + 25); addCare(pet, 'feed');
      return { ok: true, msg: '냠냠!', info: gainExp(pet, 3) };
    }
    if (type === 'play') {
      if (pet.mood >= 100) return { ok: false, msg: '이미 기분이 최고예요.' };
      if (pet.energy < 5) return { ok: false, msg: '너무 피곤해요.' };
      pet.mood = Math.min(100, pet.mood + 20); pet.energy -= 5; addCare(pet, 'play');
      return { ok: true, msg: '신나게 놀았어요.', info: gainExp(pet, 3) };
    }
    if (type === 'clean') {
      if (!pet.poops) return { ok: false, msg: '치울 게 없어요.' };
      pet.poops = 0; pet.flags.dirty = false; pet.mood = Math.min(100, pet.mood + 5); return { ok: true, msg: '깨끗해졌어요.' };
    }
    return { ok: false, msg: '알 수 없는 행동이에요.' };
  }

  // ---------- 훈련 미니게임 (막대 36칸, 마커 왕복) ----------
  const BAR = 36;
  const TRAIN_KINDS = ['hp', 'atk', 'def', 'spd'];
  function trainParams(pet, rnd) {
    const r = rnd || Math.random;
    const zw = Math.max(6, 12 - Math.floor(pet.level / 15));
    const z0 = 2 + Math.floor(r() * (BAR - zw - 4));
    return { zw, z0, zc: z0 + Math.floor(zw / 2), speed: 30 + pet.level * 0.5 };
  }
  function markerPos(params, elapsedMs) {
    const period = 2 * (BAR - 1);
    const d = (params.speed * Math.max(0, elapsedMs) / 1000) % period;
    return d <= BAR - 1 ? d : period - d;
  }
  function judge(params, elapsedMs) {
    const m = Math.round(markerPos(params, elapsedMs));
    if (Math.abs(m - params.zc) <= 1) return 'perfect';
    if (m >= params.z0 && m < params.z0 + params.zw) return 'hit';
    return 'fail';
  }
  function applyTrain(pet, kind, res) {
    migrate(pet);
    pet.energy -= RULES.trainCost; pet.hunger = Math.max(0, pet.hunger - 6);
    const mult = 1 + pet.level / 25, base = { fail: 10, hit: 25, perfect: 40 }[res];
    const moodF = pet.mood < 30 ? 0.7 : 1;
    pet[kind] += res === 'perfect' ? 2 : res === 'hit' ? 1 : 0;
    addCare(pet, 'train');
    const info = gainExp(pet, base * mult * moodF);
    const kn = STAT_KO[kind];
    const msg = res === 'perfect' ? `대성공! ${kn} +2` : res === 'hit' ? `성공! ${kn} +1` : '아쉬워요. 경험치만 조금 얻었어요.';
    return { msg, info };
  }

  // ---------- 상성 ----------
  // 나중에 5속성을 넣을 때: 각 몬스터에 element를 추가하고 elementMult를 채우면
  // affinity가 두 배수를 곱해서 적용됩니다.
  function typeMult(a, d) {
    if (!a || !d || !TYPES[a] || !TYPES[d]) return 1;
    if (TYPES[a].beats === d) return ADV;
    if (TYPES[d].beats === a) return DIS;
    return 1;
  }
  function elementMult(/* a, d */) { return 1; }
  function affinity(att, dfn) { return typeMult(att.type, dfn.type) * elementMult(att.element, dfn.element); }

  function simulate(me, op, rnd) {
    const r = rnd || Math.random;
    const ev = []; let mh = me.hp, oh = op.hp;
    let turn = me.spd === op.spd ? (r() < .5 ? 'me' : 'op') : (me.spd > op.spd ? 'me' : 'op');
    for (let i = 0; i < 60 && mh > 0 && oh > 0; i++) {
      const A = turn === 'me' ? me : op, D = turn === 'me' ? op : me;
      const dodge = clamp((D.spd - A.spd) * 0.8, 3, 25) / 100, crit = clamp(10 + (A.spd - D.spd) * 0.3, 5, 25) / 100;
      if (r() < dodge) ev.push({ who: turn, miss: true });
      else {
        const c = r() < crit, aff = affinity(A, D);
        const raw = A.atk * (0.9 + r() * 0.2) * (c ? 1.6 : 1) - D.def * 0.6;
        const dmg = Math.max(2, Math.round(raw * aff));
        if (turn === 'me') oh = Math.max(0, oh - dmg); else mh = Math.max(0, mh - dmg);
        ev.push({ who: turn, dmg, crit: c, eff: aff > 1 ? 'up' : aff < 1 ? 'down' : null, mh, oh });
      }
      turn = turn === 'me' ? 'op' : 'me';
    }
    const win = oh <= 0 ? true : mh <= 0 ? false : (mh / me.hp >= oh / op.hp);
    return { ev, win };
  }

  // ---------- 결투장 ----------
  // 결투장에 등록된 몽글이의 남은 도전 횟수 (서버 시간 기준으로 회복)
  function arenaEnergy(entry, now) {
    const M = RULES.arenaMax, e = typeof entry.energy === 'number' ? entry.energy : M;
    const at = typeof entry.energyAt === 'number' ? entry.energyAt : now;
    const gain = Math.floor(Math.max(0, now - at) / 1000 / RULES.arenaEnergyEvery);
    return Math.min(M, e + gain);
  }
  // 다음 1번이 회복될 때까지 남은 초 (가득이면 0)
  function arenaNextIn(entry, now) {
    if (arenaEnergy(entry, now) >= RULES.arenaMax) return 0;
    const at = typeof entry.energyAt === 'number' ? entry.energyAt : now, T = RULES.arenaEnergyEvery;
    const passed = Math.max(0, now - at) / 1000;
    return Math.ceil(T - (passed % T));
  }
  // 횟수를 now 시점까지 회복시키고 cost만큼 씀. 가득 찬 상태에서 쓰면 그때부터 회복 시간을 셈
  function spendArenaEnergy(entry, now, cost) {
    const M = RULES.arenaMax, e0 = typeof entry.energy === 'number' ? entry.energy : M, at = typeof entry.energyAt === 'number' ? entry.energyAt : now;
    const steps = Math.floor(Math.max(0, now - at) / 1000 / RULES.arenaEnergyEvery);
    const cur = Math.min(M, e0 + steps);
    entry.energyAt = cur >= M ? now : at + steps * RULES.arenaEnergyEvery * 1000;
    entry.energy = cur - cost;
    return entry;
  }
  // ---------- 랭킹 ----------
  // 1) (승 - 패)가 큰 순, 같으면 승이 많은 순
  // 2) 승·패가 똑같은 몽글이끼리는 서로 맞붙은 전적으로 비교 (여럿이면 그들끼리의 승-패 합)
  // 3) 맞대결이 없거나 그것도 같으면 공동 순위 (1, 2, 2, 4 …)
  // h2h(aId, bId) = a가 b를 이긴 횟수
  function rankEntries(list, h2h) {
    const rec = e => [e.wins - e.losses, e.wins];
    const sorted = list.slice().sort((a, b) => (rec(b)[0] - rec(a)[0]) || (rec(b)[1] - rec(a)[1]));
    const out = [];
    for (let i = 0; i < sorted.length;) {
      let j = i; while (j < sorted.length && sorted[j].wins === sorted[i].wins && sorted[j].losses === sorted[i].losses) j++;
      const group = sorted.slice(i, j);
      const score = e => group.reduce((s, o) => o === e ? s : s + (h2h(e.id, o.id) || 0) - (h2h(o.id, e.id) || 0), 0);
      group.forEach(e => { e.h2hScore = group.length > 1 ? score(e) : 0; });
      group.sort((a, b) => b.h2hScore - a.h2hScore);
      out.push(...group); i = j;
    }
    // 공동 순위: 승·패와 맞대결 점수가 모두 같으면 같은 등수
    out.forEach((e, k) => {
      const p = out[k - 1];
      const same = p && p.wins === e.wins && p.losses === e.losses && p.h2hScore === e.h2hScore;
      e.rank = same ? p.rank : k + 1;
    });
    out.forEach(e => { e.tied = out.filter(o => o.rank === e.rank).length > 1; delete e.h2hScore; });
    return out;
  }

  // 배틀에 쓰는 한쪽 정보 (몬스터 또는 결투장 등록 정보에서)
  function side(src) {
    const f = FORMS[src.form] || {};
    return { name: src.name, form: src.form, look: src.look, level: src.level, type: src.type || f.type || null,
      hp: src.hp, atk: src.atk, def: src.def, spd: src.spd };
  }

  return { FORMS, LOOKS, POOLS, lookName, legacyLook, TYPES, TYPE_ORDER, STYLES, STAGE_KO, STAT_KO, RULES, BAR, TRAIN_KINDS, ADV, DIS, LEGACY,
    arenaEnergy, arenaNextIn, spendArenaEnergy, rankEntries,
    clamp, need, newPet, tick, advance, migrate, migrateEntry, topType, tendency, decideStyle, adultForm,
    checkEvo, gainExp, bstats, rollBase, applyAction, trainParams, markerPos, judge, applyTrain,
    typeMult, elementMult, affinity, simulate, side };
});
