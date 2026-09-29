// 테스트 모드용 가짜 서버: server.js의 /api 동작을 브라우저 안에서 그대로 흉내 냅니다.
// 실제 배포에는 쓰지 않습니다. 데이터는 이 기기(localStorage)에만 저장됩니다.
(function () {
  const C = window.Core;
  const K = 'mongle-test-server-v1';
  let st = null;
  try { st = JSON.parse(localStorage.getItem(K)); } catch (e) {}
  if (!st || !st.users || st.ver !== 5) st = { ver: 5, users: {}, sessions: {}, pets: {}, entries: {}, matches: {}, nextId: 1, nextEntry: 1 };
  const save = () => { try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) {} };

  // 예전 테스트판의 샘플 트레이너·샘플 몽글이 지우기 (유저가 등록한 몽글이만 남김)
  if (st.seeded || Object.values(st.users).some(u => u.sample)) {
    const gone = new Set(Object.keys(st.users).filter(id => st.users[id].sample).map(Number));
    const goneE = new Set(Object.keys(st.entries).filter(id => gone.has(st.entries[id].user)).map(Number));
    gone.forEach(id => delete st.users[id]); goneE.forEach(id => delete st.entries[id]);
    Object.keys(st.matches).forEach(k => { const [w, l] = k.split('-').map(Number); if (goneE.has(w) || goneE.has(l)) delete st.matches[k]; });
    delete st.seeded; save();
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
  // server.js의 rankedArena / myEntries와 같은 동작
  function rankedArena(viewer) {
    const now = Date.now();
    const list = Object.entries(st.entries).map(([id, r]) => Object.assign(C.migrateEntry(Object.assign({}, r.data)), {
      id: Number(id), uid: r.user, trainer: st.users[r.user].nick, wins: r.wins, losses: r.losses, registeredAt: r.created, mine: r.user === viewer
    }));
    const ranked = C.rankEntries(list, (a, b) => st.matches[a + '-' + b] || 0);
    ranked.forEach(e => { e.id = 'e' + e.id; e.energyNow = C.arenaEnergy(e, now); });
    return ranked;
  }
  function myEntries(uid) {
    const list = rankedArena(uid);
    return list.filter(e => e.uid === uid).sort((a, b) => a.registeredAt - b.registeredAt).map(e => Object.assign({}, e, { total: list.length }));
  }
  const publicEntry = e => { const o = Object.assign({}, e); ['uid', 'born', 'energy', 'energyAt', 'energyNow', 'tv'].forEach(k => delete o[k]); return o; };
  function payload(uid, pet, extra) { return Object.assign({ now: Date.now(), pet, allowFast: true, mine: myEntries(uid), maxEntries: C.RULES.maxEntries }, extra || {}); }
  const myRows = uid => Object.entries(st.entries).filter(([, r]) => r.user === uid).map(([id, r]) => Object.assign({ id: Number(id) }, r)).sort((a, b) => a.created - b.created);
  const entryFromPet = (pet, now) => Object.assign({ name: pet.name, form: pet.form, look: pet.look, type: pet.type, style: pet.style, level: pet.level,
    usedFast: !!pet.usedFast, born: pet.born, energy: C.RULES.arenaMax, tv: 2 }, C.bstats(pet));

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
      const list = rankedArena(uid).map(publicEntry);
      return res(200, { now: Date.now(), list });
    }
    // 연타 제한 (train/stop 제외)
    if (method === 'POST' && path !== '/train/stop') {
      const now = Date.now(); if (now - (lastHit[uid] || 0) < 250) return fail(429, '조금 천천히 눌러 주세요.'); lastHit[uid] = now;
    }
    if (path === '/pet') {
      const name = String(body.name || '').trim().slice(0, 10) || '몽이';
      const pet = C.newPet(name, Date.now()); savePet(uid, pet); delete trains[uid]; save();   // 결투장 몽글이는 그대로
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
      if (pet.stage === 'adult') return fail(400, '다 자란 몽글이는 더 훈련할 수 없어요.');
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
      const rows = myRows(uid);
      if (rows.some(r => r.data.born === pet.born)) return fail(409, '이미 결투장에 올라가 있는 몽글이에요.');
      let replaced = null;
      if (rows.length >= C.RULES.maxEntries) {
        const mm = /^e(\d+)$/.exec(String(body.replace || ''));
        replaced = mm && rows.find(r => r.id === Number(mm[1]));
        if (!replaced) return fail(409, '결투장 자리가 꽉 찼어요. 교체할 몽글이를 골라 주세요.');
        delete st.entries[replaced.id];
        Object.keys(st.matches).forEach(k => { const [w, l] = k.split('-').map(Number); if (w === replaced.id || l === replaced.id) delete st.matches[k]; });
      }
      const now = Date.now(), eid = st.nextEntry++;
      st.entries[eid] = { user: uid, data: entryFromPet(pet, now), wins: 0, losses: 0, created: now };
      savePet(uid, pet);
      return res(200, payload(uid, pet, { msg: replaced ? `${replaced.data.name} 대신 ${pet.name}이(가) 결투장에 올라갔어요!` : '결투장에 등록했어요!' }));
    }
    if (path === '/battle') {
      const rows = myRows(uid);
      if (!rows.length) return fail(400, '먼저 성체를 결투장에 등록해 주세요.');
      const fm = /^e(\d+)$/.exec(String(body.fighter || ''));
      const frow = fm ? rows.find(r => r.id === Number(fm[1])) : rows.length === 1 ? rows[0] : null;
      if (!frow) return fail(400, '출전할 몽글이를 골라 주세요.');
      const fent = st.entries[frow.id], mine = C.migrateEntry(fent.data), now = Date.now();
      if (C.arenaEnergy(mine, now) < C.RULES.battleCost) return fail(400, `${mine.name}의 도전 횟수가 없어요. ${Math.ceil(C.arenaNextIn(mine, now) / 60)}분 뒤에 1번 회복돼요.`);
      const mm = /^e(\d+)$/.exec(String(body.opponent || '')); const orow = mm && st.entries[mm[1]];
      if (!orow) return fail(404, '상대를 찾을 수 없어요. 목록을 새로고침해 주세요.');
      if (orow.user === uid) return fail(400, '내 몽글이끼리는 싸울 수 없어요.');
      const oid = Number(mm[1]), op = C.migrateEntry(Object.assign({}, orow.data));
      const me = C.side(mine), opSide = C.side(op);
      const sim = C.simulate(me, opSide);
      C.spendArenaEnergy(mine, now, C.RULES.battleCost);
      const o = st.entries[oid];
      fent.wins += sim.win ? 1 : 0; fent.losses += sim.win ? 0 : 1; o.wins += sim.win ? 0 : 1; o.losses += sim.win ? 1 : 0;
      const k = sim.win ? frow.id + '-' + oid : oid + '-' + frow.id; st.matches[k] = (st.matches[k] || 0) + 1;
      save();
      return res(200, payload(uid, loadPet(uid), { battle: { fighter: 'e' + frow.id, me, op: opSide, events: sim.ev, win: sim.win, mult: C.typeMult(me.type, opSide.type) } }));
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
