// Санузел: стены ниши, детали, шкафы и сантехника, отделка, фасады, рамка, размеры с плана.
const { round, matches, runPage, DECOR_PARENT, PAGES, check, slide, fnSource, vec, piece, near, bathWalls, fixture, assert } = require('./harness');

check('санузел: стены ниши, обрезанные рамкой, как в старой вкладке', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  assert.strictEqual(p.run('view'), 'bath');
  // the bath tab (origin −2000, 0): back wall 200 from the left wall's outer face to the partition's outer face (W + 100);
  // left wall 200; partition 100 × 600 next to the tall cabinet; wall 500 × 100 at the niche end; shower partition 300 past it;
  // riser box 250 × 250. The partition hides right of its face, the walls at the niche end past it, as in the bath tab
  assert.deepStrictEqual(p.run(bathWalls), [
    { id: 'entry', r: [-2200, -700, -200, 0], fade: '-z' },
    { id: 'leftOuter', r: [-2200, -2000, 0, 1400], fade: '-x' },
    { id: 'bathStub', r: [-800, -700, 0, 600], fade: '+x' },
    { id: 'nicheEnd', r: [-2000, -1500, 1100, 1200], fade: '+z' },
    { id: 'shower', r: [-1000, -900, 1100, 1400], fade: '+z' },
    { id: 'riser', r: [-2000, -1750, 0, 250], fade: null },
  ]);
  assert.deepStrictEqual(p.run('doors.map(d=>d.g.visible)'), [false, false], 'no doors in the niche');
  const bp = p.document.querySelector('[data-panel="bath"]'), bq = (s) => bp.querySelector(s);
  assert.strictEqual(bp.hidden, false);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="bath"] #shared'), 'light and wall colour moved to the bathroom');
  assert.strictEqual(bq('#bFrameLOut').textContent, 1400);
  assert.strictEqual(bq('#bSub').textContent, 'ниша 1200 × 1100 мм · потолок 2600 мм · корпус — Диамант серый U963 ST9; фасады — Базовый коричневый декор');
  // camera: «3/4» on the first visit, the bath tab's targets moved to the bathroom's place; the sun over the back wall
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.4, 1.3, 0.55]);
  bq('[data-cam="tall"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.275, 1.3, 0.15]);
  assert.deepStrictEqual([...vec(p, 'VIEWS.bath.sun()'), p.run('sunHalf')], [-1.4, 1.3, 0, 3]);
});

check('санузел: детали шкафов совпадают со старым санузлом', () => {
  const mod = PAGES.app.slice(PAGES.app.indexOf('«Санузел» view'));
  const pLine = mod.match(/^const P=\{W:1200,H:2600,.*\};$/m)[0];
  const got = new Function(`let T=16, TF=16; const HDF=4, G=2;\n${pLine}\n${fnSource(mod, 'computeParts')}\nT=P.T||16;TF=P.TF||16;return computeParts(P);`)();
  const want = fixture('bath-parts.json');
  assert.strictEqual(got.parts.length, 34);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(got)), want);
});

check('санузел: шкафы, инсталляция и унитаз собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const want = fixture('bath-parts.json');
  const nDoors = want.parts.filter((x) => x.mat === 'front' && (x.hinge || x.pivot)).length;
  // the installation box, its flush plate, the bowl and the seat: the last group of the bathroom
  const b = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, sani:f.sani.children.map(m=>m.position.y), P:f.P}))(VIEWS.bath.furniture())');
  let r = b();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors, 34, true], 'built on screen, every door on a hinge');
  assert.strictEqual(nDoors, 6, 'four tall cabinet doors, two upper cabinet doors');
  assert.deepStrictEqual(r.sani.map((y) => round(y, 4)), [0.6, 1.0025, 0.22, 0.41]);
  // the panel: sizes, the niche and the ceiling from the plan, what is between the shelves
  assert.strictEqual(bq('[data-p-out="Hi"]').textContent, '1200 мм');
  assert.deepStrictEqual(['#b-W', '#b-L', '#b-H', '#b-R'].map((s) => bq(s).textContent), ['1200 мм', '1100 мм', '2600 мм', '250 × 250 мм']);
  assert.strictEqual(bq('#b-gapB').textContent, 'Высота дверей 1120 мм · между полками 349,3 мм');
  assert.strictEqual(bq('#b-gapM').textContent, 'Высота ниши 300 мм · внутри 268 мм');
  // a higher installation: the box and the bowl's flush plate go up with it
  const hi = bq('[data-p="Hi"]'); hi.value = '1300'; hi.dispatch('input');
  r = b(); assert.deepStrictEqual([r.P.Hi, round(r.sani[0], 3)], [1300, 0.65]);
  // the tall cabinet is never wider than the niche past the riser box
  const wc = bq('[data-p="Wc"]'); wc.value = '1400'; wc.dispatch('input');
  assert.strictEqual(b().P.Wc, 950); assert.strictEqual(wc.value, 950);
  // no niche over the installation: its boards go, its depth is off; feet under the tall cabinet
  const mid = bq('#b-tMid'); mid.checked = false; mid.dispatch('change');
  r = b(); assert.ok(!r.parts.includes('Бок ниши над инсталляцией')); assert.strictEqual(bq('#b-Dm').disabled, true);
  const feet = bq('#b-tFeet'); feet.checked = true; feet.dispatch('change');
  r = b(); assert.deepStrictEqual([r.P.Feet, r.feet], [true, 6]);
  bq('[data-thick="18"][data-for="T"]').click();
  assert.strictEqual(b().P.T, 18);
});

check('санузел: отделка — палитра, меню образца «корпус / фасады», свой цвет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bp = p.document.querySelector('[data-panel="bath"]'), bq = (s) => bp.querySelector(s), sub = () => bq('#bSub').textContent;
  assert.strictEqual(bp.querySelectorAll('[data-decor]').length, DECOR_PARENT.PALETTE_WOOD.length);
  assert.strictEqual(bp.querySelectorAll('[data-uc]').length, DECOR_PARENT.PALETTE_UNI.length);
  assert.ok(matches(bq('#b-ccCard'), '[aria-label="Монотонные декоры"] .cc'), 'own colour card stays with the plain colours');
  // the bath tab's finishes: grey carcass, brown wood fronts
  const tags = (s) => bq(s).querySelector('.tags').innerHTML;
  assert.strictEqual(tags('[data-decor="H1386"]'), '<b>Ф</b>');
  assert.match(bq('#b-finNow').innerHTML, /^<span>Корпус<\/span><span>Диамант серый U963 ST9<\/span><span>Фасады<\/span><span>Базовый коричневый декор<\/span>$/);
  // a click paints the whole cabinet
  bq('[data-decor="H1180"]').click();
  assert.match(sub(), /потолок 2600 мм · Дуб Галифакс натуральный H1180 ST37$/);
  // the swatch menu offers only what the bathroom has: the carcass and the fronts
  const ctx = p.document.getElementById('ctx');
  bq('[data-uc="#F1F0EA"]').dispatch('contextmenu', { clientX: 100, clientY: 100 });
  assert.deepStrictEqual(ctx.querySelectorAll('[data-where]').filter((b) => !b.hidden).map((b) => b.dataset.where), ['carcass', 'front']);
  ctx.querySelector('[data-where="front"]').click();
  assert.match(sub(), /корпус — Дуб Галифакс натуральный H1180 ST37; фасады — Белый премиум W1000 ST9$/);
  // own colour for the whole cabinet; contrast of the end faces
  const cc = bq('#b-uniColor'); cc.click(); cc.value = '#123456'; cc.dispatch('input');
  assert.match(sub(), /мм · Свой цвет #123456$/);
  assert.strictEqual(bq('#b-ccCode').textContent, '#123456');
  const ec = bq('#b-Ec'); ec.value = '60'; ec.dispatch('input');
  assert.deepStrictEqual([bq('#b-oEc').textContent, p.run('VIEWS.bath.furniture().P.Ec')], ['60%', 60]);
});

check('санузел: фасады, размеры, деталировка, настройки по умолчанию', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  let bp = p.document.querySelector('[data-panel="bath"]');
  const bq = (s) => bp.querySelector(s);
  const pressed = () => bp.querySelectorAll('[data-door]').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.door);
  // the bath tab's 13 dimension lines (a line and a label each), hidden in a flight
  assert.strictEqual(p.run('VIEWS.bath.furniture().dims.children.length'), 26);
  assert.strictEqual(bq('#b-sizesBox').open, true, 'the sizes are open, as in the bath tab');
  assert.deepStrictEqual(pressed(), ['closed']);
  bq('[data-door="open"]').click();
  assert.strictEqual(p.run('VIEWS.bath.furniture().doors.every(d=>d.t===d.max)'), true);
  // one door closed by hand: nothing pressed, the remembered mode stays
  p.run('(VIEWS.bath.furniture().doors[0].t=0, doorsChanged())');
  assert.deepStrictEqual(pressed(), []); assert.strictEqual(p.run('VS.bath.fronts'), 'open');
  bq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  // the walls toggle takes the walls, the installation and the toilet away
  const walls = bq('#b-tWall'); walls.checked = false; walls.dispatch('change'); p.tick();
  assert.deepStrictEqual(p.run('[wallGroup.visible, VS.bath.walls]'), [false, false]);
  const dims = bq('#b-tDims'); dims.checked = false; dims.dispatch('change');
  assert.deepStrictEqual(p.run('[VS.bath.fronts, VS.bath.dims]'), ['hidden', false]);
  // cut list: every part, grouped by material; the same as CSV
  assert.match(bq('#b-tot').innerHTML, /^<span>34 детали?<\/span>|^<span>34 деталей<\/span>/);
  const csv = bq('#b-csv').value.split('\n');
  assert.strictEqual(csv[0], 'Деталь;Материал;Длина;Ширина;Толщина;Кол-во');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 34);
  assert.strictEqual(bq('#b-cut').querySelectorAll('th.mh').length, 2, 'carcass and fronts');
  // feet are listed under the parts
  const feet = bq('#b-tFeet'); feet.checked = true; feet.dispatch('change');
  assert.match(bq('#b-tot').innerHTML, /Опоры регулируемые М6, шайба Ø15×5: 6 шт/);
  // remembered: cabinets and finishes, without the niche, the ceiling and the riser box
  const hi = bq('[data-p="Hi"]'); hi.value = '1300'; hi.dispatch('input');
  bq('[data-decor="H3154"]').click();
  bq('#b-saveDef').click();
  const saved = JSON.parse(storage.get('apt-bath-v2'));
  assert.deepStrictEqual([saved.P.Hi, saved.P.Feet, ['W', 'L', 'H', 'Rx', 'Rz', 'Lt'].some((k) => k in saved.P), saved.FIN.front.decor], [1300, true, false, 'H3154']);
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  bp = p.document.querySelector('[data-panel="bath"]');
  assert.deepStrictEqual(p.run('(f=>[f.P.Hi,f.P.Feet,f.P.W])(VIEWS.bath.furniture())'), [1300, true, 1200]);
  assert.match(bq('#bSub').textContent, /Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  bq('#b-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.Hi,f.P.Feet])(VIEWS.bath.furniture())'), [1200, false]);
  assert.strictEqual(bq('#b-tFeet').checked, false);
  assert.ok(!storage.has('apt-bath-v2'));
  assert.match(bq('#bSub').textContent, /корпус — Диамант серый U963 ST9; фасады — Базовый коричневый декор$/);
});

check('санузел: без «Шкафов» на плане — только в своей вкладке, поднимаются из пола, следуют «Планировке»', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  assert.strictEqual(p.run('VIEWS.bath.furniture().model'), null, 'not built while the bathroom is not in the scene');
  p.run('showView("bath")'); p.tick(25, 17);
  const m = p.run('(f=>({y:f.model.position.y, s:presence("bath")}))(VIEWS.bath.furniture())');
  near(m.s, 0.5, 'halfway'); near(m.y, -1.35, 'halfway up out of the floor');
  p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.model.visible, f.model.position.y])(VIEWS.bath.furniture())'), [true, 0]);
  p.run('showView("plan")'); p.fly();
  assert.strictEqual(p.run('VIEWS.bath.furniture().model.visible'), false, 'hidden on the plan');
  p.run('setModel({bL:1200, H:2700})'); p.tick();
  p.run('showView("bath")'); p.fly();
  // the installation fills the rest of the left wall: 1200 − 300 = 900
  assert.deepStrictEqual(p.run('(f=>[f.P.L, f.P.H, f.P.Lt])(VIEWS.bath.furniture())'), [1200, 2700, 900]);
  assert.strictEqual(p.document.getElementById('b-H').textContent, '2700 мм');
});

check('санузел: рамка левой стены, размеры с «Планировки», перелёт', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const fl = bq('#bFrameL');
  fl.value = '1900'; fl.dispatch('input');
  // up to the kitchen wall: the whole shower partition, a piece of the vent shaft wall
  const w = p.run(bathWalls);
  assert.deepStrictEqual(w.find((x) => x.id === 'leftOuter').r, [-2200, -2000, 0, 1900]);
  assert.deepStrictEqual(w.find((x) => x.id === 'shower').r, [-1000, -900, 1100, 1900]);
  assert.deepStrictEqual(w.find((x) => x.id === 'shaft').r, [-900, -700, 1400, 1500]);
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-bath-v1')), { Wm: 'auto', Wh: 100, L: 1900, sizes: true, fronts: 'closed', dims: true, walls: true });
  // the plan makes the niche wider: the frame, the partition, the cabinets and the panel follow
  p.run('setModel({bNiche:1300})'); p.tick();
  assert.deepStrictEqual(p.run(bathWalls).find((x) => x.id === 'bathStub').r, [-700, -600, 0, 600]);
  assert.deepStrictEqual(p.run(bathWalls)[0].r, [-2200, -600, -200, 0]);
  assert.strictEqual(p.run('VIEWS.bath.furniture().P.W'), 1300);
  assert.match(bq('#bSub').textContent, /^ниша 1300 × 1100 мм/);
  // a flight to the plan and back
  p.run('showView("plan")'); assert.strictEqual(p.run('inTransition()'), true); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['plan', 12]);
  p.run('showView("bath")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['bath', 7]);
});

check('санузел: ширина пенала и отступ над инсталляцией возвращаются вслед за нишей и потолком', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const P = () => p.run('(f=>[f.P.Wc,f.P.Gap])(VIEWS.bath.furniture())');
  // a narrower niche on the plan cuts the tall cabinet; back to its width, the cabinet is as it was
  slide(p, 'bNiche', 700); p.tick();
  assert.strictEqual(P()[0], 450);
  slide(p, 'bNiche', 1200); p.tick();
  assert.strictEqual(P()[0], 800);
  // a higher installation leaves the upper cabinet its 200 mm: the gap gives way and comes back
  const gap = bq('[data-p="Gap"]'); gap.value = '800'; gap.dispatch('input');
  const hi = bq('[data-p="Hi"]'); hi.value = '1500'; hi.dispatch('input');
  assert.strictEqual(P()[1], 800);
  slide(p, 'H', 2400); p.tick();
  assert.strictEqual(P()[1], 700);
  slide(p, 'H', 2600); p.tick();
  assert.strictEqual(P()[1], 800);
  // the saved settings keep the sizes as chosen
  slide(p, 'bNiche', 700); slide(p, 'H', 2400); p.tick();
  bq('#b-saveDef').click();
  assert.deepStrictEqual((s => [s.P.Wc, s.P.Gap])(JSON.parse(storage.get('apt-bath-v2'))), [800, 800]);
});
