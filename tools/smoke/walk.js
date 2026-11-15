// «Обход»: вид от первого лица, ходьба, стены, двери, шкафы, прыжок, присед, высота камеры, вид стен и дверей.
const { runPage, PAGES, check, near, assert } = require('./harness');

const eye = (p) => p.run('[camera.position.x, camera.position.y, camera.position.z]');
// a key held for n frames of 16 ms
const hold = (p, code, n) => { p.key('keydown', code); p.tick(n); p.key('keyup', code); };
// a drag on the scene by dx, dy pixels (the mouse not taken: the browser in the checks has no pointer lock)
function drag(p, dx, dy = 0) {
  const c = p.document.getElementById('c');
  c.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  c.dispatch('pointermove', { clientX: 100 + dx, clientY: 100 + dy, pointerId: 1 });
  c.dispatch('pointerup', { clientX: 100 + dx, clientY: 100 + dy, pointerId: 1 });
}
// the direction of the eyes, 0…2π
const yaw = (p) => { const t = p.run('goal.theta') % (2 * Math.PI); return t < -1e-9 ? t + 2 * Math.PI : t; };
const open = (storage) => { const p = runPage(PAGES.app, { parentWin: { appView: 'walk' }, storage }); p.tick(); return p; };

check('обход: вид от первого лица у входа, в панели высота камеры (первой), вид стен, двери', () => {
  const p = open();
  const [x, y, z] = eye(p);
  near(x, 0.6, 'middle of the hall'); near(y, 1.65, 'eye height'); near(z, 0.45, 'by the entrance');
  const r = p.run(`({view, fov:camera.fov, ceil:ceiling.visible, aim:document.getElementById('walkAim').hidden, hint:document.getElementById('walkHint').hidden,
    rooms:["hall","bath","kitchen"].map(presence), lines:wallLines.length, arcs:arcs.visible, doors:doorGroup.visible, shared:document.getElementById('shared').hidden, slot:document.getElementById('shared').parentElement===document.querySelector('[data-panel="walk"] [data-shared-slot]')})`);
  assert.deepStrictEqual(r, { view: 'walk', fov: 62, ceil: true, aim: false, hint: false, rooms: [1, 1, 1], lines: 13, arcs: false, doors: true, shared: false, slot: true });
  const panel = p.document.querySelector('[data-panel="walk"]');
  assert.deepStrictEqual([panel.hidden, panel.querySelectorAll('input').map((i) => i.id), panel.querySelector('#walkEyeOut').textContent], [false, ['walkEye', 'walkWh', 'wEdge', 'Laz', 'Lel', 'Li', 'La', 'wFly'], '1650 мм']);
  const pressed = (k) => panel.querySelectorAll(`[data-${k}]`).filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset[k]);
  assert.deepStrictEqual(panel.querySelectorAll('[data-wm]').map((b) => b.dataset.wm), ['show', 'row', 'auto', 'skeleton', 'outline']);
  assert.deepStrictEqual([pressed('wm'), pressed('dm'), panel.querySelector('[data-wh-out]').textContent], [['auto'], ['closed'], '100%']);
  const info = (k) => p.document.querySelector(`#infoBtn [data-info="${k}"]`).hidden;
  assert.deepStrictEqual([info('orbit'), info('walk')], [true, false], 'the hint of the walk under «i»');
});

check('обход: W A S D идут, мышь поворачивает взгляд, колесо не приближает', () => {
  const p = open();
  hold(p, 'KeyW', 60);   // about a second forward: toward the kitchen
  let [x, y, z] = eye(p);
  near(x, 0.6, 'straight'); near(y, 1.65, 'on the floor');
  assert.ok(z > 1.9 && z < 2.9, 'a second at 2.4 m/s: ' + z);
  p.tick(30);
  const z1 = eye(p)[2]; assert.ok(z1 - z < 0.15, 'stops when the key is let go');
  // a quarter turn to the left, the eyes stay where they are
  drag(p, -Math.PI / 2 / 0.0025);
  p.tick();
  near(yaw(p), Math.PI * 1.5, 'turned left'); near(eye(p)[0], 0.6, 'the eyes did not move'); near(eye(p)[2], z1, 'the eyes did not move');
  // a look up: the pitch stops short of the vertical
  drag(p, 0, -5000); p.tick();
  assert.ok(Math.abs(p.run('goal.phi') - (Math.PI - 0.08)) < 1e-9, 'pitch clamped');
  drag(p, 0, (Math.PI / 2 - 0.08) / 0.0025); p.tick();
  near(p.run('goal.phi'), Math.PI / 2, 'level again');
  hold(p, 'KeyD', 20); assert.ok(eye(p)[2] > z1 + 0.2, 'D: to the right, facing +x that is on toward the window');
  const r0 = p.run('goal.r');
  p.document.getElementById('c').dispatch('wheel', { deltaY: 300, clientX: 10, clientY: 10 });
  p.tick();
  assert.deepStrictEqual([r0, p.run('goal.r'), p.run('camDrive===walkCam')], [1, 1, true], 'no zoom in the walk');
});

check('обход: два пальца на трекпаде идут в сторону взгляда, в любую сторону; щипок ничего не делает', () => {
  const p = open();
  const c = p.document.getElementById('c');
  const wheel = (ev) => { c.dispatch('wheel', { clientX: 10, clientY: 10, ...ev }); p.tick(30); return eye(p); };
  let [x0, , z0] = eye(p);
  // facing +z (toward the kitchen): fingers up — forward, PAD m per pixel
  let [x, y, z] = wheel({ deltaY: 50 });
  near(z, z0 + 0.2, 'forward 0.2 m'); near(x, x0, 'straight'); near(y, 1.65, 'on the floor');
  [x, , z] = wheel({ deltaX: -25 }); near(x, x0 - 0.1, 'fingers to the right: to the right, that is −x'); near(z, z0 + 0.2, 'sideways only');
  [x, , z] = wheel({ deltaY: -25, deltaX: 25 }); near(x, x0, 'back and left at once'); near(z, z0 + 0.1, 'back and left at once');
  [x, , z] = wheel({ deltaY: 3, deltaMode: 1 }); near(z, z0 + 0.1 + 0.192, 'lines: 16 px each');
  [x0, , z0] = eye(p);
  [x, , z] = wheel({ deltaY: 300, ctrlKey: true }); assert.deepStrictEqual([x, z], [x0, z0], 'a pinch does not walk');
  // a fast swipe: at the gait's speed, and no more than PAD_LAG s of the way behind
  c.dispatch('wheel', { deltaY: 5000 }); p.tick();
  assert.ok(eye(p)[2] - z0 <= 2.4 * 0.1 + 1e-9, 'a frame: no faster than walking');
  p.tick(30); near(eye(p)[2], z0 + 2.4 * 0.15, 'the rest of the swipe dropped');
  // into the wall: the rest of the swipe does not push on
  for (let i = 0; i < 6; i++) c.dispatch('wheel', { deltaX: -100 }), p.tick(10);
  x = eye(p)[0]; assert.ok(Math.abs(x - 0.15) < 0.01, 'stopped by the hall\'s wall: ' + x);
  assert.deepStrictEqual(p.run('[pad.f, pad.s]'), [0, 0], 'nothing left to go');
  // typing into a field: the keys are not the game's
  p.tick(30); const z2 = eye(p)[2]; p.key('keydown', 'KeyS', { target: { tagName: 'INPUT' } }); p.tick(20); p.key('keyup', 'KeyS');
  near(eye(p)[2], z2, 'no walk while typing');
});

check('обход: стены и закрытая дверь не пускают, открытая — пускает', () => {
  const p = open();
  drag(p, Math.PI / 2 / 0.0025); p.tick();   // a quarter turn to the right: facing the hall's left wall (−x)
  near(yaw(p), Math.PI / 2, 'facing −x');
  hold(p, 'KeyW', 90);
  // by the entrance: the hall cabinet's cladding of the reveal ends 50 mm before the eyes (z 0.4, x up to 99 mm): its corner stops the body
  near(eye(p)[0], 0.099 + Math.sqrt(0.15 ** 2 - 0.05 ** 2), 'stops at the corner of the cladding');
  // past the bathroom door, nothing along the wall: up to the wall itself
  p.run('setEye(0.6,1.65,1.55)'); p.tick();
  hold(p, 'KeyW', 90);
  near(eye(p)[0], 0.15, 'stops at the wall, the body\'s radius away');
  // in front of the bathroom door: closed, it is a wall
  p.run('setEye(0.6,1.65,0.95)'); p.tick();
  hold(p, 'KeyW', 90);
  near(eye(p)[0], 0.15, 'the closed door stops');
  p.run('doors.find(d=>d.hole==="hallBath:0").t=1.5'); p.tick(60);
  hold(p, 'KeyW', 60);
  assert.ok(eye(p)[0] < -0.12, 'through the open door into the bathroom: ' + eye(p)[0]);
  // the door closes on the walker standing in it: they can still walk out
  p.run('setEye(0,1.65,0.95)'); p.run('doors.find(d=>d.hole==="hallBath:0").t=0'); p.tick(120);
  drag(p, Math.PI / 0.0025); p.tick();
  hold(p, 'KeyW', 40);
  assert.ok(eye(p)[0] > 0.3, 'out of the closed doorway back into the hall: ' + eye(p)[0]);
  // the window is never a way out
  assert.ok(p.run('walkObstacles().some(b=>b[0]===(winX-A.winW/2)*MM&&b[1]===(winX+A.winW/2)*MM&&b[2]===zEnd*MM&&b[4]===0&&b[5]===H*MM)'), 'the window opening is in the way');
});

check('обход: вид стен и двери из панели, сохраняются; без дверей проёмы свободны', () => {
  const storage = new Map();
  let p = open(storage);
  const panel = () => p.document.querySelector('[data-panel="walk"]');
  const pressed = (k) => panel().querySelectorAll(`[data-${k}]`).filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset[k]);
  // the walls cut to half: no ceiling over them, the walls still stop the walker
  const wh = panel().querySelector('[data-wh]'); wh.value = '50'; wh.dispatch('input'); p.tick();
  assert.deepStrictEqual(p.run('[ceiling.visible, wallParts.filter(w=>w.m.visible).every(w=>w.m.position.y+w.h*w.m.scale.y/2<=H*MM/2+1e-6), wallBoxes.length>0]'), [false, true, true]);
  panel().querySelector('[data-wm="skeleton"]').click(); p.tick();
  assert.deepStrictEqual([pressed('wm'), panel().querySelector('[data-wh-out]').textContent, p.run('[wallMat.opacity, ceiling.visible]')], [['skeleton'], '50%', [0, false]]);
  wh.value = '100'; wh.dispatch('input'); panel().querySelector('[data-wm="show"]').click(); p.tick();
  assert.strictEqual(p.run('ceiling.visible'), true, 'solid walls up to the ceiling: the ceiling is back');
  panel().querySelector('[data-wm="outline"]').click(); p.tick();
  assert.deepStrictEqual(p.run('[wallParts.some(w=>w.m.visible), doorGroup.visible, ceiling.visible]'), [false, false, false], 'outlines: no walls, no doors');
  // the doors: open, the plan's segment follows; a door shut by a click: nothing pressed
  panel().querySelector('[data-dm="open"]').click(); p.tick(60);
  assert.deepStrictEqual([pressed('dm'), p.run('doors.every(d=>d.t===d.max)'), p.run('VS.plan.dm')], [['open'], true, 'open']);
  const planOpen = p.document.querySelector('[data-panel="plan"] [data-dm="open"]').getAttribute('aria-pressed');
  assert.strictEqual(planOpen, 'true', 'the plan shows the doors open too');
  p.run('doors[0].t=0'); p.run('doorsChanged()');
  assert.deepStrictEqual(pressed('dm'), [], 'doors differ: nothing pressed');
  // no doors: none shown, none to click, and the closed bathroom door does not stop the walker
  panel().querySelector('[data-wm="show"]').click();
  p.run('doors.forEach(d=>{d.t=d.a=0;})'); p.run('doorsChanged()');
  panel().querySelector('[data-dm="none"]').click(); p.tick();
  assert.deepStrictEqual([pressed('dm'), p.run('doorGroup.visible'), p.run('doors.every(d=>d.t===0)')], [['none'], false, true]);
  drag(p, Math.PI / 2 / 0.0025); p.run('setEye(0.6,1.65,0.95)'); p.tick();
  hold(p, 'KeyW', 60);
  assert.ok(eye(p)[0] < -0.12, 'through the doorway without a door: ' + eye(p)[0]);
  p.run('doorsChanged()'); assert.deepStrictEqual(pressed('dm'), ['none'], 'a click elsewhere keeps «Без дверей»');
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-walk-v1')), { Wm: 'show', Wh: 100, dm: 'none', arcs: false, eye: 1650 });
  p = open(storage);
  assert.deepStrictEqual([pressed('wm'), pressed('dm'), p.run('doorGroup.visible')], [['show'], ['none'], false], 'remembered');
});

check('обход: разрез — снаружи квартиры внешние стены и потолок убираются, изнутри всё на месте', () => {
  const p = open();
  const seen = () => p.run('({walls:wallParts.filter(w=>w.m.visible).length, all:wallParts.length, ceil:ceiling.visible})');
  let r = seen(); assert.deepStrictEqual([r.walls, r.ceil], [r.all, true], 'inside: every wall and the ceiling');
  // out of the entrance, looking at it: the entrance wall goes, the ceiling too; the walls still stop the walker
  p.run('doors.forEach(d=>{d.t=d.a=d.max;})'); p.run('setEye(0.6,1.65,-0.8)'); p.tick();
  r = seen(); assert.ok(r.walls < r.all, 'outside: the outer wall hides ' + r.walls + '/' + r.all); assert.strictEqual(r.ceil, false, 'no ceiling outside');
  assert.ok(p.run('walkObstacles().length') >= p.run('wallBoxes.length'), 'the hidden walls still stop');
  // solid walls: everything stays, outside as well
  p.document.querySelector('[data-panel="walk"] [data-wm="show"]').click(); p.tick();
  r = seen(); assert.deepStrictEqual([r.walls, r.ceil], [r.all, true]);
});

check('обход: цвет стен и свет из общего блока', () => {
  const storage = new Map();
  const p = open(storage);
  const panel = p.document.querySelector('[data-panel="walk"]');
  const sw = panel.querySelectorAll('#wcs [data-wc]').find((b) => b.dataset.wc !== p.run('S.wc'));
  sw.click(); p.tick();
  assert.strictEqual(p.run('S.wc'), sw.dataset.wc);
  assert.strictEqual(sw.getAttribute('aria-pressed'), 'true');
  const az = panel.querySelector('#Laz'); az.value = '40'; az.dispatch('input');
  assert.strictEqual(p.run('S.light.az'), 40);
  const saved = [...storage.values()].map((v) => { try { return JSON.parse(v); } catch (e) { return null; } }).find((v) => v && v.light);
  assert.deepStrictEqual([saved.wc, saved.light.az], [sw.dataset.wc, 40], 'saved with the common settings');
});

check('обход: потолок белый при любом цвете стен', () => {
  const p = open();
  // what the walls and the ceiling are painted with (the stub's colours keep nothing: write it down)
  p.run('(()=>{globalThis.__paint={};wallMat.color.set=v=>{__paint.wall=v;};ceilColor.set=v=>{__paint.ceil=v;};ceilMat.color.copy=c=>{__paint.copied=c===ceilColor;};return 0;})()');
  p.document.querySelector('[data-wc="greige"]').click(); p.tick();
  assert.deepStrictEqual(p.run('[__paint.wall,__paint.ceil===wallCol(WALLC.white),__paint.copied]'), ['#C7BEB1', true, true]);
});

check('«Контур стен» — общая галочка: 50% или никаких, в скелете тёмные всегда, одна для всех вкладок', () => {
  const storage = new Map();
  let p = open(storage);
  const eg = () => p.document.getElementById('wEdge');
  assert.deepStrictEqual([p.run('edgeMat.opacity'), eg().checked], [0.5, true]);
  eg().checked = false; eg().dispatch('change'); p.tick();
  assert.deepStrictEqual([p.run('edgeMat.opacity'), JSON.parse(storage.get('apt-shared-v1')).edge], [0, false], 'off: no outlines');
  p.document.querySelector('[data-panel="walk"] [data-wm="skeleton"]').click(); p.tick();
  near(p.run('edgeMat.opacity'), 0.9, 'the skeleton keeps its dark outlines');
  p.document.querySelector('[data-panel="walk"] [data-wm="auto"]').click(); p.tick();
  // the plan: the same setting, no outlines there either; on again — on the plan too
  p.run('showView("plan")'); p.fly(); near(p.run('edgeMat.opacity'), 0, 'off on the plan as well');
  eg().checked = true; eg().dispatch('change'); p.tick(); near(p.run('edgeMat.opacity'), 0.5, 'on: half dark');
  // remembered for every tab
  eg().checked = false; eg().dispatch('change');
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  assert.deepStrictEqual([p.run('S.edge'), eg().checked, p.run('edgeMat.opacity')], [false, false, 0]);
});

check('обход: контуры видны и во внутренних углах — стены, полы и потолок чуть за линиями по глубине', () => {
  const p = open();
  const r = p.run(`({walls:wallParts.every(w=>[].concat(w.m.material).filter(m=>m!==glassMat).every(m=>m.polygonOffset===true&&m.polygonOffsetFactor>0)),
    floors:roomMats.every(m=>m.polygonOffset===true&&m.polygonOffsetFactor>0), ceil:ceilMat.polygonOffset===true&&ceilMat.polygonOffsetFactor>0,
    lines:wallLines.every(l=>l.e.material===edgeMat)&&edgeMat.polygonOffset!==true, feet:footMat.polygonOffsetFactor<0})`);
  assert.deepStrictEqual(r, { walls: true, floors: true, ceil: true, lines: true, feet: true });
});

check('обход: правая кнопка отпускает мышь, как Esc', () => {
  const p = open();
  p.run('(()=>{document.pointerLockElement=canvas;window.__exit=0;document.exitPointerLock=()=>{document.pointerLockElement=null;window.__exit++;};})()');
  const c = p.document.getElementById('c'), t0 = p.run('doors.map(d=>d.t)');
  c.dispatch('pointerdown', { button: 2, clientX: 100, clientY: 100, pointerId: 1 }); p.tick();
  assert.deepStrictEqual([p.run('window.__exit'), p.run('locked()'), p.run('doors.map(d=>d.t)')], [1, false, t0], 'mouse given back, no door touched');
  // not taken: the right button neither drags the look nor takes the mouse
  const th = p.run('goal.theta');
  c.dispatch('pointerdown', { button: 2, clientX: 100, clientY: 100, pointerId: 2 });
  c.dispatch('pointermove', { clientX: 300, clientY: 100, pointerId: 2 }); c.dispatch('pointerup', { button: 2, clientX: 300, clientY: 100, pointerId: 2 });
  assert.deepStrictEqual([p.run('goal.theta'), p.run('window.__exit')], [th, 1]);
});

check('обход: мышь захвачена — щелчок переключает дверь при отпускании, удержание двигает её постепенно', () => {
  const p = open();
  p.run('(document.pointerLockElement=canvas,0)'); p.run('pickDoor=()=>doors.find(d=>d.hole==="hallBath:0")');
  const c = p.document.getElementById('c'), d = 'doors.find(d=>d.hole==="hallBath:0")';
  const down = () => c.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  const up = () => c.dispatch('pointerup', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  p.run(`${d}.t=${d}.a=0`);
  // a short press: nothing while down, the door opens on release
  down(); p.tick(10);
  assert.deepStrictEqual(p.run(`[${d}.t, held]`), [0, null], 'nothing yet while the button is down');
  up(); p.tick();
  assert.strictEqual(p.run(`${d}.t===${d}.max`), true, 'opened on release');
  // held: past HOLD_MS the door goes evenly at HOLD_RATE from where it stands, and stays where it is let go
  p.run(`${d}.t=${d}.a=0`);
  down(); p.tick(32);
  assert.strictEqual(p.run(`held&&held.d===${d}&&held.dir`), 1, 'closed: taken to open');
  p.tick(30); up();
  const a = p.run(`${d}.a`);
  assert.ok(a > 0.3 && a < p.run(`${d}.max`) - 0.1, 'part-open: ' + a);
  p.tick(30);
  assert.deepStrictEqual(p.run(`[held, ${d}.t, ${d}.a]`), [null, a, a], 'let go: it stays');
  // held again: a part-open door goes back
  down(); p.tick(32);
  assert.strictEqual(p.run('held.dir'), -1, 'part-open: reversed');
  p.tick(200); up();
  assert.strictEqual(p.run(`${d}.a`), 0, 'closed again');
  // Esc gave the mouse back while the button was down: no click on release
  down(); p.run('document.pointerLockElement=null'); up(); p.tick();
  assert.strictEqual(p.run(`${d}.t`), 0, 'no click after Esc');
});

check('обход: шкафы мешают пройти', () => {
  const p = open();
  const r = p.run(`(()=>{
    const fb=furnBoxes(),lo=STEP,hi=1.75,out={n:fb.length,free:true,inside:0,stopped:0};
    ROOMS.forEach(rm=>{
      // from the middle of the room toward the middle of each of its cabinet's parts that stands in the way, in 5 cm steps
      // (the room's name lies by the kitchen's worktop: from the middle of the floor there)
      const s0=rm.id==='kitchen'?[(rm.r[0]+rm.r[1])/2,(rm.r[2]+rm.r[3])/2]:rm.at;
      fb.filter(b=>b[4]<hi&&b[5]>lo).forEach(b=>{let x=s0[0]*MM,z=s0[1]*MM;
        if(fb.some(c=>hits(c,x,z,lo,hi)))out.free=false;
        const cx=(b[0]+b[1])/2,cz=(b[2]+b[3])/2,n=Math.ceil(Math.hypot(cx-x,cz-z)/.05);
        for(let i=0;i<n;i++)[x,z]=walkSlide(x,z,(cx-x)/(n-i),(cz-z)/(n-i),lo,hi);
        if(fb.some(c=>hits(c,x,z,lo,hi)))out.inside++;
        if(Math.hypot(cx-x,cz-z)>.05)out.stopped++;});});
    return out;})()`);
  assert.ok(r.n > 50, 'parts of the three rooms: ' + r.n);
  assert.deepStrictEqual([r.free, r.inside], [true, 0], 'never inside a cabinet');
  assert.ok(r.stopped > 0, 'stopped short of the cabinets');
});

check('обход: прыжок, присед, высота камеры сохраняется', () => {
  const storage = new Map();
  let p = open(storage);
  p.key('keydown', 'Space'); p.tick(12);
  const top = eye(p)[1]; assert.ok(top > 1.95 && top < 2.15, 'in the air: ' + top);
  p.tick(60); near(eye(p)[1], 1.65, 'landed');
  p.tick(30); near(eye(p)[1], 1.65, 'a held Space does not jump again');
  p.key('keyup', 'Space');
  p.key('keydown', 'KeyC'); p.tick(60);
  near(eye(p)[1], 1.65 * (1 - 0.32), 'crouched');
  const z0 = eye(p)[2]; p.key('keydown', 'KeyW'); p.tick(60); p.key('keyup', 'KeyW');
  assert.ok(eye(p)[2] - z0 < 1, 'crouching is slow: ' + (eye(p)[2] - z0));
  p.key('keyup', 'KeyC'); p.tick(60); near(eye(p)[1], 1.65, 'up again');
  p.key('keydown', 'ControlLeft'); p.tick(60); near(eye(p)[1], 1.65 * (1 - 0.32), 'crouched with Ctrl');
  p.key('keyup', 'ControlLeft'); p.tick(60); near(eye(p)[1], 1.65, 'up again');
  const s = p.document.getElementById('walkEye'); s.value = '1200'; s.dispatch('input'); p.tick();
  near(eye(p)[1], 1.2, 'the eye height from the panel');
  assert.strictEqual(p.document.getElementById('walkEyeOut').textContent, '1200 мм');
  assert.strictEqual(JSON.parse(storage.get('apt-view-walk-v1')).eye, 1200);
  p = open(storage); near(eye(p)[1], 1.2, 'remembered');
});

check('обход: перелёт с плана и обратно, камера и угол обзора', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  assert.deepStrictEqual(p.run('[camera.fov, ceiling.visible, presence("walk")]'), [35, false, 0]);
  p.run('showView("walk")'); p.tick(25, 17);
  near(p.run('camera.fov'), 48.5, 'halfway to the wide angle');
  assert.strictEqual(p.run('camDrive===driveCam'), true, 'the flight drives the camera');
  p.fly();
  const [x, y, z] = eye(p); near(x, 0.6, 'at the entrance'); near(y, 1.65, 'at eye height'); near(z, 0.45, 'at the entrance');
  assert.deepStrictEqual(p.run('[camera.fov, ceiling.visible, camDrive===walkCam]'), [62, true, true]);
  hold(p, 'KeyW', 30); const zw = eye(p)[2];
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(p.run(`[camera.fov, ceiling.visible, camDrive, document.getElementById('walkAim').hidden, presence("walk"), presence("bath"), document.getElementById('shared').hidden]`),
    [35, false, null, true, 0, 1, false]);
  // the keys are the walk's only
  const t0 = p.run('goalT.z'); hold(p, 'KeyW', 20); near(p.run('goalT.z'), t0, 'no walking on the plan');
  // back: where the walk was left
  p.run('showView("walk")'); p.fly();
  near(eye(p)[2], zw, 'the walk goes on where it was left');
});

check('обход: от входа можно дойти в душ, санузел и на кухню (двери открыты)', () => {
  const p = open();
  p.run('doors.forEach(d=>{d.t=d.a=d.max;})'); p.tick();
  // the floor in 2 cm cells: which the walker standing can be in, reached step by step from the entrance
  const r = p.run(`(()=>{
    const bs=walkObstacles(),lo=STEP,hi=eyeH()+.1,S=.02,x0=BOX.x0*MM,z0=BOX.z0*MM,nx=Math.ceil((BOX.x1-BOX.x0)*MM/S),nz=Math.ceil((BOX.z1-BOX.z0)*MM/S);
    const cell=(x,z)=>[Math.round((x-x0)/S),Math.round((z-z0)/S)],free=(i,j)=>!bs.some(b=>hits(b,x0+i*S,z0+j*S,lo,hi));
    const seen=new Uint8Array(nx*nz),q=[cell(eyeNow()[0],eyeNow()[2])];seen[q[0][0]*nz+q[0][1]]=1;
    while(q.length){const [i,j]=q.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{const u=i+a,v=j+b;
      if(u<0||v<0||u>=nx||v>=nz||seen[u*nz+v])return;seen[u*nz+v]=1;if(free(u,v))q.push([u,v]);else seen[u*nz+v]=2;});}
    const at=(x,z)=>{const [i,j]=cell(x*MM,z*MM);return seen[i*nz+j]===1;};
    // the shower: between the wall at the niche end, the shower partition, the kitchen wall and the left wall
    const xSh=bx(A.bWs+A.bGap);
    return {shower:at((xL+xSh)/2,(bz(A.bL+A.wt)+kZ0)/2),bath:at(...ROOMS.find(r=>r.id==='bath').at),kitchen:at((xL+A.hallW)/2,(kZ1+zEnd)/2)};
  })()`);
  assert.deepStrictEqual(r, { shower: true, bath: true, kitchen: true });
});

check('обход: на сенсорном экране палец в левом нижнем углу — стик (скорость по отклонению), в остальном — взгляд, тап — дверь', () => {
  const p = open();
  const c = p.document.getElementById('c'), st = p.document.getElementById('walkStick'), hint = p.document.getElementById('walkHint');
  const touch = (t, id, x, y) => c.dispatch(t, { pointerType: 'touch', button: 0, pointerId: id, clientX: x, clientY: y });
  const info = p.document.getElementById('infoBtn'), cam = p.document.getElementById('camBtn');
  cam.click(); p.tick();   // the mini view open
  assert.deepStrictEqual([st.hidden, info.hidden, cam.hidden, p.run('showDebug')], [true, false, false, true], 'no stick before a touch: the checks have no touch screen');
  // the corner is a square of 264 px (a third of the canvas's 800 × 600): above it or right of it a finger looks, not walks
  touch('pointerdown', 5, 120, 300); touch('pointermove', 5, 120, 200); touch('pointerup', 5, 120, 200);
  touch('pointerdown', 6, 300, 400); touch('pointermove', 6, 300, 300); touch('pointerup', 6, 300, 300); p.tick(30);
  assert.strictEqual(st.className, 'stick', 'no stick outside the corner'); near(eye(p)[2], 0.45, 'no step');
  near(p.run('goal.phi'), Math.PI / 2 + 2 * 200 * 0.0025, 'the two drags looked up, a finger twice as fast as the mouse'); p.run('look(0,400)'); near(p.run('goal.phi'), Math.PI / 2, 'level again');
  // in the corner: the stick comes under the finger
  touch('pointerdown', 7, 120, 400); p.tick();
  assert.deepStrictEqual([st.hidden, st.className, st.style.left, st.style.top, hint.hidden, hint.textContent], [false, 'stick on', '120px', '400px', false, hint.dataset.touch]);
  assert.deepStrictEqual([info.hidden, cam.hidden, p.run('showDebug'), p.run('inset.hidden')], [true, true, false, true], 'no «i» and no mini view in the walk on a touch screen');
  // a finger moved a little: no step yet
  touch('pointermove', 7, 120, 396); p.tick(30);
  near(eye(p)[2], 0.45, 'within the dead zone');
  // half way to the edge: slower than walking; all the way: as W
  touch('pointermove', 7, 120, 376); p.tick(30);
  const half = eye(p)[2] - 0.45;
  assert.ok(half > 0.3 && half < 0.6, 'half the stick, half a second: ' + half);
  touch('pointermove', 7, 120, 300); p.tick(30);
  const full = eye(p)[2] - 0.45 - half;
  assert.ok(full > 1.0 && full < 1.25, 'the whole stick, half a second at 2.4 m/s: ' + full);
  assert.strictEqual(p.run('knobEl.style.transform'), 'translate(0px,-48px)', 'the knob stops at the circle');
  near(eye(p)[0], 0.6, 'straight on');
  // a second finger on the right half looks; the stick finger let go, the look goes on
  touch('pointerdown', 8, 600, 300); touch('pointerup', 7, 120, 300); touch('pointermove', 8, 600 - Math.PI / 4 / 0.0025, 300); p.tick(30);
  near(yaw(p), Math.PI * 1.5, 'turned left'); const z1 = eye(p)[2]; p.tick(30); near(eye(p)[2], z1, 'stops when let go');
  touch('pointerup', 8, 600 - Math.PI / 4 / 0.0025, 300);
  assert.deepStrictEqual([st.hidden, st.className, hint.hidden], [false, 'stick', true], 'faint at home; the hint gone once walked');
  // a tap in the corner: the door under the finger, no step
  p.run('pickDoor=()=>doors.find(d=>d.hole==="hallBath:0")');
  touch('pointerdown', 9, 100, 500); touch('pointerup', 9, 102, 501); p.tick();
  assert.ok(p.run('doors.find(d=>d.hole==="hallBath:0").t>0'), 'the tap opened the door');
  // a mouse: no stick
  c.dispatch('pointerdown', { pointerType: 'mouse', button: 0, pointerId: 1, clientX: 100, clientY: 100 }); c.dispatch('pointerup', { pointerId: 1, clientX: 100, clientY: 100 }); p.tick();
  assert.deepStrictEqual([st.hidden, hint.hidden, info.hidden, cam.hidden], [true, false, false, false]);
});
