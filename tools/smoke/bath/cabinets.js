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
  // no niche over the installation: its boards go, its depth is off; feet under the tall cabinet
  const mid = bq('#b-tMid'); mid.checked = false; mid.dispatch('change');
  r = b(); assert.ok(!r.parts.includes('Бок ниши над инсталляцией')); assert.strictEqual(bq('#b-Dm').disabled, true);
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
