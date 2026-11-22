// Комната: страница, вкладка «Комната», стены, дверь с наличниками, окно, ползунки размеров, свои ключи в браузере.
const { runPage, PAGES, check, slide, near, assert } = require('./harness');

const open = (o = {}) => { const p = runPage(PAGES.app, { hash: '#plan', ...o }); p.tick(); return p; };

check('страница в index.html: модули и панели вшиты', () => {
  assert.deepStrictEqual(Object.keys(PAGES), ['app']);
  assert.ok(!/<script src="js\//.test(PAGES.app), 'js/ module left as a link');
  assert.ok(!/<!--include /.test(PAGES.app), 'include left in the page');
});

check('комната открывается: вкладки «Комната» и «Обход», четыре стены, дверь, окно', () => {
  const p = open();
  const r = p.run(() => ({ view, n: Object.keys(VIEWS), lines: wallLines.length, parts: wallParts.length, fade: VIEWS.plan.fade,
    doors: doors.map((d) => d.g.visible), glass: wallParts.filter((w) => w.glass).length }));
  assert.deepStrictEqual(r, { view: 'plan', n: ['plan', 'walk'], lines: 4, parts: 26, fade: { door: '-z', right: '+x', left: '-x', window: '+z' },
    doors: [true], glass: 1 }, 'pieces: door wall 3, sides 1 + 1, window wall 4; window: 4 frame bars and a mullion (1200 wide), glass, sill board; cornices 4, skirting boards 5; the photo wallpaper');
  assert.strictEqual(p.document.querySelector('[data-panel="plan"]').hidden, false);
});

check('размеры: 2710 × 4797 (13 м²), потолок 3060', () => {
  const p = open();
  const r = p.run(() => ({ H, W: A.W, L: A.L, area: roomArea(ROOMS[0]), box: BOX, sub: document.getElementById('pSub').textContent }));
  assert.deepStrictEqual(r, { H: 3060, W: 2710, L: 4797, area: '13,00 м²', box: { x0: -120, x1: 2830, z0: -120, z1: 5197 },
    sub: '2710 × 4797 мм · 13,00 м² · потолок 3060' });
});

check('дверь: 800 между наличниками 70, правый наличник в 1570 от правого угла; открывается в комнату', () => {
  const p = open();
  const r = p.run(() => {
    const cs = doors[0].frame.children, d = doors[0], x = (m, s) => tt.mm(m.position.x + s * m.geometry.args[0] / 2);
    const room = cs.filter((m) => m.userData.casing && m.position.z > 0 && m.position.y < 1);   // the two jambs' casings on the room face
    return { hole: tt.wall('door').holes, dL, cas: room.map((m) => [x(m, -1), x(m, 1)]), hinge: tt.mm(d.g.position.x), s: d.s,
      leaf: tt.mm(d.g.children[0].position.x) };
  });
  assert.deepStrictEqual(r.hole, [[260, 1080, 2000]], 'the doorway: 820 in the wall (the lining 10 under each casing)');
  assert.deepStrictEqual(r.cas, [[200, 270], [1070, 1140]], 'casings: 200 from the left corner, 2710 − 1140 = 1570 from the right');
  assert.strictEqual(r.dL, 200);
  assert.deepStrictEqual([r.hinge, r.s, r.leaf < 0], [1067, 1, true], 'hinged at the right jamb, the leaf toward the left; it turns into the room');
});

check('окно: по центру стены напротив двери, ширина 1200, от 900 до 2950', () => {
  const p = open();
  const r = p.run(() => ({ hole: tt.wall('window').holes, r: tt.wall('window').r }));
  assert.deepStrictEqual(r.hole, [[755, 1955, 2950, 900]]);
  assert.deepStrictEqual(r.r, [-120, 2830, 4797, 5197]);
});

check('ползунки: стена длиннее — дверь остаётся в 1570 от правого угла; дальше угла не уходит', () => {
  const p = open();
  slide(p, 'W', 4000);
  assert.deepStrictEqual(p.run(() => [A.W, dL, A.dR, tt.wall('window').holes[0][0]]), [4000, 1490, 1570, 1400]);
  slide(p, 'dR', 5000);
  assert.deepStrictEqual(p.run(() => [A.dR, dL]), [3060, 0], 'stops where the left casing reaches the corner');
  assert.match(p.document.getElementById('pSizeMsg').textContent, /левый угол/);
  slide(p, 'winT', 3500);
  assert.strictEqual(p.run(() => A.winT), 2950, 'the window top under the cornice');
  assert.match(p.document.getElementById('pSizeMsg').textContent, /под лепнину/);
});

check('настройки в браузере — под своими ключами eng-, не под ключами квартиры', () => {
  const storage = new Map();
  const p = open({ storage });
  p.document.querySelector('[data-panel="plan"] [data-wm="edges"]').click();
  p.document.querySelector('[data-wc="greige"]').click();
  p.document.getElementById('pSaveA').click();
  const keys = [...storage.keys()].sort();
  assert.deepStrictEqual(keys, ['eng-model-v1', 'eng-shared-v1', 'eng-view-plan-v1']);
});

check('ракурсы: «На дверь» — камера за стеной с окном, «На окно» — за стеной с дверью', () => {
  const p = open();
  const z = (cam) => { p.document.querySelector(`[data-cam="${cam}"]`).click(); return p.run(() => goalPosition().z * 1000); };
  assert.ok(z('door') > 5197, 'past the window wall');
  assert.ok(z('window') < -120, 'past the door wall');
});

check('стены: обои «светлое какао» с тканью по умолчанию; у другого цвета ткани нет', () => {
  const p = open();
  const r = () => p.run(() => [S.wc, wallTexU.wallTexOn.value, typeof wallMat.onBeforeCompile, document.querySelector('[data-wc="cocoa"]').getAttribute('aria-pressed')]);
  assert.deepStrictEqual(r(), ['cocoa', 1, 'function', 'true']);
  p.document.querySelector('[data-wc="greige"]').click();
  assert.deepStrictEqual(r(), ['greige', 0, 'function', 'false']);
});

check('лепнина 110 под потолком по всем стенам, плинтус 70 — до наличников двери', () => {
  const p = open();
  const r = p.run(() => wallParts.filter((w) => w.trim).map((w) => [w.id, tt.mm(w.b), tt.mm(w.t), w.box]));
  assert.deepStrictEqual(r, [
    ['door', 2950, 3060, [0, 2710, 0, 30]], ['door', 0, 70, [0, 200, 0, 16]], ['door', 0, 70, [1140, 2710, 0, 16]],
    ['right', 2950, 3060, [2680, 2710, 0, 4797]], ['right', 0, 70, [2694, 2710, 0, 4797]],
    ['left', 2950, 3060, [0, 30, 0, 4797]], ['left', 0, 70, [0, 16, 0, 4797]],
    ['window', 2950, 3060, [0, 2710, 4767, 4797]], ['window', 0, 70, [0, 2710, 4781, 4797]]]);
  // «Контуры»: the walls are see-through, the trims go with them
  p.document.querySelector('[data-panel="plan"] [data-wm="edges"]').click(); p.tick();
  assert.deepStrictEqual(p.run(() => wallParts.filter((w) => w.trim && w.m.visible).length), 0);
});

check('фотообои: слева от входа, от плинтуса, 2700 высотой; 5000 по ширине, на стене 4797 — от угла у двери', () => {
  const p = open();
  const get = () => p.run(() => wallParts.filter((w) => w.photo).map((w) => ({ id: w.id, b: tt.mm(w.b), t: tt.mm(w.t), box: w.box,
    rot: w.m.rotation.y, rep: [muralTex.repeat.x, muralTex.repeat.y] })));
  const r = get();
  assert.strictEqual(r.length, 1);
  assert.deepStrictEqual([r[0].id, r[0].b, r[0].t, r[0].box], ['right', 70, 2770, [2709, 2710, 0, 4797]]);
  assert.ok(Math.abs(r[0].rot + Math.PI / 2) < 1e-9, 'faces into the room (-x)');
  assert.ok(Math.abs(r[0].rep[0] - 4797 / 5000) < 1e-9 && r[0].rep[1] === 1, 'the picture cut at the window end, not squeezed');
  // the walls cut to half: the sheet's top goes, the picture is not squashed
  const wh = p.document.querySelector('[data-panel="plan"] [data-wh]'); wh.value = '50'; wh.dispatch('input'); p.tick();
  near(get()[0].rep[1], (1530 - 70) / 2700, 'the share of the picture left');
  const btn = (v) => p.document.querySelector(`[data-panel="plan"] [data-mural="${v}"]`);
  btn('left').click();
  assert.deepStrictEqual(get().map((w) => [w.id, w.box]), [['left', [0, 1, 0, 4797]]]);
  btn('').click();
  assert.strictEqual(get().length, 0);
  assert.strictEqual(btn('').getAttribute('aria-pressed'), 'true');
});

check('лепнина — фриз с листьями: полка сверху, рельеф до 30 мм, низ доски гладкий', () => {
  const p = open();
  const r = p.run(() => {
    const vs = []; for (let i = 0; i < 200; i++) for (let j = 0; j <= 50; j++) vs.push(friezeDepth(i / 200, j / 50));
    const row = (v) => [...Array(100)].map((_, i) => friezeDepth(i / 100, v));
    return { min: Math.min(...vs), max: Math.max(...vs), band: row(.05), bottom: row(.99), mid: row(.5) };
  });
  assert.ok(r.min >= 8 && r.max <= 30, `${r.min}…${r.max}`);
  assert.ok(r.band.every((d) => d === 18), 'the plain band on top');
  assert.ok(r.bottom.every((d) => d === 8), 'the board plain under the tips');
  assert.ok(Math.max(...r.mid) - Math.min(...r.mid) > 10, 'the leaves stand out in the middle of the board');
});
