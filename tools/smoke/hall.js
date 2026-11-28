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
  assert.strictEqual(hq('#hSub').textContent, '1190 × 2595 × 400 мм · Базовый коричневый декор');
  // the opening left between the claddings
  assert.strictEqual(hq('#h-chips').innerHTML, '<span class="chip">ширина 860 мм</span><span class="chip">высота 2000 мм</span>');
  // camera: «3/4» on the first visit at the cabinet; the mezzanine; the sun over the middle of the cabinet
  assert.deepStrictEqual(vec(p, 'goalT'), [0.6, 1.2975, 0.16]);
  hq('[data-cam="mezz"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [0.6, 2.2975, 0.2]);
  assert.deepStrictEqual([...vec(p, 'VIEWS.hall.sun()'), p.run('sunHalf')], [0.6, 1.2975, 0, 3]);
});

check('прихожая: шкаф по стенам и проёму с «Планировки»', () => {
  // its width is the hall's, the false panel and the column reach the opening's sides (54…946, the cladding 16 into it), the mezzanine
  // sits on the opening's top (2016 less the cladding: 2595 − 2000, the cabinet 5 under the ceiling)
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.W,f.P.Lw,f.P.Rw,f.P.Ht,f.P.Rv,f.current.parts.length])(VIEWS.hall.furniture())'), [1200, 70, 270, 595, 100, 37]);
  // the module's own starting sizes are these too
  assert.match(PAGES.app.slice(PAGES.app.indexOf('«Прихожая» view')), /^const P=\{W:1200,H:2600,D:400,Ht:600,Lw:70,Rw:270,/m);
});

check('прихожая: шкаф-портал собирается, «Состав» и размеры его меняют, проём остаётся', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  const nDoors = p.run('VIEWS.hall.furniture().current.parts.filter(x=>x.mat==="front"&&(x.hinge||x.pivot)).length');
  const h = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, P:f.P}))(VIEWS.hall.furniture())');
  let r = h();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors, 37, true], 'built on screen, every door on a hinge');
  assert.strictEqual(nDoors, 3, 'three mezzanine doors');
  // the panel: what comes from the plan, the cabinet sizes, the space between the shelves
  assert.deepStrictEqual(['W', 'Hc', 'Rv', 'Ht', 'Lw', 'Rw'].map((k) => hq('#h-' + k).textContent), ['1200 мм', '2600 мм', '100 мм', '595 мм', '65 мм', '265 мм']);
  assert.strictEqual(hq('#h-shelfGap').textContent, 'Между полками 299–300 мм · секций 6');
  assert.strictEqual(hq('#h-sizesBox').open, true, 'the sizes are open');
  // the height: from the mezzanine's least (the opening's top + 300) to 5 under the ceiling
  const hs = hq('[data-p="H"]');
  assert.deepStrictEqual([hs.min, hs.max], [2300, 2595]);
  hs.value = '2400'; hs.dispatch('input');
  r = h(); assert.deepStrictEqual([r.P.H, r.P.Ht], [2400, 400]);
  hs.value = '2100'; hs.dispatch('input');
  r = h(); assert.deepStrictEqual([r.P.H, r.P.Ht, hs.value], [2300, 300, 2300]);
  // thicker boards: the cladding is thicker, the false panel and the column grow with it
  hq('[data-thick="18"][data-for="T"]').click();
  r = h(); assert.deepStrictEqual([r.P.T, r.P.Lw, r.P.Rw], [18, 72, 272]);
  // the reveal cladding, the plinth and the feet under both columns are always there: no switches for them
  assert.deepStrictEqual(['#h-tReveal', '#h-tPlinth', '#h-tFeet'].map((s) => hq(s)), [null, null, null]);
  assert.ok(['Обрамление откоса правое', 'Цоколь правой колонны (со стороны проёма)'].every((n) => r.parts.includes(n)));
  assert.deepStrictEqual([h().feet, hq('#h-Pl').disabled], [6, false]);
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
  // the carcass 5 mm in from the side walls (g)
  const g = 5, x0 = g;
  assert.deepStrictEqual(m.filter((x) => x[0].startsWith('Бок')).map((x) => [x[1], x[2]]), [[x0, x0 + t], [W - g - t, W - g]]);
  ['Дно', 'Крышка', 'Ребро'].forEach((n) => m.filter((x) => x[0].startsWith(n)).forEach((x) => assert.deepStrictEqual([x[1], x[2]], [x0 + t, W - g - t], n)));
  // the partition is centred on the joint of the fronts
  const jt = p.run('VIEWS.hall.furniture().current.parts.filter(x=>x.name==="Фасад антресоли правый").map(x=>x.x0)')[0] - 1;
  assert.strictEqual(jt, rx);
  assert.deepStrictEqual(m.filter((x) => x[0] === 'Перегородка антресоли').map((x) => [x[1], x[2]]), [[rx - t / 2, rx + t / 2]]);
  assert.deepStrictEqual(m.filter((x) => x[0].startsWith('Полка')).map((x) => [x[1], x[2]]), [[x0 + t, rx - t / 2], [rx + t / 2, W - g - t]]);
  assert.strictEqual(two.length, 14);
  assert.strictEqual(m.length, 9);
  one.checked = false; one.dispatch('change');
  assert.deepStrictEqual(mz(), two);
});

check('прихожая: шкаф целиком — корпуса и фасады — в 5 мм от боковых стен и от потолка', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  // the carcasses' and the fronts' outer box, hall mm: [x0, x1, top]; then the false panel and the column below the mezzanine
  const box = () => p.run(() => {
    const ps = tt.fur('hall').current.parts;
    const ext = (q) => [Math.min(...q.map((x) => x.x0)), Math.max(...q.map((x) => x.x1)), Math.max(...q.map((x) => x.y1))];
    const all = (m) => ps.filter((x) => x.mat === m), low = (m) => all(m).filter((x) => x.y1 <= 2000);
    return [ext(all('carcass')), ext(all('front')), ext(low('carcass')).slice(0, 2), ext(low('front')).slice(0, 2)];
  });
  const at = [[5, 1195, 2595], [5, 1195, 2595], [5, 1195], [5, 1195]];
  assert.deepStrictEqual(box(), at, 'two mezzanine boxes');
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  const one = hq('#h-tMezzOne'); one.checked = true; one.dispatch('change');
  // one box: the carcass as wide as the fronts
  assert.deepStrictEqual(box(), at, 'one box');
  const up = p.run(() => { const q = tt.fur('hall').current.parts.filter((x) => x.mat === 'carcass' && x.y0 >= 2000);
    return [Math.min(...q.map((x) => x.x0)), Math.max(...q.map((x) => x.x1)), Math.max(...q.map((x) => x.y1))]; });
  assert.deepStrictEqual(up, [5, 1195, 2595]);
  // the feet too, 8 in from the outer faces (the left column's under its side by the opening only)
  const fx = p.run(() => tt.fur('hall').current.feet.map((f) => f[0]));
  assert.deepStrictEqual([Math.min(...fx), Math.max(...fx)], [62, 1187]);
  /* their pucks (hexagons 16 across the flats): the right column's turned a flat to the wall and to the front, so they stay within
     both — from the bearing wall's face to the front's (mm, its six corners) */
  const pk = p.run(() => { const f = tt.fur('hall'), rx = f.P.W - f.P.Rw;
    return { front: f.current.Dc + f.P.TF, z: f.model.children.filter((o) => o.geometry && o.geometry.args && o.geometry.args[3] === 6 && tt.mm(o.position.x) > rx)
      .map((o) => [0, 1, 2, 3, 4, 5].map((k) => (o.position.z + o.geometry.args[0] * Math.cos(Math.PI / 3 * k + o.rotation.y)) / MM)) }; });
  assert.strictEqual(pk.z.length, 4);
  assert.ok(pk.z.every((z) => Math.min(...z) > -1e-6 && Math.max(...z) < pk.front + 1e-6), JSON.stringify(pk.z.map((z) => [Math.min(...z), Math.max(...z)])));
});

check('прихожая: без «Шкафов» на плане — только в своей вкладке, поднимается из пола, не выше потолка', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  assert.strictEqual(p.run('VIEWS.hall.furniture().model'), null, 'not built while the hall is not in the scene');
  p.run('showView("hall")'); p.tick(25, 17);
  const m = p.run('(f=>({y:f.model.position.y, s:presence("hall")}))(VIEWS.hall.furniture())');
  near(m.s, 0.5, 'halfway'); near(m.y, -1.3475, 'halfway up out of the floor');   // half the cabinet's 2595
  p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.model.visible, f.model.position.y])(VIEWS.hall.furniture())'), [true, 0]);
  p.run('showView("plan")'); p.fly();
  assert.strictEqual(p.run('VIEWS.hall.furniture().model.visible'), false, 'hidden on the plan');
  // a lower ceiling takes the cabinet down with it
  p.run('setModel({H:2500})'); p.tick();
  p.run('showView("hall")'); p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.P.H, f.P.Ht])(VIEWS.hall.furniture())'), [2495, 495]);
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
  assert.match(hq('#h-tot').innerHTML, /^<span>37 деталей<\/span>/);
  const csv = hq('#h-csv').value.split('\n');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 37);
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
  assert.match(sub(), /^1190 × 2500 × 400 мм · Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  hq('#h-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.H,f.P.Ht])(VIEWS.hall.furniture())'), [2595, 595]);
  assert.ok(!storage.has('apt-hall-v2'));
  assert.strictEqual(sub(), '1190 × 2595 × 400 мм · Базовый коричневый декор');
});

check('прихожая: шкаф следует проёму с «Планировки», откос — размер двери, рамка боковых стен', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  // the opening moves and grows on the plan: the false panel and the column reach its sides, the mezzanine sits on its top
  p.run('setModel({eD0:150, eD1:1000, eDH:2100})'); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.Lw,f.P.Rw,f.P.Ht])(VIEWS.hall.furniture())'), [166, 216, 511]);
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
  assert.strictEqual(H(), 2395, '5 under the ceiling');
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
  const W = 1200, H = 2595, D = 400, z = D + 60, r = Math.round;   // the cabinet 5 under the ceiling
  // nothing past the cabinet's sides (0 and W: the walls)
  ds.forEach((q) => assert.ok(q[0] >= 0 && q[0] <= W, 'inside the hall: ' + q));
  // the height by the right wall, the mezzanine's by the left one, 60 in; the depth over the top by the right wall
  assert.deepStrictEqual(ds[1], [W - 60, r(H / 2), z]);
  assert.deepStrictEqual(ds[2], [60, r((2000 + H) / 2), z], 'from the mezzanine\'s bottom (the opening\'s top less its cladding)');
  assert.deepStrictEqual(ds[7], [W - 60, H + 140, D / 2]);
  // the cabinet's width over it, 5 off each wall
  assert.deepStrictEqual(ds[0], [W / 2, H + 140, z]);
  // at 260: the left column 65 (5 off the wall), the opening between the claddings 860, the right column 265 — end to end
  assert.deepStrictEqual([3, 4, 5].map((i) => ds[i]), [[r(37.5), 260, z], [70 + 430, 260, z], [r(W - 5 - 132.5), 260, z]]);
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
  assert.deepStrictEqual(gaps(), ['300', '274', '274']);
  assert.deepStrictEqual(at(), [[1055, 887, 200], [468, 2153, 182], [1063, 2153, 182]]);
  assert.deepStrictEqual(p.run(`(d=>d.children.map(o=>o.material.depthTest===true))(${f}.dims)`), [...Array(16).fill(false), ...Array(6).fill(true)]);
  // the mezzanine in one box: its sections, on either side of the partition
  const one = hq('#h-tMezzOne'); one.checked = true; one.dispatch('change');
  assert.deepStrictEqual(gaps(), ['300', '274', '274']);
  assert.deepStrictEqual(at().slice(1), [[472, 2153, 182], [1059, 2153, 182]]);
  const n = hq('[data-p="N"]'); n.value = '2'; n.dispatch('input');
  assert.deepStrictEqual(gaps(), ['616', '274', '274']);
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

check('прихожая: «Раскладка» — детали на полу по изделиям, остальное убрано; повторное нажатие и уход из вкладки собирают шкаф', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const btn = p.document.querySelector('[data-panel="hall"]').querySelector('#h-layout');
  const cam0 = vec(p, 'goalT');
  // what is on screen: the cabinet's own boards, the layout, the walls, the doors, the tool box, the dimensions
  const seen = () => p.run(() => {
    const f = tt.fur('hall'), m = f.model, g = m.children.find((o) => o.userData.layout === true);
    return { cab: m.children.filter((o) => o !== f.extra && o !== f.dims && o !== f.foot && o !== g).some((o) => o.visible), lay: !!g,
      walls: wallGroup.visible, doors: doorGroup.visible, box: f.extra.visible, dims: f.dims.visible };
  });
  btn.click(); p.tick(100);
  assert.strictEqual(btn.getAttribute('aria-pressed'), 'true');
  assert.deepStrictEqual(seen(), { cab: false, lay: true, walls: false, doors: false, box: false, dims: false });
  // every board once, lying on the floor (its thinnest side up); the heaps' names; each heap apart from the next, no board over another
  const r = p.run(() => {
    const f = tt.fur('hall'), g = f.model.children.find((o) => o.userData.layout === true), ms = g.children.filter((o) => o.userData.lay);
    const ps = f.current.parts, foot = (o) => {
      const q = o.userData.part, d = [q.x1 - q.x0, q.y1 - q.y0, q.z1 - q.z0], ax = o.userData.lay.ax, c = o.position;
      // its size along x, z and up, from where its own sides turned
      const along = (k) => d[ax.findIndex((a) => a[k] !== 0)], w = along(0), dz = along(2);
      return { u: q.u, x0: tt.mm(c.x) - w / 2, x1: tt.mm(c.x) + w / 2, z0: tt.mm(c.z) - dz / 2, z1: tt.mm(c.z) + dz / 2, y: tt.mm(c.y), t: along(1),
        thin: Math.min(...d) === along(1), stands: d.indexOf(Math.min(...d)) !== 1, up: ax[1] };
    };
    return { n: ps.length, all: ps.every((q) => ms.some((o) => o.userData.part === q)), boards: ms.map(foot),
      labels: g.userData.labels.filter((s) => s.visible).length };
  });
  assert.strictEqual(r.boards.length, r.n); assert.ok(r.all);
  assert.ok(r.boards.every((b) => b.thin && Math.abs(b.y - b.t / 2) <= 1), 'on the floor, the thinnest side up');
  // a standing board as if the cabinet were tipped back: its up away from the viewer (−z), its bottom toward them
  assert.ok(r.boards.filter((b) => b.stands).every((b) => b.up.join() === '0,0,-1'));
  assert.ok(r.boards.filter((b) => !b.stands).every((b) => b.up.join() === '0,1,0'), 'a flat one stays face up');
  assert.deepStrictEqual([...new Set(r.boards.map((b) => b.u))], ['left', 'right', 'mezz', 'mezzR']);
  assert.strictEqual(r.labels, 4);
  // the reveals' cladding with what it lines: the right board with its column, the top one with the bigger mezzanine box (the left
  // reveal is the left column's side)
  assert.deepStrictEqual(p.run(() => tt.fur('hall').current.parts.filter((q) => /^Обрамление/.test(q.name)).map((q) => [q.name, q.u])),
    [['Обрамление откоса правое', 'right'], ['Обрамление откоса верхнее', 'mezz']]);
  const over = (a, b) => a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.z0 < b.z1 - 1 && b.z0 < a.z1 - 1;
  assert.ok(r.boards.every((a, i) => r.boards.every((b, j) => i === j || !over(a, b))), 'no board over another');
  const span = (u) => { const bs = r.boards.filter((b) => b.u === u); return [Math.min(...bs.map((b) => b.x0)), Math.max(...bs.map((b) => b.x1))]; };
  const order = ['left', 'right', 'mezz', 'mezzR'].map(span);
  order.slice(1).forEach((s, i) => assert.ok(s[0] - order[i][1] >= 299, 'the heaps 300 apart'));
  assert.notDeepStrictEqual(vec(p, 'goalT'), cam0, 'the camera over the layout');
  // «Фасады» while laid out: the cabinet's fronts stay away (they are on the floor)
  ['open', 'hidden', 'closed'].forEach((k) => { p.document.querySelector('[data-panel="hall"]').querySelector(`[data-door="${k}"]`).click(); p.tick();
    assert.strictEqual(seen().cab, false, '«Фасады» ' + k); });
  // again: the boards fly back, the cabinet and the rest come back, the camera goes back
  btn.click(); p.tick(100);
  assert.deepStrictEqual(seen(), { cab: true, lay: false, walls: true, doors: true, box: true, dims: true });
  assert.deepStrictEqual(vec(p, 'goalT'), cam0);
  // the mezzanine in one box: one heap of it
  const one = p.document.querySelector('[data-panel="hall"]').querySelector('#h-tMezzOne'); one.checked = true; one.dispatch('change');
  btn.click(); p.tick(100);
  assert.deepStrictEqual(p.run(() => tt.fur('hall').model.children.find((o) => o.userData.layout === true).userData.labels.map((s) => s.userData.name)),
    ['Левая стойка', 'Правая стойка', 'Антресоль']);
  // the cursor over a board, once all of them lie: its name and sizes over it, as in the cut list; off it — gone
  const c = p.document.getElementById('c'), move = (type = 'pointermove', pointerType = 'mouse') => c.dispatch(type, { pointerId: 1, clientX: 300, clientY: 200, pointerType });
  // the board's name, the texts of its dimension lines and where they are: their labels, mm from the board's middle on the floor
  const dims = () => p.run(() => { const d = tt.fur('hall').model.children.find((o) => o.userData.layout === true).userData.hover;
    if (!d) return null; const m = d.userData.of, c = m.userData.lay.to;
    return [m.userData.part.name, d.userData.texts, d.children.filter((o) => o.userData.ar).map((s) => [s.position.x - c.x, s.position.y, s.position.z - c.z].map(tt.mm))]; });
  const point = (name) => p.run((name) => { const g = tt.fur('hall').model.children.find((o) => o.userData.layout === true);
    const m = g.children.find((o) => o.userData.lay && o.userData.part.name === name); m.isLine = m.isSprite = false;   // (the stub's mesh is anything)
    ray.intersectObjects = () => [{ object: m, point: m.position }]; }, name);
  point('Задняя стенка правой колонны'); move();
  // (the panel stands on the feet: the column's height less theirs)
  const H = p.run(() => tt.fur('hall').current.Hb - tt.fur('hall').current.FL), D = p.run(() => tt.fur('hall').current.Dc), T = p.run(() => tt.fur('hall').P.T);
  // outside it, 60 off its edges at its top's height: the length by its left edge, the width in front of it; no thickness
  // (the back panel stands between the column's sides: Dc − T wide)
  assert.deepStrictEqual(dims(), ['Задняя стенка правой колонны', [H, D - T].map(String), [[-(D - T) / 2 - 60, T + 2, 0], [0, T + 2, H / 2 + 60]]]);
  // the board itself shows through (its own copies of the finish, the others' stay); off it — solid again, the same finish as before
  const look = () => p.run(() => { const g = tt.fur('hall').model.children.find((o) => o.userData.layout === true), ms = g.children.filter((o) => o.userData.lay);
    const m = ms.find((o) => o.userData.part.name === 'Задняя стенка правой колонны'), other = ms.find((o) => o !== m && o.userData.part.mat === 'carcass');
    return { see: m.material.every((x) => x.transparent === true && x.opacity === 0.35 && x.depthWrite === false), own: m.material.every((x) => !other.material.includes(x)),
      solid: !m.userData.solid }; });
  assert.deepStrictEqual(look(), { see: true, own: true, solid: false });
  p.run(() => { ray.intersectObjects = () => []; }); move(); assert.strictEqual(dims(), null, 'off the boards');
  assert.deepStrictEqual(look(), { see: false, own: false, solid: true });
  point('Полка правой колонны'); move('pointerup', 'touch'); assert.deepStrictEqual(dims()[0], 'Полка правой колонны', 'a finger: the board tapped');
  move('pointerleave', 'touch'); assert.ok(dims(), 'a finger lifted keeps it');
  move('pointerleave'); assert.strictEqual(dims(), null, 'the cursor left the scene');
  // putting it together takes it away
  point('Задняя стенка правой колонны'); move(); btn.click(); p.tick(); assert.strictEqual(dims(), null);
  btn.click(); p.tick(100);
  // away from the hall: put together at once, the button off
  p.run(() => showView('plan')); p.tick();
  assert.strictEqual(btn.getAttribute('aria-pressed'), 'false');
  assert.strictEqual(p.run(() => !!tt.fur('hall').model.children.find((o) => o.userData.layout === true)), false);
  assert.strictEqual(p.run(() => wallGroup.visible), true);
});

check('прихожая: выбранный цвет остаётся после перезагрузки, «Вернуть исходные» возвращает исходный', () => {
  const storage = new Map();
  const open = () => { const p = runPage(PAGES.app, { storage, parentWin: { appView: 'hall' } }); p.tick(); return p; };
  let p = open();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  assert.strictEqual(p.run(() => VS.hall.fin), undefined, 'nothing kept before a choice');
  const sw = hq('[data-uc]'); sw.click();
  const chosen = { type: 'uni', color: sw.dataset.uc, name: sw.dataset.un };
  // a reload: the same browser storage, the carcass and the fronts in the colour chosen, the panel shows it
  p = open();
  assert.deepStrictEqual(p.run(() => [VS.hall.fin.carcass, VS.hall.fin.front]), [chosen, chosen]);
  assert.ok(hq('#hSub').textContent.endsWith(chosen.name), 'the hall\'s line names it');
  assert.strictEqual(hq(`[data-uc="${chosen.color}"]`).getAttribute('aria-pressed'), 'true');
  // only the hall's: the bathroom keeps its own
  assert.strictEqual(p.run(() => VS.bath.fin), undefined);
  // back to the defaults: the factory finish, and it is the one kept
  hq('#h-resetDef').click();
  p = open();
  assert.deepStrictEqual(p.run(() => VS.hall.fin.front), { type: 'wood', decor: 'H1386' });
});

check('прихожая: «Антресоль одним корпусом» остаётся после перезагрузки', () => {
  const storage = new Map();
  const open = () => { const p = runPage(PAGES.app, { storage, parentWin: { appView: 'hall' } }); p.tick(); return p; };
  let p = open();
  const one = () => p.document.querySelector('#h-tMezzOne');
  assert.deepStrictEqual([one().checked, p.run(() => tt.fur('hall').P.mezzOne)], [false, false]);
  one().checked = true; one().dispatch('change');
  // a reload: the one box, the switch on
  p = open();
  assert.deepStrictEqual([one().checked, p.run(() => tt.fur('hall').P.mezzOne)], [true, true]);
  assert.ok(p.run(() => tt.fur('hall').current.parts.some((q) => q.name === 'Перегородка антресоли')));
  one().checked = false; one().dispatch('change');
  p = open();
  assert.deepStrictEqual([one().checked, p.run(() => tt.fur('hall').P.mezzOne)], [false, false]);
});

check('прихожая: отверстия крепежа — в целых мм при любых размерах', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  const odd = () => p.run(() => tt.fur('hall').current.parts.flatMap((q) => (q.holes || []).filter((h) => !h.at.every(Number.isInteger)).map((h) => q.name)));
  assert.deepStrictEqual(odd(), []);
  // a plinth not a multiple of 4, another height, thicker boards
  const set = (k, v) => { const e = hq(`[data-p="${k}"]`); e.value = String(v); e.dispatch('input'); };
  set('Pl', 55); assert.deepStrictEqual(odd(), [], 'plinth 55');
  set('H', 2510); assert.deepStrictEqual(odd(), [], 'height 2510');
  hq('[data-thick="18"][data-for="T"]').click(); assert.deepStrictEqual(odd(), [], 'boards 18');
});

check('прихожая: соединения сходятся — у каждого отверстия в торце ответное в прилегающей доске, под каждой ножкой своё, всё внутри своих досок', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  /* the faults of the cabinet's joints as they are now, independent of how they are made: what each hole is comes from FITTINGS —
     a hole in a board's end (and its mate, by kind), one from a face (the cam), or one with no mate (a foot's insert) */
  const faults = () => p.run(() => {
    const AX = 'xyz', ends = [], faces = [], solo = [], bad = [], eq = (a, b) => Math.abs(a - b) < 1e-6;
    Object.values(FITTINGS).filter((f) => f.holes).forEach((f) => f.holes.forEach((h) => {
      const m = (f.mate || []).find((x) => x.k === h.k);
      (h.from != null ? faces : m ? ends : solo).push(h.from == null && m ? { h, m } : h);
    }));
    const isEnd = (o) => ends.find((e) => e.h.k === o.k && e.h.d === o.d && e.h.depth === o.depth && !o.through);
    const isSolo = (o) => solo.find((h) => h.k === o.k && h.d === o.d && h.depth === o.depth && !o.through);
    const isMate = (o) => ends.find((e) => e.m.k === o.k && e.m.d === o.d && (e.m.through ? o.through : !o.through && e.m.depth === o.depth));
    const isFace = (o) => faces.find((h) => h.k === o.k && h.d === o.d && h.depth === o.depth);
    const hs = tt.fur('hall').current.parts.flatMap((q) => (q.holes || []).map((o) => ({ q, o, i: AX.indexOf(o.ax) })));
    const lo = (q, i) => q[AX[i] + '0'], hi = (q, i) => q[AX[i] + '1'], name = ({ q, o }) => `${q.name}: ${o.k} Ø${o.d} в [${o.at}]`;
    hs.forEach((x) => {
      const { q, o, i } = x;
      if (!isEnd(o) && !isMate(o) && !isFace(o) && !isSolo(o)) bad.push('не из FITTINGS — ' + name(x));
      // its mouth on the face it goes in from, the drill into the board, its whole width within it, no deeper than the board
      if (!eq(o.at[i], o.s > 0 ? lo(q, i) : hi(q, i))) bad.push('устье не на грани доски — ' + name(x));
      [0, 1, 2].filter((j) => j !== i).forEach((j) => { if (o.at[j] - o.d / 2 < lo(q, j) - 1e-6 || o.at[j] + o.d / 2 > hi(q, j) + 1e-6) bad.push('выходит за доску — ' + name(x)); });
      const size = hi(q, i) - lo(q, i);
      if (o.through ? !eq(o.depth, size) : o.depth >= size) bad.push(`глубина ${o.depth} при доске ${size} — ` + name(x));
    });
    // a hole in an end and its mate: one each, the same point, toward each other, in another board (touching it there: both mouths on faces)
    const pairs = new Set();
    hs.filter((x) => isEnd(x.o)).forEach((x) => {
      const e = isEnd(x.o), m = hs.filter((y) => y.q !== x.q && y.o.ax === x.o.ax && y.o.s === -x.o.s && y.o.at.every((v, j) => eq(v, x.o.at[j]))
        && y.o.k === e.m.k && y.o.d === e.m.d && (e.m.through ? y.o.through : y.o.depth === e.m.depth));
      if (m.length !== 1) bad.push(`ответных ${m.length} — ` + name(x)); else pairs.add(m[0]);
    });
    hs.filter((x) => isMate(x.o) && !pairs.has(x)).forEach((x) => bad.push('ответное без отверстия в торце — ' + name(x)));
    // a foot's insert: up into the board standing on it, right over it; one under each foot
    const { feet, FL } = tt.fur('hall').current, over = (o, [fx, fz]) => o.ax === 'y' && o.s === 1 && eq(o.at[0], fx) && eq(o.at[1], FL) && eq(o.at[2], fz);
    hs.filter((x) => isSolo(x.o) && !feet.some((ft) => over(x.o, ft))).forEach((x) => bad.push('не над ножкой — ' + name(x)));
    feet.forEach((ft) => { const n = hs.filter((x) => isSolo(x.o) && over(x.o, ft)).length; if (n !== 1) bad.push(`под ножкой [${ft}] отверстий: ${n}`); });
    // a cam reaches its screw: across the board to the screw's axis, along it over the screw's end; one screw for each cam
    hs.filter((x) => isFace(x.o)).forEach((c) => {
      const sc = hs.filter((x) => x.q === c.q && x.o.k === 'screw' && isEnd(x.o) && x.i !== c.i).filter((x) => {
        const k = 3 - x.i - c.i, t = (c.o.at[x.i] - x.o.at[x.i]) * x.o.s, dd = (x.o.at[c.i] - c.o.at[c.i]) * c.o.s;
        return t - c.o.d / 2 < x.o.depth && t + c.o.d / 2 > 0 && dd >= 0 && dd <= c.o.depth && Math.abs(c.o.at[k] - x.o.at[k]) <= (c.o.d - x.o.d) / 2;
      });
      if (sc.length !== 1) bad.push(`эксцентрик достаёт стяжек: ${sc.length} — ` + name(c));
    });
    /* no two holes of a board run into each other or leave less than 3 mm between them (as boxes d × d × depth: touching is one hole),
       but a cam and its screw. A cam's box goes past its round side, so it is left out against the others */
    const box = ({ o, i }) => [0, 1, 2].map((j) => (j === i ? [o.at[j], o.at[j] + o.s * o.depth].sort((a, b) => a - b) : [o.at[j] - o.d / 2, o.at[j] + o.d / 2]));
    hs.forEach((a, ia) => hs.forEach((b, ib) => {
      if (ib <= ia || a.q !== b.q || isFace(a.o) || isFace(b.o)) return;
      const A = box(a), B = box(b);
      if (A.every(([a0, a1], j) => a0 < B[j][1] + 3 - 1e-6 && B[j][0] < a1 + 3 - 1e-6)) bad.push(`пересекаются или ближе 3 мм — ${name(a)} и ${b.o.k} Ø${b.o.d} в [${b.o.at}]`);
    }));
    return bad;
  });
  assert.deepStrictEqual(faults(), [], 'as it starts');
  const set = (k, v) => { const e = hq(`[data-p="${k}"]`); e.value = String(v); e.dispatch('input'); };
  const one = hq('#h-tMezzOne'); one.checked = true; one.dispatch('change'); assert.deepStrictEqual(faults(), [], 'the mezzanine in one box');
  hq('[data-thick="18"][data-for="T"]').click(); assert.deepStrictEqual(faults(), [], 'carcass 18');
  hq('[data-thick="18"][data-for="TF"]').click(); assert.deepStrictEqual(faults(), [], 'fronts 18');
  [['Pl', 50], ['Pl', 55], ['Pl', 120], ['H', 2510], ['D', 300], ['N', 2], ['N', 12]].forEach(([k, v]) => { set(k, v); assert.deepStrictEqual(faults(), [], `${k} ${v}`); });
  // the plinth from 50 to 120: its slider stops there, a value past them comes within
  assert.deepStrictEqual(['min', 'max'].map((a) => hq('[data-p="Pl"]').getAttribute(a)), ['50', '120']);
  set('Pl', 200); assert.strictEqual(p.run(() => tt.fur('hall').P.Pl), 120);
  set('Pl', 40); assert.strictEqual(p.run(() => tt.fur('hall').P.Pl), 50);
});

check('прихожая: левая стойка — три ребра на шкантах, задняя стойка на конфирматах и шкантах, бок к лицевой панели на шкантах со стяжками', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const r = p.run(() => {
    const f = tt.fur('hall'), ps = f.current.parts, one = (n) => ps.find((q) => q.name === n);
    return { T: f.P.T, Lw: f.P.Lw, Dc: f.current.Dc, Hb: f.current.Hb, FL: f.current.FL,
      ribs: ps.filter((q) => /^Ребро левой/.test(q.name)).map((q) => ({ name: q.name, box: [q.x0, q.x1, q.y0, q.y1, q.z0, q.z1], holes: q.holes })),
      side: one('Бок левой фальш-панели (со стороны проёма)').holes, front: one('Левая фальш-панель (лицевая, глухая)').holes,
      post: (q => ({ box: [q.x0, q.x1, q.y0, q.y1, q.z0, q.z1], holes: q.holes }))(one('Задняя стойка левой фальш-панели')),
      // in the scene: a dark cylinder for each hole of the column's board
      meshes: tt.meshes(f.model, (q) => q.holes && /левой фальш-панели|Левая фальш-панель/.test(q.name)).map((m) => m.children.filter((o) => o.userData.hole).length) };
  });
  const { T, Lw, Dc, Hb, FL } = r, xs = Lw - T, xm = Math.round((5 + xs) / 2), ys = [FL, Math.round((FL + Hb - T) / 2), Hb - T];
  // the side lines the opening's reveal too: from the door frame (Rv into the opening) to the front, on the feet; no board of its own
  assert.deepStrictEqual(p.run(() => tt.box(tt.fur('hall').current.parts.filter((q) => /^Бок левой/.test(q.name)), 'xzy')), [xs, Lw, -100, Dc, FL, Hb]);
  assert.ok(!p.run(() => tt.fur('hall').current.parts.some((q) => q.name === 'Обрамление откоса левое')));
  /* between the wall (5 mm off it) and the side, the whole depth: at the bottom (on the feet), in the middle, at the top; the middle one
     in front of the back post (by the bearing wall, from the bottom rib to the top one, as wide as they are) */
  const z0 = [0, T, 0];
  assert.deepStrictEqual(r.ribs.map((q) => [q.name, q.box]),
    ['нижнее', 'среднее', 'верхнее'].map((n, i) => ['Ребро левой фальш-панели — ' + n, [5, xs, ys[i], ys[i] + T, z0[i], Dc]]));
  assert.deepStrictEqual(r.post.box, [5, xs, FL + T, Hb - T, 0, T]);
  // Ø8 × 22 in the rib, 100 from its ends; Ø8 × 13 in the side (from its inner face) and in the front (from its back)
  const d = (at, ax, s, depth) => ({ k: 'dowel', at, ax, s, d: 8, depth });
  const cf = (at, ax, s) => ({ k: 'confirmat', at, ax, s, d: 5, depth: 40 }), thru = (at, ax, s) => ({ k: 'confirmat', at, ax, s, d: 8, depth: T, through: true });
  const y0 = FL + T, y1 = Hb - T, ym = ys[1] + T / 2;
  r.ribs.forEach((q, i) => assert.deepStrictEqual(q.holes, [d([xs, ys[i] + T / 2, z0[i] + 100], 'x', -1, 22), d([xs, ys[i] + T / 2, Dc - 100], 'x', -1, 22),
    d([xm, ys[i] + T / 2, Dc], 'z', -1, 22),
    // the confirmats: through the bottom rib from below and the top one from above into the post's ends; through the post into the middle one's end
    ...[[thru([xm, y0, T / 2], 'y', -1)], [cf([xm, ym, T], 'z', 1)], [thru([xm, y1, T / 2], 'y', 1)]][i]], q.name));
  // the post: four dowels into the side, 100 from its ends and two evenly between; the confirmats (Ø5 × 40) in its ends, through it (Ø8) the middle rib's
  const py = [0, 1, 2, 3].map((i) => y0 + 100 + Math.round(i * (y1 - y0 - 200) / 3));
  assert.deepStrictEqual(r.post.holes, [...py.map((y, i) => d([xs, y, T / 2], 'x', -1, 22)), cf([xm, y0, T / 2], 'y', 1), cf([xm, y1, T / 2], 'y', -1),
    thru([xm, ym, T], 'z', -1)]);
  /* the side into the front by its front end: four dowels with cam fittings, 100 from its bottom and top and two evenly between —
     the screw (Ø8 × 30) in the end, 34 from it the cam (Ø15 × 13) from inside the panel, 32 toward the side's middle the dowel;
     their mates in the front: Ø5 × 13 and Ø8 × 13 */
  const xc = Lw - T / 2, cy = [0, 1, 2, 3].map((i) => FL + 100 + Math.round(i * (Hb - FL - 200) / 3)), mi = (i) => (i < 2 ? 32 : -32);
  assert.deepStrictEqual(r.side.slice(0, 12), cy.flatMap((y, i) => [{ k: 'screw', at: [xc, y, Dc], ax: 'z', s: -1, d: 8, depth: 30 },
    { k: 'cam', at: [xs, y, Dc - 34], ax: 'x', s: 1, d: 15, depth: 13 }, d([xc, y + mi(i), Dc], 'z', -1, 22)]));
  assert.deepStrictEqual(r.front.slice(0, 8), cy.flatMap((y, i) => [{ k: 'screw', at: [xc, y, Dc], ax: 'z', s: 1, d: 5, depth: 13 },
    d([xc, y + mi(i), Dc], 'z', 1, 13)]));
  // the ribs' mates, the post's; then the feet's inserts (Ø10 × 16 from below): at the back 8 in from the bearing wall, 32 in from the front
  assert.deepStrictEqual(r.side.slice(-2), [[Lw - 8, FL, 8], [Lw - 8, FL, Dc + 16 - 32]].map((at) => ({ k: 'foot', at, ax: 'y', s: 1, d: 10, depth: 16 })));
  assert.deepStrictEqual(r.side.slice(12, -2), [...ys.flatMap((y, i) => [z0[i] + 100, Dc - 100].map((z) => d([xs, y + T / 2, z], 'x', 1, 13))),
    ...py.map((y) => d([xs, y, T / 2], 'x', 1, 13))]);
  assert.deepStrictEqual(r.front.slice(8), ys.map((y) => d([xm, y + T / 2, Dc], 'z', 1, 13)));
  assert.deepStrictEqual(r.meshes, [24, 11, 4, 4, 4, 7]);
});

check('прихожая: крепёж правой стойки — шканты, шканты со стяжками, конфирматы и ответные отверстия', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const r = p.run(() => {
    const f = tt.fur('hall'), ps = f.current.parts.filter((q) => /правой колонны/.test(q.name) && /^(Дно|Полка|Крышка|Цоколь)/.test(q.name));
    return { T: f.P.T, rx: f.P.W - f.P.Rw, xb: f.P.W - 5, Dc: f.current.Dc, N: f.P.N,
      parts: ps.map((q) => ({ name: q.name, y: q.y0, holes: q.holes || [] })),
      // in the scene: a dark cylinder for each hole of the column's board
      meshes: tt.meshes(f.model, (q) => q.holes && /правой колонны/.test(q.name)).map((m) => m.children.filter((o) => o.userData.hole).length) };
  });
  const { T, rx, xb, Dc } = r, x0 = rx + 50, x1 = xb - T - 50, ends = [[T, 1], [Dc, -1]];
  const shelves = r.parts.filter((q) => q.name === 'Полка правой колонны');
  assert.strictEqual(shelves.length, r.N);
  // a shelf: a dowel 50 in from the left and the right edge of its back end (on the side by the bearing wall) and of its front one (on the front side)
  shelves.forEach((q) => assert.deepStrictEqual(q.holes, ends.flatMap(([z, s]) => [x0, x1].map((x) => ({ k: 'dowel', at: [x, q.y + T / 2, z], ax: 'z', s, d: 8, depth: 22 })))));
  // the bottom and the top: at 50 the screw (Ø8 × 30), 34 from the end over it the cam (Ø15 × 13) from outside the column — the bottom's
  // from below, the top's from above; 32 toward the middle the dowel
  const cam = (q, up) => ends.flatMap(([z, s]) => [[x0, 1], [x1, -1]].flatMap(([x, i]) => [
    { k: 'screw', at: [x, q.y + T / 2, z], ax: 'z', s, d: 8, depth: 30 },
    { k: 'cam', at: [x, up ? q.y + T : q.y, z + s * 34], ax: 'y', s: up ? -1 : 1, d: 15, depth: 13 },
    { k: 'dowel', at: [x + i * 32, q.y + T / 2, z], ax: 'z', s, d: 8, depth: 22 }]));
  const [bottom, top] = ['Дно правой колонны', 'Крышка правой колонны'].map((n) => r.parts.find((q) => q.name === n));
  // and two confirmats (Ø5 × 40) in the end on the back panel, 100 from its ends
  const conf = (q) => [T + 100, Dc - 100].map((z) => ({ k: 'confirmat', at: [xb - T, q.y + T / 2, z], ax: 'x', s: -1, d: 5, depth: 40 }));
  assert.deepStrictEqual(bottom.holes.slice(0, -2), [...cam(bottom, false), ...conf(bottom)]);   // (and the plinth's mates: below)
  assert.deepStrictEqual(top.holes, [...cam(top, true), ...conf(top)]);
  // the side by the bearing wall and the front side lap over the back panel's ends alike (to the cabinet's edge), the back panel stands between them
  assert.deepStrictEqual(p.run(() => ['Задняя стенка правой колонны', 'Боковина правой колонны у несущей стены', 'Фасадная боковина правой колонны']
    .map((n) => tt.box([tt.fur('hall').current.parts.find((q) => q.name === n)], 'xz'))), [[xb - T, xb, T, Dc], [rx, xb, 0, T], [rx, xb, Dc, Dc + T]]);
  /* their mates in the side by the bearing wall (from its inner face back) and in the front side (from its inner face out): the back panel's
     cam screws (Ø5 × 13) and dowels (Ø8 × 13), then bottom up the plinth's dowels, the bottom's and the top's, the shelves' */
  const panels = p.run(() => ['Боковина правой колонны у несущей стены', 'Фасадная боковина правой колонны'].map((n) => tt.fur('hall').current.parts.find((q) => q.name === n).holes));
  const h = (k, d, at, s) => ({ k, at, ax: 'z', s, d, depth: 13 }), pq = r.parts.find((q) => /^Цоколь/.test(q.name));
  // (on the feet: from FL up)
  const Hb = p.run(() => tt.fur('hall').current.Hb), FL = p.run(() => tt.fur('hall').current.FL), sy = [[FL + 500, 1], [Hb - 500, -1]];
  const mates = (z, s) => [
    ...sy.flatMap(([y, i]) => [h('screw', 5, [xb - T / 2, y, z], s), h('dowel', 8, [xb - T / 2, y + i * 32, z], s)]),
    ...[20, 60].map((y) => h('dowel', 8, [rx + T / 2, pq.y + y, z], s)),
    ...[bottom, ...shelves, top].flatMap((q) => [[x0, 1], [x1, -1]].flatMap(([x, i]) => q === bottom || q === top
      ? [h('screw', 5, [x, q.y + T / 2, z], s), h('dowel', 8, [x + i * 32, q.y + T / 2, z], s)] : [h('dowel', 8, [x, q.y + T / 2, z], s)]))];
  /* and in the side by the bearing wall, from its outer face, the right reveal's cladding's: it meets the side by its end — 150 from its
     bottom (on the feet) and top a dowel and a cam fitting, the cam (Ø15 × 13) from the opening's wall, 34 from the end, the dowel 32 toward
     the middle; three dowels (Ø8 × 22) evenly between */
  const rv = [0, 1, 2, 3, 4].map((i) => FL + 150 + Math.round(i * (Hb - FL - 300) / 4)), at0 = (y) => [rx + T / 2, y, 0], mi = (i) => (i ? -32 : 32);
  assert.deepStrictEqual(panels.map((q) => q.slice(0, -2)), [[...mates(T, -1), ...rv.flatMap((y, i) => (i % 4 ? [h('dowel', 8, at0(y), 1)]
    : [h('screw', 5, at0(y), 1), h('dowel', 8, at0(y + mi(i)), 1)]))], mates(Dc, 1)]);
  /* and last the feet's inserts (Ø10 × 16 from below), 8 in from the outer faces: by the opening they would come within 3 mm of the
     plinth's dowels, so they go in two 8 mm steps — 24 in */
  assert.deepStrictEqual(panels.map((q) => q.slice(-2)), [8, Dc + 16 - 8].map((z) => [rx + 24, xb - 8].map((x) =>
    ({ k: 'foot', at: [x, FL, z], ax: 'y', s: 1, d: 10, depth: 16 }))));
  assert.deepStrictEqual(p.run(() => tt.fur('hall').current.parts.find((q) => q.name === 'Обрамление откоса правое').holes),
    rv.flatMap((y, i) => (i % 4 ? [{ k: 'dowel', at: at0(y), ax: 'z', s: -1, d: 8, depth: 22 }] : [
      { k: 'screw', at: at0(y), ax: 'z', s: -1, d: 8, depth: 30 }, { k: 'cam', at: [rx + T, y, -34], ax: 'x', s: -1, d: 15, depth: 13 },
      { k: 'dowel', at: at0(y + mi(i)), ax: 'z', s: -1, d: 8, depth: 22 }])));
  /* the back panel: into the sides a dowel and a cam fitting in each end, 500 from its bottom and top (the dowel
     32 toward the middle), the cams from the wall's side; the confirmats go through it: Ø8, its whole thickness */
  const side = p.run(() => tt.fur('hall').current.parts.find((q) => q.name === 'Задняя стенка правой колонны').holes);
  assert.deepStrictEqual(side, [
    ...ends.flatMap(([z, s]) => sy.flatMap(([y, i]) => [
      { k: 'screw', at: [xb - T / 2, y, z], ax: 'z', s, d: 8, depth: 30 },
      { k: 'cam', at: [xb, y, z + s * 34], ax: 'x', s: -1, d: 15, depth: 13 },
      { k: 'dowel', at: [xb - T / 2, y + i * 32, z], ax: 'z', s, d: 8, depth: 22 }])),
    ...[bottom, top].flatMap((q) => [T + 100, Dc - 100].map((z) =>
      ({ k: 'confirmat', at: [xb - T, q.y + T / 2, z], ax: 'x', s: 1, d: 8, depth: T, through: true })))]);
  assert.deepStrictEqual(r.meshes, [16, 2 * r.N + 23, 2 * r.N + 16, 7, 16, ...Array(r.N).fill(4), 14]);
  // the plinth (80 high, on the feet): two dowels in each end, 20 from its top and bottom; a low one (50) — a quarter of its height in, whole mm
  const plinth = () => p.run(() => tt.fur('hall').current.parts.find((q) => /^Цоколь/.test(q.name)).holes.map((h) => [h.k, h.at[1], h.at[2], h.s, h.depth]));
  assert.deepStrictEqual(plinth().slice(0, 4), [['dowel', FL + 20, T, 1, 22], ['dowel', FL + 60, T, 1, 22], ['dowel', FL + 20, Dc, -1, 22], ['dowel', FL + 60, Dc, -1, 22]]);
  // its top into the bottom: a dowel and a cam fitting, the pair in the middle of its length, the cam behind it (from inside the column)
  const zc = (T + Dc) / 2, pTop = p.run(() => tt.fur('hall').current.parts.find((q) => /^Цоколь/.test(q.name)).holes.slice(4));
  assert.deepStrictEqual(pTop, [
    { k: 'screw', at: [rx + T / 2, FL + 80, zc - 16], ax: 'y', s: -1, d: 8, depth: 30 },
    { k: 'cam', at: [rx + T, FL + 46, zc - 16], ax: 'x', s: -1, d: 15, depth: 13 },
    { k: 'dowel', at: [rx + T / 2, FL + 80, zc + 16], ax: 'y', s: -1, d: 8, depth: 22 }]);
  const under = p.run(() => tt.fur('hall').current.parts.find((q) => q.name === 'Дно правой колонны').holes.slice(-2));
  assert.deepStrictEqual(under.map((h) => [h.k, h.d, h.depth, h.at, h.ax, h.s]),
    [['screw', 5, 13, [rx + T / 2, FL + 80, zc - 16], 'y', 1], ['dowel', 8, 13, [rx + T / 2, FL + 80, zc + 16], 'y', 1]], 'its mates in the bottom, from below');
  const pls = p.document.querySelector('[data-panel="hall"]').querySelector('[data-p="Pl"]'); pls.value = '50'; pls.dispatch('input');
  assert.deepStrictEqual(plinth().slice(0, 4).map((h) => h[1]), [13, 37, 13, 37].map((y) => FL + y));
});
