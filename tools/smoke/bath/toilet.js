// инсталляция и унитаз: модель, размеры, крышка (src/js/rooms/bath/toilet.js)
const { round, runPage, PAGES, check, assert } = require('../harness');

check('санузел: унитаз — подвесной AZARIO Allegro AZ-3105B 490 × 360, высота 360 с сиденьем, смеситель гигиенического душа на правом боку', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const r = p.run(`(f=>{const g=f.sani.children.find(o=>o.userData.toilet===true),mm=v=>tt.mm(v),all=[],walk=o=>{all.push(o);o.children.forEach(walk);};walk(g);const by=k=>all.find(o=>o.userData.wc===k);
    const ax=o=>[mm(o.position.x),mm(o.position.y),mm(o.position.z-o.geometry.args[2]/2),mm(o.position.z+o.geometry.args[2]/2),mm(o.geometry.args[0]*2)];
    return {at:[mm(g.position.x),mm(g.position.y),mm(g.position.z)],box:{zf:f.current.zf,Lt:f.P.Lt,Di:f.P.Di},
      bowl:by('bowl').geometry.userData.box,seat:by('seat').geometry.userData.box,lid:by('lid').geometry.userData.box,
      rose:ax(by('rose')),knob:ax(by('knob')),white:['bowl','seat','lid'].every(k=>by(k).material===by('bowl').material),
      chrome:by('rose').material===by('knob').material&&by('knob').material.metalness>=.7,info:g.userData.info(),trap:[mm(by('trap').position.x),mm(by('trap').position.y),mm(by('trap').geometry.args[0]*2)]};})(tt.fur("bath"))`);
  // on the installation box's face (200 out of the left wall), in the middle of its run; the ceramic's top 400 from the floor, so its bottom at 65
  assert.deepStrictEqual(r.at, [r.box.Di, 65, r.box.zf + r.box.Lt / 2]);
  // the ceramic 490 out, 360 wide, 335 high; the seat 11 on it, the lid up to 360, both from in front of their hinge bar (65) to the front
  assert.deepStrictEqual(r.bowl, [0, 490, 0, 335, -180, 180]);
  assert.deepStrictEqual(r.seat, [65, 489, 335, 346, -179, 179]);
  assert.deepStrictEqual(r.lid, [65, 489, 347, 360, -179, 179]);
  assert.ok(r.white, 'the ceramic, the seat and the lid one glossy white');
  // the mixer on the right side as one sits (+z): a rosette Ø56 on the ceramic, the knob Ø38 out of it by 32, 60 off the wall, half way up the ceramic (335 / 2)
  assert.deepStrictEqual(r.rose, [60, 168, 180, 185, 56]);
  assert.deepStrictEqual(r.knob, [60, 168, 185, 217, 38]);
  assert.ok(r.chrome, 'chrome');
  assert.strictEqual(r.info.title, 'Унитаз подвесной AZARIO Allegro AZ-3105B');
  assert.deepStrictEqual([r.info.price, r.info.url, r.info.shop], [11500, 'https://ozon.ru/t/DtLQ3zf', 'Ozon']);
  assert.match(r.info.lines[0], /^49 × 36 см, высота 36 см/);
  assert.ok(r.info.lines.some((l) => /40 см от пола/.test(l)));
  // the bowl down to 190 under the rim, the trap's water Ø90 in its bottom
  assert.deepStrictEqual(r.trap, [245, 146, 90]);
});

check('санузел: крышка унитаза откидывается только по нажатию на неё или на сиденье — на микролифте за сиденьем, чуть за отвес до короба инсталляции', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const D = `tt.fur("bath").doors.find(d=>d.key==='wc-lid')`;
  const run = (n) => { for (let i = 0; i < n; i++) p.tick(); };
  const st = () => p.run(`(d=>{const mm=v=>tt.mm(v),h=d.g.parent,lid=d.g.children[0],t=h.parent;
    return {axis:d.axis,s:d.s,max:Math.round(d.max*180/Math.PI),a:+d.a.toFixed(3),rot:+d.g.rotation.x.toFixed(3),frame:d.frame&&d.frame.userData.wc,inToilet:t.userData.toilet===true,
      hinge:[mm(h.position.x),mm(h.position.y),mm(h.position.z)],across:+h.rotation.y.toFixed(4),lid:lid.userData.wc,back:[+lid.rotation.y.toFixed(4),mm(lid.position.y),mm(lid.position.z)]};})(${D})`);
  let r = st();
  // a door of the bathroom, turning about its holder's x; the holder on the hinge bar's axis (Ø28 on two posts 3 out of the rim, the seat's
  // hinge too: 50 off the wall, 335 + 3 + 14 up), turned so its x runs across; the seat its frame: a click on the lid or the seat works it, not one on the bowl
  assert.deepStrictEqual(r, { axis: 'x', s: -1, max: 95, a: 0, rot: 0, frame: 'seat', inToilet: true, hinge: [50, 352, 0], across: 1.5708, lid: 'lid', back: [-1.5708, -352, -50] });
  const parts = p.run(`(t=>{const all=[],w=o=>{all.push(o);o.children.forEach(w);};w(t);const mm=v=>tt.mm(v),by=k=>all.filter(o=>o.userData.wc===k);
    const m1=v=>Math.round(v*10000)/10,cyl=o=>[m1(o.position.x),m1(o.position.y),m1(o.position.z),m1(o.geometry.args[0]*2),m1(o.geometry.args[2])];
    return {bar:by('bar').map(cyl),knuckles:by('knuckle').map(cyl),posts:by('post').map(cyl),button:by('button').map(o=>[o.geometry.kind,mm(o.position.x),mm(o.position.x+o.geometry.args[1].depth),mm(o.position.y),mm(o.position.z)].concat(o.userData.size)),lid:by('lid')[0].geometry.userData.box.slice(0,2),
      buffers:by('buffer').map(o=>[mm(o.position.x),mm(o.position.z),o.parent.userData.wc]),nozzle:by('nozzle').map(o=>[mm(o.position.x-o.geometry.args[2]/2),mm(o.position.x+o.geometry.args[2]/2),mm(o.position.y)]),
      white:['bar','knuckle','button'].every(k=>by(k).every(o=>o.material===by('lid')[0].material&&o.receiveShadow===true)),halo:by('halo').map(o=>[o.geometry.kind,mm(o.position.x),mm(o.position.x+o.geometry.args[1].depth),mm(o.position.y),+o.rotation.y.toFixed(4)])};})(tt.item("toilet","bath"))`);
  // a soft-close hinge: two chrome posts Ø32 in the ceramic, 155 apart, 3 out of the rim; on them the bar Ø28 260 long — the damper's housing,
  // a knuckle 25 at each end, a hair apart — and the quick release's button on its front, 26 × 10 with fully round ends, 1 out of it, all of the seat's white; the lid from 1 in front of it to the front;
  // two buffers under it, over the seat's ring; the bidet's nozzle 4 out of the bowl's back wall (as it was), the chrome ring round it 2 out, the nozzle 2 out of it
  assert.deepStrictEqual(parts.posts, [[50, 336.5, -77.5, 32, 3], [50, 336.5, 77.5, 32, 3]]);
  assert.deepStrictEqual(parts.bar, [[50, 352, 0, 28, 208]]);
  assert.deepStrictEqual(parts.knuckles, [[50, 352, -117.5, 29, 25], [50, 352, 117.5, 29, 25]]);
  assert.deepStrictEqual(parts.button, [['THREE.ExtrudeGeometry', 63, 65, 352, 0, 26, 10]]);
  assert.ok(parts.white, 'the hinge of the seat\'s and the lid\'s white, shaded as they are');
  assert.deepStrictEqual(parts.lid, [65, 489]);
  assert.deepStrictEqual(parts.buffers, [[395, -130, 'lid'], [395, 130, 'lid']]);
  assert.deepStrictEqual(parts.nozzle, [[127, 130, 305]]);
  assert.deepStrictEqual(parts.halo, [['THREE.ExtrudeGeometry', 126, 128, 305, 1.5708]]);
  // a click: up a little past plumb, till its far end's upper edge is 2 off the installation's face (50 + 439·cos a − 8·sin a = 2); again: down
  p.run(`(d=>{d.t=d.t!==0?0:d.max;})(${D})`); run(120);
  r = st(); assert.strictEqual(r.a, +p.run(`${D}.max`).toFixed(3)); assert.strictEqual(r.rot, -r.a);
  const a = p.run(`${D}.a`); assert.strictEqual(Math.round((50 + 439 * Math.cos(a) - 8 * Math.sin(a)) * 10) / 10, 2);
  p.run(`(d=>{d.t=d.t!==0?0:d.max;})(${D})`); run(120);
  r = st(); assert.deepStrictEqual([r.a, r.rot], [0, 0]);
  assert.ok(p.run(`tt.item("toilet","bath").userData.info().lines.includes('Нажатие на крышку или сиденье поднимает и опускает крышку.')`));
  // a click picks it on the lid or the seat, nothing on the bowl (pickDoor's rule: up the parents, a door's g or frame; up to the
  // toilet's group here, the stub's parents go on for ever)
  const pick = (k) => p.run(`(t=>{const all=[],w=o=>{all.push(o);o.children.forEach(w);};w(t);const ds=tt.fur("bath").doors;
    for(let o=all.find(q=>q.userData.wc==='${k}');o&&o!==t.parent;o=o.parent){const d=ds.find(d=>d.g===o||d.frame===o);if(d)return d.key;}return null;})(tt.item("toilet","bath"))`);
  assert.deepStrictEqual(['lid', 'seat', 'bowl', 'bar'].map(pick), ['wc-lid', 'wc-lid', null, null]);
  // no front: «Открыты» and «Закрыты» in the panel leave it as it is, down or up
  const bq = (q) => p.document.querySelector('[data-panel="bath"]').querySelector(q);
  assert.strictEqual(p.run(`${D}.loose`), true);
  bq('[data-door="open"]').click(); run(120); assert.strictEqual(p.run(`${D}.t`), 0);
  p.run(`(d=>{d.t=d.max;})(${D})`); run(120); bq('[data-door="closed"]').click(); run(120);
  assert.strictEqual(p.run(`${D}.t===${D}.max`), true, 'still up');
});
