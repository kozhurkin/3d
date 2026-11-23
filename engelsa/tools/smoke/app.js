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
  const r = p.run(() => wallParts.filter((w) => w.trim && w.kind !== 'rope').map((w) => [w.id, tt.mm(w.b), tt.mm(w.t), w.box]));
  assert.deepStrictEqual(r, [
    ['door', 2950, 3060, [0, 2710, 0, 30]], ['door', 0, 70, [0, 200, 0, 16]], ['door', 0, 70, [1140, 2710, 0, 16]],
    ['right', 2950, 3060, [2680, 2710, 0, 4797]], ['right', 0, 70, [2694, 2710, 0, 4797]],
    ['left', 2950, 3060, [0, 30, 0, 4797]], ['left', 0, 70, [0, 16, 0, 4797]],
    ['window', 2950, 3060, [0, 2710, 4767, 4797]], ['window', 0, 70, [0, 2710, 4781, 4797]]]);
  // «Контуры»: the walls are see-through, the trims go with them
  p.document.querySelector('[data-panel="plan"] [data-wm="edges"]').click(); p.tick();
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
  const wh = p.document.querySelector('[data-panel="plan"] [data-wh]'); wh.value = '50'; wh.dispatch('input'); p.tick();
  near(get()[0].rep[1], (1530 - 70) / 2700, 'the share of the picture left');
  const btn = (v) => p.document.querySelector(`[data-panel="plan"] [data-mural="${v}"]`);
  btn('left').click();
  assert.deepStrictEqual(get().map((w) => [w.id, w.box]), [['left', [0, 1, 0, 4797]]]);
  btn('both').click();
  assert.deepStrictEqual(get().map((w) => [w.id, w.box]), [['right', [2709, 2710, 0, 4797]], ['left', [0, 1, 0, 4797]]], 'both long walls');
  assert.strictEqual(btn('both').getAttribute('aria-pressed'), 'true');
  assert.strictEqual(p.document.querySelector('[data-panel="plan"] [data-mural=""]'), null, 'no «Нет»');
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

check('плетёнка 11 × 6 по периметру сразу над фотообоями, у окна прервана; обои до её низа, выше до лепнины стена белая, как она', () => {
  const p = open();
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

check('шкаф: кнопкой в панели — к стене с дверью, в правый угол, и обратно; клик по нему самому его не двигает', () => {
  const p = open();
  const at = () => p.run(() => [A.wardWall, wardrobeBoxes()[0].map((v) => tt.mm(v)), document.querySelector('[data-ward="door"]').getAttribute('aria-pressed')]);
  assert.strictEqual(p.run(() => wardGroup.children[0].userData.click), undefined, 'no click of its own');
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

check('диван MANSTAD: у стены справа от входа спинкой к плинтусу, кушеткой к окну в 100 от его стены; кнопкой — зеркально у стены слева', () => {
  const p = open();
  const r = () => p.run(() => sofaBoxes().map((b) => b.map((v) => tt.mm(v))));
  assert.deepStrictEqual(r(), [[16, 966, 2297, 4697, 0, 900], [16, 1576, 3797, 4697, 0, 450]],
    'its back at the skirting board, its end 100 off the window wall; the main part 950 deep; the chaise 900 wide, 1560 out');
  assert.strictEqual(p.run(() => velour.map === undefined ? 'none' : 'map'), 'map');
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
