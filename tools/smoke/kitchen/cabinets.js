// шкафы кухни: по стенам с «Планировки», сборка, короткая стена (src/js/rooms/kitchen/cabinets.js)
const { runPage, PAGES, check, slide, assert } = require('../harness');

check('кухня: шкафы по стенам с «Планировки»', () => {
  // the kitchen wall, the ceiling, the left and right walls, the desk against the window wall or not: the plan's; the module's own starting sizes are these too
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.W,f.P.H,f.P.L,f.P.Rx,f.P.DeskWall,f.current.parts.length])(tt.fur())'), [2200, 2600, 4600, 3250, false, 65]);
  assert.match(PAGES.app, /^const P=\{W:2200,H:2600,.*,L:4600,Rx:3250,WinS:800,DeskWall:false\};$/m);
});

check('кухня: шкафы и техника собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kp = p.document.querySelector('[data-panel="kitchen"]'), kq = (s) => kp.querySelector(s);
  const nDoors = p.run('tt.fur().current.parts.filter(x=>x.mat==="front"&&(x.hinge||x.pivot)).length');
  const k = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.length, visible:f.model&&f.model.visible, P:f.P}))(tt.fur())');
  let r = k();
  assert.deepStrictEqual([r.doors, r.parts, r.visible], [nDoors + 32, 65, true], 'built on screen with every front on a hinge');
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
  r = p.run('tt.fur().current.parts.map(x=>x.name)');
  assert.ok(!r.includes('Фасад посудомоечной машины') && r.includes('Полка нижнего шкафа — средний'));
  kq('[data-hob="free"]').click(); kq('[data-thick="18"][data-for="T"]').click();
  r = k(); assert.deepStrictEqual([r.P.Hob, r.P.T], ['free', 18]);
  // along the worktop the offset slider hides
  const along = kq('#k-tHobAlong'); along.checked = true; along.dispatch('change');
  assert.strictEqual(kq('#k-fHx').hidden, true);
  // the mezzanine fronts: to the sides in turn, or up around their upper front edge (to the ceiling, 1 mm below it)
  const ant = () => p.run('(f=>f.current.parts.filter(x=>x.name==="Фасад антресоли").map(x=>x.hinge))(tt.fur())');
  const lifts = () => p.run('(f=>f.doors.filter(d=>d.axis==="x"&&d.s===-1&&d.key!=="sofa-lid").map(d=>tt.mm(d.g.position.y)))(tt.fur())');
  const up = kq('#k-tAntUp'); assert.strictEqual(up.checked, false);
  assert.deepStrictEqual(ant(), ['L', 'R', 'L', 'R']); assert.deepStrictEqual(lifts(), []);
  up.checked = true; up.dispatch('change');
  assert.deepStrictEqual(ant(), ['U', 'U', 'U', 'U']); assert.deepStrictEqual(lifts(), [2599, 2599, 2599, 2599]);
  assert.strictEqual(k().doors, nDoors + 32, 'every front still opens');
  // without the mezzanines there is nothing to lift: greyed out
  const antOn = kq('#k-tAnt'); antOn.checked = false; antOn.dispatch('change');
  assert.strictEqual(up.disabled, true); assert.deepStrictEqual(ant(), []);
  antOn.checked = true; antOn.dispatch('change'); assert.strictEqual(up.disabled, false);
});

check('кухня: шкафы в своей вкладке и на «Планировке», следуют её размерам', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const k = () => p.run('(f=>[f.model.visible, f.model.position.y, f.dims.visible, f.appl.visible])(tt.fur())');
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
  assert.strictEqual(p.run('tt.fur().model.visible'), false, 'hidden on the plan');
  slide(p, 'bW', 2050); p.tick();
  p.run('showView("kitchen")'); p.fly();
  assert.strictEqual(p.run('tt.fur().P.W'), 2300);
  assert.match(p.document.getElementById('k-gapBase').textContent, /справа свободно 200 мм/);
  assert.strictEqual(p.document.getElementById('k-W').textContent, '2300 мм');
});

check('кухня: короткая стена ничего не ужимает, сдвиг варочной панели возвращается', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const kq = (s) => p.document.querySelector('[data-panel="kitchen"]').querySelector(s);
  const P = () => p.run('(f=>[f.P.W,f.P.Fr,f.P.Hx])(tt.fur())');
  // the kitchen wall down to its least on the plan (the bathroom narrowed to the shaft, the shower opening and their walls: 1700) and back: the fridge niche stays, the panel says how much is over
  slide(p, 'bW', 1350); p.tick();
  assert.deepStrictEqual(P(), [1700, 600, -150]);
  assert.deepStrictEqual([kq('#k-runOver').hidden, kq('#k-runOver').textContent], [false, 'Тумбы и ниша холодильника длиннее стены на 400 мм']);
  slide(p, 'bW', 1950); p.tick();
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
