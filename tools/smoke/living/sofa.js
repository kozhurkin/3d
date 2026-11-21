// полка над диваном, угловой диван «Слим» (src/js/rooms/living/sofa.js)
const { runPage, PAGES, check, assert } = require('../harness');

check('living: белая полка 2000 × 250 над диваном — под антресолью, вровень с ней, на трёх белых L-образных кронштейнах (стойка вверх, за полкой); низ на 1375', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // the desk shelf's board painted white (its fourth, after HEMNES): the same board and brackets
  const deskShelf = 'tt.item("desk").children.find(o=>o.userData.shelfBracket===true)';
  p.run(`clickOf({object:${deskShelf}})()`); p.run(`clickOf({object:${deskShelf}})()`); p.run(`clickOf({object:${deskShelf}})()`);
  const r = p.run(`(f=>{const q=tt.item("sofaShelf"),mm=v=>tt.mm(v),ds=tt.item("desk");
    const white={br:ds.children.find(o=>o.userData.shelfBracket===true).material,carcass:ds.children.find(o=>o.userData.part&&o.userData.part.name==='Полка над столом').material[4]};
    const board=q.children.find(o=>o.userData.part),br=q.children.filter(o=>o.userData.bracket===true);
    const box=o=>{const [sx,sy,sz]=o.geometry.args,c=o.position;return [c.x-sx/2,c.x+sx/2,c.y-sy/2,c.y+sy/2,c.z-sz/2,c.z+sz/2].map(mm);};
    const straight=br.filter(o=>!+o.rotation.x),ys=straight.map(box);
    return {at:[mm(q.position.x),mm(q.position.z)],turn:+q.rotation.y,board:(b=>[b.x0,b.x1,b.y0,b.y1,b.z0,b.z1])(board.userData.part),
      boardWhite:board.material.includes(white.carcass),deskWhite:infoOf(ds.children.find(o=>o.userData.shelfBracket===true)).lines[0],n:br.length,white:br.every(o=>o.material===white.br),
      struts:br.length-straight.length,arms:straight.filter(o=>o.geometry.args[2]>.01).map(o=>[mm(o.position.x),box(o)[5]]),low:Math.min(...ys.map(b=>b[2])),high:Math.max(...ys.map(b=>b[3])),
      info:infoOf(q),pick:infoOf(br[0]).title===infoOf(board).title};})(tt.fur())`);
  // kitchen axes: on the right wall (3250) from the wardrobe's side at the sofa (2390), as the mezzanine; turned as the sofa
  assert.deepStrictEqual([r.at, r.turn], [[3250, 2390], -Math.PI / 2]);
  // own axes: 2000 along the wall, 25 thick, 250 deep, off the wall by the brackets' 4; 1375…1400 — over the sofa's 910, under the mezzanine's 1700
  assert.deepStrictEqual(r.board, [0, 2000, 1375, 1400, 4, 254]);
  assert.ok(/^Белый премиум/.test(r.deskWhite) && r.boardWhite && r.white, 'white as the desk shelf in white, on its white brackets');
  // three plain Ls (the desk shelf's brackets without the strut): their arms 200 under the board, 150 from its ends and in its middle;
  // their wall arms up behind it from 1371 to 1521
  assert.deepStrictEqual([r.n, r.struts, r.arms, r.low, r.high], [6, 0, [[150, 200], [1000, 200], [1850, 200]], 1371, 1521]);
  assert.ok(r.low > 910, 'over the sofa\'s back');
  assert.ok(r.pick, 'its brackets tell what the board does');
  assert.deepStrictEqual([r.info.title, r.info.lines], ['Полка над диваном', ['Белый премиум W1000 ST9, как корпуса кухни; на трёх белых стальных L-образных кронштейнах.', '200 × 25 см, толщина 2,5 см.',
    'Кронштейны из стальной полосы 4 мм шириной 25 мм, в 15 см от краёв и посередине: плечо 20 см под полкой, стойка 15 см по стене вверх, крепится над полкой.',
    'Низ на 137,5 см от пола, в 46,5 см над спинкой дивана; до антресоли 30 см.']]);
});

check('living: угловой диван Hoff «Слим» у правой стены напротив стола — оттоманка к стене с окном, 150 от неё', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const r = p.run(`(f=>tt.items("sofa").map(q=>{
    const b=new THREE.Box3().setFromObject(q);return {at:[tt.mm(q.position.x),tt.mm(q.position.z)],turn:+q.rotation.y,
      x0:(b.min.x-q.position.x)*1000,size:[Math.round((b.max.x-b.min.x)*1000),Math.round((b.max.z-b.min.z)*1000),tt.mm(b.max.y)],title:infoOf(q).title,buy:(i=>[i.price,i.url,i.shop])(infoOf(q))};}))(tt.fur())`);
  // its card: the price and the link to Hoff
  assert.deepStrictEqual(r[0].buy, [29999, 'https://hoff.ru/catalog/gostinaya/divany/uglovye/uglovoy_divan_krovat_slim_id9558189/?articul=80593875', 'Hoff']);
  // kitchen axes: the right wall at x 3250; its window end 150 from the window wall at 4600 (the desk's 100): from z 4450 − 2060 = 2390
  assert.deepStrictEqual(r.map((q) => q.at), [[3250, 2390], [3250, 2390]], 'the sofa and its chaise, one place');
  assert.ok(r.every((q) => q.turn === -Math.PI / 2 && q.title === 'Угловой диван-кровать «Слим» (Hoff)'), 'its back to the wall, its seat toward the desk');
  // own axes before the turn (the stub's boxes leave turns out): 2060 across, 850 deep, 910 high; the chaise 705 across, its box from the back
  // out to 1530, up to its back cushion's 910, at its far end (own x 1355…2060 → kitchen z 3745…4450: the window end; the stitches on
  // its sides stand 1.5 out of them; its lid 10 toward the seat, over the sofa's seat, and its box's window side 20 in, 10 under
  // the lid's edge: from 1345 to the lid's 2050)
  assert.deepStrictEqual(r[0].size, [2060, 850, 910]);
  assert.deepStrictEqual([Math.round((r[1].x0 - r[0].x0) * 10) / 10, r[1].size], [2060 - 705 - 10, [705, 1530, 910]]);
});

check('living: сиденье оттоманки дивана целиком — крышка на петле у спинки, под ней короб для белья, подушки на ней поднимаются; открывается с фасадами кухни', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const lid = () => p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-lid"),[sf,c]=tt.items("sofa"),b=new THREE.Box3().setFromObject(d.g);
    return {axis:d.axis,s:d.s,max:+d.max.toFixed(3),t:+d.t.toFixed(3),rot:+d.g.rotation.x.toFixed(2),inChaise:d.g.parent===c,hinge:[tt.mm(d.g.position.y),tt.mm(d.g.position.z)],
      size:[Math.round((b.max.x-b.min.x)*1000),Math.round((b.max.y-b.min.y)*1000),Math.round((b.max.z-b.min.z)*1000)],title:infoOf(d.g.children[0]).title,
      ride:[[.644,.46],[.48,.36]].map(([w,h])=>{const m=c.children.find(o=>o.geometry&&o.geometry.args&&Math.abs(o.geometry.args[0]-w)<1e-6&&Math.abs(o.geometry.args[1]-h)<1e-6);return m&&[tt.mm(m.position.y),tt.mm(m.position.z)];}),
      stitches:(fl=>{const seam=fl(f.doors.find(x=>x.key==="sofa-bed").g.children[0])[0].material,st=fl(c).filter(m=>m.material===seam).map(m=>m.geometry.args);
        return [st.filter(a=>a[2]<.002).length,st.filter(a=>a[0]<.002).length/2,st.filter(a=>a[0]<.002).length/2];})(q=>q.children.filter(m=>m.geometry&&m.geometry.kind==="THREE.BoxGeometry"&&m.geometry.args.length===3)),
      white:(fl=>{const seam=fl(f.doors.find(x=>x.key==="sofa-bed").g.children[0])[0].material;return fl(c).filter(m=>m.material!==seam).length;})(q=>q.children.filter(m=>m.geometry&&m.geometry.kind==="THREE.BoxGeometry"&&m.geometry.args.length===3))};})(tt.fur())`);
  let r = lid();
  // a click on the box under it lifts it too, as one on the bed's drawer lays out the bed
  assert.deepStrictEqual(p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-lid"),c=d.g.parent,box=c.children.find(o=>o.geometry&&o.position.y<.3);   // its walls and legs, under the seat
    const pick=o=>(x=>x&&x.key)(pickDoor(null,{object:o,point:new THREE.Vector3()}));return [pick(box),pick(d.g.children[0])];})(tt.fur())`), ['sofa-lid', 'sofa-lid']);
  // its upper back edge at the seat's height, at the thin back (100); the whole seat of the chaise
  assert.deepStrictEqual([r.axis, r.s, r.max, r.t, r.rot, r.inChaise, r.hinge], ['x', -1, 0.698, 0, 0, true, [450, 100]], 'closed, on its hinge in the chaise');
  assert.deepStrictEqual(r.size, [705, 170, 1430], 'the chaise\'s seat, from the thin back to its front');
  // 10 mm to the left (toward the seat) of the chaise's box: its middle 705 / 2 + 10 from the chaise's end (own x mirrored): 1697.5
  assert.strictEqual(p.run('(d=>tt.mm(d.g.children[0].position.x))(tt.fur().doors.find(x=>x.key==="sofa-lid"))'), 1698);
  // on it, the chaise's back cushion and the throw pillow in the corner (their middles: y, z)
  assert.deepStrictEqual(r.ride, [[680, 210], [640, 385]]);
  assert.strictEqual(r.title, 'Угловой диван-кровать «Слим» (Hoff)');
  assert.deepStrictEqual(r.stitches, [5, 4, 4], 'stitched up its front and both its sides, 130 apart');
  assert.strictEqual(r.white, 5, 'the box white inside (flat boards besides the stitches): its bottom and four walls');
  // a click: up (its front edge rises over the seat), half as fast as a front: about 69 % of the way at 0.21 s
  // (a front: 90 %), and down again; no front, the kitchen's «Открыты» leaves it
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click(); p.tick(13);
  assert.strictEqual(lid().t, 0, 'not with the fronts');
  p.run('(d=>{d.t=d.max;doorsChanged();})(tt.fur().doors.find(x=>x.key==="sofa-lid"))'); p.tick(13);
  const early = p.run('(d=>d.a/d.max)(tt.fur().doors.find(x=>x.key==="sofa-lid"))');
  assert.ok(early > .62 && early < .76, 'on its way: ' + early);
  p.tick(107);
  // (a turn about x by a < 0 lifts what lies in front of the hinge: y = −z·sin a)
  r = lid(); assert.ok(r.t === 0.698 && r.rot === -0.7, 'open at 40°: its front edge up');
  // held: 30°/s
  assert.strictEqual(p.run('+(tt.fur().doors.find(x=>x.key==="sofa-lid").holdRate*180/Math.PI).toFixed(1)'), 30);
  // straight up till their lower front edges are on the lid's top: the cushion's at 450 + (320 − 100)·tan 40° = 635; the pillow's
  // (496, 486) at 783, its middle 640 + 296
  assert.deepStrictEqual(r.ride, [[865, 210], [936, 385]], 'the pillows up out of its way');
  p.run('(d=>{d.t=0;doorsChanged();})(tt.fur().doors.find(x=>x.key==="sofa-lid"))'); p.tick(120);
  r = lid(); assert.ok(Math.abs(r.rot) < .02, 'closed again');
  assert.ok(r.ride.every(([y, z], i) => Math.abs(y - [680, 640][i]) < 3 && Math.abs(z - [210, 385][i]) < 2), 'the pillows back down');
  // a click opens it alone, and it stays open through a rebuild
  p.run('(d=>{d.t=d.max;doorsChanged();})(tt.fur().doors.find(x=>x.key==="sofa-lid"))');
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  assert.strictEqual(lid().t, 0.698);
});

check('living: диван раскладывается «дельфином» — ящик выкатывается, спальный блок из него поднимается вровень с сиденьем', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const bed = (a) => p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-bed"),sf=tt.items("sofa")[0];
    ${a === undefined ? '' : `d.a=d.t=d.max*${a};turnDoor(d);`}
    const dr=d.g.children[0],bl=dr.children[0],st=bl.children[0],b=new THREE.Box3().setFromObject(sf),R=v=>tt.mm(v);
    return {axis:d.axis,inSofa:d.g.parent===sf,seat:d.g.children[1].geometry.args.slice(0,3).map(R),max:d.max,t:+d.t.toFixed(2),drawer:R(dr.position.z),
      block:[R(bl.position.y),R(bl.position.z),+bl.rotation.x.toFixed(2)],size:bl.children[1].geometry.args.slice(0,3).map(R),strap:st.visible,depth:R(b.max.z-b.min.z)};})(tt.fur())`);
  let r = bed();
  // the seat in its holder (a click on it lays the bed out); closed: the drawer in, the block on its bottom (its back lower edge
  // 75 up, 130 from the sofa's back), the strap hidden; the sofa 850 deep
  assert.deepStrictEqual([r.axis, r.inSofa, r.seat, r.t, r.drawer, r.block, r.strap, r.depth], ['none', true, [1300, 170, 750], 0, 0, [75, 130, 0], false, 850]);
  assert.deepStrictEqual(r.size, [1272, 170, 680], 'the block between the drawer\'s sides, as thick as the seat, as deep as the chaise is in front of it');
  // 40 %: the drawer out by 680, its front in line with the chaise's (1510)
  r = bed(.4); assert.deepStrictEqual([r.drawer, r.block], [680, [75, 130, 0]]);
  // 55 %: the block's front up 22°; 70 %: slid forward till its back upper edge is past the seat's front: 850 + 170·sin 22° = 914 (− 680)
  r = bed(.55); assert.deepStrictEqual(r.block, [75, 130, -0.38]);
  r = bed(.7); assert.deepStrictEqual(r.block, [75, 234, -0.38]);
  // out: level with the seat (280 + 170 = 450), its back against the seat's front (850 − 680), the strap hanging
  r = bed(1); assert.deepStrictEqual([r.drawer, r.block, r.strap, r.depth], [680, [280, 170, 0], true, 1535], 'one bed with the chaise, out to 1530 (its strap 5 in front)');
  bed(0);
  // a click, evenly in 1.4 s: half way at 0.7 s (the drawer out, the block on its way), and back
  p.run('(d=>{d.t=d.max;doorsChanged();})(tt.fur().doors.find(x=>x.key==="sofa-bed"))'); p.tick(44);
  const half = p.run('(d=>d.a/d.max)(tt.fur().doors.find(x=>x.key==="sofa-bed"))');
  assert.ok(half > .45 && half < .55, 'half way: ' + half); assert.strictEqual(bed().drawer, 680);
  p.tick(156);
  r = bed(); assert.deepStrictEqual([r.t, r.drawer, r.block, r.strap], [1.45, 680, [280, 170, 0], true]);
  p.run('(d=>{d.t=0;doorsChanged();})(tt.fur().doors.find(x=>x.key==="sofa-bed"))'); p.tick(200);
  r = bed(); assert.deepStrictEqual([r.drawer, r.block, r.strap], [0, [75, 130, 0], false]);
  // held, the whole way in 3 s: slower than a click, as the other doors (they ease in about 0.3 s, held at 60°/s)
  p.run('held={d:tt.fur().doors.find(x=>x.key==="sofa-bed"),dir:1}'); p.tick(94);
  const held = p.run('(d=>(held=null,d.a/d.max))(tt.fur().doors.find(x=>x.key==="sofa-bed"))');
  assert.ok(held > .45 && held < .55, 'half way in 1.5 s held: ' + held);
});
