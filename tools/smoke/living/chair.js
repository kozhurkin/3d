// кресло MILLBERGET (src/js/rooms/living/chair.js)
const { runPage, PAGES, check, assert } = require('../harness');

check('living: кресло MILLBERGET у письменного стола — выдвинуто и повёрнуто спинкой к окну, нажатие задвигает его под стол; обход сквозь него проходит', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const st = () => p.run(`(f=>{const d=f.doors.find(x=>x.key==="desk-chair"),c=d.g.parent;
    return [d.axis,Math.round(d.travel*1000),Math.round(c.position.x*1000),Math.round(c.position.z*1000),+c.rotation.y.toFixed(2),Math.round(d.g.position.z*1000),c.parent===f.appl,c.visible,Math.round(-d.g.children[0].rotation.y*180/Math.PI)];})(VIEWS.kitchen.furniture())`);
  // in the middle of the desk's knee space (4600 − 100 − 775 from the kitchen wall), facing the left wall; pushed in, its back's front at
  // the desk's top 20 short of its edge (650 + 20 + 287); out by 672 at first: the seat's front 150 past the desk's edge (383 + 672 − 255 = 800),
  // swivelled on its column, its back 20° toward the window
  assert.deepStrictEqual(st(), ['z', -672, 383, 3725, -1.57, -672, true, false, 20], 'pulled out; not in the kitchen tab');
  // what it is
  const info = p.run(`infoOf(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.deskChair===true).children[0].children[0]).title`);
  assert.strictEqual(info, 'Офисное кресло MILLBERGET (IKEA)');
  // the back and the headrest over it: 70 and 105 thick (35 proud in front), 490 and 500 wide, one leather; together up to its top along the back
  // (780 / cos 12°), the back's cushion 50 up into the headrest (its bottom 797 − 190)
  const hd = p.run(`(c=>{const bk=c.children[0].children[0].children.find(o=>o.isGroup!==false&&o.rotation&&Math.abs(o.rotation.x)>.1&&o.children.length>=3),[k,h]=bk.children,r=v=>Math.round(v*1000);
    return [r(k.geometry.args[2]),r(h.geometry.args[2]),r(h.position.z+h.geometry.args[2]/2),k.material===h.material,r(h.position.y+h.geometry.args[1]/2),r(k.position.y+k.geometry.args[1]/2)-r(h.position.y-h.geometry.args[1]/2),r(k.geometry.args[0]),r(h.geometry.args[0])];})(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.deskChair===true))`);
  assert.deepStrictEqual(hd, [70, 105, 35, true, 797, 50, 490, 500]);
  // a click pushes it in under the desk, another pulls it out again
  const click = () => { p.run('(d=>{d.t=d.t!==0?0:d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="desk-chair"))'); p.tick(120); };
  click(); assert.deepStrictEqual([st()[5], st()[8]], [0, 0], 'pushed in, straight');
  click(); assert.deepStrictEqual([st()[5], st()[8]], [-672, 20], 'pulled out again, swivelled');
  // a click moves it 20% slower than a cabinet front (.09 of the way left a frame): 1.2 times as long to get as far
  const k = p.run('VIEWS.kitchen.furniture().doors.find(x=>x.key==="desk-chair").ease');
  assert.strictEqual(+(Math.log(1 - .09) / Math.log(1 - k)).toFixed(3), 1.2);
  // the swivel over the last 30% of the way only, eased: straight halfway, half turned at 85%
  const at = (k) => p.run(`(d=>{d.a=d.max*${k};turnDoor(d);return Math.round(-d.g.children[0].rotation.y*180/Math.PI);})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="desk-chair"))`);
  assert.deepStrictEqual([at(.5), at(.7), at(.85), at(1)], [0, 0, 10, 20]);
  // the walker goes along the room through it (kitchen x 1100, from 2900 to 4200 from the kitchen wall), without stopping
  p.run('showView("walk")'); p.fly();
  assert.strictEqual(st()[7], true, 'in the apartment');
  const go = () => p.run('walkSlide(-.9,4.9,0,1.3,0,1.7).map(v=>typeof v==="number"?Math.round(v*1000):v)');
  assert.deepStrictEqual(go().slice(0, 2), [-900, 6200], 'through the chair');
  // not among what stops the walker (the stub's boxes leave out its quarter turn, so count them)
  const n = p.run('furnBoxes().length');
  p.run('VIEWS.kitchen.furniture().appl.children.forEach(o=>{if(o.userData.deskChair===true)o.userData.walkThrough=false;})');
  assert.strictEqual(p.run('furnBoxes().length'), n + 1, 'it would be one otherwise');
});
