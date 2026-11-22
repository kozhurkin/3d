// светильник над обеденным столом (src/js/rooms/kitchen/pendant.js)
const { runPage, PAGES, check, slide, assert } = require('../harness');

check('кухня: светильник над серединой обеденного стола — низ абажура в 800 над столешницей (MISTERHULT — в 700), шнур до чашки на потолке; сначала BLÅSVERK, нажатие меняет его по кругу: BUNKEFLO → MISTERHULT → BLÅSVERK', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const q = 'tt.item("pendant")';
  // the model, where it hangs, the cord's length and its bottom, the canopy's bottom (the ceiling less its height), what the card says
  const st = () => p.run(`(q=>{const r=v=>tt.mm(v),cord=q.children.find(o=>o.userData.cord===true),can=q.children.find(o=>o.userData.canopy===true);
    return [q.userData.model,r(q.position.x),r(q.position.y),r(q.position.z),r(cord.geometry.args[2]),r(cord.position.y-cord.geometry.args[2]/2),r(q.position.y+can.position.y),q.userData.walkThrough,infoOf(q.children[0]).title];})(${q})`);
  // BLÅSVERK at first, over the table's middle (650 along it, 1340 + 350 from the kitchen wall); 750 + 800; its cord from the top of its tube (180 + 280) up to the canopy (2600 − 65)
  assert.deepStrictEqual(st(), ['BLÅSVERK', 650, 1550, 1690, 525, 460, 2535, true, 'Подвесной светильник BLÅSVERK (IKEA)']);
  // the card: price and Ozon link of each, which of three, and «next» hangs the next one and gives its card
  const cd = () => p.run(`(i=>[i.price,i.url,i.shop,i.variant.join('/'),typeof i.next])(infoOf(${q}.children[0]))`);
  assert.deepStrictEqual(cd(), [3500, 'https://ozon.ru/t/GAWH6H0', 'Ozon', '1/3', 'function']);
  assert.strictEqual(p.run(`(i=>{const n=i.next();return n.title+n.price+n.variant.join('/');})(infoOf(${q}.children[0]))`), 'Подвесной светильник BUNKEFLO (IKEA)50002/3');
  assert.deepStrictEqual(cd(), [5000, 'https://ozon.ru/t/dwjZCNy', 'Ozon', '2/3', 'function']);
  p.run(`infoOf(${q}.children[0]).next()`);
  assert.deepStrictEqual(cd(), [9000, 'https://ozon.ru/t/EIG8Q2j', 'Ozon', '3/3', 'function']);
  p.run(`infoOf(${q}.children[0]).next()`);
  assert.strictEqual(st()[0], 'BLÅSVERK');
  // a click on any piece of it changes it (engine.js: clickOf); the next one, then the third, then the first again
  assert.strictEqual(p.run(() => { const q = tt.item('pendant'); return clickOf({ object: q.children[2] }) === q.userData.click; }), true);
  const click = () => p.run(`${q}.userData.click()`);
  // BUNKEFLO, 800 over the tabletop too: its cord from the top of its birch (187) up to the canopy (2600 − 48)
  click(); assert.deepStrictEqual(st(), ['BUNKEFLO', 650, 1550, 1690, 815, 187, 2552, true, 'Подвесной светильник BUNKEFLO (IKEA)']);
  // MISTERHULT, 700 over it: the cord from the socket's top (400 − 50) up to the canopy (2600 − 46)
  click(); assert.deepStrictEqual(st(), ['MISTERHULT', 650, 1450, 1690, 754, 350, 2554, true, 'Подвесной светильник MISTERHULT (IKEA)']);
  click(); assert.strictEqual(st()[0], 'BLÅSVERK');
  // the one hung stays when the kitchen is built again
  click(); slide(p, 'bW', 2050); p.tick(); assert.strictEqual(st()[0], 'BUNKEFLO');
  // the plan's highest ceiling: BLÅSVERK's cord is 1100, so it goes up (3200 − 65 − 1100 − 460); MISTERHULT's 1600 is enough
  click(); click(); slide(p, 'H', 3200); p.tick();
  assert.deepStrictEqual(st().slice(0, 7), ['BLÅSVERK', 650, 1575, 1690, 1100, 460, 3135]);
  assert.match(p.run(`infoOf(${q}.children[0]).lines.join(' ')`), /низ абажура в 83 см над столешницей/);
  click(); click(); assert.deepStrictEqual(st().slice(0, 7), ['MISTERHULT', 650, 1450, 1690, 1354, 350, 3154]);
});
