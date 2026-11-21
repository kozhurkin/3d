// MacBook на столе (src/js/rooms/living/macbook.js)
const { runPage, PAGES, check, assert } = require('../harness');

check('living: на письменном столе MacBook Pro 16″ — посередине, перед надстройкой; клавиатура и трекпад — картинкой на корпусе, экран — на крышке; крышка открыта на 110°, по клику закрывается и открывается; экран светится, пока открыта', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const mb = () => p.run(`(f=>{const d=f.doors.find(x=>x.key==="macbook"),pl=d.g.parent,desk=pl.parent,body=d.g.children.find(o=>o.geometry&&o.geometry.args&&o.geometry.args.length===6),lid=d.g.children[d.g.children.length-1];
    return {onDesk:desk.userData.desk===true,at:[pl.position.x,pl.position.y,pl.position.z].map(v=>+(v*1000).toFixed(2)),size:body.geometry.args.slice(0,3).map(v=>+(v*1000).toFixed(1)),
      lidSize:lid.children[0].geometry.args.slice(0,3).map(v=>+(v*1000).toFixed(1)),hinge:[lid.position.y,lid.position.z].map(v=>+(v*1000).toFixed(2)),parts:d.g.children.length,
      faces:[body,lid.children[0]].map(m=>m.material.map(x=>m.material.indexOf(x))),lidParts:lid.children.length,glow:lid.children[0].material[3].emissiveIntensity,
      offsets:[body,lid.children[0]].flatMap(m=>m.material).filter(x=>x.polygonOffset===true).length,
      max:Math.round(d.max*180/Math.PI),t:d.t,rot:+lid.rotation.x.toFixed(2),title:infoOf(body).title,
      pick:pickDoor(null,{object:body,point:new THREE.Vector3()})===d};})(tt.fur())`);
  let r = mb();
  // desk axes: in the middle of its 1550, on its top at 740, its back 360 from the wall (the add-on unit 250 deep, the desk 650)
  assert.ok(r.onDesk, 'on the desk: it moves and hides with it');
  assert.deepStrictEqual(r.at, [597.15, 740, 360]);
  // Apple's sizes: 355.7 × 248.1, 16.8 thick — feet 1.5, the body 9.4, 0.6 for the keys, the lid 5.3 (2 shorter: the hinge)
  assert.deepStrictEqual(r.size, [355.7, 9.4, 248.1]);
  assert.deepStrictEqual(r.lidSize, [355.7, 5.3, 246.1]);
  assert.deepStrictEqual(r.hinge, [14.15, 2], 'the hinge at the back, the lid lying on the keys');
  // pictures instead of parts, nothing over a face: the body, four feet, the lid; the keyboard, the speakers and the trackpad on the
  // body's top face (its third), the glass, the display and the notch on the lid's inner one (its fourth), the rest silver
  assert.deepStrictEqual([r.parts, r.lidParts, r.offsets], [6, 1, 0]);
  assert.deepStrictEqual(r.faces, [[0, 0, 2, 0, 0, 0], [0, 0, 0, 3, 0, 0]]);
  // open from the start at 110°, its top edge in front of the add-on unit (at 362 + 246.1·cos 110° = 278 from the wall, the unit 250);
  // a click on any of it closes it
  assert.deepStrictEqual([r.max, Math.round(r.t * 180 / Math.PI), r.rot, r.title, r.pick], [110, 110, -1.92, 'MacBook Pro 16″ (Apple)', true], 'open; a click on any of it closes it');
  assert.strictEqual(r.glow, 1, 'the display alight');
  const click = () => { p.run('(d=>{d.t=d.t!==0?0:d.max;doorsChanged();})(tt.fur().doors.find(x=>x.key==="macbook"))'); p.tick(120); };
  click(); r = mb(); assert.ok(Math.abs(r.rot) < .02 && r.glow === 0, 'closed, the display dark');
  // closed, it stays closed through a rebuild
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  assert.strictEqual(mb().t, 0);
  click(); assert.strictEqual(mb().rot, -1.92, 'open again');
  // no front: the kitchen's «Закрыты» leaves it open
  p.document.querySelector('[data-panel="kitchen"] [data-door="closed"]').click(); p.tick(120);
  assert.strictEqual(mb().rot, -1.92);
});
