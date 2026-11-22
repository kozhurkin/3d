// угловой шкаф OZON, его задняя стенка у дивана, антресоли (src/js/rooms/living/wardrobe.js)
const { runPage, PAGES, check, slide, assert } = require('../harness');

check('living: угловой шкаф OZON 1364 × 964 у дивана — ножка вдоль подлокотника, дверь к стене кухни; вдоль правой стены дверь углового и доп. секции; высота 2200; три двери открываются', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const wr = () => p.run(`(f=>{const gs=tt.items("wardrobe");
    const box=g=>tt.box(tt.parts(g,q=>q.x1>q.x0),"xzy");
    const ds=tt.doors(gs);
    return {groups:gs.length,boxes:gs.map(box),title:infoOf(gs[0].children[0]).title,
      doors:ds.map(x=>{const q=x.g.children[0].userData.part;return [q.name,q.pivot.x,q.pivot.z,q.pivot.s,x.t];})};})(tt.fur())`);
  let r = wr();
  // kitchen axes: the right wall at 3250, the sofa's end toward the kitchen wall at 4600 − 150 − 2060 = 2390; the leg 950 out and 500
  // along it, the run along the wall 500 deep up to 2390 − 1364 = 1026 (its stile reaches 16 into the leg's door plane)
  assert.strictEqual(r.groups, 2, 'the leg and the run along the wall: the walk is stopped by its L');
  assert.deepStrictEqual(r.boxes, [[2286, 3250, 1890, 2390, 0, 2200], [2750, 3250, 1026, 1906, 0, 2200]]);
  assert.strictEqual(r.title, 'Угловой шкаф «Уютная логика» (OZON)');
  // one card for the whole wardrobe (any of its parts): a row for the corner unit (12000) and one for the add-on (5500) with their Ozon links (the total under them: engine.js);
  // «next» paints it grey and back
  const wc = () => p.run(`(f=>{const gs=tt.items("wardrobe");
    const ad=tt.find(gs[1],o=>o.userData&&o.userData.part&&o.userData.part.name==='Дверь доп. секции');
    const ic=infoOf(gs[0].children[0]),ia=infoOf(ad);
    const cl=o=>clickOf({object:o});
    return [ic.buy.map(b=>[b.name,b.price,b.url,b.shop||ic.shop]),ia.title===ic.title,ic.variant.join('/'),
      cl(gs[0].children[0])===cl(gs[1].children[0])&&cl(tt.find(gs[0],o=>o.userData&&o.userData.mirror===true))===null,ic.lines[0],ic.lines.length];})(tt.fur())`);
  const w0 = wc();
  assert.deepStrictEqual(w0, [[['Угловой 96,4 × 96,4 × 220', 12000, 'https://ozon.ru/t/8LOFiwQ', 'Ozon'], ['Доп. секция 40 × 50 × 220', 5500, 'https://ozon.ru/t/BSIni7B', 'Ozon']],
    true, '1/4', true, 'Цвет: Белый.', 4]);
  // its panels click alike (not the mirror on it: a thing of its own, no click); «next» paints it grey, a rebuild keeps the colour,
  // a click white again with the second add-on section (the next check), two more back to the first
  const g0 = 'tt.item("wardrobe")';
  const col = () => { const w = wc(); return [w[2], w[4]]; };
  p.run(`infoOf(${g0}.children[0]).next()`);
  assert.deepStrictEqual(col(), ['2/4', 'Цвет: Серый.']);
  const bW = p.run('A.bW'); slide(p, 'bW', bW + 200); p.tick();
  assert.deepStrictEqual(col(), ['2/4', 'Цвет: Серый.'], 'through a rebuild');
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
  const inside = p.run(`(f=>{const gs=tt.items("wardrobe");
    const ps=g=>tt.parts(g,q=>q.x1>q.x0);
    const sh=(g,re)=>ps(g).filter(q=>re.test(q.name)).map(q=>[q.y0,q.x0,q.x1,q.z0,q.z1]);
    const ext=g=>ps(g).filter(q=>/^(Планка|Дверь) углового/.test(q.name)).map(q=>[q.name,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]);
    const car=(g,re)=>ps(g).filter(q=>re.test(q.name)&&!/^(Полка|Дверь|Планка)/.test(q.name)).map(q=>[q.name,q.mat,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]);
    return {stile:ext(gs[0]).concat(ext(gs[1])),left:sh(gs[1],/^Полка углового шкафа — слева/),addOn:sh(gs[1],/^Полка доп. секции/),right:sh(gs[0],/^Полка углового шкафа — справа/),leftInLeg:sh(gs[0],/слева/).length,
      carL:car(gs[1],/углового шкафа — слева/),carR:car(gs[0],/углового шкафа — справа/),rightInRun:sh(gs[1],/справа/).length,
      rods:gs[0].children.filter(o=>o.userData.rod===true).map(r=>[tt.mm(r.position.x),tt.mm(r.position.y),tt.mm(r.position.z),+(r.geometry.args[2]*1000).toFixed(0)]),
      rodsElse:gs[1].children.filter(o=>o.userData.rod===true).length};})(tt.fur())`);
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
  const end = p.run(`(f=>{const g=tt.items("wardrobe")[0],by=k=>g.children.find(o=>o.userData[k]===true),mg=by('mirror'),hg=by('hanger');
    const box=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.y-sy/2,p.y+sy/2,p.z-sz/2,p.z+sz/2].map(v=>tt.mm(v));};
    const ext=bs=>[0,1,2,3,4,5].map(i=>(i%2?Math.max:Math.min)(...bs.map(q=>q[i])));
    const at=o=>[o.position.x,o.position.y,o.position.z].map(v=>Math.round(v*1e4)/10);   // to 0.1 mm: the balls may sit on a half mm
    const balls=hg.children.filter(o=>o.userData.ball===true);
    return {frame:ext(mg.children.map(box)),glass:box(mg.children.find(o=>o.userData.glass===true)),bar:box(hg.children.find(o=>o.userData.bar===true)),
      balls:balls.map(o=>[...at(o),Math.round(o.geometry.args[0]*2000)]),wood:balls[0].material!==hg.children[0].material,
      dark:new Set(mg.children.filter(o=>o.userData.glass!==true).concat(hg.children.filter(o=>o.userData.ball!==true)).map(o=>o.material)).size,card:infoOf(mg.children[0]).lines[0],
      titles:[infoOf(mg.children[0]).title,infoOf(hg.children[0]).title,infoOf(balls[0]).title]};})(tt.fur())`);
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
  assert.deepStrictEqual(p.run(`tt.fur().doors.filter(x=>x.g.parent.userData.wardrobe===true).map(x=>x.g.children[0].userData.part).map(q=>[q.y0,q.y1])`), [[72, 2198], [72, 2198], [72, 2198]]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(wr().doors.every((d) => d[4] === 0), 'the kitchen\'s fronts leave them');
});

check('living: угловой шкаф — по клику вторая доп. секция 400 на торце ножки (4 варианта: два цвета без неё и с ней), зеркало и вешалка на её торце', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const g0 = 'tt.item("wardrobe")';
  const click = () => p.run(`clickOf({object:${g0}.children[0]})()`);
  const wr = () => p.run(`(f=>{const gs=tt.items("wardrobe");
    const ps=g=>tt.parts(g,q=>q.x1>q.x0);
    const box=g=>{const q=ps(g);return tt.box(q,"xz");};
    const by=k=>gs[0].children.find(o=>o.userData[k]===true);
    const bx=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.z-sz/2,p.z+sz/2].map(v=>tt.mm(v));};
    const ext=bs=>[0,1,2,3].map(i=>(i%2?Math.max:Math.min)(...bs.map(q=>q[i])));
    const ic=infoOf(gs[0].children[0]);
    return {boxes:gs.map(box),variant:ic.variant.join('/'),lines:ic.lines,buy:ic.buy.map(b=>[b.name,b.n||1,b.price]),
      end:ps(gs[0]).filter(q=>/на торце/.test(q.name)).map(q=>[q.name,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]),inRun:ps(gs[1]).filter(q=>/на торце/.test(q.name)).length,
      doors:tt.doors(gs).map(x=>{const q=x.g.children[0].userData.part;return [q.name,q.pivot.x,q.pivot.z,q.pivot.s];}),
      mirror:ext(by('mirror').children.map(bx)),bar:bx(by('hanger').children.find(o=>o.userData.bar===true)),
      cards:[infoOf(by('mirror').children[0]).lines[1],infoOf(by('hanger').children[0]).lines[1]],
      foot:living.foot().filter(r=>r[1]===3250&&r[3]===2390&&r[2]===1890)};})(tt.fur())`);
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
    ...[493, 916, 1338, 1761].map((y) => ['Полка доп. секции — на торце', 1902, 2270, y, y + 16].slice(0, 3).concat([1926, 2386, y, y + 16])),
    ['Дверь доп. секции — на торце', 1887, 2285, 1890, 1906, 72, 2198],
    // its back at the sofa last: built with the other backs there, their own materials and click
    ['Задняя стенка доп. секции — на торце', 1888, 2284, 2386, 2390, 70, 2198]]);
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
  // the card: two add-on sections, the second product row ×2 (no sum in the lines)
  assert.deepStrictEqual([r.lines[2], r.lines[3], r.lines.length], ['Угловой 96,4 × 96,4 см и две доп. секции 40 × 50 см — вдоль стены и на торце, высота 220 см, глубина 50 см.',
    'В угловом слева четыре полки, справа — полка и две штанги для вешалок; в доп. секциях по четыре полки.', 4]);
  assert.deepStrictEqual(r.buy, [['Угловой 96,4 × 96,4 × 220', 1, 12000], ['Доп. секция 40 × 50 × 220', 2, 5500]]);
  // «next»: grey with it; through a rebuild; a click: back to white without it
  p.run(`infoOf(${g0}.children[0]).next()`);
  r = wr(); assert.deepStrictEqual([r.variant, r.lines[0], r.boxes[0]], ['4/4', 'Цвет: Серый.', [1886, 3250, 1890, 2390]]);
  const bW = p.run('A.bW'); slide(p, 'bW', bW + 200); p.tick();
  r = wr(); assert.deepStrictEqual([r.variant, r.lines[0], r.boxes[0][1] - r.boxes[0][0]], ['4/4', 'Цвет: Серый.', 1364], 'through a rebuild (the right wall 200 further)');
  slide(p, 'bW', bW); p.tick();
  click();
  r = wr(); assert.deepStrictEqual([r.variant, r.lines[0], r.boxes[0], r.end.length, r.mirror], ['1/4', 'Цвет: Белый.', [2286, 3250, 1890, 2390], 0, [2266, 2286, 1940, 2340]]);
});

check('living: задняя стенка шкафа к дивану — клик по ней по кругу: ХДФ, ЛДСП 16 белый, ЛДСП 16 серый, серый с панелями «Графит», белый с панелями ГРАНЬ; своя «i» с вариантом и следующим', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const g0 = 'tt.item("wardrobe")';
  const wr = () => p.run(() => {const gs=tt.items("wardrobe");
    const ps=g=>tt.meshes(g,q=>q.x1>q.x0);
    const all=gs.flatMap(ps),pt=m=>m.userData.part,bk=all.filter(m=>/^(Лист [0-9] )?[Зз]адн(яя|ей) стенк[аи] (шкафа — у дивана|углового шкафа — справа|доп. секции — на торце)/.test(pt(m).name));
    const body=gs[0].children[0],ic=infoOf(body);
    return {backs:bk.map(m=>{const q=pt(m);return [q.name,q.mat,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1];}),
      leg:all.map(pt).filter(q=>/^(Боковина|Крыша|Дно|Полка) углового шкафа — справа/.test(q.name)).map(q=>q.z1),
      side:all.map(pt).filter(q=>/^Боковина углового шкафа — справа/.test(q.name)).map(q=>q.z1-q.z0),
      boxes:gs.map(g=>{const q=ps(g).map(pt);return tt.box(q,"z");}),
      doors:tt.doors(gs).map(x=>x.g.children[0].userData.part.pivot.z),
      rack:infoOf(tt.item("rack").children[0]).lines[4].match(/[0-9,]+ см/)[0],
      foot:living.foot().filter(r=>r[1]===3250&&r[0]===2286),
      mirror:(m=>{const z=m.children.map(o=>[o.position.z-o.geometry.args[2]/2,o.position.z+o.geometry.args[2]/2]);return [Math.round(Math.min(...z.map(a=>a[0]))*1000),Math.round(Math.max(...z.map(a=>a[1]))*1000)];})(gs[0].children.find(o=>o.userData.mirror===true)),
      rods:gs[0].children.filter(o=>o.userData.rod===true).map(r=>tt.mm(r.position.z)),
      own:bk.every(m=>pt(m).sofaBack===true&&m.material!==body.material&&clickOf({object:m})===clickOf({object:bk[0]})&&clickOf({object:m})!==clickOf({object:body})
        &&infoOf(m).title==='Задняя стенка шкафа со стороны дивана'&&ic.title==='Угловой шкаф «Уютная логика» (OZON)'),
      // the wardrobe's colour, the backs' first line
      lines:[ic.lines[0],infoOf(bk[0]).lines[0]],
      card:(i=>[i.lines.slice(1),i.price,i.url,i.shop,i.variant.join('/')])(infoOf(bk[0])),
      buy:(i=>i.buy&&i.buy.map(b=>[b.name,b.n||1,b.price,b.url]))(infoOf(bk[0])),
      // the slatted panels: their backing pieces [x0, x1, z0, z1, y0, y1], the slats' count, first and last [x0, x1, z0, z1]; their click and card the backs'
      sv:(q=>{if(!q)return null;const bx=o=>{const [sx,sy,sz]=o.geometry.args,p=o.position;return [p.x-sx/2,p.x+sx/2,p.z-sz/2,p.z+sz/2,p.y-sy/2,p.y+sy/2].map(v=>Math.round(tt.mm(v)*10)/10);};
        const ms=q.children,own=ms.every(m=>clickOf({object:m})===clickOf({object:bk[0]})&&infoOf(m).title===infoOf(bk[0]).title);
        // ГРАНЬ: the strips [which, profile], the modules' profiles (kitchen x, z) — the first one's, the last one's
        const strips=ms.filter(m=>m.userData.strip==='start'||m.userData.strip==='finish'),pr=ms.filter(m=>m.userData.module===true).map(m=>m.userData.profile);
        if(pr.length)return {strips:strips.map(m=>[m.userData.strip,m.userData.profile]),n:pr.length,first:pr[0],last:pr[pr.length-1],own};
        const base=ms.filter(m=>m.material===ms[0].material),sl=ms.filter(m=>m.material!==ms[0].material).map(bx).sort((a,b)=>a[0]-b[0]);
        return {base:base.map(bx),n:sl.length,ends:[sl[0].slice(0,4),sl[sl.length-1].slice(0,4)],own};})(gs[0].children.find(o=>o.userData.slats===true)),
      ward:ic.lines.some(l=>/Задн/.test(l))};});
  const backClick = () => p.run(() => { clickOf({ object: tt.meshes(tt.item('wardrobe'), (q) => q.sofaBack === true)[0] })(); return 0; });
  const next = () => p.run(() => { infoOf(tt.meshes(tt.item('wardrobe'), (q) => q.sofaBack === true)[0]).next(); return 0; });
  const k = 'Нажатие на стенку — следующий вариант.';
  // HDF (as bought): two sheets over the leg's rear, the carcass 4 short of the sofa's end (2390); a click on them is theirs, not the wardrobe's
  let r = wr();
  assert.deepStrictEqual(r.backs.map((q) => q.slice(0, 2)), [['Лист 1 задней стенки углового шкафа — справа', 'back'], ['Лист 2 задней стенки углового шкафа — справа', 'back']]);
  assert.deepStrictEqual([new Set(r.leg), r.side, r.rods, r.own, r.ward], [new Set([2386]), [480, 480], [2146, 2146], true, false]);
  assert.deepStrictEqual([r.boxes, r.doors, r.rack, r.foot, r.mirror], [[[1890, 2390], [1026, 1906]], [1890, 1427, 1027], '102,6 см', [[2286, 3250, 1890, 2390]], [1940, 2340]]);
  assert.deepStrictEqual([r.lines, r.card], [['Цвет: Белый.', 'ХДФ 4 мм, из комплекта шкафа.'], [[k], null, null, null, '1/6']]);
  assert.strictEqual(r.sv, null);
  // a click: LDSP 16 white over the leg's rear, floor to top, in two sheets of 480 (an add-on section's sides) edge to edge from its end, 4 short of the wall;
  // the carcasses as deep (480), so the wardrobe 12 more: its back's outer face still at the sofa (2390), all the rest 12 toward the kitchen wall — its doors,
  // the run along the wall, the walk's stop, the mirror in the middle of the leg's end; the racks' room 12 less
  backClick();
  r = wr();
  assert.deepStrictEqual(r.backs, [
    ['Лист 1 задней стенки шкафа — у дивана', 'carcass', 2286, 2766, 2374, 2390, 0, 2200],
    ['Лист 2 задней стенки шкафа — у дивана', 'carcass', 2766, 3246, 2374, 2390, 0, 2200]]);
  // their «i»: cut from one more add-on section — its sides; it in a row with its Ozon link and price; the wardrobe's card says nothing of them
  assert.deepStrictEqual([r.lines, r.card, r.buy, r.ward], [['Цвет: Белый.', 'ЛДСП 16 мм, Белый — из боковин ещё одной доп. секции.'], [[k], null, null, 'Ozon', '2/6'],
    [['Доп. секция 40 × 50 × 220', 1, 5500, 'https://ozon.ru/t/BSIni7B']], false]);
  assert.deepStrictEqual([new Set(r.leg), r.side, r.rods, r.own], [new Set([2374]), [480, 480], [2134, 2134], true]);
  assert.deepStrictEqual([r.boxes, r.doors, r.rack, r.foot, r.mirror], [[[1878, 2390], [1014, 1894]], [1878, 1415, 1015], '101,4 см', [[2286, 3250, 1878, 2390]], [1934, 2334]]);
  // again: grey, the carcass stays white; through a rebuild
  backClick();
  r = wr();
  assert.deepStrictEqual([r.lines, r.card[4], r.sv], [['Цвет: Белый.', 'ЛДСП 16 мм, Серый — из боковин ещё одной доп. секции.'], '3/6', null]);
  const bW = p.run('A.bW'); slide(p, 'bW', bW + 200); p.tick(); slide(p, 'bW', bW); p.tick();
  assert.deepStrictEqual(wr().lines[1], 'ЛДСП 16 мм, Серый — из боковин ещё одной доп. секции.', 'through a rebuild');
  // the card's «next»: the slatted panels over the grey LDSP, 9 thick, their outer face at the sofa (2390): the wardrobe 9 more toward the kitchen wall
  // (21 in all), the racks' room 9 less. In a row from the leg's end, 600 wide, the last cut (360), 4 short of the wall, floor to top: a backing 3, 16 slats
  // 25 wide, 12.5 apart over it — the first flush with the panel's edge at the leg's end, the backing 12.5 past the last; 16 + 10 (the last one cut to 22.5).
  // Their card: the LDSP's lines, theirs, a row each with the section
  next();
  r = wr();
  assert.deepStrictEqual(r.backs, [
    ['Лист 1 задней стенки шкафа — у дивана', 'carcass', 2286, 2766, 2365, 2381, 0, 2200],
    ['Лист 2 задней стенки шкафа — у дивана', 'carcass', 2766, 3246, 2365, 2381, 0, 2200]]);
  assert.deepStrictEqual(r.sv, {base: [[2286, 2886, 2381, 2384, 0, 2200], [2886, 3246, 2381, 2384, 0, 2200]], n: 26,
    ends: [[2286, 2311, 2384, 2390], [3224, 3246, 2384, 2390]], own: true});
  assert.deepStrictEqual([new Set(r.leg), r.side, r.rods], [new Set([2365]), [480, 480], [2125, 2125]]);
  assert.deepStrictEqual([r.boxes, r.doors, r.rack, r.foot, r.mirror], [[[1869, 2381], [1005, 1885]], [1869, 1406, 1006], '100,5 см', [[2286, 3250, 1869, 2390]], [1930, 2330]]);
  assert.deepStrictEqual([r.lines, r.card], [['Цвет: Белый.', 'ЛДСП 16 мм, Серый — из боковин ещё одной доп. секции.'], [[
    'Поверх — реечные панели на всю высоту шкафа, последняя обрезана по ширине.', k], null, null, 'Ozon', '4/6']]);
  assert.deepStrictEqual(r.buy, [['Доп. секция 40 × 50 × 220', 1, 5500, 'https://ozon.ru/t/BSIni7B'], ['Панель САВАШ «Графит» 2780 × 600 × 9', 2, 2600, 'https://ozon.ru/t/bmatRZn']]);
  // «next»: white LDSP with the modular panels ГРАНЬ, 16 thick, their outer face at the sofa: the wardrobe 16 more toward the kitchen wall (28 in all),
  // the racks' room 16 less. One run of whole facets 26.5 wide, each from 16 down to 10 at the step up to the next one, high on the wall's side: from the
  // leg's end the finishing strip's one, whole modules' four each (106 of their 116 show: the tongue under the piece next to it), the last one cut to two
  // (53), the starter strip's one — 36 facets, 954: 6 short of the LDSP's end (10 from the wall)
  next();
  r = wr();
  assert.deepStrictEqual(r.backs, [
    ['Лист 1 задней стенки шкафа — у дивана', 'carcass', 2286, 2766, 2358, 2374, 0, 2200],
    ['Лист 2 задней стенки шкафа — у дивана', 'carcass', 2766, 3246, 2358, 2374, 0, 2200]]);
  assert.deepStrictEqual(r.sv, {strips: [['finish', [[2312.5, 2374], [2286, 2374], [2286, 2384], [2312.5, 2390]]],
    ['start', [[3240, 2374], [3213.5, 2374], [3213.5, 2384], [3240, 2390]]]], n: 9,
    first: [[2418.5, 2374], [2312.5, 2374], [2312.5, 2384], [2339, 2390], [2339, 2384], [2365.5, 2390], [2365.5, 2384], [2392, 2390], [2392, 2384], [2418.5, 2390]],
    last: [[3213.5, 2374], [3160.5, 2374], [3160.5, 2384], [3187, 2390], [3187, 2384], [3213.5, 2390]], own: true});
  assert.deepStrictEqual([new Set(r.leg), r.rods], [new Set([2358]), [2118, 2118]]);
  assert.deepStrictEqual([r.boxes, r.doors, r.rack, r.foot, r.mirror], [[[1862, 2374], [998, 1878]], [1862, 1399, 999], '99,8 см', [[2286, 3250, 1862, 2390]], [1926, 2326]]);
  // its card: what is bought in its rows, not in the lines
  assert.deepStrictEqual([r.lines, r.card], [['Цвет: Белый.', 'ЛДСП 16 мм, Белый — из боковин ещё одной доп. секции.'],
    [['Поверх — реечные панели на всю высоту шкафа, последняя обрезана по ширине.', k], null, null, 'Ozon', '5/6']]);
  assert.deepStrictEqual(r.buy, [['Доп. секция 40 × 50 × 220', 1, 5500, 'https://ozon.ru/t/BSIni7B'], ['Панель ГРАНЬ САВАШ «Белый» 2800 × 116 × 16', 9, 750, 'https://ozon.ru/t/QGoXSss'],
    ['Стартовая планка ГРАНЬ САВАШ «Белый» 2800 × 26,5 × 16', 1, 150, 'https://ozon.ru/t/sZYUjbm'], ['Финишная планка ГРАНЬ САВАШ «Белый» 2800 × 36,5 × 16', 1, 150, 'https://ozon.ru/t/JHTewdc']]);
  // «next»: white LDSP with the fluted modules РИФ «Кашемир Светлый», 16 thick as ГРАНЬ (the wardrobe as with it): from the leg's end the finishing strip
  // (27.5 of its 37.5 show: a flat 1 at its full thickness, one flute), whole modules (106 of their 116 show), the last one cut to three flutes (79.5), no
  // starter strip — 955: 5 short of the LDSP's end; each flute 26.5 wide, a concave arc 6 deep between crests at its full thickness
  next();
  r = wr();
  const fs = r.sv.strips[0][1];
  assert.deepStrictEqual([r.sv.strips.length, r.sv.strips[0][0], fs.slice(0, 4), fs[fs.length - 1], fs.length], [1, 'finish',
    [[2313.5, 2374], [2286, 2374], [2286, 2390], [2287, 2390]], [2313.5, 2390], 3 + 12 + 1]);
  assert.deepStrictEqual([r.sv.n, r.sv.first.slice(0, 3), r.sv.first[r.sv.first.length - 1], r.sv.last.slice(0, 2), r.sv.own],
    [9, [[2419.5, 2374], [2313.5, 2374], [2313.5, 2390]], [2419.5, 2390], [[3241, 2374], [3161.5, 2374]], true]);
  const fl = r.sv.first.slice(2), bottom = (x) => fl.find((q) => q[0] === x)[1];
  assert.deepStrictEqual([fl.length, bottom(2326.8), bottom(2340), bottom(2353.3)], [4 * 12 + 1, 2384, 2390, 2384]);
  assert.deepStrictEqual([new Set(r.leg), r.boxes, r.card], [new Set([2358]), [[1862, 2374], [998, 1878]],
    [['Поверх — реечные панели на всю высоту шкафа, последняя обрезана по ширине.', k], null, null, 'Ozon', '6/6']]);
  // its LDSP the wardrobe's colour: white, and grey after a click on the wardrobe — back to white (three more: its forms)
  assert.strictEqual(r.lines[1], 'ЛДСП 16 мм, Белый (в цвет шкафа) — из боковин ещё одной доп. секции.');
  p.run(`clickOf({object:${g0}.children[0]})()`);
  r = wr();
  assert.deepStrictEqual(r.lines, ['Цвет: Серый.', 'ЛДСП 16 мм, Серый (в цвет шкафа) — из боковин ещё одной доп. секции.']);
  for (let j = 0; j < 3; j++) p.run(`clickOf({object:${g0}.children[0]})()`);
  r = wr();
  assert.deepStrictEqual([r.lines, r.sv.n], [['Цвет: Белый.', 'ЛДСП 16 мм, Белый (в цвет шкафа) — из боковин ещё одной доп. секции.'], 9]);
  assert.deepStrictEqual(r.buy, [['Доп. секция 40 × 50 × 220', 1, 5500, 'https://ozon.ru/t/BSIni7B'],
    ['Реечная панель САВАШ РИФ «Кашемир Светлый» 2800 × 116 × 16', 9, 650, 'https://ozon.ru/t/7EiTlVS'],
    ['Финишная планка САВАШ РИФ «Кашемир Светлый» 2800 × 37,5 × 16', 1, 150, 'https://ozon.ru/t/ykncNDs']]);
  // HDF again, the wardrobe as it was; and white LDSP
  next();
  r = wr();
  assert.deepStrictEqual([r.backs.map((q) => q[1]), r.boxes, r.card[4], r.sv], [['back', 'back'], [[1890, 2390], [1026, 1906]], '1/6', null]);
  next();
  assert.deepStrictEqual(wr().lines[1], 'ЛДСП 16 мм, Белый — из боковин ещё одной доп. секции.');
  // the carcass grey with the add-on section on the leg's end: the backs' row over its rear too; the carcass's click leaves them white
  p.run(`clickOf({object:${g0}.children[0]})()`); p.run(`clickOf({object:${g0}.children[0]})()`); p.run(`clickOf({object:${g0}.children[0]})()`);
  r = wr();
  // one row over the leg's whole rear, the end section's too (1364: flush with its end, 4 short of the wall): the two sides from its end, the door (400, 2126 high, its
  // top level with theirs) against the wall — its shortfall behind the sofa; the first side over the joint of the leg and the end section (2286)
  assert.deepStrictEqual(r.backs, [
    ['Лист 1 задней стенки шкафа — у дивана', 'carcass', 1886, 2366, 2374, 2390, 0, 2200],
    ['Лист 2 задней стенки шкафа — у дивана', 'carcass', 2366, 2846, 2374, 2390, 0, 2200],
    ['Лист 3 задней стенки шкафа — у дивана', 'carcass', 2846, 3246, 2374, 2390, 74, 2200]]);
  assert.deepStrictEqual(r.card[0], ['Фасад — у стены, он ниже боковин: недостача внизу за диваном.', k]);
  assert.deepStrictEqual([r.own, r.lines], [true, ['Цвет: Серый.', 'ЛДСП 16 мм, Белый — из боковин и фасада ещё одной доп. секции.']]);
  // two clicks more: «Графит» over the leg's whole rear, the end section's too (1360: 600, 600, the last cut to 160; 16 + 16 + 5 slats) — three of them
  backClick(); backClick();
  r = wr();
  assert.deepStrictEqual([r.sv.base.map((q) => q.slice(0, 2)), r.sv.n, r.sv.own], [[[1886, 2486], [2486, 3086], [3086, 3246]], 37, true]);
  assert.deepStrictEqual([r.card[0][1], r.card[0].length, r.buy[1][1]], ['Поверх — реечные панели на всю высоту шкафа, последняя обрезана по ширине.', 3, 3]);
  // one more: ГРАНЬ over the same (1360: 51 facets — the strips, twelve modules, the last cut to one; 8.5 short of the LDSP's end) — thirteen of them
  backClick();
  r = wr();
  assert.deepStrictEqual([r.sv.strips, r.sv.n, r.sv.last, r.card[0][1], r.card[0].length, r.buy[1][1]], [
    [['finish', [[1912.5, 2374], [1886, 2374], [1886, 2384], [1912.5, 2390]]], ['start', [[3237.5, 2374], [3211, 2374], [3211, 2384], [3237.5, 2390]]]], 13,
    [[3211, 2374], [3184.5, 2374], [3184.5, 2384], [3211, 2390]],
    'Поверх — реечные панели на всю высоту шкафа, последняя обрезана по ширине.', 3, 13]);
  // one more: РИФ over the same (1360: the strip, 50 flutes — twelve modules, the last cut to two, 53; 7.5 short of the LDSP's end) — thirteen of them
  backClick();
  r = wr();
  assert.deepStrictEqual([r.sv.n, r.sv.last.slice(0, 2), r.sv.last[r.sv.last.length - 1], r.card[0][1], r.buy[1][1]],
    [13, [[3238.5, 2374], [3185.5, 2374]], [3238.5, 2390], 'Поверх — реечные панели на всю высоту шкафа, последняя обрезана по ширине.', 13]);
  assert.strictEqual(r.lines[1], 'ЛДСП 16 мм, Серый (в цвет шкафа) — из боковин и фасада ещё одной доп. секции.');
  // and one more: HDF — the leg's two sheets and the end section's, all theirs
  backClick();
  r = wr();
  assert.deepStrictEqual([r.backs.map((q) => q[1]), r.own, r.lines], [['back', 'back', 'back'], true, ['Цвет: Серый.', 'ХДФ 4 мм, из комплекта шкафа.']]);
  assert.strictEqual(r.sv, null);
});

check('living: антресоль OZON над диваном — две секции по 1000, глубина 500, от 1700 до 2200 (вровень со шкафом), от шкафа к окну; четыре двери открываются', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const mz = () => p.run(`(f=>{const g=tt.item("mezzanine"),ps=tt.parts(g,q=>q.x1>q.x0);
    return {box:tt.box(ps,"xzy"),
      title:infoOf(g.children[0]).title,card:(i=>[i.buy.map(b=>[b.name,b.n,b.price,b.url,b.shop||i.shop]),i.lines[2],i.lines.length])(infoOf(g.children[0])),
      color:(i=>[i.variant.join('/'),i.lines[0]])(infoOf(g.children[0])),click:clickOf({object:g.children[0]})!==clickOf({object:tt.item("wardrobe").children[0]}),
      sec1:ps.filter(q=>/секция 1$/.test(q.name)).map(q=>[q.name,q.mat,q.x0,q.x1,q.z0,q.z1,q.y0,q.y1]),
      ward:infoOf(tt.item("wardrobe").children[0]).lines[0],doors:tt.doors(g).map(x=>{const q=x.g.children[0].userData.part;return [q.z0,q.z1,q.pivot.z,q.pivot.s,x.t];})};})(tt.fur())`);
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
  // its card: two sections alike, each OZON's 100 × 50 × 50 at 3500, one row for them with its link (the total under it: engine.js)
  assert.deepStrictEqual(r.card, [[['Антресоль 100 × 50 × 50', 2, 3500, 'https://ozon.ru/t/ivoD7B6', 'Ozon']], '2 секции по 100 см, глубина 50 см, высота 50 см; по две двери в каждой.', 4]);
  // its colour, white at first, apart from the wardrobe's: its «next» paints it grey, not the wardrobe; the wardrobe's click paints only that;
  // a click on it white again
  assert.deepStrictEqual([r.color, r.click], [['1/2', 'Цвет: Белый.'], true]);
  p.run(`infoOf(tt.item("mezzanine").children[0]).next()`);
  r = mz(); assert.deepStrictEqual([r.color, r.ward], [['2/2', 'Цвет: Серый.'], 'Цвет: Белый.']);
  p.run(`clickOf({object:tt.item("wardrobe").children[0]})()`);
  r = mz(); assert.deepStrictEqual([r.color, r.ward], [['2/2', 'Цвет: Серый.'], 'Цвет: Серый.']);
  p.run(`clickOf({object:tt.item("mezzanine").children[0]})()`);
  r = mz(); assert.deepStrictEqual([r.color, r.ward], [['1/2', 'Цвет: Белый.'], 'Цвет: Серый.']);
  // two doors a section, hinged at its ends, into the room
  assert.deepStrictEqual(r.doors, [[2391, 2889, 2391, -1, 0], [2891, 3389, 3389, 1, 0], [3391, 3889, 3391, -1, 0], [3891, 4389, 4389, 1, 0]]);
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click();
  assert.ok(mz().doors.every((d) => d[4] === 0), 'the kitchen\'s fronts leave them');
});
