// Приложение: страницы, «Планировка», размеры стен, шкафы на плане, торцы стен, shell.
const { el, all, matches, runPage, html, PAGES, check, slide, near, assert } = require('./harness');

check('страницы в index.html', () => {
  assert.deepStrictEqual(Object.keys(PAGES), ['app']);
  Object.entries(PAGES).forEach(([k, p]) => {
    assert.ok(!/<script src="js\//.test(p), k + ': js/ module left as a link');
    assert.ok(!/<!--include /.test(p), k + ': include left in the page');
  });
});

check('приложение: на узком экране сцена во всю ширину, без скруглений', () => {
  const css = PAGES.app.match(/@media \(max-width:900px\)\{([\s\S]*?)\n\}/)[1];
  const viewer = css.match(/\.viewer\{([^}]*)\}/)[1];
  assert.match(viewer, /border-radius:0/);
  assert.match(viewer, /margin-left:calc\(-1\*max\(16px,env\(safe-area-inset-left,0px\)\)\)/, 'out over the page padding on the left');
  assert.match(viewer, /margin-right:calc\(-1\*max\(16px,env\(safe-area-inset-right,0px\)\)\)/, 'and on the right');
  assert.ok(PAGES.app.includes('padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))'), 'the same padding as the page has');
});

check('приложение: «Планировка» открывается', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const r = p.run('({view, n:Object.keys(VIEWS), lines:wallLines.length, parts:wallParts.length, fade:VIEWS.plan.fade, vs:VS.plan, doors:doors.map(d=>d.g.visible)})');
  assert.strictEqual(r.view, 'plan');
  assert.deepStrictEqual(r.n, ['plan', 'kitchen', 'bath', 'hall', 'walk']);
  assert.deepStrictEqual(r.doors, [true, true], 'both doors on the plan');
  assert.strictEqual(r.lines, 13, 'all 13 walls on the plan (with the shower step)');
  assert.strictEqual(r.parts, 27, 'wall pieces (20) + window parts (7)');
  assert.deepStrictEqual(r.fade, { entry: '-z', rightOuter: '+x', leftOuter: '-x', window: '+z' });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.vs)), { Wm: 'auto', Wh: 100, dm: 'closed', furn: true, fcut: false, dims: false, names: true, floors: true });
  const panel = p.document.querySelector('[data-panel="plan"]'), shared = p.document.getElementById('shared');
  assert.strictEqual(panel.hidden, false, 'plan panel shown');
  assert.ok(matches(shared, '[data-panel="plan"] [data-shared-slot] #shared') && !shared.hidden, 'light and wall colour in the plan panel');
  assert.strictEqual(panel.querySelector('[data-wh-out]').textContent, '100%');
});

check('приложение: виды стен «Контуры» (edges) и «Следы» (feet) во всех панелях; сохранённый режим без своей кнопки — по умолчанию', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ Wm: 'outline', Wh: 60 })], ['apt-view-bath-v1', JSON.stringify({ Wm: 'skeleton' })]]);
  const p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  ['plan', 'kitchen', 'bath', 'hall', 'walk'].forEach((id) => assert.ok(p.document.querySelector(`[data-panel="${id}"] [data-wm="feet"]`), `${id}: «Следы»`));
  assert.strictEqual(PAGES.app.split('<button data-wm="feet" aria-pressed="false">Следы</button>').length - 1, 5, 'signed «Следы» in all five');
  assert.strictEqual(PAGES.app.split('<button data-wm="edges" aria-pressed="false">Контуры</button>').length - 1, 5, 'signed «Контуры» in all five');
  assert.ok(!/Скелет/.test(PAGES.app), 'no «Скелет» left');
  // 'outline' («Следы» now 'feet') and 'skeleton' («Контуры» now 'edges'): no buttons for them now, the views take their defaults;
  // the rest of a saved view stays
  assert.deepStrictEqual(p.run('[VS.plan.Wm, VS.plan.Wh, VS.bath.Wm]'), ['auto', 60, 'auto']);
});

check('приложение: настройки вида и общие настройки сохраняются отдельно', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  const panel = p.document.querySelector('[data-panel="plan"]');
  panel.querySelector('[data-wm="row"]').click();
  assert.strictEqual(panel.querySelector('[data-wh-out]').textContent, '10%');
  panel.querySelector('[data-dm="open"]').click();
  const dims = panel.querySelector('#pDims'); dims.checked = true; dims.dispatch('change');
  const furn = panel.querySelector('#pFurn'); furn.checked = false; furn.dispatch('change');
  p.document.querySelector('[data-wc="greige"]').click();
  const az = p.document.getElementById('Laz'); az.value = '12'; az.dispatch('input');
  p.tick();
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-plan-v1')), { Wm: 'row', Wh: 100, dm: 'open', furn: false, fcut: false, dims: true, names: true, floors: true });
  assert.deepStrictEqual(JSON.parse(storage.get('apt-shared-v1')), { wc: 'greige', light: { az: 12, el: 45, i: 100, a: 100 }, edge: true, fly: true });
  assert.ok(![...storage.keys()].some((k) => k.startsWith('apt-plan-view')), 'no old plan keys written');
  // reopened: everything comes back
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  const r = p.run('({wm:VS.plan.Wm, dm:VS.plan.dm, wc:S.wc, az:S.light.az, open:doors.every(d=>d.t===d.max)})');
  assert.deepStrictEqual({ ...r }, { wm: 'row', dm: 'open', wc: 'greige', az: 12, open: true });
  assert.strictEqual(p.document.getElementById('pFurn').checked, false, 'no cabinets on the plan, as left');
});

check('приложение: кнопки камеры плана двигают камеру', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  p.document.querySelector('[data-cam="top"]').click();
  const r = p.run('({theta:goal.theta, phi:goal.phi, r:goal.r})');
  assert.strictEqual(r.phi, 0.0005);
  assert.ok(Number.isFinite(r.r) && r.r > 5 && r.r < 30, 'distance ' + r.r);
});

check('«Планировка»: камера «План» — под углом со стороны окна и санузла, левая стена и стена с окном убраны разрезом', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  p.document.querySelector('[data-cam="plan"]').click(); p.fly();
  const r = p.run('({theta:cam.theta, phi:cam.phi, x:cam.target.x-CX, z:cam.target.z-CZ, k:cam.r/fitR()})');
  near(r.theta, -0.96, 'angle'); near(r.phi, 0.57, 'tilt'); near(r.k, 0.94, 'distance');
  near(r.x, 0.55, 'target to the right wall'); near(r.z, -0.3, 'target to the entry');
  const vis = ['leftOuter', 'window', 'rightOuter', 'entry'].map((id) => p.run(`wallParts.find(w=>w.id==="${id}").m.visible`));
  assert.deepStrictEqual(vis, [false, false, true, true]);
});

check('«Планировка»: размеры окна у самого окна — посередине его высоты «1500 × 1200», от пола до низа окна «800»; видны вместе с окном', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const dims = p.document.querySelector('#pDims'); dims.checked = true; dims.dispatch('change');
  p.document.querySelector('[data-cam="entry"]').click(); p.fly(); p.tick();
  // the stub keeps no line points: the labels stand in the middle of their lines
  const r = p.run('({vis:winDims.visible, S:winDims.children.filter(o=>labels.includes(o)).map(s=>[s.position.x,s.position.y,s.position.z].map(v=>Math.round(v/MM))), x:winX, x0:winX-A.winW/2, z:zEnd-10})');
  assert.strictEqual(r.vis, true, 'the window is on screen from the entry');
  assert.deepStrictEqual(r.S, [[r.x, 1400, r.z], [r.x0 - 150, 400, r.z]], 'width across the middle of the window height, the sill height from the floor 150 left of it');
  assert.ok(!p.run('dimsGroup.children.some(s=>s.isSprite&&Math.abs(s.position.z-(zEnd+A.bear+130)*MM)<1e-6)'), 'no window dimension on the plan');
  p.document.querySelector('[data-cam="plan"]').click(); p.fly(); p.tick();
  assert.strictEqual(p.run('winDims.visible'), false, 'the window wall is cut away: its dimensions go with it');
});

check('«Планировка»: проём в санузел на плане — просто «600», его высота «2000» у самого проёма, от пола на стене прихожей; видна со стороны прихожей вместе с перемычкой над ним; проход — «800», без размера «1050» от кухонной стены до правой', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const dims = p.document.querySelector('#pDims'); dims.checked = true; dims.dispatch('change');
  p.document.querySelector('[data-cam="hall"]').click(); p.fly(); p.tick();
  const r = p.run('({vis:doorDims.visible, S:doorDims.children.filter(o=>labels.includes(o)).map(s=>[s.position.x,s.position.y,s.position.z].map(v=>Math.round(v/MM))), z:A.hL1+A.bDoor+150})');
  assert.strictEqual(r.vis, true, 'the doorway is on screen from the hall');
  assert.deepStrictEqual(r.S, [[10, 1000, r.z]], 'the height from the floor on the hall face, 150 past the doorway');
  const texts = p.run('(()=>{const T=[],o=dimLabel;dimLabel=(t,h)=>{T.push(t);return o(t,h);};buildDims();dimLabel=o;return T;})()');
  assert.ok(texts.includes('600') && texts.includes('800') && texts.includes('2000') && !texts.includes('1050'), texts.join(','));
  assert.ok(!texts.some((t) => /проём|проход|h\d/.test(t)), texts.join(','));
  p.document.querySelector('[data-cam="plan"]').click(); p.fly(); p.tick();
  assert.strictEqual(p.run('doorDims.visible'), false, 'from the bathroom side it would show through the wall');
  p.document.querySelector('[data-cam="hall"]').click(); p.fly(); p.tick();
  p.run('VS.plan.Wh=50'); p.tick();
  assert.strictEqual(p.run('doorDims.visible'), false, 'the walls are cut below the lintel: the height goes with it');
});

check('«Планировка»: перегородка у пенала 550 подписана по самой стенке, от задней стены до её конца; вентшахта задана глубиной 400, от проёма до неё 150', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const dims = p.document.querySelector('#pDims'); dims.checked = true; dims.dispatch('change'); p.tick();
  const r = p.run('(()=>{const T=[],o=dimLabel;dimLabel=(t,h)=>{const s=o(t,h);T.push([t,s]);return s;};buildDims();dimLabel=o;return T.filter(([t])=>t==="550").map(([,s])=>[s.position.x,s.position.z].map(v=>Math.round(v/MM)));})()');
  assert.deepStrictEqual(p.run('[APT_A.bStub, WALLS.find(w=>w.id==="bathStub").r]'), [550, [-800, -700, 0, 550]]);
  assert.deepStrictEqual(r, [[-750, 275]], 'on the partition, in its middle');
  assert.deepStrictEqual(p.run('[APT_A.vD, zV0, zV0-A.hL1-A.bDoor]'), [400, 1400, 150]);
});

check('подписи размеров: вблизи не выше 22 px на экране, дальше уменьшаются вместе с моделью (на плане 150 мм, в комнате 95 мм), мельче 8 px гаснут, к 6 px исчезают', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const dims = p.document.querySelector('#pDims'); dims.checked = true; dims.dispatch('change'); p.tick();
  const K = 'const k=2*Math.tan(camera.fov*Math.PI/360)/viewer.clientHeight';   // m per px at 1 m
  // the camera above a label, at the distance where the label's own height would be raw px on screen: [px on screen, opacity, keeps its proportions]
  const at = (h, raws) => p.run(`(()=>{${K},s=dimLabel('1234',${h});
    return ${JSON.stringify(raws)}.map(raw=>{const d=${h}/(raw*k);camera.position.set(0,d,0);fitLabels([s]);
      return [+(s.scale.y/(d*k)).toFixed(3),+s.material.opacity.toFixed(3),+(s.scale.x/s.scale.y-s.userData.ar).toFixed(6)];});})()`);
  const want = [[22, 1, 0], [22, 1, 0], [12, 1, 0], [8, 1, 0], [7, 0.5, 0], [6, 0, 0], [4, 0, 0]];
  assert.deepStrictEqual(at(0.15, [100, 22, 12, 8, 7, 6, 4]), want, 'a plan label');
  assert.deepStrictEqual(at(0.095, [100, 22, 12, 8, 7, 6, 4]), want, 'a room label');
  // labels are sized every frame from the camera where it stands: [own height, px on screen, what it should be]
  const seen = (list) => p.run(`(()=>{${K},v=new THREE.Vector3();
    return ${list}.filter(s=>typeof s.userData.h==='number').map(s=>{const d=s.getWorldPosition(v).distanceTo(camera.position)*k;
      return [s.userData.h, +(s.scale.y/d).toFixed(6), +Math.min(s.userData.h/d,22).toFixed(6)];});})()`);
  const r = seen('labels');
  assert.ok(r.length > 20 && r.every(([h, px, want]) => h === 0.15 && px === want), 'plan labels: 150 mm, at most 22 px');
  p.run('showView("kitchen")'); p.fly(); p.tick();
  const q = seen('VIEWS.kitchen.furniture().dims.children');
  assert.ok(q.length > 0 && q.every(([h, px, want]) => h === 0.095 && px === want), 'room labels: 95 mm, at most 22 px');
});

check('размеры стен: ползунок меняет модель и всё перестраивается', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const panel = p.document.querySelector('[data-panel="plan"]');
  assert.deepStrictEqual(p.run('aptProblems(A)'), [], 'defaults fit');
  // every slider shows its size
  const n = p.run('sizeFields.length');
  assert.strictEqual(panel.querySelectorAll('[data-size]').length, n);
  assert.strictEqual(panel.querySelector('[data-size-out="kW"]').textContent, 2200);
  assert.strictEqual(panel.querySelector('[data-size-out="eW"]').textContent, 892);
  // dimensions on: built once
  const dims = panel.querySelector('#pDims'); dims.checked = true; dims.dispatch('change'); p.tick();
  const nLabels = p.run('labels.length'); assert.ok(nLabels > 20, 'labels ' + nLabels);
  // doors open, then the kitchen wall grows by 100
  panel.querySelector('[data-dm="open"]').click();
  slide(p, 'kW', 2300);
  assert.strictEqual(p.run('dimsDirty'), true, 'dimensions marked for a rebuild');
  p.tick();
  assert.strictEqual(p.run('dimsDirty'), false, 'dimensions rebuilt on the next frame');
  const r = p.run('({kW:A.kW, xL, lines:wallLines.length, parts:wallParts.length, doors:doors.length, open:doors.every(d=>d.t===d.max), labels:labels.length, rooms:roomMats.length})');
  assert.deepStrictEqual(r, { kW: 2300, xL: -2150, lines: 13, parts: 27, doors: 2, open: true, labels: nLabels, rooms: 3 });
  assert.ok(panel.querySelector('#pFacts').children.length > 0);
  assert.match(panel.querySelector('#pSub').textContent, /^3750 × /, 'sub follows the size');
  assert.strictEqual(panel.querySelector('[data-size-out="kW"]').textContent, 2300);
  assert.strictEqual(panel.querySelector('#pSizeMsg').textContent, '');
});

check('размеры стен: стенки у прохода на кухню — слева выступ кухонной стены 150, справа своя 250 (ящик для инструмента и стеллажи по её сторонам)', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const pass = () => p.run('(m=>[m.WALLS.find(w=>w.id==="kitchen").r[1],m.WALLS.find(w=>w.id==="passRight").r.slice(0,2),A.hallW])(apartment(A))');
  // the hall 1200: the passage 1200 − 150 − 250 = 800
  assert.deepStrictEqual(pass(), [150, [950, 1200], 1200]);
  // its own slider: the left one stays; the passage no narrower than 600
  slide(p, 'kOverR', 300); assert.deepStrictEqual(pass(), [150, [900, 1200], 1200]);
  slide(p, 'kOverR', 500); assert.strictEqual(p.run('A.kOverR'), 450, 'the passage 600');
  assert.match(p.document.getElementById('pSizeMsg').textContent, /Проход на кухню уже 600 мм/);
});

check('размеры стен: ползунок упирается и говорит во что', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const msg = p.document.getElementById('pSizeMsg');
  slide(p, 'bNiche', 2000);   // the bathroom is 1950 wide: niche + 100 partition fit up to 1850
  assert.strictEqual(p.run('A.bNiche'), 1850);
  assert.match(msg.textContent, /^Дальше нельзя: /);
  slide(p, 'bNiche', 1200);
  assert.strictEqual(p.run('A.bNiche'), 1200); assert.strictEqual(msg.textContent, '');
  // the entrance moves keeping its width; its width stops at the hall's right wall
  slide(p, 'eD0', 100);
  assert.deepStrictEqual(p.run('[A.eD0,A.eD1]'), [100, 992]);
  slide(p, 'eW', 1200);
  assert.deepStrictEqual(p.run('[A.eD0,A.eD1]'), [100, 1200]);
  assert.match(msg.textContent, /Входной проём/);
  // a slider with step 10 stops on its step from the current value
  // the bathroom door moves along the hall's left wall, the wall stays: up to where its casing meets the vent shaft wall (1400 − 60 − 600)
  slide(p, 'hL1', 2000);
  assert.deepStrictEqual(p.run('[A.hL1, kZ0, hLen-A.hL1-A.bDoor]'), [740, 1900, 560]);
  assert.match(msg.textContent, /вентшахты/);
  slide(p, 'hL1', 650);
  // the vent shaft is set by its depth; it stops before its wall meets the bathroom door's casing (1250 + 60): 1900 − 100 − 1310
  slide(p, 'vD', 1000);
  assert.strictEqual(p.run('A.vD'), 490); assert.ok(!p.run('aptProblems(A)').length);
  assert.deepStrictEqual(p.run('aptProblems(Object.assign({},A,{vD:500}))'), ['Наличник двери санузла заходит на стенку вентшахты']);
});

check('размеры стен: «Запомнить» и «Вернуть исходные»', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  slide(p, 'kW', 2300); slide(p, 'H', 2700);
  p.document.getElementById('pSaveA').click();
  assert.deepStrictEqual(JSON.parse(storage.get('apt-model-v1')), { H: 2700, kW: 2300 }, 'only what differs from the defaults');
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  assert.deepStrictEqual(p.run('[A.kW,A.H,xL]'), [2300, 2700, -2150]);
  assert.strictEqual(p.document.querySelector('[data-size-out="H"]').textContent, 2700);
  p.document.getElementById('pResetA').click();
  assert.deepStrictEqual(p.run('[A.kW,A.H]'), [2200, 2600]);
  assert.ok(!storage.has('apt-model-v1'));
  // sizes that do not fit are not taken from the browser
  storage.set('apt-model-v1', JSON.stringify({ bNiche: 5000 }));
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  assert.strictEqual(p.run('A.bNiche'), 1250);
  // a size the model no longer has (the vent shaft was once set from the doorway, vOff) is not saved again
  storage.set('apt-model-v1', JSON.stringify({ vOff: 150, kW: 2300 }));
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  p.document.getElementById('pSaveA').click();
  assert.deepStrictEqual(JSON.parse(storage.get('apt-model-v1')), { kW: 2300 });
});

check('шкафы: контуры деталей всегда видны, галочки нет', () => {
  // an old saved «edges: false» changes nothing
  const rooms = { kitchen: 'k', bath: 'b', hall: 'h' };
  const storage = new Map(Object.keys(rooms).map((k) => [`apt-view-${k}-v1`, JSON.stringify({ edges: false })]));
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  Object.entries(rooms).forEach(([k, l]) => {
    assert.strictEqual(p.document.querySelector(`#${l}-tEdges`), null, k);
    p.run(`showView("${k}")`); p.fly();
    // every part has its joint lines, none hidden (but a glass pane: its frame shows where it is)
    const r = p.run(`(()=>{const ps=[];const walk=o=>{if(o.userData&&typeof o.userData.part.x0==="number"&&!o.userData.part.glass)ps.push(o);(o.children||[]).forEach(walk);};walk(VIEWS.${k}.furniture().model);
      return [ps.length, ps.filter(m=>m.children.some(e=>e.raycast&&e.visible!==false)).length];})()`);
    assert.ok(r[0] > 0, k); assert.strictEqual(r[1], r[0], k);
  });
});

check('«Планировка»: шкафы всех комнат по галочке «Шкафы», строятся, только когда видны', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const rooms = '["kitchen","bath","hall"]';
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model)`), [null, null, null], 'off: nothing built');
  const furn = p.document.getElementById('pFurn'); furn.checked = true; furn.dispatch('change'); p.tick();
  // on: every room stands on the floor where it lies on the plan, without its dimension lines
  const at = () => p.run(`${rooms}.map(k=>{const f=VIEWS[k].furniture(),m=f.model,o=ROOMS.find(r=>r.id===k).origin;return [m.visible, m.position.y, f.dims.visible, m.position.x-o[0]*MM, m.position.z-o[1]*MM];})`);
  at().forEach((r) => { assert.deepStrictEqual(r.slice(0, 3), [true, 0, false]); near(r[3], 0, 'x'); near(r[4], 0, 'z'); });
  assert.strictEqual(JSON.parse(storage.get('apt-view-plan-v1')).furn, true);
  // a wall moved elsewhere only moves a room's cabinets; its own sizes build them anew
  p.run(`${rooms}.forEach(k=>{VIEWS[k].furniture().model.userData.tag=k;})`);
  p.run('setModel({hL:APT_A.hL+100})'); p.tick();
  at().forEach((r) => { near(r[3], 0, 'x'); near(r[4], 0, 'z'); });
  // (the hall's length is the hall's own: its tool case stands at the kitchen wall)
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model.userData.tag)`), ['kitchen', 'bath', null], 'moved, not rebuilt; the hall rebuilt');
  p.run('VIEWS.hall.furniture().model.userData.tag="hall"');
  p.run('setModel({hL:APT_A.hL+100, kW:2300})'); p.tick();
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model.userData.tag)`), [null, 'bath', 'hall'], 'the kitchen rebuilt');
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().P.W'), 2300);
  // the fronts swing on the plan too; the kitchen tab knows they are open and remembers it
  p.run('(VIEWS.kitchen.furniture().doors.forEach(d=>d.t=d.max), doorsChanged())'); p.tick(80, 16.67);
  near(p.run('VIEWS.kitchen.furniture().doors[0].a'), p.run('DMAX'), 'open');
  assert.deepStrictEqual([p.run('VS.kitchen.fronts'), JSON.parse(storage.get('apt-view-kitchen-v1')).fronts], ['open', 'open']);
  assert.strictEqual(p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').getAttribute('aria-pressed'), 'true');
  // back from a room the others rise out of the floor again
  p.run('showView("bath")'); p.fly();
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model.visible)`), [false, true, false]);
  p.run('showView("plan")'); p.tick(25, 17);
  near(p.run('VIEWS.kitchen.furniture().model.position.y'), -1.35, 'the kitchen halfway up');
  p.fly();
  at().forEach((r) => assert.deepStrictEqual(r.slice(0, 3), [true, 0, false]));
});

check('«Планировка»: «Резать шкафы по стенам» (по умолчанию снята) — срез на высоте стен, в «Следах» след на полу', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const plan = p.document.querySelector('[data-panel="plan"]'), rooms = ['kitchen', 'bath', 'hall'];
  // the top plane of a room (m), its footprint shown, its opacity
  const cut = (k) => p.run(`(f=>[f.clip[1].constant, f.foot.visible, f.foot.material.opacity])(VIEWS.${k}.furniture())`);
  // off by default: whole on the plan whatever the walls
  const box = plan.querySelector('#pFurnCut');
  assert.strictEqual(box.checked, false);
  plan.querySelector('[data-wm="row"]').click(); p.tick();
  rooms.forEach((k) => { assert.deepStrictEqual(cut(k).slice(1), [false, 0]); near(cut(k)[0], 2.65, k + ' whole'); });
  plan.querySelector('[data-wm="auto"]').click(); p.tick();
  box.checked = true; box.dispatch('change'); p.tick();
  assert.strictEqual(JSON.parse(storage.get('apt-view-plan-v1')).fcut, true);
  // 1 mm above the walls: the tops of the cabinets up to the ceiling are not on the plane (they would flicker)
  near(cut('kitchen')[0], 2.601, '«Разрез» at 100 %: up to the ceiling, whole');
  assert.ok(cut('kitchen')[0] > 2.6 + 5e-4, 'the plane above the tops at the ceiling');
  // «Ряд»: every room cut at the walls' 10 %
  plan.querySelector('[data-wm="row"]').click(); p.tick();
  rooms.forEach((k) => { const c = cut(k); near(c[0], 0.261, k); assert.strictEqual(c[1], false); });
  // the walls' height slider
  plan.querySelector('[data-wm="show"]').click();
  const wh = plan.querySelector('[data-wh]'); wh.value = '50'; wh.dispatch('input'); p.tick();
  near(cut('hall')[0], 1.301, 'half the ceiling');
  // «Следы»: nothing of the cabinets stands, their footprints are on the floor
  plan.querySelector('[data-wm="feet"]').click(); p.tick();
  rooms.forEach((k) => assert.deepStrictEqual(cut(k), [0, true, 1]));
  // to the kitchen: it grows whole and its footprint fades; the bathroom sinks cut as it was, its footprint stays on the floor and fades
  p.run('showView("kitchen")'); p.tick(25, 17);
  const c = cut('kitchen'); near(c[0], 2.65 / 2, 'the kitchen halfway up'); near(c[2], 0.5, 'its footprint');
  const b = p.run('(f=>[f.clip[1].constant, f.model.position.y, f.foot.material.opacity, f.foot.position.y+f.model.position.y])(VIEWS.bath.furniture())');
  near(b[1], -1.35, 'the bathroom halfway down'); near(b[0], b[1], 'cut at the floor, going down with it');
  near(b[2], 0.5, 'its footprint fades'); near(b[3], 0.003, 'on the floor');
  p.fly();
  assert.deepStrictEqual(cut('kitchen').slice(1), [false, 0]); near(cut('kitchen')[0], 2.65, 'whole in its own view');
  // off: whole on the plan whatever the walls; remembered; greyed out without the cabinets
  p.run('showView("plan")'); p.fly();
  box.checked = false; box.dispatch('change'); p.tick();
  assert.deepStrictEqual(cut('bath').slice(1), [false, 0]); near(cut('bath')[0], 2.65, 'whole');
  assert.strictEqual(JSON.parse(storage.get('apt-view-plan-v1')).fcut, false);
  const furn = plan.querySelector('#pFurn'); furn.checked = false; furn.dispatch('change');
  assert.strictEqual(box.disabled, true);
});

check('названия комнат на полу: холст по ширине текста в шрифте, как он есть сейчас (веб-шрифт пришёл позже — шире)', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  assert.deepStrictEqual(p.run('nameTexts.map(n=>n.h)'), [0.153, 0.153, 0.153], 'a line 153 mm high (170 less 10 %)');
  // the fallback font: 100 px wide; then the web font has come: 150 px
  const paint = (w) => p.run(`(()=>{nameTexts.forEach(n=>{n.g.measureText=()=>({width:${w}});n.t.__d=0;n.t.dispose=()=>{n.t.__d++;};});paintNames();
    return nameTexts.map(n=>[n.c.width,+(n.m.scale.x/n.h).toFixed(4),n.t.__d]);})()`);
  assert.deepStrictEqual(paint(100), Array(3).fill([124, +(124 / 126).toFixed(4), 1]));
  assert.deepStrictEqual(paint(150), Array(3).fill([174, +(174 / 126).toFixed(4), 1]), 'wider with the web font, the texture made anew');
  assert.deepStrictEqual(paint(150).map((r) => r[2]), [0, 0, 0], 'the same width: the texture stays');
});

check('площадь комнаты: по контуру пола (прихожая до кухонной стены, санузел без вентшахты со стенками); наведение на площадь — рамка', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  assert.deepStrictEqual(p.run('ROOMS.map(roomCaption)'), ['Прихожая · 2,28 м²', 'Санузел · 3,23 м²', 'Кухня · 14,95 м²']);
  assert.deepStrictEqual(p.run('ROOMS.map(r=>polyArea(roomPoly(r)))'), [1200 * 1900, 3230000, 14950000]);
  // the band goes inward: the bath's outline moved 40 mm in, corners mitred (the shaft's notch included)
  assert.deepStrictEqual(p.run('roomPoly(ROOMS[1])'), [[-2050, 0], [-100, 0], [-100, 1400], [-1050, 1400], [-1050, 1900], [-2050, 1900]]);
  assert.deepStrictEqual(p.run('insetPoly(roomPoly(ROOMS[1]),40)').map((v) => v.map(Math.round)),
    [[-2010, 40], [-140, 40], [-140, 1360], [-1090, 1360], [-1090, 1860], [-2010, 1860]]);
  assert.deepStrictEqual(p.run('(setHoverRoom(1),[hoverFrame.visible,hoverFrame.children.length])'), [true, 2]);
  assert.deepStrictEqual(p.run('(setHoverRoom(-1),[hoverFrame.visible,hoverFrame.children.length])'), [false, 0]);
});

check('площадь: наведение только на видимую подпись площади — за предметом или стеной контура нет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  // the area part of the bath's name lies over u 0.6…0.9; the name is 5 m from the camera
  const r = (u, front) => p.run(`(()=>{const n=nameTexts[1];n.c.width=100;n.g.measureText=t=>({width:t===n.text?78:48});
    const lh=[{object:n.m,uv:{x:${u}},distance:5}],mesh=(d,o)=>({object:Object.assign({isMesh:true,visible:true,parent:null,material:{opacity:1}},o),point:{},distance:d});
    return roomUnderCursor(lh,[${front}]);})()`);
  assert.strictEqual(r(.7, ''), 1, 'the area, nothing in front');
  assert.strictEqual(r(.3, ''), -1, 'the name part: no frame');
  assert.strictEqual(r(.7, 'mesh(3)'), -1, 'a cabinet in front of the area');
  assert.strictEqual(r(.7, 'mesh(7)'), 1, 'the floor behind it');
  assert.strictEqual(r(.7, '{object:n.m,point:{},distance:5}'), 1, 'the name itself');
  assert.strictEqual(r(.7, 'mesh(3,{parent:hoverFrame})'), 1, 'the frame itself');
  assert.strictEqual(r(.7, 'mesh(3,{material:{opacity:1,clippingPlanes:[{distanceToPoint:()=>-1}]}})'), 1, 'a part clipped away at the walls\' height');
  assert.strictEqual(r(.7, 'mesh(3,{material:{opacity:1,clippingPlanes:[{distanceToPoint:()=>1}]}})'), -1, 'a part below the cut');
});

check('shell: все вкладки — виды одного приложения в одном окне', () => {
  const shellPage = html.slice(html.indexOf('<header'));
  const shown = [];
  const p = runPage('<html>' + shellPage, { hash: '#plan' });
  const fr = p.document.getElementById('f-app');
  const cur = () => p.document.querySelectorAll('[data-tab]').filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.dataset.tab);
  assert.deepStrictEqual(p.document.querySelectorAll('iframe').map((f) => f.id), ['f-app'], 'no old pages');
  assert.deepStrictEqual([fr.hidden, fr.srcdoc === PAGES.app, p.ctx.appView], [false, true, 'plan']);
  assert.deepStrictEqual(p.document.querySelectorAll('[data-tab]').map((a) => a.dataset.tab), ['plan', 'hall', 'bath', 'kitchen', 'walk']);
  assert.deepStrictEqual(cur(), ['plan']);
  fr.contentWindow = { showView: (v) => shown.push(v) };   // the loaded app: the shell switches its view
  ['hall', 'bath', 'kitchen', 'walk', 'plan'].forEach((t) => {
    p.ctx.location.hash = '#' + t; p.ctx.dispatch('hashchange');
    assert.deepStrictEqual([cur(), p.ctx.appView, fr.hidden], [[t], t, false]);
  });
  assert.deepStrictEqual(shown, ['hall', 'bath', 'kitchen', 'walk', 'plan']);
});

check('shell: кнопка справа от вкладок сохраняет модель приложения в kvartira.glb', () => {
  const p = runPage('<html>' + html.slice(html.indexOf('<header')), { hash: '#plan' });
  const bar = p.document.querySelector('header'), save = p.document.getElementById('saveGlb');
  assert.strictEqual(save, bar.children[bar.children.length - 1], 'the button right of the tabs');
  // the page saves what the app gives: a link to the bytes, clicked once
  const blobs = [], links = [];
  p.document.body = el('body');
  p.ctx.Blob = class { constructor(parts, o) { this.parts = parts; this.type = o.type; blobs.push(this); } };
  p.ctx.URL = { createObjectURL: () => 'blob:x', revokeObjectURL() {} };
  const mk = p.document.createElement;
  p.document.createElement = (t) => { const e = mk(t); if (t === 'a') Object.assign(e, { click: () => links.push([e.href, e.download, !!e.parentElement]), remove: () => { e.parentElement.children = e.parentElement.children.filter((x) => x !== e); e.parentElement = null; } }); return e; };
  // a thenable that settles at once, so the click is done when it returns
  const now = (ok, v) => ({ then(a, b) { ok ? a(v) : b(v); return { finally(f) { f(); } }; } });
  let calls = 0;
  p.ctx.document.getElementById('f-app').contentWindow = { exportGLB: () => (calls++, now(true, 'bytes')) };
  save.click();
  assert.deepStrictEqual(JSON.parse(JSON.stringify([calls, links, blobs.map((b) => [b.parts, b.type])])), [1, [['blob:x', 'kvartira.glb', true]], [[['bytes'], 'model/gltf-binary']]]);
  assert.deepStrictEqual([save.hasAttribute('aria-busy'), p.document.body.children.length], [false, 0]);
  // the exporter could not come: the button says so, and the next click tries again
  const err = console.error; console.error = () => {};
  p.ctx.document.getElementById('f-app').contentWindow = { exportGLB: () => (calls++, now(false, new Error('offline'))) };
  save.click();
  assert.ok(/Не удалось/.test(save.title) && !save.hasAttribute('aria-busy'));
  save.click(); console.error = err; assert.strictEqual(calls, 3);
});

check('экспорт GLB: в файле только видимые сетки, непрозрачные текстуры — JPEG; всё возвращается как было', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const r = p.run(`(()=>{
    const RGBA=THREE.RGBAFormat,photo={format:RGBA},label={format:RGBA},both={format:RGBA};
    const o=(k,x)=>Object.assign({name:k,visible:true},x);
    const list=[o('wall',{isMesh:true,material:{map:photo}}),o('name',{isMesh:true,material:{map:label,transparent:true}}),
      o('glass',{isMesh:true,material:[{map:both},{map:both,transparent:true}]}),o('gone',{isMesh:true,material:{opacity:0}}),
      o('sun',{isLight:true}),o('dim',{isLine:true}),o('text',{isSprite:true}),o('off',{isMesh:true,visible:false})];
    dbg.visible=true;list.push(dbg);
    scene.traverse=f=>list.forEach(f);scene.traverseVisible=f=>list.filter(x=>x.visible).forEach(f);
    const show=exportHide(),fmt=exportJpeg();
    const during=[list.filter(x=>x.visible).map(x=>x.name),[photo,label,both].map(t=>t.format===RGBA)];
    fmt();show();
    return [during,list.filter(x=>x.visible).length,[photo,label,both].map(t=>t.format===RGBA)];})()`);
  assert.deepStrictEqual(r[0], [['wall', 'name', 'glass'], [false, true, true]], 'what goes; a map shared with a transparent material keeps its alpha');
  assert.deepStrictEqual([r[1], r[2]], [8, [true, true, true]], 'shown again, formats back');
  // the exporter is loaded once, from the three.js of the page (r128)
  p.document.head = el('head');
  p.run('(THREE.GLTFExporter=undefined,exportGLB(),exportGLB(),0)');
  assert.deepStrictEqual(p.document.head.children.map((s) => s.src), ['https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js']);
  assert.ok(/three\.js\/r128\/three\.min\.js/.test(PAGES.app), 'the page runs r128');
});

check('shell: вкладки и кнопка в одну строку; не влезают — открытая вкладка и меню остальных', () => {
  const p = runPage('<html>' + html.slice(html.indexOf('<header')), { hash: '#plan' });
  const $ = (id) => p.document.getElementById(id), bar = p.document.querySelector('header'), nav = p.document.querySelector('nav');
  const btn = $('pickBtn'), menu = $('pickMenu'), save = $('saveGlb');
  const picks = () => menu.querySelectorAll('[data-pick]');
  const cur = (sel) => p.document.querySelectorAll(sel).filter((a) => a.getAttribute('aria-current') === 'page').length;
  assert.deepStrictEqual(bar.children.map((c) => c.className), ['tabs', 'pick', 'save'], 'one row: the tabs, their menu, the button');
  assert.deepStrictEqual(picks().map((a) => [a.dataset.pick, a.href, a.getAttribute('role')]),
    ['plan', 'hall', 'bath', 'kitchen', 'walk'].map((t) => [t, '#' + t, 'menuitem']), 'the menu holds every tab');
  assert.deepStrictEqual([bar.hasAttribute('data-compact'), menu.hidden, picks()[0].getAttribute('aria-current')], [false, true, 'page']);
  // the window narrower than the tabs and the button: the open tab only
  Object.assign(nav, { scrollWidth: 520 }); Object.assign(save, { offsetWidth: 34 }); bar.clientWidth = 500;
  p.ctx.dispatch('resize');
  assert.ok(bar.hasAttribute('data-compact'));
  btn.click();
  assert.deepStrictEqual([menu.hidden, btn.getAttribute('aria-expanded')], [false, 'true']);
  // a tab chosen in the menu: the hash moves, the menu closes, both lists mark it
  p.ctx.location.hash = '#bath'; p.ctx.dispatch('hashchange');
  assert.deepStrictEqual([menu.hidden, btn.getAttribute('aria-expanded'), $('f-app').hidden], [true, 'false', false]);
  assert.deepStrictEqual([menu.querySelector('[data-pick="bath"]').getAttribute('aria-current'), cur('[data-tab]'), cur('[data-pick]')], ['page', 1, 1]);
  // Esc closes it; a click elsewhere too; the button again too
  btn.click(); menu.dispatch('keydown', { key: 'Escape' }); assert.ok(menu.hidden);
  btn.click(); p.document.listeners.click.forEach((f) => f({ target: nav })); assert.ok(menu.hidden);
  btn.click(); btn.click(); assert.ok(menu.hidden);
  // the window wide again: the row of tabs
  bar.clientWidth = 600; p.ctx.dispatch('resize');
  assert.ok(!bar.hasAttribute('data-compact'));
});
