// 테스트 모드용 가짜 서버: server.js의 /api 동작을 브라우저 안에서 그대로 흉내 냅니다.
// 실제 배포에는 쓰지 않습니다. 데이터는 이 기기(localStorage)에만 저장됩니다.
(function () {
  const C = window.Core;
  const K = 'mongle-test-server-v1';
  let st = null;
  try { st = JSON.parse(localStorage.getItem(K)); } catch (e) {}
  if (!st || !st.users || st.ver !== 2) st = { ver: 2, users: {}, sessions: {}, pets: {}, arena: {}, nextId: 1 };
  const save = () => { try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) {} };

  // 결투장 테스트용 샘플 유저 2명 (처음 한 번만)
  if (!st.seeded) {
    const mk = (nick, name, form, level, hp, atk, def, spd) => {
      const id = st.nextId++;
      st.users[id] = { id, nick, pass: null, sample: true };
      const p = { name, form, level, hp, atk, def, spd };
      const f = C.FORMS[form];
      st.arena[id] = { data: Object.assign({ name, form, type: f.type, style: f.style, level, usedFast: false }, C.bstats(p)), wins: 0, losses: 0, updated: Date.now() };
    };
    mk('샘플트레이너1', '돌돌이', 'muk_atk', 52, 6, 22, 8, 10);
    mk('샘플트레이너2', '싹둑이', 'jji_def', 55, 10, 12, 26, 6);
    mk('샘플트레이너3', '팔랑이', 'ppa_all', 53, 8, 16, 15, 14);
    st.seeded = true; save();
  }

  const trains = {}, lastHit = {};
  const res = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  const fail = (code, msg) => res(code, { error: msg });
  async function hash(pw) {
    try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mongle:' + pw)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
    catch (e) { return 'plain:' + pw; }
  }
  const token = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  const findNick = nick => Object.values(st.users).find(u => u.nick.toLowerCase() === nick.toLowerCase());
  function loadPet(uid) { const p = st.pets[uid]; if (!p) return null; const pet = JSON.parse(JSON.stringify(p)); C.advance(pet, Date.now()); return pet; }
  function savePet(uid, pet) { st.pets[uid] = pet; save(); }
  function payload(uid, pet, extra) {
    const r = st.arena[uid];
    return Object.assign({ now: Date.now(), pet, allowFast: true, registered: r ? Object.assign(C.migrateEntry(Object.assign({}, r.data)), { wins: r.wins, losses: r.losses }) : null }, extra || {});
  }
  const entryFromPet = pet => Object.assign({ name: pet.name, form: pet.form, type: pet.type, style: pet.style, level: pet.level, usedFast: !!pet.usedFast }, C.bstats(pet));

  async function handle(path, method, body, authz) {
    // 계정
    if (path === '/signup' || path === '/login') {
      const nick = String(body.nick || '').trim(), pass = String(body.pass || '');
      if (path === '/signup') {
        if (!/^[\p{L}\p{N}_]{2,12}$/u.test(nick)) return fail(400, '닉네임은 2~12자의 한글, 영문, 숫자, _ 만 쓸 수 있어요.');
        if (pass.length < 4 || pass.length > 64) return fail(400, '비밀번호는 4자 이상이어야 해요.');
        if (findNick(nick)) return fail(409, '이미 있는 닉네임이에요.');
        const id = st.nextId++; st.users[id] = { id, nick, pass: await hash(pass) };
        const t = token(); st.sessions[t] = id; save(); return res(200, { token: t, nick });
      }
      const u = findNick(nick);
      if (!u || !u.pass || u.pass !== await hash(pass)) return fail(401, '닉네임 또는 비밀번호가 맞지 않아요.');
      const t = token(); st.sessions[t] = u.id; save(); return res(200, { token: t, nick: u.nick });
    }
    const m = /^Bearer (.+)$/.exec(authz || ''); const uid = m && st.sessions[m[1]];
    if (!uid) return fail(401, '다시 로그인해 주세요.');
    if (path === '/logout') { delete st.sessions[m[1]]; save(); return res(200, { ok: true }); }
    if (path === '/me') { const pet = loadPet(uid); if (pet) savePet(uid, pet); return res(200, payload(uid, pet, { nick: st.users[uid].nick })); }
    if (path === '/arena') {
      const list = Object.entries(st.arena).map(([id, r]) => Object.assign(C.migrateEntry(Object.assign({}, r.data)), { id: 'u' + id, trainer: st.users[id].nick, wins: r.wins, losses: r.losses, updated: r.updated, mine: Number(id) === uid }))
        .sort((a, b) => b.wins - a.wins || b.updated - a.updated);
      return res(200, { now: Date.now(), list, npcs: C.NPCS });
    }
    // 연타 제한 (train/stop 제외)
    if (method === 'POST' && path !== '/train/stop') {
      const now = Date.now(); if (now - (lastHit[uid] || 0) < 250) return fail(429, '조금 천천히 눌러 주세요.'); lastHit[uid] = now;
    }
    if (path === '/pet') {
      const name = String(body.name || '').trim().slice(0, 10) || '몽이';
      const pet = C.newPet(name, Date.now()); savePet(uid, pet); delete st.arena[uid]; delete trains[uid]; save();
      return res(200, payload(uid, pet, { msg: '알을 받았어요. 품기 버튼을 눌러 주세요.' }));
    }
    const pet = loadPet(uid);
    if (!pet) return fail(404, '먼저 알을 받아 주세요.');
    if (path === '/action') {
      if (trains[uid]) return fail(409, '훈련 중이에요.');
      const r = C.applyAction(pet, String(body.type || '')); savePet(uid, pet);
      return res(200, payload(uid, pet, { ok: r.ok, msg: r.msg, info: r.info }));
    }
    if (path === '/train/start') {
      const kind = String(body.kind || '');
      if (!C.TRAIN_KINDS.includes(kind)) return fail(400, '훈련 종류를 골라 주세요.');
      if (pet.stage === 'egg') return fail(400, '알은 훈련할 수 없어요.');
      if (pet.energy < C.RULES.trainCost) return fail(400, '에너지가 부족해요.');
      const params = C.trainParams(pet); trains[uid] = { kind, params, start: Date.now() }; savePet(uid, pet);
      return res(200, payload(uid, pet, { train: { kind, params } }));
    }
    if (path === '/train/stop') {
      const t = trains[uid]; if (!t) return fail(409, '진행 중인 훈련이 없어요.'); delete trains[uid];
      const serverElapsed = Date.now() - t.start, ce = Number(body.elapsed), gap = serverElapsed - ce;
      const used = Number.isFinite(ce) && gap >= 0 && gap <= 2000 ? ce : serverElapsed;
      const result = serverElapsed > 60000 ? 'fail' : C.judge(t.params, used);
      const r = C.applyTrain(pet, t.kind, result); savePet(uid, pet);
      return res(200, payload(uid, pet, { result, msg: r.msg, info: r.info }));
    }
    if (path === '/register') {
      if (pet.stage !== 'adult') return fail(400, '성체(Lv.50)가 되어야 등록할 수 있어요.');
      const had = !!st.arena[uid];
      st.arena[uid] = { data: entryFromPet(pet), wins: had ? st.arena[uid].wins : pet.wins, losses: had ? st.arena[uid].losses : pet.losses, updated: Date.now() };
      savePet(uid, pet); return res(200, payload(uid, pet, { msg: had ? '등록 정보를 갱신했어요.' : '결투장에 등록했어요!' }));
    }
    if (path === '/battle') {
      if (pet.stage !== 'adult') return fail(400, '성체만 배틀할 수 있어요.');
      if (pet.energy < C.RULES.battleCost) return fail(400, `에너지가 ${C.RULES.battleCost} 이상 필요해요.`);
      const id = String(body.opponent || ''); let op, opUid = null;
      const npc = C.NPCS.find(n => n.id === id);
      if (npc) op = npc;
      else {
        const mm = /^u(\d+)$/.exec(id); const row = mm && st.arena[mm[1]];
        if (!row) return fail(404, '상대를 찾을 수 없어요. 목록을 새로고침해 주세요.');
        opUid = Number(mm[1]); if (opUid === uid) return fail(400, '내 몬스터와는 싸울 수 없어요.');
        op = C.migrateEntry(Object.assign({}, row.data));
      }
      const me = C.side(Object.assign({ name: pet.name, form: pet.form, level: pet.level, type: pet.type }, C.bstats(pet)));
      const opSide = C.side(op);
      const sim = C.simulate(me, opSide);
      const info = C.applyBattle(pet, me.level, opSide.level, sim.win, !!npc);
      savePet(uid, pet);
      if (opUid) {
        if (st.arena[uid]) { st.arena[uid].wins += sim.win ? 1 : 0; st.arena[uid].losses += sim.win ? 0 : 1; }
        st.arena[opUid].wins += sim.win ? 0 : 1; st.arena[opUid].losses += sim.win ? 1 : 0; save();
      }
      return res(200, payload(uid, pet, { battle: { me, op: opSide, events: sim.ev, win: sim.win, mult: C.typeMult(me.type, opSide.type) }, info }));
    }
    return fail(404, '알 수 없는 요청이에요.');
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, opt) => {
    if (typeof url === 'string' && url.startsWith('/api')) {
      opt = opt || {};
      await new Promise(r => setTimeout(r, 60)); // 통신 지연 흉내
      const method = opt.method || 'GET';
      let body = {}; try { body = opt.body ? JSON.parse(opt.body) : {}; } catch (e) {}
      const authz = opt.headers && (opt.headers['Authorization'] || opt.headers.authorization);
      return handle(url.slice(4), method, body, authz);
    }
    return realFetch(url, opt);
  };
  window.__mongleTestReset = () => { try { localStorage.removeItem(K); localStorage.removeItem('mongle-token'); } catch (e) {} };
})();
