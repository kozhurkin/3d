// шкафы санузла: по нише с «Планировки», сборка, пенал и отступ над инсталляцией, размер между полками (src/js/rooms/bath/cabinets.js)
const { round, runPage, PAGES, check, slide, assert } = require('../harness');

check('санузел: шкафы по нише с «Планировки»', () => {
  // the niche's width and depth, the ceiling, the riser box: the plan's; the module's own starting sizes are these too
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.W,f.P.L,f.P.H,f.P.Rx,f.P.Rz,f.current.parts.length])(tt.fur("bath"))'), [1250, 1100, 2600, 250, 250, 40]);
  assert.match(PAGES.app.slice(PAGES.app.indexOf('«Санузел» view')), /^const P=\{W:1250,H:2600,Rx:250,Rz:250,/m);
  // the tall cabinet's own plinth: between its sides, under its bottom, across the front right behind the fronts' plinth
  const pl = p.run(() => (f => ['Цоколь пенала', 'Цоколь пенала и короба (заподлицо с фасадами)']
    .map((n) => f.current.parts.filter((q) => q.name === n).map((q) => [q.mat, q.x0, q.x1, q.y0, q.y1, q.z0, q.z1])))(tt.fur('bath')));
  assert.deepStrictEqual(pl, [[['carcass', 466, 1234, 10, 90, 268, 284]], [['front', 1, 1249, 10, 89, 284, 300]]],
    'sides 450…466 and 1234…1250, 284 deep; the bottom at 90; on the feet 10 high');
});

check('санузел: шкафы, инсталляция и унитаз собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const nDoors = p.run('tt.fur("bath").current.parts.filter(x=>x.mat==="front"&&(x.hinge||x.pivot)).length');
  // the installation box, its flush plate, the toilet (the machine, the tray, the shower rack and its curtain have checks of their own): the last group of the bathroom
  const b = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, sani:f.sani.children.filter(m=>m.userData.wash!==true&&m.userData.tray!==true&&m.userData.rack!=="wall"&&m.userData.rack!=="over"&&m.userData.curtain!==true).map(m=>m.position.y), P:f.P}))(tt.fur("bath"))');
  let r = b();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors + 5, 40, true],
    'built on screen, every door on a hinge, and the washing machine\'s, the two of the cabinet over the sink, the shower curtain and the toilet\'s lid');
  assert.strictEqual(nDoors, 6, 'four tall cabinet doors, two upper cabinet doors');
  assert.deepStrictEqual(r.sani.map((y) => round(y, 4)), [0.6, 1.0025, 0.065]);
  // the panel: sizes, the niche and the ceiling from the plan, what is between the shelves
  assert.strictEqual(bq('[data-p-out="Hi"]').textContent, '1200 мм');
  assert.deepStrictEqual(['#b-W', '#b-L', '#b-H', '#b-R'].map((s) => bq(s).textContent), ['1250 мм', '1100 мм', '2600 мм', '250 × 250 мм']);
  assert.strictEqual(bq('#b-gapB').textContent, 'Высота дверей 1110 мм · между полками 343,3 мм');
  assert.strictEqual(bq('#b-gapM').textContent, 'Высота ниши 300 мм · внутри 268 мм');
  // a higher installation: the box and the bowl's flush plate go up with it
  const hi = bq('[data-p="Hi"]'); hi.value = '1300'; hi.dispatch('input');
  r = b(); assert.deepStrictEqual([r.P.Hi, round(r.sani[0], 3)], [1300, 0.65]);
  // the tall cabinet is never wider than the niche past the riser box
  const wc = bq('[data-p="Wc"]'); wc.value = '1400'; wc.dispatch('input');
  assert.strictEqual(b().P.Wc, 1000); assert.strictEqual(wc.value, 1000);
  // the niche over the installation has no switch of its own: only the upper cabinet's layout 2 takes it away; feet under the tall cabinet
  assert.ok(r.parts.includes('Бок ниши над инсталляцией')); assert.strictEqual(bq('#b-tMid'), null);
  // the feet are on from the start: four, in the tall cabinet's sides (1000 wide now), 32 in from its front and back edges (none under the cladding); off — none
  const feet = bq('#b-tFeet'); assert.strictEqual(feet.checked, true);
  assert.deepStrictEqual(p.run(() => tt.fur('bath').current.feet), [[258, 32], [258, 252], [1242, 32], [1242, 252]]);
  feet.checked = false; feet.dispatch('change');
  r = b(); assert.deepStrictEqual([r.P.Feet, r.feet], [false, 0]);
  bq('[data-thick="18"][data-for="T"]').click();
  assert.strictEqual(b().P.T, 18);
});

check('санузел: пенал из двух корпусов — нижний до верха инсталляции, верхний до потолка', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const r = p.run(() => {
    const f = tt.fur('bath'), of = (n) => f.current.parts.filter((q) => q.name === n);
    const one = (c) => ['Бок', 'Дно', 'Крышка', 'Ребро жёсткости', 'Полка'].map((w) => of(`${w} ${c} корпуса пенала`).map((q) => [q.y0, q.y1]));
    return { lo: one('нижнего'), hi: one('верхнего'), divider: f.current.parts.some((q) => /разделитель/.test(q.name)) };
  });
  // the lower one on the feet (10) and the plinth (80) up to 1200, the upper one from there to the ceiling; each with its own bottom, top and ribs, no divider
  assert.deepStrictEqual(r.lo.slice(0, 4), [[[10, 1200], [10, 1200]], [[90, 106]], [[1184, 1200]], [[106, 206], [1084, 1184]]]);
  assert.deepStrictEqual(r.hi.slice(0, 4), [[[1200, 2600], [1200, 2600]], [[1200, 1216]], [[2584, 2600]], [[1216, 1316], [2484, 2584]]]);
  assert.deepStrictEqual([r.lo[4].length, r.hi[4].length, r.divider], [2, 3, false], 'the shelves below and above, as the panel has them');
});

check('санузел: ширина пенала и отступ над инсталляцией возвращаются вслед за нишей и потолком', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const P = () => p.run('(f=>[f.P.Wc,f.P.Gap])(tt.fur("bath"))');
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
  const gaps = () => p.run('tt.fur("bath").dims.userData.gaps');
  // the tall cabinet below the divider, above it, the upper cabinet: between two shelves in the middle
  assert.deepStrictEqual(gaps(), ['343', '326', '345']);
  // the room's dimensions are seen through everything, the ones between the shelves only where nothing covers them
  assert.deepStrictEqual(p.run('(d=>d.children.map(o=>o.material.depthTest===true))(tt.fur("bath").dims)'), [...Array(26).fill(false), ...Array(6).fill(true)]);
  const set = (k, v) => { const s = bq(`[data-p="${k}"]`); s.value = String(v); s.dispatch('input'); };
  // each in the middle of the width and depth its boards share (bath mm): the tall cabinet across x, the upper one (along the left wall) across z
  const at = p.run('tt.fur("bath").dims.children.slice(26).filter((o,i)=>i%2).map(s=>[s.position.x,s.position.y,s.position.z].map(v=>Math.round(v/MM)))');
  assert.deepStrictEqual(at, [[850, 645, 140], [850, 1729, 140], [95, 2050, 700]]);
  set('Nb', 0); set('Nu', 0);
  assert.deepStrictEqual(gaps(), ['326'], 'only the section that has shelves');
  set('Nh', 0);
  assert.deepStrictEqual(gaps(), []);
});

check('санузел: компоновка 2 — ниши нет, верхний шкаф на инсталляции с вкладными фасадами, открытая секция у короба', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  bq('[data-lay="2"][data-for="LayU"]').click(); bq('[data-lay="2"][data-for="LayT"]').click();
  const r = p.run(() => {
    const f = tt.fur('bath'), up = (n) => f.current.parts.filter((q) => q.name === n);
    return { lay: [f.P.LayU, f.P.LayT], yb: f.current.yb, niche: f.current.parts.some((q) => /ниши/.test(q.name)),
      side: up('Бок верхнего шкафа').map((q) => [q.x0, q.x1, q.y0, q.y1, q.z0, q.z1]), bottom: up('Дно верхнего шкафа').map((q) => [q.x1, q.y0]),
      fronts: up('Фасад верхнего шкафа').map((q) => [q.x0, q.x1, q.y0, q.y1, q.z0, q.z1, q.pivot.z]) };
  });
  // the cabinet from the installation's top to the ceiling, its boards the whole 200 mm; the doors inside them, 2 mm all round
  assert.deepStrictEqual([r.lay, r.yb, r.niche], [[2, 2], 1200, false]);
  assert.deepStrictEqual(r.side, [[0, 200, 1200, 2600, 300, 316], [0, 200, 1200, 2600, 1084, 1100]]);
  assert.deepStrictEqual(r.bottom, [[200, 1200]]);
  assert.deepStrictEqual(r.fronts, [[184, 200, 1218, 2582, 318, 699, 318], [184, 200, 1218, 2582, 701, 1082, 1082]]);
  // the panel: the buttons, the niche and the gap over the installation are off
  assert.deepStrictEqual([...p.document.querySelectorAll('[data-panel="bath"] [data-lay]')].map((b) => b.getAttribute('aria-pressed')), ['false', 'true', 'false', 'true', 'false']);
  assert.deepStrictEqual([bq('#b-Gap').disabled, bq('#b-Dm').disabled], [true, true]);
  assert.strictEqual(bq('#b-gapU').textContent, 'Высота шкафа 1400 мм · между полками 445,3 мм');
  // the open section between the riser box and the tall cabinet: 200 wide, as deep as the run (300), its own back; the cladding only over the box.
  // Two carcasses as the tall cabinet's: the lower one up to the installation's top with 2 shelves, the upper one to the ceiling with 3
  const s = p.run(() => {
    const f = tt.fur('bath'), of = (n) => f.current.parts.filter((q) => q.name === n), os = (w, c) => of(`${w} ${c} корпуса секции у короба`);
    const one = (c) => ({ sides: os('Бок', c).map((q) => [q.x0, q.x1, q.y0, q.y1, q.z1]), shelves: os('Полка', c).map((q) => Math.round(q.y0)), top: os('Крышка', c).length,
      back: os('Задняя стенка', c).map((q) => [q.y0, q.y1, q.z0, q.z1]) });
    return { box: tt.box(f.current.parts.filter((q) => /секции у короба/.test(q.name)), 'xzy'), lo: one('нижнего'), hi: one('верхнего'),
      clad: of('Облицовка короба, нижняя (фасад, глухой)').map((q) => [q.x0, q.x1, q.y0, q.z1]),
      plinth: of('Цоколь пенала и короба (заподлицо с фасадами)').map((q) => [q.x0, q.x1]),
      sPlinth: of('Цоколь секции у короба').map((q) => [q.x0, q.x1, q.mat]), gaps: f.dims.userData.gaps };
  });
  assert.deepStrictEqual(s.box, [250, 450, 0, 300, 10, 2600], 'on the feet 10 high');
  // the feet in the sides of both carcasses on the floor, 32 in from the front and back edges: the tall cabinet's (284 deep), the section's (300)
  assert.deepStrictEqual(p.run(() => tt.fur('bath').current.feet),
    [[458, 32], [458, 252], [1242, 32], [1242, 252], [258, 32], [258, 268], [442, 32], [442, 268]]);
  // the lower one has no top: the upper one's bottom closes it, one board at the joint; its shelves evenly up to that bottom
  assert.deepStrictEqual(s.lo, { sides: [[250, 266, 10, 1200, 300], [434, 450, 10, 1200, 300]], shelves: [463, 827], top: 0, back: [[90, 1200, 0, 16]] });
  assert.deepStrictEqual(s.hi, { sides: [[250, 266, 1200, 2600, 300], [434, 450, 1200, 2600, 300]], shelves: [1550, 1892, 2234], top: 1, back: [[1200, 2600, 0, 16]] });
  assert.deepStrictEqual(s.clad, [[150, 250, 10, 300]], 'the cladding 100 wide (50 of it behind the installation box), down to the feet\'s height');
  assert.deepStrictEqual(s.plinth, [[450, 1249]], 'the fronts\' plinth only under the tall cabinet');
  assert.deepStrictEqual(s.sPlinth, [[266, 434, 'carcass']], 'the section\'s own, between its sides, in its colour');
  assert.deepStrictEqual(s.gaps.slice(-2), ['349', '326'], 'between the section\'s shelves, in each carcass');
  // back to layout 1: the niche and the overlay doors again
  bq('[data-lay="1"][data-for="LayU"]').click(); bq('[data-lay="1"][data-for="LayT"]').click();
  assert.deepStrictEqual(p.run(() => (f => [f.current.yb, f.current.parts.length])(tt.fur('bath'))), [1500, 40]);
});

check('санузел: пенал, вариант 3 — верхний корпус секции у короба за дверцей, у нижнего своя крышка', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const n0 = p.run(() => tt.fur('bath').doors.length);
  p.document.querySelector('[data-panel="bath"] [data-for="LayT"][data-lay="3"]').click();
  const r = p.run(() => {
    const f = tt.fur('bath'), of = (n) => f.current.parts.filter((q) => q.name === n), os = (w, c) => of(`${w} ${c} корпуса секции у короба`);
    return { door: of('Фасад секции у короба').map((q) => [q.x0, q.x1, q.y0, q.y1, q.z0, q.z1, q.hinge]),
      hiSide: os('Бок', 'верхнего').map((q) => q.z1), hiShelf: os('Полка', 'верхнего').map((q) => q.z1), hiBack: os('Задняя стенка', 'верхнего').length,
      loTop: os('Крышка', 'нижнего').map((q) => [q.y0, q.y1, q.z1]), loShelf: os('Полка', 'нижнего').map((q) => q.z1),
      doors: f.doors.length, gaps: f.dims.userData.gaps, clad: of('Облицовка короба, нижняя (фасад, глухой)').map((q) => [q.x0, q.y0]) };
  });
  // the door flush with the tall cabinet's, 2 mm off its neighbours, hinged at the riser box; the upper carcass behind it, its shelves 20 short
  assert.deepStrictEqual(r.door, [[251, 449, 1201, 2599, 284, 300, 'L']]);
  assert.deepStrictEqual([r.hiSide, r.hiShelf, r.hiBack], [[284, 284], [264, 264, 264], 1]);
  assert.strictEqual(r.doors, n0 + 1, 'it opens');
  // the lower carcass open as in layout 2, flush in front, with its own top now
  assert.deepStrictEqual([r.loTop, r.loShelf], [[[1184, 1200, 300]], [300, 300]]);
  assert.deepStrictEqual(r.gaps.slice(-2), ['343', '326']);
  assert.deepStrictEqual(r.clad, [[150, 10]], 'the cladding as in layout 2');
  assert.deepStrictEqual([...p.document.querySelectorAll('[data-panel="bath"] [data-for="LayT"]')].map((b) => b.getAttribute('aria-pressed')),
    ['false', 'false', 'true']);
});

check('санузел: у каждого шкафа своя компоновка, обе остаются после перезагрузки', () => {
  const storage = new Map();
  const open = () => { const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick(); return p; };
  const lay = (p) => p.run(() => (f => [f.P.LayU, f.P.LayT, f.current.yb, f.current.parts.some((q) => /ниши/.test(q.name)),
    f.current.parts.some((q) => /секции у короба/.test(q.name))])(tt.fur('bath')));
  const btn = (p, k, v) => p.document.querySelector(`[data-panel="bath"] [data-for="${k}"][data-lay="${v}"]`);
  let p = open();
  // the tall cabinet with the open section, the upper cabinet still over the niche
  btn(p, 'LayT', 2).click();
  assert.deepStrictEqual(lay(p), [1, 2, 1500, true, true]);
  p = open();
  assert.deepStrictEqual(lay(p), [1, 2, 1500, true, true], 'kept, built at once');
  assert.deepStrictEqual([btn(p, 'LayU', 1), btn(p, 'LayT', 2)].map((b) => b.getAttribute('aria-pressed')), ['true', 'true']);
  // and the other way round
  btn(p, 'LayU', 2).click(); btn(p, 'LayT', 1).click();
  assert.deepStrictEqual(lay(open()), [2, 1, 1200, false, false]);
  // back to the defaults: both 1, and they are the ones kept
  p = open(); p.document.querySelector('#b-resetDef').click();
  assert.deepStrictEqual(lay(open()), [1, 1, 1500, true, false]);
});

check('санузел: ножки под пеналом — включены с самого начала, выбор остаётся после перезагрузки', () => {
  const storage = new Map();
  const open = () => { const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick(); return p; };
  const feet = (p) => p.document.querySelector('#b-tFeet');
  const got = (p) => [feet(p).checked, ...p.run(() => (f => [f.P.Feet, f.current.FL, f.current.feet.length])(tt.fur('bath')))];
  let p = open();
  assert.deepStrictEqual(got(p), [true, true, 10, 4]);
  // each one a black hexagonal puck 19 across the corners, 5 high, on the floor, and its pin up to the side
  assert.deepStrictEqual(p.run(() => tt.fur('bath').model.children.filter((o) => o.geometry && o.geometry.kind === 'THREE.CylinderGeometry')
    .map((o) => (([r, , h, n]) => [tt.mm(2 * r), tt.mm(h), n])(o.geometry.args))), Array(4).fill([[19, 5, 6], [6, 5, 12]]).flat(),
    'the puck: 19 across, 5 high, six sides; the pin: Ø6, round');
  feet(p).checked = false; feet(p).dispatch('change');
  assert.deepStrictEqual(got(open()), [false, false, 0, 4], 'kept off, without «Сохранить»');
  p = open(); feet(p).checked = true; feet(p).dispatch('change');
  assert.deepStrictEqual(got(open()), [true, true, 10, 4], 'and on again');
});

check('санузел: выбранный цвет остаётся после перезагрузки, «Вернуть исходные» возвращает исходный', () => {
  const storage = new Map();
  const open = () => { const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick(); return p; };
  let p = open();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  assert.strictEqual(p.run(() => VS.bath.fin), undefined, 'nothing kept before a choice');
  const sw = bq('[data-uc]'); sw.click();
  const chosen = { type: 'uni', color: sw.dataset.uc, name: sw.dataset.un };
  // a reload: the same browser storage, the bath's carcass and fronts in the colour chosen, the panel shows it
  p = open();
  const q = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  assert.deepStrictEqual(p.run(() => [VS.bath.fin.carcass, VS.bath.fin.front]), [chosen, chosen]);
  assert.ok(q('#bSub').textContent.endsWith(chosen.name), 'the room\'s line names it');
  assert.strictEqual(q(`[data-uc="${chosen.color}"]`).getAttribute('aria-pressed'), 'true');
  // back to the defaults: the factory finish, and it is the one kept
  q('#b-resetDef').click();
  p = open();
  assert.deepStrictEqual(p.run(() => VS.bath.fin.front), { type: 'wood', decor: 'H1386' });
});
