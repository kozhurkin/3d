// радиатор под подоконником (src/js/rooms/living/radiator.js)
const { runPage, PAGES, check, slide, assert } = require('../harness');

check('living: радиатор под подоконником — 10 белых секций, 800 × 570 × 80, по центру окна, 100 от стены, на 100 ниже подоконника; без места под ним нет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const rad = () => p.run(`(f=>{const q=tt.item("radiator"),mm=v=>tt.mm(v);
    const rd=living.foot().filter(r=>r[3]===A.kL&&r[2]===A.kL-100);
    if(!q)return {none:true,foot:rd};
    const bs=q.children.filter(o=>o.geometry.kind==='THREE.BoxGeometry').map(o=>{const [sx,sy,sz]=o.geometry.args,c=o.position;return [c.x-sx/2,c.x+sx/2,c.y-sy/2,c.y+sy/2,c.z-sz/2,c.z+sz/2].map(mm);});
    const ext=[0,1,2,3,4,5].map(i=>(i%2?Math.max:Math.min)(...bs.map(b=>b[i])));
    return {at:[mm(q.position.x),mm(q.position.z)],turn:+q.rotation.y,ext,fronts:bs.filter(b=>b[5]===100&&b[3]-b[2]===530).map(b=>b[1]-b[0]),tops:q.children.filter(o=>o.userData.top===true).map(o=>{const [r0,,len,,,,t0,tl]=o.geometry.args;return [mm(len),mm(o.position.y+r0),mm(o.position.z-r0),mm(o.position.z+r0),t0,+tl.toFixed(4)];}),mat:q.children.every(o=>o.userData.valve===true||o.material===winMat),
      valve:mm(q.children.find(o=>o.userData.valve===true).position.x),info:infoOf(q),foot:rd};})(tt.fur())`);
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
