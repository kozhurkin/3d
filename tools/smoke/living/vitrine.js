// витрина HEMNES и книжный стеллаж на её месте, карточки стола и витрины (src/js/rooms/living/vitrine.js)
const { runPage, PAGES, check, assert } = require('../harness');

check('living: витрина HEMNES спинкой к торцу стола, боком к левой стене — две стеклянные дверцы и три ящика открываются', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const vit = () => p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.vitrine===true);
    return {at:[Math.round(d.position.x*1000),Math.round(d.position.z*1000)],turn:+d.rotation.y,
      glass:d.children.filter(o=>o.userData.front===true).map(h=>h.children[0]).filter(m=>m.userData.part.glass===50).length,
      doors:f.doors.filter(x=>x.g.parent===d).map(x=>[x.axis||'y',Math.round((x.travel||0)*1000),x.t])};})(VIEWS.kitchen.furniture())`);
  let r = vit();
  // kitchen axes: the desk's end toward the kitchen wall at 4600 − 100 − 1550 = 2950; the cabinet 900 wide from the left wall
  assert.deepStrictEqual(r.at, [900, 2950]);
  assert.strictEqual(r.turn, Math.PI, 'its fronts toward the kitchen wall');
  assert.strictEqual(r.glass, 2, 'two glass doors');
  assert.deepStrictEqual(r.doors, [['y', 0, 0], ['y', 0, 0], ['z', 270, 0], ['z', 270, 0], ['z', 270, 0]]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(vit().doors.every((d) => d[2] === 0), 'the kitchen\'s fronts leave them');
});

check('living: «i» у письменного стола и витрины — что это за предмет, с любой их детали', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // what each thing says it is: from any of its meshes (the add-on unit's parts, its drawers' knobs, the table's legs)
  const r = p.run(`(f=>{const by=k=>f.appl.children.find(o=>o.userData[k]===true),desk=by('desk'),vit=by('vitrine');
    const ps=[];const w=o=>{if(o.userData&&o.userData.part&&typeof o.userData.part.name==='string')ps.push(o);(o.children||[]).forEach(w);};w(desk);
    const auPart=ps.find(m=>m.userData.part.name==='Полка надстройки'),auDrawer=desk.children.find(o=>o.userData.front===true&&/надстройки/.test(o.children[0].userData.part.name));
    const deskDoor=desk.children.find(o=>o.userData.front===true&&o.children[0].userData.part.name==='Дверца — тумба с дверцей');
    const t=o=>{const i=infoOf(o);return i&&i.title;};
    return {desk:t(deskDoor.children[deskDoor.children.length-1]),au:t(auPart),auKnob:t(auDrawer.children[auDrawer.children.length-1]),
      vit:t(vit.children[0]),vitBuy:(i=>[i.price,i.url,i.shop])(infoOf(vit.children[0]))};})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual([r.desk, r.au, r.auKnob, r.vit], ['Письменный стол HEMNES (IKEA)', 'Надстройка HEMNES для стола (IKEA)', 'Надстройка HEMNES для стола (IKEA)', 'Витрина HEMNES с 3 ящиками (IKEA)']);
  assert.deepStrictEqual(r.vitBuy, [31000, 'https://ozon.ru/t/sZF7R6J', 'Ozon'], 'the display cabinet on Ozon');
});

check('living: на месте витрины второй вариант — книжный стеллаж HEMNES (клик по корпусу или «Следующий вариант →»), той же высоты и в том же месте', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const g = 'VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.vitrine===true)';
  const st = () => p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.vitrine===true),ps=d.children.filter(o=>o.userData.part).map(o=>o.userData.part),i=infoOf(d.children[0]);
    const sh=ps.filter(q=>/^Полка/.test(q.name));
    return {at:[Math.round(d.position.x*1000),Math.round(d.position.z*1000)],turn:+d.rotation.y,doors:f.doors.filter(x=>x.g.parent===d).length,
      box:[Math.min(...ps.map(q=>q.x0)),Math.max(...ps.map(q=>q.x1)),Math.min(...ps.map(q=>q.y0)),Math.max(...ps.map(q=>q.y1)),Math.min(...ps.map(q=>q.z0)),Math.max(...ps.map(q=>q.z1))],
      shelves:sh.map(q=>q.y0),inside:sh.length?[sh[0].x1-sh[0].x0,sh[0].z1-sh[0].z0]:null,
      card:[i.title,i.variant.join('/'),i.price,i.url,i.shop].concat(i.lines)};})(VIEWS.kitchen.furniture())`);
  let r = st();
  assert.deepStrictEqual([r.card[0], r.card[1], r.doors], ['Витрина HEMNES с 3 ящиками (IKEA)', '1/2', 5], 'the display cabinet at first');
  // a door's click opens it, its body's shows the bookcase: the kitchen built again, in the same place, the same size
  p.run(`clickOf({object:${g}.children.find(o=>o.userData.part&&o.userData.part.name==='Боковина витрины')})()`);
  r = st();
  assert.deepStrictEqual(r.card, ['Стеллаж книжный HEMNES (IKEA)', '2/2', 17500, 'https://ozon.ru/t/1NWYtIl', 'Ozon',
    'Чёрно-коричневый, массив сосны.', '90 × 37 см, высота 197 см.', 'Пять переставных полок; внутри 80 × 29 см.']);
  assert.deepStrictEqual([r.at, r.turn, r.doors], [[900, 2950], Math.PI, 0], 'where the display cabinet was, no doors');
  assert.deepStrictEqual(r.box, [0, 900, 0, 1970, 0, 370], 'as big as the display cabinet: the HEMNES shelf over the desk still level with it');
  // the others' cards name what stands there now: the table's, the HEMNES shelf's
  const named = p.run(`(f=>[infoOf(f.appl.children.find(o=>o.userData.table===true)).lines[3],infoOf(f.appl.children.find(o=>o.userData.desk===true).children.find(o=>o.userData.part&&o.userData.part.hemnes===true)).lines[2]])(VIEWS.kitchen.furniture())`);
  assert.ok(/ см до стеллажа\.$/.test(named[0]) && /верх вровень со стеллажом:/.test(named[1]), named.join(' | '));
  // five shelves evenly between the bottom (190) and the head rail (1888), 800 between the front posts, 290 deep
  assert.deepStrictEqual([r.shelves, r.inside], [[458, 744, 1030, 1316, 1602], [800, 290]]);
  // it stays through a rebuild; the card's «Следующий вариант →» brings the display cabinet back
  p.run(`(r=>[1,2,3].forEach(()=>clickOf({object:r})()))(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.rack===true))`);   // the racks' three depths: the kitchen built three times
  assert.strictEqual(st().card[1], '2/2');
  const back = p.run(`infoOf(${g}.children[0]).next()`);
  assert.deepStrictEqual([back.title, back.variant], ['Витрина HEMNES с 3 ящиками (IKEA)', [1, 2]]);
  assert.strictEqual(st().doors, 5);
});
