// металлические стеллажи (src/js/rooms/living/rack.js)
const { runPage, PAGES, check, slide, near, assert } = require('../harness');

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
