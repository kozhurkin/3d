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
  fl.value = '9000'; fl.dispatch('input');   // no further than 2650 from the kitchen wall
  assert.deepStrictEqual(p.run(kitchenWalls).map((w) => w.r[3]), [4650, 2000]);
  assert.deepStrictEqual([fl.max, fl.value], [2650, 2650]);
  // to the plan and back: all walls and doors there, the kitchen camera where it was left
  p.document.querySelector('[data-cam="sink"]').click();
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length, doors.map(d=>d.g.visible)]'), ['plan', 13, [true, true]]);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="plan"] #shared'));
  // a size changed on the plan reaches the kitchen
  slide(p, 'kW', 2300);
  p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.875, 0.9, 2.3], 'sink target, kitchen moved 100 left');
  assert.deepStrictEqual(p.run(kitchenWalls).map((w) => w.r), [[-2300, -2100, 1900, 4650], [-2100, 200, 1900, 2000]]);
  assert.match(p.document.getElementById('kSub').textContent, /стена 2300/);
});

check('кухня: детали шкафов совпадают со старой кухней', () => {
  const pLine = PAGES.app.match(/^const P=\{W:2200,H:2600,.*\};$/m)[0];
  const got = new Function(`let T=16, TF=16; const HDF=4, G=2;\n${pLine}\n${fnSource(PAGES.app, 'partList')}\n${fnSource(PAGES.app, 'computeParts')}\nT=P.T||16;TF=P.TF||16;return computeParts(P);`)();
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
  assert.deepStrictEqual([r.doors, r.parts, r.visible], [nDoors + 29, want.parts.length, true], 'built on screen with every front on a hinge');
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
  assert.strictEqual(k().doors, nDoors + 29, 'every front still opens');
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
  const chairs = () => p.run('VIEWS.kitchen.furniture().doors.filter(d=>/^chair/.test(d.key)).map(d=>d.t===d.max)');
  const ch0 = chairs();
  kq('[data-door="open"]').click();
  assert.deepStrictEqual(p.run('VIEWS.kitchen.furniture().doors.filter(d=>!d.loose).every(d=>d.t===d.max)'), true);
  // only the kitchen's cabinet fronts (the dishwasher's among them); the oven and the fridge, the chairs, the sofa and the apartment's
  // furniture (the desk with its chair and laptop, the display cabinet, the wardrobe, the mezzanine) the switch leaves, and they do not unpress it
  assert.deepStrictEqual(p.run('(f=>f.doors.filter(d=>!d.loose).map(d=>d.g.parent===f.model))(VIEWS.kitchen.furniture())'), Array(10).fill(true));
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().doors.filter(d=>d.loose).length'), 29, 'the oven, the fridge 3, 4 chairs, the desk chair, the laptop, the sofa 2, the desk 5, the display cabinet 5, the wardrobe 3, the mezzanine 4');
  assert.ok(p.run('VIEWS.kitchen.furniture().doors.filter(d=>/^(oven|fridge)/.test(d.key)).every(d=>d.t===0)'), 'the oven and the fridge stay closed');
  assert.deepStrictEqual(chairs(), ch0, 'the chairs stay as they were');
  p.run('(d=>{d.t=d.t?0:d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(d=>d.key==="chair0"))');
  assert.deepStrictEqual(pressed(), ['open'], 'a chair moved by hand');
  kq('[data-door="closed"]').click(); assert.deepStrictEqual(chairs(), ch0.map((v, i) => i ? v : !v));
  kq('[data-door="open"]').click();
  // one front closed by hand: nothing pressed, the remembered mode stays
  p.run('(VIEWS.kitchen.furniture().doors[0].t=0, doorsChanged())');
  assert.deepStrictEqual(pressed(), []); assert.strictEqual(p.run('VS.kitchen.fronts'), 'open');
  kq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  // fronts taken off; the dishwasher keeps its own door (steel, its panel), only its decor front goes
  const off = () => p.run(`(f=>{const hs=f.model.children.filter(o=>o.userData.front===true),dw=hs.filter(o=>o.userData.ownDoor===true);
    return [dw.length,hs.filter(o=>o!==dw[0]).every(o=>o.visible===false),dw[0].visible!==false,dw[0].children.map(m=>m.userData.door===true?'door':'front').join(),dw[0].children.map(m=>m.visible!==false).join()];})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(off(), [1, true, true, 'door,door,front', 'true,true,false']);
  kq('[data-door="closed"]').click(); assert.deepStrictEqual(off().slice(2), [true, 'door,door,front', 'true,true,true'], 'the front back on');
  kq('[data-door="hidden"]').click();
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

check('кухня: мойка — рамка с отверстием, в нём открытая чаша на 170 вниз сквозь вырез в столешнице, дно вокруг слива; ничто не лежит поверх другого', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const sink = () => p.run(`(f=>{const w=f.model.children.find(o=>o.userData.part&&o.userData.part.name==='Столешница'),a=f.appl.children;
    const rim=a.find(o=>o.userData.sinkRim===true),bowl=a.find(o=>o.userData.sinkBowl===true),mm=v=>Math.round(v*1000);
    return {hole:w.userData.part.hole,grid:w.geometry.args.slice(3),ct:f.P.Ct,
      rim:[rim.geometry.kind,mm(rim.geometry.args[1].depth),mm(rim.position.x),mm(rim.position.y),mm(rim.position.z)],
      bowl:[bowl.geometry.kind,mm(bowl.geometry.args[1].depth),mm(bowl.position.y)],
      boxes:a.filter(o=>o.geometry&&o.geometry.kind==='THREE.BoxGeometry'&&mm(o.geometry.args[0])===340).length};})(VIEWS.kitchen.furniture())`);
  let r = sink();
  // the sink in the middle of the first base cabinet (450): its bowl 340 × 380 round z 300, the worktop cut out under it (its top face
  // on a 3 × 3 grid, the middle cell left out)
  assert.deepStrictEqual(r.hole, [225 - 170, 225 + 170, 300 - 190, 300 + 190]);
  assert.deepStrictEqual(r.grid, [3, 1, 3]);
  // the rim 10 thick from 6 over the worktop, the bowl's walls from there to 170 under its top; no solid box for a bowl any more
  assert.deepStrictEqual(r.rim, ['THREE.ExtrudeGeometry', 10, 225, r.ct + 6, 300]);
  assert.deepStrictEqual(r.bowl, ['THREE.ExtrudeGeometry', 176, r.ct + 6]);
  assert.strictEqual(r.boxes, 0);
  // nothing of the sink cabinet's carcass inside the bowl (z 110..490, from 170 under the worktop's top up): its front rail on edge by the front
  const inBowl = p.run(`VIEWS.kitchen.furniture().current.parts.filter(q=>q.mat==='carcass'&&q.x0<395&&q.x1>55&&q.z0<490&&q.z1>110&&q.y1>${r.ct}-170&&q.y0<${r.ct}).map(q=>q.name)`);
  assert.deepStrictEqual(inBowl, []);
  // a wider sink cabinet: the sink and the cut-out move with its middle
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  r = sink(); assert.deepStrictEqual([r.hole[0], r.rim[2]], [250 - 170, 250]);
});

check('кухня: варочная панель — стекло с круглыми отверстиями, в них конфорки заподлицо; у настольной стекло вставлено в верх корпуса; поперёк и вдоль', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kq = (q) => p.document.querySelector('[data-panel="kitchen"] ' + q);
  const hob = () => p.run(`(f=>{const a=f.appl.children,mm=v=>Math.round(v*1000),ext=o=>[mm(o.position.x),mm(o.position.y),mm(o.position.z),mm(o.geometry.args[1].depth)];
    const gl=a.filter(o=>o.userData.hobGlass===true),bu=a.filter(o=>o.userData.burner===true),body=a.find(o=>o.userData.hobBody===true);
    return {glass:gl.map(ext),burners:bu.map(ext),shapes:bu.map(o=>o.geometry.kind),ct:f.P.Ct,body:body&&[body.geometry.args.slice(0,3).map(mm),body.geometry.args.slice(3)],
      discs:a.filter(o=>o.geometry&&o.geometry.kind==='THREE.CylinderGeometry'&&mm(o.geometry.args[0])>=75).length};})(VIEWS.kitchen.furniture())`);
  // built in: 6 mm of glass on the worktop, its middle 150 left of the oven cabinet's (450 + 450 + 300 − 150 = 1050), z 60…580;
  // two burners in its holes, as deep, their tops flush with it; no disc over anything
  let r = hob(), t = r.ct + 6;
  assert.deepStrictEqual(r.glass, [[1050, t, 320, 6]]);
  assert.deepStrictEqual(r.burners, [[1050, t, 320, 6], [1050, t, 320, 6]], 'drawn round the glass\'s middle, as its holes are');
  assert.deepStrictEqual([r.shapes, r.discs, r.body], [['THREE.ExtrudeGeometry', 'THREE.ExtrudeGeometry'], 0, undefined]);
  // along the worktop: turned, 20 off the wall, in the middle of the cabinet
  const along = kq('#k-tHobAlong'); along.checked = true; along.dispatch('change'); p.tick();
  r = hob(); assert.deepStrictEqual(r.glass, [[1200, t, 170, 6]]);
  // the tabletop one: its body 290 × 57 × 490 on its feet, its top open under the glass (boxGeo's hole: a 3 × 3 grid); the glass 4 mm
  // proud of it and 6 down into it
  along.checked = false; along.dispatch('change'); kq('[data-hob="free"]').click(); p.tick();
  r = hob(); t = r.ct + 65 + 4;
  assert.deepStrictEqual([r.glass, r.burners.length, r.discs], [[[1050, t, 315, 10]], 2, 0]);
  assert.deepStrictEqual(r.body, [[290, 57, 490], [3, 1, 3]]);
});

check('кухня: стол у левой стены — 1350 от стены кухни, 700 вдоль стены, 1300 в комнату, столешница 30 мм на высоте 750', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // the kitchen's origin on the plan: −2000, 2000; the table's top and legs among the appliances, in the walker's way
  const r = p.run(`furnBoxes().map(b=>b.map(v=>Math.round(v*1000))).filter(b=>b[0]>=-2000&&b[1]<=-700&&b[2]>=3350&&b[3]<=4050)`);
  assert.deepStrictEqual(r.filter((b) => b[1] - b[0] === 1300), [[-2000, -700, 3350, 4050, 720, 750]], 'the top');
  assert.deepStrictEqual(r.filter((b) => b[1] - b[0] === 40).map((b) => [b[0], b[2], b[4], b[5]]),
    [[-1950, 3400, 0, 720], [-790, 3400, 0, 720], [-1950, 3960, 0, 720], [-790, 3960, 0, 720]], 'four legs 40 × 40, 50 in from the edges');
});

check('кухня: четыре стула BERGMUND у стола — задвинуты, нажатие выдвигает их из-под стола; обход сквозь них проходит', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const st = () => p.run(`(f=>f.doors.filter(d=>/^chair/.test(d.key)).map(d=>{const c=d.g.parent;
    return [d.key,d.axis,Math.round(d.travel*1000),Math.round(c.position.x*1000),Math.round(c.position.z*1000),+c.rotation.y.toFixed(2),Math.round(d.g.position.z*1000),c.parent===f.appl];}))(VIEWS.kitchen.furniture())`);
  // two along each long side (the kitchen wall's, the far one), 20 mm clear of the table's legs, 40 apart; the far ones turned round;
  // all pushed in at first, the seat's front 10 short of the table's middle (1700 from the kitchen wall); pulled out by 420 (the seat's front 80 past the table's edge)
  assert.deepStrictEqual(st(), [
    ['chair0', 'z', -420, 110, 1170, 0, 0, true], ['chair1', 'z', -420, 670, 1170, 0, 0, true],
    ['chair2', 'z', -420, 630, 2230, 3.14, 0, true], ['chair3', 'z', -420, 1190, 2230, 3.14, 0, true]]);
  const info = p.run(`(f=>{const m=f.appl.children.filter(o=>o.userData.chair===true);return [m.length,infoOf(m[0].children[0].children[3]).title];})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(info, [4, 'Стул BERGMUND (IKEA)']);
  // as the drawing: the seat 510 high at its front, sloping to 470 over its 410; the back to it 104°; 950 high
  const ang = p.run(`(q=>{const [st,b]=q.children.slice(4);   // after its four legs: the seat's holder, the back's
    return [Math.round(st.position.y*1000),Math.round(st.position.z*1000),+(st.rotation.x*180/Math.PI).toFixed(1),+(90-(st.rotation.x+b.rotation.x)*180/Math.PI).toFixed(1)];})(VIEWS.kitchen.furniture().doors.find(d=>d.key==="chair0").g)`);
  assert.deepStrictEqual(ang, [510, 520, -5.6, 104]);
  // the cover: one dark grey matting on the seat and the back, its weave a picture and bumps
  const cov = p.run(`(q=>{const [st,b]=q.children.slice(4),s=st.children[0],k=b.children[0];
    return [s.material===k.material,!!s.material.map,!!s.material.bumpMap];})(VIEWS.kitchen.furniture().doors.find(d=>d.key==="chair0").g)`);
  assert.deepStrictEqual(cov, [true, true, true]);
  // a click pulls one out, another pushes it in again
  const click = () => { p.run('(d=>{d.t=d.t!==0?0:d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="chair1"))'); p.tick(120); };
  click(); assert.deepStrictEqual(st().map((c) => c[6]), [0, -420, 0, 0], 'pulled out');
  click(); assert.deepStrictEqual(st().map((c) => c[6]), [0, 0, 0, 0], 'pushed in again');
  p.run('(VIEWS.kitchen.furniture().doors.filter(d=>d.key==="chair2"||d.key==="chair3").forEach(d=>d.t=d.max),doorsChanged())'); p.tick(120);
  // the walker crosses the row of the far chairs, pulled out (2400 from the kitchen wall, kitchen x 250…1150), without stopping
  p.run('showView("walk")'); p.fly();
  const go = () => p.run('walkSlide(-1.75,4.4,.9,0,0,1.7).map(v=>typeof v==="number"?Math.round(v*1000):v)');
  assert.deepStrictEqual(go().slice(0, 2), [-850, 4400], 'through the chairs');
  p.run('VIEWS.kitchen.furniture().appl.children.forEach(o=>{if(o.userData.chair===true)o.userData.walkThrough=false;})');
  assert.ok(go()[0] < -850, 'they would stop it otherwise');
});

check('кухня: светильник над серединой обеденного стола — низ абажура в 800 над столешницей (MISTERHULT — в 700), шнур до чашки на потолке; сначала BLÅSVERK, нажатие меняет его по кругу: BUNKEFLO → MISTERHULT → BLÅSVERK', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const q = 'VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.pendant===true)';
  // the model, where it hangs, the cord's length and its bottom, the canopy's bottom (the ceiling less its height), what the card says
  const st = () => p.run(`(q=>{const r=v=>Math.round(v*1000),cord=q.children.find(o=>o.userData.cord===true),can=q.children.find(o=>o.userData.canopy===true);
    return [q.userData.model,r(q.position.x),r(q.position.y),r(q.position.z),r(cord.geometry.args[2]),r(cord.position.y-cord.geometry.args[2]/2),r(q.position.y+can.position.y),q.userData.walkThrough,infoOf(q.children[0]).title];})(${q})`);
  // BLÅSVERK at first, over the table's middle (650 along it, 1350 + 350 from the kitchen wall); 750 + 800; its cord from the top of its tube (180 + 280) up to the canopy (2600 − 65)
  assert.deepStrictEqual(st(), ['BLÅSVERK', 650, 1550, 1700, 525, 460, 2535, true, 'Подвесной светильник BLÅSVERK (IKEA)']);
  assert.match(p.run(`infoOf(${q}.children[0]).lines.join(' ')`), /Нажатие меняет светильник: BLÅSVERK → BUNKEFLO → MISTERHULT/);
  // a click on any piece of it changes it (engine.js: clickOf); the next one, then the third, then the first again
  assert.strictEqual(p.run(`(q=>{const o=q.children[2];o.userData={};return clickOf({object:o})===q.userData.click;})(${q})`), true);   // its userData plain, as THREE's (the stub's answers anything)
  const click = () => p.run(`${q}.userData.click()`);
  // BUNKEFLO, 800 over the tabletop too: its cord from the top of its birch (187) up to the canopy (2600 − 48)
  click(); assert.deepStrictEqual(st(), ['BUNKEFLO', 650, 1550, 1700, 815, 187, 2552, true, 'Подвесной светильник BUNKEFLO (IKEA)']);
  // MISTERHULT, 700 over it: the cord from the socket's top (400 − 50) up to the canopy (2600 − 46)
  click(); assert.deepStrictEqual(st(), ['MISTERHULT', 650, 1450, 1700, 754, 350, 2554, true, 'Подвесной светильник MISTERHULT (IKEA)']);
  click(); assert.strictEqual(st()[0], 'BLÅSVERK');
  // the one hung stays when the kitchen is built again
  click(); slide(p, 'kW', 2300); p.tick(); assert.strictEqual(st()[0], 'BUNKEFLO');
  // the plan's highest ceiling: BLÅSVERK's cord is 1100, so it goes up (3200 − 65 − 1100 − 460); MISTERHULT's 1600 is enough
  click(); click(); slide(p, 'H', 3200); p.tick();
  assert.deepStrictEqual(st().slice(0, 7), ['BLÅSVERK', 650, 1575, 1700, 1100, 460, 3135]);
  assert.match(p.run(`infoOf(${q}.children[0]).lines.join(' ')`), /низ абажура в 83 см над столешницей/);
  click(); click(); assert.deepStrictEqual(st().slice(0, 7), ['MISTERHULT', 650, 1450, 1700, 1354, 350, 3154]);
});

check('кухня: кресло MILLBERGET у письменного стола — выдвинуто и повёрнуто спинкой к окну, нажатие задвигает его под стол; обход сквозь него проходит', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const st = () => p.run(`(f=>{const d=f.doors.find(x=>x.key==="desk-chair"),c=d.g.parent;
    return [d.axis,Math.round(d.travel*1000),Math.round(c.position.x*1000),Math.round(c.position.z*1000),+c.rotation.y.toFixed(2),Math.round(d.g.position.z*1000),c.parent===f.appl,c.visible,Math.round(-d.g.children[0].rotation.y*180/Math.PI)];})(VIEWS.kitchen.furniture())`);
  // in the middle of the desk's knee space (4750 − 150 − 775 from the kitchen wall), facing the left wall; pushed in, its back's front at
  // the desk's top 20 short of its edge (650 + 20 + 287); out by 672 at first: the seat's front 150 past the desk's edge (383 + 672 − 255 = 800),
  // swivelled on its column, its back 20° toward the window
  assert.deepStrictEqual(st(), ['z', -672, 383, 3825, -1.57, -672, true, false, 20], 'pulled out; not in the kitchen tab');
  // what it is
  const info = p.run(`infoOf(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.deskChair===true).children[0].children[0]).title`);
  assert.strictEqual(info, 'Офисное кресло MILLBERGET (IKEA)');
  // the back and the headrest over it: 70 and 105 thick (35 proud in front), 490 and 500 wide, one leather; together up to its top along the back
  // (780 / cos 12°), the back's cushion 50 up into the headrest (its bottom 797 − 190)
  const hd = p.run(`(c=>{const bk=c.children[0].children[0].children.find(o=>o.isGroup!==false&&o.rotation&&Math.abs(o.rotation.x)>.1&&o.children.length>=3),[k,h]=bk.children,r=v=>Math.round(v*1000);
    return [r(k.geometry.args[2]),r(h.geometry.args[2]),r(h.position.z+h.geometry.args[2]/2),k.material===h.material,r(h.position.y+h.geometry.args[1]/2),r(k.position.y+k.geometry.args[1]/2)-r(h.position.y-h.geometry.args[1]/2),r(k.geometry.args[0]),r(h.geometry.args[0])];})(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.deskChair===true))`);
  assert.deepStrictEqual(hd, [70, 105, 35, true, 797, 50, 490, 500]);
  // a click pushes it in under the desk, another pulls it out again
  const click = () => { p.run('(d=>{d.t=d.t!==0?0:d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="desk-chair"))'); p.tick(120); };
  click(); assert.deepStrictEqual([st()[5], st()[8]], [0, 0], 'pushed in, straight');
  click(); assert.deepStrictEqual([st()[5], st()[8]], [-672, 20], 'pulled out again, swivelled');
  // a click moves it 20% slower than a cabinet front (.09 of the way left a frame): 1.2 times as long to get as far
  const k = p.run('VIEWS.kitchen.furniture().doors.find(x=>x.key==="desk-chair").ease');
  assert.strictEqual(+(Math.log(1 - .09) / Math.log(1 - k)).toFixed(3), 1.2);
  // the swivel over the last 30% of the way only, eased: straight halfway, half turned at 85%
  const at = (k) => p.run(`(d=>{d.a=d.max*${k};turnDoor(d);return Math.round(-d.g.children[0].rotation.y*180/Math.PI);})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="desk-chair"))`);
  assert.deepStrictEqual([at(.5), at(.7), at(.85), at(1)], [0, 0, 10, 20]);
  // the walker goes along the room through it (kitchen x 1100, from 3000 to 4400 from the kitchen wall), without stopping
  p.run('showView("walk")'); p.fly();
  assert.strictEqual(st()[7], true, 'in the apartment');
  const go = () => p.run('walkSlide(-.9,5,0,1.4,0,1.7).map(v=>typeof v==="number"?Math.round(v*1000):v)');
  assert.deepStrictEqual(go().slice(0, 2), [-900, 6400], 'through the chair');
  // not among what stops the walker (the stub's boxes leave out its quarter turn, so count them)
  const n = p.run('furnBoxes().length');
  p.run('VIEWS.kitchen.furniture().appl.children.forEach(o=>{if(o.userData.deskChair===true)o.userData.walkThrough=false;})');
  assert.strictEqual(p.run('furnBoxes().length'), n + 1, 'it would be one otherwise');
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
  // no cabinet fronts: the kitchen's «Открыты» leaves them; a click opens each
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click(); p.tick(120);
  assert.ok(ap().every((d) => d[4] === 0), 'not with the fronts');
  p.run('VIEWS.kitchen.furniture().doors.filter(d=>/^(oven|fridge)/.test(d.key)).forEach(d=>d.t=d.max)'); p.tick(120);
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

check('кухня: письменный стол HEMNES у левой стены — 150 от стены с окном, над надстройкой полка на кронштейнах (клик меняет её цвет), дверца открывается, ящики выдвигаются, следует «Планировке»', () => {
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
  // the wall shelf over it: 1500 × 250, 30 thick, in the middle of the desk, 300 over it
  const sh = p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),ms=[];const w=o=>{const q=o.userData&&o.userData.part;if(q&&q.name==='Полка над столом')ms.push(o);(o.children||[]).forEach(w);};w(d);
    const leg=d.children.find(o=>o.userData.part&&/^Ножка/.test(o.userData.part.name)),q=ms[0].userData.part;
    return [ms.length,q.x0,q.x1,q.y0,q.y1,q.z0,q.z1,infoOf(ms[0]).title,ms[0].material.every(m=>!leg.material.includes(m))];})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(sh, [1, 25, 1525, 1670, 1700, 4, 254, 'Настенная полка', true], '300 over the add-on unit, off the wall by the brackets; white, not the desk\'s black-brown');
  // its three brackets: 150 from its ends and in the middle, under it and down the wall
  const br = p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),ms=d.children.filter(o=>o.userData.shelfBracket===true),u=v=>[...new Set(v.map(x=>Math.round(x*1000)))].sort((a,b)=>a-b);
    return [ms.length,u(ms.map(o=>o.position.x)),u(ms.map(o=>o.position.y)),infoOf(ms[0]).title,infoOf(ms[0]).lines.some(l=>/стальной полосы 4 мм/.test(l))];})(VIEWS.kitchen.furniture())`);
  // Г-brackets, two pieces each: the centres of the arm under the board (1670 − 2) and of the upright over it (1666…1846)
  assert.deepStrictEqual(br, [6, [175, 775, 1375], [1668, 1756], 'Настенная полка', true], 'its card tells the metal\'s thickness');
  // a click on it (or on a bracket) paints it: white → oak Casella → the desk's black-brown → white; the colour stays through a rebuild
  const paint = (k) => p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),sh=d.children.find(o=>o.userData.part&&o.userData.part.name==='Полка над столом');
    const leg=d.children.find(o=>o.userData.part&&/^Ножка/.test(o.userData.part.name));
    ${k === 'bracket' ? "d.children.find(o=>o.userData.shelfBracket===true).userData.click();" : k === 'shelf' ? 'sh.userData.click();' : ''}
    const br=d.children.filter(o=>o.userData.shelfBracket===true),l=infoOf(sh).lines,ids=globalThis.__mids||(globalThis.__mids=new Map()),id=m=>ids.get(m)||(ids.set(m,ids.size+1),ids.size);
    return [sh.material.map(m=>[leg.material.includes(m)]).flat().join(''),l[0],new Set(br.map(o=>o.material)).size,id(br[0].material),sh.userData.part.info().lines.slice(-1)[0]];})(VIEWS.kitchen.furniture())`);
  // [the board as the desk's legs (each face), the card's first line, the brackets' materials: one for all, the material]
  const white = paint(), [, , , brWhite] = white;
  assert.deepStrictEqual(white.slice(0, 3).concat(white[4]), ['falsefalsefalsefalsefalsefalse', 'Белый премиум W1000 ST9, как корпуса кухни; на трёх белых стальных Г-образных кронштейнах.', 1, 'Нажатие меняет цвет: белый → дуб Каселла → как стол.']);
  const oak = paint('shelf');
  assert.deepStrictEqual(oak.slice(0, 3), ['falsefalsefalsefalsefalsefalse', 'Дуб Каселла натуральный, как столешница кухни; на трёх тёмно-серых стальных Г-образных кронштейнах.', 1]);
  assert.notStrictEqual(oak[3], brWhite, 'dark grey brackets under oak');
  const desk2 = paint('bracket');
  assert.deepStrictEqual(desk2.slice(0, 3), ['truetruetruetruetruetrue', 'Чёрно-коричневая, как стол; на трёх тёмно-серых стальных Г-образных кронштейнах.', 1]);
  assert.strictEqual(desk2[3], oak[3], 'the same dark grey under the desk\'s colour');
  p.run('showView("plan")'); p.fly(); p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(paint().slice(0, 4), desk2.slice(0, 4), 'kept through a rebuild');
  const back = paint('shelf');
  assert.deepStrictEqual(back.slice(0, 4), white.slice(0, 4), 'white again, on white brackets');
  assert.deepStrictEqual(r.doors, [['y', 0, 0], ['z', 450, 0], ['z', 450, 0], ['z', 180, 0], ['z', 180, 0]], 'a door on its hinges and two drawers, closed; the add-on unit\'s two drawers');
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(desk().doors.every((d) => d[2] === 0), 'the kitchen\'s fronts leave them');
  p.run('VIEWS.kitchen.furniture().doors.filter(x=>x.g.parent.userData.desk===true).forEach(x=>x.t=x.max)');
  assert.ok(desk().doors.every((d) => d[2] > 0), 'they open alone');
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
  assert.ok(vit().doors.every((d) => d[2] === 0), 'the kitchen\'s fronts leave them');
});

check('кухня: на письменном столе MacBook Pro 16″ — посередине, перед надстройкой; клавиатура и трекпад — картинкой на корпусе, экран — на крышке; крышка открыта на 110°, по клику закрывается и открывается; экран светится, пока открыта', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const mb = () => p.run(`(f=>{const d=f.doors.find(x=>x.key==="macbook"),pl=d.g.parent,desk=pl.parent,body=d.g.children.find(o=>o.geometry&&o.geometry.args&&o.geometry.args.length===6),lid=d.g.children[d.g.children.length-1];
    return {onDesk:desk.userData.desk===true,at:[pl.position.x,pl.position.y,pl.position.z].map(v=>+(v*1000).toFixed(2)),size:body.geometry.args.slice(0,3).map(v=>+(v*1000).toFixed(1)),
      lidSize:lid.children[0].geometry.args.slice(0,3).map(v=>+(v*1000).toFixed(1)),hinge:[lid.position.y,lid.position.z].map(v=>+(v*1000).toFixed(2)),parts:d.g.children.length,
      faces:[body,lid.children[0]].map(m=>m.material.map(x=>m.material.indexOf(x))),lidParts:lid.children.length,glow:lid.children[0].material[3].emissiveIntensity,
      offsets:[body,lid.children[0]].flatMap(m=>m.material).filter(x=>x.polygonOffset===true).length,
      max:Math.round(d.max*180/Math.PI),t:d.t,rot:+lid.rotation.x.toFixed(2),title:infoOf(body).title,
      pick:pickDoor(null,{object:body,point:new THREE.Vector3()})===d};})(VIEWS.kitchen.furniture())`);
  let r = mb();
  // desk axes: in the middle of its 1550, on its top at 740, its back 360 from the wall (the add-on unit 250 deep, the desk 650)
  assert.ok(r.onDesk, 'on the desk: it moves and hides with it');
  assert.deepStrictEqual(r.at, [597.15, 740, 360]);
  // Apple's sizes: 355.7 × 248.1, 16.8 thick — feet 1.5, the body 9.4, 0.6 for the keys, the lid 5.3 (2 shorter: the hinge)
  assert.deepStrictEqual(r.size, [355.7, 9.4, 248.1]);
  assert.deepStrictEqual(r.lidSize, [355.7, 5.3, 246.1]);
  assert.deepStrictEqual(r.hinge, [14.15, 2], 'the hinge at the back, the lid lying on the keys');
  // pictures instead of parts, nothing over a face: the body, four feet, the lid; the keyboard, the speakers and the trackpad on the
  // body's top face (its third), the glass, the display and the notch on the lid's inner one (its fourth), the rest silver
  assert.deepStrictEqual([r.parts, r.lidParts, r.offsets], [6, 1, 0]);
  assert.deepStrictEqual(r.faces, [[0, 0, 2, 0, 0, 0], [0, 0, 0, 3, 0, 0]]);
  // open from the start at 110°, its top edge in front of the add-on unit (at 362 + 246.1·cos 110° = 278 from the wall, the unit 250);
  // a click on any of it closes it
  assert.deepStrictEqual([r.max, Math.round(r.t * 180 / Math.PI), r.rot, r.title, r.pick], [110, 110, -1.92, 'MacBook Pro 16″ (Apple)', true], 'open; a click on any of it closes it');
  assert.strictEqual(r.glow, 1, 'the display alight');
  const click = () => { p.run('(d=>{d.t=d.t!==0?0:d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="macbook"))'); p.tick(120); };
  click(); r = mb(); assert.ok(Math.abs(r.rot) < .02 && r.glow === 0, 'closed, the display dark');
  // closed, it stays closed through a rebuild
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  assert.strictEqual(mb().t, 0);
  click(); assert.strictEqual(mb().rot, -1.92, 'open again');
  // no front: the kitchen's «Закрыты» leaves it open
  p.document.querySelector('[data-panel="kitchen"] [data-door="closed"]').click(); p.tick(120);
  assert.strictEqual(mb().rot, -1.92);
});

check('кухня: угловой шкаф OZON 1350 × 950 у дивана — ножка вдоль подлокотника, дверь к стене кухни; вдоль правой стены дверь углового и доп. секции; высота 2200; три двери открываются', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const wr = () => p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.wardrobe===true);
    const box=g=>{const ps=[];const w=o=>{if(o.userData&&o.userData.part&&o.userData.part.x1>o.userData.part.x0)ps.push(o.userData.part);(o.children||[]).forEach(w);};w(g);
      return [Math.min(...ps.map(q=>q.x0)),Math.max(...ps.map(q=>q.x1)),Math.min(...ps.map(q=>q.z0)),Math.max(...ps.map(q=>q.z1)),Math.min(...ps.map(q=>q.y0)),Math.max(...ps.map(q=>q.y1))];};
    const ds=f.doors.filter(x=>gs.includes(x.g.parent));
    return {groups:gs.length,boxes:gs.map(box),title:infoOf(gs[0].children[0]).title,
      doors:ds.map(x=>{const q=x.g.children[0].userData.part;return [q.name,q.pivot.x,q.pivot.z,q.pivot.s,x.t];})};})(VIEWS.kitchen.furniture())`);
  let r = wr();
  // kitchen axes: the right wall at 3200, the sofa's end toward the kitchen wall at 4750 − 150 − 2060 = 2540; the leg 950 out and 500
  // along it, the run along the wall 500 deep up to 2540 − 1350 = 1190 (its plinth reaches 32 into the leg's corner)
  assert.strictEqual(r.groups, 2, 'the leg and the run along the wall: the walk is stopped by its L');
  assert.deepStrictEqual(r.boxes, [[2250, 3200, 2040, 2540, 0, 2200], [2700, 3200, 1190, 2072, 0, 2200]]);
  assert.strictEqual(r.title, 'Угловой шкаф OZON «Уютная логика»');
  // hinged at their outer ends, away from the inner corner: the leg's toward the kitchen wall, the other two into the room
  assert.deepStrictEqual(r.doors, [
    ['Дверь углового шкафа — у дивана', 2251, 2040, 1, 0],
    ['Дверь углового шкафа — вдоль стены', 2700, 1591, -1, 0],
    ['Дверь доп. секции', 2700, 1191, -1, 0]]);
  // the corner unit as the shop's picture: on the left (along the wall) four shelves evenly behind a partition at the inner corner; on the
  // right (the leg) a shelf at the top and two rods across it, through the corner up to the wall
  const inside = p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.wardrobe===true);
    const ps=g=>{const o=[];const w=m=>{if(m.userData&&m.userData.part&&m.userData.part.x1>m.userData.part.x0)o.push(m.userData.part);(m.children||[]).forEach(w);};w(g);return o;};
    const sh=(g,re)=>ps(g).filter(q=>re.test(q.name)).map(q=>[q.y0,q.x0,q.x1,q.z0,q.z1]);
    const ext=g=>ps(g).filter(q=>/^(Планка|Дверь) углового/.test(q.name)).map(q=>[q.name,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]);
    return {stile:ext(gs[0]).concat(ext(gs[1])),left:sh(gs[1],/^Полка углового шкафа — слева/),addOn:sh(gs[1],/^Полка доп. секции/),part:sh(gs[1],/^Перегородка/),right:sh(gs[0],/^Полка углового шкафа — справа/),leftInLeg:sh(gs[0],/слева|Перегородка/).length,
      rods:gs[0].children.filter(o=>o.userData.rod===true).map(r=>[Math.round(r.position.x*1000),Math.round(r.position.y*1000),Math.round(r.position.z*1000),+(r.geometry.args[2]*1000).toFixed(0)]),
      rodsElse:gs[1].children.filter(o=>o.userData.rod===true).length};})(VIEWS.kitchen.furniture())`);
  // the stile at the inner corner: two 50 mm strips, one in each front's plane, meeting there; the doors up to them, 2 short
  assert.deepStrictEqual(inside.stile, [
    ['Планка углового шкафа — у дивана', 2650, 2700, 2040, 2056, 72, 2198],
    ['Дверь углового шкафа — у дивана', 2251, 2648, 2040, 2056, 72, 2198],
    ['Планка углового шкафа — вдоль стены', 2700, 2716, 1990, 2056, 72, 2198],
    ['Дверь углового шкафа — вдоль стены', 2700, 2716, 1591, 1988, 72, 2198]]);
  assert.deepStrictEqual(inside.left.map((q) => q[0]), [493, 916, 1338, 1761], 'between the bottom (86) and the top (2184): five equal spaces');
  assert.deepStrictEqual(inside.left[0].slice(1), [2736, 3196, 1606, 2040], 'between the corner unit\'s far side and the partition');
  assert.deepStrictEqual(inside.addOn.map((q) => q[0]), [493, 916, 1338, 1761], 'the add-on section\'s shelves as the left part\'s');
  assert.deepStrictEqual(inside.part, [[86, 2716, 3196, 2040, 2056]], 'in line with the leg\'s door');
  assert.deepStrictEqual(inside.right, [[1650, 2266, 3196, 2056, 2524]], 'on the leg\'s end (2250 + 16), the panel at the sofa and the partition: nothing in the air');
  assert.deepStrictEqual([inside.leftInLeg, inside.rodsElse], [0, 0]);
  assert.deepStrictEqual(inside.rods, [[2731, 1590, 2290, 930], [2731, 860, 2290, 930]], 'two rods: from the leg\'s end to the wall, in the middle of its depth');
  // on the leg's end (2250), into the room, in the middle of its width (2290): the mirror 400 × 400 from 1300 to 1700 in a black frame,
  // 20 out; under it the coat rail from 1170 — each with its own «i»
  const end = p.run(`(f=>{const g=f.appl.children.filter(o=>o.userData.wardrobe===true)[0],by=k=>g.children.find(o=>o.userData[k]===true),mg=by('mirror'),hg=by('hanger');
    const box=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.y-sy/2,p.y+sy/2,p.z-sz/2,p.z+sz/2].map(v=>Math.round(v*1000));};
    const ext=bs=>[0,1,2,3,4,5].map(i=>(i%2?Math.max:Math.min)(...bs.map(q=>q[i])));
    const at=o=>[o.position.x,o.position.y,o.position.z].map(v=>Math.round(v*1000));
    const balls=hg.children.filter(o=>o.userData.ball===true);
    return {frame:ext(mg.children.map(box)),glass:box(mg.children.find(o=>o.userData.glass===true)),bar:box(hg.children.find(o=>o.userData.bar===true)),
      balls:balls.map(o=>[...at(o),Math.round(o.geometry.args[0]*2000)]),wood:balls[0].material!==hg.children[0].material,
      titles:[infoOf(mg.children[0]).title,infoOf(hg.children[0]).title,infoOf(balls[0]).title]};})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(end.frame, [2230, 2250, 1300, 1700, 2090, 2490], 'on the end, 20 out');
  assert.deepStrictEqual(end.glass, [2234, 2250, 1315, 1685, 2105, 2475], 'the glass inside a 15 frame, 4 back from its face');
  // the rail: a black bar 380 × 30, 12 out, four hooks evenly along it — 40 pegs, wooden balls Ø26 on their ends
  assert.deepStrictEqual(end.bar, [2238, 2250, 1170, 1200, 2100, 2480]);
  assert.deepStrictEqual(end.balls.map((q) => [q[0], q[1], q[3]]), [[2189, 1185, 26], [2189, 1185, 26], [2189, 1185, 26], [2189, 1185, 26]]);
  assert.deepStrictEqual(end.balls.map((q) => q[2] - end.balls[0][2]), [0, 95, 190, 285], 'evenly, 95 apart');
  assert.ok(end.wood, 'the balls not black: wooden');
  assert.deepStrictEqual(end.titles, ['Зеркало', 'Настенная вешалка', 'Настенная вешалка']);
  // the plinth shows under the doors: they start 2 over its 70
  assert.deepStrictEqual(p.run(`VIEWS.kitchen.furniture().doors.filter(x=>x.g.parent.userData.wardrobe===true).map(x=>x.g.children[0].userData.part).map(q=>[q.y0,q.y1])`), [[72, 2198], [72, 2198], [72, 2198]]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(wr().doors.every((d) => d[4] === 0), 'the kitchen\'s fronts leave them');
});

check('кухня: антресоль OZON над диваном — две секции по 1000, глубина 500, от 1700 до 2200 (вровень со шкафом), от шкафа к окну; четыре двери открываются', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const mz = () => p.run(`(f=>{const g=f.appl.children.find(o=>o.userData.mezzanine===true),ps=[];
    const w=o=>{if(o.userData&&o.userData.part&&o.userData.part.x1>o.userData.part.x0)ps.push(o.userData.part);(o.children||[]).forEach(w);};w(g);
    return {box:[Math.min(...ps.map(q=>q.x0)),Math.max(...ps.map(q=>q.x1)),Math.min(...ps.map(q=>q.z0)),Math.max(...ps.map(q=>q.z1)),Math.min(...ps.map(q=>q.y0)),Math.max(...ps.map(q=>q.y1))],
      title:infoOf(g.children[0]).title,doors:f.doors.filter(x=>x.g.parent===g).map(x=>{const q=x.g.children[0].userData.part;return [q.z0,q.z1,q.pivot.z,q.pivot.s,x.t];})};})(VIEWS.kitchen.furniture())`);
  let r = mz();
  // kitchen axes: on the right wall (3200), 500 deep; from the wardrobe's side at the sofa (2540) 2000 toward the window, 210 short of it
  assert.deepStrictEqual(r.box, [2700, 3200, 2540, 4540, 1700, 2200]);
  assert.strictEqual(r.title, 'Антресоль OZON «Уютная логика»');
  // two doors a section, hinged at its ends, into the room
  assert.deepStrictEqual(r.doors, [[2541, 3039, 2541, -1, 0], [3041, 3539, 3539, 1, 0], [3541, 4039, 3541, -1, 0], [4041, 4539, 4539, 1, 0]]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(mz().doors.every((d) => d[4] === 0), 'the kitchen\'s fronts leave them');
});

check('кухня: два одинаковых металлических стеллажа на правой стене от прохода до углового шкафа — глубина 200, высота 1750, пять полок на болтах, стойки перфорированы', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const rk = () => p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.rack===true);
    const box=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.y-sy/2,p.y+sy/2,p.z-sz/2,p.z+sz/2].map(v=>Math.round(v*1000));};
    return gs.map(g=>{const bs=g.children.filter(o=>o.userData.bolt!==true).map(box),ext=[0,1,2,3,4,5].map(i=>(i%2?Math.max:Math.min)(...bs.map(q=>q[i])));
      const post=g.children.find(o=>o.userData.post===true),mats=post.material,perf=mats[4];
      return {box:[ext[0],ext[1],ext[4],ext[5],ext[2],ext[3]],posts:g.children.filter(o=>o.userData.post===true).length,
        shelves:g.children.filter(o=>o.userData.shelf===true).map(o=>box(o)[3]),bolts:g.children.filter(o=>o.userData.bolt===true).length,
        perf:mats[5]===perf&&perf.alphaTest===.5&&typeof perf.alphaMap.offset.y==='number'&&[0,1,2,3].every(i=>mats[i]!==perf),info:infoOf(g.children[0]),visible:g.visible};});})(VIEWS.kitchen.furniture())`);
  let r = rk();
  // kitchen axes: on the right wall (3200), their fronts at 3000 — in line with the end of the wall right of the way in; from the kitchen
  // wall (z 0) up to the wardrobe's add-on section (1190): 10 from each and between them, 580 each
  assert.deepStrictEqual(r.map((q) => q.box), [[3000, 3200, 10, 590, 0, 1750], [3000, 3200, 600, 1180, 0, 1750]]);
  r.forEach((q) => {
    assert.strictEqual(q.posts, 4);
    assert.deepStrictEqual(q.shelves, [70, 490, 910, 1330, 1750], 'evenly from near the floor up to the posts\' tops, 10 holes apart');
    assert.strictEqual(q.bolts, 30, 'five shelves: a bolt on the end flange of each post, on the front flange of each front post');
    assert.ok(q.perf, 'the holes in the flanges\' broad faces only');
    assert.strictEqual(q.info.title, 'Металлический стеллаж');
    assert.strictEqual(q.info.lines[0], '58 × 20 см, высота 175 см.');
    assert.strictEqual(q.visible, false, 'not in the kitchen tab: on the plan and in the walk');
  });
  // a bolt in a hole: the mask's holes 42 apart from the posts' feet (10), one at each shelf's bolt (its top − 15)
  const off = p.run(`VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.rack===true).children.find(o=>o.userData.post===true).material[4].alphaMap.offset.y`);
  [55, 475, 1735].forEach((y) => { const v = ((y - 10) / 42 + off) % 1; assert.ok(Math.abs(v - .5) < 1e-9, 'a hole at ' + y + ': ' + v); });
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(rk().map((q) => q.visible), [true, true]);
  // a longer kitchen moves the sofa and the wardrobe toward the window: the racks grow with the empty wall
  slide(p, 'kL', 5000); p.tick();
  assert.deepStrictEqual(rk().map((q) => q.box.slice(2, 4)), [[10, 715], [725, 1430]]);
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
  // a click on the box under it lifts it too, as one on the bed's drawer lays out the bed
  assert.deepStrictEqual(p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-lid"),c=d.g.parent,box=c.children.find(o=>o.geometry&&o.position.y<.3);   // its walls and legs, under the seat
    const pick=o=>(x=>x&&x.key)(pickDoor(null,{object:o,point:new THREE.Vector3()}));return [pick(box),pick(d.g.children[0])];})(VIEWS.kitchen.furniture())`), ['sofa-lid', 'sofa-lid']);
  // its upper back edge at the seat's height, at the thin back (100); the whole seat of the chaise
  assert.deepStrictEqual([r.axis, r.s, r.max, r.t, r.rot, r.inChaise, r.hinge], ['x', -1, 0.698, 0, 0, true, [450, 100]], 'closed, on its hinge in the chaise');
  assert.deepStrictEqual(r.size, [705, 170, 1430], 'the chaise\'s seat, from the thin back to its front');
  // on it, the chaise's back cushion and the throw pillow in the corner (their middles: y, z)
  assert.deepStrictEqual(r.ride, [[680, 210], [640, 385]]);
  assert.strictEqual(r.title, 'Угловой диван Hoff «Слим»');
  assert.deepStrictEqual(r.stitches, [5, 4, 4], 'stitched up its front and both its sides, 130 apart');
  assert.strictEqual(r.white, 5, 'the box white inside (flat boards besides the stitches): its bottom and four walls');
  // a click: up (its front edge rises over the seat), half as fast as a front: about 69 % of the way at 0.21 s
  // (a front: 90 %), and down again; no front, the kitchen's «Открыты» leaves it
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click(); p.tick(13);
  assert.strictEqual(lid().t, 0, 'not with the fronts');
  p.run('(d=>{d.t=d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))'); p.tick(13);
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
  p.run('(d=>{d.t=0;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))'); p.tick(120);
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
  // a click, evenly in 1.4 s: half way at 0.7 s (the drawer out, the block on its way), and back
  p.run('(d=>{d.t=d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))'); p.tick(44);
  const half = p.run('(d=>d.a/d.max)(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))');
  assert.ok(half > .45 && half < .55, 'half way: ' + half); assert.strictEqual(bed().drawer, 680);
  p.tick(156);
  r = bed(); assert.deepStrictEqual([r.t, r.drawer, r.block, r.strap], [1.45, 680, [280, 170, 0], true]);
  p.run('(d=>{d.t=0;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))'); p.tick(200);
  r = bed(); assert.deepStrictEqual([r.drawer, r.block, r.strap], [0, [75, 130, 0], false]);
  // held, the whole way in 3 s: slower than a click, as the other doors (they ease in about 0.3 s, held at 60°/s)
  p.run('held={d:VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"),dir:1}'); p.tick(94);
  const held = p.run('(d=>(held=null,d.a/d.max))(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))');
  assert.ok(held > .45 && held < .55, 'half way in 1.5 s held: ' + held);
});

check('кухня: во вкладке — только шкафы и обеденный стол со светильником (когда рамка левой стены его вмещает); стол, витрина, диван, шкаф и антресоль над диваном — на плане и в обходе', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const seen = () => p.run(`(f=>{const v=k=>f.appl.children.filter(o=>o.userData[k]===true).map(o=>o.visible);
    return {desk:v('desk'),vitrine:v('vitrine'),sofa:v('sofa'),wardrobe:v('wardrobe'),mezzanine:v('mezzanine'),table:v('table'),pendant:v('pendant'),tableDims:f.dims.children.filter(o=>o.userData.table===true).map(o=>o.visible)};})(VIEWS.kitchen.furniture())`);
  const all = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, [...new Set(v)]]));
  // the frame at 1350 at first: the table (1350…2050 from the kitchen wall) does not fit
  let r = seen();
  assert.deepStrictEqual([r.table.length, r.tableDims.length], [5, 8], 'the table: its top and four legs; four dimension lines with their labels');
  assert.deepStrictEqual(all(r), { desk: [false], vitrine: [false], sofa: [false], wardrobe: [false], mezzanine: [false], table: [false], pendant: [false], tableDims: [false] });
  const fl = p.document.getElementById('kFrameL');
  fl.value = '2049'; fl.dispatch('input'); p.tick();
  assert.deepStrictEqual(all(seen()).table, [false], 'a millimetre short');
  fl.value = '2050'; fl.dispatch('input'); p.tick();
  assert.deepStrictEqual(all(seen()), { desk: [false], vitrine: [false], sofa: [false], wardrobe: [false], mezzanine: [false], table: [true], pendant: [true], tableDims: [true] });
  // on the plan everything stands where it is
  p.run('showView("plan")'); p.fly();
  r = all(seen()); delete r.tableDims;
  assert.deepStrictEqual(r, { desk: [true], vitrine: [true], sofa: [true], wardrobe: [true], mezzanine: [true], table: [true], pendant: [true] });
});
