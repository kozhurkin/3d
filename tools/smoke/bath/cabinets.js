// шкафы санузла: по нише с «Планировки», сборка, пенал и отступ над инсталляцией, размер между полками (src/js/rooms/bath/cabinets.js)
const { round, runPage, PAGES, check, slide, assert } = require('../harness');

check('санузел: шкафы по нише с «Планировки»', () => {
  // the niche's width and depth, the ceiling, the riser box: the plan's; the module's own starting sizes are these too
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.W,f.P.L,f.P.H,f.P.Rx,f.P.Rz,f.current.parts.length])(tt.fur("bath"))'), [1250, 1100, 2600, 250, 250, 34]);
  assert.match(PAGES.app.slice(PAGES.app.indexOf('«Санузел» view')), /^const P=\{W:1250,H:2600,Rx:250,Rz:250,/m);
});

check('санузел: шкафы, инсталляция и унитаз собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const nDoors = p.run('tt.fur("bath").current.parts.filter(x=>x.mat==="front"&&(x.hinge||x.pivot)).length');
  // the installation box, its flush plate, the toilet (the machine, the tray, the shower rack and its curtain have checks of their own): the last group of the bathroom
  const b = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, sani:f.sani.children.filter(m=>m.userData.wash!==true&&m.userData.tray!==true&&m.userData.rack!=="wall"&&m.userData.rack!=="over"&&m.userData.curtain!==true).map(m=>m.position.y), P:f.P}))(tt.fur("bath"))');
  let r = b();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors + 5, 34, true], 'built on screen, every door on a hinge, and the washing machine\'s, the two of the cabinet over the sink, the shower curtain and the toilet\'s lid');
  assert.strictEqual(nDoors, 6, 'four tall cabinet doors, two upper cabinet doors');
  assert.deepStrictEqual(r.sani.map((y) => round(y, 4)), [0.6, 1.0025, 0.065]);
  // the panel: sizes, the niche and the ceiling from the plan, what is between the shelves
  assert.strictEqual(bq('[data-p-out="Hi"]').textContent, '1200 мм');
  assert.deepStrictEqual(['#b-W', '#b-L', '#b-H', '#b-R'].map((s) => bq(s).textContent), ['1250 мм', '1100 мм', '2600 мм', '250 × 250 мм']);
  assert.strictEqual(bq('#b-gapB').textContent, 'Высота дверей 1120 мм · между полками 349,3 мм');
  assert.strictEqual(bq('#b-gapM').textContent, 'Высота ниши 300 мм · внутри 268 мм');
  // a higher installation: the box and the bowl's flush plate go up with it
  const hi = bq('[data-p="Hi"]'); hi.value = '1300'; hi.dispatch('input');
  r = b(); assert.deepStrictEqual([r.P.Hi, round(r.sani[0], 3)], [1300, 0.65]);
  // the tall cabinet is never wider than the niche past the riser box
  const wc = bq('[data-p="Wc"]'); wc.value = '1400'; wc.dispatch('input');
  assert.strictEqual(b().P.Wc, 1000); assert.strictEqual(wc.value, 1000);
  // the niche over the installation has no switch of its own: only layout 2 takes it away; feet under the tall cabinet
  assert.ok(r.parts.includes('Бок ниши над инсталляцией')); assert.strictEqual(bq('#b-tMid'), null);
  const feet = bq('#b-tFeet'); feet.checked = true; feet.dispatch('change');
  r = b(); assert.deepStrictEqual([r.P.Feet, r.feet], [true, 6]);
  bq('[data-thick="18"][data-for="T"]').click();
  assert.strictEqual(b().P.T, 18);
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
  assert.deepStrictEqual(gaps(), ['349', '328', '345']);
  // the room's dimensions are seen through everything, the ones between the shelves only where nothing covers them
  assert.deepStrictEqual(p.run('(d=>d.children.map(o=>o.material.depthTest===true))(tt.fur("bath").dims)'), [...Array(26).fill(false), ...Array(6).fill(true)]);
  const set = (k, v) => { const s = bq(`[data-p="${k}"]`); s.value = String(v); s.dispatch('input'); };
  // each in the middle of the width and depth its boards share (bath mm): the tall cabinet across x, the upper one (along the left wall) across z
  const at = p.run('tt.fur("bath").dims.children.slice(26).filter((o,i)=>i%2).map(s=>[s.position.x,s.position.y,s.position.z].map(v=>Math.round(v/MM)))');
  assert.deepStrictEqual(at, [[850, 644, 140], [850, 1724, 140], [95, 2050, 700]]);
  set('Nb', 0); set('Nu', 0);
  assert.deepStrictEqual(gaps(), ['328'], 'only the section that has shelves');
  set('Nh', 0);
  assert.deepStrictEqual(gaps(), []);
});

check('санузел: компоновка 2 — ниши нет, верхний шкаф на инсталляции с вкладными фасадами, открытая секция у короба', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  bq('[data-lay="2"]').click();
  const r = p.run(() => {
    const f = tt.fur('bath'), up = (n) => f.current.parts.filter((q) => q.name === n);
    return { lay: f.P.Lay, yb: f.current.yb, niche: f.current.parts.some((q) => /ниши/.test(q.name)),
      side: up('Бок верхнего шкафа').map((q) => [q.x0, q.x1, q.y0, q.y1, q.z0, q.z1]), bottom: up('Дно верхнего шкафа').map((q) => [q.x1, q.y0]),
      fronts: up('Фасад верхнего шкафа').map((q) => [q.x0, q.x1, q.y0, q.y1, q.z0, q.z1, q.pivot.z]) };
  });
  // the cabinet from the installation's top to the ceiling, its boards the whole 200 mm; the doors inside them, 2 mm all round
  assert.deepStrictEqual([r.lay, r.yb, r.niche], [2, 1200, false]);
  assert.deepStrictEqual(r.side, [[0, 200, 1200, 2600, 300, 316], [0, 200, 1200, 2600, 1084, 1100]]);
  assert.deepStrictEqual(r.bottom, [[200, 1200]]);
  assert.deepStrictEqual(r.fronts, [[184, 200, 1218, 2582, 318, 699, 318], [184, 200, 1218, 2582, 701, 1082, 1082]]);
  // the panel: the buttons, the niche and the gap over the installation are off
  assert.deepStrictEqual(['1', '2'].map((v) => bq(`[data-lay="${v}"]`).getAttribute('aria-pressed')), ['false', 'true']);
  assert.deepStrictEqual([bq('#b-Gap').disabled, bq('#b-Dm').disabled], [true, true]);
  assert.strictEqual(bq('#b-gapU').textContent, 'Высота шкафа 1400 мм · между полками 445,3 мм');
  // the open section between the riser box and the tall cabinet: 200 wide, as deep as the run (300), 6 shelves, its own back; the cladding only over the box
  const s = p.run(() => {
    const f = tt.fur('bath'), of = (n) => f.current.parts.filter((q) => q.name === n);
    return { box: tt.box(f.current.parts.filter((q) => /открытой секции/.test(q.name)), 'xzy'),
      sides: of('Бок открытой секции').map((q) => [q.x0, q.x1, q.z1]), shelves: of('Полка открытой секции').length,
      back: of('Задняя стенка открытой секции').map((q) => [q.z0, q.z1]), clad: of('Облицовка короба, нижняя (фасад, глухой)').map((q) => [q.x0, q.x1, q.z1]),
      plinth: of('Цоколь пенала и короба (заподлицо с фасадами)').map((q) => [q.x0, q.x1]),
      sPlinth: of('Цоколь открытой секции').map((q) => [q.x0, q.x1, q.mat]), feet: f.current.feet.length, gaps: f.dims.userData.gaps };
  });
  assert.deepStrictEqual(s.box, [250, 450, 0, 300, 0, 2600]);
  assert.deepStrictEqual(s.sides, [[250, 266, 300], [434, 450, 300]]);
  assert.deepStrictEqual([s.shelves, s.back, s.clad], [6, [[0, 16]], [[0, 250, 300]]]);
  assert.deepStrictEqual(s.plinth, [[1, 250], [450, 1249]], 'the fronts\' plinth under the cladding and the tall cabinet');
  assert.deepStrictEqual(s.sPlinth, [[266, 434, 'carcass']], 'the section\'s own, between its sides, in its colour');
  assert.deepStrictEqual(s.gaps.slice(-1), ['339'], 'between the section\'s shelves');
  // back to layout 1: the niche and the overlay doors again
  bq('[data-lay="1"]').click();
  assert.deepStrictEqual(p.run(() => (f => [f.current.yb, f.current.parts.length])(tt.fur('bath'))), [1500, 34]);
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
