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
  assert.deepStrictEqual(r, { view: 'plan', n: ['plan', 'walk'], lines: 4, parts: 31, fade: { door: '-z', right: '+x', left: '-x', window: '+z' },
    doors: [true], glass: 1 }, 'pieces: door wall 3, sides 1 + 1, window wall 4; window: 4 frame bars and a mullion (1200 wide), glass, sill board; cornices 4, skirting boards 5, rope trims 5; the photo wallpaper');
  assert.strictEqual(p.document.querySelector('[data-panel="plan"]').hidden, false);
});

check('размеры: 2710 × 4797 (13 м²), потолок 3060', () => {
  const p = open();
  const r = p.run(() => ({ H, W: A.W, L: A.L, area: roomArea(ROOMS[0]), box: BOX, sub: document.getElementById('pSub').textContent }));
  assert.deepStrictEqual(r, { H: 3060, W: 2710, L: 4797, area: '13,00 м²', box: { x0: -120, x1: 2830, z0: -120, z1: 5197 },
    sub: '2710 × 4797 мм · 13,00 м² · потолок 3060' });
});

check('дверь: 800 между наличниками 70, правый наличник в 1570 от правого угла; открывается наружу, в коридор', () => {
  const p = open();
  const r = p.run(() => {
    const cs = doors[0].frame.children, d = doors[0], x = (m, s) => tt.mm(m.position.x + s * m.geometry.args[0] / 2);
    const room = cs.filter((m) => m.userData.casing && m.position.z > 0 && m.position.y < 1);   // the two jambs' casings on the room face
    return { hole: tt.wall('door').holes, dL, cas: room.map((m) => [x(m, -1), x(m, 1)]), hinge: tt.mm(d.g.position.x), hz: tt.mm(d.g.position.z), s: d.s,
      leaf: tt.mm(d.g.children.find((m) => typeof m.userData.whole === 'number').position.x) };   // the handle, at the free edge
  });
  assert.deepStrictEqual(r.hole, [[260, 1080, 2000]], 'the doorway: 820 in the wall (the lining 10 under each casing)');
  assert.deepStrictEqual(r.cas, [[200, 270], [1070, 1140]], 'casings: 200 from the left corner, 2710 − 1140 = 1570 from the right');
  assert.strictEqual(r.dL, 200);
  assert.deepStrictEqual([r.hinge, r.hz, r.s, r.leaf < 0], [1067, -120, -1, true], 'hinged at the right jamb on the corridor face, the leaf toward the left; it turns out');
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

check('«Размеры и площадь» — одна галка, по умолчанию выключена: ни размеров, ни названия; включена — оба', () => {
  const p = open();
  const shown = () => { p.tick(); return p.run(() => [dimsGroup.visible, namesGroup.visible]); };
  assert.strictEqual(p.document.getElementById('pMarks').checked, false);
  assert.deepStrictEqual(shown(), [false, false]);
  p.document.getElementById('pMarks').checked = true; p.document.getElementById('pMarks').dispatch('change');
  assert.deepStrictEqual(shown(), [true, true]);
});

check('настройки в браузере — под своими ключами eng-, не под ключами квартиры', () => {
  const storage = new Map();
  const p = open({ storage });
  p.document.getElementById('pMarks').checked = true; p.document.getElementById('pMarks').dispatch('change');
  p.document.querySelector('[data-wc="greige"]').click();
  p.document.getElementById('pSaveA').click();
  const keys = [...storage.keys()].sort();
  assert.deepStrictEqual(keys, ['eng-model-v1', 'eng-shared-v1', 'eng-view-plan-v1']);
});

check('ракурсы: «План» — из угла, пониже, «На дверь» — камера за стеной с окном, «За диваном» — за стеной у его спинки, на уровне глаз (и зеркально)', () => {
  const p = open();
  const at = (cam) => { p.document.querySelector(`[data-cam="${cam}"]`).click(); return p.run(() => [goalPosition().x, goalPosition().z, goalT.z].map((v) => v * 1000)); };
  assert.ok(at('door')[1] > 5197, 'past the window wall');
  at('plan'); near(p.run(() => goal.phi), 0.85, 'the plan from the corner, lowish'); near(p.run(() => goalT.y * 1000), 1000, 'at the room\'s middle, 1000 up');
  const s = at('sofa'); assert.ok(s[0] < -120, 'past the wall at the sofa\'s back: ' + s[0]); near(s[2], p.run(() => CZ * 1000), 'at the room\'s middle');
  near(p.run(() => goalPosition().y * 1000), 1600, 'eyes at 1600'); near(p.run(() => goalT.y * 1000), 1200, 'a little down');
  assert.ok(s[0] > -7600, 'nearer than the old view (−7588 at 4:3, more on a wide screen): ' + s[0]);
  p.document.querySelector('[data-sofa="right"]').click();
  assert.ok(at('sofa')[0] > 2830, 'mirrored');
  assert.strictEqual(p.document.querySelector('[data-cam="window"]'), null);
});

check('сцена: без мини-вида; «i» — подсказка под устройство (мышь или палец) и под вкладку', () => {
  const p = open();
  assert.deepStrictEqual([p.document.getElementById('camBtn'), p.run(() => typeof showDebug)], [null, 'undefined']);
  const shown = () => p.run(() => [...infoBtn.querySelectorAll('[data-info]')].filter((t) => !t.hidden).map((t) => t.dataset.info + ':' + t.dataset.dev));
  assert.deepStrictEqual(shown(), ['orbit:mouse']);
  p.run(() => { touchDev = true; syncInfo(); });
  assert.deepStrictEqual(shown(), ['orbit:touch']);
});

check('дверь и плинтус — в текстуре дерева из фото (волокна вдоль деталей), ручки латунные; лепнина и плетёнка белые', () => {
  const p = open();
  const r = p.run(() => { const pl = wallParts.filter((w) => w.trim && w.kind === 'plinth').map((w) => w.m.material === woodMat);
    return [leafMat === woodMat, pl.length > 0 && pl.every(Boolean), wallParts.filter((w) => w.trim && w.kind !== 'plinth').every((w) => w.m.material === trimMat)]; });
  assert.deepStrictEqual(r, [true, true, true]);
  assert.deepStrictEqual(p.run(() => [woodTex.repeat.x, woodTex.repeat.y]), [1 / 1.3, 1 / 2.3], 'the sheet: 1300 across the grain, 2300 along it');
  assert.match(PAGES.app, /woodMat=new THREE\.MeshStandardMaterial\(\{map:woodTex,/);
  assert.match(PAGES.app, /const WOOD_JPG='data:image\/jpeg;base64,/);
});

check('панель «Комнаты»: нет стен и двери — стены всегда «Разрез», дверь закрыта', () => {
  const storage = new Map([['eng-view-plan-v1', JSON.stringify({ Wm: 'edges', Wh: 40, dm: 'open' })]]);
  const p = open({ storage });
  assert.deepStrictEqual(['[data-wm]', '[data-wh]', '[data-dm]'].map((q) => p.document.querySelector(`[data-panel="plan"] ${q}`)), [null, null, null]);
  assert.deepStrictEqual(p.run(() => [VS.plan.Wm, VS.plan.Wh, VS.plan.dm, doors.every((d) => d.t === 0)]), ['auto', 100, 'closed', true]);
});

check('стены: «Средний беж» по умолчанию; обои — из фото, у другого цвета текстуры нет', () => {
  const p = open();
  const r = () => p.run(() => [S.wc, wallTexU.wallTexOn.value, typeof wallMat.onBeforeCompile, document.querySelector('[data-wc="linen"]').getAttribute('aria-pressed')]);
  assert.deepStrictEqual(r(), ['mid', 0, 'function', 'false']);
  assert.strictEqual(p.document.querySelector('[data-wc="mid"]').getAttribute('aria-pressed'), 'true');
  p.document.querySelector('[data-wc="linen"]').click();
  assert.deepStrictEqual(r(), ['linen', 1, 'function', 'true']);
});

check('лепнина 110 под потолком по всем стенам, плинтус 70 — до наличников двери', () => {
  const p = open();
  const r = p.run(() => wallParts.filter((w) => w.trim && (w.kind === 'cornice' || w.kind === 'plinth')).map((w) => [w.id, tt.mm(w.b), tt.mm(w.t), w.box]));
  assert.deepStrictEqual(r, [
    ['door', 2950, 3060, [0, 2710, 0, 30]], ['door', 0, 70, [0, 200, 0, 16]], ['door', 0, 70, [1140, 2710, 0, 16]],
    ['right', 2950, 3060, [2680, 2710, 0, 4797]], ['right', 0, 70, [2694, 2710, 0, 4797]],
    ['left', 2950, 3060, [0, 30, 0, 4797]], ['left', 0, 70, [0, 16, 0, 4797]],
    ['window', 2950, 3060, [0, 2710, 4767, 4797]], ['window', 0, 70, [0, 2710, 4781, 4797]]]);
  // «Контуры»: the walls are see-through, the trims go with them
  p.run(() => { VS.plan.Wm = 'edges'; }); p.tick();
  assert.deepStrictEqual(p.run(() => wallParts.filter((w) => w.trim && w.m.visible).length), 0);
});

check('фотообои: слева от входа, от плинтуса, 2700 высотой; 5000 по ширине, на стене 4797 — от угла у двери; или справа, или на обеих', () => {
  const p = open();
  const get = () => p.run(() => wallParts.filter((w) => w.photo).map((w) => ({ id: w.id, b: tt.mm(w.b), t: tt.mm(w.t), box: w.box,
    rot: w.m.rotation.y, rep: [muralTex.repeat.x, muralTex.repeat.y] })));
  const r = get();
  assert.strictEqual(r.length, 1);
  assert.deepStrictEqual([r[0].id, r[0].b, r[0].t, r[0].box], ['right', 70, 2770, [2709, 2710, 0, 4797]]);
  assert.ok(Math.abs(r[0].rot + Math.PI / 2) < 1e-9, 'faces into the room (-x)');
  assert.ok(Math.abs(r[0].rep[0] - 4797 / 5000) < 1e-9 && r[0].rep[1] === 1, 'the picture cut at the window end, not squeezed');
  // the walls cut to half: the sheet's top goes, the picture is not squashed
  p.run(() => { VS.plan.Wh = 50; }); p.tick();
  near(get()[0].rep[1], (1530 - 70) / 2700, 'the share of the picture left');
  const btn = (v) => p.document.querySelector(`[data-panel="plan"] [data-mural="${v}"]`);
  btn('left').click();
  assert.deepStrictEqual(get().map((w) => [w.id, w.box]), [['left', [0, 1, 0, 4797]]]);
  btn('both').click();
  assert.deepStrictEqual(get().map((w) => [w.id, w.box]), [['right', [2709, 2710, 0, 4797]], ['left', [0, 1, 0, 4797]]], 'both long walls');
  assert.strictEqual(btn('both').getAttribute('aria-pressed'), 'true');
  assert.strictEqual(p.document.querySelector('[data-panel="plan"] [data-mural=""]'), null, 'no «Нет»');
});

check('фальш-декор: тонкий (плетёнка 11), обычный (гладкий молдинг 35, по умолчанию), нет — обои до лепнины, над фотообоями цвет их неба', () => {
  const p = open();
  const r = () => p.run(() => ({ decor: wallParts.filter((w) => w.kind === 'rope' || w.kind === 'mold').map((w) => w.kind + ':' + tt.mm(w.t - w.b)),
    band: tt.mm(wallTexU.wallBandY.value), top: wallParts.filter((w) => w.top).map((w) => [w.id, w.box, tt.mm(w.b), tt.mm(w.t), w.m.material === muralTopMat]),
    on: [...document.querySelectorAll('[data-decor]')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.decor) }));
  const btn = (v) => p.document.querySelector(`[data-decor="${v}"]`);
  assert.deepStrictEqual(r(), { decor: Array(5).fill('mold:35'), band: 2770, top: [], on: ['plain'] });
  btn('thin').click();
  assert.deepStrictEqual(r(), { decor: Array(5).fill('rope:11'), band: 2770, top: [], on: ['thin'] });
  btn('none').click();
  assert.deepStrictEqual(r(), { decor: [], band: 99000, top: [['right', [2709, 2710, 0, 4797], 2770, 3060, true]], on: ['none'] });
  assert.deepStrictEqual(p.run(() => [A.decor, MURAL_TOP]), ['none', '#DCD8CC']);
  p.document.querySelector('[data-panel="plan"] [data-mural="both"]').click();
  assert.deepStrictEqual(r().top.map((t) => t[0]), ['right', 'left']);
  btn('thin').click();
  assert.deepStrictEqual(r(), { decor: Array(5).fill('rope:11'), band: 2770, top: [], on: ['thin'] });
  assert.deepStrictEqual(p.run(() => [apartment({ decor: true }).A.decor, apartment({ decor: false }).A.decor]), ['thin', 'none'], 'a yes / no remembered before');
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

check('плетёнка 11 × 6 («Тонкий») по периметру сразу над фотообоями, у окна прервана; обои до её низа, выше до лепнины стена белая, как она', () => {
  const p = open();
  p.document.querySelector('[data-decor="thin"]').click();
  const r = p.run(() => ({ rope: wallParts.filter((w) => w.kind === 'rope').map((w) => [w.id, tt.mm(w.b), tt.mm(w.t), w.box]),
    band: tt.mm(wallTexU.wallBandY.value), white: wallTexU.wallBandC.value === trimMat.color || JSON.stringify(wallTexU.wallBandC.value) === JSON.stringify(trimMat.color),
    d: [...Array(40)].map((_, i) => ropeDepth(i / 40, .5)), edge: ropeDepth(.3, 0) }));
  assert.deepStrictEqual(r.rope, [
    ['door', 2770, 2781, [0, 2710, 0, 6]], ['right', 2770, 2781, [2704, 2710, 0, 4797]], ['left', 2770, 2781, [0, 6, 0, 4797]],
    ['window', 2770, 2781, [0, 755, 4791, 4797]], ['window', 2770, 2781, [1955, 2710, 4791, 4797]]]);
  assert.deepStrictEqual([r.band, r.white], [2770, true], 'the wallpaper up to the rope\'s bottom, as the photo wallpaper');
  assert.ok(Math.max(...r.d) <= 6 && Math.max(...r.d) - Math.min(...r.d) > 1.5 && r.edge === 0, 'round across, the strands twisted along');
  slide(p, 'muralH', 2500);
  assert.deepStrictEqual(p.run(() => [tt.mm(wallParts.find((w) => w.kind === 'rope').b), tt.mm(wallTexU.wallBandY.value)]), [2570, 2570], 'the rope and the band go with the wallpaper');
});

check('откосы окна не оклеены: проём окна в мировых координатах для шейдера — белый, как полоса над плетёнкой', () => {
  const p = open();
  const r = p.run(() => [wallTexU.revMin.value, wallTexU.revMax.value].map((v) => [v.x, v.y, v.z].map((x) => tt.mm(x))));
  assert.deepStrictEqual(r, [[753, 898, 4795], [1957, 2952, 5199]], 'the opening 755…1955, 900…2950, through the wall 4797…5197, 2 mm over');
});

check('розетка на потолке: овал 550 × 450 по центру, вдоль боковых стен, листья как у лепнины; на «Комнате» скрыта, в обходе — пока стены целые', () => {
  const p = open();
  const r = p.run(() => {
    const m = roseGroup.children[0];
    return { n: roseGroup.children.length, rose: m.userData.rose, boss: roseDepth(0, 0), rim: roseDepth(.3, .95), edge: roseDepth(.3, 1),
      same: leafDepth(.2, .5) === leafDepth(Math.abs(.3 - .5), .5), frieze: friezeDepth(.5, .5) === FRIEZE_BASE + FRIEZE_LEAF * Math.min(1.1, leafDepth(0, (.5 - .17) / .79)),
      vis: roseGroup.visible, A: [A.rosW, A.rosD] };
  });
  assert.deepStrictEqual(r, { n: 1, rose: true, boss: 32, rim: 6, edge: 1, same: true, frieze: true, vis: false, A: [550, 450] }, 'not on the «Комната» tab');
  const w = runPage(PAGES.app, { parentWin: { appView: 'walk' } }); w.tick();
  assert.strictEqual(w.run(() => roseGroup.visible), true, 'in the walk');
  const wh = w.document.querySelector('[data-panel="walk"] [data-wh]'); wh.value = '50'; wh.dispatch('input'); w.tick();
  assert.strictEqual(w.run(() => roseGroup.visible), false, 'the walls cut lower: no ceiling to hang from');
});

check('цвет стен: «Средний беж» между Greige и обоями; «Свой» — из палитры браузера, запоминается', () => {
  const storage = new Map();
  const p = open({ storage });
  assert.deepStrictEqual(p.document.querySelectorAll('[data-wc]').map((b) => b.dataset.wc), ['linen', 'mid', 'greige', 'french', 'white', 'custom']);
  p.document.querySelector('[data-wc="mid"]').click();
  const lin = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);   // the hex's channels 0…1
  const c = p.run(() => [wallMat.color.r, wallMat.color.g, wallMat.color.b, wallTexU.wallTexOn.value]);
  // Greige shows as its hex taken linear, the wallpaper as its photo: the middle of the two on screen (sRGB)
  const enc = (v) => Math.pow(v, 1 / 2.4) * 1.055 - 0.055;
  [0, 1, 2].forEach((i) => { const mid = (lin('#C7BEB1')[i] ** (1 / 2.2) + lin('#A59389')[i]) / 2; assert.ok(Math.abs(enc(c[i]) - mid) < .02, `channel ${i}: ${enc(c[i])} ≈ ${mid}`); });
  assert.strictEqual(c[3], 0, 'no wallpaper texture');
  const pick = p.document.getElementById('wcPick'); pick.value = '#336699'; pick.dispatch('input');
  assert.deepStrictEqual(p.run(() => [S.wc, S.wcc]), ['custom', '#336699']);
  assert.strictEqual(p.document.querySelector('[data-wc="custom"]').getAttribute('aria-pressed'), 'true');
  assert.deepStrictEqual(JSON.parse(storage.get('eng-shared-v1')).wcc, '#336699');
  const q = open({ storage });
  assert.deepStrictEqual(q.run(() => [S.wc, WALLC.custom.c]), ['custom', '#336699'], 'remembered');
});

check('шкаф 1601 × 2600 × 506 у стены с фотообоями, от угла у двери, к плинтусу; 8 дверей открываются наружу', () => {
  const p = open();
  const r = p.run(() => ({ box: wardrobeBoxes()[0].map((v) => tt.mm(v)), doors: furnDoors.length,
    s: furnDoors.map((d) => d.s), wall: tt.wall(A.wardWall).name }));
  assert.deepStrictEqual(r.box, [2188, 2694, 16, 1617, 0, 2600], 'back on the skirting board (2710 − 16), its left at the door wall\'s skirting');
  assert.deepStrictEqual([r.doors, r.s, r.wall], [8, [-1, -1, -1, -1, 1, 1, 1, 1], 'Правая стена']);
  // a door opens on a click as the room's: sent open, it swings there
  p.run(() => { furnDoors[0].t = furnDoors[0].max; }); p.tick(120);
  assert.ok(p.run(() => furnDoors[0].a) > 1.5);
});

check('шкаф: три ручки, по одной на стыке дверей; не в одной плоскости с дверью (не мерцают)', () => {
  const p = open();
  const r = p.run(() => furnDoors.filter((d) => d.g.children.length > 1).map((d) => {
    const ext = (m) => ['x', 'z'].flatMap((k, i) => { const a = m.geometry.args[i === 0 ? 0 : 2] / 2; return [tt.mm(m.position[k] - a), tt.mm(m.position[k] + a)]; });
    return [ext(d.g.children[0]), ext(d.g.children[1])];
  }));
  assert.strictEqual(r.length, 3, 'three handles: one at each meeting of two doors');
  r.forEach(([leaf, h]) => { leaf.forEach((v) => assert.ok(!h.includes(v), `a face of the handle in the leaf's plane: ${leaf} / ${h}`)); });
});

check('шкаф: ручки на стыках дверей — 1|2, 2|3, 3|4', () => {
  const p = open();
  const u = p.run(() => furnDoors.filter((d) => d.g.children.length > 1).map((d) => tt.mm(d.g.position.x + d.g.children[1].position.x)));
  const dw = (1601 - 15) / 4, edge = (i) => 3 + i * (dw + 3) - 1.5;   // the middle of the gap left of door i
  assert.deepStrictEqual(u.map((x, i) => Math.abs(x - edge(i + 1)) < 10), [true, true, true], u.join(' '));
});

check('розетка не отбрасывает тень', () => {
  const p = open();
  assert.deepStrictEqual(p.run(() => [roseGroup.children[0].castShadow, roseGroup.children[0].receiveShadow]), [false, true]);
});

check('шкаф: кнопкой в панели — к стене с дверью, в правый угол, и обратно', () => {
  const p = open();
  const at = () => p.run(() => [A.wardWall, wardrobeBoxes()[0].map((v) => tt.mm(v)), document.querySelector('[data-ward="door"]').getAttribute('aria-pressed')]);
  p.document.querySelector('[data-ward="door"]').click();
  assert.deepStrictEqual(at(), ['door', [1093, 2694, 16, 522, 0, 2600], 'true'], 'in the right corner, on the skirting boards; clear of the doorway (1080)');
  assert.deepStrictEqual(p.run(() => aptProblems(A)), []);
  p.document.querySelector('[data-ward="right"]').click();
  assert.deepStrictEqual(at()[0], 'right');
  p.document.querySelector('[data-ward="door"]').click();
  assert.deepStrictEqual(at()[0], 'door');
  slide(p, 'dR', 1500);   // the door to the right: the doorway's edge (2650 − dR) reaches the wardrobe's side (1093) at dR 1557
  assert.strictEqual(p.run(() => A.dR), 1560);
  assert.match(p.document.getElementById('pSizeMsg').textContent, /Шкаф/);
});

check('плинтус: ползунок в панели под «Фальш-декор», 70–150 (70 по умолчанию); выше плинтус — выше фотообои и молдинг над ними', () => {
  const p = open(), sl = p.document.querySelector('#pPlinth [data-size="plH"]');
  assert.deepStrictEqual([...['min', 'max', 'step'].map((k) => sl.getAttribute(k)), String(sl.value)], ['70', '150', '10', '70']);
  assert.strictEqual(p.document.querySelector('#pSizes [data-size="plH"]'), null, 'not in «Размеры стен» too');
  const at = () => p.run(() => { const y = (q) => [...new Set(wallParts.filter(q).map((w) => [tt.mm(w.b), tt.mm(w.t)].join('–')))];
    return { pl: y((w) => w.kind === 'plinth'), mural: y((w) => w.photo), mold: y((w) => w.kind === 'mold') }; });
  assert.deepStrictEqual(at(), { pl: ['0–70'], mural: ['70–2770'], mold: ['2770–2805'] });
  slide(p, 'plH', 150);
  assert.deepStrictEqual([p.run(() => A.plH), at()], [150, { pl: ['0–150'], mural: ['150–2850'], mold: ['2850–2885'] }], 'the moulding still under the cornice (2950)');
});

check('плинтус: под «Диваном»; цвет плашками, как у стен — дерево (по умолчанию, как дверь), белый, бежевый, тауп', () => {
  const p = open(), hs = [...PAGES.app.matchAll(/<h3>([^<$]+)<\/h3>/g)].map((m) => m[1]);
  assert.strictEqual(hs.indexOf('Плинтус'), hs.indexOf('Диван') + 1, hs.join(', '));
  const mat = () => p.run(() => { const m = wallParts.filter((w) => w.kind === 'plinth').map((w) => w.m.material);
    return [A.plColor, new Set(m).size, m[0] === woodMat ? 'wood' : Object.keys(plinthPaint).find((k) => plinthPaint[k] === m[0]),
      document.querySelector(`[data-plcol="${A.plColor}"]`).getAttribute('aria-pressed')]; });
  assert.deepStrictEqual(mat(), ['wood', 1, 'wood', 'true']);
  p.document.querySelector('[data-plcol="white"]').click();
  assert.deepStrictEqual(mat(), ['white', 1, 'white', 'true']);
  p.document.querySelector('[data-plcol="beige"]').click();
  assert.deepStrictEqual(mat(), ['beige', 1, 'beige', 'true']);
  assert.match(p.run(() => document.getElementById('pFacts').innerHTML), /плинтус 70 бежевый/);
  const sw = p.run(() => [...document.querySelectorAll('#pPlCol [data-plcol]')].map((b) => [b.className, b.dataset.plcol]));
  assert.deepStrictEqual(sw, [['wc', 'wood'], ['wc', 'white'], ['wc', 'beige'], ['wc', 'taupe']], 'the walls\' swatch buttons');
  p.document.querySelector('[data-plcol="taupe"]').click();
  assert.deepStrictEqual(mat(), ['taupe', 1, 'taupe', 'true']);
  assert.match(p.run(() => document.getElementById('pFacts').innerHTML), /плинтус 70 тауп/);
  assert.strictEqual(p.run(() => doors[0].g.children.some((m) => m.material === woodMat)), true, 'the door stays wood');
});

check('шкаф: карточка «i» — «Сеул» с Wildberries, угловой — «Уютная логика» с Ozon (угловой и две доп. секции)', () => {
  const p = open();
  const card = () => p.run(() => { const i = infoOf(wardGroup.children[0].children[0]);
    return { t: i.title, shop: i.shop, price: i.price || 0, buy: (i.buy || []).map((b) => [b.name, b.n || 1, b.price]), lines: i.lines.length }; });
  assert.deepStrictEqual(card(), { t: 'Шкаф для одежды «Сеул» с антресолью (Wildberries)', shop: 'Wildberries', price: 27655, buy: [], lines: 5 });
  p.document.querySelector('[data-ward="corner"]').click();
  assert.deepStrictEqual(card(), { t: 'Угловой шкаф «Уютная логика» (Ozon)', shop: 'Ozon', price: 0, lines: 5,
    buy: [['Угловой 96,4 × 96,4 × 260', 1, 24845], ['Доп. секция 40 × 50 × 260', 2, 9577]] });
  p.run(() => openItemCard(infoOf(wardGroup.children[0])));
  const el = p.document.getElementById('itemCard'), buys = el.children[el.children.length - 1];
  assert.deepStrictEqual(buys.children.map((r) => r.children.map((c) => c.textContent)),
    [['Угловой 96,4 × 96,4 × 260', '24 845 ₽', 'Ozon'], ['Доп. секция 40 × 50 × 260', '2 × 9 577 ₽', 'Ozon'], ['Итого', '43 999 ₽']],
    '24 845 + 2 × 9 577');
});

check('шкаф: в карточке ссылка на следующий вариант — «Слева», «У двери», «Угловой 1», «Угловой 2» по кругу, как кнопки панели', () => {
  const p = open(), el = p.document.getElementById('itemCard');
  const next = () => el.children.find((c) => c.className === 'next');
  const at = () => [p.run(() => A.wardWall), next().children[0].textContent, el.children[1].textContent,
    p.document.querySelector(`[data-ward="${p.run(() => A.wardWall)}"]`).getAttribute('aria-pressed')];
  p.run(() => openItemCard(infoOf(wardGroup.children[0])));
  assert.deepStrictEqual(at(), ['right', '1/4', 'Шкаф для одежды «Сеул» с антресолью (Wildberries)', 'true']);
  const go = () => next().children[1].click();
  go(); assert.deepStrictEqual(at(), ['door', '2/4', 'Шкаф для одежды «Сеул» с антресолью (Wildberries)', 'true']);
  assert.deepStrictEqual(el.children[2].children.slice(-2).map((c) => c.textContent), ['Место', 'у стены с дверью']);
  go(); assert.deepStrictEqual(at(), ['corner1', '3/4', 'Угловой шкаф «Уютная логика» (Ozon)', 'true']);
  go(); assert.deepStrictEqual(at(), ['corner', '4/4', 'Угловой шкаф «Уютная логика» (Ozon)', 'true']);
  assert.deepStrictEqual(p.run(() => wardrobeBoxes().length), 2, 'the corner one built');
  go(); assert.deepStrictEqual(at()[0], 'right');
});

check('шкаф: в карточке объём жирным — «Сеул» ≈ 1842 л внутри (2106 снаружи), угловой с секциями ≈ 2505 (2896); строки «название — значение»', () => {
  const p = open(), vol = () => p.run(() => [infoOf(wardGroup.children[0]).lines.find((t) => t[0] === 'Объём'), wardVolume()]);
  assert.deepStrictEqual(vol(), [['Объём', '≈ 1842 л', true], { in: 1842, out: 2106 }]);
  p.document.querySelector('[data-ward="corner"]').click();
  assert.deepStrictEqual(vol(), [['Объём', '≈ 2505 л', true], { in: 2505, out: 2896 }], 'the L footprint 1,114 m² by 2600');
  p.run(() => openItemCard(infoOf(wardGroup.children[0])));
  const props = p.document.getElementById('itemCard').children[2];
  assert.deepStrictEqual([props.className, props.children.map((c) => c.tagName + ':' + c.textContent).slice(6, 8)], ['props', ['SPAN:Объём', 'B:≈ 2505 л']]);
});

check('шкаф «Угловой 1»: без доп. секции у стены с фотообоями — 964 вдоль неё, 1364 вдоль стены с дверью; 6 дверей; одна секция в карточке', () => {
  const p = open();
  p.document.querySelector('[data-ward="corner1"]').click();
  const r = p.run(() => ({ w: A.wardWall, boxes: wardrobeBoxes().map((b) => b.map((v) => tt.mm(v))), doors: furnDoors.length, bad: aptProblems(A),
    on: document.querySelector('[data-ward="corner1"]').getAttribute('aria-pressed'), v: wardVolume() }));
  assert.deepStrictEqual(r, { w: 'corner1', boxes: [[1330, 2694, 16, 516, 0, 2600], [2194, 2694, 516, 980, 0, 2600]], doors: 6, bad: [], on: 'true',
    v: { in: 2069, out: 2376 } }, 'the door wall\'s run as the 2-section one; the left wall\'s ends at 16 + 964');
  const i = p.run(() => { const c = infoOf(wardGroup.children[0]); return [c.lines[1][1], c.buy.map((b) => [b.n || 1, b.price])]; });
  assert.deepStrictEqual(i, ['угловой 96,4 × 96,4 и секция 40 × 50, высота 260 см', [[1, 24845], [1, 9577]]]);
  assert.match(p.run(() => document.getElementById('pFacts').innerHTML), /964 вдоль стены слева/);
});

check('шкаф угловой в углу у двери, как в основном проекте: модуль 964 × 964 и доп. секции по 400 с обеих сторон (1364 вдоль стен), штанги у стены слева, сверху антресоль 400', () => {
  const p = open();
  p.document.querySelector('[data-ward="corner"]').click();
  const r = p.run(() => ({ w: A.wardWall, boxes: wardrobeBoxes().map((b) => b.map((v) => tt.mm(v))), doors: furnDoors.length, s: furnDoors.map((d) => d.s),
    on: document.querySelector('[data-ward="corner"]').getAttribute('aria-pressed'), bad: aptProblems(A) }));
  assert.deepStrictEqual(r, { w: 'corner', boxes: [[1330, 2694, 16, 516, 0, 2600], [2194, 2694, 516, 1380, 0, 2600]], doors: 8,
    s: [-1, 1, -1, 1, -1, 1, -1, 1], on: 'true', bad: [] });
  const g = p.run(() => ({ h: furnDoors.map((d) => tt.mm(d.h)), rods: wardGroup.children[0].children.filter((m) => m.userData.rod).map((m) => tt.mm(m.position.y)),
    rodAt: wardGroup.children[0].children.filter((m) => m.userData.rod).map((m) => [tt.mm(m.position.x), tt.mm(m.position.z)]) }));
  assert.deepStrictEqual(g, { h: [2126, 2126, 2126, 2126, 396, 396, 396, 396], rods: [1590, 860], rodAt: [[2450, 498], [2450, 498]] }, 'the doors over the plinth up to 2200, the mezzanine\'s 400; two rods in the leg');
  const w = p.run(() => furnDoors.slice(0, 4).map((d) => tt.mm(Math.abs(d.g.children[0].geometry.args[d.g.children[0].geometry.args[0] > d.g.children[0].geometry.args[2] ? 0 : 2]))));
  w.forEach((v) => assert.ok(v > 380 && v < 420, 'a door about 400 wide, not a giant: ' + v));
  p.document.querySelector('[data-sofa="right"]').click();
  assert.deepStrictEqual(p.run(() => [A.sofaWall, aptProblems(A)]), ['right', []], 'the sofa still fits at the left wall');
  slide(p, 'dR', 1300);   // the door to the right: the doorway's edge (2650 − dR) reaches the wardrobe (1330) at dR 1320
  assert.strictEqual(p.run(() => A.dR), 1320);
  assert.match(p.document.getElementById('pSizeMsg').textContent, /Угловой шкаф/);
});

check('дверь «Классика»: полотно с вырезом под стекло, филёнка, стекло, раскладка на 6 стёкол; всё режется по высоте стен', () => {
  const p = open();
  const r = p.run(() => { const g = doors[0].g, leaf = g.children.filter((m) => !(typeof m.userData.whole === 'number'));
    return { n: leaf.length, glass: leaf.filter((m) => m.material === doorGlassMat).length, kinds: leaf.map((m) => m.geometry.kind),
      h: leaf.map((m) => tt.mm(m.userData.h)), parts: doorParts.filter((q) => !q.whole).every((q) => q.h > 0) }; });
  assert.deepStrictEqual(r, { n: 6, glass: 1, kinds: ['THREE.ExtrudeGeometry', 'THREE.ExtrudeGeometry', 'THREE.ShapeGeometry', 'THREE.BoxGeometry', 'THREE.BoxGeometry', 'THREE.BoxGeometry'],
    h: [1980, 755, 815, 815, 24, 24], parts: true });
});

check('дверь: раскладка в стекле — стойка и две перекладины между низом стекла (1050) и верхом арки (1865)', () => {
  const p = open();
  const r = p.run(() => doors[0].g.children.filter((m) => m.geometry.kind === 'THREE.BoxGeometry' && !(typeof m.userData.whole === 'number'))
    .map((m) => tt.mm(m.position.y + m.geometry.off[1])));
  assert.strictEqual(r.length, 3);
  r.forEach((y) => assert.ok(y > 1050 && y < 1865, 'a bar at ' + y));
});

check('диван MANSTAD: у стены справа от входа спинкой к плинтусу, кушеткой к окну в 100 от его стены, подлокотники с обоих концов; кнопкой — зеркально у стены слева', () => {
  const p = open();
  const r = () => p.run(() => sofaBoxes().map((b) => b.map((v) => tt.mm(v))));
  assert.deepStrictEqual(r(), [[16, 966, 2297, 4697, 0, 900], [16, 1576, 3797, 4697, 0, 450]],
    'its back at the skirting board, its end 100 off the window wall; the main part 950 deep; the chaise 900 wide, 1560 out');
  assert.strictEqual(p.run(() => velour.map === undefined ? 'none' : 'map'), 'map');
  assert.strictEqual(p.run(() => sofaGroup.children[0].children.filter((m) => m.userData.armrest).length), 2, 'an armrest at each end: the chaise\'s too');
  assert.deepStrictEqual(p.run(() => { const t = velourTexture(); return [t.repeat.x, t.repeat.y]; }), [1 / 1.2, 1 / 1.2], 'the velour\'s tile 1200: its repeats far apart');
  const btn = (v) => p.document.querySelector(`[data-sofa="${v}"]`);
  assert.strictEqual(btn('left').getAttribute('aria-pressed'), 'true');
  btn('right').click();
  assert.deepStrictEqual(r(), [[1744, 2694, 2297, 4697, 0, 900], [1134, 2694, 3797, 4697, 0, 450]], 'mirrored at the other side wall');
  assert.deepStrictEqual([p.run(() => A.sofaWall), btn('right').getAttribute('aria-pressed')], ['right', 'true']);
  assert.deepStrictEqual(p.run(() => aptProblems(A)), [], 'it and the wardrobe fit at one wall');
  slide(p, 'L', 3500);   // the wardrobe (16…1617) and the sofa (L − 2500…) meet at L 4117
  assert.strictEqual(p.run(() => A.L), 4117);
  assert.match(p.document.getElementById('pSizeMsg').textContent, /диван/);
});

check('пол: ламинат светлого дерева, доски вдоль боковых стен; в обходе тоже; без «Покрытия пола» — простой пол; общий пол на 10 ниже', () => {
  const p = open();
  const r = () => p.run(() => [roomMats[0].map === laminateTex, roomGroup.visible, [laminateTex.repeat.x, laminateTex.repeat.y].map((v) => +v.toFixed(4))]);
  assert.deepStrictEqual(r(), [true, true, [+(1 / 1.544).toFixed(4), +(1 / 2.76).toFixed(4)]]);
  assert.strictEqual(p.run(() => tt.mm(floor.position.y)), -10, 'not in the room floor\'s depth (it flickered)');
  assert.strictEqual(p.document.getElementById('pFloors'), null, 'the plan\'s «Цвет пола» gone');
  p.document.getElementById('wFloor').checked = false; p.document.getElementById('wFloor').dispatch('change');
  assert.strictEqual(r()[0], false);
  assert.strictEqual(p.run(() => S.floor), false);
  const w = runPage(PAGES.app, { parentWin: { appView: 'walk' } }); w.tick();
  assert.deepStrictEqual(w.run(() => [roomMats[0].map === laminateTex, roomGroup.visible]), [true, true], 'in the walk');
});

check('«i» на сенсорном экране — по тапу у предмета с карточкой, не у двери; поднятый палец его не убирает, сдвиг пальца — не тап', () => {
  const p = open();
  const c = p.document.getElementById('c'), dot = p.document.getElementById('itemDot'), card = p.document.getElementById('itemCard');
  // what is under the finger: the wardrobe (no raycasts in Node)
  p.run(() => { hitAt = () => ({ object: wardGroup.children[0].children[0] }); });
  const title = p.run(() => infoOf(wardGroup.children[0].children[0]).title);
  const tap = (type, x1 = 120) => {
    c.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 200, button: 0, pointerType: type });
    c.dispatch('pointerup', { pointerId: 1, clientX: x1, clientY: 200, button: 0, pointerType: type });
    c.dispatch('pointerleave', { pointerId: 1, pointerType: type });
  };
  tap('mouse', 100); assert.strictEqual(dot.hidden, true, 'the mouse: the «i» comes when the cursor rests, not on a click');
  tap('touch', 100); assert.deepStrictEqual([dot.hidden, dot.title, dot.style.left, dot.style.top], [false, title, '110px', '170px']);
  p.tick(60); assert.strictEqual(dot.hidden, false, 'the finger lifted: the «i» stays');
  dot.click(); assert.deepStrictEqual([dot.hidden, card.hidden], [true, false]);
  tap('touch'); assert.deepStrictEqual([dot.hidden, card.hidden], [true, true], 'a drag: the card closes, no «i»');
  // the door under the finger: it opens, no «i»
  p.run(() => { hitAt = () => ({ object: doors[0].g }); });
  const t0 = p.run(() => doors[0].t);
  tap('touch', 100); assert.deepStrictEqual([dot.hidden, p.run(() => doors[0].t) !== t0], [true, true]);
});

check('люстра «Диски» (MyLight, Ozon): по центру потолка, Ø 600, низ в 535 от потолка, стекло с 185 (треть высоты — штанга); видна, пока стены целые; «Нет» убирает', () => {
  const p = open();
  const r = p.run(() => {
    const g = lampGroup.children[0], discs = [];
    g.children.forEach((pv) => pv.children.forEach((q) => q.children.forEach((m) => { if (m.userData.disc) discs.push([pv, q, m]); })));
    // each disc's lowest point and how far out it reaches (mm): its hanging point, the lean, its Ø along the tangent
    const ext = DISC_TIERS.map(({ r, d, t, b }) => [Math.round(t + d * Math.cos(b)), Math.round(Math.hypot(r, d / 2))]);
    return { at: [tt.mm(g.position.x), tt.mm(g.position.y), tt.mm(g.position.z)], kind: g.userData.lamp, n: discs.length,
      top: Math.min(...DISC_TIERS.map((T) => T.t)), low: Math.max(...ext.map((e) => e[0])), out: Math.max(...ext.map((e) => e[1])), vis: lampGroup.visible,
      on: document.querySelector('[data-lamp="discs"]').getAttribute('aria-pressed') };
  });
  assert.deepStrictEqual(r, { at: [1355, 3060, 2399], kind: 'discs', n: 56, top: 185, low: 535, out: 295, vis: true, on: 'true' }, 'Ø 590 + glass ≈ 600');
  assert.match(p.run(() => document.getElementById('pFacts').innerHTML), /Люстра MyLight, 8 плафонов: Ø 600, высота 535, низ в 2525 от пола/);
  p.document.querySelector('[data-lamp="none"]').click();
  assert.deepStrictEqual(p.run(() => [A.lamp, lampGroup.children.length, document.querySelector('[data-lamp="none"]').getAttribute('aria-pressed')]), ['none', 0, 'true']);
  assert.match(p.run(() => document.getElementById('pFacts').innerHTML), /<dt>Люстра<\/dt><dd>нет<\/dd>/);
  const w = runPage(PAGES.app, { parentWin: { appView: 'walk' } }); w.tick();
  w.run(() => setModel({ ...A, lamp: 'discs' }));
  assert.strictEqual(w.run(() => lampGroup.visible), true, 'in the walk');
  const wh = w.document.querySelector('[data-panel="walk"] [data-wh]'); wh.value = '50'; wh.dispatch('input'); w.tick();
  assert.strictEqual(w.run(() => lampGroup.visible), false, 'the walls cut lower: no ceiling to hang from');
});

check('люстра: карточка «i» — MyLight с Ozon, 8 232 ₽; размер, материал, лампы, место; ссылка на следующий вариант', () => {
  const p = open();
  const i = p.run(() => { const c = infoOf(lampGroup.children[0].children[5]);
    return { t: c.title, price: c.price, shop: c.shop, url: c.url, lines: c.lines, v: c.variant }; });
  assert.deepStrictEqual(i, { t: 'Люстра MyLight, 8 плафонов (Ozon)', price: 8232, shop: 'Ozon', url: 'https://ozon.ru/t/sZSVo8F', v: [1, 4],
    lines: [['Размер', 'Ø 60, высота 53,5 см'], ['Материал', 'стекло, металл'], ['Лампы', '8 × E14 до 60 Вт (480 Вт)'], ['Площадь', '25–30 м²'],
      ['Место', 'по центру потолка, низ в 2525 от пола'], 'Нажатие на люстру — следующий вариант.'] });
  const el = p.document.getElementById('itemCard'), next = () => el.children.find((c) => c.className === 'next');
  p.run(() => openItemCard(infoOf(lampGroup.children[0])));
  next().children[1].click();
  assert.deepStrictEqual([p.run(() => A.lamp), el.children[1].textContent, next().children[0].textContent,
    p.document.querySelector('[data-lamp="branches"]').getAttribute('aria-pressed')],
  ['branches', 'Люстра хрустальная Aine Light, 6 рожков (Wildberries)', '2/4', 'true']);
  next().children[1].click();
  assert.deepStrictEqual([p.run(() => A.lamp), el.children[1].textContent, next().children[0].textContent],
    ['branches80', 'Люстра хрустальная с висюльками (Ozon)', '3/4']);
  next().children[1].click();
  assert.deepStrictEqual([p.run(() => A.lamp), el.children[1].textContent, next().children[0].textContent], ['ervilen', 'Люстра ERVILEN, G9, 84 Вт (Ozon)', '4/4']);
  next().children[1].click();
  assert.strictEqual(p.run(() => A.lamp), 'discs', 'round again; «Нет» is not a variant');
});

check('люстра «Ветви» (Aine Light, Wildberries): втулка на 170, золотые ветви, на нитях белые и хрустальные диски; 500 × 450 (длинной стороной вдоль боковых стен), низ в 450 от потолка', () => {
  const p = open();
  p.document.querySelector('[data-lamp="branches"]').click();
  const r = p.run(() => { const g = lampGroup.children[0];
    return { kind: g.userData.lamp, ext: g.userData.ext.map(Math.round), discs: g.children.filter((m) => m.userData.discs).map((m) => m.userData.discs),
      mats: g.children.filter((m) => m.userData.discs).map((m) => m.material === lampWhite ? 'white' : m.material === lampCrystal ? 'crystal' : '?'),
      bulbs: g.children.filter((m) => m.material === lampBulb).length, wires: g.children.filter((m) => m.material === lampWire).length };
  });
  assert.deepStrictEqual(r, { kind: 'branches', ext: [222, 447, 246], discs: [411, 270], mats: ['white', 'crystal'], bulbs: 6, wires: 1 },
    'inside 225 × 450 × 250 (half the oval\'s sides), the same every time (seeded)');
  assert.match(p.run(() => document.getElementById('pFacts').innerHTML), /Люстра хрустальная Aine Light, 6 рожков: 500 × 450, высота 450, низ в 2610 от пола/);
  const i = p.run(() => { const c = infoOf(lampGroup.children[0].children[0]); return [c.price, c.shop, c.lines.map((l) => l[1])]; });
  assert.deepStrictEqual(i, [8051, 'Wildberries', ['50 × 45, высота 45 см', 'алюминий, стекло К9', '6 × E14 до 60 Вт (360 Вт)', 'до 35 м²', 'по центру потолка, низ в 2610 от пола', 'а']]);   // the last a paragraph: its [1] a letter
});

check('люстра: клик по ней — следующий вариант (по кругу, без «Нет»), курсор над ней — рука; тени люстры не отбрасывают', () => {
  const p = open();
  const click = () => p.run(() => clickAt({}, { object: lampGroup.children[0].children[3] }));
  assert.deepStrictEqual([click(), p.run(() => A.lamp), p.document.querySelector('[data-lamp="branches"]').getAttribute('aria-pressed')], [true, 'branches', 'true']);
  assert.deepStrictEqual([click(), p.run(() => A.lamp)], [true, 'branches80']);
  assert.deepStrictEqual([click(), p.run(() => A.lamp)], [true, 'ervilen']);
  assert.deepStrictEqual([click(), p.run(() => A.lamp)], [true, 'discs']);
  assert.strictEqual(p.run(() => typeof clickOf({ object: lampGroup.children[0].children[3] })), 'function');
  ['discs', 'branches', 'branches80', 'ervilen'].forEach((k) => {
    p.run((k) => setModel({ ...A, lamp: k }), k);
    const sh = p.run(() => { const all = []; const walk = (o) => { if (o.castShadow === true) all.push(o); (o.children || []).forEach(walk); }; walk(lampGroup); return all.length; });
    assert.strictEqual(sh, 0, k + ': nothing of it casts a shadow');
  });
});

check('розетка на «Комнате»: видна, пока камера ниже потолка («За диваном»), скрыта сверху', () => {
  const p = open();
  assert.strictEqual(p.run(() => roseGroup.visible), false, 'from above the ceiling');
  p.document.querySelector('[data-cam="sofa"]').click(); p.fly();
  assert.deepStrictEqual(p.run(() => [camera.position.y < H * MM, roseGroup.visible]), [true, true], 'at eye level');
  p.document.querySelector('[data-cam="top"]').click(); p.fly();
  assert.strictEqual(p.run(() => roseGroup.visible), false);
});

check('люстра «Ветви 80» (Ozon): как «Ветви 50», но Ø 800, на тросе 50 см — 830 от потолка (низ на 2230); в обходе над головой, а при низком потолке голова упирается, нагнувшись — проходишь', () => {
  const p = open();
  p.document.querySelector('[data-lamp="branches80"]').click();
  const r = p.run(() => { const g = lampGroup.children[0];
    return { kind: g.userData.lamp, ext: g.userData.ext.map(Math.round), discs: g.children.filter((m) => m.userData.discs).map((m) => m.userData.discs),
      bulbs: g.children.filter((m) => m.material === lampBulb).length, on: document.querySelector('[data-lamp="branches80"]').getAttribute('aria-pressed') };
  });
  assert.deepStrictEqual(r, { kind: 'branches80', ext: [396, 830, 391], discs: [489, 282], bulbs: 8, on: 'true' }, 'inside 400 × 830 × 400');
  assert.match(p.run(() => document.getElementById('pFacts').innerHTML), /Люстра хрустальная с висюльками: Ø 800, высота 830, низ в 2230 от пола/);
  const i = p.run(() => { const c = infoOf(lampGroup.children[0].children[0]); return [c.price, c.shop, c.url, c.lines.slice(0, 3)]; });
  assert.deepStrictEqual(i, [12234, 'Ozon', 'https://ozon.ru/t/Z2pmmdJ',
    [['Размер', 'Ø 80, высота 83 см'], ['Трос', '50 см (регулируется до 1 м)'], ['Место', 'по центру потолка, низ в 2230 от пола']]]);
  // toward it from 600 off its axis, 400 a step: high over the head it is passed under; with the ceiling at 2400 (its bottom at 1570)
  // the head (to 1750) stops at its edge, crouched (to 1200) it goes under
  const go = (hi) => p.run((hi) => tt.mm(walkSlide((A.W / 2 - 600) * MM, A.L / 2 * MM, .4, 0, .3, hi)[0]), hi);
  assert.strictEqual(go(1.75), 1155);
  p.run(() => setModel({ ...A, H: 2400 }));
  assert.deepStrictEqual([go(1.75), go(1.2)], [809, 1155], 'its oval 396 out from the axis (1355): 959 less the body 150');
});

check('люстра «Шары» (ERVILEN, Ozon): 900 × 900, тело 300 на штанге 300 — от 175 до 475 от потолка; 12 шаров на ветвях, 26 белых дисков', () => {
  const p = open();
  p.document.querySelector('[data-lamp="ervilen"]').click();
  const r = p.run(() => { const g = lampGroup.children[0], gl = g.children.filter((m) => m.userData.globe);
    return { kind: g.userData.lamp, ext: g.userData.ext.map(Math.round), globes: gl.length, glass: gl.every((m) => m.material === lampOpal),
      discs: g.children.filter((m) => m.userData.disc).length, high: Math.min(...gl.map((m) => tt.mm(-m.position.y) - 60)),
      on: document.querySelector('[data-lamp="ervilen"]').getAttribute('aria-pressed') };
  });
  assert.deepStrictEqual(r, { kind: 'ervilen', ext: [407, 472, 425], globes: 12, glass: true, discs: 26, high: 179, on: 'true' }, 'inside 450 × 475 × 450');
  assert.match(p.run(() => document.getElementById('pFacts').innerHTML), /Люстра ERVILEN, G9, 84 Вт: 900 × 900, высота 475, низ в 2585 от пола/);
  const i = p.run(() => { const c = infoOf(lampGroup.children[0].children[0]); return [c.price, c.shop, c.url, c.lines.slice(0, 4)]; });
  assert.deepStrictEqual(i, [7547, 'Ozon', 'https://ozon.ru/t/1NEcBba',
    [['Размер', '90 × 90, высота 30 см'], ['Штанга', '30 см'], ['Лампы', 'G9, 84 Вт'], ['Место', 'по центру потолка, низ в 2585 от пола']]]);
});

