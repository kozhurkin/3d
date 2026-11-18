// Санузел: стены ниши, детали, шкафы и сантехника, отделка, фасады, рамка, размеры с плана.
const { round, matches, runPage, DECOR_PARENT, PAGES, check, slide, vec, piece, near, bathWalls, assert } = require('./harness');

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

check('санузел: душевой поддон заполняет душ за ступенькой, во вкладке — только когда рамка берёт его целиком', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  const T = 'VIEWS.bath.furniture().sani.children.find(m=>m.userData.tray===true)';
  const box = (o) => p.run(`(b=>[b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z].map(v=>Math.round(v*1000)))(new THREE.Box3().setFromObject(${o}))`);
  // the frame at 1400 cuts the shower: no tray
  assert.strictEqual(p.run(`${T}.visible`), false, 'hidden while the frame cuts it');
  // from the left wall (−2050) to the shower partition (−1050), from the wall at the niche end (1200) to the kitchen wall (1900); 150 high
  const body = `${T}.children.find(m=>m.userData.part==='Душевой поддон')`;
  assert.deepStrictEqual(box(body), [-2050, -1050, 0, 150, 1200, 1900]);
  assert.ok(p.run(`(m=>m.length===6&&m[2]!==m[0]&&m.filter(x=>x===m[0]).length===5)(${body}.material)`), 'its top (+y) slate of its own, the five other faces plain');
  // the drain: 120 square, a quarter of the way from the left wall, half way across, on the top
  const dr = box(`${T}.children[1]`);
  assert.deepStrictEqual([dr[1] - dr[0], (dr[0] + dr[1]) / 2, (dr[4] + dr[5]) / 2, dr[2]], [120, -1800, 1550, 150]);
  // its «i»: on the body and on the drain, its sizes from the plan
  const info = (o) => p.run(`(i=>i&&[i.title,i.lines[0]])(infoOf(${o}))`);
  assert.deepStrictEqual(info(body), ['Душевой поддон', '100 × 70 см, высота 15 см: во всю душевую, от левой стены до перегородки.']);
  assert.strictEqual(info(`${T}.children[1]`)[0], 'Душевой поддон');
  // the frame up to the kitchen wall takes it in whole: it shows
  const fl = p.document.querySelector('[data-panel="bath"]').querySelector('#bFrameL');
  fl.value = '1850'; fl.dispatch('input'); p.tick();
  assert.strictEqual(p.run(`${T}.visible`), false, '50 mm short: still hidden');
  fl.value = '1900'; fl.dispatch('input'); p.tick();
  assert.strictEqual(p.run(`${T}.visible`), true);
  // on the plan always; it follows the shower's walls
  p.run('showView("plan")'); p.fly(); p.tick();
  assert.strictEqual(p.run(`${T}.visible`), true, 'on the plan');
  p.run('setModel({vW:750,bL:1000})'); p.tick();
  assert.deepStrictEqual(box(body), [-2050, -950, 0, 150, 1100, 1900]);
  assert.match(info(body)[1], /^110 × 80 см/);
});

check('санузел: душевая стойка с термостатом и лейкой — на левой стене посередине поддона, видна вместе с ним', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  // two groups: on the wall (it stops the walker) and the arm with the overhead shower (over the head, walked under)
  const R = (k) => `VIEWS.bath.furniture().sani.children.find(m=>m.userData.rack==='${k}')`;
  assert.deepStrictEqual([p.run(`${R('wall')}.userData.walkThrough`), p.run(`${R('over')}.userData.walkThrough`)], [undefined, true]);
  const at = (k) => p.run(`(m=>[m.position.x,m.position.y,m.position.z].map(v=>Math.round(v*1000)))([...${R('wall')}.children,...${R('over')}.children].find(m=>m.userData.rackPart==='${k}'))`);
  // the bathroom's axes: the left wall at 0, the tray from 1200 to 1900: half way is 1550
  assert.deepStrictEqual(at('thermostat'), [70, 1150, 1550], '70 out from the left wall, 1150 from the floor');
  assert.deepStrictEqual(at('head'), [442, 2065, 1550], 'the overhead shower 442 from the wall, as AM.PM Chic 2.0, under the arm at 2100');
  assert.deepStrictEqual(at('hand'), [120, 1550, 1550], 'the hand shower in its holder on the riser');
  assert.ok(p.run(`${R('wall')}.children.some(m=>m.userData.rackPart==='hose')`), 'its hose');
  // the hand shower's head on the handle's end by its rim: the handle's end (50 over the holder) 12 inside the rim, not at the centre;
  // its face turned down off the handle's line
  const hh = p.run(`(h=>(m=>({c:[m.position.x,m.position.y].map(v=>Math.round(v*1000)),rot:m.rotation.z}))(h.children.find(m=>m.userData.rackPart==='handHead')))(${R('wall')}.children.find(m=>m.userData.rackPart==='hand'))`);
  assert.strictEqual(Math.round(Math.hypot(hh.c[0], hh.c[1] - 50)), 43, 'the handle goes into the head\'s side: 55 − 12 from its centre');
  assert.ok(hh.rot < -Math.PI / 2, 'the face tilted down from square to the handle');
  // the hose: smooth (no step turns more than 15°), 1750 long, clear of the thermostat bar (Ø60 at 70 out, 1150 up) and of the tray
  const path = p.run(`${R('wall')}.children.find(m=>m.userData.rackPart==='hose').userData.path`);
  let len = 0, turn = 0, gap = 1;
  path.forEach((q, i) => {
    if (i) len += Math.hypot(q[0] - path[i - 1][0], q[1] - path[i - 1][1]);
    if (i > 1) { const a = Math.atan2(q[1] - path[i - 1][1], q[0] - path[i - 1][0]) - Math.atan2(path[i - 1][1] - path[i - 2][1], path[i - 1][0] - path[i - 2][0]);
      turn = Math.max(turn, Math.abs(Math.atan2(Math.sin(a), Math.cos(a)))); }
    if (q[1] > 1.15 - 0.03) gap = Math.min(gap, Math.hypot(q[0] - 0.07, q[1] - 1.15) - 0.03 - 0.008);
  });
  assert.ok(Math.abs(len - 1.75) < 0.03, `the hose 1750 long: ${Math.round(len * 1000)}`);
  assert.ok(turn < Math.PI / 12, 'no kink in the hose');
  assert.ok(gap > 0.02, 'the hose clear of the thermostat');
  assert.ok(Math.min(...path.map(q => q[1])) - 0.008 > 0.15, 'its loop over the tray');
  // the riser into the arm and the arm down to the head: rounded, quarter rings 60 and 30 mm in radius
  assert.deepStrictEqual(p.run(`${R('over')}.children.filter(m=>m.userData.rackPart==='bend').map(m=>[m.geometry.kind,Math.round(m.geometry.args[0]*1000),+(m.geometry.args[4]/Math.PI).toFixed(2)])`),
    [['THREE.TorusGeometry', 60, 0.5], ['THREE.TorusGeometry', 30, 0.5]]);
  // everything over the tray: inside it from the left wall to the partition, under the ceiling
  const head = at('head');
  assert.ok(head[0] - 110 > 0 && head[0] + 110 < 1000 && head[2] - 110 > 1200 && head[2] + 110 < 1900, 'the head over the tray');
  // hidden with the tray while the frame cuts the shower, shown with it
  assert.deepStrictEqual([p.run(`${R('wall')}.visible`), p.run(`${R('over')}.visible`)], [false, false]);
  const fl = p.document.querySelector('[data-panel="bath"]').querySelector('#bFrameL');
  fl.value = '1900'; fl.dispatch('input'); p.tick();
  assert.deepStrictEqual([p.run(`${R('wall')}.visible`), p.run(`${R('over')}.visible`)], [true, true]);
  // its «i»: sizes, materials, where it is
  const info = p.run(`(i=>[i.title,...i.lines])(infoOf(${R('over')}.children[0]))`);
  assert.deepStrictEqual(p.run(`(i=>[i.price,i.url,i.shop])(infoOf(${R('wall')}.children[0]))`), [21000, 'https://ozon.ru/t/RhrtHZA', 'Ozon']);
  assert.deepStrictEqual(info, ['Душевая система AM.PM Chic 2.0 с термостатом',
    'Высота 99 см (штанга выдвигается, 88–127 см), верхний душ Ø 22 см в 44 см от стены; ручная лейка Ø 11 см, шланг 1,75 м.',
    'Латунь, хром; межосевое расстояние 150 мм.',
    'Термостат в 115 см от пола (100 см над поддоном), верхний душ в 206 см; на левой стене посередине душевой.']);
  // it follows the shower on the plan
  p.run('setModel({bL:1000})'); p.tick();
  assert.strictEqual(at('thermostat')[2], 1500);
});

check('санузел: полупрозрачная шторка 220 см до поддона на прямой штанге, упёртой в кронштейн-шар за стенкой в конце ниши — отодвинута за стенку, по нажатию закрывает проход', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const C = 'VIEWS.bath.furniture().sani.children.find(m=>m.userData.curtain===true)';
  const D = "VIEWS.bath.furniture().doors.find(d=>d.key==='curtain')";
  const pos = (o) => p.run(`(m=>[m.position.x,m.position.y,m.position.z].map(v=>Math.round(v*1000)))(${o})`);
  // the rod, straight: from the bracket's ball (250, half way along the wall at the niche end, 0–500; its end in the ball's
  // blind hole, to its middle — nothing comes out on the far side) to the shower partition (1000); 2393 from the floor (the cloth 2200 from 160 up — 10 over the tray —, the
  // rings through its eyelets, their inside on the rod), 45 from the back of that wall (1200)
  const rp = (k) => `${C}.children.find(m=>m.userData.rodPart==='${k}')`;
  assert.deepStrictEqual(pos(rp('run')), [625, 2393, 1245]);
  assert.strictEqual(p.run(`Math.round(${rp('run')}.geometry.args[2]*1000)`), 750);
  assert.deepStrictEqual([...pos(rp('ball')), p.run(`${rp('ball')}.geometry.kind`), p.run(`Math.round(${rp('ball')}.geometry.args[0]*1000)`)], [250, 2393, 1245, 'THREE.SphereGeometry', 16]);
  // the flanges: Ø30 on the partition, the bracket's Ø46 on the wall
  assert.deepStrictEqual(p.run(`${C}.children.filter(m=>m.userData.rodPart==='flange').map(m=>[Math.round(m.geometry.args[0]*2000),Math.round(m.position.x*1000),Math.round(m.position.z*1000)])`), [[30, 996, 1245], [46, 250, 1203]]);
  assert.strictEqual(p.run(`${C}.children.some(m=>m.geometry.kind==='THREE.TorusGeometry')`), false, 'no bend');
  assert.strictEqual(p.run(`${C}.userData.walkThrough`), true, 'the walker goes through it');
  // frosted vinyl, grey, 60 % clear; its shadow 40 % of a full one: drawn through a sieve (its own depth material)
  assert.match(PAGES.app, /const CURT_OP=\.4,curtainMat=new THREE\.MeshStandardMaterial\(\{color:new THREE\.Color\('#cccccc'\)[^}]*transparent:true,opacity:CURT_OP/);
  assert.strictEqual(p.run(`${D}.g.children[0].castShadow`), true);
  assert.match(PAGES.app, /cloth\.customDepthMaterial=curtainShadowMat/);
  assert.match(PAGES.app, /curtainShadowMat=new THREE\.MeshDepthMaterial\(\{depthPacking:THREE\.RGBADepthPacking,alphaTest:1-CURT_OP,/);
  // drawn back: gathered behind the wall at the niche end, from the ball up to 10 short of its end (490 of its 500); a door of the room, closed
  assert.deepStrictEqual(p.run(`[${D}.a,${D}.t,${D}.g.userData.edge]`), [0, 0, 490]);
  // its rings: closed, chrome as the rod, 32 × 56 (half circles R16 joined by straight bits); the cloth 2200 from 160 up
  assert.deepStrictEqual(p.run(`${D}.g.children.filter(m=>m.userData.ring===true).map(m=>m.geometry.kind+':'+m.geometry.args[4])`), Array(10).fill('THREE.TubeGeometry:true'));
  assert.strictEqual(p.run(`${D}.g.children.find(m=>m.userData.ring===true).material===${rp('run')}.material`), true, 'as the rod');
  assert.strictEqual(p.run(`${D}.g.userData.top`), 2360);
  // the eyelets: 12 under the cloth's top, one per ring, each ring through its hole (the hole's top on the ring's bottom: the ring's
  // centre 2348 + 4 − 2.5 + 28), so the cloth's top is over the rings' bottoms; no faces over the holes
  const eyes = () => p.run(`${D}.g.userData.eyes`), rings = () => p.run(`${D}.g.children.filter(m=>m.userData.ring===true).map(m=>[Math.round(m.position.x*1000),m.position.y*1000])`);
  assert.deepStrictEqual(eyes().map((e) => e[1]), Array(10).fill(2348));
  assert.deepStrictEqual(rings().map((r) => r[0]), eyes().map((e) => e[0]), 'a ring through each eyelet');
  assert.ok(rings().every((r) => Math.abs(r[1] - 2377.5) < 0.01), 'its bottom in the hole\'s top');
  assert.ok(2360 > 2377.5 - 28, 'the cloth over the rings\' bottoms');
  assert.strictEqual(p.run(`${D}.g.children[0].userData.tris`), (2 + 10 * 4 + 9 * 23 - 1) * 3 * 2 - 10 * 2, 'a hole in the band at each eyelet: 249 columns, 4 rows, a quad less at each');
  // the folds as deep to either side; drawn back 42, off the wall (the rod 45 out from it)
  assert.strictEqual(p.run(`${D}.g.userData.fold`), 42);
  // a fold's shape: off the rod a third of the way along the first fold (column 12) against its crest (column 16), the flat by the eyelet (column 4) at the rod;
  // drawn back the crest blunt (steep sides: nearly the full depth there), drawn across plain sin² (sin²(π/3) = 0.75)
  const third = () => p.run(`(z=>(z(12)-z(4))/(z(16)-z(4)))(c=>${D}.g.children[0].userData.pos[c*4*3+2])`);
  assert.ok(third() > 0.97, 'drawn back: a blunt crest');
  // a click: across the opening, up to 10 short of the partition
  p.run(`${D}.t=${D}.a=${D}.max`); p.tick();
  assert.strictEqual(p.run(`${D}.g.userData.edge`), 990);
  assert.strictEqual(p.run(`${D}.g.userData.fold`), 34, 'drawn across: shallower');
  assert.ok(Math.abs(third() - 0.75) < 0.01, 'drawn across: plain sin² folds');
  // hidden with the tray while the frame cuts the shower, shown with it
  assert.strictEqual(p.run(`${C}.visible`), false);
  const fl = p.document.querySelector('[data-panel="bath"]').querySelector('#bFrameL');
  fl.value = '1900'; fl.dispatch('input'); p.tick();
  assert.strictEqual(p.run(`${C}.visible`), p.run(`wallParts.find(x=>x.id==='nicheEnd').f()`), 'shown with the wall at the niche end');
  // the cut mode: it hides with the wall at the niche end (1100–1200 on the plan) once the camera is past it, in the shower
  const at = (z) => p.run(`(()=>{camera.position.set(-1.5,1.5,${z});frameHooks.forEach(h=>h(0,()=>0));return [${C}.visible,wallParts.find(x=>x.id==='nicheEnd').f()];})()`);
  assert.deepStrictEqual(at(0.9), [true, true]);
  assert.deepStrictEqual(at(1.5), [false, false]);
  p.run(`VS.bath.Wm='edges'`); assert.deepStrictEqual(at(1.5)[0], true, 'not in the other wall modes');
  p.run(`VS.bath.Wm='auto'`); at(0.9);
  // its «i»
  assert.deepStrictEqual(p.run(`(i=>[i.title,...i.lines])(infoOf(${C}.children[0]))`), ['Шторка для душа',
    '100 × 220 см, клеёнка (PEVA), полупрозрачная, матовая; люверсы и кольца — хром.',
    'Штанга прямая, 75 см: слева в перегородку, справа заходит за стенку у ниши и упирается в шар кронштейна на её задней стороне; нержавеющая сталь, хром, Ø 2 см; в 239 см от пола.',
    'Низ шторки в 1 см над поддоном.',
    'Нажатие задёргивает шторку или отодвигает её за стенку.']);
  // a wider opening (the shaft narrower, the wall at the niche end as it was) and a shorter niche on the plan: the rod longer and nearer, the curtain stays drawn across
  p.run('setModel({bGap:600,vW:750,bL:1000})'); p.tick();
  assert.deepStrictEqual(pos(rp('run')), [675, 2393, 1145]);
  assert.strictEqual(p.run(`${D}.g.userData.edge`), 1090);
});

check('санузел: шкафы по нише с «Планировки»', () => {
  // the niche's width and depth, the ceiling, the riser box: the plan's; the module's own starting sizes are these too
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.W,f.P.L,f.P.H,f.P.Rx,f.P.Rz,f.current.parts.length])(VIEWS.bath.furniture())'), [1250, 1100, 2600, 250, 250, 34]);
  assert.match(PAGES.app.slice(PAGES.app.indexOf('«Санузел» view')), /^const P=\{W:1250,H:2600,Rx:250,Rz:250,/m);
});

check('санузел: шкафы, инсталляция и унитаз собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const nDoors = p.run('VIEWS.bath.furniture().current.parts.filter(x=>x.mat==="front"&&(x.hinge||x.pivot)).length');
  // the installation box, its flush plate, the bowl and the seat (the machine, the tray, the shower rack and its curtain have checks of their own): the last group of the bathroom
  const b = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, sani:f.sani.children.filter(m=>m.userData.wash!==true&&m.userData.tray!==true&&m.userData.rack!=="wall"&&m.userData.rack!=="over"&&m.userData.curtain!==true).map(m=>m.position.y), P:f.P}))(VIEWS.bath.furniture())');
  let r = b();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors + 4, 34, true], 'built on screen, every door on a hinge, and the washing machine\'s, the two of the cabinet over the sink and the shower curtain');
  assert.strictEqual(nDoors, 6, 'four tall cabinet doors, two upper cabinet doors');
  assert.deepStrictEqual(r.sani.map((y) => round(y, 4)), [0.6, 1.0025, 0.22, 0.41]);
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

check('санузел: стиральная машина и раковина над ней в нише справа от входа', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const shown = () => p.run('(g=>g?g.visible:"none")(VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true))');
  const box = () => p.run('(b=>[b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z].map(v=>Math.round(v*1000)))(new THREE.Box3().setFromObject(VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true)))');
  // the view's frame ends at the partition next to the tall cabinet: its own view hides them
  assert.strictEqual(shown(), false, 'built with the sanitary ware, hidden in the bathroom view');
  // between the partition (−700) and the hall wall (−100), from the back wall up to the machine's door (590), up to the lamp on the cabinet over the sink
  const b = box();
  assert.deepStrictEqual([b[0], b[1], b[4], b[5]], [-700, -100, 0, 590]);
  assert.strictEqual(b[3], 2055);
  // the machine 595 × 850 × 490, 40 mm off the back wall, in the middle of the niche (x 1302.5…1897.5 → −697.5…−102.5 on the plan,
  // its front panel with the opening is not in the stub's box, the drawer is: 6 mm out to 536): hollow, a drum inside (cuff, drum, front ring, back)
  const mc = 'VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true).children.find(m=>m.userData.machine===true)';
  assert.deepStrictEqual(p.run(`(b=>[b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z].map(v=>Math.round(v*10000)))(new THREE.Box3().setFromObject(${mc}))`), [-6975, -1025, 0, 8500, 400, 5360]);
  assert.strictEqual(p.run(`${mc}.children.filter(m=>m.userData.drum===true).length`), 4);
  // the drum Ø470 × 340 behind a 40 mm cuff, its axis through the door's centre (440 up)
  assert.deepStrictEqual(p.run(`(m=>[m.geometry.args[0]*2,m.geometry.args[2],m.position.y,m.position.z].map(v=>Math.round(v*1000)))(${mc}.children.filter(m=>m.userData.drum===true)[1])`), [470, 340, 440, 308]);
  // the sink's bottom: 600 × 550 from the back wall, 30 mm over the machine
  const sink = p.run('(g=>{const c=g.children[2];return [c.geometry.args,c.position.y,c.position.z].flat().map(v=>Math.round(v*1000));})(VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true))');
  assert.deepStrictEqual(sink, [600, 20, 550, 890, 275]);
  // on the plan it shows
  p.run('showView("plan")'); p.tick();
  assert.strictEqual(shown(), true, 'shown on the plan');
});

check('санузел: дверца стиральной машины открывается в ту сторону, по которой кликнули', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const D = `VIEWS.bath.furniture().doors.find(d=>d.key==='washer')`;
  const st = () => p.run(`(d=>[d.side,d.s,Math.round(d.g.position.x*1000),Math.round(d.max*1000),d.g.children[0].children[0].userData.ring===true,Math.round(d.g.children[0].children[1].geometry.args[0]*2000)])(${D})`);
  const run = (n) => { for (let i = 0; i < n; i++) p.tick(); };
  // a click as pickDoor makes it: the point it hit (the door's middle is at x −400 on the plan), then open or closed
  const click = (x) => { p.run(`(d=>{if(${x}!==null)d.hit={x:${x}};d.t=d.t!==0?0:d.max;})(${D})`); run(2); };
  const shut = () => { p.run(`(d=>{d.t=0;})(${D})`); run(200); };
  // Ø480 door (a ring, the Ø330 glass in its middle); the hinge 12 mm past its edge: x 1650 ∓ 252. The niche's walls stop it at 90° (48 mm to each wall, its 50 mm bulge)
  assert.deepStrictEqual(st(), [-1, -1, 1398, 1571, true, 330], 'closed, on the left hinge');
  click(-0.3); run(80);
  assert.deepStrictEqual(st().slice(0, 3), [1, 1, 1902], 'clicked right of its middle: opens to the right');
  assert.ok(p.run(`${D}.a`) > 1.5, 'swung open');
  shut(); click(-0.3);
  assert.strictEqual(st()[0], 1, 'right again');
  shut(); click(-0.5);
  assert.deepStrictEqual(st().slice(0, 3), [-1, -1, 1398], 'clicked left: to the left');
  // not closed yet: a click on the other half closes it on the same hinge
  click(-0.3); run(5); click(-0.3);
  assert.strictEqual(st()[0], -1, 'not closed all the way: the same hinge');
  // opened with no click («Открыты»): the side it had
  shut(); click(null);
  assert.strictEqual(st()[0], -1);
  // «Открыты» in the bathroom panel opens it to its stop, and the panel sees every front open
  p.run(`(d=>{d.t=0;})(${D})`); run(200);
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  bq('[data-door="open"]').click(); run(2);
  assert.strictEqual(p.run(`${D}.t`), p.run(`${D}.max`));
  assert.strictEqual(bq('[data-door="open"]').getAttribute('aria-pressed'), 'true');
});

check('санузел: шкафчик над раковиной — отдельное изделие с зеркальными дверцами', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const W = 'VIEWS.bath.furniture()', cab = `${W}.sani.children.find(m=>m.userData.wash===true).children.slice(-1)[0]`;
  // its boards: 600 wide (the niche), 200 deep with the doors, 300 over the sink (1000): from 1300 to 2000, two shelves; not in the bathroom's parts
  const parts = p.run(`${cab}.children.map(o=>(o.userData.part&&o.userData.part.name?o.userData.part:o.children[0].userData.part)).map(q=>[q.name,q.x0,q.x1,q.y0,q.y1,q.z0,q.z1])`);
  assert.strictEqual(parts.length, 10);
  assert.deepStrictEqual(parts[0], ['Бок шкафчика над раковиной', 1350, 1366, 1300, 2000, 0, 184]);
  assert.strictEqual(parts.filter((q) => q[0] === 'Полка шкафчика над раковиной').length, 2);
  assert.deepStrictEqual(parts.filter((q) => q[0] === 'Фасад шкафчика над раковиной').map((q) => q.slice(1)), [[1351, 1649, 1301, 1999, 184, 200], [1651, 1949, 1301, 1999, 184, 200]]);
  assert.ok(!p.run(`${W}.current.parts.some(q=>/раковин/.test(q.name))`), 'not in the bathroom cut list');
  assert.ok(!/раковин/.test(p.document.querySelector('[data-panel="bath"]').querySelector('#b-csv').value));
  // a mirror on each door, in front of its face, edge to edge; the doors are the room's: a click opens them
  const doors = `${W}.doors.filter(d=>d.g.children[0].userData.part.name==='Фасад шкафчика над раковиной')`;
  assert.deepStrictEqual(p.run(`${doors}.map(d=>{const m=d.g.children.find(c=>c.userData.mirror===true);return [m.geometry.args,m.position.z+d.g.position.z].flat().map(v=>Math.round(v*1000));})`), [[298, 698, 4, 202], [298, 698, 4, 202]]);
  p.run(`${doors}.forEach(d=>{d.t=d.max;})`); for (let i = 0; i < 60; i++) p.tick();
  assert.ok(p.run(`${doors}.every(d=>d.a>1)`), 'they swing open with the room\'s doors');
  // a lamp on its top (2000): a bracket, the bar 450 × 25 × 25 mm 45 mm past the mirrors and 30 mm over the top, its glowing underside
  const lamp = p.run(`${W}.sani.children.find(m=>m.userData.wash===true).children.filter(m=>['body','glow'].includes(m.userData.lamp)).map(m=>[m.geometry.args,m.position.y-m.geometry.args[1]/2,m.position.z-m.geometry.args[2]/2,m.userData.lamp==='glow'].flat().map(v=>typeof v==='boolean'?v:Math.round(v*1000)))`);
  assert.deepStrictEqual(lamp.map((m) => m[5]), [false, false, true]);
  assert.strictEqual(lamp[0][3], 2000, 'the bracket on the top');
  assert.deepStrictEqual(lamp[1], [450, 25, 25, 2030, 245, false]);
  // its «i»: on the boards and on the mirrors, its sizes from the plan, the bathroom's finishes
  const info = (o) => p.run(`(i=>i&&[i.title,...i.lines])(infoOf(${o}))`);
  const ci = info(`${cab}.children[0]`);
  assert.strictEqual(ci[0], 'Зеркальный шкафчик над раковиной');
  assert.strictEqual(ci[1], '60 × 20 см, высота 70 см: во всю ширину ниши.');
  assert.strictEqual(ci[2], 'Корпус — ЛДСП Диамант серый U963 ST9, фасады — Базовый коричневый декор; на дверях зеркало 4 мм.');
  assert.match(ci[4], /^Низ в 130 см от пола, на 30 см выше раковины/);
  assert.strictEqual(info(`${doors}[0].g.children.find(c=>c.userData.mirror===true)`)[0], 'Зеркальный шкафчик над раковиной');
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
  assert.deepStrictEqual([bq('#b-oEc').textContent, p.run('VIEWS.bath.furniture().P.Ec')], ['60%', 60]);
});

check('санузел: фасады, размеры, деталировка, настройки по умолчанию', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  let bp = p.document.querySelector('[data-panel="bath"]');
  const bq = (s) => bp.querySelector(s);
  const pressed = () => bp.querySelectorAll('[data-door]').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.door);
  // 13 dimension lines and three between the shelves (a line and a label each), hidden in a flight
  assert.strictEqual(p.run('VIEWS.bath.furniture().dims.children.length'), 32);
  assert.strictEqual(bq('#b-sizesBox').open, true, 'the sizes are open');
  assert.deepStrictEqual(pressed(), ['closed']);
  bq('[data-door="open"]').click();
  assert.strictEqual(p.run('VIEWS.bath.furniture().doors.every(d=>d.t===d.max)'), true);
  // one door closed by hand: nothing pressed, the remembered mode stays
  p.run('(VIEWS.bath.furniture().doors[0].t=0, doorsChanged())');
  assert.deepStrictEqual(pressed(), []); assert.strictEqual(p.run('VS.bath.fronts'), 'open');
  bq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  // the walls toggle takes the walls, the installation and the toilet away
  const walls = bq('#b-tWall'); walls.checked = false; walls.dispatch('change'); p.tick();
  assert.deepStrictEqual(p.run('[wallGroup.visible, VS.bath.walls]'), [false, false]);
  const dims = bq('#b-tDims'); dims.checked = false; dims.dispatch('change');
  assert.deepStrictEqual(p.run('[VS.bath.fronts, VS.bath.dims]'), ['hidden', false]);
  // cut list: every part, grouped by material; the same as CSV
  assert.match(bq('#b-tot').innerHTML, /^<span>34 детали?<\/span>|^<span>34 деталей<\/span>/);
  const csv = bq('#b-csv').value.split('\n');
  assert.strictEqual(csv[0], 'Деталь;Материал;Длина;Ширина;Толщина;Кол-во');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 34);
  assert.strictEqual(bq('#b-cut').querySelectorAll('th.mh').length, 2, 'carcass and fronts');
  // feet are listed under the parts
  const feet = bq('#b-tFeet'); feet.checked = true; feet.dispatch('change');
  assert.match(bq('#b-tot').innerHTML, /Опоры регулируемые М6, шайба Ø15×5: 6 шт/);
  // remembered: cabinets and finishes, without the niche, the ceiling and the riser box
  const hi = bq('[data-p="Hi"]'); hi.value = '1300'; hi.dispatch('input');
  bq('[data-decor="H3154"]').click();
  bq('#b-saveDef').click();
  const saved = JSON.parse(storage.get('apt-bath-v2'));
  assert.deepStrictEqual([saved.P.Hi, saved.P.Feet, ['W', 'L', 'H', 'Rx', 'Rz', 'Lt'].some((k) => k in saved.P), saved.FIN.front.decor], [1300, true, false, 'H3154']);
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  bp = p.document.querySelector('[data-panel="bath"]');
  assert.deepStrictEqual(p.run('(f=>[f.P.Hi,f.P.Feet,f.P.W])(VIEWS.bath.furniture())'), [1300, true, 1250]);
  assert.match(bq('#bSub').textContent, /Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  bq('#b-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.Hi,f.P.Feet])(VIEWS.bath.furniture())'), [1200, false]);
  assert.strictEqual(bq('#b-tFeet').checked, false);
  assert.ok(!storage.has('apt-bath-v2'));
  assert.match(bq('#bSub').textContent, /корпус — Диамант серый U963 ST9; фасады — Базовый коричневый декор$/);
});

check('санузел: без «Шкафов» на плане — только в своей вкладке, поднимаются из пола, следуют «Планировке»', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  assert.strictEqual(p.run('VIEWS.bath.furniture().model'), null, 'not built while the bathroom is not in the scene');
  p.run('showView("bath")'); p.tick(25, 17);
  const m = p.run('(f=>({y:f.model.position.y, s:presence("bath")}))(VIEWS.bath.furniture())');
  near(m.s, 0.5, 'halfway'); near(m.y, -1.35, 'halfway up out of the floor');
  p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.model.visible, f.model.position.y])(VIEWS.bath.furniture())'), [true, 0]);
  p.run('showView("plan")'); p.fly();
  assert.strictEqual(p.run('VIEWS.bath.furniture().model.visible'), false, 'hidden on the plan');
  p.run('setModel({bL:1200, H:2700})'); p.tick();
  p.run('showView("bath")'); p.fly();
  // the installation fills the rest of the left wall: 1200 − 300 = 900
  assert.deepStrictEqual(p.run('(f=>[f.P.L, f.P.H, f.P.Lt])(VIEWS.bath.furniture())'), [1200, 2700, 900]);
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
  assert.strictEqual(p.run('VIEWS.bath.furniture().P.W'), 1350);
  assert.match(bq('#bSub').textContent, /^ниша 1350 × 1100 мм/);
  // a flight to the plan and back
  p.run('showView("plan")'); assert.strictEqual(p.run('inTransition()'), true); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['plan', 13]);
  p.run('showView("bath")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['bath', 8]);
});

check('санузел: ширина пенала и отступ над инсталляцией возвращаются вслед за нишей и потолком', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const P = () => p.run('(f=>[f.P.Wc,f.P.Gap])(VIEWS.bath.furniture())');
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
  const gaps = () => p.run('VIEWS.bath.furniture().dims.userData.gaps');
  // the tall cabinet below the divider, above it, the upper cabinet: between two shelves in the middle
  assert.deepStrictEqual(gaps(), ['349', '328', '345']);
  // the room's dimensions are seen through everything, the ones between the shelves only where nothing covers them
  assert.deepStrictEqual(p.run('(d=>d.children.map(o=>o.material.depthTest===true))(VIEWS.bath.furniture().dims)'), [...Array(26).fill(false), ...Array(6).fill(true)]);
  const set = (k, v) => { const s = bq(`[data-p="${k}"]`); s.value = String(v); s.dispatch('input'); };
  // each in the middle of the width and depth its boards share (bath mm): the tall cabinet across x, the upper one (along the left wall) across z
  const at = p.run('VIEWS.bath.furniture().dims.children.slice(26).filter((o,i)=>i%2).map(s=>[s.position.x,s.position.y,s.position.z].map(v=>Math.round(v/MM)))');
  assert.deepStrictEqual(at, [[850, 644, 140], [850, 1724, 140], [95, 2050, 700]]);
  set('Nb', 0); set('Nu', 0);
  assert.deepStrictEqual(gaps(), ['328'], 'only the section that has shelves');
  set('Nh', 0);
  assert.deepStrictEqual(gaps(), []);
});

check('санузел: смеситель раковины — высокий хромированный корпус, плоский носик над чашей, рычаг-пластина сверху, под шкафчиком', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const r = p.run(`(w=>{const mm=v=>Math.round(v*1000),all=(o,a=[])=>{a.push(o);(o.children||[]).forEach(c=>all(c,a));return a;};
    const q=w.children.filter(o=>o.userData.mixer===true),rack=all(VIEWS.bath.furniture().sani).filter(o=>o.userData.rackPart==='riser');
    const boxes=q.filter(o=>o.geometry.kind==='THREE.BoxGeometry');
    return {n:q.length,chrome:q.every(o=>o.material===rack[0].material),lit:q.every(o=>o.castShadow===true&&o.receiveShadow!==true),
      ext:boxes.map(o=>[mm(o.position.y-o.geometry.args[1]/2),mm(o.position.y+o.geometry.args[1]/2),mm(o.position.z+o.geometry.args[2]/2)]),
      lever:q.filter(o=>o.geometry.kind==='THREE.ExtrudeGeometry').map(o=>[mm(o.position.y-o.geometry.args[1].depth),mm(o.position.y)]),
      foot:mm(q[0].position.y-q[0].geometry.args[2]/2)};})(VIEWS.bath.furniture().sani.children.find(m=>m.userData.wash===true))`);
  // the foot ring, the body, the spout, the aerator, the lever's hub, the lever (one piece: no faces shared, no flicker) — chrome as the
  // shower rack's riser
  assert.strictEqual(r.n, 6);
  assert.ok(r.chrome, 'the mixer is the shower rack\'s chrome');
  assert.ok(r.lit, 'every piece casts a shadow and takes none: one look all over');
  // on the sink's top (1000): the spout 1110…1126 out to 65 + 160 from the wall, the lever's plate 1182…1190, 110 out — under the
  // cabinet's bottom 300 over the sink
  assert.strictEqual(r.foot, 1000);
  assert.deepStrictEqual(r.ext, [[1110, 1126, 225]]);
  assert.deepStrictEqual(r.lever, [[1182, 1190]]);
  assert.ok(r.lever[0][1] < 1300);
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
  const h = p.run(`${d}.g.children.filter(m=>typeof m.userData.whole==="number").map(m=>[Math.round(m.position.x*1000),Math.round(m.position.y*1000),Math.round(m.position.z*1000)])`);
  assert.deepStrictEqual(h, [[5, 1000, 514], [27, 1000, 514], [52, 1000, 457], [-45, 1000, 514], [-67, 1000, 514], [-92, 1000, 457]]);
  // a wall cut under the handles' top (1025) hides them whole, one at it shows them (the stub has no traverse: the parts are put in by hand)
  const hs = `${d}.g.children.filter(m=>typeof m.userData.whole==="number")`;
  p.run(`(doorParts.length=0, ${hs}.forEach(m=>doorParts.push({m,whole:m.userData.whole,wall:'hallBath'})))`);
  const shown = (wh) => { p.run(`VS.plan.Wh=${wh}`); p.tick(); return p.run(`${hs}.map(m=>m.visible)`); };
  assert.deepStrictEqual(shown(39), Array(6).fill(false), '1014 mm');
  assert.deepStrictEqual(shown(40), Array(6).fill(true), '1040 mm');
});
