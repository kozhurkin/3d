// обеденный стол: место у левой стены, обеденная зона, карточка (src/js/rooms/kitchen/dining.js)
const { runPage, PAGES, check, slide, assert } = require('../harness');

check('кухня: стол у левой стены — 1340 от стены кухни (по правилу обеденной зоны при длине 4600), 700 вдоль стены, 1300 в комнату, столешница 30 мм на высоте 750', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // the kitchen's origin on the plan: −2050, 2000; the table's top and legs among the appliances, in the walker's way
  const r = p.run(`furnBoxes().map(b=>b.map(v=>tt.mm(v))).filter(b=>b[0]>=-2050&&b[1]<=-750&&b[2]>=3340&&b[3]<=4040)`);
  assert.deepStrictEqual(r.filter((b) => b[1] - b[0] === 1300), [[-2050, -750, 3340, 4040, 720, 750]], 'the top');
  assert.deepStrictEqual(r.filter((b) => b[1] - b[0] === 40).map((b) => [b[0], b[2], b[4], b[5]]),
    [[-2000, 3390, 0, 720], [-840, 3390, 0, 720], [-2000, 3950, 0, 720], [-840, 3950, 0, 720]], 'four legs 40 × 40, 50 in from the edges');
});

check('кухня: обеденная зона по длине до окна — у столешницы на 200 больше, остальное пополам (округление к витрине); письменный стол в 100 от окна или впритык (галочка на планировке); ползунок 4000–5000', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  // the room by the table's sides (from the worktop's edge, 600; to the display cabinet's front), cm on its card, and the desk's gap from the window wall, mm
  const room = (L) => { slide(p, 'kL', L); p.tick(); return p.run(`(f=>{const t=f.appl.children.find(o=>{const i=infoOf(o);return i&&i.title==='Обеденный стол';}),
    d=tt.item("desk");return [infoOf(t).lines[3].match(/\\d+/g).map(Number),A.kL-tt.mm(d.position.z)];})(tt.fur())`); };
  assert.deepStrictEqual(room(4600), [[74, 54], 100], '1280: 740 and 540');
  assert.deepStrictEqual(room(4610), [[74, 55], 100], '1290: 740 and 550, the 5 to the display cabinet');
  assert.deepStrictEqual(room(5000), [[94, 74], 100], 'a longer room: both sides grow');
  assert.deepStrictEqual(room(4420), [[65, 45], 100], 'no threshold: the desk stays 100 from the window, the room by the table shrinks');
  // the slider goes from 4000 to 5000, no stop on the way
  const s = p.document.querySelector('[data-size="kL"]');
  assert.deepStrictEqual([s.getAttribute('min'), s.getAttribute('max')], ['4000', '5000']);
  assert.deepStrictEqual(room(4000), [[44, 24], 100]);
  assert.deepStrictEqual([p.run('A.kL'), p.document.getElementById('pSizeMsg').textContent], [4000, '']);
  // «Рабочий стол впритык к стене» on the plan: no gap, its 100 go to the dining area; kept with the sizes; off again — back
  const t = p.document.getElementById('pDeskWall');
  assert.strictEqual(t.checked, false);
  t.checked = true; t.dispatch('change');
  assert.deepStrictEqual(room(4600), [[79, 59], 0], '1380: 790 and 590');
  assert.deepStrictEqual(p.run('modelDiff()'), { deskWall: true });
  p.document.getElementById('k-saveDef').click();
  assert.ok(!('DeskWall' in JSON.parse(storage.get('apt-kitchen-v2')).P), 'not among the kitchen\'s own settings');
  t.checked = false; t.dispatch('change');
  assert.deepStrictEqual(room(4600), [[74, 54], 100]);
});

check('кухня: «i» у обеденного стола — его столешница в карточке; «i» у курсора, карточка по клику, цена, варианты', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  // the dining table: its top's decor in the card
  const table = p.run(`(f=>{const m=f.appl.children.filter(o=>{const i=infoOf(o);return i&&i.title==='Обеденный стол';});return [m.length, infoOf(m[0]).lines];})(tt.fur())`);
  assert.strictEqual(table[0], 5, 'its top and four legs');
  // the room by its long sides: from the worktop's edge (600) to the display cabinet's front (4600 − 100 − 1550 − 370 = 2580) less the table, 1280: 740 and 540
  assert.deepStrictEqual(table[1], ['130 × 70 см, высота 75 см, торцом к левой стене.', 'Столешница 30 мм — Дуб Каселла натуральный H1385 ST40, как у кухни.', 'Четыре стальные ножки 40 × 40 мм.',
    'Свободно по бокам: 74 см до столешницы кухни, 54 см до витрины.']);
  // a longer kitchen: the display cabinet goes with the window wall, the table splits the room again, the card follows
  p.run('showView("plan")'); p.fly(); slide(p, 'kL', 5000); p.run('showView("kitchen")'); p.fly();
  assert.strictEqual(p.run(`(f=>infoOf(f.appl.children.find(o=>{const i=infoOf(o);return i&&i.title==='Обеденный стол';})).lines[3])(tt.fur())`),
    'Свободно по бокам: 94 см до столешницы кухни, 74 см до витрины.');
  // the «i» by the cursor, its card on a click; Esc closes it
  const dot = p.document.getElementById('itemDot'), card = p.document.getElementById('itemCard');
  assert.deepStrictEqual([dot.hidden, card.hidden], [true, true]);
  p.run('showItemDot({title:"Письменный стол HEMNES (IKEA)",lines:["a","b"]},100,200)');
  assert.deepStrictEqual([dot.hidden, dot.style.left, dot.style.top], [false, '110px', '170px']);
  p.run('itemHover({title:"Письменный стол HEMNES (IKEA)"},{clientX:150,clientY:220})');
  assert.strictEqual(p.run('itemHide'), null, 'still on the same thing: the «i» stays');
  dot.click();
  assert.deepStrictEqual([dot.hidden, card.hidden], [true, false]);
  assert.deepStrictEqual(card.children.map((c) => c.textContent), ['×', 'Письменный стол HEMNES (IKEA)', 'a', 'b']);
  p.key('keydown', 'Escape'); assert.strictEqual(card.hidden, true);
  // a thing on sale: its price and a link to the shop (in a new tab) under its lines
  p.run('showItemDot({title:"Полка",lines:["a"],price:16000,url:"https://ozon.ru/t/x",shop:"Ozon"},100,200)'); dot.click();
  // (the rows in one block under the lines: buys)
  const buys = () => card.children[card.children.length - 1], buy = buys().children[0];
  assert.deepStrictEqual([buys().className, buys().children.length], ['buys', 1], 'one thing: no total');
  assert.deepStrictEqual([buy.className, buy.children.map((c) => c.textContent), buy.children[1].href, buy.children[1].target], ['buy', ['16\u00a0000 ₽', 'Ozon'], 'https://ozon.ru/t/x', '_blank']);
  assert.strictEqual(card.children.some((c) => c.className === 'next'), false, 'no variants: no link to the next one');
  p.key('keydown', 'Escape');
  // several things bought: a row each, the total under them (no link: the block's grid keeps its price under theirs)
  p.run('showItemDot({title:"Шкаф",lines:["a"],shop:"Ozon",buy:[{name:"A",price:5500,url:"https://ozon.ru/t/a"},{name:"B",n:9,price:750,url:"https://ozon.ru/t/b"}]},100,200)'); dot.click();
  assert.deepStrictEqual(buys().children.map((c) => [c.className, c.children.map((x) => x.textContent)]), [
    ['buy', ['A', '5\u00a0500 ₽', 'Ozon']], ['buy more', ['B', '9 × 750 ₽', 'Ozon']], ['buy total', ['Итого', '12\u00a0250 ₽']]]);
  p.key('keydown', 'Escape');
  // a thing with variants: a line under the others — which of how many, a link to the next one; it turns the card to it
  p.run('showItemDot({title:"A",lines:["a"],variant:[1,2],next:()=>({title:"B",lines:["b"],variant:[2,2],next:()=>({title:"A"})})},100,200)'); dot.click();
  const line = () => card.children.find((c) => c.className === 'next'), h3 = () => card.children.find((c) => c.tagName === 'H3').textContent;
  assert.deepStrictEqual([h3(), line().children.map((c) => c.textContent)], ['A', ['1/2', 'Следующий вариант →']]);
  line().children[1].click();
  assert.deepStrictEqual([card.hidden, h3(), line().children.map((c) => c.textContent)], [false, 'B', ['2/2', 'Следующий вариант →']]);
  p.key('keydown', 'Escape');
  // another view takes the «i» away
  p.run('showItemDot({title:"x"},10,10)'); p.run('showView("plan")'); p.tick();
  assert.strictEqual(dot.hidden, true);
});

check('кухня: на сенсорном экране «i» по тапу — у предмета с карточкой, не у двери; поднятый палец его не убирает, сдвиг пальца — не тап', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const c = p.document.getElementById('c'), dot = p.document.getElementById('itemDot'), card = p.document.getElementById('itemCard');
  // what is under the finger: the dining table's top (no raycasts in Node)
  p.run(() => { hitAt = () => ({ object: tt.fur().appl.children.find((o) => { const i = infoOf(o); return i && i.title === 'Обеденный стол'; }) }); });
  const tap = (type, x1 = 120) => {
    c.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 200, button: 0, pointerType: type });
    c.dispatch('pointerup', { pointerId: 1, clientX: x1, clientY: 200, button: 0, pointerType: type });
    c.dispatch('pointerleave', { pointerId: 1, pointerType: type });
  };
  tap('mouse', 100); assert.strictEqual(dot.hidden, true, 'the mouse: the «i» comes when the cursor rests, not on a click');
  tap('touch', 100); assert.deepStrictEqual([dot.hidden, dot.title, dot.style.left, dot.style.top], [false, 'Обеденный стол', '110px', '170px']);
  p.tick(60); assert.strictEqual(dot.hidden, false, 'the finger lifted: the «i» stays');
  dot.click(); assert.deepStrictEqual([dot.hidden, card.hidden], [true, false]);
  tap('touch'); assert.deepStrictEqual([dot.hidden, card.hidden], [true, true], 'a drag: the card closes, no «i»');
  // a door under the finger: it opens, no «i»
  p.run(() => { hitAt = () => ({ object: doors[0].g }); });
  const a0 = p.run(() => doors[0].t);
  tap('touch', 100); assert.deepStrictEqual([dot.hidden, p.run(() => doors[0].t) !== a0], [true, true]);
});
