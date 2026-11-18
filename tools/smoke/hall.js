// Прихожая: стены и входная дверь, детали, шкаф-портал, отделка, проём с плана.
const { round, matches, runPage, PAGES, check, slide, vec, near, hallWalls, assert } = require('./harness');

check('прихожая: несущая стена с входной дверью и боковые стены, обрезанные рамкой', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  assert.strictEqual(p.run('view'), 'hall');
  // the bearing wall 200 from 100 left of the left wall to 200 right of the hall (the outer wall), the opening in it;
  // the side walls up to Sd = 650 from it; each hides from outside
  assert.deepStrictEqual(p.run(hallWalls), [
    { id: 'entry', r: [-100, 1400, -200, 0], fade: '-z' },
    { id: 'rightOuter', r: [1200, 1400, 0, 650], fade: '+x' },
    { id: 'hallBath', r: [-100, 0, 0, 650], fade: '-x' },
  ]);
  assert.deepStrictEqual(p.run('doors.map(d=>d.g.visible)'), [true, false], 'the entrance door of the model; the bathroom door is past the frame');
  const hp = p.document.querySelector('[data-panel="hall"]'), hq = (s) => hp.querySelector(s);
  assert.strictEqual(hp.hidden, false);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="hall"] #shared'), 'light and wall colour moved to the hall');
  assert.strictEqual(hq('#hFrameSdOut').textContent, 650);
  assert.strictEqual(hq('#hSub').textContent, '1200 × 2600 × 400 мм · Базовый коричневый декор');
  // the opening left between the claddings
  assert.strictEqual(hq('#h-chips').innerHTML, '<span class="chip">ширина 860 мм</span><span class="chip">высота 2000 мм</span>');
  // camera: «3/4» on the first visit at the cabinet; the mezzanine; the sun over the middle of the cabinet
  assert.deepStrictEqual(vec(p, 'goalT'), [0.6, 1.3, 0.16]);
  hq('[data-cam="mezz"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [0.6, 2.3, 0.2]);
  assert.deepStrictEqual([...vec(p, 'VIEWS.hall.sun()'), p.run('sunHalf')], [0.6, 1.3, 0, 3]);
});

check('прихожая: шкаф по стенам и проёму с «Планировки»', () => {
  // its width is the hall's, the false panel and the column reach the opening's sides (54…946, the cladding 16 into it), the mezzanine
  // sits on the opening's top (2016 less the cladding: 2600 − 2000)
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.W,f.P.Lw,f.P.Rw,f.P.Ht,f.P.Rv,f.current.parts.length])(VIEWS.hall.furniture())'), [1200, 70, 270, 600, 100, 36]);
  // the module's own starting sizes are these too
  assert.match(PAGES.app.slice(PAGES.app.indexOf('«Прихожая» view')), /^const P=\{W:1200,H:2600,D:400,Ht:600,Lw:70,Rw:270,/m);
});

check('прихожая: шкаф-портал собирается, «Состав» и размеры его меняют, проём остаётся', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  const nDoors = p.run('VIEWS.hall.furniture().current.parts.filter(x=>x.mat==="front"&&(x.hinge||x.pivot)).length');
  const h = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, P:f.P}))(VIEWS.hall.furniture())');
  let r = h();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors, 36, true], 'built on screen, every door on a hinge');
  assert.strictEqual(nDoors, 3, 'three mezzanine doors');
  // the panel: what comes from the plan, the cabinet sizes, the space between the shelves
  assert.deepStrictEqual(['W', 'Hc', 'Rv', 'Ht', 'Lw', 'Rw'].map((k) => hq('#h-' + k).textContent), ['1200 мм', '2600 мм', '100 мм', '600 мм', '70 мм', '270 мм']);
  assert.strictEqual(hq('#h-shelfGap').textContent, 'Между полками 301,3 мм · секций 6');
  assert.strictEqual(hq('#h-sizesBox').open, true, 'the sizes are open');
  // the height: from the mezzanine's least (the opening's top + 300) to the ceiling
  const hs = hq('[data-p="H"]');
  assert.deepStrictEqual([hs.min, hs.max], [2300, 2600]);
  hs.value = '2400'; hs.dispatch('input');
  r = h(); assert.deepStrictEqual([r.P.H, r.P.Ht], [2400, 400]);
  hs.value = '2100'; hs.dispatch('input');
  r = h(); assert.deepStrictEqual([r.P.H, r.P.Ht, hs.value], [2300, 300, 2300]);
  // no reveal cladding: its boards go, the false panel and the column shrink to the opening, the mezzanine goes down to it
  const rev = hq('#h-tReveal'); rev.checked = false; rev.dispatch('change');
  // (the cabinet was at its least: it grows by the board, so the mezzanine stays 300)
  r = h(); assert.deepStrictEqual([r.P.Lw, r.P.Rw, r.P.Ht, r.P.H], [54, 254, 300, 2316]);
  assert.ok(!r.parts.includes('Обрамление откоса левое'));
  assert.strictEqual(hq('#h-Lw').textContent, '54 мм');
  rev.checked = true; rev.dispatch('change');
  // thicker boards: the cladding is thicker, the false panel and the column grow with it
  hq('[data-thick="18"][data-for="T"]').click();
  r = h(); assert.deepStrictEqual([r.P.T, r.P.Lw, r.P.Rw], [18, 72, 272]);
  // no plinth: its board goes, its height is off; feet under both columns
  const pl = hq('#h-tPlinth'); pl.checked = false; pl.dispatch('change');
  r = h(); assert.ok(!r.parts.includes('Цоколь правой колонны (со стороны проёма)')); assert.strictEqual(hq('#h-Pl').disabled, true);
  const feet = hq('#h-tFeet'); feet.checked = true; feet.dispatch('change');
  assert.deepStrictEqual([h().P.Feet, h().feet], [true, 8]);
  // the mezzanine in one box: one pair of sides, the bottom, the top and the rails across, a partition between the sections;
  // the fronts and the two shelves stay
  const mz = () => p.run('VIEWS.hall.furniture().current.parts.filter(x=>/антресол/i.test(x.name)&&x.mat==="carcass").map(x=>[x.name,x.x0,x.x1])');
  const one = hq('#h-tMezzOne'); assert.strictEqual(one.checked, false);
  assert.match(PAGES.app, /створка, навешенная на неё, — на полунакладных петлях/, 'the hinges in the assumptions');
  const two = mz(), rx = h().P.W - h().P.Rw, t = h().P.T, W = h().P.W;
  assert.strictEqual(two.filter((x) => x[0].startsWith('Бок')).length, 4);
  one.checked = true; one.dispatch('change');
  r = h(); const m = mz();
  assert.strictEqual(r.P.mezzOne, true); assert.strictEqual(r.doors, nDoors);
  assert.deepStrictEqual(m.filter((x) => x[0].startsWith('Бок')).map((x) => [x[1], x[2]]), [[0, t], [W - t, W]]);
  ['Дно', 'Крышка', 'Ребро'].forEach((n) => m.filter((x) => x[0].startsWith(n)).forEach((x) => assert.deepStrictEqual([x[1], x[2]], [t, W - t], n)));
  // the partition is centred on the joint of the fronts
  const jt = p.run('VIEWS.hall.furniture().current.parts.filter(x=>x.name==="Фасад антресоли правый").map(x=>x.x0)')[0] - 1;
  assert.strictEqual(jt, rx);
  assert.deepStrictEqual(m.filter((x) => x[0] === 'Перегородка антресоли').map((x) => [x[1], x[2]]), [[rx - t / 2, rx + t / 2]]);
  assert.deepStrictEqual(m.filter((x) => x[0].startsWith('Полка')).map((x) => [x[1], x[2]]), [[t, rx - t / 2], [rx + t / 2, W - t]]);
  assert.strictEqual(two.length, 14);
  assert.strictEqual(m.length, 9);
  one.checked = false; one.dispatch('change');
  assert.deepStrictEqual(mz(), two);
});

check('прихожая: без «Шкафов» на плане — только в своей вкладке, поднимается из пола, не выше потолка', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  assert.strictEqual(p.run('VIEWS.hall.furniture().model'), null, 'not built while the hall is not in the scene');
  p.run('showView("hall")'); p.tick(25, 17);
  const m = p.run('(f=>({y:f.model.position.y, s:presence("hall")}))(VIEWS.hall.furniture())');
  near(m.s, 0.5, 'halfway'); near(m.y, -1.35, 'halfway up out of the floor');
  p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.model.visible, f.model.position.y])(VIEWS.hall.furniture())'), [true, 0]);
  p.run('showView("plan")'); p.fly();
  assert.strictEqual(p.run('VIEWS.hall.furniture().model.visible'), false, 'hidden on the plan');
  // a lower ceiling takes the cabinet down with it
  p.run('setModel({H:2500})'); p.tick();
  p.run('showView("hall")'); p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.P.H, f.P.Ht])(VIEWS.hall.furniture())'), [2500, 500]);
  assert.strictEqual(p.document.getElementById('h-Hc').textContent, '2500 мм');
});

check('прихожая: отделка, фасады, входная дверь, «Стена и дверь», размеры, деталировка, настройки по умолчанию', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'hall' } }); p.tick();
  let hp = p.document.querySelector('[data-panel="hall"]');
  const hq = (s) => hp.querySelector(s), sub = () => hq('#hSub').textContent;
  const pressed = () => hp.querySelectorAll('[data-door]').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.door);
  // finishes: brown decor on both at first; the swatch menu has the carcass and the fronts only
  assert.strictEqual(hq('[data-decor="H1386"]').querySelector('.tags').innerHTML, '<b>К</b><b>Ф</b>');
  {
    const ctx = p.document.getElementById('ctx');
    hq('[data-uc="#F1F0EA"]').dispatch('contextmenu', { clientX: 100, clientY: 100 });
    assert.deepStrictEqual(ctx.querySelectorAll('[data-where]').filter((b) => !b.hidden).map((b) => b.dataset.where), ['carcass', 'front']);
    ctx.querySelector('[data-where="front"]').click();
    assert.match(sub(), /мм · корпус — Базовый коричневый декор; фасады — Белый премиум W1000 ST9$/);
  }
  // eight dimension lines and three between the shelves (a line and a label each)
  assert.strictEqual(p.run('VIEWS.hall.furniture().dims.children.length'), 22);
  // fronts
  assert.deepStrictEqual(pressed(), ['closed']);
  hq('[data-door="open"]').click();
  assert.strictEqual(p.run('VIEWS.hall.furniture().doors.every(d=>d.t===d.max)'), true);
  hq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  // the entrance door of the model: the box opens it, a click on the door ticks the box
  const entry = hq('#h-tEntry');
  assert.strictEqual(entry.checked, false);
  entry.checked = true; entry.dispatch('change');
  assert.strictEqual(p.run('entranceDoor().t===entranceDoor().max'), true);
  p.run('(entranceDoor().t=0, doorsChanged())');
  assert.strictEqual(entry.checked, false);
  // «Стена и дверь» off: the walls, the entrance door and its swing go
  const walls = hq('#h-tWall'); walls.checked = false; walls.dispatch('change'); p.tick();
  assert.deepStrictEqual(p.run('[wallGroup.visible, doorGroup.visible, arcs.visible]'), [false, false, false]);
  walls.checked = true; walls.dispatch('change'); p.tick();
  assert.deepStrictEqual(p.run('[wallGroup.visible, doorGroup.visible]'), [true, true]);
  // cut list: every part; the same as CSV
  assert.match(hq('#h-tot').innerHTML, /^<span>36 деталей<\/span>/);
  const csv = hq('#h-csv').value.split('\n');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 36);
  // a narrow opening on the plan: the chip warns
  p.run('setModel({eD0:150, eD1:900})'); p.tick();
  assert.match(hq('#h-chips').innerHTML, /<span class="chip warn">ширина 718 мм · мало для двери 800×2000<\/span>/);
  p.run('setModel({})'); p.tick();
  // remembered: the cabinet and its finishes, without what follows the walls
  const hs = hq('[data-p="H"]'); hs.value = '2500'; hs.dispatch('input');
  hq('[data-decor="H3154"]').click();
  hq('#h-saveDef').click();
  const saved = JSON.parse(storage.get('apt-hall-v2'));
  assert.deepStrictEqual([saved.P.H, ['W', 'Lw', 'Rw', 'Ht', 'Rv'].some((k) => k in saved.P), saved.FIN.front.decor], [2500, false, 'H3154']);
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'hall' } }); p.tick();
  hp = p.document.querySelector('[data-panel="hall"]');
  assert.deepStrictEqual(p.run('(f=>[f.P.H,f.P.Ht,f.P.Lw])(VIEWS.hall.furniture())'), [2500, 500, 70]);
  assert.match(sub(), /^1200 × 2500 × 400 мм · Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  hq('#h-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.H,f.P.Ht])(VIEWS.hall.furniture())'), [2600, 600]);
  assert.ok(!storage.has('apt-hall-v2'));
  assert.strictEqual(sub(), '1200 × 2600 × 400 мм · Базовый коричневый декор');
});

check('прихожая: шкаф следует проёму с «Планировки», откос — размер двери, рамка боковых стен', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  // the opening moves and grows on the plan: the false panel and the column reach its sides, the mezzanine sits on its top
  p.run('setModel({eD0:150, eD1:1000, eDH:2100})'); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.Lw,f.P.Rw,f.P.Ht])(VIEWS.hall.furniture())'), [166, 216, 516]);
  // the door frame sits as deep as the reveal; the plan's slider stops where the 70 mm frame leaves the 200 mm wall
  slide(p, 'eRv', 300); p.tick();
  assert.strictEqual(p.run('A.eRv'), 130);
  assert.deepStrictEqual([p.run('VIEWS.hall.furniture().P.Rv'), round(p.run('doors[0].g.position.z'), 3)], [130, -0.2]);
  // the side walls up to the kitchen wall: the whole bathroom doorway, so its door shows too
  p.run('showView("hall")'); p.fly();
  const sd = p.document.getElementById('hFrameSd'); sd.value = '1900'; sd.dispatch('input');
  assert.deepStrictEqual(p.run(hallWalls).find((x) => x.id === 'hallBath').r, [-100, 0, 0, 1900]);
  assert.deepStrictEqual(p.run('doors.map(d=>d.g.visible)'), [true, true]);
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-hall-v1')), { Wm: 'auto', Wh: 100, Sd: 1900, sizes: true, fronts: 'closed', dims: true, walls: true });
  // a flight to the bathroom and back
  p.run('showView("bath")'); p.fly();
  assert.strictEqual(p.run('view'), 'bath');
  p.run('showView("hall")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['hall', 3]);
});

check('прихожая: высота шкафа возвращается, когда потолок поднимают обратно', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'hall' } }); p.tick();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  const H = () => p.run('VIEWS.hall.furniture().P.H');
  const hs = hq('[data-p="H"]'); hs.value = '2500'; hs.dispatch('input');
  slide(p, 'H', 2400); p.tick();
  assert.strictEqual(H(), 2400);
  slide(p, 'H', 2700); p.tick();
  assert.strictEqual(H(), 2500, 'as chosen, not up to the ceiling');
  slide(p, 'H', 2400); p.tick();
  hq('#h-saveDef').click();
  assert.strictEqual(JSON.parse(storage.get('apt-hall-v2')).P.H, 2500);
});

check('прихожая: размеры шкафа — внутри прихожей, в 60 от стен; ширины левой и правой стоек цепочкой с проёмом', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  // each line's label (in its middle), hall mm
  const ds = p.run(`VIEWS.hall.furniture().dims.children.slice(0,16).filter((o,i)=>i%2).map(s=>[s.position.x,s.position.y,s.position.z].map(v=>Math.round(v/MM)))`);
  const W = 1200, H = 2600, D = 400, z = D + 60;
  // nothing past the cabinet's sides (0 and W: the walls)
  ds.forEach((q) => assert.ok(q[0] >= 0 && q[0] <= W, 'inside the hall: ' + q));
  // the height by the right wall, the mezzanine's by the left one, 60 in; the depth over the top by the right wall
  assert.deepStrictEqual(ds[1], [W - 60, H / 2, z]);
  assert.deepStrictEqual(ds[2], [60, (2000 + H) / 2, z], 'from the mezzanine\'s bottom (the opening\'s top less its cladding)');
  assert.deepStrictEqual(ds[7], [W - 60, H + 140, D / 2]);
  // at 260: the left column 70, the opening between the claddings 860, the right column 270 — end to end
  assert.deepStrictEqual([3, 4, 5].map((i) => ds[i]), [[35, 260, z], [70 + 430, 260, z], [W - 135, 260, z]]);
  assert.deepStrictEqual(p.run('VIEWS.hall.furniture().P.Lw + 860 + VIEWS.hall.furniture().P.Rw'), W);
});

check('прихожая: размер между полками — в правой колонне и в каждом корпусе антресоли, в целых мм, за корпусом не виден', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  const f = 'VIEWS.hall.furniture()';
  const gaps = () => p.run(`${f}.dims.userData.gaps`);
  // where each stands, hall mm: the middle of the width and depth its boards share
  const at = () => p.run(`${f}.dims.children.slice(16).filter((o,i)=>i%2).map(s=>[s.position.x,s.position.y,s.position.z].map(v=>Math.round(v/MM)))`);
  // the column; the mezzanine's central and right boxes, under their shelf
  assert.deepStrictEqual(gaps(), ['301', '276', '276']);
  assert.deepStrictEqual(at(), [[1057, 881, 200], [465, 2154, 182], [1065, 2154, 182]]);
  assert.deepStrictEqual(p.run(`(d=>d.children.map(o=>o.material.depthTest===true))(${f}.dims)`), [...Array(16).fill(false), ...Array(6).fill(true)]);
  // the mezzanine in one box: its sections, on either side of the partition
  const one = hq('#h-tMezzOne'); one.checked = true; one.dispatch('change');
  assert.deepStrictEqual(gaps(), ['301', '276', '276']);
  assert.deepStrictEqual(at().slice(1), [[469, 2154, 182], [1061, 2154, 182]]);
  const n = hq('[data-p="N"]'); n.value = '2'; n.dispatch('input');
  assert.deepStrictEqual(gaps(), ['619', '276', '276']);
});

check('прихожая: ящик для инструмента STANLEY FatMax на полу в углу у прохода на кухню — 662 × 293 × 295, в своей вкладке, когда рамка дошла до него, едет за стеной', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  const cs = () => p.run(`(f=>{const g=f.things.children.find(o=>o.userData.toolCase===true);
    const box=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.y-sy/2,p.y+sy/2,p.z-sz/2,p.z+sz/2].map(v=>Math.round(v*1000));};
    const by=k=>g.children.filter(o=>o.userData[k]===true).map(box),bs=g.children.map(box);
    return {box:[0,1,2,3,4,5].map(i=>(i%2?Math.max:Math.min)(...bs.map(q=>q[i]))),base:by('base'),body:by('body'),lid:by('lid'),grip:by('grip'),latch:by('latch'),badge:by('badge'),info:infoOf(g.children[0]),visible:g.visible};})(VIEWS.hall.furniture())`);
  let r = cs();
  // hall axes: 10 from the right wall (1200) and from the kitchen wall (1900), the latches 14 out of its front toward the hall
  assert.deepStrictEqual(r.box, [883, 1190, 0, 295, 1228, 1890]);
  assert.deepStrictEqual(r.base, [[897, 1190, 0, 40, 1228, 1890]]);
  assert.deepStrictEqual(r.body, [[901, 1186, 40, 200, 1232, 1886]], 'the grey body 4 in from the base and the lid');
  assert.deepStrictEqual(r.lid, [[897, 1190, 200, 272, 1228, 1890]]);
  assert.strictEqual(r.grip.length, 1);
  assert.deepStrictEqual(r.grip[0].slice(2), [280, 295, 1498, 1620], 'the handle folded on the lid, in its middle');
  assert.deepStrictEqual(r.latch, [[883, 887, 170, 245, 1285, 1331], [883, 887, 170, 245, 1787, 1833]], 'two latches on the front, 80 in from the ends');
  assert.deepStrictEqual(r.badge, [[894, 897, 230, 258, 1514, 1604]]);
  assert.strictEqual(r.info.title, 'Ящик для инструмента STANLEY FatMax');
  assert.strictEqual(r.info.lines[0], '662 × 293 мм, высота 295 мм; 57 л.');
  // the view's frame at first (650) does not reach it; stretched to the kitchen wall it shows
  assert.strictEqual(r.visible, false);
  const sd = hq('#hFrameSd'); sd.value = String(sd.max); sd.dispatch('input'); p.tick();
  assert.strictEqual(cs().visible, true);
  // its footprint is on the plan with the cabinet's
  assert.ok(p.run('VIEWS.hall.furniture().foot') !== null);
  // the hall grows: the box goes with the kitchen wall
  slide(p, 'hL', p.run('APT_A.hL') + 100); p.tick();
  assert.deepStrictEqual(cs().body[0].slice(4), [1332, 1986]);
});

check('входная дверь: квадратные ручки на накладках, снаружи личинка, в прихожей вертушка, ничего не выходит за откос', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  // the handle's parts on the leaf, in its holder's mm: [x0, x1, y0, y1, z0, z1]; the leaf is -eLw…0 along x (hinged at 0), 0…70 across (the hall at 70)
  const parts = p.run(`doors.find(d=>d.hole==="entry:0").g.children.filter(m=>typeof m.userData.whole==="number").map(m=>{const g=m.geometry.args,c=m.position;
    return [[c.x,g[0]],[c.y,g[1]],[c.z,g[2]]].flatMap(([v,s])=>[v-s/2,v+s/2].map(u=>Math.round(u*1000)));})`);
  const hall = parts.filter((b) => b[4] >= 70), out = parts.filter((b) => b[5] <= 0);
  assert.strictEqual(hall.length + out.length, parts.length);
  // neck, lever, plate on each side; the thumb-turn in the hall (base, wing), the key cylinder and its keyway outside
  assert.deepStrictEqual([hall.length, out.length], [5, 5]);
  const eLw = p.run('A.eD1-A.eD0-2*EF-6');
  assert.deepStrictEqual(hall[2], [55 - eLw, 105 - eLw, 830, 1070, 70, 80], 'the plate, 80 in from the free edge');
  assert.deepStrictEqual(hall[1], [72 - eLw, 202 - eLw, 992, 1008, 114, 130], 'the lever toward the hinge, 60 out');
  assert.deepStrictEqual(out[1], [72 - eLw, 202 - eLw, 992, 1008, -60, -44]);
  assert.deepStrictEqual(hall[4].slice(2), [885, 915, 86, 104], 'the thumb-turn\'s wing');
  assert.deepStrictEqual(out[3].slice(2), [882, 918, -13, -10], 'the key cylinder under the lever');
  // the hall's side: nothing past the reveal the door sits in (A.eRv)
  assert.ok(Math.max(...hall.map((b) => b[5])) - 70 < p.run('A.eRv'));
});

check('входная дверь навешена на правый косяк и открывается наружу, к лестнице', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  // the hinge 3 in from the right bar of the frame; the leaf toward the left one
  assert.strictEqual(p.run('Math.round(entranceDoor().g.position.x*1000)'), p.run('A.eD1-EF-3'));
  assert.strictEqual(p.run('Math.round((entranceDoor().g.children[0].position.x)*1000)'), p.run('-(A.eD1-A.eD0-2*EF-6)/2'));
  // opened: its free edge is out on the stairs (past the frame's outer face), by the right jamb
  p.run('(entranceDoor().t=entranceDoor().max, doorsChanged())'); for (let i = 0; i < 200; i++) p.tick();
  const [x, z] = p.run(`(()=>{const d=entranceDoor(),eLw=(A.eD1-A.eD0-2*EF-6)*MM,a=d.s*d.a;return [d.g.position.x-eLw*Math.cos(a),d.g.position.z+eLw*Math.sin(a)].map(v=>Math.round(v*1000));})()`);
  assert.ok(z < p.run('-A.eRv-ED'), 'the free edge outside');
  assert.ok(x > p.run('(A.eD0+A.eD1)/2'), 'by the right jamb');
});
