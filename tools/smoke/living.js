// Остальное в комнате кухни (rooms/living/): рабочее место — письменный стол, MacBook, кресло, витрина; жилая часть — угловой шкаф, антресоли,
// полка над диваном, стеллажи, диван; под окном — радиатор.
const { runPage, PAGES, check, slide, near, assert } = require('./harness');

/* ---------- рабочее место ---------- */

check('living: письменный стол HEMNES у левой стены — 100 от стены с окном, над надстройкой полка на кронштейнах (клик меняет её цвет), дверца открывается, ящики выдвигаются, следует «Планировке»', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const desk = () => p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true);
    return {at:[Math.round(d.position.x*1000),Math.round(d.position.z*1000)],turn:+d.rotation.y,
      parts:d.children.length,doors:f.doors.filter(x=>x.g.parent===d).map(x=>[x.axis||'y',Math.round((x.travel||0)*1000),x.t])};})(VIEWS.kitchen.furniture())`);
  let r = desk();
  // kitchen axes: the left wall at x 0, the window wall at z 4600; the desk's window end 100 from it, its length toward the kitchen wall
  assert.deepStrictEqual(r.at, [0, 4600 - 100]);
  assert.strictEqual(r.turn, Math.PI / 2, 'along the left wall, its fronts into the room');
  // the add-on unit on the desk's top at the wall, in the middle of its length: 1520 × 250, up to 740 + 630
  const au = p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),ps=[];const w=o=>{const q=o.userData&&o.userData.part;if(q&&typeof q.x0==='number'&&/надстройки/.test(q.name))ps.push(q);(o.children||[]).forEach(w);};w(d);
    return [Math.min(...ps.map(q=>q.x0)),Math.max(...ps.map(q=>q.x1)),Math.min(...ps.map(q=>q.y0)),Math.max(...ps.map(q=>q.y1)),Math.min(...ps.map(q=>q.z0)),Math.max(...ps.map(q=>q.z1))];})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(au, [15, 1535, 740, 1370, 0, 250]);
  // over it at first IKEA HEMNES wall shelf: 1480 × 364, 339 high, in the middle of the desk, its top level with the display cabinet's;
  // the board and its brackets hidden
  const hm = () => p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),v=f.appl.children.find(o=>o.userData.vitrine===true);
    const ps=d.children.filter(o=>o.userData.part&&o.userData.part.hemnes===true),q=ps.map(o=>o.userData.part),leg=d.children.find(o=>o.userData.part&&/^Ножка/.test(o.userData.part.name));
    const r=n=>q.filter(x=>x.name===n+' полки HEMNES'),dv=r('Перегородка').map(x=>x.x0).sort((a,b)=>a-b),bt=r('Дно')[0],rl=r('Передняя царга')[0];
    const board=d.children.filter(o=>o.userData.shelfBracket===true||o.userData.part&&o.userData.part.name==='Полка над столом');
    return {box:[Math.min(...q.map(x=>x.x0)),Math.max(...q.map(x=>x.x1)),Math.min(...q.map(x=>x.y0)),Math.max(...q.map(x=>x.y1)),Math.min(...q.map(x=>x.z0)),Math.max(...q.map(x=>x.z1))],
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
    return [i.variant,n.title,n.variant,!o.visible];})(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.desk===true))`);
  assert.deepStrictEqual(pager, [[1, 4], 'Настенная полка', [2, 4], true], 'the card\'s next: the board, 2/4');
  p.run(`(d=>{const o=d.children.find(o=>o.userData.part&&o.userData.part.hemnes===true);[1,2,3].forEach(()=>o.userData.click());})(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.desk===true))`);
  assert.ok(hm().shown, 'and round to HEMNES again');
  // a click: the wall shelf on brackets: 1500 × 250, 30 thick, in the middle of the desk, 300 over it
  p.run(`VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.desk===true).children.find(o=>o.userData.part&&o.userData.part.hemnes===true).userData.click()`);
  h = hm();
  assert.ok(!h.shown && !h.hidden, 'HEMNES hidden, the board shown');
  const sh = p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),ms=[];const w=o=>{const q=o.userData&&o.userData.part;if(q&&q.name==='Полка над столом')ms.push(o);(o.children||[]).forEach(w);};w(d);
    const leg=d.children.find(o=>o.userData.part&&/^Ножка/.test(o.userData.part.name)),q=ms[0].userData.part;
    return [ms.length,q.x0,q.x1,q.y0,q.y1,q.z0,q.z1,infoOf(ms[0]).title,ms[0].material.every(m=>leg.material.includes(m))];})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(sh, [1, 25, 1525, 1670, 1700, 0, 250, 'Настенная полка', true], '300 over the add-on unit, at the wall; black-brown as the desk at first');
  // its three brackets: 150 from its ends and in the middle, under it and down the wall
  const br = p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),ms=d.children.filter(o=>o.userData.shelfBracket===true),u=v=>[...new Set(v.map(x=>Math.round(x*1000)))].sort((a,b)=>a-b);
    return [ms.length,u(ms.map(o=>o.position.x)),u(ms.map(o=>o.position.y)),infoOf(ms[0]).title,infoOf(ms[0]).lines.some(l=>/стальной полосы 4 мм/.test(l))];})(VIEWS.kitchen.furniture())`);
  // two brackets under it, 150 from its ends, three pieces each: the centres of the arm under the board (1670 − 2), the one down the wall (1520…1666), the strut (1666 − 75)
  assert.deepStrictEqual(br, [6, [175, 1375], [1591, 1593, 1668], 'Настенная полка', true], 'its card tells the metal\'s thickness');
  // a click on it (or on a bracket) paints it: the desk's black-brown → oak Casella → white, then HEMNES again; it stays through a rebuild
  const paint = (k) => p.run(`(f=>{const d=f.appl.children.find(o=>o.userData.desk===true),sh=d.children.find(o=>o.userData.part&&o.userData.part.name==='Полка над столом');
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

check('living: на письменном столе MacBook Pro 16″ — посередине, перед надстройкой; клавиатура и трекпад — картинкой на корпусе, экран — на крышке; крышка открыта на 110°, по клику закрывается и открывается; экран светится, пока открыта', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const mb = () => p.run(`(f=>{const d=f.doors.find(x=>x.key==="macbook"),pl=d.g.parent,desk=pl.parent,body=d.g.children.find(o=>o.geometry&&o.geometry.args&&o.geometry.args.length===6),lid=d.g.children[d.g.children.length-1];
    return {onDesk:desk.userData.desk===true,at:[pl.position.x,pl.position.y,pl.position.z].map(v=>+(v*1000).toFixed(2)),size:body.geometry.args.slice(0,3).map(v=>+(v*1000).toFixed(1)),
      lidSize:lid.children[0].geometry.args.slice(0,3).map(v=>+(v*1000).toFixed(1)),hinge:[lid.position.y,lid.position.z].map(v=>+(v*1000).toFixed(2)),parts:d.g.children.length,
      faces:[body,lid.children[0]].map(m=>m.material.map(x=>m.material.indexOf(x))),lidParts:lid.children.length,glow:lid.children[0].material[3].emissiveIntensity,
      offsets:[body,lid.children[0]].flatMap(m=>m.material).filter(x=>x.polygonOffset===true).length,
      max:Math.round(d.max*180/Math.PI),t:d.t,rot:+lid.rotation.x.toFixed(2),title:infoOf(body).title,
      pick:pickDoor(null,{object:body,point:new THREE.Vector3()})===d};})(VIEWS.kitchen.furniture())`);
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
  const click = () => { p.run('(d=>{d.t=d.t!==0?0:d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="macbook"))'); p.tick(120); };
  click(); r = mb(); assert.ok(Math.abs(r.rot) < .02 && r.glow === 0, 'closed, the display dark');
  // closed, it stays closed through a rebuild
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  assert.strictEqual(mb().t, 0);
  click(); assert.strictEqual(mb().rot, -1.92, 'open again');
  // no front: the kitchen's «Закрыты» leaves it open
  p.document.querySelector('[data-panel="kitchen"] [data-door="closed"]').click(); p.tick(120);
  assert.strictEqual(mb().rot, -1.92);
});

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

/* ---------- жилая часть ---------- */

check('living: угловой шкаф OZON 1364 × 964 у дивана — ножка вдоль подлокотника, дверь к стене кухни; вдоль правой стены дверь углового и доп. секции; высота 2200; три двери открываются', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const wr = () => p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.wardrobe===true);
    const box=g=>{const ps=[];const w=o=>{if(o.userData&&o.userData.part&&o.userData.part.x1>o.userData.part.x0)ps.push(o.userData.part);(o.children||[]).forEach(w);};w(g);
      return [Math.min(...ps.map(q=>q.x0)),Math.max(...ps.map(q=>q.x1)),Math.min(...ps.map(q=>q.z0)),Math.max(...ps.map(q=>q.z1)),Math.min(...ps.map(q=>q.y0)),Math.max(...ps.map(q=>q.y1))];};
    const ds=f.doors.filter(x=>gs.includes(x.g.parent));
    return {groups:gs.length,boxes:gs.map(box),title:infoOf(gs[0].children[0]).title,
      doors:ds.map(x=>{const q=x.g.children[0].userData.part;return [q.name,q.pivot.x,q.pivot.z,q.pivot.s,x.t];})};})(VIEWS.kitchen.furniture())`);
  let r = wr();
  // kitchen axes: the right wall at 3250, the sofa's end toward the kitchen wall at 4600 − 150 − 2060 = 2390; the leg 950 out and 500
  // along it, the run along the wall 500 deep up to 2390 − 1364 = 1026 (its stile reaches 16 into the leg's door plane)
  assert.strictEqual(r.groups, 2, 'the leg and the run along the wall: the walk is stopped by its L');
  assert.deepStrictEqual(r.boxes, [[2286, 3250, 1890, 2390, 0, 2200], [2750, 3250, 1026, 1906, 0, 2200]]);
  assert.strictEqual(r.title, 'Угловой шкаф «Уютная логика» (OZON)');
  // one card for the whole wardrobe (any of its parts): a row for the corner unit (12000) and one for the add-on (5500) with their Ozon links, the sum;
  // «next» paints it grey and back
  const wc = () => p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.wardrobe===true);
    const find=(g,fn)=>{let r=null;const w=o=>{if(!r&&fn(o))r=o;(o.children||[]).forEach(w);};w(g);return r;};
    const ad=find(gs[1],o=>o.userData&&o.userData.part&&o.userData.part.name==='Дверь доп. секции');
    const ic=infoOf(gs[0].children[0]),ia=infoOf(ad);
    const cl=o=>clickOf({object:o});
    return [ic.buy.map(b=>[b.name,b.price,b.url,b.shop||ic.shop]),ia.title===ic.title,ic.variant.join('/'),
      cl(gs[0].children[0])===cl(gs[1].children[0])&&cl(find(gs[0],o=>o.userData&&o.userData.mirror===true))!==cl(gs[0].children[0]),ic.lines[0],ic.lines[4]];})(VIEWS.kitchen.furniture())`);
  const w0 = wc();
  assert.deepStrictEqual(w0, [[['Угловой 96,4 × 96,4 × 220', 12000, 'https://ozon.ru/t/8LOFiwQ', 'Ozon'], ['Доп. секция 40 × 50 × 220', 5500, 'https://ozon.ru/t/BSIni7B', 'Ozon']], true, '1/4', true, 'Цвет: Белый.', 'Вместе 17\u00a0500 ₽.']);
  // its panels click alike (not the mirror on it: a thing of its own; the stub's userData answers anything, so only «not the same»); «next» paints it grey, a rebuild keeps the colour,
  // a click white again with the second add-on section (the next check), two more back to the first
  const g0 = 'VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.wardrobe===true)';
  const col = () => { const w = wc(); return [w[2], w[4]]; };
  p.run(`infoOf(${g0}.children[0]).next()`);
  assert.deepStrictEqual(col(), ['2/4', 'Цвет: Диамант серый U963 ST9.']);
  const bW = p.run('A.bW'); slide(p, 'bW', bW + 200); p.tick();
  assert.deepStrictEqual(col(), ['2/4', 'Цвет: Диамант серый U963 ST9.'], 'through a rebuild');
  slide(p, 'bW', bW); p.tick();
  p.run(`clickOf({object:${g0}.children[0]})()`);
  assert.deepStrictEqual(col(), ['3/4', 'Цвет: Белый.'], 'a click: white again');
  p.run(`clickOf({object:${g0}.children[0]})()`); p.run(`clickOf({object:${g0}.children[0]})()`);
  assert.deepStrictEqual(col(), ['1/4', 'Цвет: Белый.'], 'and round to the first');
  // hinged at their outer ends, away from the inner corner: the leg's toward the kitchen wall, the other two into the room
  assert.deepStrictEqual(r.doors, [
    ['Дверь углового шкафа — у дивана', 2287, 1890, 1, 0],
    ['Дверь углового шкафа — вдоль стены', 2750, 1427, -1, 0],
    ['Дверь доп. секции', 2750, 1027, -1, 0]]);
  // the corner unit as the shop's picture: on the left (along the wall) four shelves evenly behind a partition at the inner corner; on the
  // right (the leg) a shelf at the top and two rods across it, through the corner up to the wall
  const inside = p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.wardrobe===true);
    const ps=g=>{const o=[];const w=m=>{if(m.userData&&m.userData.part&&m.userData.part.x1>m.userData.part.x0)o.push(m.userData.part);(m.children||[]).forEach(w);};w(g);return o;};
    const sh=(g,re)=>ps(g).filter(q=>re.test(q.name)).map(q=>[q.y0,q.x0,q.x1,q.z0,q.z1]);
    const ext=g=>ps(g).filter(q=>/^(Планка|Дверь) углового/.test(q.name)).map(q=>[q.name,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]);
    const car=(g,re)=>ps(g).filter(q=>re.test(q.name)&&!/^(Полка|Дверь|Планка)/.test(q.name)).map(q=>[q.name,q.mat,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]);
    return {stile:ext(gs[0]).concat(ext(gs[1])),left:sh(gs[1],/^Полка углового шкафа — слева/),addOn:sh(gs[1],/^Полка доп. секции/),right:sh(gs[0],/^Полка углового шкафа — справа/),leftInLeg:sh(gs[0],/слева/).length,
      carL:car(gs[1],/углового шкафа — слева/),carR:car(gs[0],/углового шкафа — справа/),rightInRun:sh(gs[1],/справа/).length,
      rods:gs[0].children.filter(o=>o.userData.rod===true).map(r=>[Math.round(r.position.x*1000),Math.round(r.position.y*1000),Math.round(r.position.z*1000),+(r.geometry.args[2]*1000).toFixed(0)]),
      rodsElse:gs[1].children.filter(o=>o.userData.rod===true).length};})(VIEWS.kitchen.furniture())`);
  // the stile at the inner corner: two 50 mm strips, one in each front's plane, meeting there; the doors up to them, 2 short
  assert.deepStrictEqual(inside.stile, [
    ['Планка углового шкафа — у дивана', 2700, 2750, 1890, 1906, 72, 2198],
    ['Дверь углового шкафа — у дивана', 2287, 2698, 1890, 1906, 72, 2198],
    ['Планка углового шкафа — вдоль стены', 2750, 2766, 1840, 1906, 72, 2198],
    ['Дверь углового шкафа — вдоль стены', 2750, 2766, 1427, 1838, 72, 2198]]);
  assert.deepStrictEqual(inside.left.map((q) => q[0]), [493, 916, 1338, 1761], 'between the bottom (86) and the top (2184): five equal spaces');
  assert.deepStrictEqual(inside.left[0].slice(1), [2786, 3246, 1442, 1890], 'between its sides');
  assert.deepStrictEqual(inside.addOn.map((q) => q[0]), [493, 916, 1338, 1761], 'the add-on section\'s shelves as the left part\'s');
  // two carcasses held by the stile: on the left one 480 along the wall (1426–1906) for shelves — LDSP sides at its ends (the one at the
  // leg in the leg's door plane, against its carcass: no gap), the HDF back against the wall; on the right the leg, 964 out from the wall (2286–3250) for hangers — LDSP sides at its end and against the wall,
  // the HDF back at the sofa (2390) in two sheets of 480, edge to edge; each its top, bottom and plinth, the carcass 484 behind the doors;
  // the sides, the top and the bottom all as deep, a plinth at the back too (in front of the back: no hole under the bottom), the 4 HDF back over
  // their rear edges, 2 in from the carcass's edges, from the bottom's underside (70) up
  assert.deepStrictEqual(inside.carL, [
    ['Боковина углового шкафа — слева', 'carcass', 2766, 3246, 1426, 1442, 0, 2200],
    ['Боковина углового шкафа — слева', 'carcass', 2766, 3246, 1890, 1906, 0, 2200],
    ['Крыша углового шкафа — слева', 'carcass', 2766, 3246, 1442, 1890, 2184, 2200],
    ['Дно углового шкафа — слева', 'carcass', 2766, 3246, 1442, 1890, 70, 86],
    ['Цоколь углового шкафа — слева', 'carcass', 2766, 2782, 1442, 1890, 0, 70],
    ['Цоколь задний углового шкафа — слева', 'carcass', 3230, 3246, 1442, 1890, 0, 70],
    ['Задняя стенка углового шкафа — слева', 'back', 3246, 3250, 1428, 1904, 70, 2198]]);
  assert.deepStrictEqual(inside.carR, [
    ['Боковина углового шкафа — справа', 'carcass', 2286, 2302, 1906, 2386, 0, 2200],
    ['Боковина углового шкафа — справа', 'carcass', 3234, 3250, 1906, 2386, 0, 2200],
    ['Крыша углового шкафа — справа', 'carcass', 2302, 3234, 1906, 2386, 2184, 2200],
    ['Дно углового шкафа — справа', 'carcass', 2302, 3234, 1906, 2386, 70, 86],
    ['Цоколь углового шкафа — справа', 'carcass', 2302, 3234, 1906, 1922, 0, 70],
    ['Цоколь задний углового шкафа — справа', 'carcass', 2302, 3234, 2370, 2386, 0, 70],
    ['Лист 1 задней стенки углового шкафа — справа', 'back', 2288, 2768, 2386, 2390, 70, 2198],
    ['Лист 2 задней стенки углового шкафа — справа', 'back', 2768, 3248, 2386, 2390, 70, 2198]]);
  assert.deepStrictEqual(inside.right, [[1650, 2302, 3234, 1906, 2386]], 'between its sides, up to its back: nothing in the air');
  assert.deepStrictEqual([inside.leftInLeg, inside.rightInRun, inside.rodsElse], [0, 0, 0]);
  assert.deepStrictEqual(inside.rods, [[2768, 1590, 2146, 932], [2768, 860, 2146, 932]], 'two rods: side to side, in the middle of its depth behind the door');
  // on the leg's end (2286), into the room, in the middle of its width (2140): the mirror 400 × 400 from 1300 to 1700 in a black frame,
  // 20 out; under it the coat rail from 1170 — each with its own «i»
  const end = p.run(`(f=>{const g=f.appl.children.filter(o=>o.userData.wardrobe===true)[0],by=k=>g.children.find(o=>o.userData[k]===true),mg=by('mirror'),hg=by('hanger');
    const box=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.y-sy/2,p.y+sy/2,p.z-sz/2,p.z+sz/2].map(v=>Math.round(v*1000));};
    const ext=bs=>[0,1,2,3,4,5].map(i=>(i%2?Math.max:Math.min)(...bs.map(q=>q[i])));
    const at=o=>[o.position.x,o.position.y,o.position.z].map(v=>Math.round(v*1e4)/10);   // to 0.1 mm: the balls may sit on a half mm
    const balls=hg.children.filter(o=>o.userData.ball===true);
    return {frame:ext(mg.children.map(box)),glass:box(mg.children.find(o=>o.userData.glass===true)),bar:box(hg.children.find(o=>o.userData.bar===true)),
      balls:balls.map(o=>[...at(o),Math.round(o.geometry.args[0]*2000)]),wood:balls[0].material!==hg.children[0].material,
      dark:new Set(mg.children.filter(o=>o.userData.glass!==true).concat(hg.children.filter(o=>o.userData.ball!==true)).map(o=>o.material)).size,card:infoOf(mg.children[0]).lines[0],
      titles:[infoOf(mg.children[0]).title,infoOf(hg.children[0]).title,infoOf(balls[0]).title]};})(VIEWS.kitchen.furniture())`);
  assert.deepStrictEqual(end.frame, [2266, 2286, 1300, 1700, 1940, 2340], 'on the end, 20 out');
  assert.deepStrictEqual(end.glass, [2270, 2286, 1310, 1690, 1950, 2330], 'the glass inside a 10 frame, 4 back from its face');
  // the frame and the rail (its bar and pegs) one dark grey; the mirror's card: black, 10 mm
  assert.deepStrictEqual([end.dark, end.card], [1, '40 × 40 см, в чёрной рамке 10 мм.']);
  // the rail: a black bar 380 × 30, 12 out, four hooks evenly along it — 40 pegs, wooden balls Ø26 on their ends
  assert.deepStrictEqual(end.bar, [2274, 2286, 1170, 1200, 1950, 2330]);
  assert.deepStrictEqual(end.balls.map((q) => [q[0], q[1], q[3]]), [[2225, 1185, 26], [2225, 1185, 26], [2225, 1185, 26], [2225, 1185, 26]]);
  assert.deepStrictEqual(end.balls.map((q) => q[2] - end.balls[0][2]), [0, 95, 190, 285], 'evenly, 95 apart');
  assert.ok(end.wood, 'the balls not black: wooden');
  assert.deepStrictEqual(end.titles, ['Зеркало', 'Настенная вешалка', 'Настенная вешалка']);
  // the plinth shows under the doors: they start 2 over its 70
  assert.deepStrictEqual(p.run(`VIEWS.kitchen.furniture().doors.filter(x=>x.g.parent.userData.wardrobe===true).map(x=>x.g.children[0].userData.part).map(q=>[q.y0,q.y1])`), [[72, 2198], [72, 2198], [72, 2198]]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(wr().doors.every((d) => d[4] === 0), 'the kitchen\'s fronts leave them');
});

check('living: угловой шкаф — по клику вторая доп. секция 400 на торце ножки (4 варианта: два цвета без неё и с ней), зеркало и вешалка на её торце', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const g0 = 'VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.wardrobe===true)';
  const click = () => p.run(`clickOf({object:${g0}.children[0]})()`);
  const wr = () => p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.wardrobe===true);
    const ps=g=>{const o=[];const w=m=>{if(m.userData&&m.userData.part&&m.userData.part.x1>m.userData.part.x0)o.push(m.userData.part);(m.children||[]).forEach(w);};w(g);return o;};
    const box=g=>{const q=ps(g);return [Math.min(...q.map(q=>q.x0)),Math.max(...q.map(q=>q.x1)),Math.min(...q.map(q=>q.z0)),Math.max(...q.map(q=>q.z1))];};
    const by=k=>gs[0].children.find(o=>o.userData[k]===true);
    const bx=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.z-sz/2,p.z+sz/2].map(v=>Math.round(v*1000));};
    const ext=bs=>[0,1,2,3].map(i=>(i%2?Math.max:Math.min)(...bs.map(q=>q[i])));
    const ic=infoOf(gs[0].children[0]);
    return {boxes:gs.map(box),variant:ic.variant.join('/'),lines:ic.lines,buy:ic.buy.map(b=>[b.name,b.n||1,b.price]),
      end:ps(gs[0]).filter(q=>/на торце/.test(q.name)).map(q=>[q.name,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]),inRun:ps(gs[1]).filter(q=>/на торце/.test(q.name)).length,
      doors:f.doors.filter(x=>gs.includes(x.g.parent)).map(x=>{const q=x.g.children[0].userData.part;return [q.name,q.pivot.x,q.pivot.z,q.pivot.s];}),
      mirror:ext(by('mirror').children.map(bx)),bar:bx(by('hanger').children.find(o=>o.userData.bar===true)),
      cards:[infoOf(by('mirror').children[0]).lines[1],infoOf(by('hanger').children[0]).lines[1]],
      foot:living.foot().filter(r=>r[1]===3250&&r[3]===2390&&r[2]===1890)};})(VIEWS.kitchen.furniture())`);
  let r = wr();
  assert.deepStrictEqual([r.variant, r.boxes, r.end.length, r.mirror, r.foot], ['1/4', [[2286, 3250, 1890, 2390], [2750, 3250, 1026, 1906]], 0, [2266, 2286, 1940, 2340], [[2286, 3250, 1890, 2390]]]);
  assert.deepStrictEqual(r.cards, ['На торце углового шкафа, от 130 до 170 см от пола.', 'На торце углового шкафа под зеркалом, на высоте 117 см.']);
  click(); click();
  r = wr();
  // white with it: the leg 964 + 400 out from the wall (3250 − 1364 = 1886), as wide as the leg (500, its back at the sofa's end 2390); in the leg's group (the walk's L)
  assert.deepStrictEqual([r.variant, r.lines[0], r.boxes], ['3/4', 'Цвет: Белый.', [[1886, 3250, 1890, 2390], [2750, 3250, 1026, 1906]]]);
  assert.deepStrictEqual(r.foot, [[1886, 3250, 1890, 2390]], 'the walk stops at its end');
  // the add-on section's mirror image: sides 16 at its ends, its carcass 484 behind the door, the back at the sofa, four shelves as the first one's, the plinth
  assert.deepStrictEqual(r.end, [
    ['Боковина доп. секции — на торце', 1886, 1902, 1906, 2386, 0, 2200],
    ['Боковина доп. секции — на торце', 2270, 2286, 1906, 2386, 0, 2200],
    ['Крыша доп. секции — на торце', 1902, 2270, 1906, 2386, 2184, 2200],
    ['Дно доп. секции — на торце', 1902, 2270, 1906, 2386, 70, 86],
    ['Цоколь доп. секции — на торце', 1902, 2270, 1906, 1922, 0, 70],
    ['Цоколь задний доп. секции — на торце', 1902, 2270, 2370, 2386, 0, 70],
    ['Задняя стенка доп. секции — на торце', 1888, 2284, 2386, 2390, 70, 2198],
    ...[493, 916, 1338, 1761].map((y) => ['Полка доп. секции — на торце', 1902, 2270, y, y + 16].slice(0, 3).concat([1926, 2386, y, y + 16])),
    ['Дверь доп. секции — на торце', 1887, 2285, 1890, 1906, 72, 2198]]);
  assert.strictEqual(r.inRun, 0);
  // its door in line with the leg's, toward the kitchen wall, hinged at its outer end
  assert.deepStrictEqual(r.doors, [
    ['Дверь углового шкафа — у дивана', 2287, 1890, 1],
    ['Дверь доп. секции — на торце', 1887, 1890, 1],
    ['Дверь углового шкафа — вдоль стены', 2750, 1427, -1],
    ['Дверь доп. секции', 2750, 1027, -1]]);
  // the mirror and the coat rail on its end, in the middle of its width
  assert.deepStrictEqual([r.mirror, r.bar], [[1866, 1886, 1940, 2340], [1874, 1886, 1950, 2330]]);
  assert.deepStrictEqual(r.cards, ['На торце доп. секции, выступающей в комнату, от 130 до 170 см от пола.', 'На торце доп. секции, выступающей в комнату, под зеркалом, на высоте 117 см.']);
  // the card: two add-on sections, the second product row ×2, the sum 12000 + 2 × 5500
  assert.deepStrictEqual([r.lines[2], r.lines[3], r.lines[4]], ['Угловой 96,4 × 96,4 см и две доп. секции 40 × 50 см — вдоль стены и на торце, высота 220 см, глубина 50 см.',
    'В угловом слева четыре полки, справа — полка и две штанги для вешалок; в доп. секциях по четыре полки.', 'Вместе 23\u00a0000 ₽.']);
  assert.deepStrictEqual(r.buy, [['Угловой 96,4 × 96,4 × 220', 1, 12000], ['Доп. секция 40 × 50 × 220', 2, 5500]]);
  // «next»: grey with it; through a rebuild; a click: back to white without it
  p.run(`infoOf(${g0}.children[0]).next()`);
  r = wr(); assert.deepStrictEqual([r.variant, r.lines[0], r.boxes[0]], ['4/4', 'Цвет: Диамант серый U963 ST9.', [1886, 3250, 1890, 2390]]);
  const bW = p.run('A.bW'); slide(p, 'bW', bW + 200); p.tick();
  r = wr(); assert.deepStrictEqual([r.variant, r.lines[0], r.boxes[0][1] - r.boxes[0][0]], ['4/4', 'Цвет: Диамант серый U963 ST9.', 1364], 'through a rebuild (the right wall 200 further)');
  slide(p, 'bW', bW); p.tick();
  click();
  r = wr(); assert.deepStrictEqual([r.variant, r.lines[0], r.boxes[0], r.end.length, r.mirror], ['1/4', 'Цвет: Белый.', [2286, 3250, 1890, 2390], 0, [2266, 2286, 1940, 2340]]);
});

check('living: «Задняя стенка шкафа из ЛДСП» на «Планировке» — задние стенки шкафа к дивану из ЛДСП 16 в цвет корпуса, клик по ним меняет их цвет', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const g0 = 'VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.wardrobe===true)';
  const wr = () => p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.wardrobe===true);
    const ps=g=>{const o=[];const w=m=>{if(m.userData&&m.userData.part&&m.userData.part.x1>m.userData.part.x0)o.push(m);(m.children||[]).forEach(w);};w(g);return o;};
    const all=gs.flatMap(ps),pt=m=>m.userData.part,bk=all.filter(m=>/^(Лист [0-9] )?[Зз]адн(яя|ей) стенк[аи] (шкафа — у дивана|углового шкафа — справа|доп. секции — на торце)/.test(pt(m).name));
    const body=gs[0].children[0],ic=infoOf(body);
    return {backs:bk.map(m=>{const q=pt(m);return [q.name,q.mat,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1];}),
      leg:all.map(pt).filter(q=>/^(Боковина|Крыша|Дно|Полка) углового шкафа — справа/.test(q.name)).map(q=>q.z1),
      side:all.map(pt).filter(q=>/^Боковина углового шкафа — справа/.test(q.name)).map(q=>q.z1-q.z0),
      boxes:gs.map(g=>{const q=ps(g).map(pt);return [Math.min(...q.map(q=>q.z0)),Math.max(...q.map(q=>q.z1))];}),
      doors:f.doors.filter(x=>gs.includes(x.g.parent)).map(x=>x.g.children[0].userData.part.pivot.z),
      rack:infoOf(f.appl.children.find(o=>o.userData.rack===true).children[0]).lines[4].match(/[0-9,]+ см/)[0],
      foot:living.foot().filter(r=>r[1]===3250&&r[0]===2286),
      mirror:(m=>{const z=m.children.map(o=>[o.position.z-o.geometry.args[2]/2,o.position.z+o.geometry.args[2]/2]);return [Math.round(Math.min(...z.map(a=>a[0]))*1000),Math.round(Math.max(...z.map(a=>a[1]))*1000)];})(gs[0].children.find(o=>o.userData.mirror===true)),
      rods:gs[0].children.filter(o=>o.userData.rod===true).map(r=>Math.round(r.position.z*1000)),
      own:bk.every(m=>m.material!==body.material&&clickOf({object:m})===clickOf({object:bk[0]})&&clickOf({object:m})!==clickOf({object:body})&&infoOf(m).title==='Задняя стенка шкафа со стороны дивана'&&ic.title==='Угловой шкаф «Уютная логика» (OZON)'),
      // the wardrobe's colour, the backs' (their own card)
      lines:ic.lines.slice(0,1).concat(bk.filter(m=>pt(m).sofaBack===true).slice(0,1).map(m=>infoOf(m).lines[0])),
      card:bk.filter(m=>pt(m).sofaBack===true).slice(0,1).map(m=>(i=>[i.lines.slice(1),i.price,i.url,i.shop,i.variant.join('/')])(infoOf(m)))[0],
      ward:ic.lines.some(l=>/Задн/.test(l))};})(VIEWS.kitchen.furniture())`);
  const backClick = () => p.run(`(g=>{const f=[];const w=m=>{if(m.userData&&m.userData.part&&m.userData.part.sofaBack===true)f.push(m);(m.children||[]).forEach(w);};w(g);clickOf({object:f[0]})();return 0;})(${g0})`);
  const t = p.document.getElementById('pWardBack');
  // off: the HDF backs at the sofa, two sheets of the leg's; the carcass 4 short of the sofa's end (2390)
  let r = wr();
  assert.strictEqual(t.checked, false);
  assert.deepStrictEqual(r.backs.map((q) => q.slice(0, 2)), [['Лист 1 задней стенки углового шкафа — справа', 'back'], ['Лист 2 задней стенки углового шкафа — справа', 'back']]);
  assert.deepStrictEqual([new Set(r.leg), r.side, r.rods, r.lines], [new Set([2386]), [480, 480], [2146, 2146], ['Цвет: Белый.']]);
  assert.deepStrictEqual([r.boxes, r.doors, r.rack, r.foot, r.mirror], [[[1890, 2390], [1026, 1906]], [1890, 1427, 1027], '102,6 см', [[2286, 3250, 1890, 2390]], [1940, 2340]]);
  // on: LDSP 16 over the leg's rear, floor to top, in two sheets of 480 (an add-on section's sides) edge to edge from its end, 4 short of the wall; the carcasses as deep (480),
  // so the wardrobe 12 more: its back's outer face still at the sofa (2390), all the rest 12 toward the kitchen wall — its doors, the run
  // along the wall, the walk's stop, the mirror in the middle of the leg's end; the racks' room 12 less. Its colour the carcass's, a card line on it;
  // kept with the sizes, not with the kitchen's settings
  t.checked = true; t.dispatch('change'); p.tick();
  r = wr();
  assert.deepStrictEqual(r.backs, [
    ['Лист 1 задней стенки шкафа — у дивана', 'carcass', 2286, 2766, 2374, 2390, 0, 2200],
    ['Лист 2 задней стенки шкафа — у дивана', 'carcass', 2766, 3246, 2374, 2390, 0, 2200]]);
  // their own «i»: cut from one more add-on section — its sides; its Ozon link and price; the wardrobe's card says nothing of them
  assert.deepStrictEqual([r.card, r.ward], [[[
    'Листы ЛДСП 16 мм вместо ХДФ — взяты из боковин 48 × 220 см ещё одной доп. секции 40 × 50 × 220.',
    'Нажатие перекрашивает все задние стенки.'], 5500, 'https://ozon.ru/t/BSIni7B', 'Ozon', '1/2'], false]);
  assert.deepStrictEqual([new Set(r.leg), r.side, r.rods, r.own], [new Set([2374]), [480, 480], [2134, 2134], true]);
  assert.deepStrictEqual([r.boxes, r.doors, r.rack, r.foot, r.mirror], [[[1878, 2390], [1014, 1894]], [1878, 1415, 1015], '101,4 см', [[2286, 3250, 1878, 2390]], [1934, 2334]]);
  assert.deepStrictEqual(r.lines, ['Цвет: Белый.', 'Цвет: Белый.']);
  assert.deepStrictEqual(p.run('modelDiff()'), { wardBack: true });
  p.document.getElementById('k-saveDef').click();
  assert.ok(!('WardBack' in JSON.parse(storage.get('apt-kitchen-v2')).P), 'not among the kitchen\'s own settings');
  // a click on a back: the backs grey, the carcass stays white; through a rebuild; again — white
  backClick();
  assert.deepStrictEqual(wr().lines, ['Цвет: Белый.', 'Цвет: Диамант серый U963 ST9.']);
  const bW = p.run('A.bW'); slide(p, 'bW', bW + 200); p.tick(); slide(p, 'bW', bW); p.tick();
  assert.deepStrictEqual(wr().lines[1], 'Цвет: Диамант серый U963 ST9.', 'through a rebuild');
  backClick();
  assert.deepStrictEqual(wr().lines[1], 'Цвет: Белый.');
  // the carcass grey with the add-on section on the leg's end: the backs' row over its rear too; their click paints them all, not the carcass
  p.run(`clickOf({object:${g0}.children[0]})()`); p.run(`clickOf({object:${g0}.children[0]})()`); p.run(`clickOf({object:${g0}.children[0]})()`);
  r = wr();
  // one row over the leg's whole rear, the end section's too (1364: flush with its end, 4 short of the wall): the two sides from its end, the door (400, 2126 high, its
  // top level with theirs) against the wall — its shortfall behind the sofa; the first side over the joint of the leg and the end section (2286)
  assert.deepStrictEqual(r.backs, [
    ['Лист 1 задней стенки шкафа — у дивана', 'carcass', 1886, 2366, 2374, 2390, 0, 2200],
    ['Лист 2 задней стенки шкафа — у дивана', 'carcass', 2366, 2846, 2374, 2390, 0, 2200],
    ['Лист 3 задней стенки шкафа — у дивана', 'carcass', 2846, 3246, 2374, 2390, 74, 2200]]);
  assert.deepStrictEqual(r.card[0], [
    'Листы ЛДСП 16 мм вместо ХДФ — взяты из боковин 48 × 220 см и фасада 40 × 212,6 см ещё одной доп. секции 40 × 50 × 220.',
    'Фасад — у стены: он ниже боковин, недостача внизу прячется за диваном.', 'Нажатие перекрашивает все задние стенки.']);
  assert.deepStrictEqual([r.own, r.lines], [true, ['Цвет: Диамант серый U963 ST9.', 'Цвет: Белый.']]);
  backClick();
  assert.deepStrictEqual(wr().lines, ['Цвет: Диамант серый U963 ST9.', 'Цвет: Диамант серый U963 ST9.']);
  // off and on again: in the carcass's colour anew
  t.checked = false; t.dispatch('change'); p.tick();
  r = wr();
  assert.deepStrictEqual([r.backs.map((q) => q[1]), r.lines], [['back', 'back', 'back'], ['Цвет: Диамант серый U963 ST9.']]);
  p.run(`clickOf({object:${g0}.children[0]})()`);
  t.checked = true; t.dispatch('change'); p.tick();
  assert.deepStrictEqual(wr().lines, ['Цвет: Белый.', 'Цвет: Белый.']);
});

check('living: антресоль OZON над диваном — две секции по 1000, глубина 500, от 1700 до 2200 (вровень со шкафом), от шкафа к окну; четыре двери открываются', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const mz = () => p.run(`(f=>{const g=f.appl.children.find(o=>o.userData.mezzanine===true),ps=[];
    const w=o=>{if(o.userData&&o.userData.part&&o.userData.part.x1>o.userData.part.x0)ps.push(o.userData.part);(o.children||[]).forEach(w);};w(g);
    return {box:[Math.min(...ps.map(q=>q.x0)),Math.max(...ps.map(q=>q.x1)),Math.min(...ps.map(q=>q.z0)),Math.max(...ps.map(q=>q.z1)),Math.min(...ps.map(q=>q.y0)),Math.max(...ps.map(q=>q.y1))],
      title:infoOf(g.children[0]).title,card:(i=>[i.buy.map(b=>[b.name,b.n,b.price,b.url,b.shop||i.shop]),i.lines[2],i.lines[4]])(infoOf(g.children[0])),
      color:(i=>[i.variant.join('/'),i.lines[0]])(infoOf(g.children[0])),click:clickOf({object:g.children[0]})!==clickOf({object:f.appl.children.find(o=>o.userData.wardrobe===true).children[0]}),
      sec1:ps.filter(q=>/секция 1$/.test(q.name)).map(q=>[q.name,q.mat,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]),
      ward:infoOf(f.appl.children.find(o=>o.userData.wardrobe===true).children[0]).lines[0],doors:f.doors.filter(x=>x.g.parent===g).map(x=>{const q=x.g.children[0].userData.part;return [q.z0,q.z1,q.pivot.z,q.pivot.s,x.t];})};})(VIEWS.kitchen.furniture())`);
  let r = mz();
  // kitchen axes: on the right wall (3250), 500 deep; from the wardrobe's side at the sofa (2390) 2000 toward the window, 210 short of it
  assert.deepStrictEqual(r.box, [2750, 3250, 2390, 4390, 1700, 2200]);
  // a section: the sides, the top and the bottom all as deep (484 behind the doors, up to 4 short of the wall), the 4 HDF back nailed
  // over their rear edges, 2 in from the section's edges
  assert.deepStrictEqual(r.sec1, [
    ['Боковина антресоли — секция 1', 'carcass', 2766, 3246, 2390, 2406, 1700, 2200],
    ['Боковина антресоли — секция 1', 'carcass', 2766, 3246, 3374, 3390, 1700, 2200],
    ['Крыша антресоли — секция 1', 'carcass', 2766, 3246, 2406, 3374, 2184, 2200],
    ['Дно антресоли — секция 1', 'carcass', 2766, 3246, 2406, 3374, 1700, 1716],
    ['Задняя стенка антресоли — секция 1', 'back', 3246, 3250, 2392, 3388, 1702, 2198]]);
  assert.strictEqual(r.title, 'Антресоль «Уютная логика» (OZON)');
  // its card: two sections alike, each OZON's 100 × 50 × 50 at 3500, one row for them with its link; the sum
  assert.deepStrictEqual(r.card, [[['Антресоль 100 × 50 × 50', 2, 3500, 'https://ozon.ru/t/ivoD7B6', 'Ozon']], '2 секции по 100 см, глубина 50 см, высота 50 см; по две двери в каждой.', 'Вместе 7\u00a0000 ₽.']);
  // its colour, white at first, apart from the wardrobe's: its «next» paints it grey, not the wardrobe; the wardrobe's click paints only that;
  // a click on it white again
  assert.deepStrictEqual([r.color, r.click], [['1/2', 'Цвет: Белый.'], true]);
  p.run(`infoOf(VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.mezzanine===true).children[0]).next()`);
  r = mz(); assert.deepStrictEqual([r.color, r.ward], [['2/2', 'Цвет: Диамант серый U963 ST9.'], 'Цвет: Белый.']);
  p.run(`clickOf({object:VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.wardrobe===true).children[0]})()`);
  r = mz(); assert.deepStrictEqual([r.color, r.ward], [['2/2', 'Цвет: Диамант серый U963 ST9.'], 'Цвет: Диамант серый U963 ST9.']);
  p.run(`clickOf({object:VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.mezzanine===true).children[0]})()`);
  r = mz(); assert.deepStrictEqual([r.color, r.ward], [['1/2', 'Цвет: Белый.'], 'Цвет: Диамант серый U963 ST9.']);
  // two doors a section, hinged at its ends, into the room
  assert.deepStrictEqual(r.doors, [[2391, 2889, 2391, -1, 0], [2891, 3389, 3389, 1, 0], [3391, 3889, 3391, -1, 0], [3891, 4389, 4389, 1, 0]]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(mz().doors.every((d) => d[4] === 0), 'the kitchen\'s fronts leave them');
});

check('living: белая полка 2000 × 250 над диваном — под антресолью, вровень с ней, на трёх белых L-образных кронштейнах (стойка вверх, за полкой); низ на 1375', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // the desk shelf's board painted white (its fourth, after HEMNES): the same board and brackets
  const deskShelf = 'VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.desk===true).children.find(o=>o.userData.shelfBracket===true)';
  p.run(`clickOf({object:${deskShelf}})()`); p.run(`clickOf({object:${deskShelf}})()`); p.run(`clickOf({object:${deskShelf}})()`);
  const r = p.run(`(f=>{const q=f.appl.children.find(o=>o.userData.sofaShelf===true),mm=v=>Math.round(v*1000),ds=f.appl.children.find(o=>o.userData.desk===true);
    const white={br:ds.children.find(o=>o.userData.shelfBracket===true).material,carcass:ds.children.find(o=>o.userData.part&&o.userData.part.name==='Полка над столом').material[4]};
    const board=q.children.find(o=>o.userData.part),br=q.children.filter(o=>o.userData.bracket===true);
    const box=o=>{const [sx,sy,sz]=o.geometry.args,c=o.position;return [c.x-sx/2,c.x+sx/2,c.y-sy/2,c.y+sy/2,c.z-sz/2,c.z+sz/2].map(mm);};
    const straight=br.filter(o=>!+o.rotation.x),ys=straight.map(box);
    return {at:[mm(q.position.x),mm(q.position.z)],turn:+q.rotation.y,board:(b=>[b.x0,b.x1,b.y0,b.y1,b.z0,b.z1])(board.userData.part),
      boardWhite:board.material.includes(white.carcass),deskWhite:infoOf(ds.children.find(o=>o.userData.shelfBracket===true)).lines[0],n:br.length,white:br.every(o=>o.material===white.br),
      struts:br.length-straight.length,arms:straight.filter(o=>o.geometry.args[2]>.01).map(o=>[mm(o.position.x),box(o)[5]]),low:Math.min(...ys.map(b=>b[2])),high:Math.max(...ys.map(b=>b[3])),
      info:infoOf(q),pick:infoOf(br[0]).title===infoOf(board).title};})(VIEWS.kitchen.furniture())`);
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

check('living: два одинаковых металлических стеллажа на правой стене от прохода до углового шкафа — глубина 250, высота 1750, пять полок на болтах, стойки перфорированы', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const rk = () => p.run(`(f=>{const gs=f.appl.children.filter(o=>o.userData.rack===true);
    const box=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.y-sy/2,p.y+sy/2,p.z-sz/2,p.z+sz/2].map(v=>Math.round(v*1000));};
    return gs.map(g=>{const bs=g.children.filter(o=>o.userData.bolt!==true).map(box),ext=[0,1,2,3,4,5].map(i=>(i%2?Math.max:Math.min)(...bs.map(q=>q[i])));
      const post=g.children.find(o=>o.userData.post===true),mats=post.material,perf=mats[4];
      return {box:[ext[0],ext[1],ext[4],ext[5],ext[2],ext[3]],posts:g.children.filter(o=>o.userData.post===true).length,
        shelves:g.children.filter(o=>o.userData.shelf===true).map(o=>box(o)[3]),bolts:g.children.filter(o=>o.userData.bolt===true).length,
        perf:mats[5]===perf&&perf.alphaTest===.5&&typeof perf.alphaMap.offset.y==='number'&&[0,1,2,3].every(i=>mats[i]!==perf),info:infoOf(g.children[0]),visible:g.visible};});})(VIEWS.kitchen.furniture())`);
  let r = rk();
  // kitchen axes: on the right wall (3250), 250 deep, their fronts at 3000 — in line with the end of the wall right of the way in; from the kitchen
  // wall (z 0) up to the wardrobe's add-on section (1026): 10 from each and between them, 498 each
  assert.deepStrictEqual(r.map((q) => q.box), [[3000, 3250, 10, 508, 0, 1750], [3000, 3250, 518, 1016, 0, 1750]]);
  r.forEach((q) => {
    assert.strictEqual(q.posts, 4);
    assert.deepStrictEqual(q.shelves, [70, 490, 910, 1330, 1750], 'evenly from near the floor up to the posts\' tops, 10 holes apart');
    assert.strictEqual(q.bolts, 30, 'five shelves: a bolt on the end flange of each post, on the front flange of each front post');
    assert.ok(q.perf, 'the holes in the flanges\' broad faces only');
    assert.strictEqual(q.info.title, 'Металлический стеллаж');
    assert.strictEqual(q.info.lines[0], '50 × 25 см, высота 175 см.', 'its width to whole cm');
    assert.strictEqual(q.info.lines[4], 'Место под оба — 102,6 см вдоль стены, от угла до шкафа; зазоры по 1 см с краёв и между ними.', 'the wall from the corner (z 0) to the wardrobe (1026)');
    assert.strictEqual(q.visible, false, 'not in the kitchen tab: on the plan and in the walk');
  });
  // a bolt in a hole: the mask's holes 42 apart from the posts' feet (10), one at each shelf's bolt (its top − 15)
  const off = p.run(`VIEWS.kitchen.furniture().appl.children.find(o=>o.userData.rack===true).children.find(o=>o.userData.post===true).material[4].alphaMap.offset.y`);
  [55, 475, 1735].forEach((y) => { const v = ((y - 10) / 42 + off) % 1; assert.ok(Math.abs(v - .5) < 1e-9, 'a hole at ' + y + ': ' + v); });
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(rk().map((q) => q.visible), [true, true]);
  // a click on either makes both deeper: 300, 350, then 250 again — off the right wall (3250), the card and the walk's footprint with them
  const click = (i) => p.run(`VIEWS.kitchen.furniture().appl.children.filter(o=>o.userData.rack===true)[${i}].userData.click()`);
  [[0, 300], [1, 350], [0, 250]].forEach(([i, d]) => {
    click(i); p.tick(); r = rk();
    assert.deepStrictEqual(r.map((q) => q.box.slice(0, 2)), [[3250 - d, 3250], [3250 - d, 3250]], 'depth ' + d);
    assert.deepStrictEqual(r.map((q) => q.visible), [true, true], 'still on the plan');
    assert.strictEqual(r[0].info.lines[0], `50 × ${d / 10} см, высота 175 см.`);
  });
  // a longer kitchen moves the sofa and the wardrobe toward the window: the racks grow with the empty wall
  slide(p, 'kL', 5000); p.tick();
  assert.deepStrictEqual(rk().map((q) => q.box.slice(2, 4)), [[10, 708], [718, 1416]]);
  assert.strictEqual(rk()[0].info.lines[0], '70 × 25 см, высота 175 см.');
});

check('living: угловой диван Hoff «Слим» у правой стены напротив стола — оттоманка к стене с окном, 150 от неё', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const r = p.run(`(f=>f.appl.children.filter(o=>o.userData.sofa===true).map(q=>{
    const b=new THREE.Box3().setFromObject(q);return {at:[Math.round(q.position.x*1000),Math.round(q.position.z*1000)],turn:+q.rotation.y,
      x0:(b.min.x-q.position.x)*1000,size:[Math.round((b.max.x-b.min.x)*1000),Math.round((b.max.z-b.min.z)*1000),Math.round(b.max.y*1000)],title:infoOf(q).title,buy:(i=>[i.price,i.url,i.shop])(infoOf(q))};}))(VIEWS.kitchen.furniture())`);
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
  const lid = () => p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-lid"),[sf,c]=f.appl.children.filter(o=>o.userData.sofa===true),b=new THREE.Box3().setFromObject(d.g);
    return {axis:d.axis,s:d.s,max:+d.max.toFixed(3),t:+d.t.toFixed(3),rot:+d.g.rotation.x.toFixed(2),inChaise:d.g.parent===c,hinge:[Math.round(d.g.position.y*1000),Math.round(d.g.position.z*1000)],
      size:[Math.round((b.max.x-b.min.x)*1000),Math.round((b.max.y-b.min.y)*1000),Math.round((b.max.z-b.min.z)*1000)],title:infoOf(d.g.children[0]).title,
      ride:[[.644,.46],[.48,.36]].map(([w,h])=>{const m=c.children.find(o=>o.geometry&&o.geometry.args&&Math.abs(o.geometry.args[0]-w)<1e-6&&Math.abs(o.geometry.args[1]-h)<1e-6);return m&&[Math.round(m.position.y*1000),Math.round(m.position.z*1000)];}),
      stitches:(fl=>{const seam=fl(f.doors.find(x=>x.key==="sofa-bed").g.children[0])[0].material,st=fl(c).filter(m=>m.material===seam).map(m=>m.geometry.args);
        return [st.filter(a=>a[2]<.002).length,st.filter(a=>a[0]<.002).length/2,st.filter(a=>a[0]<.002).length/2];})(q=>q.children.filter(m=>m.geometry&&m.geometry.kind==="THREE.BoxGeometry"&&m.geometry.args.length===3)),
      white:(fl=>{const seam=fl(f.doors.find(x=>x.key==="sofa-bed").g.children[0])[0].material;return fl(c).filter(m=>m.material!==seam).length;})(q=>q.children.filter(m=>m.geometry&&m.geometry.kind==="THREE.BoxGeometry"&&m.geometry.args.length===3))};})(VIEWS.kitchen.furniture())`);
  let r = lid();
  // a click on the box under it lifts it too, as one on the bed's drawer lays out the bed
  assert.deepStrictEqual(p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-lid"),c=d.g.parent,box=c.children.find(o=>o.geometry&&o.position.y<.3);   // its walls and legs, under the seat
    const pick=o=>(x=>x&&x.key)(pickDoor(null,{object:o,point:new THREE.Vector3()}));return [pick(box),pick(d.g.children[0])];})(VIEWS.kitchen.furniture())`), ['sofa-lid', 'sofa-lid']);
  // its upper back edge at the seat's height, at the thin back (100); the whole seat of the chaise
  assert.deepStrictEqual([r.axis, r.s, r.max, r.t, r.rot, r.inChaise, r.hinge], ['x', -1, 0.698, 0, 0, true, [450, 100]], 'closed, on its hinge in the chaise');
  assert.deepStrictEqual(r.size, [705, 170, 1430], 'the chaise\'s seat, from the thin back to its front');
  // 10 mm to the left (toward the seat) of the chaise's box: its middle 705 / 2 + 10 from the chaise's end (own x mirrored): 1697.5
  assert.strictEqual(p.run('(d=>Math.round(d.g.children[0].position.x*1000))(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))'), 1698);
  // on it, the chaise's back cushion and the throw pillow in the corner (their middles: y, z)
  assert.deepStrictEqual(r.ride, [[680, 210], [640, 385]]);
  assert.strictEqual(r.title, 'Угловой диван-кровать «Слим» (Hoff)');
  assert.deepStrictEqual(r.stitches, [5, 4, 4], 'stitched up its front and both its sides, 130 apart');
  assert.strictEqual(r.white, 5, 'the box white inside (flat boards besides the stitches): its bottom and four walls');
  // a click: up (its front edge rises over the seat), half as fast as a front: about 69 % of the way at 0.21 s
  // (a front: 90 %), and down again; no front, the kitchen's «Открыты» leaves it
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click(); p.tick(13);
  assert.strictEqual(lid().t, 0, 'not with the fronts');
  p.run('(d=>{d.t=d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))'); p.tick(13);
  const early = p.run('(d=>d.a/d.max)(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))');
  assert.ok(early > .62 && early < .76, 'on its way: ' + early);
  p.tick(107);
  // (a turn about x by a < 0 lifts what lies in front of the hinge: y = −z·sin a)
  r = lid(); assert.ok(r.t === 0.698 && r.rot === -0.7, 'open at 40°: its front edge up');
  // held: 30°/s
  assert.strictEqual(p.run('+(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid").holdRate*180/Math.PI).toFixed(1)'), 30);
  // straight up till their lower front edges are on the lid's top: the cushion's at 450 + (320 − 100)·tan 40° = 635; the pillow's
  // (496, 486) at 783, its middle 640 + 296
  assert.deepStrictEqual(r.ride, [[865, 210], [936, 385]], 'the pillows up out of its way');
  p.run('(d=>{d.t=0;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))'); p.tick(120);
  r = lid(); assert.ok(Math.abs(r.rot) < .02, 'closed again');
  assert.ok(r.ride.every(([y, z], i) => Math.abs(y - [680, 640][i]) < 3 && Math.abs(z - [210, 385][i]) < 2), 'the pillows back down');
  // a click opens it alone, and it stays open through a rebuild
  p.run('(d=>{d.t=d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-lid"))');
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  assert.strictEqual(lid().t, 0.698);
});

check('living: диван раскладывается «дельфином» — ящик выкатывается, спальный блок из него поднимается вровень с сиденьем', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const bed = (a) => p.run(`(f=>{const d=f.doors.find(x=>x.key==="sofa-bed"),sf=f.appl.children.filter(o=>o.userData.sofa===true)[0];
    ${a === undefined ? '' : `d.a=d.t=d.max*${a};turnDoor(d);`}
    const dr=d.g.children[0],bl=dr.children[0],st=bl.children[0],b=new THREE.Box3().setFromObject(sf),R=v=>Math.round(v*1000);
    return {axis:d.axis,inSofa:d.g.parent===sf,seat:d.g.children[1].geometry.args.slice(0,3).map(R),max:d.max,t:+d.t.toFixed(2),drawer:R(dr.position.z),
      block:[R(bl.position.y),R(bl.position.z),+bl.rotation.x.toFixed(2)],size:bl.children[1].geometry.args.slice(0,3).map(R),strap:st.visible,depth:R(b.max.z-b.min.z)};})(VIEWS.kitchen.furniture())`);
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
  p.run('(d=>{d.t=d.max;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))'); p.tick(44);
  const half = p.run('(d=>d.a/d.max)(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))');
  assert.ok(half > .45 && half < .55, 'half way: ' + half); assert.strictEqual(bed().drawer, 680);
  p.tick(156);
  r = bed(); assert.deepStrictEqual([r.t, r.drawer, r.block, r.strap], [1.45, 680, [280, 170, 0], true]);
  p.run('(d=>{d.t=0;doorsChanged();})(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))'); p.tick(200);
  r = bed(); assert.deepStrictEqual([r.drawer, r.block, r.strap], [0, [75, 130, 0], false]);
  // held, the whole way in 3 s: slower than a click, as the other doors (they ease in about 0.3 s, held at 60°/s)
  p.run('held={d:VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"),dir:1}'); p.tick(94);
  const held = p.run('(d=>(held=null,d.a/d.max))(VIEWS.kitchen.furniture().doors.find(x=>x.key==="sofa-bed"))');
  assert.ok(held > .45 && held < .55, 'half way in 1.5 s held: ' + held);
});

/* ---------- под окном ---------- */

check('living: радиатор под подоконником — 10 белых секций, 800 × 570 × 80, по центру окна, 100 от стены, на 100 ниже подоконника; без места под ним нет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const rad = () => p.run(`(f=>{const q=f.appl.children.find(o=>o.userData.radiator===true),mm=v=>Math.round(v*1000);
    const rd=living.foot().filter(r=>r[3]===A.kL&&r[2]===A.kL-100);
    if(!q)return {none:true,foot:rd};
    const bs=q.children.filter(o=>o.geometry.kind==='THREE.BoxGeometry').map(o=>{const [sx,sy,sz]=o.geometry.args,c=o.position;return [c.x-sx/2,c.x+sx/2,c.y-sy/2,c.y+sy/2,c.z-sz/2,c.z+sz/2].map(mm);});
    const ext=[0,1,2,3,4,5].map(i=>(i%2?Math.max:Math.min)(...bs.map(b=>b[i])));
    return {at:[mm(q.position.x),mm(q.position.z)],turn:+q.rotation.y,ext,fronts:bs.filter(b=>b[5]===100&&b[3]-b[2]===530).map(b=>b[1]-b[0]),tops:q.children.filter(o=>o.userData.top===true).map(o=>{const [r0,,len,,,,t0,tl]=o.geometry.args;return [mm(len),mm(o.position.y+r0),mm(o.position.z-r0),mm(o.position.z+r0),t0,+tl.toFixed(4)];}),mat:q.children.every(o=>o.userData.valve===true||o.material===winMat),
      valve:mm(q.children.find(o=>o.userData.valve===true).position.x),info:infoOf(q),foot:rd};})(VIEWS.kitchen.furniture())`);
  let r = rad();
  // kitchen axes: in the middle of the window wall (the window is in the middle of the room: 3250 / 2), turned to face the room
  assert.deepStrictEqual([r.at, r.turn], [[1625, 4600], Math.PI]);
  // own axes: 800 along the wall (the end panels 2 in, half a gap; the headers the whole 800), from 120 to 690 (the sill board's
  // underside at 790, 100 over it), from 20 off the wall out to 100
  assert.deepStrictEqual(r.ext, [-398, 398, 120, 650, 20, 100]);
  assert.deepStrictEqual(r.fronts, Array(10).fill(76), 'ten front panels, 4 mm apart, up to 650');
  // over them their tops rounded: the upper half of a round 80 across, from the front over to the wall side, up to 690
  assert.deepStrictEqual(r.tops, Array(10).fill([76, 690, 20, 100, 0, +Math.PI.toFixed(4)]));
  assert.ok(r.mat, 'white as the sill: its material (but the valve)');
  assert.ok(r.valve > 400, 'the air valve at the right end seen from the room');
  assert.deepStrictEqual(r.foot, [[1225, 2025, 4500, 4600]], 'the walker stops at it');
  assert.deepStrictEqual([r.info.title, r.info.lines], ['Радиатор отопления', ['Секционный, 10 секций по 8 см; белая глянцевая эмаль.',
    '80 × 57 см, глубина 8 см; от стены 10 см.', 'Под подоконником, по центру окна: низ на 12 см от пола, до подоконника 10 см.']]);
  // it goes with the sill
  slide(p, 'winS', 900); p.tick();
  r = rad();
  assert.deepStrictEqual([r.ext[2], r.tops[0][1]], [220, 790]);
  assert.strictEqual(r.info.lines[2], 'Под подоконником, по центру окна: низ на 22 см от пола, до подоконника 10 см.');
  // with the sill lower than 740 there is no room under it (60 at least from the floor): none, nor its footprint
  slide(p, 'winS', 730); p.tick();
  assert.deepStrictEqual(rad(), { none: true, foot: [] });
});
