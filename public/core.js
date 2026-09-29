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
    all:     { name: '만능형',   how: '공격력과 방어력이 비슷함',          mult: { hp: 1.08, atk: 1.12, def: 1.12, spd: 1.05 } },
    scruffy: { name: '꾀죄죄형', how: '돌봄 실수 8회 이상',               mult: { hp: 1.3, atk: 0.92, def: 0.92, spd: 0.92 } }
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
    FORMS[`scruffy_${t}`] = Object.assign({ name: '꾀죄죄몽', stage: 'adult', type: t, style: 'scruffy', sprite: 'scruffy',
      how: `Lv.50 · ${TYPES[t].name} 성향 · 돌봄 실수 8회 이상` }, STYLES.scruffy.mult);
  });
  // 이전 버전 성체 → 새 타입 (기존 저장 데이터 변환용)
  const LEGACY = { flamehorn: 'jji', ironshell: 'muk', galewing: 'ppa', scruffy: 'muk' };

  const STAGE_KO = { egg: '알', baby: '유체', rookie: '아성체', adult: '성체' };
  const STAT_KO = { hp: '체력', atk: '공격력', def: '방어력', spd: '속도' };

  // 시간·행동 규칙
  const RULES = {
    energyEvery: 10, energyEveryFast: 2,
    hungerEvery: 90, moodEvery: 120, poopEvery: 1500,
    maxOffline: 12 * 3600,
    fastExp: 8,
    trainCost: 12, battleCost: 20,
    // 성향 점수: 밥 → 묵, 훈련 → 찌, 놀기 → 빠
    carePoints: { feed: 2, train: 1, play: 3 }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const need = l => 8 + l * 3;

  function newPet(name, now) {
    return {
      v: 2, name, stage: 'egg', form: 'egg', type: null, style: null, level: 1, exp: 0,
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
    if (pet.mistakes >= 8) return 'scruffy';
    const a = pet.atk, d = pet.def;
    if (a >= d * 1.3 && a - d >= 3) return 'atk';
    if (d >= a * 1.3 && d - a >= 3) return 'def';
    return 'all';
  }
  function adultForm(type, style) { return style === 'scruffy' ? `scruffy_${type}` : `${type}_${style}`; }

  // 이전 버전 저장 데이터를 지금 규칙에 맞춤 (여러 번 불러도 안전)
  function migrate(pet) {
    if (!pet) return pet;
    if (!pet.care) pet.care = { muk: 0, jji: 0, ppa: 0 };
    if (typeof pet.hp !== 'number') pet.hp = 0;
    if (pet.stage === 'adult' && !(FORMS[pet.form] && FORMS[pet.form].type)) {
      pet.type = LEGACY[pet.form] || topType(pet.care);
      pet.style = pet.form === 'scruffy' ? 'scruffy' : decideStyle(pet);
      pet.form = adultForm(pet.type, pet.style);
    }
    if (pet.stage === 'adult' && FORMS[pet.form]) { pet.type = FORMS[pet.form].type; pet.style = FORMS[pet.form].style; }
    pet.v = 2;
    return pet;
  }
  // 결투장 등록 정보 변환 (이전 버전 등록분에 타입이 없을 때)
  function migrateEntry(e) {
    if (!e) return e;
    if (!(FORMS[e.form] && FORMS[e.form].type)) {
      const t = e.type || LEGACY[e.form] || 'muk';
      e.form = e.form === 'scruffy' ? `scruffy_${t}` : `${t}_all`;
    }
    e.type = FORMS[e.form].type; e.style = FORMS[e.form].style;
    return e;
  }

  // ---------- 시간 ----------
  function tick(pet, sec) {
    const a = pet.acc;
    const ei = pet.fast ? RULES.energyEveryFast : RULES.energyEvery;
    a.e += sec; let n = Math.floor(a.e / ei); a.e -= n * ei; pet.energy = Math.min(100, pet.energy + n);
    if (pet.stage === 'egg') return;
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
  function checkEvo(pet) {
    const from = pet.form; let to = null;
    if (pet.stage === 'egg' && pet.level >= 10) { to = 'mongsil'; pet.stage = 'baby'; }
    else if (pet.stage === 'baby' && pet.level >= 30) { to = pet.atk >= pet.def ? 'ppulmong' : 'dandanmong'; pet.stage = 'rookie'; }
    else if (pet.stage === 'rookie' && pet.level >= 50) {
      pet.stage = 'adult';
      pet.type = topType(pet.care);
      pet.style = decideStyle(pet);
      to = adultForm(pet.type, pet.style);
    }
    if (to) { pet.form = to; return { from, to }; }
    return null;
  }
  function gainExp(pet, x) {
    pet.exp += Math.round(x * (pet.fast ? RULES.fastExp : 1));
    let ups = 0; const evos = [];
    while (pet.level < 99 && pet.exp >= need(pet.level)) {
      pet.exp -= need(pet.level); pet.level++; ups++;
      const e = checkEvo(pet); if (e) evos.push(e);
    }
    if (pet.level >= 99) pet.exp = Math.min(pet.exp, need(99));
    return { ups, evos };
  }

  // 배틀용 능력치 4종: 체력·공격력·방어력·속도
  function bstats(p) {
    const f = FORMS[p.form] || {}, L = p.level;
    return {
      hp:  Math.round((60 + L * 8 + (p.hp || 0) * 6) * (f.hp || 1)),
      atk: Math.round((8 + L * 1.2 + p.atk * 1.6) * (f.atk || 1)),
      def: Math.round((5 + L * 0.8 + p.def * 1.4) * (f.def || 1)),
      spd: Math.round((5 + L * 0.8 + p.spd * 1.6) * (f.spd || 1))
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

  function applyBattle(pet, myLevel, opLevel, win, isNpc) {
    pet.energy = Math.max(0, pet.energy - RULES.battleCost);
    pet.hunger = Math.max(0, pet.hunger - 8);
    const ratio = clamp(opLevel / myLevel, 0.5, 1.5);
    const info = gainExp(pet, win ? 120 * ratio : 40);
    if (!isNpc) { if (win) pet.wins++; else pet.losses++; }
    pet.mood = clamp(pet.mood + (win ? 10 : -5), 0, 100);
    return info;
  }

  // 배틀에 쓰는 한쪽 정보 (몬스터 또는 결투장 등록 정보에서)
  function side(src) {
    const f = FORMS[src.form] || {};
    return { name: src.name, form: src.form, level: src.level, type: src.type || f.type || null,
      hp: src.hp, atk: src.atk, def: src.def, spd: src.spd };
  }

  const NPCS = [
    { id: 'npc-a', name: '허수아비 A', form: 'muk_atk', level: 50, hp: 8, atk: 18, def: 10, spd: 10 },
    { id: 'npc-b', name: '허수아비 B', form: 'jji_def', level: 60, hp: 12, atk: 14, def: 30, spd: 8 },
    { id: 'npc-c', name: '허수아비 C', form: 'ppa_all', level: 75, hp: 15, atk: 26, def: 24, spd: 30 }
  ].map(n => Object.assign({}, n, bstats(n), { npc: true, type: FORMS[n.form].type, style: FORMS[n.form].style }));

  return { FORMS, TYPES, TYPE_ORDER, STYLES, STAGE_KO, STAT_KO, RULES, NPCS, BAR, TRAIN_KINDS, ADV, DIS, LEGACY,
    clamp, need, newPet, tick, advance, migrate, migrateEntry, topType, tendency, decideStyle, adultForm,
    checkEvo, gainExp, bstats, applyAction, trainParams, markerPos, judge, applyTrain,
    typeMult, elementMult, affinity, simulate, applyBattle, side };
});
