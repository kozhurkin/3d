// письменный стол HEMNES, надстройка, полка над ней (src/js/rooms/living/desk.js)
const { runPage, PAGES, check, slide, assert } = require('../harness');

check('living: письменный стол HEMNES у левой стены — 100 от стены с окном, над надстройкой полка на кронштейнах (клик меняет её цвет), дверца открывается, ящики выдвигаются, следует «Планировке»', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const desk = () => p.run(`(f=>{const d=tt.item("desk");
    return {at:[tt.mm(d.position.x),tt.mm(d.position.z)],turn:+d.rotation.y,
      parts:d.children.length,doors:tt.doors(d).map(x=>[x.axis||'y',Math.round((x.travel||0)*1000),x.t])};})(VIEWS.kitchen.furniture())`);
  let r = desk();
  // kitchen axes: the left wall at x 0, the window wall at z 4600; the desk's window end 100 from it, its length toward the kitchen wall
  assert.deepStrictEqual(r.at, [0, 4600 - 100]);
  assert.strictEqual(r.turn, Math.PI / 2, 'along the left wall, its fronts into the room');
  // the add-on unit on the desk's top at the wall, in the middle of its length: 1520 × 250, up to 740 + 630
  const au = p.run(`(f=>{const d=tt.item("desk"),ps=tt.parts(d,q=>typeof q.x0==='number'&&/надстройки/.test(q.name));
    return tt.box(ps,"xyz");})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(au, [15, 1535, 740, 1370, 0, 250]);
  // over it at first IKEA HEMNES wall shelf: 1480 × 364, 339 high, in the middle of the desk, its top level with the display cabinet's;
  // the board and its brackets hidden
  const hm = () => p.run(`(f=>{const d=tt.item("desk"),v=tt.item("vitrine");
    const ps=d.children.filter(o=>o.userData.part&&o.userData.part.hemnes===true),q=ps.map(o=>o.userData.part),leg=d.children.find(o=>o.userData.part&&/^Ножка/.test(o.userData.part.name));
    const r=n=>q.filter(x=>x.name===n+' полки HEMNES'),dv=r('Перегородка').map(x=>x.x0).sort((a,b)=>a-b),bt=r('Дно')[0],rl=r('Передняя царга')[0];
    const board=d.children.filter(o=>o.userData.shelfBracket===true||o.userData.part&&o.userData.part.name==='Полка над столом');
    return {box:tt.box(q,"xyz"),
      vitTop:Math.max(...v.children.filter(o=>o.userData.part).map(o=>o.userData.part.y1)),
      cells:[dv[0]-bt.x0,dv[1]-dv[0]-18,bt.x1-dv[1]-18].map(Math.round),high:rl.y0-bt.y1,shown:ps.every(o=>o.visible),hidden:board.every(o=>!o.visible),
      dark:(t=>ps.every(o=>o.material.every(m=>leg.material.includes(m)||t.material.includes(m))))(d.children.find(o=>o.userData.part&&o.userData.part.name==='Столешница письменного стола')),info:infoOf(ps[0]),click:typeof ps[0].userData.click};})(VIEWS.kitchen.furniture())`);
  let h = hm();
  assert.deepStrictEqual(h.box, [35, 1515, 1631, 1970, 0, 364]);
  assert.strictEqual(h.vitTop, 1970, 'level with the display cabinet\'s top');
  assert.deepStrictEqual([h.cells, h.high], [[451, 451, 451], 255], 'three compartments 451 × 255');
  assert.deepStrictEqual([h.shown, h.hidden, h.dark, h.click], [true, true, true, 'function'], 'HEMNES shown, black-brown; the board and its brackets hidden');
  assert.deepStrictEqual([h.info.price, h.info.url, h.info.shop], [8000, 'https://ozon.ru/t/GIfrq0T', 'Ozon'], 'HEMNES on Ozon');
  assert.deepStrictEqual({ title: h.info.title, lines: h.info.lines }, { title: 'Полка навесная HEMNES (IKEA)', lines: ['Чёрно-коричневая, массив сосны.', '148 × 36,4 см, высота 33,9 см.',
    'Над надстройкой стола, в 26,1 см над ней; верх вровень с витриной: от 163,1 до 197 см от пола.'] });
  // its card pages through the four, as the others' (engine.js: info.variant, info.next): the next one is shown, the card is its
  const pager = p.run(`(d=>{const o=d.children.find(o=>o.userData.part&&o.userData.part.hemnes===true),i=infoOf(o),n=i.next();
    return [i.variant,n.title,n.variant,!o.visible];})(tt.item("desk"))`);
  assert.deepStrictEqual(pager, [[1, 4], 'Настенная полка', [2, 4], true], 'the card\'s next: the board, 2/4');
  p.run(`(d=>{const o=d.children.find(o=>o.userData.part&&o.userData.part.hemnes===true);[1,2,3].forEach(()=>o.userData.click());})(tt.item("desk"))`);
  assert.ok(hm().shown, 'and round to HEMNES again');
  // a click: the wall shelf on brackets: 1500 × 250, 30 thick, in the middle of the desk, 300 over it
  p.run(`tt.item("desk").children.find(o=>o.userData.part&&o.userData.part.hemnes===true).userData.click()`);
  h = hm();
  assert.ok(!h.shown && !h.hidden, 'HEMNES hidden, the board shown');
  const sh = p.run(`(f=>{const d=tt.item("desk"),ms=tt.meshes(d,q=>q.name==='Полка над столом');
    const leg=d.children.find(o=>o.userData.part&&/^Ножка/.test(o.userData.part.name)),q=ms[0].userData.part;
    return [ms.length,q.x0,q.x1,q.y0,q.y1,q.z0,q.z1,infoOf(ms[0]).title,ms[0].material.every(m=>leg.material.includes(m))];})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(sh, [1, 25, 1525, 1670, 1700, 0, 250, 'Настенная полка', true], '300 over the add-on unit, at the wall; black-brown as the desk at first');
  // its three brackets: 150 from its ends and in the middle, under it and down the wall
  const br = p.run(`(f=>{const d=tt.item("desk"),ms=d.children.filter(o=>o.userData.shelfBracket===true),u=v=>[...new Set(v.map(x=>tt.mm(x)))].sort((a,b)=>a-b);
    return [ms.length,u(ms.map(o=>o.position.x)),u(ms.map(o=>o.position.y)),infoOf(ms[0]).title,infoOf(ms[0]).lines.some(l=>/стальной полосы 4 мм/.test(l))];})(VIEWS.kitchen.furniture())`);
  // two brackets under it, 150 from its ends, three pieces each: the centres of the arm under the board (1670 − 2), the one down the wall (1520…1666), the strut (1666 − 75)
  assert.deepStrictEqual(br, [6, [175, 1375], [1591, 1593, 1668], 'Настенная полка', true], 'its card tells the metal\'s thickness');
  // a click on it (or on a bracket) paints it: the desk's black-brown → oak Casella → white, then HEMNES again; it stays through a rebuild
  const paint = (k) => p.run(`(f=>{const d=tt.item("desk"),sh=d.children.find(o=>o.userData.part&&o.userData.part.name==='Полка над столом');
    const leg=d.children.find(o=>o.userData.part&&/^Ножка/.test(o.userData.part.name));
    ${k === 'bracket' ? "d.children.find(o=>o.userData.shelfBracket===true).userData.click();" : k === 'shelf' ? 'sh.userData.click();' : ''}
    const br=d.children.filter(o=>o.userData.shelfBracket===true),l=infoOf(sh).lines,ids=globalThis.__mids||(globalThis.__mids=new Map()),id=m=>ids.get(m)||(ids.set(m,ids.size+1),ids.size);
    return [sh.material.map(m=>[leg.material.includes(m)]).flat().join(''),l[0],new Set(br.map(o=>o.material)).size,id(br[0].material),sh.userData.part.info().variant];})(VIEWS.kitchen.furniture())`);
  // [the board as the desk's legs (each face), the card's first line, the brackets' materials: one for all, the material]
  const desk1 = paint();
  assert.deepStrictEqual(desk1.slice(0, 3).concat([desk1[4]]), ['truetruetruetruetruetrue', 'Чёрно-коричневая, как стол; на двух тёмно-серых стальных кронштейнах с косынкой.', 1, [2, 4]]);
  const oak = paint('shelf');
  assert.deepStrictEqual(oak.slice(0, 3), ['falsefalsefalsefalsefalsefalse', 'Дуб Каселла натуральный, как столешница кухни; на двух тёмно-серых стальных кронштейнах с косынкой.', 1]);
  assert.strictEqual(oak[3], desk1[3], 'the same dark grey brackets under oak');
  const white = paint('bracket');
  assert.deepStrictEqual(white.slice(0, 3), ['falsefalsefalsefalsefalsefalse', 'Белый премиум W1000 ST9, как корпуса кухни; на двух белых стальных кронштейнах с косынкой.', 1]);
  assert.notStrictEqual(white[3], oak[3], 'white brackets under white');
  p.run('showView("plan")'); p.fly(); p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(paint().slice(0, 4), white.slice(0, 4), 'kept through a rebuild');
  paint('shelf');
  h = hm();
  assert.ok(h.shown && h.hidden, 'HEMNES again');
  assert.deepStrictEqual(paint('shelf').slice(0, 4), desk1.slice(0, 4), 'then the board as the desk');
  assert.deepStrictEqual(r.doors, [['y', 0, 0], ['z', 450, 0], ['z', 450, 0], ['z', 180, 0], ['z', 180, 0]], 'a door on its hinges and two drawers, closed; the add-on unit\'s two drawers');
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(desk().doors.every((d) => d[2] === 0), 'the kitchen\'s fronts leave them');
  p.run('VIEWS.kitchen.furniture().doors.filter(x=>x.g.parent.userData.desk===true).forEach(x=>x.t=x.max)');
  assert.ok(desk().doors.every((d) => d[2] > 0), 'they open alone');
  // a longer kitchen on the plan: the desk keeps to the window wall
  p.run('showView("plan")'); p.fly(); slide(p, 'kL', 5000); p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(desk().at, [0, 5000 - 100]);
});
