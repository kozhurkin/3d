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
  const b = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, sani:f.sani.children.filter(m=>m.userData.wash!==true).map(m=>m.position.y), P:f.P}))(VIEWS.bath.furniture())');
  let r = b();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors + 3, 34, true], 'built on screen, every door on a hinge, and the washing machine\'s and the two of the cabinet over the sink');
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

check('санузел: стиральная машина и раковина над ней в нише справа от входа', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const shown = () => p.run('(g=>g?g.visible:"none")(VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true))');
  const box = () => p.run('(b=>[b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z].map(v=>Math.round(v*1000)))(new THREE.Box3().setFromObject(VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true)))');
  // the bath tab's frame ends at the partition next to the tall cabinet: its own view hides them
  assert.strictEqual(shown(), false, 'built with the sanitary ware, hidden in the bathroom view');
  // between the partition (−700) and the hall wall (−100), from the back wall up to the machine's door (640), up to the lamp on the cabinet over the sink
  const b = box();
  assert.deepStrictEqual([b[0], b[1], b[4], b[5]], [-700, -100, 0, 640]);
  assert.strictEqual(b[3], 2055);
  // the machine 595 × 850 × 540, 40 mm off the back wall, in the middle of the niche (x 1302.5…1897.5 → −697.5…−102.5 on the plan,
  // its front panel with the opening is not in the stub's box, the drawer is: 6 mm out to 586): hollow, a drum inside (cuff, drum, front ring, back)
  const mc = 'VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true).children.find(m=>m.userData.machine===true)';
  assert.deepStrictEqual(p.run(`(b=>[b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z].map(v=>Math.round(v*10000)))(new THREE.Box3().setFromObject(${mc}))`), [-6975, -1025, 0, 8500, 400, 5860]);
  assert.strictEqual(p.run(`${mc}.children.filter(m=>m.userData.drum===true).length`), 4);
  // the drum Ø470 × 340 behind a 40 mm cuff, its axis through the door's centre (440 up)
  assert.deepStrictEqual(p.run(`(m=>[m.geometry.args[0]*2,m.geometry.args[2],m.position.y,m.position.z].map(v=>Math.round(v*1000)))(${mc}.children.filter(m=>m.userData.drum===true)[1])`), [470, 340, 440, 358]);
  // the sink's bottom: 600 × 600 from the back wall, 30 mm over the machine
  const sink = p.run('(g=>{const c=g.children[2];return [c.geometry.args,c.position.y,c.position.z].flat().map(v=>Math.round(v*1000));})(VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true))');
  assert.deepStrictEqual(sink, [600, 20, 600, 890, 300]);
  // on the plan it shows
  p.run('showView("plan")'); p.tick();
  assert.strictEqual(shown(), true, 'shown on the plan');
});

check('санузел: дверца стиральной машины открывается в ту сторону, по которой кликнули', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const D = `VIEWS.bath.furniture().doors.find(d=>d.key==='washer')`;
  const st = () => p.run(`(d=>[d.side,d.s,Math.round(d.g.position.x*1000),Math.round(d.max*1000),d.g.children[0].children[0].userData.ring===true,Math.round(d.g.children[0].children[1].geometry.args[0]*2000)])(${D})`);
  const run = (n) => { for (let i = 0; i < n; i++) p.tick(); };
  // a click as pickDoor makes it: the point it hit (the door's middle is at x −400 on the plan), then open or closed
  const click = (x) => { p.run(`(d=>{if(${x}!==null)d.hit={x:${x}};d.t=d.t!==0?0:d.max;})(${D})`); run(2); };
  const shut = () => { p.run(`(d=>{d.t=0;})(${D})`); run(200); };
  // Ø480 door (a ring, the Ø330 glass in its middle); the hinge 12 mm past its edge: x 1600 ∓ 252. The niche's walls stop it at 90° (48 mm to each wall, its 50 mm bulge)
  assert.deepStrictEqual(st(), [-1, -1, 1348, 1571, true, 330], 'closed, on the left hinge');
  click(-0.3); run(80);
  assert.deepStrictEqual(st().slice(0, 3), [1, 1, 1852], 'clicked right of its middle: opens to the right');
  assert.ok(p.run(`${D}.a`) > 1.5, 'swung open');
  shut(); click(-0.3);
  assert.strictEqual(st()[0], 1, 'right again');
  shut(); click(-0.5);
  assert.deepStrictEqual(st().slice(0, 3), [-1, -1, 1348], 'clicked left: to the left');
  // not closed yet: a click on the other half closes it on the same hinge
  click(-0.3); run(5); click(-0.3);
  assert.strictEqual(st()[0], -1, 'not closed all the way: the same hinge');
  // opened with no click («Открыты»): the side it had
  shut(); click(null);
  assert.strictEqual(st()[0], -1);
  // «Открыты» in the bathroom panel opens it to its stop, and the panel sees every front open
  p.run(`(d=>{d.t=0;})(${D})`); run(200);
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  bq('[data-door="open"]').click(); run(2);
  assert.strictEqual(p.run(`${D}.t`), p.run(`${D}.max`));
  assert.strictEqual(bq('[data-door="open"]').getAttribute('aria-pressed'), 'true');
});

check('санузел: шкафчик над раковиной — отдельное изделие с зеркальными дверцами', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const W = 'VIEWS.bath.furniture()', cab = `${W}.sani.children.find(m=>m.userData.wash===true).children.slice(-1)[0]`;
  // its boards: 600 wide (the niche), 200 deep with the doors, 300 over the sink (1000): from 1300 to 2000, two shelves; not in the bathroom's parts
  const parts = p.run(`${cab}.children.map(o=>(o.userData.part&&o.userData.part.name?o.userData.part:o.children[0].userData.part)).map(q=>[q.name,q.x0,q.x1,q.y0,q.y1,q.z0,q.z1])`);
  assert.strictEqual(parts.length, 10);
  assert.deepStrictEqual(parts[0], ['Бок шкафчика над раковиной', 1300, 1316, 1300, 2000, 0, 184]);
  assert.strictEqual(parts.filter((q) => q[0] === 'Полка шкафчика над раковиной').length, 2);
  assert.deepStrictEqual(parts.filter((q) => q[0] === 'Фасад шкафчика над раковиной').map((q) => q.slice(1)), [[1301, 1599, 1301, 1999, 184, 200], [1601, 1899, 1301, 1999, 184, 200]]);
  assert.ok(!p.run(`${W}.current.parts.some(q=>/раковин/.test(q.name))`), 'not in the bathroom cut list');
  assert.ok(!/раковин/.test(p.document.querySelector('[data-panel="bath"]').querySelector('#b-csv').value));
  // a mirror on each door, in front of its face, edge to edge; the doors are the room's: a click opens them
  const doors = `${W}.doors.filter(d=>d.g.children[0].userData.part.name==='Фасад шкафчика над раковиной')`;
  assert.deepStrictEqual(p.run(`${doors}.map(d=>{const m=d.g.children.find(c=>c.userData.mirror===true);return [m.geometry.args,m.position.z+d.g.position.z].flat().map(v=>Math.round(v*1000));})`), [[298, 698, 4, 202], [298, 698, 4, 202]]);
  p.run(`${doors}.forEach(d=>{d.t=d.max;})`); for (let i = 0; i < 60; i++) p.tick();
  assert.ok(p.run(`${doors}.every(d=>d.a>1)`), 'they swing open with the room\'s doors');
  // a lamp on its top (2000): a bracket, the bar 450 × 25 × 25 mm 45 mm past the mirrors and 30 mm over the top, its glowing underside
  const lamp = p.run(`${W}.sani.children.find(m=>m.userData.wash===true).children.filter(m=>['body','glow'].includes(m.userData.lamp)).map(m=>[m.geometry.args,m.position.y-m.geometry.args[1]/2,m.position.z-m.geometry.args[2]/2,m.userData.lamp==='glow'].flat().map(v=>typeof v==='boolean'?v:Math.round(v*1000)))`);
  assert.deepStrictEqual(lamp.map((m) => m[5]), [false, false, true]);
  assert.strictEqual(lamp[0][3], 2000, 'the bracket on the top');
  assert.deepStrictEqual(lamp[1], [450, 25, 25, 2030, 245, false]);
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
  // the bath tab's 13 dimension lines and three between the shelves (a line and a label each), hidden in a flight
  assert.strictEqual(p.run('VIEWS.bath.furniture().dims.children.length'), 32);
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

check('санузел: размер между полками — один на отделение, в целых мм, за дверцами и корпусом не виден', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const gaps = () => p.run('VIEWS.bath.furniture().dims.userData.gaps');
  // the tall cabinet below the divider, above it, the upper cabinet: between two shelves in the middle
  assert.deepStrictEqual(gaps(), ['349', '328', '345']);
  // the room's dimensions are seen through everything, the ones between the shelves only where nothing covers them
  assert.deepStrictEqual(p.run('(d=>d.children.map(o=>o.material.depthTest===true))(VIEWS.bath.furniture().dims)'), [...Array(26).fill(false), ...Array(6).fill(true)]);
  const set = (k, v) => { const s = bq(`[data-p="${k}"]`); s.value = String(v); s.dispatch('input'); };
  // each in the middle of the width and depth its boards share (bath mm): the tall cabinet across x, the upper one (along the left wall) across z
  const at = p.run('VIEWS.bath.furniture().dims.children.slice(26).filter((o,i)=>i%2).map(s=>[s.position.x,s.position.y,s.position.z].map(v=>Math.round(v/MM)))');
  assert.deepStrictEqual(at, [[800, 644, 140], [800, 1724, 140], [95, 2050, 700]]);
  set('Nb', 0); set('Nu', 0);
  assert.deepStrictEqual(gaps(), ['328'], 'only the section that has shelves');
  set('Nh', 0);
  assert.deepStrictEqual(gaps(), []);
});
