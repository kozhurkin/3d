// техника: мойка, варочная панель, холодильник (src/js/rooms/kitchen/appliances.js)
const { runPage, PAGES, check, slide, assert } = require('../harness');

check('кухня: мойка — рамка с отверстием, в нём открытая чаша на 170 вниз сквозь вырез в столешнице, дно вокруг слива; ничто не лежит поверх другого', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const sink = () => p.run(`(f=>{const w=f.model.children.find(o=>o.userData.part&&o.userData.part.name==='Столешница'),a=f.appl.children;
    const rim=a.find(o=>o.userData.sinkRim===true),bowl=a.find(o=>o.userData.sinkBowl===true),mm=v=>tt.mm(v);
    return {hole:w.userData.part.hole,grid:w.geometry.args.slice(3),ct:f.P.Ct,
      rim:[rim.geometry.kind,mm(rim.geometry.args[1].depth),mm(rim.position.x),mm(rim.position.y),mm(rim.position.z)],
      bowl:[bowl.geometry.kind,mm(bowl.geometry.args[1].depth),mm(bowl.position.y)],
      boxes:a.filter(o=>o.geometry&&o.geometry.kind==='THREE.BoxGeometry'&&mm(o.geometry.args[0])===340).length,
      steel:rim.material===bowl.material&&rim.material.metalness>=.7,
      mixer:(q=>({chrome:q.every(o=>o.material===q[0].material)&&q[0].material!==rim.material&&q[0].material.metalness>=.9,bend:q.filter(o=>o.geometry.kind==='THREE.TorusGeometry').length,
        spout:(o=>[mm(o.position.x),mm(o.position.z+o.geometry.args[2]/2*Math.sin(-o.rotation.x)),mm(o.position.y-o.geometry.args[2]/2*Math.cos(o.rotation.x))])(q[q.length-1]),
        lean:Math.round(-q[q.length-1].rotation.x*180/Math.PI),foot:mm(q[0].position.z+q[0].geometry.args[0])}))(a.filter(o=>o.userData.mixer===true))};})(tt.fur())`);
  let r = sink();
  // the sink in the middle of the first base cabinet (450): its bowl 340 × 380 round z 300, the worktop cut out under it (its top face
  // on a 3 × 3 grid, the middle cell left out)
  assert.deepStrictEqual(r.hole, [225 - 170, 225 + 170, 300 - 190, 300 + 190]);
  assert.deepStrictEqual(r.grid, [3, 1, 3]);
  // the rim 10 thick from 6 over the worktop, the bowl's walls from there to 170 under its top; no solid box for a bowl any more
  assert.deepStrictEqual(r.rim, ['THREE.ExtrudeGeometry', 10, 225, r.ct + 6, 300]);
  assert.deepStrictEqual(r.bowl, ['THREE.ExtrudeGeometry', 176, r.ct + 6]);
  assert.ok(r.steel, 'the rim and the bowl are one stainless steel');
  // the mixer chrome as the shower rack, not the sink's steel: on the worktop behind the rim (its foot clear of it, the rim from
  // 300 − 220), bent up into the arm and down into the spout; the spout over the bowl (z 110…490), in line with the sink's middle
  assert.ok(r.mixer.chrome, 'the mixer is chrome');
  assert.strictEqual(r.mixer.bend, 2, 'up into the arm, down into the spout');
  assert.ok(r.mixer.foot < 80, 'the mixer\'s foot stays off the rim');
  // its drawing: the water out 210 from the tube's axis (z 50), at 259 over the worktop
  assert.deepStrictEqual(r.mixer.spout, [225, 260, r.ct + 259]);
  assert.strictEqual(r.mixer.lean, 8, 'the spout leans out by 8°, as on the drawing');
  assert.ok(r.mixer.spout[1] > 110 && r.mixer.spout[1] < 490, 'the spout over the bowl');
  assert.strictEqual(r.boxes, 0);
  // nothing of the sink cabinet's carcass inside the bowl (z 110..490, from 170 under the worktop's top up): its front rail on edge by the front
  const inBowl = p.run(`tt.fur().current.parts.filter(q=>q.mat==='carcass'&&q.x0<395&&q.x1>55&&q.z0<490&&q.z1>110&&q.y1>${r.ct}-170&&q.y0<${r.ct}).map(q=>q.name)`);
  assert.deepStrictEqual(inBowl, []);
  // a wider sink cabinet: the sink and the cut-out move with its middle
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  r = sink(); assert.deepStrictEqual([r.hole[0], r.rim[2]], [250 - 170, 250]);
});

check('кухня: варочная панель — стекло с круглыми отверстиями, в них конфорки заподлицо; у настольной стекло вставлено в верх корпуса; поперёк и вдоль', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kq = (q) => p.document.querySelector('[data-panel="kitchen"] ' + q);
  const hob = () => p.run(`(f=>{const a=f.appl.children,mm=v=>tt.mm(v),ext=o=>[mm(o.position.x),mm(o.position.y),mm(o.position.z),mm(o.geometry.args[1].depth)];
    const gl=a.filter(o=>o.userData.hobGlass===true),bu=a.filter(o=>o.userData.burner===true),body=a.find(o=>o.userData.hobBody===true);
    return {glass:gl.map(ext),burners:bu.map(ext),shapes:bu.map(o=>o.geometry.kind),ct:f.P.Ct,body:body&&[body.geometry.args.slice(0,3).map(mm),body.geometry.args.slice(3)],
      discs:a.filter(o=>o.geometry&&o.geometry.kind==='THREE.CylinderGeometry'&&mm(o.geometry.args[0])>=75).length};})(tt.fur())`);
  // built in: 6 mm of glass on the worktop, its middle 150 left of the oven cabinet's (450 + 450 + 300 − 150 = 1050), z 60…580;
  // two burners in its holes, as deep, their tops flush with it; no disc over anything
  let r = hob(), t = r.ct + 6;
  assert.deepStrictEqual(r.glass, [[1050, t, 320, 6]]);
  assert.deepStrictEqual(r.burners, [[1050, t, 320, 6], [1050, t, 320, 6]], 'drawn round the glass\'s middle, as its holes are');
  assert.deepStrictEqual([r.shapes, r.discs, r.body], [['THREE.ExtrudeGeometry', 'THREE.ExtrudeGeometry'], 0, undefined]);
  // along the worktop: turned, 20 off the wall, in the middle of the cabinet
  const along = kq('#k-tHobAlong'); along.checked = true; along.dispatch('change'); p.tick();
  r = hob(); assert.deepStrictEqual(r.glass, [[1200, t, 170, 6]]);
  // the tabletop one: its body 290 × 57 × 490 on its feet, its top open under the glass (boxGeo's hole: a 3 × 3 grid); the glass 4 mm
  // proud of it and 6 down into it
  along.checked = false; along.dispatch('change'); kq('[data-hob="free"]').click(); p.tick();
  r = hob(); t = r.ct + 65 + 4;
  assert.deepStrictEqual([r.glass, r.burners.length, r.discs], [[[1050, t, 315, 10]], 2, 0]);
  assert.deepStrictEqual(r.body, [[290, 57, 490], [3, 1, 3]]);
});

check('кухня: дверь холодильника открывается на петлях справа, два его ящика выдвигаются, дверь духовки откидывается вниз', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const ap = () => p.run(`(f=>["fridge","fridge-d1","fridge-d2","oven"].map(k=>{const d=f.doors.find(x=>x.key===k);
    return d&&[d.axis||'y',d.s,Math.round((d.travel||0)*1000),+d.max.toFixed(2),+d.t.toFixed(2),+d.g.rotation.x.toFixed(2),+d.g.rotation.y.toFixed(2),tt.mm(d.g.position.z),d.g.parent===f.appl];}))(tt.fur())`);
  assert.deepStrictEqual(ap().map((d) => d && d.slice(0, 5)), [['y', 1, 0, 1.45, 0], ['z', 1, 380, 1.45, 0], ['z', 1, 380, 1.45, 0], ['x', 1, 0, 1.57, 0]], 'closed: the door on its hinges, two drawers, the oven door');
  assert.ok(ap().every((d) => d[8]), 'with the appliances');
  // the hinges: the fridge door turns on its front right edge (the fridge niche's right end, 10 mm in), the oven door on its lower front edge
  const piv = p.run(`(f=>{const d=k=>f.doors.find(x=>x.key===k).g.position,c=f.current;return [Math.round(d("fridge").x*1000),c.xF-10,Math.round(d("oven").y*1000),c.ovY];})(tt.fur())`);
  assert.deepStrictEqual(piv.slice(0, 2), [piv[1], piv[1]]); assert.strictEqual(piv[2], piv[3]);
  // no cabinet fronts: the kitchen's «Открыты» leaves them; a click opens each
  p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').click(); p.tick(120);
  assert.ok(ap().every((d) => d[4] === 0), 'not with the fronts');
  p.run('tt.fur().doors.filter(d=>/^(oven|fridge)/.test(d.key)).forEach(d=>d.t=d.max)'); p.tick(120);
  const r = ap();
  assert.ok(r[0][6] > 1.4, 'the fridge door swings out'); assert.ok(r[1][7] > 370 && r[2][7] > 370, 'the drawers slide out');
  assert.ok(r[3][5] > 1.5, 'the oven door lies down');
  // they keep how open they are through a rebuild
  const b1 = p.document.querySelector('[data-panel="kitchen"] [data-p="B1"]'); b1.value = '500'; b1.dispatch('input'); p.tick();
  assert.ok(ap().every((d) => d[4] === d[3]), 'still open after a rebuild');
  // the oven door closes alone
  p.run('(d=>{d.t=0;doorsChanged();})(tt.fur().doors.find(x=>x.key==="oven"))');
  assert.deepStrictEqual(ap().map((d) => d[4] === 0), [false, false, false, true]);
});
