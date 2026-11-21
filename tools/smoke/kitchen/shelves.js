// полка над обеденным столом: оливковая и трёхъярусная (src/js/rooms/kitchen/shelves.js)
const { runPage, PAGES, check, assert } = require('../harness');

check('кухня: над обеденным столом на левой стене — полка с ящиками 600 × 900 × 120, оливковая: вагонка, три полки, три ящика с белыми ручками, фигурные карниз, гребень и подзор', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const sp = () => p.run(`(f=>{const q=tt.item("spice"),d=q.children.find(o=>o.userData.spiceModel===1),ps=tt.parts(d,u=>typeof u.x0==='number');
    const n=r=>ps.filter(u=>r.test(u.name)).length,box=tt.box(ps,"xyz");
    const wavy=d.children.filter(o=>o.userData.wavy===true),knobs=[];const wk=o=>{if(o.userData&&o.userData.knob===true)knobs.push(o);(o.children||[]).forEach(wk);};wk(d);
    return {at:[q.position.x,q.position.y,q.position.z].map(v=>tt.mm(v)),turn:+q.rotation.y,x:tt.mm(d.position.x),box,
      boards:n(/^Вагонка/),shelves:ps.filter(u=>/^Полка/.test(u.name)).map(u=>u.y0),walls:n(/^Перегородка/),
      wavy:wavy.map(o=>tt.mm(o.position.z)),knobs:[knobs.length,new Set(knobs.map(o=>o.material)).size],
      doors:tt.doors(d).map(x=>[x.axis,tt.mm(x.travel),x.t,x.loose]),title:infoOf(d).title,
      knobInfo:infoOf(knobs[0]).title,frontInfo:infoOf(wavy[0]).title,vis:d.visible};})(tt.fur())`);
  let r = sp();
  // kitchen axes: at the left wall, its bottom 1150 (400 over the tabletop), its middle over the table's (1340 + 700 / 2 = 1690): 1990…1390
  assert.deepStrictEqual([r.at, r.x], [[0, 1150, 1690], -300]);
  assert.strictEqual(r.turn, Math.PI / 2, 'along the left wall, its drawers into the room');
  assert.deepStrictEqual(r.box, [0, 600, 0, 900, 0, 120]);
  assert.deepStrictEqual([r.boards, r.shelves, r.walls], [6, [176, 400, 630], 2], 'six boards of the back; the shelf over the drawers and two more; two dividers between the drawers');
  assert.deepStrictEqual(r.wavy, [102, 0, 102], 'the front rail and the apron at the front, the crest at the back');
  assert.deepStrictEqual(r.knobs, [6, 1], 'a stem and a ball on each drawer, of one white ceramic');
  assert.deepStrictEqual(r.doors, [['z', 80, 0, true], ['z', 80, 0, true], ['z', 80, 0, true]], 'three drawers, closed, not the kitchen\'s fronts');
  assert.deepStrictEqual([r.title, r.knobInfo, r.frontInfo, r.vis], ['Настенная полка с ящиками', 'Настенная полка с ящиками', 'Настенная полка с ящиками', false], 'hidden at first: the tiered one hangs');
  assert.ok(p.run('infoOf(tt.item("spice").children[1]).lines.some(l=>/^Низ на 115 см от пола, в 40 см над столешницей/.test(l))'));
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(sp().doors.every((d) => d[2] === 0), 'the kitchen\'s fronts leave them');
});

check('кухня: над обеденным столом сначала трёхъярусная полка 640 × 800 × 150 (карниз, фриз, вагонка, полки с бортиками на балясинах); клик меняет её на оливковую и обратно; клик по ящику — ящик; выбор переживает пересборку', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const q = 'tt.item("spice")';
  const st = () => p.run(`(q=>{const by=i=>q.children.find(o=>o.userData.spiceModel===i);return [by(1).visible,by(0).visible,infoOf(by(0)).title];})(${q})`);
  assert.deepStrictEqual(st(), [false, true, 'Настенная полка, 3 яруса'], 'the tiered one at first');
  assert.deepStrictEqual(p.run(`(q=>q.children.map(d=>{const i=infoOf(d);return [i.price,i.url,i.shop];}))(${q})`),
    [[13000, 'https://ozon.ru/t/EIGVFHm', 'Ozon'], [16000, 'https://ozon.ru/t/EIGVFHm', 'Ozon']], 'the tiered one 13 000 ₽, the olive one 16 000 ₽, on Ozon');
  // the card's link hangs the other one and gives its card (1/2, 2/2); no «click» line in the cards
  assert.deepStrictEqual(p.run(`(q=>{const i=infoOf(q.children[0]),n=i.next();return [i.lines.some(l=>/Нажатие/.test(l)),i.variant,n.title,n.variant,typeof n.next,q.children.map(d=>d.visible)];})(${q})`),
    [false, [1, 2], 'Настенная полка с ящиками', [2, 2], 'function', [false, true]]);
  assert.deepStrictEqual(p.run(`(q=>{const n=infoOf(q.children[1]).next();return [n.title,q.children.map(d=>d.visible)];})(${q})`), ['Настенная полка, 3 яруса', [true, false]], 'and back');
  const tq = p.run(`(q=>{const d=q.children.find(o=>o.userData.spiceModel===0),ps=d.children.filter(o=>o.userData.part).map(o=>o.userData.part),k=o=>d.children.filter(c=>c.userData[o]===true);
    const nm=r=>ps.filter(u=>r.test(u.name));
    return {x:tt.mm(d.position.x),box:[Math.min(...ps.map(u=>u.x0)),Math.max(...ps.map(u=>u.x1)),Math.max(...ps.map(u=>u.y1)),Math.max(...ps.map(u=>u.z1))],
      boards:nm(/^Вагонка/).length,shelves:nm(/^Полка/).map(u=>u.y0),rails:nm(/^Бортик/).map(u=>[u.y0,u.z0,u.z1]),
      sides:k('side').map(o=>tt.mm(o.position.x)),spindles:k('spindle').length,frieze:k('wavy').length,bottom:k('bottomShelf').map(o=>tt.mm(o.position.y))};})(${q})`);
  // its own axes: 640 along the wall from −320, 800 high, its top 150 deep; the sides 25 in from the top's ends
  assert.deepStrictEqual([tq.x, tq.box], [-320, [0, 640, 800, 150]]);
  assert.deepStrictEqual([tq.boards, tq.shelves, tq.rails], [6, [288, 506], [[350, 105, 130], [568, 105, 130]]], 'six boards of the back; two shelves, a rail 44 over each');
  assert.deepStrictEqual([tq.sides, tq.spindles, tq.frieze, tq.bottom], [[43, 615], 16, 1, [96]], 'the sides, 8 spindles under each rail, the frieze, the bottom shelf');
  // the backs of both: six boards, in each of the five grooves a tongue back from their faces — on the olive one 3 wide, 4 back; on the brown one 4 wide, 4 back
  const gr = p.run(`(q=>q.children.map(d=>{const bs=d.children.filter(o=>o.userData.part&&typeof o.userData.part.board==='number').map(o=>o.userData.part).sort((a,b)=>a.x0-b.x0),gs=d.children.filter(o=>o.userData.groove===true);
    return [bs.length,[...new Set(bs.slice(1).map((b,i)=>Math.round(b.x0-bs[i].x1)))],gs.length,[...new Set(gs.map(o=>tt.mm(o.geometry.args[0])))],[...new Set(gs.map(o=>bs[0].z1-tt.mm(o.geometry.args[2])))]];}))(${q})`);
  assert.deepStrictEqual(gr, [[6, [4], 5, [4], [4]], [6, [3], 5, [3], [4]]]);
  p.run(`${q}.userData.click()`);
  assert.deepStrictEqual(st().slice(0, 2), [true, false], 'a click shows the olive one');
  p.run('showView("plan")'); p.fly(); p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(st().slice(0, 2), [true, false], 'kept through a rebuild');
  p.run(`${q}.userData.click()`);
  assert.deepStrictEqual(st().slice(0, 2), [false, true], 'and back');
  // a drawer's front is a door: a click there works the drawer, not the shelf
  assert.ok(p.run(`(q=>{const d=q.children[1],h=d.children.find(o=>o.userData.front===true);return pickDoor(null,{object:h.children[0],point:new THREE.Vector3()})===tt.fur().doors.find(x=>x.g===h);})(${q})`));
});
