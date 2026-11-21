// Кухня: стены, детали, шкафы и техника, отделка, фасады, деталировка, настройки.
const { all, matches, runPage, DECOR_PARENT, PAGES, check, slide, kitchenWalls, vec, assert } = require('./harness');

check('кухня: стены кухни, обрезанные рамкой', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  assert.strictEqual(p.run('view'), 'kitchen');
  // the kitchen view: kitchen wall 2200 × 100 behind x 0..W; left wall 200 thick from the back of the kitchen wall to L = 1350
  assert.deepStrictEqual(p.run(kitchenWalls), [
    { id: 'leftOuter', r: [-2250, -2050, 1900, 3350], fade: '-x' },
    { id: 'kitchen', r: [-2050, 150, 1900, 2000], fade: '-z' },
  ]);
  assert.deepStrictEqual(p.run('[wallParts.length, doors.map(d=>d.g.visible)]'), [2, [false, false]], 'two wall pieces, no doors, no window');
  const kp = p.document.querySelector('[data-panel="kitchen"]');
  assert.strictEqual(kp.hidden, false); assert.strictEqual(p.document.querySelector('[data-panel="plan"]').hidden, true);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="kitchen"] #shared'), 'light and wall colour moved to the kitchen');
  assert.strictEqual(kp.querySelector('#kFrameLOut').textContent, 1350);
  // camera: «3/4» on the first visit, at the kitchen's cabinets (its origin on the plan −2050, 2000)
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.2, 1.3, 2.45]); assert.deepStrictEqual(vec(p, 'cam.target'), [-1.2, 1.3, 2.45]);
  kp.querySelector('[data-cam="sink"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.825, 0.9, 2.3]);
});

check('кухня: рамка левой стены, переходы и размеры с «Планировки»', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  const fl = p.document.getElementById('kFrameL');
  fl.value = '2000'; fl.dispatch('input');
  assert.deepStrictEqual(p.run(kitchenWalls)[0].r, [-2250, -2050, 1900, 4000]);
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
  slide(p, 'bW', 2050);
  p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.925, 0.9, 2.3], 'sink target, kitchen moved 100 left');
  assert.deepStrictEqual(p.run(kitchenWalls).map((w) => w.r), [[-2350, -2150, 1900, 4650], [-2150, 150, 1900, 2000]]);
  assert.match(p.document.getElementById('kSub').textContent, /стена 2300/);
});

check('кухня: шкафы по стенам с «Планировки»', () => {
  // the kitchen wall, the ceiling, the left and right walls, the desk against the window wall or not: the plan's; the module's own starting sizes are these too
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.W,f.P.H,f.P.L,f.P.Rx,f.P.DeskWall,f.current.parts.length])(VIEWS.kitchen.furniture())'), [2200, 2600, 4600, 3250, false, 65]);
  assert.match(PAGES.app, /^const P=\{W:2200,H:2600,.*,L:4600,Rx:3250,WinS:800,DeskWall:false,WardBack:false\};$/m);
});

check('кухня: шкафы и техника собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kp = p.document.querySelector('[data-panel="kitchen"]'), kq = (s) => kp.querySelector(s);
  const nDoors = p.run('VIEWS.kitchen.furniture().current.parts.filter(x=>x.mat==="front"&&(x.hinge||x.pivot)).length');
  const k = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.length, visible:f.model&&f.model.visible, P:f.P}))(VIEWS.kitchen.furniture())');
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
  assert.strictEqual(k().doors, nDoors + 32, 'every front still opens');
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
  slide(p, 'bW', 2050); p.tick();
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
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().doors.filter(d=>d.loose).length'), 32, 'the oven, the fridge 3, the wall shelf 3, 4 chairs, the desk chair, the laptop, the sofa 2, the desk 5, the display cabinet 5, the wardrobe 3, the mezzanine 4');
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
      boxes:a.filter(o=>o.geometry&&o.geometry.kind==='THREE.BoxGeometry'&&mm(o.geometry.args[0])===340).length,
      steel:rim.material===bowl.material&&rim.material.metalness>=.7,
      mixer:(q=>({chrome:q.every(o=>o.material===q[0].material)&&q[0].material!==rim.material&&q[0].material.metalness>=.9,bend:q.filter(o=>o.geometry.kind==='THREE.TorusGeometry').length,
        spout:(o=>[mm(o.position.x),mm(o.position.z+o.geometry.args[2]/2*Math.sin(-o.rotation.x)),mm(o.position.y-o.geometry.args[2]/2*Math.cos(o.rotation.x))])(q[q.length-1]),
        lean:Math.round(-q[q.length-1].rotation.x*180/Math.PI),foot:mm(q[0].position.z+q[0].geometry.args[0])}))(a.filter(o=>o.userData.mixer===true))};})(VIEWS.kitchen.furniture())`);
  let r = sink();
  // the sink in the middle of the first base cabinet (450): its bowl 340 × 380 round z 300, the worktop cut out under it (its top face
  // on a 3 × 3 grid, the middle cell left out)
  assert.deepStrictEqual(r.hole, [225 - 170, 225 + 170, 300 - 190, 300 + 190]);
  assert.deepStrictEqual(r.grid, [3, 1, 3]);
  // the rim 10 thick from 6 over the worktop, the bowl's walls from there to 170 under its top; no solid box for a bowl any more
  assert.deepStrictEqual(r.rim, ['THREE.ExtrudeGeometry', 10, 225, r.ct + 6, 300]);
  assert.deepStrictEqual(r.bowl, ['THREE.ExtrudeGeometry', 176, r.ct + 6]);
  assert.ok(r.steel, 'the rim and the bowl are one stainless steel');
  // the mixer chrome as the shower rack, not the sink's steel: on the worktop behind the rim (its foot clear of it, the rim from
  // 300 − 220), bent up into the arm and down into the spout; the spout over the bowl (z 110…490), in line with the sink's middle
  assert.ok(r.mixer.chrome, 'the mixer is chrome');
  assert.strictEqual(r.mixer.bend, 2, 'up into the arm, down into the spout');
  assert.ok(r.mixer.foot < 80, 'the mixer\'s foot stays off the rim');
  // its drawing: the water out 210 from the tube's axis (z 50), at 259 over the worktop
  assert.deepStrictEqual(r.mixer.spout, [225, 260, r.ct + 259]);
  assert.strictEqual(r.mixer.lean, 8, 'the spout leans out by 8°, as on the drawing');
  assert.ok(r.mixer.spout[1] > 110 && r.mixer.spout[1] < 490, 'the spout over the bowl');
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

check('кухня: стол у левой стены — 1340 от стены кухни (по правилу обеденной зоны при длине 4600), 700 вдоль стены, 1300 в комнату, столешница 30 мм на высоте 750', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // the kitchen's origin on the plan: −2050, 2000; the table's top and legs among the appliances, in the walker's way
  const r = p.run(`furnBoxes().map(b=>b.map(v=>Math.round(v*1000))).filter(b=>b[0]>=-2050&&b[1]<=-750&&b[2]>=3340&&b[3]<=4040)`);
  assert.deepStrictEqual(r.filter((b) => b[1] - b[0] === 1300), [[-2050, -750, 3340, 4040, 720, 750]], 'the top');
  assert.deepStrictEqual(r.filter((b) => b[1] - b[0] === 40).map((b) => [b[0], b[2], b[4], b[5]]),
    [[-2000, 3390, 0, 720], [-840, 3390, 0, 720], [-2000, 3950, 0, 720], [-840, 3950, 0, 720]], 'four legs 40 × 40, 50 in from the edges');
});

check('кухня: четыре стула BERGMUND у стола — задвинуты, нажатие выдвигает их из-под стола; обход сквозь них проходит', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const st = () => p.run(`(f=>f.doors.filter(d=>/^chair/.test(d.key)).map(d=>{const c=d.g.parent;
    return [d.key,d.axis,Math.round(d.travel*1000),Math.round(c.position.x*1000),Math.round(c.position.z*1000),+c.rotation.y.toFixed(2),Math.round(d.g.position.z*1000),c.parent===f.appl];}))(VIEWS.kitchen.furniture())`);
  // two along each long side (the kitchen wall's, the far one), 20 mm clear of the table's legs, 40 apart; the far ones turned round;
  // all pushed in at first, the seat's front 10 short of the table's middle (1690 from the kitchen wall); pulled out by 420 (the seat's front 80 past the table's edge),
  // the far ones by 360: 540 to the display cabinet, the chair 520 deep
  assert.deepStrictEqual(st(), [
    ['chair0', 'z', -420, 110, 1160, 0, 0, true], ['chair1', 'z', -420, 670, 1160, 0, 0, true],
    ['chair2', 'z', -360, 630, 2220, 3.14, 0, true], ['chair3', 'z', -360, 1190, 2220, 3.14, 0, true]]);
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
  // BLÅSVERK at first, over the table's middle (650 along it, 1340 + 350 from the kitchen wall); 750 + 800; its cord from the top of its tube (180 + 280) up to the canopy (2600 − 65)
  assert.deepStrictEqual(st(), ['BLÅSVERK', 650, 1550, 1690, 525, 460, 2535, true, 'Подвесной светильник BLÅSVERK (IKEA)']);
  // the card: price and Ozon link of each, which of three, and «next» hangs the next one and gives its card
  const cd = () => p.run(`(i=>[i.price,i.url,i.shop,i.variant.join('/'),typeof i.next])(infoOf(${q}.children[0]))`);
  assert.deepStrictEqual(cd(), [3500, 'https://ozon.ru/t/GAWH6H0', 'Ozon', '1/3', 'function']);
  assert.strictEqual(p.run(`(i=>{const n=i.next();return n.title+n.price+n.variant.join('/');})(infoOf(${q}.children[0]))`), 'Подвесной светильник BUNKEFLO (IKEA)50002/3');
  assert.deepStrictEqual(cd(), [5000, 'https://ozon.ru/t/dwjZCNy', 'Ozon', '2/3', 'function']);
  p.run(`infoOf(${q}.children[0]).next()`);
  assert.deepStrictEqual(cd(), [9000, 'https://ozon.ru/t/EIG8Q2j', 'Ozon', '3/3', 'function']);
  p.run(`infoOf(${q}.children[0]).next()`);
  assert.strictEqual(st()[0], 'BLÅSVERK');
  // a click on any piece of it changes it (engine.js: clickOf); the next one, then the third, then the first again
  assert.strictEqual(p.run(`(q=>{const o=q.children[2];o.userData={};return clickOf({object:o})===q.userData.click;})(${q})`), true);   // its userData plain, as THREE's (the stub's answers anything)
  const click = () => p.run(`${q}.userData.click()`);
  // BUNKEFLO, 800 over the tabletop too: its cord from the top of its birch (187) up to the canopy (2600 − 48)
  click(); assert.deepStrictEqual(st(), ['BUNKEFLO', 650, 1550, 1690, 815, 187, 2552, true, 'Подвесной светильник BUNKEFLO (IKEA)']);
  // MISTERHULT, 700 over it: the cord from the socket's top (400 − 50) up to the canopy (2600 − 46)
  click(); assert.deepStrictEqual(st(), ['MISTERHULT', 650, 1450, 1690, 754, 350, 2554, true, 'Подвесной светильник MISTERHULT (IKEA)']);
  click(); assert.strictEqual(st()[0], 'BLÅSVERK');
  // the one hung stays when the kitchen is built again
  click(); slide(p, 'bW', 2050); p.tick(); assert.strictEqual(st()[0], 'BUNKEFLO');
  // the plan's highest ceiling: BLÅSVERK's cord is 1100, so it goes up (3200 − 65 − 1100 − 460); MISTERHULT's 1600 is enough
  click(); click(); slide(p, 'H', 3200); p.tick();
  assert.deepStrictEqual(st().slice(0, 7), ['BLÅSVERK', 650, 1575, 1690, 1100, 460, 3135]);
  assert.match(p.run(`infoOf(${q}.children[0]).lines.join(' ')`), /низ абажура в 83 см над столешницей/);
  click(); click(); assert.deepStrictEqual(st().slice(0, 7), ['MISTERHULT', 650, 1450, 1690, 1354, 350, 3154]);
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

check('кухня: над обеденным столом на левой стене — полка с ящиками 600 × 900 × 120, оливковая: вагонка, три полки, три ящика с белыми ручками, фигурные карниз, гребень и подзор', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const sp = () => p.run(`(f=>{const q=f.appl.children.find(o=>o.userData.spice===true),d=q.children.find(o=>o.userData.spiceModel===1),ps=[];const w=o=>{const u=o.userData&&o.userData.part;if(u&&typeof u.x0==='number')ps.push(u);(o.children||[]).forEach(w);};w(d);
    const n=r=>ps.filter(u=>r.test(u.name)).length,box=[Math.min(...ps.map(u=>u.x0)),Math.max(...ps.map(u=>u.x1)),Math.min(...ps.map(u=>u.y0)),Math.max(...ps.map(u=>u.y1)),Math.min(...ps.map(u=>u.z0)),Math.max(...ps.map(u=>u.z1))];
    const wavy=d.children.filter(o=>o.userData.wavy===true),knobs=[];const wk=o=>{if(o.userData&&o.userData.knob===true)knobs.push(o);(o.children||[]).forEach(wk);};wk(d);
    return {at:[q.position.x,q.position.y,q.position.z].map(v=>Math.round(v*1000)),turn:+q.rotation.y,x:Math.round(d.position.x*1000),box,
      boards:n(/^Вагонка/),shelves:ps.filter(u=>/^Полка/.test(u.name)).map(u=>u.y0),walls:n(/^Перегородка/),
      wavy:wavy.map(o=>Math.round(o.position.z*1000)),knobs:[knobs.length,new Set(knobs.map(o=>o.material)).size],
      doors:f.doors.filter(x=>x.g.parent===d).map(x=>[x.axis,Math.round(x.travel*1000),x.t,x.loose]),title:infoOf(d).title,
      knobInfo:infoOf(knobs[0]).title,frontInfo:infoOf(wavy[0]).title,vis:d.visible};})(VIEWS.kitchen.furniture())`);
  let r = sp();
  // kitchen axes: at the left wall, its bottom 1150 (400 over the tabletop), its middle over the table's (1340 + 700 / 2 = 1690): 1990…1390
  assert.deepStrictEqual([r.at, r.x], [[0, 1150, 1690], -300]);
  assert.strictEqual(r.turn, Math.PI / 2, 'along the left wall, its drawers into the room');
  assert.deepStrictEqual(r.box, [0, 600, 0, 900, 0, 120]);
  assert.deepStrictEqual([r.boards, r.shelves, r.walls], [6, [176, 400, 630], 2], 'six boards of the back; the shelf over the drawers and two more; two dividers between the drawers');
  assert.deepStrictEqual(r.wavy, [102, 0, 102], 'the front rail and the apron at the front, the crest at the back');
  assert.deepStrictEqual(r.knobs, [6, 1], 'a stem and a ball on each drawer, of one white ceramic');
  assert.deepStrictEqual(r.doors, [['z', 80, 0, true], ['z', 80, 0, true], ['z', 80, 0, true]], 'three drawers, closed, not the kitchen\'s fronts');
  assert.deepStrictEqual([r.title, r.knobInfo, r.frontInfo, r.vis], ['Настенная полка с ящиками', 'Настенная полка с ящиками', 'Настенная полка с ящиками', false], 'hidden at first: the tiered one hangs');
  assert.ok(p.run('infoOf(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.spice===true).children[1]).lines.some(l=>/^Низ на 115 см от пола, в 40 см над столешницей/.test(l))'));
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(sp().doors.every((d) => d[2] === 0), 'the kitchen\'s fronts leave them');
});

check('кухня: над обеденным столом сначала трёхъярусная полка 640 × 800 × 150 (карниз, фриз, вагонка, полки с бортиками на балясинах); клик меняет её на оливковую и обратно; клик по ящику — ящик; выбор переживает пересборку', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const q = 'VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.spice===true)';
  const st = () => p.run(`(q=>{const by=i=>q.children.find(o=>o.userData.spiceModel===i);return [by(1).visible,by(0).visible,infoOf(by(0)).title];})(${q})`);
  assert.deepStrictEqual(st(), [false, true, 'Настенная полка, 3 яруса'], 'the tiered one at first');
  assert.deepStrictEqual(p.run(`(q=>q.children.map(d=>{const i=infoOf(d);return [i.price,i.url,i.shop];}))(${q})`),
    [[13000, 'https://ozon.ru/t/EIGVFHm', 'Ozon'], [16000, 'https://ozon.ru/t/EIGVFHm', 'Ozon']], 'the tiered one 13 000 ₽, the olive one 16 000 ₽, on Ozon');
  // the card's link hangs the other one and gives its card (1/2, 2/2); no «click» line in the cards
  assert.deepStrictEqual(p.run(`(q=>{const i=infoOf(q.children[0]),n=i.next();return [i.lines.some(l=>/Нажатие/.test(l)),i.variant,n.title,n.variant,typeof n.next,q.children.map(d=>d.visible)];})(${q})`),
    [false, [1, 2], 'Настенная полка с ящиками', [2, 2], 'function', [false, true]]);
  assert.deepStrictEqual(p.run(`(q=>{const n=infoOf(q.children[1]).next();return [n.title,q.children.map(d=>d.visible)];})(${q})`), ['Настенная полка, 3 яруса', [true, false]], 'and back');
  const tq = p.run(`(q=>{const d=q.children.find(o=>o.userData.spiceModel===0),ps=d.children.filter(o=>o.userData.part).map(o=>o.userData.part),k=o=>d.children.filter(c=>c.userData[o]===true);
    const nm=r=>ps.filter(u=>r.test(u.name));
    return {x:Math.round(d.position.x*1000),box:[Math.min(...ps.map(u=>u.x0)),Math.max(...ps.map(u=>u.x1)),Math.max(...ps.map(u=>u.y1)),Math.max(...ps.map(u=>u.z1))],
      boards:nm(/^Вагонка/).length,shelves:nm(/^Полка/).map(u=>u.y0),rails:nm(/^Бортик/).map(u=>[u.y0,u.z0,u.z1]),
      sides:k('side').map(o=>Math.round(o.position.x*1000)),spindles:k('spindle').length,frieze:k('wavy').length,bottom:k('bottomShelf').map(o=>Math.round(o.position.y*1000))};})(${q})`);
  // its own axes: 640 along the wall from −320, 800 high, its top 150 deep; the sides 25 in from the top's ends
  assert.deepStrictEqual([tq.x, tq.box], [-320, [0, 640, 800, 150]]);
  assert.deepStrictEqual([tq.boards, tq.shelves, tq.rails], [6, [288, 506], [[350, 105, 130], [568, 105, 130]]], 'six boards of the back; two shelves, a rail 44 over each');
  assert.deepStrictEqual([tq.sides, tq.spindles, tq.frieze, tq.bottom], [[43, 615], 16, 1, [96]], 'the sides, 8 spindles under each rail, the frieze, the bottom shelf');
  // the backs of both: six boards, in each of the five grooves a tongue back from their faces — on the olive one 3 wide, 4 back; on the brown one 4 wide, 4 back
  const gr = p.run(`(q=>q.children.map(d=>{const bs=d.children.filter(o=>o.userData.part&&typeof o.userData.part.board==='number').map(o=>o.userData.part).sort((a,b)=>a.x0-b.x0),gs=d.children.filter(o=>o.userData.groove===true);
    return [bs.length,[...new Set(bs.slice(1).map((b,i)=>Math.round(b.x0-bs[i].x1)))],gs.length,[...new Set(gs.map(o=>Math.round(o.geometry.args[0]*1000)))],[...new Set(gs.map(o=>bs[0].z1-Math.round(o.geometry.args[2]*1000)))]];}))(${q})`);
  assert.deepStrictEqual(gr, [[6, [4], 5, [4], [4]], [6, [3], 5, [3], [4]]]);
  p.run(`${q}.userData.click()`);
  assert.deepStrictEqual(st().slice(0, 2), [true, false], 'a click shows the olive one');
  p.run('showView("plan")'); p.fly(); p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(st().slice(0, 2), [true, false], 'kept through a rebuild');
  p.run(`${q}.userData.click()`);
  assert.deepStrictEqual(st().slice(0, 2), [false, true], 'and back');
  // a drawer's front is a door: a click there works the drawer, not the shelf
  assert.ok(p.run(`(q=>{const d=q.children[1],h=d.children.find(o=>o.userData.front===true);return pickDoor(null,{object:h.children[0],point:new THREE.Vector3()})===VIEWS.kitchen.furniture().doors.find(x=>x.g===h);})(${q})`));
});

check('кухня: обеденная зона по длине до окна — у столешницы на 200 больше, остальное пополам (округление к витрине); письменный стол в 100 от окна или впритык (галочка на планировке); ползунок 4000–5000', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  // the room by the table's sides (from the worktop's edge, 600; to the display cabinet's front), cm on its card, and the desk's gap from the window wall, mm
  const room = (L) => { slide(p, 'kL', L); p.tick(); return p.run(`(f=>{const t=f.appl.children.find(o=>{const i=infoOf(o);return i&&i.title==='Обеденный стол';}),
    d=f.appl.children.find(o=>o.userData.desk===true);return [infoOf(t).lines[3].match(/\\d+/g).map(Number),A.kL-Math.round(d.position.z*1000)];})(VIEWS.kitchen.furniture())`); };
  assert.deepStrictEqual(room(4600), [[74, 54], 100], '1280: 740 and 540');
  assert.deepStrictEqual(room(4610), [[74, 55], 100], '1290: 740 and 550, the 5 to the display cabinet');
  assert.deepStrictEqual(room(5000), [[94, 74], 100], 'a longer room: both sides grow');
  assert.deepStrictEqual(room(4420), [[65, 45], 100], 'no threshold: the desk stays 100 from the window, the room by the table shrinks');
  // the slider goes from 4000 to 5000, no stop on the way
  const s = p.document.querySelector('[data-size="kL"]');
  assert.deepStrictEqual([s.getAttribute('min'), s.getAttribute('max')], ['4000', '5000']);
  assert.deepStrictEqual(room(4000), [[44, 24], 100]);
  assert.deepStrictEqual([p.run('A.kL'), p.document.getElementById('pSizeMsg').textContent], [4000, '']);
  // «Рабочий стол впритык к стене» on the plan: no gap, its 100 go to the dining area; kept with the sizes; off again — back
  const t = p.document.getElementById('pDeskWall');
  assert.strictEqual(t.checked, false);
  t.checked = true; t.dispatch('change');
  assert.deepStrictEqual(room(4600), [[79, 59], 0], '1380: 790 and 590');
  assert.deepStrictEqual(p.run('modelDiff()'), { deskWall: true });
  p.document.getElementById('k-saveDef').click();
  assert.ok(!('DeskWall' in JSON.parse(storage.get('apt-kitchen-v2')).P), 'not among the kitchen\'s own settings');
  t.checked = false; t.dispatch('change');
  assert.deepStrictEqual(room(4600), [[74, 54], 100]);
});

check('кухня: стулья выдвигаются не дальше своего промежутка — спинка не дальше края столешницы и витрины', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  // how far each pulls out (mm): the kitchen wall's side, the far one
  const out = (L) => { slide(p, 'kL', L); p.tick(); return p.run(`(f=>{const t=k=>Math.round(-f.doors.find(d=>d.key===k).travel*1000);return [t('chair0'),t('chair2')];})(VIEWS.kitchen.furniture())`); };
  assert.deepStrictEqual(out(5000), [420, 420], '940 and 740: both the full 80 past the table\'s edge');
  assert.deepStrictEqual(out(4600), [420, 360], '740 and 540: the far one 20 past it, its back at the display cabinet');
  assert.deepStrictEqual(out(4000), [260, 60], '440 and 240: both stay under the table by 80 and 280');
});

check('кухня: «i» у обеденного стола — его столешница в карточке; «i» у курсора, карточка по клику, цена, варианты', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // the dining table: its top's decor in the card
  const table = p.run(`(f=>{const m=f.appl.children.filter(o=>{const i=infoOf(o);return i&&i.title==='Обеденный стол';});return [m.length, infoOf(m[0]).lines];})(VIEWS.kitchen.furniture())`);
  assert.strictEqual(table[0], 5, 'its top and four legs');
  // the room by its long sides: from the worktop's edge (600) to the display cabinet's front (4600 − 100 − 1550 − 370 = 2580) less the table, 1280: 740 and 540
  assert.deepStrictEqual(table[1], ['130 × 70 см, высота 75 см, торцом к левой стене.', 'Столешница 30 мм — Дуб Каселла натуральный H1385 ST40, как у кухни.', 'Четыре стальные ножки 40 × 40 мм.',
    'Свободно по бокам: 74 см до столешницы кухни, 54 см до витрины.']);
  // a longer kitchen: the display cabinet goes with the window wall, the table splits the room again, the card follows
  p.run('showView("plan")'); p.fly(); slide(p, 'kL', 5000); p.run('showView("kitchen")'); p.fly();
  assert.strictEqual(p.run(`(f=>infoOf(f.appl.children.find(o=>{const i=infoOf(o);return i&&i.title==='Обеденный стол';})).lines[3])(VIEWS.kitchen.furniture())`),
    'Свободно по бокам: 94 см до столешницы кухни, 74 см до витрины.');
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
  // a thing on sale: its price and a link to the shop (in a new tab) under its lines
  p.run('showItemDot({title:"Полка",lines:["a"],price:16000,url:"https://ozon.ru/t/x",shop:"Ozon"},100,200)'); dot.click();
  const buy = card.children[card.children.length - 1];
  assert.deepStrictEqual([buy.className, buy.children.map((c) => c.textContent), buy.children[1].href, buy.children[1].target], ['buy', ['16\u00a0000 ₽', 'Ozon'], 'https://ozon.ru/t/x', '_blank']);
  assert.strictEqual(card.children.some((c) => c.className === 'next'), false, 'no variants: no link to the next one');
  p.key('keydown', 'Escape');
  // a thing with variants: a line under the others — which of how many, a link to the next one; it turns the card to it
  p.run('showItemDot({title:"A",lines:["a"],variant:[1,2],next:()=>({title:"B",lines:["b"],variant:[2,2],next:()=>({title:"A"})})},100,200)'); dot.click();
  const line = () => card.children.find((c) => c.className === 'next'), h3 = () => card.children.find((c) => c.tagName === 'H3').textContent;
  assert.deepStrictEqual([h3(), line().children.map((c) => c.textContent)], ['A', ['1/2', 'Следующий вариант →']]);
  line().children[1].click();
  assert.deepStrictEqual([card.hidden, h3(), line().children.map((c) => c.textContent)], [false, 'B', ['2/2', 'Следующий вариант →']]);
  p.key('keydown', 'Escape');
  // another view takes the «i» away
  p.run('showItemDot({title:"x"},10,10)'); p.run('showView("plan")'); p.tick();
  assert.strictEqual(dot.hidden, true);
});

check('кухня: во вкладке — только шкафы и обеденный стол со светильником и полкой над ним (когда рамка левой стены его вмещает); стол, витрина, диван, шкаф, антресоль и полка над диваном — на плане и в обходе', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const seen = () => p.run(`(f=>{const v=k=>f.appl.children.filter(o=>o.userData[k]===true).map(o=>o.visible);
    return {desk:v('desk'),vitrine:v('vitrine'),sofa:v('sofa'),wardrobe:v('wardrobe'),mezzanine:v('mezzanine'),sofaShelf:v('sofaShelf'),table:v('table'),pendant:v('pendant'),spice:v('spice'),tableDims:f.dims.children.filter(o=>o.userData.table===true).map(o=>o.visible)};})(VIEWS.kitchen.furniture())`);
  const all = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, [...new Set(v)]]));
  // the frame at 1350 at first: the table (1340…2040 from the kitchen wall) does not fit
  let r = seen();
  assert.deepStrictEqual([r.table.length, r.tableDims.length], [5, 8], 'the table: its top and four legs; four dimension lines with their labels');
  assert.deepStrictEqual(all(r), { desk: [false], vitrine: [false], sofa: [false], wardrobe: [false], mezzanine: [false], sofaShelf: [false], table: [false], pendant: [false], spice: [false], tableDims: [false] });
  const fl = p.document.getElementById('kFrameL');
  fl.value = '2039'; fl.dispatch('input'); p.tick();
  assert.deepStrictEqual(all(seen()).table, [false], 'a millimetre short');
  fl.value = '2040'; fl.dispatch('input'); p.tick();
  assert.deepStrictEqual(all(seen()), { desk: [false], vitrine: [false], sofa: [false], wardrobe: [false], mezzanine: [false], sofaShelf: [false], table: [true], pendant: [true], spice: [true], tableDims: [true] });
  // on the plan everything stands where it is
  p.run('showView("plan")'); p.fly();
  r = all(seen()); delete r.tableDims;
  assert.deepStrictEqual(r, { desk: [true], vitrine: [true], sofa: [true], wardrobe: [true], mezzanine: [true], sofaShelf: [true], table: [true], pendant: [true], spice: [true] });
});
