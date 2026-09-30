// 몽글 디바이스 — 게임 규칙 (서버와 브라우저가 같은 파일을 사용합니다)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ---------- 타입 (묵·찌·빠) ----------
  // beats: 이 타입이 유리한 상대
  // skill: 타입 기술(액티브). 공격할 때 p 확률로 발동, 피해 mult배 (피할 수 있고 치명타와 겹침)
  const TYPES = {
    muk: { name: '묵', beats: 'jji', skill: { name: '돌주먹', mult: 1.3, p: 0.2 } },
    jji: { name: '찌', beats: 'ppa', skill: { name: '손가락찌르기', mult: 1.3, p: 0.2 } },
    ppa: { name: '빠', beats: 'muk', skill: { name: '백열장', mult: 1.3, p: 0.2 } }
  };
  const TYPE_ORDER = ['muk', 'jji', 'ppa'];
  const ADV = 1.15, DIS = 0.9;  // 유리할 때 / 불리할 때 주는 피해 배수 (상성이 승패를 다 정하지 않게 약하게)

  // ---------- 성체 성향 (공격형·방어형·속도형) ----------
  // 훈련을 가장 많이 한 능력치로 정해짐. 성향마다 패시브(맞을 때마다 쌓임) 1개 + 액티브(능력치 500 이상일 때 10%) 1개
  // passive.stat: 맞을 때마다 그 값이 1%씩 오름 (dodge는 회피율 +1%p)
  // active.need: 발동 조건 능력치(배틀 수치) ≥ 500
  const STYLES = {
    atk: { name: '공격형', mult: { atk: 1.3, def: 0.95 },
      passive: { name: '분노', stat: 'atk' }, active: { name: '쌔게때리기', need: 'atk', p: 0.1 } },          // 맞히면 상대 1번 기절
    def: { name: '방어형', mult: { def: 1.3, hp: 1.15, atk: 0.95 },
      passive: { name: '웅크리기', stat: 'def' }, active: { name: '가시세우기', need: 'def', p: 0.1 } },       // 맞을 때 공격을 그대로 되돌림
    spd: { name: '속도형', mult: { spd: 1.3, def: 0.95 },
      passive: { name: '잔상', stat: 'dodge' }, active: { name: '두번때리기', need: 'spd', p: 0.1 } }          // 한 번 더 공격
  };
  const SKILL_NEED = 500, PASSIVE_STEP = 0.01;
  const ADULT_NAMES = {
    muk: { atk: '묵주먹', def: '묵바위', spd: '묵돌이' },
    jji: { atk: '찌칼날', def: '찌집게', spd: '찌깡총' },
    ppa: { atk: '빠폭풍', def: '빠방패', spd: '빠펄럭' }
  };
  // 화면에서 쓰는 그림 이름
  const ADULT_SPRITES = {
    muk: { atk: 'mukfist', def: 'ironshell', spd: 'mukpebble' },
    jji: { atk: 'flamehorn', def: 'jjicrab', spd: 'jjibunny' },
    ppa: { atk: 'galewing', def: 'ppashield', spd: 'ppahand' }
  };

  const FORMS = {
    egg:        { name: '알',     stage: 'egg' },
    mongsil:    { name: '몽실',   stage: 'baby',   how: 'Lv.10에 알에서 부화' },
    ppulmong:   { name: '뿔몽',   stage: 'rookie', atk: 1.15 },
    dandanmong: { name: '단단몽', stage: 'rookie', def: 1.15, hp: 1.05 },
    nalssaenmong: { name: '날쌘몽', stage: 'rookie', spd: 1.15, sprite: 'r_bolt' }
  };
  // 아성체 갈래(공격 쪽·방어 쪽·속도 쪽) ↔ 형태
  const ROOKIE_FORM = { atk: 'ppulmong', def: 'dandanmong', spd: 'nalssaenmong' };
  const rookieSide = form => Object.keys(ROOKIE_FORM).find(k => ROOKIE_FORM[k] === form) || 'atk';
  TYPE_ORDER.forEach(t => {
    ['atk', 'def', 'spd'].forEach(s => {
      FORMS[`${t}_${s}`] = Object.assign({ name: ADULT_NAMES[t][s], stage: 'adult', type: t, style: s, sprite: ADULT_SPRITES[t][s] }, STYLES[s].mult);
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
    r_horn: '뿔몽', r_wing2: '날개몽', r_shell2: '단단몽', r_guard: '방패몽', r_bolt: '번개몽', r_band: '두건몽',
    mukfist: '묵주먹', ironshell: '묵바위', mukpebble: '묵돌이', c_muk_atk: '묵버럭', c_muk_def: '묵졸음', c_muk_all: '묵만세',
    jjibunny: '찌깡총', c_jji_def: '찌집게', c_jji_all: '찌토끼', j_blade_arms: '찌가위손', j_crest_bird: '찌볏새', j_cross_horn: '찌뿔이',
    galewing: '빠폭풍', c_ppa_atk: '빠파닥', c_ppa_def: '빠우산', c_ppa_all: '빠손볏',
    // 예전 버전 모습 (기존 몽글이 표시용)
    mongsil: '몽실', ppulmong: '뿔몽', dandanmong: '단단몽', flamehorn: '찌칼날', jjicrab: '찌집게', ppashield: '빠방패', ppahand: '빠펄럭'
  };
  const POOLS = {
    baby: ['b_drop', 'b_fluff', 'b_slug'],
    rookie: { atk: ['r_horn', 'r_wing2'], def: ['r_shell2', 'r_guard'], spd: ['r_bolt', 'r_band'] },   // 훈련을 가장 많이 한 쪽 (decideStyle)
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
    if (o.stage === 'rookie') return pickStable(POOLS.rookie[rookieSide(o.form)], seed);
    const f = FORMS[o.form] || {};
    const pool = POOLS.adult[f.type || 'muk'];
    return pool.includes(f.sprite) ? f.sprite : pickStable(pool, seed);
  }
  const STAT_KO = { hp: '체력', atk: '공격력', def: '방어력', spd: '속도' };

  // 시간·행동 규칙
  const RULES = {
    base: { hpMin: 50, hpMax: 70, sum: 30, min: 5 },   // 알 받을 때 기본 능력치 (체력 범위, 공격+방어+속도 합, 각 최솟값)
    // ---- 시간 기준 성장 (초) ----
    // 알 10분 → 유체 12시간 → 아성체 24시간 → 성체. 건강도 80% 이상 1배, 50% 이상 0.5배, 그 밑은 멈춤
    grow: { egg: 600, baby: 12 * 3600, rookie: 24 * 3600 },
    healthFull: 80, healthHalf: 50,
    warmMul: 10, warmHold: 120,   // 알 품기: 누르고 있는 동안 10배(10분 → 1분) (한 번 누르면 최대 2분, 계속 누르면 연장)
    energyEvery: 180, maxEnergy: 100,  // 에너지 3분에 1 회복, 최대 100 (유체~성체 36시간 동안 훈련 최대 약 41번)
    hungerEvery: 432, moodEvery: 576, poopEvery: 3 * 3600,   // 배부름 12시간, 기분 16시간에 100→0, 똥 3시간마다 1개
    fastMul: 60,                  // 빠른 성장(테스트): 시간이 60배로 흐름
    maxOffline: 60 * 24 * 3600,   // 60일 넘게 비운 시간은 계산 안 함
    trainCost: 20,
    // 결투장 도전 횟수 (몽글이마다 따로): 등록 때 10번, 최대 10번, 10분마다 1번 회복, 도전 1회에 1번
    arenaMax: 10, battleCost: 1, arenaEnergyEvery: 600,
    maxEntries: 2,                // 한 계정당 결투장에 올릴 수 있는 몽글이 수
    pickCount: 3,                 // 결투장에서 무작위로 보여주는 상대 수         // 결투장 몽글이 배틀 에너지: 10초마다 +1 (최대 100)
    // 타입 점수: 밥 → 묵, 훈련 → 찌, 놀기 → 빠
    carePoints: { feed: 2, train: 1, play: 3 }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // 레벨은 없어졌지만 능력치·훈련 난이도는 단계마다 예전 레벨 값으로 계산
  // 유체는 부화 때 생긴 기본 능력치 그대로(보너스 0), 아성체·성체는 예전 Lv.30·50 성장만큼 보너스
  const STAGE_LV = { egg: 1, baby: 1, rookie: 30, adult: 50 };
  const stageLv = p => p.stage ? STAGE_LV[p.stage] || 1 : (p.level || 1);

  // 부화할 때 정해지는 기본 능력치 (무작위)
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
      v: 4, name, stage: 'egg', form: 'egg', look: 'egg', type: null, style: null,
      grow: 0, warmUntil: 0, evoUnseen: null,
      base: null,               // 기본 능력치는 부화할 때 정해짐
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
  // 성향: 공격·방어·속도 훈련 중 가장 많이 한 쪽 (같으면 공격 > 방어 > 속도)
  function decideStyle(pet) {
    const a = pet.atk || 0, d = pet.def || 0, s = pet.spd || 0;
    return a >= d && a >= s ? 'atk' : d >= s ? 'def' : 'spd';
  }
  function adultForm(type, style) { return `${type}_${style}`; }

  // 이전 버전 저장 데이터를 지금 규칙에 맞춤 (여러 번 불러도 안전)
  function migrate(pet) {
    if (!pet) return pet;
    if (!pet.care) pet.care = { muk: 0, jji: 0, ppa: 0 };
    if (typeof pet.hp !== 'number') pet.hp = 0;
    // 꾀죄죄몽은 없어짐: 예전 꾀죄죄몽은 같은 타입의 보통 형태로
    if (pet.stage === 'adult' && /_all$/.test(pet.form)) pet.form = pet.form.replace(/_all$/, '_spd');   // 만능형 → 속도형
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
    // v4: 레벨 → 시간 기준. 지금 단계 안에서 레벨이 간 만큼 성장 시간을 채워 줌
    if (!(pet.v >= 4)) {
      const L = pet.level || 1, G = RULES.grow;
      pet.grow = pet.stage === 'egg' ? clamp((L - 1) / 9, 0, 0.99) * G.egg
        : pet.stage === 'baby' ? clamp((L - 10) / 20, 0, 0.99) * G.baby
        : pet.stage === 'rookie' ? clamp((L - 30) / 20, 0, 0.99) * G.rookie : 0;
      pet.warmUntil = 0; pet.evoUnseen = null;
      pet.energy = clamp(pet.energy, 0, RULES.maxEnergy);
    }
    if (typeof pet.grow !== 'number') pet.grow = 0;
    pet.v = 4;
    return pet;
  }
  // 결투장 등록 정보 변환 (이전 버전 등록분에 타입이 없을 때)
  function migrateEntry(e) {
    if (!e) return e;
    if (/_all$/.test(e.form)) e.form = e.form.replace(/_all$/, '_spd');   // 만능형 → 속도형
    if (/^scruffy_/.test(e.form)) { e.form = e.form.split('_')[1] + '_spd'; if (e.look === 'scruffy') delete e.look; }   // 꾀죄죄몽 → 속도형
    if (!(FORMS[e.form] && FORMS[e.form].type)) {
      const t = e.type || LEGACY[e.form] || 'muk';
      e.form = `${t}_spd`;
    }
    e.type = FORMS[e.form].type; e.style = FORMS[e.form].style;
    if (!e.look) e.look = legacyLook(Object.assign({ stage: 'adult' }, e));
    if (e.tv !== 2) { e.tv = 2; e.energy = RULES.arenaMax; delete e.energyAt; }   // 예전 배틀 에너지(0~100) → 도전 횟수 10번으로
    return e;
  }

  // ---------- 시간 ----------
  // 건강도: 배부름·기분·청결(똥 1개마다 -25)의 평균. 알·성체는 따지지 않음
  function health(pet) {
    if (pet.stage === 'egg' || pet.stage === 'adult') return 100;
    return Math.round((pet.hunger + pet.mood + Math.max(0, 100 - 25 * pet.poops)) / 3);
  }
  // 지금 성장 속도 (1 / 0.5 / 0). 알은 품는 중이면 3
  function growRate(pet, nowMs) {
    if (pet.stage === 'adult') return 0;
    if (pet.stage === 'egg') return nowMs < (pet.warmUntil || 0) ? RULES.warmMul : 1;
    const h = health(pet);
    return h >= RULES.healthFull ? 1 : h >= RULES.healthHalf ? 0.5 : 0;
  }
  const growNeed = pet => RULES.grow[pet.stage] || Infinity;
  // sec초(게임 시간) 동안 배고픔·기분·똥·에너지 변화
  function tick(pet, sec) {
    const a = pet.acc;
    a.e += sec; let n = Math.floor(a.e / RULES.energyEvery); a.e -= n * RULES.energyEvery; pet.energy = Math.min(RULES.maxEnergy, pet.energy + n);
    if (pet.stage === 'egg' || pet.stage === 'adult') return;   // 알과 성체는 배고픔·기분·똥 없음
    a.h += sec; n = Math.floor(a.h / RULES.hungerEvery); a.h -= n * RULES.hungerEvery; pet.hunger = Math.max(0, pet.hunger - n);
    a.m += sec * (pet.poops >= 2 ? 1.6 : 1); n = Math.floor(a.m / RULES.moodEvery); a.m -= n * RULES.moodEvery; pet.mood = Math.max(0, pet.mood - n);
    a.p += sec; n = Math.floor(a.p / RULES.poopEvery); a.p -= n * RULES.poopEvery; pet.poops = Math.min(4, pet.poops + n);
    if (pet.hunger === 0 && !pet.flags.starve) { pet.mistakes++; pet.flags.starve = true; }
    if (pet.hunger > 20) pet.flags.starve = false;
    if (pet.poops >= 4 && !pet.flags.dirty) { pet.mistakes++; pet.flags.dirty = true; }
  }
  // now 시점까지 시간을 흘려보냄 (게임 시간 1분 단위). 건강도에 따라 성장 시간이 쌓이고, 다 차면 진화.
  // 진화는 한 번에 한 단계만: 진화 장면을 아직 안 봤으면(evoUnseen) 다음 단계 성장은 다 차기 직전에서 멈춤
  function advance(pet, now, rnd) {
    migrate(pet);
    let t = pet.last;
    const end = Math.min(now, pet.last + RULES.maxOffline * 1000);
    if (!(end > t)) return [];
    const mul = pet.fast ? RULES.fastMul : 1, stepMs = 60000 / mul, evos = [];
    while (t < end) {
      const dtMs = Math.min(stepMs, end - t), sim = dtMs / 1000 * mul;
      // 성장: 이 구간 시작 때의 건강도로 (알은 품는 구간만 10배)
      if (pet.stage === 'egg') {
        const warmMs = clamp((pet.warmUntil || 0) - t, 0, dtMs);
        pet.grow += sim + (RULES.warmMul - 1) * (warmMs / 1000 * mul);
      } else pet.grow += sim * growRate(pet, t);
      tick(pet, sim);
      t += dtMs;
      const need = growNeed(pet);
      if (pet.grow >= need) {
        if (pet.evoUnseen || evos.length) pet.grow = need - 1;
        else {
          const e = checkEvo(pet, rnd);
          if (e) { e.at = t; evos.push(e); pet.evoUnseen = e; pet.grow = 0; pet.warmUntil = 0; }
        }
      }
    }
    pet.last = now;
    return evos;
  }
  // 다음 진화까지 남은 실제 시간(초). 지금 속도가 0이면 null
  function evoLeft(pet, nowMs) {
    if (pet.stage === 'adult') return null;
    const r = growRate(pet, nowMs) * (pet.fast ? RULES.fastMul : 1);
    return r > 0 ? Math.max(0, (growNeed(pet) - pet.grow) / r) : null;
  }
  // 알 품기 시작/끝
  function warm(pet, on, nowMs) {
    if (pet.stage !== 'egg') return { ok: false, msg: '이미 부화했어요.' };
    pet.warmUntil = on ? nowMs + RULES.warmHold * 1000 : Math.min(pet.warmUntil || 0, nowMs);
    return { ok: true, msg: on ? '따뜻하게 품는 중… 시간이 10배로 흘러요.' : '' };
  }

  // ---------- 성장 ----------
  // 진화: 형태(form)는 규칙대로, 모습(look)은 그 단계·타입 안에서 무작위
  function checkEvo(pet, rnd) {
    const from = pet.look || pet.form; let to = null, look = null;
    if (pet.stage === 'egg') { to = 'mongsil'; pet.stage = 'baby'; look = pickRandom(POOLS.baby, rnd); if (!pet.base) pet.base = rollBase(rnd); }   // 부화하면 기본 능력치가 생김
    else if (pet.stage === 'baby') {
      const side = decideStyle(pet);          // 공격·방어·속도 훈련 중 가장 많이 한 쪽
      to = ROOKIE_FORM[side]; pet.stage = 'rookie'; look = pickRandom(POOLS.rookie[side], rnd);
    }
    else if (pet.stage === 'rookie') {
      pet.stage = 'adult';
      pet.type = topType(pet.care);       // 묵·찌·빠는 타입 점수로 결정
      pet.style = decideStyle(pet);       // 공격형·방어형·속도형은 훈련한 양으로 결정
      to = adultForm(pet.type, pet.style);
      look = pickRandom(POOLS.adult[pet.type], rnd);   // 모습은 타입 안에서 무작위
    }
    if (to) { pet.form = to; pet.look = look; return { from, to: look }; }
    return null;
  }
  // 배틀용 능력치 4종: 체력·공격력·방어력·속도
  function bstats(p) {
    // 기본 능력치(알 받을 때 무작위) + 단계 보너스(유체·아성체·성체, 예전 Lv.10·30·50 성장만큼) + 훈련, 그 뒤 형태 배율
    const f = FORMS[p.form] || {}, L = p.base ? stageLv(p) - 1 : stageLv(p), b = p.base || OLD_BASE;
    return {
      hp:  Math.round((b.hp  + L * 8   + (p.hp || 0) * 3) * (f.hp || 1)),
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
    if (egg) return { ok: false, msg: '알은 품어 주기만 할 수 있어요.' };
    if (pet.stage === 'adult') return { ok: false, msg: '다 자란 몽글이는 더 돌보거나 키울 수 없어요. 결투장에 등록해 보세요.' };
    if (type === 'feed') {
      if (pet.hunger >= 100) { pet.mood = Math.max(0, pet.mood - 5); return { ok: true, msg: '배불러서 싫대요.', refuse: true }; }
      pet.hunger = Math.min(100, pet.hunger + 25); addCare(pet, 'feed');
      return { ok: true, msg: '냠냠!' };
    }
    if (type === 'play') {
      if (pet.mood >= 100) return { ok: false, msg: '이미 기분이 최고예요.' };
      if (pet.energy < 5) return { ok: false, msg: '너무 피곤해요.' };
      pet.mood = Math.min(100, pet.mood + 20); pet.energy -= 5; addCare(pet, 'play');
      return { ok: true, msg: '신나게 놀았어요.' };
    }
    if (type === 'clean') {
      if (!pet.poops) return { ok: false, msg: '치울 게 없어요.' };
      pet.poops = 0; pet.flags.dirty = false; pet.mood = Math.min(100, pet.mood + 5); return { ok: true, msg: '깨끗해졌어요.' };
    }
    return { ok: false, msg: '알 수 없는 행동이에요.' };
  }

  // ---------- 훈련 미니게임 ----------
  // 네 훈련 모두 "시작 1번 + 끝 1번" 통신. 화면은 누른 시각 등을 taps로 모아 보내고, 서버는 같은 규칙(씨앗 포함)으로 다시 셈
  //  체력 = 줄넘기(rope), 속도 = 폭탄 피하기(dodge), 방어 = 조준점 막기(guard), 공격 = 묵찌빠(rps). 1회 최대 +20
  const TRAIN_MAX = 20;
  const TRAIN_KINDS = ['hp', 'atk', 'def', 'spd'];
  const GAME_OF = { hp: 'rope', spd: 'dodge', def: 'guard', atk: 'rps' };
  const GAMES = {
    // 막대 36칸 양끝 6칸 구역, 구역에서 누르면 방향 전환 + 1.12배 빨라짐
    rope: { len: 36, zone: 6, speed0: 16, accel: 1.12, ready: 700 },
    // 3줄, 떨어진 거리 = v0·(s + k·s²/2) 칸. 폭탄 줄 i의 윗칸 y = floor(거리) - bombH - i·gap
    // 거리 기준: 몸통이 몽글이에 닿기 시작(y≥5) / 벗어남(y≥16) / 몽글이 아래로 완전히 지나감(y≥19)
    dodge: { lanes: 3, v0: 12, k: 0.08, gap: 20, bombH: 8, ready: 700, enter: 13, exit: 24, pass: 27, seeded: true },
    // 5곳(몸 크기 직사각형 네 꼭짓점 + 정가운데). 막을 시간 1.2초→0.35초, 다음은 0.2~1초 무작위, 가끔(25%) 3연속(0.1초)
    guard: { ready: 700, w0: 1200, w1: 350, gapMin: 200, gapMax: 1000, burstGap: 100, burstP: 0.25, spots: 5, seeded: true },
    // 상대 손을 보고 이기는 손(가끔 지는 손) 내기. 낼 시간 1.2초→0.4초, 성공하면 0.35초 뒤 다음
    rps: { ready: 700, w0: 1200, w1: 400, next: 350, loseP: 0.2, loseFrom: 4, seeded: true }
  };
  const MAX_TAPS = 400;
  function trainParams(pet, rnd, kind) {
    const game = GAME_OF[kind], g = GAMES[game];
    return Object.assign({ game, maxOk: TRAIN_MAX }, g, g.seeded ? { seed: Math.floor((rnd || Math.random)() * 2147483647) } : {});
  }
  // 씨앗으로 만드는 난수 (서버·화면 같음)
  function seeded(seed) { let st = seed >>> 0; return () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; }; }
  // i번째(0부터) 제한 시간: w0 → 마지막 w1로 고르게 줄어듦
  const shrinkWindow = (p, i) => Math.round(p.w0 - (p.w0 - p.w1) * Math.min(i, p.maxOk - 1) / (p.maxOk - 1));

  // 줄넘기: taps = 누른 시각(ms). 반환 pos, dir, ok, over('miss' 구역 밖 / 'pass' 끝 지나침 / 'max'), endAt
  function ropeRun(p, taps, at) {
    const last = p.len - 1;
    let t = p.ready, pos = 0, dir = 1, speed = p.speed0, ok = 0;
    const crossAt = () => t + 1000 * (dir > 0 ? last - pos : pos) / speed;   // 끝에 닿는 시각
    const inZone = x => dir > 0 ? x >= p.len - p.zone : x <= p.zone - 1;
    for (const tt of taps) {
      if (tt < p.ready) continue;                                // 준비 중 터치는 무시
      if (tt > crossAt()) return { pos: dir > 0 ? last : 0, dir, ok, over: 'pass', endAt: crossAt() };
      const x = pos + dir * speed * (tt - t) / 1000;
      if (!inZone(x)) return { pos: x, dir, ok, over: 'miss', endAt: tt };
      pos = x; t = tt; dir = -dir; speed *= p.accel; ok++;
      if (ok >= p.maxOk) return { pos, dir, ok, over: 'max', endAt: tt };
    }
    if (at < p.ready) return { pos: 0, dir: 1, ok, over: null };
    if (at > crossAt()) return { pos: dir > 0 ? last : 0, dir, ok, over: 'pass', endAt: crossAt() };
    return { pos: pos + dir * speed * (at - t) / 1000, dir, ok, over: null };
  }

  // 폭탄 배치: 한 줄에 1~2개(3줄이 다 막히는 일은 없음), 뒤로 갈수록 2개짜리가 많아짐
  function dodgeWaves(p) {
    const r = seeded(p.seed), out = [];
    for (let i = 0; i < p.maxOk + 2; i++) {
      const two = i > 1 && r() < Math.min(0.65, 0.2 + i * 0.03), free = Math.floor(r() * 3), one = Math.floor(r() * 3);
      out.push(two ? [0, 1, 2].filter(l => l !== free) : [one]);
    }
    return out;
  }
  const dodgeDist = (p, ms) => { const s = Math.max(0, ms - p.ready) / 1000; return p.v0 * (s + p.k * s * s / 2); };
  const dodgeTimeAt = (p, D) => p.ready + 1000 * (Math.sqrt(1 + 2 * p.k * D / p.v0) - 1) / p.k;   // 거리 D에 닿는 시각(ms)
  const dodgeWaveY = (p, i, ms) => Math.floor(dodgeDist(p, ms)) - p.bombH - i * p.gap;
  // taps = [{t, d}] (d = -1 왼쪽 / +1 오른쪽). 반환 lane, ok(지나 보낸 줄), over('hit'|'max'), endAt, hitWave
  function dodgeRun(p, taps, at, waves) {
    const W = waves || dodgeWaves(p);
    const mv = taps.filter(m => m.t >= p.ready).slice().sort((a, b) => a.t - b.t);
    const laneAt = t => { let l = 1; for (const m of mv) { if (m.t > t) break; l = clamp(l + (m.d > 0 ? 1 : -1), 0, p.lanes - 1); } return l; };
    const passedBy = t => { let n = 0; while (n < p.maxOk && t >= dodgeTimeAt(p, p.pass + n * p.gap)) n++; return n; };
    let endAt = Infinity, over = null, hitWave = -1;
    for (let i = 0; i < p.maxOk; i++) {
      const t0 = dodgeTimeAt(p, p.enter + i * p.gap), t1 = dodgeTimeAt(p, p.exit + i * p.gap);
      if (t0 > Math.min(at, endAt)) break;
      // 겹치는 동안의 줄: 들어올 때 줄 + 그 사이에 옮긴 순간마다
      const checks = [t0].concat(mv.filter(m => m.t > t0 && m.t < t1).map(m => m.t));
      for (const t of checks) if (t <= at && W[i].includes(laneAt(t))) { if (t < endAt) { endAt = t; over = 'hit'; hitWave = i; } break; }
    }
    const tMax = dodgeTimeAt(p, p.pass + (p.maxOk - 1) * p.gap);
    if (!over && at >= tMax) { over = 'max'; endAt = tMax; }
    const tt = over ? endAt : at;
    return { lane: laneAt(tt), ok: passedBy(tt), over, endAt: over ? endAt : null, hitWave };
  }

  // 조준·묵찌빠 공통: 문제 목록을 차례로 풀기. answer(q)가 정답, taps = [{t, v}] (v = 누른 자리/손)
  // 뜨기 전 누른 건 무시, 시간 지나면 'time', 틀리면 'miss'. 반환 ok, appear(지금 문제가 뜬/뜰 시각), over, endAt
  function quizRun(p, taps, at, Q, answer, nextGap) {
    let ok = 0, appear = p.ready;
    for (const tp of taps.slice().sort((a, b) => a.t - b.t)) {
      if (tp.t < appear) continue;
      const until = appear + shrinkWindow(p, ok);
      if (tp.t > until) return { ok, appear, over: 'time', endAt: until };
      if (tp.v !== answer(Q[ok])) return { ok, appear, over: 'miss', endAt: tp.t };
      if (++ok >= p.maxOk) return { ok, appear, over: 'max', endAt: tp.t };
      appear = tp.t + nextGap(Q[ok]);
    }
    const until = appear + shrinkWindow(p, ok);
    return at > until ? { ok, appear, over: 'time', endAt: until } : { ok, appear, over: null };
  }
  // 조준 순서: [{spot(0~4), gap, step(3연속 몇 번째, 0이면 아님)}], 바로 전과 같은 자리는 없음
  function guardPlan(p) {
    const r = seeded(p.seed), out = []; let burst = 0;
    for (let i = 0; i < p.maxOk; i++) {
      let spot; do { spot = Math.floor(r() * p.spots); } while (i && out[i - 1].spot === spot);
      let gap = Math.round(p.gapMin + r() * (p.gapMax - p.gapMin)), step = 0;
      if (burst > 0) { gap = p.burstGap; step = 4 - burst; burst--; }
      else if (i >= 2 && i <= p.maxOk - 3 && r() < p.burstP) { burst = 2; step = 1; }
      out.push({ spot, gap, step });
    }
    return out;
  }
  const guardRun = (p, taps, at, Q) => quizRun(p, taps, at, Q || guardPlan(p), q => q.spot, q => q.gap);
  // 묵찌빠 문제: [{op(상대 손), lose(지는 손을 내야 함)}]
  function rpsPlan(p) {
    const r = seeded(p.seed), out = [];
    for (let i = 0; i < p.maxOk; i++) out.push({ op: TYPE_ORDER[Math.floor(r() * 3)], lose: i >= p.loseFrom && r() < p.loseP });
    return out;
  }
  const rpsWinner = h => TYPE_ORDER.find(k => TYPES[k].beats === h);          // h를 이기는 손
  const rpsAnswer = q => q.lose ? TYPES[q.op].beats : rpsWinner(q.op);
  const rpsRun = (p, taps, at, Q) => quizRun(p, taps, at, Q || rpsPlan(p), rpsAnswer, () => p.next);

  // 서버: 화면이 보낸 taps를 정리해서 성공 수를 다시 셈 (서버가 잰 시간보다 늦은 입력은 버림)
  function trainJudge(p, taps, elapsed) {
    if (!p || elapsed > 60000 || !Array.isArray(taps)) return 0;
    const ok = x => Number.isFinite(x.t) && x.t >= 0 && x.t <= elapsed;
    const list = taps.slice(0, MAX_TAPS);
    const run = p.game === 'rope' ? ropeRun(p, list.map(Number).filter(t => ok({ t })).sort((a, b) => a - b), elapsed)
      : p.game === 'dodge' ? dodgeRun(p, list.map(x => ({ t: Number(x && x.t), d: Number(x && x.d) > 0 ? 1 : -1 })).filter(ok), elapsed)
      : p.game === 'guard' ? guardRun(p, list.map(x => ({ t: Number(x && x.t), v: Number(x && x.v) })).filter(ok), elapsed)
      : p.game === 'rps' ? rpsRun(p, list.map(x => ({ t: Number(x && x.t), v: String(x && x.v) })).filter(ok), elapsed)
      : { ok: 0 };
    return Math.min(TRAIN_MAX, run.ok);
  }
  // 훈련 결과 저장: 에너지 20, 배부름 6을 쓰고 능력치 +ok
  function applyTraining(pet, kind, ok) {
    migrate(pet);
    pet.energy -= RULES.trainCost; pet.hunger = Math.max(0, pet.hunger - 6);
    ok = clamp(ok | 0, 0, TRAIN_MAX); pet[kind] += ok;
    addCare(pet, 'train');
    return { msg: ok ? `${ok}번 성공! ${STAT_KO[kind]} +${ok}` : '아쉬워요. 다음엔 잘할 거예요.' };
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

  // 배틀 (시험 규칙 C + 기술)
  // - 속도: 행동 게이지가 속도만큼 차고 100마다 행동 → 속도가 2배면 2번 공격. 회피·치명타는 속도 비율로
  // - 공격: 피해 = 공격² ÷ (공격 + 방어)
  // - 타입 기술(TYPES.skill): 공격할 때 20%, 피해 1.3배
  // - 성향 패시브: 맞을 때마다 공격력/방어력 +1%, 또는 회피율 +1%p (배틀 안에서만)
  // - 성향 액티브(해당 능력치 500 이상, 10%): 쌔게때리기(맞히면 상대 다음 행동 1번 기절) / 가시세우기(맞을 때 피해를 받지 않고 공격한 쪽에 그대로) / 두번때리기(곧바로 한 번 더 공격)
  // 이벤트: {who, miss?, skill?, style?(성향 액티브 이름), dmg, crit, eff, reflect?, stun?(상대 기절), stunned?(기절해서 못 움직임), mh, oh}
  function simulate(me, op, rnd) {
    const r = rnd || Math.random;
    const ev = []; let mh = me.hp, oh = op.hp, gm = 0, go = 0, n = 0;
    const st = { me: { atk: 1, def: 1, dodge: 0, stun: 0 }, op: { atk: 1, def: 1, dodge: 0, stun: 0 } };   // 배틀 중에 쌓이는 값
    const S = x => STYLES[x.style || (FORMS[x.form] || {}).style] || null;
    const can = (x, key) => { const s = S(x); return s && s.active.name === STYLES[key].active.name && x[s.active.need] >= SKILL_NEED && r() < s.active.p; };
    const meFirst = me.spd === op.spd ? r() < .5 : me.spd > op.spd;
    const hp = w => w === 'me' ? mh : oh;
    const hurt = (w, d) => { if (w === 'me') mh = Math.max(0, mh - d); else oh = Math.max(0, oh - d); };
    const hit = (turn, extra) => {
      const foe = turn === 'me' ? 'op' : 'me', A = turn === 'me' ? me : op, D = turn === 'me' ? op : me;
      const sa = st[turn], sd = st[foe], atk = A.atk * sa.atk, def = D.def * sd.def, sr = A.spd / (A.spd + D.spd || 1);
      const dodge = clamp(0.3 * (1 - sr) - 0.05, 0.03, 0.25) + sd.dodge, crit = clamp(0.3 * sr - 0.03, 0.05, 0.25);
      const sk = TYPES[A.type] && TYPES[A.type].skill, skill = sk && r() < sk.p ? sk.name : null;
      const base = { who: turn, skill }; if (extra) base.style = extra;
      if (r() < dodge) return ev.push(Object.assign(base, { miss: true, mh, oh }));
      const c = r() < crit, aff = affinity(A, D);
      const raw = atk * atk / (atk + def || 1) * (0.9 + r() * 0.2) * (c ? 1.6 : 1) * (skill ? sk.mult : 1);
      const dmg = Math.max(2, Math.round(raw * aff));
      const e = Object.assign(base, { dmg, crit: c, eff: aff > 1 ? 'up' : aff < 1 ? 'down' : null });
      if (can(D, 'def')) {                         // 가시세우기: 피해를 그대로 되돌림
        e.reflect = STYLES.def.active.name; hurt(turn, dmg);
      } else {
        hurt(foe, dmg);
        // 패시브: 맞을 때마다 쌓임
        const ps = S(D); if (ps) { const k = ps.passive.stat; sd[k] += PASSIVE_STEP; }
        if (hp(foe) > 0 && can(A, 'atk')) { e.stun = STYLES.atk.active.name; sd.stun = 1; }
      }
      ev.push(Object.assign(e, { mh, oh }));
    };
    const act = t => {
      if (st[t].stun) { st[t].stun = 0; ev.push({ who: t, stunned: true, mh, oh }); return; }
      hit(t);
      const A = t === 'me' ? me : op;
      if (mh > 0 && oh > 0 && can(A, 'spd')) hit(t, STYLES.spd.active.name);   // 두번때리기
    };
    while (n < 80 && mh > 0 && oh > 0) {
      gm += Math.max(1, me.spd); go += Math.max(1, op.spd);
      const acts = [];
      const push = () => { if (gm >= 100) { acts.push('me'); gm -= 100; } };
      const pushO = () => { if (go >= 100) { acts.push('op'); go -= 100; } };
      if (gm > go || (gm === go && meFirst)) { push(); pushO(); } else { pushO(); push(); }
      for (const t of acts) { if (mh <= 0 || oh <= 0 || n >= 80) break; act(t); n++; }
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
  // 결투장 등록 정보 (등록 순간의 능력치를 저장) / 다른 사람에게 보여 줄 때 숨길 값 빼기
  const entryFromPet = pet => Object.assign({ name: pet.name, form: pet.form, look: pet.look, type: pet.type, style: pet.style, level: 50,
    usedFast: !!pet.usedFast, born: pet.born, energy: RULES.arenaMax, tv: 2 }, bstats(pet));
  const publicEntry = e => { const o = Object.assign({}, e); ['uid', 'born', 'energy', 'energyAt', 'energyNow', 'tv'].forEach(k => delete o[k]); return o; };
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
    return { name: src.name, form: src.form, look: src.look, level: src.level, type: src.type || f.type || null, style: f.style || src.style || null,
      hp: src.hp, atk: src.atk, def: src.def, spd: src.spd };
  }

  return { FORMS, LOOKS, POOLS, ROOKIE_FORM, rookieSide, legacyLook, TYPES, TYPE_ORDER, STYLES, STAGE_KO, STAT_KO, RULES, ADV, DIS, LEGACY,
    arenaEnergy, arenaNextIn, spendArenaEnergy, rankEntries, entryFromPet, publicEntry,
    clamp, newPet, advance, health, growRate, evoLeft, warm, migrate, migrateEntry, topType, tendency, decideStyle,
    checkEvo, bstats, rollBase, applyAction,
    TRAIN_MAX, TRAIN_KINDS, GAMES, trainParams, trainJudge, applyTraining,
    ropeRun, dodgeWaves, dodgeDist, dodgeWaveY, dodgeTimeAt, dodgeRun, guardPlan, guardRun, rpsPlan, rpsAnswer, rpsRun, shrinkWindow,
    typeMult, elementMult, affinity, simulate, side };
});
