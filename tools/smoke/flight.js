// Перелёты между вкладками.
const { all, runPage, PAGES, check, piece, near, assert } = require('./harness');

check('перелёт «Планировка» → «Кухня»: стены, шкафы, солнце и камера движутся вместе', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  // the plan is seen from the window side: the window wall is hidden by its cut-mode rule
  assert.strictEqual(piece(p, 'window').visible, false);
  const c0 = p.run('({theta:cam.theta, r:cam.r})');
  // the mini view: from the whole apartment to the kitchen's frame, with the rest of the flight, without a jump
  const inset = () => p.run('insetNow()'), b0 = inset(), bT = p.run('insetFrame(VIEWS.kitchen)');
  assert.deepStrictEqual(b0.map(Math.round), p.run('[BOX.x0, BOX.x1, BOX.z0, BOX.z1]'));
  p.run('showView("kitchen")');
  inset().forEach((v, i) => near(v, b0[i], 'the mini view does not jump at the start'));
  const g = p.run('({theta:goal.theta, r:goal.r})');
  // in the flight: the walls of both views with their outlines, nothing to click, the camera driven by the flight
  assert.deepStrictEqual(p.run('[inTransition(), wallLines.length, wallParts.length, camDrive!==null, pickDoor({clientX:0,clientY:0})]'), [true, 12, 26, true, null]);
  p.tick(25, 17);   // 425 ms of 850: halfway, the eased progress is 0.5 too
  near(p.run('tr.e'), 0.5, 'progress');
  // a wall hidden on the plan and not in the kitchen stays hidden all the way (it does not pop up to sink again)
  assert.strictEqual(piece(p, 'window').visible, false, 'hidden window wall stays hidden');
  // the left wall shrinks from the whole wall (z 0…6750) to the kitchen's frame (1900…3350): now 950…5050;
  // the kitchen's 3/4 camera is left of it, so the kitchen's cut mode hides it: it also goes down, halfway now
  const lo = piece(p, 'leftOuter');
  near(lo.sz, 4100 / 6750, 'left wall length'); near(lo.z, 3.0, 'left wall centre'); near(lo.sy, 0.5, 'left wall height');
  // a wall that is not in the kitchen is halfway down; the kitchen wall stays
  near(piece(p, 'hallBath').sy, 0.5, 'hall/bath wall height'); near(piece(p, 'kitchen').sy, 1, 'kitchen wall height');
  // footprints fade between the views: half gone under a wall that leaves, whole under one that stays; walls high above the floor are solid
  const mat = (id, k) => p.run(`morph.mats.get("${id}").${k}.opacity`);
  near(mat('hallBath', 'foot'), 0.5, 'leaving footprint'); near(mat('window', 'foot'), 0.5, 'footprint of the hidden window wall');
  near(mat('kitchen', 'foot'), 1, 'kitchen wall footprint'); near(mat('hallBath', 'body'), 1, 'a wall 1.3 m high');
  // the plan shows the cabinets: the kitchen's stay where they are, the bathroom's and the hall's are halfway into the floor;
  // the sun's shadows close in on the kitchen, the camera is halfway
  const k = p.run('({s:presence("kitchen"), y:VIEWS.kitchen.furniture().model.position.y, sb:presence("bath"), yb:VIEWS.bath.furniture().model.position.y, sh:presence("hall"), half:sunHalf, theta:cam.theta, r:cam.r})');
  near(k.s, 1, 'kitchen presence'); near(k.y, 0, 'kitchen on the floor'); near(k.half, 3.8, 'shadow box');
  near(k.sb, 0.5, 'bathroom presence'); near(k.yb, -1.35, 'bathroom below the floor'); near(k.sh, 0.5, 'hall presence');
  near(k.theta, (c0.theta + g.theta) / 2, 'camera angle'); near(k.r, (c0.r + g.r) / 2, 'camera distance');
  inset().forEach((v, i) => near(v, (b0[i] + bT[i]) / 2, 'the mini view halfway'));
  p.tick(24, 16.67);   // ≈ 0.97 of the flight: the leaving walls are below 1 cm
  const lowCut = p.run('morphWall(morph.w.get("hallBath"),morph.e).cut');
  assert.ok(lowCut > 1 && lowCut < 40, 'a low wall ' + lowCut);
  near(mat('hallBath', 'body'), lowCut / 150, 'low wall fades'); near(mat('hallBath', 'cap'), lowCut / 150, 'its dark top too');
  assert.ok(mat('hallBath', 'foot') < 0.1 && mat('hallBath', 'line') < 0.05, 'footprint and outline almost gone');
  // landed: the kitchen's own walls with outlines, the kitchen on the floor, the camera free; the left wall hidden by the
  // cut mode just as the flight ended it
  p.fly();
  const r = p.run('({tr:inTransition(), lines:wallLines.length, parts:wallParts.length, y:VIEWS.kitchen.furniture().model.position.y, half:sunHalf, drive:camDrive, theta:cam.theta, goal:goal.theta})');
  assert.deepStrictEqual([r.tr, r.lines, r.parts, r.y, r.half, r.drive], [false, 2, 2, 0, 3, null]);
  near(r.theta, r.goal, 'camera at the goal');
  inset().forEach((v, i) => near(v, bT[i], 'the mini view on the kitchen'));
  assert.deepStrictEqual([piece(p, 'leftOuter').visible, piece(p, 'kitchen').visible], [false, true]);
  // the flight's own materials are gone: the walls are back on the shared ones (the wall colour setting reaches them)
  assert.deepStrictEqual(p.run('[morph, wallParts.every(w=>w.m.material[0]===wallMat&&w.m.material[2]===capMat), wallFeet.every(f=>f.m.material===footMat)]'), [null, true, true]);
});

check('перелёт: разный вид стен у вкладок — высота и «Скелет» меняются плавно', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const plan = p.document.querySelector('[data-panel="plan"]');
  plan.querySelector('[data-wm="row"]').click(); p.tick();   // the plan in «Ряд»: walls 10 % high
  p.run('showView("kitchen")'); p.tick(25, 17);
  near(piece(p, 'kitchen').sy, (260 + (2600 - 260) / 2) / 2600, 'kitchen wall grows from 10 % to full');
  p.fly();
  p.run('showView("plan")'); p.fly();
  plan.querySelector('[data-wm="skeleton"]').click(); p.tick();
  assert.strictEqual(p.run('wallMat.opacity'), 0);
  p.run('showView("kitchen")'); p.tick(25, 17);
  near(p.run('wallMat.opacity'), 0.5, 'see-through skeleton turns solid gradually');
  p.fly();
  assert.strictEqual(p.run('wallMat.opacity'), 1);
});

check('перелёт: прерывание, мышь забирает камеру, «уменьшить движение»', () => {
  let p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  p.run('showView("kitchen")'); p.tick(25, 17);
  // back to the plan in the middle: the new flight starts from what is on screen
  p.run('showView("plan")');
  assert.deepStrictEqual(p.run('[morph.w.get("leftOuter").rF, morph.w.get("leftOuter").rT]').map((r) => r.map(Math.round)), [[-2200, -2000, 950, 5050], [-2200, -2000, 0, 6750]]);
  near(p.run('morph.w.get("leftOuter").cF'), 1300, 'the left wall starts from halfway down');
  near(p.run('tr.pres0.bath'), 0.5, 'the bathroom starts from halfway');
  p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length, presence("bath"), VIEWS.bath.furniture().model.position.y]'), ['plan', 12, 1, 0]);
  // a drag takes the camera back; the walls finish their flight
  p.run('showView("kitchen")'); p.tick(5);
  const c = p.document.getElementById('c');
  c.dispatch('pointerdown', { pointerId: 1, clientX: 10, clientY: 10, button: 0, pointerType: 'mouse' });
  c.dispatch('pointermove', { pointerId: 1, clientX: 40, clientY: 10 });
  c.dispatch('pointerup', { pointerId: 1, clientX: 40, clientY: 10, button: 0 });
  assert.deepStrictEqual(p.run('[camDrive, inTransition()]'), [null, true]);
  p.fly();
  assert.deepStrictEqual(p.run('[inTransition(), wallLines.length]'), [false, 2]);
  // reduced motion: no flight, the kitchen at once
  p = runPage(PAGES.app, { parentWin: { appView: 'plan' }, reduce: true }); p.tick();
  p.run('showView("kitchen")');
  assert.deepStrictEqual(p.run('[inTransition(), wallLines.length]'), [false, 2]);
});

check('перелёт «Санузел» → «Прихожая»: входная дверь появляется, когда несущая стена накрыла её проём', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const on = () => p.run('[entranceDoor().g.visible, entranceDoor().frame.visible, arcs.children.filter(l=>l.userData.hole==="entry:0").every(l=>l.visible)]');
  assert.deepStrictEqual(on(), [false, false, false], 'the opening is past the bathroom frame');
  p.run('showView("hall")');
  // the bearing wall goes from the niche (x −2200…−700) to the hall (−100…1400): halfway it is −1150…350,
  // the opening (84…976) is not in it yet — no door, no swing
  p.tick(25, 17);
  assert.deepStrictEqual(on(), [false, false, false], 'halfway');
  // at 0.9 of the way the wall is −1255…1340: the opening is whole, the door is there with its own materials (nothing is cut)
  p.tick(20, 17);
  assert.deepStrictEqual(on(), [true, true, true], 'the opening in the wall');
  assert.strictEqual(p.run('entranceDoor().g.children[0].material===entMat'), true);
  p.fly();
  assert.deepStrictEqual(p.run('[entranceDoor().g.visible, morph]'), [true, null]);
});

check('перелёт «Планировка» ⇄ «Прихожая»: дверь санузла идёт вместе со стеной — вниз и вверх, по длине — с проёмом', () => {
  // in the hall the hall/bath wall is hidden by the cut mode and its doorway is past the frame: the door is not there.
  // [the wall's height, the height its door is cut at] in mm
  const now = p => p.run('(n=>[n.cut,n.h].map(Math.round))(morphWall(morph.w.get("hallBath"),morph.e))');
  const door = p => p.run('(d=>[d.g.visible, arcs.children.filter(l=>l.userData.hole===d.hole).every(l=>l.visible)])(doors.find(d=>d.hole==="hallBath:0"))');
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  p.run('showView("hall")'); p.tick(25, 17);
  // halfway the wall is 0…1275 long and 1.3 m high: the doorway (650…1250) is still in it, the door goes down with it
  assert.deepStrictEqual([now(p), door(p)], [[1300, 1300], [true, true]], 'halfway down, the door with the wall');
  p.tick(10, 17);   // e ≈ 0.82: the wall is 0…875, the doorway is cut — the door is gone
  assert.deepStrictEqual(door(p), [false, false]);
  p.fly();
  assert.deepStrictEqual(door(p), [false, false], 'in the hall');
  // and back: the wall grows from the frame's 650 mm; the door shows only when the doorway is whole in it, at its height
  p.run('showView("plan")');
  assert.deepStrictEqual(now(p), [0, 0], 'from the floor');
  p.tick(10, 17);   // e ≈ 0.10: the wall is 0…780
  assert.deepStrictEqual(door(p), [false, false], 'the doorway is not in the wall yet');
  p.tick(15, 17);   // e = 0.5: 0…1275
  assert.deepStrictEqual([now(p), door(p)], [[1300, 1300], [true, true]], 'halfway up, the doorway in the wall');
});

check('перелёт: без галочки «Анимированный перелёт» — как раньше: стены сразу, камера доезжает', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const box = p.document.getElementById('wFly');
  assert.strictEqual(box.checked, true);
  box.checked = false; box.dispatch('change');
  assert.strictEqual(JSON.parse(storage.get('apt-shared-v1')).fly, false);
  p.run('showView("kitchen")');
  // the kitchen's walls, furniture and shadows at once, nothing flies
  p.tick();
  assert.deepStrictEqual(p.run('[inTransition(), morph, camDrive, wallLines.length, presence("kitchen"), VIEWS.kitchen.furniture().model.position.y, sunHalf]'), [false, null, null, 2, 1, 0, 3]);
  // the camera glides to the kitchen by itself
  assert.ok(Math.abs(p.run('cam.theta-goal.theta')) > 1e-3, 'the camera is on its way');
  p.tick(120, 16.67);
  near(p.run('cam.theta'), p.run('goal.theta'), 'camera at the goal');
  // remembered: off after a reload too, and the flight is back with the box
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  assert.deepStrictEqual([p.run('S.fly'), p.document.getElementById('wFly').checked], [false, false]);
  const b = p.document.getElementById('wFly'); b.checked = true; b.dispatch('change');
  p.run('showView("plan")');
  assert.strictEqual(p.run('inTransition()'), true);
});
