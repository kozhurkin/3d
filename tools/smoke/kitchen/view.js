// вкладка «Кухня»: стены и рамка, переходы, отделка, фасады, деталировка, размерные линии, что видно (src/js/rooms/kitchen/view.js)
const { all, matches, runPage, DECOR_PARENT, PAGES, check, slide, kitchenWalls, vec, assert } = require('../harness');

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
  const chairs = () => p.run('tt.fur().doors.filter(d=>/^chair/.test(d.key)).map(d=>d.t===d.max)');
  const ch0 = chairs();
  kq('[data-door="open"]').click();
  assert.deepStrictEqual(p.run('tt.fur().doors.filter(d=>!d.loose).every(d=>d.t===d.max)'), true);
  // only the kitchen's cabinet fronts (the dishwasher's among them); the oven and the fridge, the chairs, the sofa and the apartment's
  // furniture (the desk with its chair and laptop, the display cabinet, the wardrobe, the mezzanine) the switch leaves, and they do not unpress it
  assert.deepStrictEqual(p.run('(f=>f.doors.filter(d=>!d.loose).map(d=>d.g.parent===f.model))(tt.fur())'), Array(10).fill(true));
  assert.strictEqual(p.run('tt.fur().doors.filter(d=>d.loose).length'), 32, 'the oven, the fridge 3, the wall shelf 3, 4 chairs, the desk chair, the laptop, the sofa 2, the desk 5, the display cabinet 5, the wardrobe 3, the mezzanine 4');
  assert.ok(p.run('tt.fur().doors.filter(d=>/^(oven|fridge)/.test(d.key)).every(d=>d.t===0)'), 'the oven and the fridge stay closed');
  assert.deepStrictEqual(chairs(), ch0, 'the chairs stay as they were');
  p.run('(d=>{d.t=d.t?0:d.max;doorsChanged();})(tt.fur().doors.find(d=>d.key==="chair0"))');
  assert.deepStrictEqual(pressed(), ['open'], 'a chair moved by hand');
  kq('[data-door="closed"]').click(); assert.deepStrictEqual(chairs(), ch0.map((v, i) => i ? v : !v));
  kq('[data-door="open"]').click();
  // one front closed by hand: nothing pressed, the remembered mode stays
  p.run('(tt.fur().doors[0].t=0, doorsChanged())');
  assert.deepStrictEqual(pressed(), []); assert.strictEqual(p.run('VS.kitchen.fronts'), 'open');
  kq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  // fronts taken off; the dishwasher keeps its own door (steel, its panel), only its decor front goes
  const off = () => p.run(`(f=>{const hs=f.model.children.filter(o=>o.userData.front===true),dw=hs.filter(o=>o.userData.ownDoor===true);
    return [dw.length,hs.filter(o=>o!==dw[0]).every(o=>o.visible===false),dw[0].visible!==false,dw[0].children.map(m=>m.userData.door===true?'door':'front').join(),dw[0].children.map(m=>m.visible!==false).join()];})(tt.fur())`);
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
  assert.deepStrictEqual(p.run('(f=>[f.P.B1,f.P.Fr,f.P.W])(tt.fur())'), [600, 600, 2200]);
  assert.match(kq('#kSub').textContent, /Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  kq('#k-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.B1,f.P.Fr])(tt.fur())'), [450, 600]);
  assert.ok(!storage.has('apt-kitchen-v2'));
  assert.match(kq('#kSub').textContent, /корпус — Белый премиум W1000 ST9; фасады — Серый кашемир U702 ST9/);
});

check('кухня: размер между полками — один на навесной шкаф, за дверцами не виден, без полок — нет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kq = (s) => p.document.querySelector('[data-panel="kitchen"]').querySelector(s);
  const f = 'tt.fur()';
  // two wall cabinets and the shorter one over the hob; the mezzanines and the base cabinets have no shelf stacks
  assert.deepStrictEqual(p.run(`${f}.dims.userData.gaps`), ['343', '343', '293']);
  assert.deepStrictEqual(p.run(`(d=>d.children.slice(-6).map(o=>o.material.depthTest===true))(${f}.dims)`), Array(6).fill(true));
  const n = kq('[data-p="Nw"]'); n.value = '0'; n.dispatch('input');
  assert.deepStrictEqual(p.run(`${f}.dims.userData.gaps`), []);
  assert.ok(p.run(`${f}.dims.children.every(o=>o.material.depthTest===false)`), 'the room\'s own dimensions are seen through everything');
});

check('кухня: во вкладке — только шкафы и обеденный стол со светильником и полкой над ним (когда рамка левой стены его вмещает); стол, витрина, диван, шкаф, антресоль и полка над диваном — на плане и в обходе', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const seen = () => p.run(`(f=>{const v=k=>f.appl.children.filter(o=>o.userData[k]===true).map(o=>o.visible);
    return {desk:v('desk'),vitrine:v('vitrine'),sofa:v('sofa'),wardrobe:v('wardrobe'),mezzanine:v('mezzanine'),sofaShelf:v('sofaShelf'),table:v('table'),pendant:v('pendant'),spice:v('spice'),tableDims:f.dims.children.filter(o=>o.userData.table===true).map(o=>o.visible)};})(tt.fur())`);
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
