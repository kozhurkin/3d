// вкладка «Санузел»: стены ниши и ступенька, отделка, фасады, деталировка, план, рамка, перелёт, дверь (src/js/rooms/bath/view.js)
const { round, matches, runPage, DECOR_PARENT, PAGES, check, vec, piece, near, bathWalls, assert } = require('../harness');

check('санузел: стены ниши, обрезанные рамкой', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  assert.strictEqual(p.run('view'), 'bath');
  // the bathroom view (origin −2050, 0): back wall 200 from the left wall's outer face to the partition's outer face (W + 100);
  // left wall 200; partition 100 × 550 next to the tall cabinet; wall 500 × 100 at the niche end; shower partition 300 past it;
  // riser box 250 × 250. The partition hides right of its face, the walls at the niche end past it
  assert.deepStrictEqual(p.run(bathWalls), [
    { id: 'entry', r: [-2250, -700, -200, 0], fade: '-z' },
    { id: 'leftOuter', r: [-2250, -2050, 0, 1400], fade: '-x' },
    { id: 'bathStub', r: [-800, -700, 0, 550], fade: '+x' },
    { id: 'nicheEnd', r: [-2050, -1550, 1100, 1200], fade: '+z' },
    { id: 'shower', r: [-1050, -950, 1100, 1400], fade: '+z' },
    { id: 'showerStep', r: [-1550, -1050, 1100, 1200], fade: '+z' },
    { id: 'riser', r: [-2050, -1800, 0, 250], fade: null },
  ]);
  assert.deepStrictEqual(p.run('doors.map(d=>d.g.visible)'), [false, false], 'no doors in the niche');
  const bp = p.document.querySelector('[data-panel="bath"]'), bq = (s) => bp.querySelector(s);
  assert.strictEqual(bp.hidden, false);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="bath"] #shared'), 'light and wall colour moved to the bathroom');
  assert.strictEqual(bq('#bFrameLOut').textContent, 1400);
  assert.strictEqual(bq('#bSub').textContent, 'ниша 1250 × 1100 мм · потолок 2600 мм · корпус — Диамант серый U963 ST9; фасады — Базовый коричневый декор');
  // camera: «3/4» on the first visit, at the bathroom's cabinets; the sun over the back wall
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.425, 1.3, 0.55]);
  bq('[data-cam="tall"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.3, 1.3, 0.15]);
  assert.deepStrictEqual([...vec(p, 'VIEWS.bath.sun()'), p.run('sunHalf')], [-1.425, 1.3, 0, 3]);
});

check('санузел: ступенька в проёме к душу — 200 мм, в толщину и цвет стен, перешагивается в обходе', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  // across the opening between the wall at the niche end and the shower partition, as thick as the walls
  const r = p.run(`(()=>{const w=WALLS.find(w=>w.id==='showerStep'),ps=wallParts.filter(x=>x.id==='showerStep');
    return {r:w.r,h:w.h,n:ps.length,b:ps[0].b,t:ps[0].t,mat:ps[0].m.material===wallMat,foot:wallFeet.some(f=>f.id==='showerStep'),
      top:Math.max(...wallOutline(clipWall(w,null),H).filter((v,i)=>i%3===1)),
      walk:wallBoxes.filter(b=>b[0]===w.r[0]*MM&&b[2]===w.r[2]*MM).map(b=>b[5])}})()`);
  assert.deepStrictEqual(r.r, [-1550, -1050, 1100, 1200]);
  assert.strictEqual(r.h, 200);
  assert.deepStrictEqual([r.n, r.b, r.mat, r.foot], [1, 0, true, true], 'one piece from the floor, the walls\' material, its footprint');
  near(r.t, 0.2, 'up to 200 mm');
  near(r.top, 0.2, 'its outline ends at its height, not at the ceiling');
  // its footprint («Следы», and on the floor while the cut mode hides it with the walls round the shower) a shade lighter; its outline as the walls'
  assert.strictEqual(p.run(`wallLines.find(l=>l.w.id==='showerStep').e.material===edgeMat`), true);
  assert.deepStrictEqual(p.run(`wallFeet.map(f=>f.m.material===lowFootMat?f.id:f.m.material===footMat?'':'?').filter(Boolean)`), ['showerStep']);
  assert.ok(r.walk.length === 1 && r.walk[0] < p.run('STEP'), 'lower than what the walker steps over');
  // it follows the opening on the plan: the opening grows into the wall at the niche end, the shower partition and the vent shaft (850) stay
  p.run('setModel({bGap:600})'); p.tick();
  assert.deepStrictEqual(p.run(`WALLS.find(w=>w.id==='showerStep').r`), [-1650, -1050, 1100, 1200]);
  assert.deepStrictEqual(p.run(`['nicheEnd','shower','shaft'].map(id=>WALLS.find(w=>w.id===id).r.slice(0,2))`), [[-2050, -1650], [-1050, -950], [-950, -100]]);
  assert.deepStrictEqual(p.run('[bWs, A.vW]'), [400, 850]);
  // the cut height lower than the step cuts it as well
  p.run('VS.bath.Wh=4'); p.tick();
  near(p.run(`wallParts.find(x=>x.id==='showerStep').m.scale.y`), 104 / 200, 'cut at 4 % of 2600 = 104 mm');
});

check('санузел: отделка — палитра, меню образца «корпус / фасады», свой цвет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bp = p.document.querySelector('[data-panel="bath"]'), bq = (s) => bp.querySelector(s), sub = () => bq('#bSub').textContent;
  assert.strictEqual(bp.querySelectorAll('[data-decor]').length, DECOR_PARENT.PALETTE_WOOD.length);
  assert.strictEqual(bp.querySelectorAll('[data-uc]').length, DECOR_PARENT.PALETTE_UNI.length);
  assert.ok(matches(bq('#b-ccCard'), '[aria-label="Монотонные декоры"] .cc'), 'own colour card stays with the plain colours');
  // the finishes at first: grey carcass, brown wood fronts
  const tags = (s) => bq(s).querySelector('.tags').innerHTML;
  assert.strictEqual(tags('[data-decor="H1386"]'), '<b>Ф</b>');
  assert.match(bq('#b-finNow').innerHTML, /^<span>Корпус<\/span><span>Диамант серый U963 ST9<\/span><span>Фасады<\/span><span>Базовый коричневый декор<\/span>$/);
  // a click paints the whole cabinet
  bq('[data-decor="H1180"]').click();
  assert.match(sub(), /потолок 2600 мм · Дуб Галифакс натуральный H1180 ST37$/);
  // the swatch menu offers only what the bathroom has: the carcass and the fronts
  const ctx = p.document.getElementById('ctx');
  bq('[data-uc="#F1F0EA"]').dispatch('contextmenu', { clientX: 100, clientY: 100 });
  assert.deepStrictEqual(ctx.querySelectorAll('[data-where]').filter((b) => !b.hidden).map((b) => b.dataset.where), ['carcass', 'front']);
  ctx.querySelector('[data-where="front"]').click();
  assert.match(sub(), /корпус — Дуб Галифакс натуральный H1180 ST37; фасады — Белый премиум W1000 ST9$/);
  // own colour for the whole cabinet; contrast of the end faces
  const cc = bq('#b-uniColor'); cc.click(); cc.value = '#123456'; cc.dispatch('input');
  assert.match(sub(), /мм · Свой цвет #123456$/);
  assert.strictEqual(bq('#b-ccCode').textContent, '#123456');
  const ec = bq('#b-Ec'); ec.value = '60'; ec.dispatch('input');
  assert.deepStrictEqual([bq('#b-oEc').textContent, p.run('tt.fur("bath").P.Ec')], ['60%', 60]);
});

check('санузел: фасады, размеры, деталировка, настройки по умолчанию', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  let bp = p.document.querySelector('[data-panel="bath"]');
  const bq = (s) => bp.querySelector(s);
  const pressed = () => bp.querySelectorAll('[data-door]').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.door);
  // 13 dimension lines and three between the shelves (a line and a label each), hidden in a flight
  assert.strictEqual(p.run('tt.fur("bath").dims.children.length'), 32);
  assert.strictEqual(bq('#b-sizesBox').open, true, 'the sizes are open');
  assert.deepStrictEqual(pressed(), ['closed']);
  bq('[data-door="open"]').click();
  assert.strictEqual(p.run('tt.fur("bath").doors.every(d=>d.loose||d.t===d.max)'), true);
  assert.strictEqual(p.run('tt.fur("bath").doors.find(d=>d.key==="wc-lid").t'), 0, 'the toilet\'s lid is no front: it stays down');
  // one door closed by hand: nothing pressed, the remembered mode stays
  p.run('(tt.fur("bath").doors[0].t=0, doorsChanged())');
  assert.deepStrictEqual(pressed(), []); assert.strictEqual(p.run('VS.bath.fronts'), 'open');
  bq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  // the walls toggle takes the walls, the installation and the toilet away
  const walls = bq('#b-tWall'); walls.checked = false; walls.dispatch('change'); p.tick();
  assert.deepStrictEqual(p.run('[wallGroup.visible, VS.bath.walls]'), [false, false]);
  const dims = bq('#b-tDims'); dims.checked = false; dims.dispatch('change');
  assert.deepStrictEqual(p.run('[VS.bath.fronts, VS.bath.dims]'), ['hidden', false]);
  // cut list: every part, grouped by material; the same as CSV
  assert.match(bq('#b-tot').innerHTML, /^<span>40 деталей<\/span>/);
  const csv = bq('#b-csv').value.split('\n');
  assert.strictEqual(csv[0], 'Деталь;Материал;Длина;Ширина;Толщина;Кол-во');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 40);
  assert.strictEqual(bq('#b-cut').querySelectorAll('th.mh').length, 2, 'carcass and fronts');
  // feet are listed under the parts (on from the start, four in the tall cabinet's sides); off — not listed
  assert.match(bq('#b-tot').innerHTML, /Опоры регулируемые М6, шестигранник 16×5: 4 шт/);
  const feet = bq('#b-tFeet'); feet.checked = false; feet.dispatch('change');
  assert.doesNotMatch(bq('#b-tot').innerHTML, /Опоры/);
  // remembered: cabinets and finishes, without the niche, the ceiling and the riser box
  const hi = bq('[data-p="Hi"]'); hi.value = '1300'; hi.dispatch('input');
  bq('[data-decor="H3154"]').click();
  bq('#b-saveDef').click();
  const saved = JSON.parse(storage.get('apt-bath-v2'));
  assert.deepStrictEqual([saved.P.Hi, saved.P.Feet, ['W', 'L', 'H', 'Rx', 'Rz', 'Lt'].some((k) => k in saved.P), saved.FIN.front.decor], [1300, false, false, 'H3154']);
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  bp = p.document.querySelector('[data-panel="bath"]');
  assert.deepStrictEqual(p.run('(f=>[f.P.Hi,f.P.Feet,f.P.W])(tt.fur("bath"))'), [1300, false, 1250]);
  assert.match(bq('#bSub').textContent, /Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  bq('#b-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.Hi,f.P.Feet])(tt.fur("bath"))'), [1200, true]);
  assert.strictEqual(bq('#b-tFeet').checked, true);
  assert.ok(!storage.has('apt-bath-v2'));
  assert.match(bq('#bSub').textContent, /корпус — Диамант серый U963 ST9; фасады — Базовый коричневый декор$/);
});

check('санузел: без «Шкафов» на плане — только в своей вкладке, поднимаются из пола, следуют «Планировке»', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  assert.strictEqual(p.run('tt.fur("bath").model'), null, 'not built while the bathroom is not in the scene');
  p.run('showView("bath")'); p.tick(25, 17);
  const m = p.run('(f=>({y:f.model.position.y, s:presence("bath")}))(tt.fur("bath"))');
  near(m.s, 0.5, 'halfway'); near(m.y, -1.35, 'halfway up out of the floor');
  p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.model.visible, f.model.position.y])(tt.fur("bath"))'), [true, 0]);
  p.run('showView("plan")'); p.fly();
  assert.strictEqual(p.run('tt.fur("bath").model.visible'), false, 'hidden on the plan');
  p.run('setModel({bL:1200, H:2700})'); p.tick();
  p.run('showView("bath")'); p.fly();
  // the installation fills the rest of the left wall: 1200 − 300 = 900
  assert.deepStrictEqual(p.run('(f=>[f.P.L, f.P.H, f.P.Lt])(tt.fur("bath"))'), [1200, 2700, 900]);
  assert.strictEqual(p.document.getElementById('b-H').textContent, '2700 мм');
});

check('санузел: рамка левой стены, размеры с «Планировки», перелёт', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const fl = bq('#bFrameL');
  fl.value = '1900'; fl.dispatch('input');
  // up to the kitchen wall: the whole shower partition, a piece of the vent shaft wall
  const w = p.run(bathWalls);
  assert.deepStrictEqual(w.find((x) => x.id === 'leftOuter').r, [-2250, -2050, 0, 1900]);
  assert.deepStrictEqual(w.find((x) => x.id === 'shower').r, [-1050, -950, 1100, 1900]);
  assert.deepStrictEqual(w.find((x) => x.id === 'shaft').r, [-950, -700, 1400, 1500]);
  assert.strictEqual(w.find((x) => x.id === 'shaft').fade, '+z', 'the vent shaft wall hides as the walls round the tray do');
  // … by their rule, not by its own face: with the camera between the niche end (1100) and the shaft wall (1400) it is hidden as they are
  const seen = (z) => p.run(`(()=>{camera.position.set(-1.5,1.5,${z});const f=id=>wallParts.find(x=>x.id===id).f();return ['nicheEnd','shower','showerStep','shaft'].map(f);})()`);
  assert.deepStrictEqual(seen(1.0), [true, true, true, true]);
  assert.deepStrictEqual(seen(1.25), [false, false, false, false]);
  // the slider: from the niche end's far face (bL + wt = 1200) up to the kitchen wall; a value below it shows 1200
  assert.deepStrictEqual([fl.min, fl.max], [1200, 1900]);
  p.run('VS.bath.L=900'); assert.deepStrictEqual(p.run('VIEWS.bath.frame()').slice(2), [-200, 1200]);
  p.run('VS.bath.L=1900');
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-bath-v1')), { Wm: 'auto', Wh: 100, L: 1900, sizes: true, fronts: 'closed', dims: true, walls: true });
  // the plan makes the niche wider: the frame, the partition, the cabinets and the panel follow
  p.run('setModel({bNiche:1350})'); p.tick();
  assert.deepStrictEqual(p.run(bathWalls).find((x) => x.id === 'bathStub').r, [-700, -600, 0, 550]);
  assert.deepStrictEqual(p.run(bathWalls)[0].r, [-2250, -600, -200, 0]);
  assert.strictEqual(p.run('tt.fur("bath").P.W'), 1350);
  assert.match(bq('#bSub').textContent, /^ниша 1350 × 1100 мм/);
  // a flight to the plan and back
  p.run('showView("plan")'); assert.strictEqual(p.run('inTransition()'), true); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['plan', 13]);
  p.run('showView("bath")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['bath', 8]);
});

check('дверь санузла: наличники 70 с обеих сторон мимо раковины и вентшахты, добор между ними, полотно в нём, ручки с обеих сторон', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const d = 'doors.find(d=>d.hole==="hallBath:0")';
  // a part's box in plan mm, [x0, x1, y0, y1, z0, z1] (o: its holder's place, m); the casings first
  const box = (m, o = [0, 0, 0]) => `(m=>{const g=m.geometry.args,c=m.position,o=${JSON.stringify(o)};return [[c.x,g[0]],[c.y,g[1]],[c.z,g[2]]].flatMap(([v,s],i)=>[v-s/2,v+s/2].map(u=>Math.round((u+o[i])*1000)));})(${m})`;
  const cs = p.run(`${d}.frame.children.filter(m=>m.userData.casing===true).map(m=>${box('m')})`);
  assert.deepStrictEqual(cs, [
    [0, 10, 0, 1990, 590, 660], [0, 10, 0, 1990, 1240, 1310], [0, 10, 1990, 2060, 590, 1310],
    [-110, -100, 0, 1990, 590, 660], [-110, -100, 0, 1990, 1240, 1310], [-110, -100, 1990, 2060, 590, 1310]], 'flush with the lining inside: they cover its ends');
  // the lining, 10 thick, through the wall between them, its ends under the casings; the leaf in it, 3 to either jamb, 5 under its head
  assert.deepStrictEqual(p.run(`${d}.frame.children.filter(m=>m.userData.lining===true).map(m=>${box('m')})`), [
    [-100, 0, 0, 1990, 650, 660], [-100, 0, 0, 1990, 1240, 1250], [-100, 0, 1990, 2000, 650, 1250]]);
  assert.deepStrictEqual(p.run(`${box(`${d}.g.children[0]`, [0, 0, 0.663])}`), [-40, 0, 5, 1985, 663, 1237], 'the leaf, its hinge at 650 + 10 + 3');
  // the sink in the niche by the door ends at 550 from the back wall, the vent shaft wall starts at 1400: 40 and 90 to the casings
  assert.deepStrictEqual(p.run('[APT_A.hL1+LT-CW, APT_A.hL1+APT_A.bDoor-LT+CW, zV0]'), [590, 1310, 1400]);
  // the handles, square: on the leaf, 1000 up, 60 in from its free edge, the lever toward the hinge, one out of each face
  const h = p.run(`${d}.g.children.filter(m=>typeof m.userData.whole==="number").map(m=>[tt.mm(m.position.x),tt.mm(m.position.y),tt.mm(m.position.z)])`);
  assert.deepStrictEqual(h, [[5, 1000, 514], [27, 1000, 514], [52, 1000, 457], [-45, 1000, 514], [-67, 1000, 514], [-92, 1000, 457]]);
  // a wall cut under the handles' top (1025) hides them whole, one at it shows them (the stub has no traverse: the parts are put in by hand)
  const hs = `${d}.g.children.filter(m=>typeof m.userData.whole==="number")`;
  p.run(`(doorParts.length=0, ${hs}.forEach(m=>doorParts.push({m,whole:m.userData.whole,wall:'hallBath'})))`);
  const shown = (wh) => { p.run(`VS.plan.Wh=${wh}`); p.tick(); return p.run(`${hs}.map(m=>m.visible)`); };
  assert.deepStrictEqual(shown(39), Array(6).fill(false), '1014 mm');
  assert.deepStrictEqual(shown(40), Array(6).fill(true), '1040 mm');
});
