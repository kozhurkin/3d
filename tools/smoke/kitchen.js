// Кухня: стены, детали, шкафы и техника, отделка, фасады, деталировка, настройки.
const { all, matches, runPage, DECOR_PARENT, PAGES, check, slide, fnSource, kitchenWalls, vec, fixture, assert } = require('./harness');

check('кухня: стены кухни, обрезанные рамкой, как в старой вкладке', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  assert.strictEqual(p.run('view'), 'kitchen');
  // the kitchen tab: kitchen wall 2200 × 100 behind x 0..W; left wall 200 thick from the back of the kitchen wall to L = 1350
  assert.deepStrictEqual(p.run(kitchenWalls), [
    { id: 'leftOuter', r: [-2200, -2000, 1900, 3350], fade: '-x' },
    { id: 'kitchen', r: [-2000, 200, 1900, 2000], fade: '-z' },
  ]);
  assert.deepStrictEqual(p.run('[wallParts.length, doors.map(d=>d.g.visible)]'), [2, [false, false]], 'two wall pieces, no doors, no window');
  const kp = p.document.querySelector('[data-panel="kitchen"]');
  assert.strictEqual(kp.hidden, false); assert.strictEqual(p.document.querySelector('[data-panel="plan"]').hidden, true);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="kitchen"] #shared'), 'light and wall colour moved to the kitchen');
  assert.strictEqual(kp.querySelector('#kFrameLOut').textContent, 1350);
  // camera: «3/4» on the first visit, the kitchen tab's targets moved to the kitchen's place on the plan (origin −2000, 2000)
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.15, 1.3, 2.45]); assert.deepStrictEqual(vec(p, 'cam.target'), [-1.15, 1.3, 2.45]);
  kp.querySelector('[data-cam="sink"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.775, 0.9, 2.3]);
});

check('кухня: рамка левой стены, переходы и размеры с «Планировки»', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  const fl = p.document.getElementById('kFrameL');
  fl.value = '2000'; fl.dispatch('input');
  assert.deepStrictEqual(p.run(kitchenWalls)[0].r, [-2200, -2000, 1900, 4000]);
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-kitchen-v1')), { Wm: 'auto', Wh: 100, L: 2000, sizes: true, fronts: 'closed', dims: true, walls: true });
  fl.value = '9000'; fl.dispatch('input');   // no further than the window wall, which stays out of the kitchen view
  assert.deepStrictEqual(p.run(kitchenWalls).map((w) => w.r[3]), [6750, 2000]);
  // to the plan and back: all walls and doors there, the kitchen camera where it was left
  p.document.querySelector('[data-cam="sink"]').click();
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length, doors.map(d=>d.g.visible)]'), ['plan', 12, [true, true]]);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="plan"] #shared'));
  // a size changed on the plan reaches the kitchen
  slide(p, 'kW', 2300);
  p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.875, 0.9, 2.3], 'sink target, kitchen moved 100 left');
  assert.deepStrictEqual(p.run(kitchenWalls).map((w) => w.r), [[-2300, -2100, 1900, 6750], [-2100, 200, 1900, 2000]]);
  assert.match(p.document.getElementById('kSub').textContent, /стена 2300/);
});

check('кухня: детали шкафов совпадают со старой кухней', () => {
  const pLine = PAGES.app.match(/^const P=\{W:2200,H:2600,.*\};$/m)[0];
  const got = new Function(`let T=16, TF=16; const HDF=4, G=2;\n${pLine}\n${fnSource(PAGES.app, 'computeParts')}\nT=P.T||16;TF=P.TF||16;return computeParts(P);`)();
  const want = fixture('kitchen-parts.json');
  assert.strictEqual(got.parts.length, want.parts.length);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(got)), want);
});

check('кухня: шкафы и техника собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kp = p.document.querySelector('[data-panel="kitchen"]'), kq = (s) => kp.querySelector(s);
  const want = fixture('kitchen-parts.json');
  const nDoors = want.parts.filter((x) => x.mat === 'front' && (x.hinge || x.pivot)).length;
  const k = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.length, visible:f.model&&f.model.visible, P:f.P}))(VIEWS.kitchen.furniture())');
  let r = k();
  assert.deepStrictEqual([r.doors, r.parts, r.visible], [nDoors + 16, want.parts.length, true], 'built on screen with every front on a hinge');
  // the panel: sizes, the wall and ceiling from the plan, finishes in the subtitle, what is left free
  assert.strictEqual(kq('[data-p-out="B1"]').textContent, '450 мм');
  assert.strictEqual(kq('#k-W').textContent, '2200 мм'); assert.strictEqual(kq('#k-H').textContent, '2600 мм');
  assert.match(kq('#kSub').textContent, /корпус — Белый премиум W1000 ST9; фасады — Серый кашемир U702 ST9; столешница — Дуб Каселла натуральный H1385 ST40/);
  assert.match(kq('#k-gapBase').textContent, /справа свободно 100 мм/);
  assert.strictEqual(kq('#k-runOver').hidden, true);
  // a wider sink cabinet: the fridge niche stays, the run is longer than the wall and the panel says so
  const b1 = kq('[data-p="B1"]'); b1.value = '600'; b1.dispatch('input');
  r = k(); assert.deepStrictEqual([r.P.B1, r.P.Fr], [600, 600]);
  assert.deepStrictEqual([kq('#k-runOver').hidden, kq('#k-runOver').textContent], [false, 'Тумбы и ниша холодильника длиннее стены на 50 мм']);
  // no dishwasher: its front goes, a middle cabinet with a door and a shelf comes
  const dish = kq('#k-tDish'); dish.checked = false; dish.dispatch('change');
  r = p.run('VIEWS.kitchen.furniture().current.parts.map(x=>x.name)');
  assert.ok(!r.includes('Фасад посудомоечной машины') && r.includes('Полка нижнего шкафа — средний'));
  kq('[data-hob="free"]').click(); kq('[data-thick="18"][data-for="T"]').click();
  r = k(); assert.deepStrictEqual([r.P.Hob, r.P.T], ['free', 18]);
  // along the worktop the offset slider hides
  const along = kq('#k-tHobAlong'); along.checked = true; along.dispatch('change');
  assert.strictEqual(kq('#k-fHx').hidden, true);
  // the mezzanine fronts: to the sides in turn, or up around their upper front edge (to the ceiling, 1 mm below it)
  const ant = () => p.run('(f=>f.current.parts.filter(x=>x.name==="Фасад антресоли").map(x=>x.hinge))(VIEWS.kitchen.furniture())');
  const lifts = () => p.run('(f=>f.doors.filter(d=>d.axis==="x"&&d.s===-1&&d.key!=="sofa-lid").map(d=>Math.round(d.g.position.y*1000)))(VIEWS.kitchen.furniture())');
  const up = kq('#k-tAntUp'); assert.strictEqual(up.checked, false);
  assert.deepStrictEqual(ant(), ['L', 'R', 'L', 'R']); assert.deepStrictEqual(lifts(), []);
  up.checked = true; up.dispatch('change');
  assert.deepStrictEqual(ant(), ['U', 'U', 'U', 'U']); assert.deepStrictEqual(lifts(), [2599, 2599, 2599, 2599]);
  assert.strictEqual(k().doors, nDoors + 16, 'every front still opens');
  // without the mezzanines there is nothing to lift: greyed out
  const antOn = kq('#k-tAnt'); antOn.checked = false; antOn.dispatch('change');
  assert.strictEqual(up.disabled, true); assert.deepStrictEqual(ant(), []);
  antOn.checked = true; antOn.dispatch('change'); assert.strictEqual(up.disabled, false);
});

check('кухня: шкафы в своей вкладке и на «Планировке», следуют её размерам', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const k = () => p.run('(f=>[f.model.visible, f.model.position.y, f.dims.visible, f.appl.visible])(VIEWS.kitchen.furniture())');
  // on the plan with «Шкафы» (on at first): the kitchen with its appliances, without its dimension lines
  assert.deepStrictEqual(k(), [true, 0, false, true]);
  p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(k(), [true, 0, true, true]);
  // the kitchen's «Стены и техника» off takes the appliances away in the kitchen only: the plan keeps its walls
  const wall = p.document.getElementById('k-tWall'); wall.checked = false; wall.dispatch('change'); p.tick();
  assert.deepStrictEqual(k(), [true, 0, true, false]);
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(k(), [true, 0, false, true]);
  // «Шкафы» off: the kitchen leaves the plan
  const furn = p.document.getElementById('pFurn'); furn.checked = false; furn.dispatch('change'); p.tick();
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().model.visible'), false, 'hidden on the plan');
  slide(p, 'kW', 2300); p.tick();
  p.run('showView("kitchen")'); p.fly();
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().P.W'), 2300);
  assert.match(p.document.getElementById('k-gapBase').textContent, /справа свободно 200 мм/);
  assert.strictEqual(p.document.getElementById('k-W').textContent, '2300 мм');
});

check('кухня: отделка — палитра, меню образца, свой цвет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kp = p.document.querySelector('[data-panel="kitchen"]'), kq = (s) => kp.querySelector(s), sub = () => kq('#kSub').textContent;
  assert.strictEqual(kp.querySelectorAll('[data-decor]').length, DECOR_PARENT.PALETTE_WOOD.length);
  assert.strictEqual(kp.querySelectorAll('[data-uc]').length, DECOR_PARENT.PALETTE_UNI.length);
  assert.ok(matches(kq('#k-ccCard'), '[aria-label="Монотонные декоры"] .cc'), 'own colour card stays with the plain colours');
  // what each swatch carries: К carcass, Ф fronts, С worktop, А apron (follows the worktop)
  const tags = (s) => kq(s).querySelector('.tags').innerHTML;
  assert.strictEqual(tags('[data-uc="#F1F0EA"]'), '<b>К</b>'); assert.strictEqual(tags('[data-uc="#C2B8AA"]'), '<b>Ф</b>');
  assert.strictEqual(tags('[data-decor="C1385"]'), '<b>С</b><b>А</b>');
  // a click paints carcass and fronts
  kq('[data-decor="H1180"]').click();
  assert.match(sub(), /потолок 2600 мм · Дуб Галифакс натуральный H1180 ST37; столешница — Дуб Каселла/);
  // the swatch menu paints one group: the worktop
  const ctx = p.document.getElementById('ctx');
  kq('[data-uc="#F1F0EA"]').dispatch('contextmenu', { clientX: 100, clientY: 100 });
  assert.strictEqual(ctx.hidden, false);
  assert.deepStrictEqual(ctx.querySelectorAll('[data-where]').filter((b) => !b.hidden).map((b) => b.dataset.where), ['carcass', 'front', 'top', 'apron']);
  ctx.querySelector('[data-where="top"]').click();
  assert.strictEqual(ctx.hidden, true);
  assert.match(sub(), /столешница — Белый премиум W1000 ST9$/);
  // the apron on its own, then back with the worktop
  kq('[data-decor="H1180"]').dispatch('contextmenu', { clientX: 1, clientY: 1 }); ctx.querySelector('[data-where="apron"]').click();
  assert.match(kq('#k-finNow').innerHTML, /Фартук<\/span><span>Дуб Галифакс натуральный H1180 ST37 <button/);
  kq('#k-apronReset').click();
  assert.match(kq('#k-finNow').innerHTML, /Фартук<\/span><span>как столешница/);
  // own colour for the whole cabinet
  const cc = kq('#k-uniColor'); cc.click(); cc.value = '#123456'; cc.dispatch('input');
  assert.match(sub(), /Свой цвет #123456; столешница/);
  assert.strictEqual(kq('#k-ccCode').textContent, '#123456');
  const ec = kq('#k-Ec'); ec.value = '60'; ec.dispatch('input');
  assert.strictEqual(kq('#k-oEc').textContent, '60%');
});

check('кухня: фасады, деталировка, настройки по умолчанию', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  let kp = p.document.querySelector('[data-panel="kitchen"]'), kq = (s) => kp.querySelector(s);
  const pressed = () => kp.querySelectorAll('[data-door]').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.door);
  assert.deepStrictEqual(pressed(), ['closed']);
  kq('[data-door="open"]').click();
  assert.deepStrictEqual(p.run('VIEWS.kitchen.furniture().doors.every(d=>d.t===d.max)'), true);
  // one front closed by hand: nothing pressed, the remembered mode stays
  p.run('(VIEWS.kitchen.furniture().doors[0].t=0, doorsChanged())');
  assert.deepStrictEqual(pressed(), []); assert.strictEqual(p.run('VS.kitchen.fronts'), 'open');
  kq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  const dims = kq('#k-tDims'); dims.checked = false; dims.dispatch('change');
  assert.deepStrictEqual(p.run('[VS.kitchen.fronts, VS.kitchen.dims]'), ['hidden', false]);
  // cut list: every part, grouped by material; the same as CSV
  assert.match(kq('#k-tot').innerHTML, /^<span>65 деталей<\/span>/);
  const csv = kq('#k-csv').value.split('\n');
  assert.strictEqual(csv[0], 'Деталь;Материал;Длина;Ширина;Толщина;Кол-во');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 65);
  assert.ok(kq('#k-cut').querySelectorAll('th.mh').length >= 3, 'groups by material');
  // remembered: cabinets and finishes, without the wall and the ceiling
  const b1 = kq('[data-p="B1"]'); b1.value = '600'; b1.dispatch('input');
  kq('[data-decor="H3154"]').click();
  kq('#k-saveDef').click();
  const saved = JSON.parse(storage.get('apt-kitchen-v2'));
  assert.deepStrictEqual([saved.P.B1, saved.P.Fr, 'W' in saved.P, 'H' in saved.P, saved.FIN.front.decor], [600, 600, false, false, 'H3154']);
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  kp = p.document.querySelector('[data-panel="kitchen"]');
  assert.deepStrictEqual(p.run('(f=>[f.P.B1,f.P.Fr,f.P.W])(VIEWS.kitchen.furniture())'), [600, 600, 2200]);
  assert.match(kq('#kSub').textContent, /Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  kq('#k-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.B1,f.P.Fr])(VIEWS.kitchen.furniture())'), [450, 600]);
  assert.ok(!storage.has('apt-kitchen-v2'));
  assert.match(kq('#kSub').textContent, /корпус — Белый премиум W1000 ST9; фасады — Серый кашемир U702 ST9/);
});

check('кухня: короткая стена ничего не ужимает, сдвиг варочной панели возвращается', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const kq = (s) => p.document.querySelector('[data-panel="kitchen"]').querySelector(s);
  const P = () => p.run('(f=>[f.P.W,f.P.Fr,f.P.Hx])(VIEWS.kitchen.furniture())');
  // the kitchen wall down to its least on the plan and back: the fridge niche stays, the panel says how much is over
  slide(p, 'kW', 1600); p.tick();
  assert.deepStrictEqual(P(), [1600, 600, -150]);
  assert.deepStrictEqual([kq('#k-runOver').hidden, kq('#k-runOver').textContent], [false, 'Тумбы и ниша холодильника длиннее стены на 500 мм']);
  slide(p, 'kW', 2200); p.tick();
  assert.deepStrictEqual(P(), [2200, 600, -150]);
  assert.strictEqual(kq('#k-runOver').hidden, true);
  // a narrower oven cabinet moves the hob in; a wider one gives it its place back
  const b3 = kq('[data-p="B3"]'); b3.value = '450'; b3.dispatch('input');
  assert.strictEqual(P()[2], -75);
  b3.value = '600'; b3.dispatch('input');
  assert.strictEqual(P()[2], -150);
  // the hob moved by hand is taken as it comes out
  const hx = kq('[data-p="Hx"]'); hx.value = '100'; hx.dispatch('input');
  b3.value = '450'; b3.dispatch('input'); b3.value = '600'; b3.dispatch('input');
  assert.strictEqual(P()[2], 100);
});

check('кухня: размер между полками — один на навесной шкаф, за дверцами не виден, без полок — нет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kq = (s) => p.document.querySelector('[data-panel="kitchen"]').querySelector(s);
  const f = 'VIEWS.kitchen.furniture()';
  // two wall cabinets and the shorter one over the hob; the mezzanines and the base cabinets have no shelf stacks
  assert.deepStrictEqual(p.run(`${f}.dims.userData.gaps`), ['343', '343', '293']);
  assert.deepStrictEqual(p.run(`(d=>d.children.slice(-6).map(o=>o.material.depthTest===true))(${f}.dims)`), Array(6).fill(true));
  const n = kq('[data-p="Nw"]'); n.value = '0'; n.dispatch('input');
  assert.deepStrictEqual(p.run(`${f}.dims.userData.gaps`), []);
  assert.ok(p.run(`${f}.dims.children.every(o=>o.material.depthTest===false)`), 'the room\'s own dimensions are seen through everything');
});

check('кухня: стол у левой стены — 1350 от стены кухни, 700 вдоль стены, 1300 в комнату, столешница 30 мм на высоте 750', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // the kitchen's origin on the plan: −2000, 2000; the table's top and legs among the appliances, in the walker's way
  const r = p.run(`furnBoxes().map(b=>b.map(v=>Math.round(v*1000))).filter(b=>b[0]>=-2000&&b[1]<=-700&&b[2]>=3350&&b[3]<=4050)`);
  assert.deepStrictEqual(r.filter((b) => b[1] - b[0] === 1300), [[-2000, -700, 3350, 4050, 720, 750]], 'the top');
  assert.deepStrictEqual(r.filter((b) => b[1] - b[0] === 40).map((b) => [b[0], b[2], b[4], b[5]]),
    [[-1950, 3400, 0, 720], [-790, 3400, 0, 720], [-1950, 3960, 0, 720], [-790, 3960, 0, 720]], 'four legs 40 × 40, 50 in from the edges');
});

check('кухня: дверь холодильника открывается на петлях справа, два его ящика выдвигаются, дверь духовки откидывается вниз', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const ap = () => p.run(`(f=>["fridge","fridge-d1","fridge-d2","oven"].map(k=>{const d=f.doors.find(x=>x.key===k);
    return d&&[d.axis||'y',d.s,Math.round((d.travel||0)*1000),+d.max.toFixed(2),+d.t.toFixed(2),+d.g.rotation.x.toFixed(2),+d.g.rotation.y.toFixed(2),Math.round(d.g.position.z*1000),d.g.parent===f.appl];}))(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(ap().map((d) => d && d.slice(0, 5)), [['y', 1, 0, 1.45, 0], ['z', 1, 380, 1.45, 0], ['z', 1, 380, 1.45, 0], ['x', 1, 0, 1.57, 0]], 'closed: the door on its hinges, two drawers, the oven door');
  assert.ok(ap().every((d) => d[8]), 'with the appliances');
  // the hinges: the fridge door turns on its front right edge (the fridge niche's right end, 10 mm in), the oven door on its lower front edge
  const piv = p.run(`(f=>{const d=k=>f.doors.find(x=>x.key===k).g.position,c=f.current;return [Math.round(d("fridge").x*1000),c.xF-10,Math.round(d("oven").y*1000),c.ovY];})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(piv.slice(0, 2), [piv[1], piv[1]]); assert.strictEqual(piv[2], piv[3]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click(); p.tick(120);
  const r = ap();
  assert.ok(r[0][6] > 1.4, 'the fridge door swings out'); assert.ok(r[1][7] > 370 && r[2][7] > 370, 'the drawers slide out');
  assert.ok(r[3][5] > 1.5, 'the oven door lies down');
  // they keep how open they are through a rebuild
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  assert.ok(ap().every((d) => d[4] === d[3]), 'still open after a rebuild');
  // the oven door closes alone
  p.run('(d=>{d.t=0;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="oven"))');
  assert.deepStrictEqual(ap().map((d) => d[4] === 0), [false, false, false, true]);
});

check('кухня: письменный стол HEMNES у левой стены — 150 от стены с окном, дверца открывается, ящики выдвигаются, следует «Планировке»', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const desk = () => p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true);
    return {at:[Math.round(d.position.x*1000),Math.round(d.position.z*1000)],turn:+d.rotation.y,
      parts:d.children.length,doors:f.doors.filter(x=>x.g.parent===d).map(x=>[x.axis||'y',Math.round((x.travel||0)*1000),x.t])};})(VIEWS.kitchen.furniture())`);
  let r = desk();
  // kitchen axes: the left wall at x 0, the window wall at z 4750; the desk's window end 150 from it, its length toward the kitchen wall
  assert.deepStrictEqual(r.at, [0, 4750 - 150]);
  assert.strictEqual(r.turn, Math.PI / 2, 'along the left wall, its fronts into the room');
  // the add-on unit on the desk's top at the wall, in the middle of its length: 1520 × 250, up to 740 + 630
  const au = p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),ps=[];const w=o=>{const q=o.userData&&o.userData.part;if(q&&typeof q.x0==='number'&&/надстройки/.test(q.name))ps.push(q);(o.children||[]).forEach(w);};w(d);
    return [Math.min(...ps.map(q=>q.x0)),Math.max(...ps.map(q=>q.x1)),Math.min(...ps.map(q=>q.y0)),Math.max(...ps.map(q=>q.y1)),Math.min(...ps.map(q=>q.z0)),Math.max(...ps.map(q=>q.z1))];})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(au, [15, 1535, 740, 1370, 0, 250]);
  assert.deepStrictEqual(r.doors, [['y', 0, 0], ['z', 450, 0], ['z', 450, 0], ['z', 180, 0], ['z', 180, 0]], 'a door on its hinges and two drawers, closed; the add-on unit\'s two drawers');
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(desk().doors.every((d) => d[2] > 0), 'they open with the kitchen\'s fronts');
  // a longer kitchen on the plan: the desk keeps to the window wall
  p.run('showView("plan")'); p.fly(); slide(p, 'kL', 5000); p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(desk().at, [0, 5000 - 150]);
});

check('кухня: витрина HEMNES спинкой к торцу стола, боком к левой стене — две стеклянные дверцы и три ящика открываются', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const vit = () => p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.vitrine===true);
    return {at:[Math.round(d.position.x*1000),Math.round(d.position.z*1000)],turn:+d.rotation.y,
      glass:d.children.filter(o=>o.userData.front===true).map(h=>h.children[0]).filter(m=>m.userData.part.glass===50).length,
      doors:f.doors.filter(x=>x.g.parent===d).map(x=>[x.axis||'y',Math.round((x.travel||0)*1000),x.t])};})(VIEWS.kitchen.furniture())`);
  let r = vit();
  // kitchen axes: the desk's end toward the kitchen wall at 4750 − 150 − 1550 = 3050; the cabinet 900 wide from the left wall
  assert.deepStrictEqual(r.at, [900, 3050]);
  assert.strictEqual(r.turn, Math.PI, 'its fronts toward the kitchen wall');
  assert.strictEqual(r.glass, 2, 'two glass doors');
  assert.deepStrictEqual(r.doors, [['y', 0, 0], ['y', 0, 0], ['z', 270, 0], ['z', 270, 0], ['z', 270, 0]]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(vit().doors.every((d) => d[2] > 0), 'they open with the kitchen\'s fronts');
});

check('кухня: «i» у столов и витрины — что это за предмет, карточка по клику', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // what each thing says it is: from any of its meshes (the add-on unit's parts, its drawers' knobs, the table's legs)
  const r = p.run(`(f=>{const by=k=>f.appl.children.find(o=>o.userData[k]===true),desk=by('desk'),vit=by('vitrine');
    const ps=[];const w=o=>{if(o.userData&&o.userData.part&&typeof o.userData.part.name==='string')ps.push(o);(o.children||[]).forEach(w);};w(desk);
    const auPart=ps.find(m=>m.userData.part.name==='Полка надстройки'),auDrawer=desk.children.find(o=>o.userData.front===true&&/надстройки/.test(o.children[0].userData.part.name));
    const deskDoor=desk.children.find(o=>o.userData.front===true&&o.children[0].userData.part.name==='Дверца — тумба с дверцей');
    const t=o=>{const i=infoOf(o);return i&&i.title;};
    return {desk:t(deskDoor.children[deskDoor.children.length-1]),au:t(auPart),auKnob:t(auDrawer.children[auDrawer.children.length-1]),
      vit:t(vit.children[0])};})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual([r.desk, r.au, r.auKnob, r.vit], ['Письменный стол HEMNES (IKEA)', 'Надстройка HEMNES для стола (IKEA)', 'Надстройка HEMNES для стола (IKEA)', 'Витрина HEMNES с 3 ящиками (IKEA)']);
  // the dining table: its top's decor in the card
  const table = p.run(`(f=>{const m=f.appl.children.filter(o=>{const i=infoOf(o);return i&&i.title==='Обеденный стол';});return [m.length, infoOf(m[0]).lines];})(VIEWS.kitchen.furniture())`);
  assert.strictEqual(table[0], 5, 'its top and four legs');
  assert.deepStrictEqual(table[1], ['130 × 70 см, высота 75 см, торцом к левой стене.', 'Столешница 30 мм — Дуб Каселла натуральный H1385 ST40, как у кухни.', 'Четыре стальные ножки 40 × 40 мм.']);
  // the «i» by the cursor, its card on a click; Esc closes it
  const dot = p.document.getElementById('itemDot'), card = p.document.getElementById('itemCard');
  assert.deepStrictEqual([dot.hidden, card.hidden], [true, true]);
  p.run('showItemDot({title:"Письменный стол HEMNES (IKEA)",lines:["a","b"]},100,200)');
  assert.deepStrictEqual([dot.hidden, dot.style.left, dot.style.top], [false, '110px', '170px']);
  p.run('itemHover({title:"Письменный стол HEMNES (IKEA)"},{clientX:150,clientY:220})');
  assert.strictEqual(p.run('itemHide'), null, 'still on the same thing: the «i» stays');
  dot.click();
  assert.deepStrictEqual([dot.hidden, card.hidden], [true, false]);
  assert.deepStrictEqual(card.children.map((c) => c.textContent), ['×', 'Письменный стол HEMNES (IKEA)', 'a', 'b']);
  p.key('keydown', 'Escape'); assert.strictEqual(card.hidden, true);
  // another view takes the «i» away
  p.run('showItemDot({title:"x"},10,10)'); p.run('showView("plan")'); p.tick();
  assert.strictEqual(dot.hidden, true);
});

check('кухня: угловой диван Hoff «Слим» у правой стены напротив стола — оттоманка к стене с окном, 150 от неё, вровень со столом', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const r = p.run(`(f=>f.appl.children.filter(o=>o.userData.sofa===true).map(q=>{
    const b=new THREE.Box3().setFromObject(q);return {at:[Math.round(q.position.x*1000),Math.round(q.position.z*1000)],turn:+q.rotation.y,
      x0:Math.round((b.min.x-q.position.x)*1000),size:[Math.round((b.max.x-b.min.x)*1000),Math.round((b.max.z-b.min.z)*1000),Math.round(b.max.y*1000)],title:infoOf(q).title};}))(VIEWS.kitchen.furniture())`);
  // kitchen axes: the right wall at x 3200; its window end 150 from the window wall at 4750, as the desk's: from z 4600 − 2060 = 2540
  assert.deepStrictEqual(r.map((q) => q.at), [[3200, 2540], [3200, 2540]], 'the sofa and its chaise, one place');
  assert.ok(r.every((q) => q.turn === -Math.PI / 2 && q.title === 'Угловой диван Hoff «Слим»'), 'its back to the wall, its seat toward the desk');
  // own axes before the turn (the stub's boxes leave turns out): 2060 across, 850 deep, 910 high; the chaise 705 across, its box from the back
  // out to 1530, up to its back cushion's 910, at its far end (own x 1355…2060 → kitchen z 3895…4600: the window end; the stitches on
  // its sides stand 1.5 out of them)
  assert.deepStrictEqual(r[0].size, [2060, 850, 910]);
  assert.deepStrictEqual([r[1].x0 - r[0].x0, r[1].size], [2060 - 705 - 2, [705 + 3, 1530, 910]]);
});

check('кухня: сиденье оттоманки дивана целиком — крышка на петле у спинки, под ней короб для белья, подушки на ней поднимаются; открывается с фасадами кухни', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const lid = () => p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-lid"),[sf,c]=f.appl.children.filter(o=>o.userData.sofa===true),b=new THREE.Box3().setFromObject(d.g);
    return {axis:d.axis,s:d.s,max:+d.max.toFixed(3),t:+d.t.toFixed(3),rot:+d.g.rotation.x.toFixed(2),inChaise:d.g.parent===c,hinge:[Math.round(d.g.position.y*1000),Math.round(d.g.position.z*1000)],
      size:[Math.round((b.max.x-b.min.x)*1000),Math.round((b.max.y-b.min.y)*1000),Math.round((b.max.z-b.min.z)*1000)],title:infoOf(d.g.children[0]).title,
      ride:[[.644,.46],[.48,.36]].map(([w,h])=>{const m=c.children.find(o=>o.geometry&&o.geometry.args&&Math.abs(o.geometry.args[0]-w)<1e-6&&Math.abs(o.geometry.args[1]-h)<1e-6);return m&&[Math.round(m.position.y*1000),Math.round(m.position.z*1000)];}),
      stitches:(fl=>{const seam=fl(f.doors.find(x=>x.key==="sofa-bed").g.children[0])[0].material,st=fl(c).filter(m=>m.material===seam).map(m=>m.geometry.args);
        return [st.filter(a=>a[2]<.002).length,st.filter(a=>a[0]<.002).length/2,st.filter(a=>a[0]<.002).length/2];})(q=>q.children.filter(m=>m.geometry&&m.geometry.kind==="THREE.BoxGeometry"&&m.geometry.args.length===3)),
      white:(fl=>{const seam=fl(f.doors.find(x=>x.key==="sofa-bed").g.children[0])[0].material;return fl(c).filter(m=>m.material!==seam).length;})(q=>q.children.filter(m=>m.geometry&&m.geometry.kind==="THREE.BoxGeometry"&&m.geometry.args.length===3))};})(VIEWS.kitchen.furniture())`);
  let r = lid();
  // its upper back edge at the seat's height, at the thin back (100); the whole seat of the chaise
  assert.deepStrictEqual([r.axis, r.s, r.max, r.t, r.rot, r.inChaise, r.hinge], ['x', -1, 0.698, 0, 0, true, [450, 100]], 'closed, on its hinge in the chaise');
  assert.deepStrictEqual(r.size, [705, 170, 1430], 'the chaise\'s seat, from the thin back to its front');
  // on it, the chaise's back cushion and the throw pillow in the corner (their middles: y, z)
  assert.deepStrictEqual(r.ride, [[680, 210], [640, 385]]);
  assert.strictEqual(r.title, 'Угловой диван Hoff «Слим»');
  assert.deepStrictEqual(r.stitches, [5, 4, 4], 'stitched up its front and both its sides, 130 apart');
  assert.strictEqual(r.white, 5, 'the box white inside (flat boards besides the stitches): its bottom and four walls');
  // with the kitchen's fronts: up (its front edge rises over the seat), half as fast as a front: about 69 % of the way at 0.21 s
  // (a front: 90 %), and down again
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click(); p.tick(13);
  const early = p.run('(d=>d.a/d.max)(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))');
  assert.ok(early > .62 && early < .76, 'on its way: ' + early);
  p.tick(107);
  // (a turn about x by a < 0 lifts what lies in front of the hinge: y = −z·sin a)
  r = lid(); assert.ok(r.t === 0.698 && r.rot === -0.7, 'open at 40°: its front edge up');
  // held: 30°/s
  assert.strictEqual(p.run('+(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid").holdRate*180/Math.PI).toFixed(1)'), 30);
  // straight up till their lower front edges are on the lid's top: the cushion's at 450 + (320 − 100)·tan 40° = 635; the pillow's
  // (496, 486) at 783, its middle 640 + 296
  assert.deepStrictEqual(r.ride, [[865, 210], [936, 385]], 'the pillows up out of its way');
  p.document.querySelector('[data-panel="kitchen"] [data-door="closed"]').click(); p.tick(120);
  r = lid(); assert.ok(Math.abs(r.rot) < .02, 'closed again');
  assert.ok(r.ride.every(([y, z], i) => Math.abs(y - [680, 640][i]) < 3 && Math.abs(z - [210, 385][i]) < 2), 'the pillows back down');
  // a click opens it alone, and it stays open through a rebuild
  p.run('(d=>{d.t=d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))');
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  assert.strictEqual(lid().t, 0.698);
});

check('кухня: диван раскладывается «дельфином» — ящик выкатывается, спальный блок из него поднимается вровень с сиденьем', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const bed = (a) => p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-bed"),sf=f.appl.children.filter(o=>o.userData.sofa===true)[0];
    ${a === undefined ? '' : `d.a=d.t=d.max*${a};turnDoor(d);`}
    const dr=d.g.children[0],bl=dr.children[0],st=bl.children[0],b=new THREE.Box3().setFromObject(sf),R=v=>Math.round(v*1000);
    return {axis:d.axis,inSofa:d.g.parent===sf,seat:d.g.children[1].geometry.args.slice(0,3).map(R),max:d.max,t:+d.t.toFixed(2),drawer:R(dr.position.z),
      block:[R(bl.position.y),R(bl.position.z),+bl.rotation.x.toFixed(2)],size:bl.children[1].geometry.args.slice(0,3).map(R),strap:st.visible,depth:R(b.max.z-b.min.z)};})(VIEWS.kitchen.furniture())`);
  let r = bed();
  // the seat in its holder (a click on it lays the bed out); closed: the drawer in, the block on its bottom (its back lower edge
  // 75 up, 130 from the sofa's back), the strap hidden; the sofa 850 deep
  assert.deepStrictEqual([r.axis, r.inSofa, r.seat, r.t, r.drawer, r.block, r.strap, r.depth], ['none', true, [1300, 170, 750], 0, 0, [75, 130, 0], false, 850]);
  assert.deepStrictEqual(r.size, [1272, 170, 680], 'the block between the drawer\'s sides, as thick as the seat, as deep as the chaise is in front of it');
  // 40 %: the drawer out by 680, its front in line with the chaise's (1510)
  r = bed(.4); assert.deepStrictEqual([r.drawer, r.block], [680, [75, 130, 0]]);
  // 55 %: the block's front up 22°; 70 %: slid forward till its back upper edge is past the seat's front: 850 + 170·sin 22° = 914 (− 680)
  r = bed(.55); assert.deepStrictEqual(r.block, [75, 130, -0.38]);
  r = bed(.7); assert.deepStrictEqual(r.block, [75, 234, -0.38]);
  // out: level with the seat (280 + 170 = 450), its back against the seat's front (850 − 680), the strap hanging
  r = bed(1); assert.deepStrictEqual([r.drawer, r.block, r.strap, r.depth], [680, [280, 170, 0], true, 1535], 'one bed with the chaise, out to 1530 (its strap 5 in front)');
  bed(0);
  // with the kitchen's fronts, evenly in 1.4 s: half way at 0.7 s (the drawer out, the block on its way), and back
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click(); p.tick(44);
  const half = p.run('(d=>d.a/d.max)(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))');
  assert.ok(half > .45 && half < .55, 'half way: ' + half); assert.strictEqual(bed().drawer, 680);
  p.tick(156);
  r = bed(); assert.deepStrictEqual([r.t, r.drawer, r.block, r.strap], [1.45, 680, [280, 170, 0], true]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="closed"]').click(); p.tick(200);
  r = bed(); assert.deepStrictEqual([r.drawer, r.block, r.strap], [0, [75, 130, 0], false]);
  // held, the whole way in 3 s: slower than a click, as the other doors (they ease in about 0.3 s, held at 60°/s)
  p.run('held={d:VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"),dir:1}'); p.tick(94);
  const held = p.run('(d=>(held=null,d.a/d.max))(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))');
  assert.ok(held > .45 && held < .55, 'half way in 1.5 s held: ' + held);
});

check('кухня: во вкладке — только шкафы и обеденный стол (когда рамка левой стены его вмещает); стол, витрина и диван — на плане и в обходе', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const seen = () => p.run(`(f=>{const v=k=>f.appl.children.filter(o=>o.userData[k]===true).map(o=>o.visible);
    return {desk:v('desk'),vitrine:v('vitrine'),sofa:v('sofa'),table:v('table'),tableDims:f.dims.children.filter(o=>o.userData.table===true).map(o=>o.visible)};})(VIEWS.kitchen.furniture())`);
  const all = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, [...new Set(v)]]));
  // the frame at 1350 at first: the table (1350…2050 from the kitchen wall) does not fit
  let r = seen();
  assert.deepStrictEqual([r.table.length, r.tableDims.length], [5, 8], 'the table: its top and four legs; four dimension lines with their labels');
  assert.deepStrictEqual(all(r), { desk: [false], vitrine: [false], sofa: [false], table: [false], tableDims: [false] });
  const fl = p.document.getElementById('kFrameL');
  fl.value = '2049'; fl.dispatch('input'); p.tick();
  assert.deepStrictEqual(all(seen()).table, [false], 'a millimetre short');
  fl.value = '2050'; fl.dispatch('input'); p.tick();
  assert.deepStrictEqual(all(seen()), { desk: [false], vitrine: [false], sofa: [false], table: [true], tableDims: [true] });
  // on the plan everything stands where it is
  p.run('showView("plan")'); p.fly();
  r = all(seen()); delete r.tableDims;
  assert.deepStrictEqual(r, { desk: [true], vitrine: [true], sofa: [true], table: [true] });
});
