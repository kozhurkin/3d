// стулья BERGMUND у обеденного стола (src/js/rooms/kitchen/chairs.js)
const { all, runPage, PAGES, check, slide, assert } = require('../harness');

check('кухня: четыре стула BERGMUND у стола — задвинуты, нажатие выдвигает их из-под стола; обход сквозь них проходит', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const st = () => p.run(`(f=>f.doors.filter(d=>/^chair/.test(d.key)).map(d=>{const c=d.g.parent;
    return [d.key,d.axis,tt.mm(d.travel),tt.mm(c.position.x),tt.mm(c.position.z),+c.rotation.y.toFixed(2),tt.mm(d.g.position.z),c.parent===f.appl];}))(tt.fur())`);
  // two along each long side (the kitchen wall's, the far one), 20 mm clear of the table's legs, 40 apart; the far ones turned round;
  // all pushed in at first, the seat's front 10 short of the table's middle (1690 from the kitchen wall); pulled out by 420 (the seat's front 80 past the table's edge),
  // the far ones by 360: 540 to the display cabinet, the chair 520 deep
  assert.deepStrictEqual(st(), [
    ['chair0', 'z', -420, 110, 1160, 0, 0, true], ['chair1', 'z', -420, 670, 1160, 0, 0, true],
    ['chair2', 'z', -360, 630, 2220, 3.14, 0, true], ['chair3', 'z', -360, 1190, 2220, 3.14, 0, true]]);
  const info = p.run(`(f=>{const m=tt.items("chair");return [m.length,infoOf(m[0].children[0].children[3]).title];})(tt.fur())`);
  assert.deepStrictEqual(info, [4, 'Стул BERGMUND (IKEA)']);
  // as the drawing: the seat 510 high at its front, sloping to 470 over its 410; the back to it 104°; 950 high
  const ang = p.run(`(q=>{const [st,b]=q.children.slice(4);   // after its four legs: the seat's holder, the back's
    return [tt.mm(st.position.y),tt.mm(st.position.z),+(st.rotation.x*180/Math.PI).toFixed(1),+(90-(st.rotation.x+b.rotation.x)*180/Math.PI).toFixed(1)];})(tt.fur().doors.find(d=>d.key==="chair0").g)`);
  assert.deepStrictEqual(ang, [510, 520, -5.6, 104]);
  // the cover: one dark grey matting on the seat and the back, its weave a picture and bumps
  const cov = p.run(`(q=>{const [st,b]=q.children.slice(4),s=st.children[0],k=b.children[0];
    return [s.material===k.material,!!s.material.map,!!s.material.bumpMap];})(tt.fur().doors.find(d=>d.key==="chair0").g)`);
  assert.deepStrictEqual(cov, [true, true, true]);
  // a click pulls one out, another pushes it in again
  const click = () => { p.run('(d=>{d.t=d.t!==0?0:d.max;doorsChanged();})(tt.fur().doors.find(x=>x.key==="chair1"))'); p.tick(120); };
  click(); assert.deepStrictEqual(st().map((c) => c[6]), [0, -420, 0, 0], 'pulled out');
  click(); assert.deepStrictEqual(st().map((c) => c[6]), [0, 0, 0, 0], 'pushed in again');
  p.run('(tt.fur().doors.filter(d=>d.key==="chair2"||d.key==="chair3").forEach(d=>d.t=d.max),doorsChanged())'); p.tick(120);
  // the walker crosses the row of the far chairs, pulled out (2400 from the kitchen wall, kitchen x 250…1150), without stopping
  p.run('showView("walk")'); p.fly();
  const go = () => p.run('walkSlide(-1.75,4.4,.9,0,0,1.7).map(v=>typeof v==="number"?tt.mm(v):v)');
  assert.deepStrictEqual(go().slice(0, 2), [-850, 4400], 'through the chairs');
  p.run('tt.fur().appl.children.forEach(o=>{if(o.userData.chair===true)o.userData.walkThrough=false;})');
  assert.ok(go()[0] < -850, 'they would stop it otherwise');
});

check('кухня: стулья выдвигаются не дальше своего промежутка — спинка не дальше края столешницы и витрины', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  // how far each pulls out (mm): the kitchen wall's side, the far one
  const out = (L) => { slide(p, 'kL', L); p.tick(); return p.run(`(f=>{const t=k=>Math.round(-f.doors.find(d=>d.key===k).travel*1000);return [t('chair0'),t('chair2')];})(tt.fur())`); };
  assert.deepStrictEqual(out(5000), [420, 420], '940 and 740: both the full 80 past the table\'s edge');
  assert.deepStrictEqual(out(4600), [420, 360], '740 and 540: the far one 20 past it, its back at the display cabinet');
  assert.deepStrictEqual(out(4000), [260, 60], '440 and 240: both stay under the table by 80 and 280');
});
