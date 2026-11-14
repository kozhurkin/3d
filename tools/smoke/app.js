// Приложение: страницы, «Планировка», размеры стен, шкафы на плане, торцы стен, shell.
const { el, all, matches, runPage, html, PAGES, check, slide, near, assert } = require('./harness');

check('страницы в index.html', () => {
  assert.deepStrictEqual(Object.keys(PAGES), ['app']);
  Object.entries(PAGES).forEach(([k, p]) => {
    assert.ok(!/<script src="js\//.test(p), k + ': js/ module left as a link');
    assert.ok(!/<!--include /.test(p), k + ': include left in the page');
  });
});

check('приложение: «Планировка» открывается', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const r = p.run('({view, n:Object.keys(VIEWS), lines:wallLines.length, parts:wallParts.length, fade:VIEWS.plan.fade, vs:VS.plan, doors:doors.map(d=>d.g.visible)})');
  assert.strictEqual(r.view, 'plan');
  assert.deepStrictEqual(r.n, ['plan', 'kitchen', 'bath', 'hall', 'walk']);
  assert.deepStrictEqual(r.doors, [true, true], 'both doors on the plan');
  assert.strictEqual(r.lines, 12, 'all 12 walls on the plan');
  assert.strictEqual(r.parts, 26, 'wall pieces (19) + window parts (7)');
  assert.deepStrictEqual(r.fade, { entry: '-z', rightOuter: '+x', leftOuter: '-x', window: '+z' });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.vs)), { Wm: 'auto', Wh: 100, dm: 'closed', furn: true, fcut: true, dims: false, names: true, floors: true });
  const panel = p.document.querySelector('[data-panel="plan"]'), shared = p.document.getElementById('shared');
  assert.strictEqual(panel.hidden, false, 'plan panel shown');
  assert.ok(matches(shared, '[data-panel="plan"] [data-shared-slot] #shared') && !shared.hidden, 'light and wall colour in the plan panel');
  assert.strictEqual(panel.querySelector('[data-wh-out]').textContent, '100%');
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
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-plan-v1')), { Wm: 'row', Wh: 100, dm: 'open', furn: false, fcut: true, dims: true, names: true, floors: true });
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
  assert.deepStrictEqual(r, { kW: 2300, xL: -2100, lines: 12, parts: 26, doors: 2, open: true, labels: nLabels, rooms: 3 });
  assert.ok(panel.querySelector('#pFacts').children.length > 0);
  assert.match(panel.querySelector('#pSub').textContent, /^3700 × /, 'sub follows the size');
  assert.strictEqual(panel.querySelector('[data-size-out="kW"]').textContent, 2300);
  assert.strictEqual(panel.querySelector('#pSizeMsg').textContent, '');
});

check('размеры стен: ползунок упирается и говорит во что', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const msg = p.document.getElementById('pSizeMsg');
  slide(p, 'bNiche', 2000);   // the bathroom is 1900 wide: niche + 100 partition fit up to 1800
  assert.strictEqual(p.run('A.bNiche'), 1800);
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
  slide(p, 'vOff', 1000);
  const v = p.run('A.vOff'); assert.ok(v % 10 === 0 && v > 150 && !p.run('aptProblems(A)').length, 'vOff ' + v);
});

check('размеры стен: «Запомнить» и «Вернуть исходные»', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  slide(p, 'kW', 2300); slide(p, 'H', 2700);
  p.document.getElementById('pSaveA').click();
  assert.deepStrictEqual(JSON.parse(storage.get('apt-model-v1')), { H: 2700, kW: 2300 }, 'only what differs from the defaults');
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  assert.deepStrictEqual(p.run('[A.kW,A.H,xL]'), [2300, 2700, -2100]);
  assert.strictEqual(p.document.querySelector('[data-size-out="H"]').textContent, 2700);
  p.document.getElementById('pResetA').click();
  assert.deepStrictEqual(p.run('[A.kW,A.H]'), [2200, 2600]);
  assert.ok(!storage.has('apt-model-v1'));
  // sizes that do not fit are not taken from the browser
  storage.set('apt-model-v1', JSON.stringify({ bNiche: 5000 }));
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  assert.strictEqual(p.run('A.bNiche'), 1200);
});

check('шкафы: контуры деталей всегда видны, галочки нет', () => {
  // an old saved «edges: false» changes nothing
  const rooms = { kitchen: 'k', bath: 'b', hall: 'h' };
  const storage = new Map(Object.keys(rooms).map((k) => [`apt-view-${k}-v1`, JSON.stringify({ edges: false })]));
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  Object.entries(rooms).forEach(([k, l]) => {
    assert.strictEqual(p.document.querySelector(`#${l}-tEdges`), null, k);
    p.run(`showView("${k}")`); p.fly();
    // every part has its joint lines, none hidden
    const r = p.run(`(()=>{const ps=[];const walk=o=>{if(o.userData&&typeof o.userData.part.x0==="number")ps.push(o);(o.children||[]).forEach(walk);};walk(VIEWS.${k}.furniture().model);
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
  p.run('setModel({hL1:APT_A.hL1+100})'); p.tick();
  at().forEach((r) => { near(r[3], 0, 'x'); near(r[4], 0, 'z'); });
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model.userData.tag)`), ['kitchen', 'bath', 'hall'], 'moved, not rebuilt');
  p.run('setModel({hL1:APT_A.hL1+100, kW:2300})'); p.tick();
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model.userData.tag)`), [null, 'bath', 'hall'], 'the kitchen rebuilt');
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().P.W'), 2300);
  // the fronts swing on the plan too; the kitchen tab knows they are open and remembers it
  p.run('(VIEWS.kitchen.furniture().doors.forEach(d=>d.t=DMAX), doorsChanged())'); p.tick(80, 16.67);
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

check('«Планировка»: «Резать шкафы по стенам» — срез на высоте стен, в «Контурах» след на полу', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const plan = p.document.querySelector('[data-panel="plan"]'), rooms = ['kitchen', 'bath', 'hall'];
  // the top plane of a room (m), its footprint shown, its opacity
  const cut = (k) => p.run(`(f=>[f.clip[1].constant, f.foot.visible, f.foot.material.opacity])(VIEWS.${k}.furniture())`);
  assert.strictEqual(plan.querySelector('#pFurnCut').checked, true);
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
  // «Контуры»: nothing of the cabinets stands, their footprints are on the floor
  plan.querySelector('[data-wm="outline"]').click(); p.tick();
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
  const box = plan.querySelector('#pFurnCut'); box.checked = false; box.dispatch('change'); p.tick();
  assert.deepStrictEqual(cut('bath').slice(1), [false, 0]); near(cut('bath')[0], 2.65, 'whole');
  assert.strictEqual(JSON.parse(storage.get('apt-view-plan-v1')).fcut, false);
  const furn = plan.querySelector('#pFurn'); furn.checked = false; furn.dispatch('change');
  assert.strictEqual(box.disabled, true);
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
