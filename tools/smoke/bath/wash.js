// стиральная машина, раковина над ней, шкафчик с зеркальными дверцами, смеситель (src/js/rooms/bath/wash.js)
const { round, runPage, PAGES, check, piece, assert } = require('../harness');

check('санузел: стиральная машина и раковина над ней в нише справа от входа', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const shown = () => p.run('(g=>g?g.visible:"none")(tt.item("wash","bath"))');
  const box = () => p.run('(b=>[b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z].map(v=>tt.mm(v)))(new THREE.Box3().setFromObject(tt.item("wash","bath")))');
  // the view's frame ends at the partition next to the tall cabinet: its own view hides them
  assert.strictEqual(shown(), false, 'built with the sanitary ware, hidden in the bathroom view');
  // between the partition (−700) and the hall wall (−100), from the back wall up to the machine's dial (573, the stub leaving out the
  // control panel's lean; the door's ring and glass are not in its box), up to the lamp on the cabinet over the sink
  const b = box();
  assert.deepStrictEqual([b[0], b[1], b[4], b[5]], [-700, -100, 0, 573]);
  assert.strictEqual(b[3], 2055);
  // the machine 595 × 850 × 505 (Haier HWD80-BP14959A), its front flush with the sink's (550), so 45 mm off the back wall, in the middle
  // of the niche (x 1302.5…1897.5 → −697.5…−102.5 on the plan; its front panel with the opening is not in the stub's box, the dial on the
  // control panel is: the stub leaves the panel's lean out; behind, the cord's plug 38 off the wall, past the lid's back edge (45)):
  // hollow, a drum inside (cuff, drum, front ring, back)
  const mc = 'tt.item("wash","bath").children.find(m=>m.userData.machine===true)';
  assert.deepStrictEqual(p.run(`(b=>[b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z].map(v=>Math.round(v*10000)))(new THREE.Box3().setFromObject(${mc}))`), [-6975, -1025, 0, 8500, 380, 5730]);
  assert.strictEqual(p.run(`${mc}.children.filter(m=>m.userData.drum===true).length`), 4);
  // the drum Ø470 × 340 behind a 40 mm cuff, its axis through the door's centre (440 up)
  assert.deepStrictEqual(p.run(`(m=>[m.geometry.args[0]*2,m.geometry.args[2],m.position.y,m.position.z].map(v=>tt.mm(v)))(${mc}.children.filter(m=>m.userData.drum===true)[1])`), [470, 340, 440, 328]);
  // the sink's bottom: 600 × 550 from the back wall, 30 mm over the machine
  const sink = p.run('(g=>{const c=g.children[2];return [c.geometry.args,c.position.y,c.position.z].flat().map(v=>tt.mm(v));})(tt.item("wash","bath"))');
  assert.deepStrictEqual(sink, [600, 20, 550, 890, 275]);
  // on the plan it shows
  p.run('showView("plan")'); p.tick();
  assert.strictEqual(shown(), true, 'shown on the plan');
});

check('санузел: дверца стиральной машины — левое открывание на 135°, без ручки, стекло чашей внутрь', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const D = `tt.fur("bath").doors.find(d=>d.key==='washer')`;
  const st = () => p.run(`(d=>[d.s,tt.mm(d.g.position.x),tt.mm(d.max),d.g.children[0].children[0].userData.ring===true,Math.round(d.g.children[0].children[1].geometry.args[0]*2000)])(${D})`);
  const run = (n) => { for (let i = 0; i < n; i++) p.tick(); };
  const click = () => { p.run(`(d=>{d.t=d.t!==0?0:d.max;})(${D})`); run(80); };
  // Ø520 door (a ring, the Ø360 glass in its middle); the hinge on the left, 12 mm past its edge: x 1650 − 272, in the door's face
  // (550 + 30). It opens to the maker's 135°: the partition, 28 mm left of the axis, ends flush with the body's front, behind the door
  assert.deepStrictEqual(st(), [-1, 1378, 2356, true, 360], 'closed, on the left hinge');
  assert.strictEqual(p.run(`Math.round(${D}.g.position.z*1000)`), 580);
  click();
  assert.deepStrictEqual(st().slice(0, 2), [-1, 1378], 'opens on the left hinge');
  assert.ok(p.run(`${D}.a`) > 1.5, 'swung open');
  click(); click();
  assert.deepStrictEqual(st().slice(0, 2), [-1, 1378], 'the same hinge every time');
  const r = p.run(`(d=>{const mm=v=>tt.mm(v),c=d.g.children[0].children,b=c.find(o=>o.userData.bowl===true);
    return {n:c.length,bowl:[b.geometry.args[0],b.geometry.args[1]].map(v=>mm(v*2)).concat([mm(b.position.z-b.geometry.args[2]/2),mm(b.position.z+b.geometry.args[2]/2)])};})(${D})`);
  // the ring, the glass bowl, the chrome rim, the glass's dome: no handle, no bracket
  assert.strictEqual(r.n, 4);
  // the glass: Ø360 at the ring's face (22 out of the body), a bowl 100 deep into the drum, Ø280 at its bottom
  assert.deepStrictEqual(r.bowl, [360, 280, -100, 22]);
  // «Открыты» in the bathroom panel opens it to its stop, and the panel sees every front open
  p.run(`(d=>{d.t=0;})(${D})`); run(200);
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  bq('[data-door="open"]').click(); run(2);
  assert.strictEqual(p.run(`${D}.t`), p.run(`${D}.max`));
  assert.strictEqual(bq('[data-door="open"]').getAttribute('aria-pressed'), 'true');
});

check('санузел: стиральная машина — Haier HWD80-BP14959A: на ножках, наклонная панель управления, крышка нависает над задником со шлангами', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const W = 'tt.item("wash","bath")', mc = `${W}.children.find(m=>m.userData.machine===true)`;
  const r = p.run(`(m=>{const mm=v=>tt.mm(v),feet=m.children.filter(o=>o.userData.foot===true),boxes=m.children.filter(o=>o.geometry&&o.geometry.kind==='THREE.BoxGeometry');
    const ext=o=>[o.position.y-o.geometry.args[1]/2,o.position.y+o.geometry.args[1]/2,o.position.z-o.geometry.args[2]/2,o.position.z+o.geometry.args[2]/2].map(mm);
    const prof=o=>[o.userData.profile,mm(o.geometry.args[1].depth),mm(o.position.x),o.rotation.y];
    const back=m.children.find(o=>o.userData.washBack===true),all=back.children;
    return {feet:feet.map(o=>[mm(o.position.y-o.geometry.args[2]/2),mm(o.position.y+o.geometry.args[2]/2)]),
      bottom:Math.min(...boxes.map(o=>mm(o.position.y-o.geometry.args[1]/2))),
      lid:ext(boxes.find(o=>o.userData.lid===true)),backPanel:ext(boxes.find(o=>o.userData.back===true)),
      housing:prof(m.children.find(o=>o.userData.housing===true)),panel:prof(m.children.find(o=>o.userData.panel===true)),
      hatch:m.children.filter(o=>o.userData.hatch===true).length,
      hoses:all.filter(o=>typeof o.userData.hose==='string').map(o=>[o.userData.hose,mm(o.geometry.args[2])]),
      bolts:all.filter(o=>o.userData.bolt===true).length,valve:all.filter(o=>o.userData.valve===true).length,
      behind:Math.min(...all.filter(o=>o.geometry&&o.geometry.kind!=='THREE.TubeGeometry').map(o=>mm(o.position.z-(o.rotation.x?o.geometry.args[2]:o.geometry.args[2])/2))),
      plug:(q=>q&&{at:[q.position.x,q.position.y,q.position.z].map(mm),
        body:q.children.filter(o=>o.userData.body===true).map(o=>[mm(o.position.x),mm(o.geometry.args[0]),mm(o.geometry.args[2])]),
        pins:q.children.filter(o=>o.userData.pin===true).map(o=>[mm(o.position.x*10)/10,mm(o.position.y*10)/10,mm(o.geometry.args[0]*20)/10,mm(o.geometry.args[2])])})(all.find(o=>o.userData.plug===true)),
      cordEnd:(c=>[c.x,c.y,c.z].map(mm))(all.find(o=>o.userData.hose==='cord').userData.end),
      plugTip:(q=>{const l=boxes.find(o=>o.userData.lid===true);return mm(l.position.x+l.geometry.args[0]/2-q.position.x)-39;})(all.find(o=>o.userData.plug===true)),
      zp:mm(boxes.find(o=>o.userData.back===true).position.z-boxes.find(o=>o.userData.back===true).geometry.args[2]/2),
      info:typeof m.userData.info==='function'?m.userData.info():null};})(${mc})`);
  // four feet 15 high, the body on them
  assert.deepStrictEqual(r.feet, [[0, 15], [0, 15], [0, 15], [0, 15]]);
  assert.strictEqual(r.bottom, 15);
  // the lid 28 thick from 45 off the wall (the body 505 back from the sink's front, 550) up to the control panel's housing 68 deep;
  // the back panel 27 in from the lid's back edge
  assert.deepStrictEqual(r.lid, [822, 850, 45, 482]);
  assert.deepStrictEqual(r.backPanel.slice(2), [72, 84]);
  // the housing across the whole width, from the panel's bottom (735) to the top, its face leaning back 22; the black face 3 mm on it
  assert.deepStrictEqual(r.housing, [[[482, 735], [550, 735], [528, 850], [482, 850]], 595, 1353, Math.PI / 2]);
  assert.deepStrictEqual(r.panel[0], [[550, 735], [553, 735], [531, 850], [528, 850]]);
  // no filter hatch on the front
  assert.strictEqual(r.hatch, 0);
  // on the back: the drain hose Ø22, the inlet hose Ø12, the cord Ø8; the inlet valve, four transit bolts; all of it in the lid's overhang
  assert.deepStrictEqual(r.hoses, [['drain', 11], ['inlet', 6], ['cord', 4]]);
  assert.deepStrictEqual([r.bolts, r.valve], [4, 1]);
  assert.ok(r.behind >= 45, `nothing behind the lid's back edge: ${r.behind}`);
  // the cord's plug: a cylinder Ø34 × 20 on the back panel, its axis 17 off it (7 past the 27 overhang, 38 off the wall), the cord
  // ending in the middle of its back; two pins Ø4.8 × 19, 19 apart, out of its face
  assert.ok(r.plug, 'the plug is a group of its own');
  assert.deepStrictEqual(r.plug.body, [[10, 17, 20]]);
  assert.deepStrictEqual(r.plug.pins, [[29.5, -9.5, 4.8, 19], [29.5, 9.5, 4.8, 19]]);
  // clear of the drain hose (Ø22 up the right side, its axis 23…29 in from it): the pins' tips 61 in from that side
  assert.strictEqual(r.plugTip, 61);
  assert.strictEqual(r.zp - r.plug.at[2], 17);
  assert.deepStrictEqual(r.cordEnd, r.plug.at, 'the cord goes into the plug');
  // the door: a 22 deep ring, its glass domed 8 more: 535 from the lid's back edge (580 from the wall)
  const d = p.run(`(d=>{const g=d.g.children[0].children.find(o=>o.userData.dome===true),a=g.geometry.args;return Math.round((d.g.position.z+d.g.children[0].position.z+g.position.z+a[0])*1000);})(tt.fur("bath").doors.find(d=>d.key==='washer'))`);
  assert.strictEqual(d, 580);
  // its card: the model, its sizes and loads, a link to the shop; the door has the same
  assert.strictEqual(r.info.title, 'Стирально-сушильная машина Haier HWD80-BP14959A');
  assert.ok(r.info.lines[0].startsWith('59.5 × 53.5 см с дверцей, высота 85 см') && r.info.lines[1] === 'Стирка до 8 кг, сушка до 5 кг.' && r.info.lines[2] === 'Дверца Ø52 см, загрузочный люк Ø36 см; петли слева, открывается на 135°.', r.info.lines.join(' / '));
  assert.strictEqual(r.info.shop, 'DNS');
  assert.strictEqual(p.run(`tt.fur("bath").doors.find(d=>d.key==='washer').g.userData.info().title`), r.info.title);
});

check('санузел: шкафчик над раковиной — отдельное изделие с зеркальными дверцами', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const W = 'tt.fur("bath")', cab = `${W}.sani.children.find(m=>m.userData.wash===true).children.slice(-1)[0]`;
  // its boards: 600 wide (the niche), 200 deep with the doors, 300 over the sink (1000): from 1300 to 2000, two shelves; not in the bathroom's parts
  const parts = p.run(`${cab}.children.map(o=>(o.userData.part&&o.userData.part.name?o.userData.part:o.children[0].userData.part)).map(q=>[q.name,q.x0,q.x1,q.y0,q.y1,q.z0,q.z1])`);
  assert.strictEqual(parts.length, 10);
  assert.deepStrictEqual(parts[0], ['Бок шкафчика над раковиной', 1350, 1366, 1300, 2000, 0, 184]);
  assert.strictEqual(parts.filter((q) => q[0] === 'Полка шкафчика над раковиной').length, 2);
  assert.deepStrictEqual(parts.filter((q) => q[0] === 'Фасад шкафчика над раковиной').map((q) => q.slice(1)), [[1351, 1649, 1301, 1999, 184, 200], [1651, 1949, 1301, 1999, 184, 200]]);
  assert.ok(!p.run(`${W}.current.parts.some(q=>/раковин/.test(q.name))`), 'not in the bathroom cut list');
  assert.ok(!/раковин/.test(p.document.querySelector('[data-panel="bath"]').querySelector('#b-csv').value));
  // a mirror on each door, in front of its face, edge to edge; the doors are the room's: a click opens them
  // (its doors: the room's on its group, the last of the wash's)
  assert.deepStrictEqual(p.run(() => tt.doors(tt.item('wash', 'bath').children.slice(-1)[0], 'bath')
    .map((d) => { const m = d.g.children.find((c) => c.userData.mirror === true); return [m.geometry.args, m.position.z + d.g.position.z].flat().map((v) => tt.mm(v)); })),
  [[298, 698, 4, 202], [298, 698, 4, 202]]);
  p.run(() => { tt.doors(tt.item('wash', 'bath').children.slice(-1)[0], 'bath').forEach((d) => { d.t = d.max; }); return 0; });
  for (let i = 0; i < 60; i++) p.tick();
  assert.ok(p.run(() => tt.doors(tt.item('wash', 'bath').children.slice(-1)[0], 'bath').every((d) => d.a > 1)), 'they swing open with the room\'s doors');
  // a lamp on its top (2000): a bracket, the bar 450 × 25 × 25 mm 45 mm past the mirrors and 30 mm over the top, its glowing underside
  const lamp = p.run(`${W}.sani.children.find(m=>m.userData.wash===true).children.filter(m=>['body','glow'].includes(m.userData.lamp)).map(m=>[m.geometry.args,m.position.y-m.geometry.args[1]/2,m.position.z-m.geometry.args[2]/2,m.userData.lamp==='glow'].flat().map(v=>typeof v==='boolean'?v:tt.mm(v)))`);
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
  assert.strictEqual(p.run(() => infoOf(tt.doors(tt.item('wash', 'bath').children.slice(-1)[0], 'bath')[0].g.children.find((c) => c.userData.mirror === true)).title),
    'Зеркальный шкафчик над раковиной');
});

check('санузел: смеситель раковины — высокий хромированный корпус, плоский носик над чашей, рычаг-пластина сверху, под шкафчиком', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const r = p.run(`(w=>{const mm=v=>tt.mm(v),all=(o,a=[])=>{a.push(o);(o.children||[]).forEach(c=>all(c,a));return a;};
    const q=w.children.filter(o=>o.userData.mixer===true),rack=all(tt.fur("bath").sani).filter(o=>o.userData.rackPart==='riser');
    const boxes=q.filter(o=>o.geometry.kind==='THREE.BoxGeometry');
    return {n:q.length,chrome:q.every(o=>o.material===rack[0].material),lit:q.every(o=>o.castShadow===true&&o.receiveShadow!==true),
      ext:boxes.map(o=>[mm(o.position.y-o.geometry.args[1]/2),mm(o.position.y+o.geometry.args[1]/2),mm(o.position.z+o.geometry.args[2]/2)]),
      lever:q.filter(o=>o.geometry.kind==='THREE.ExtrudeGeometry').map(o=>[mm(o.position.y-o.geometry.args[1].depth),mm(o.position.y)]),
      foot:mm(q[0].position.y-q[0].geometry.args[2]/2)};})(tt.item("wash","bath"))`);
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
