// душевая стойка с термостатом и лейкой (src/js/rooms/bath/shower.js)
const { round, runPage, PAGES, check, assert } = require('../harness');

check('санузел: душевая стойка с термостатом и лейкой — на левой стене посередине поддона, видна вместе с ним', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  // two groups: on the wall (it stops the walker) and the arm with the overhead shower (over the head, walked under)
  const R = (k) => `tt.fur("bath").sani.children.find(m=>m.userData.rack==='${k}')`;
  assert.deepStrictEqual([p.run(`${R('wall')}.userData.walkThrough`), p.run(`${R('over')}.userData.walkThrough`)], [undefined, true]);
  const at = (k) => p.run(`(m=>[m.position.x,m.position.y,m.position.z].map(v=>tt.mm(v)))([...${R('wall')}.children,...${R('over')}.children].find(m=>m.userData.rackPart==='${k}'))`);
  // the bathroom's axes: the left wall at 0, the tray from 1200 to 1900: half way is 1550
  assert.deepStrictEqual(at('thermostat'), [70, 1150, 1550], '70 out from the left wall, 1150 from the floor');
  assert.deepStrictEqual(at('head'), [442, 2065, 1550], 'the overhead shower 442 from the wall, as AM.PM Chic 2.0, under the arm at 2100');
  assert.deepStrictEqual(at('hand'), [120, 1550, 1550], 'the hand shower in its holder on the riser');
  assert.ok(p.run(`${R('wall')}.children.some(m=>m.userData.rackPart==='hose')`), 'its hose');
  // the hand shower's head on the handle's end by its rim: the handle's end (50 over the holder) 12 inside the rim, not at the centre;
  // its face turned down off the handle's line
  const hh = p.run(`(h=>(m=>({c:[m.position.x,m.position.y].map(v=>tt.mm(v)),rot:m.rotation.z}))(h.children.find(m=>m.userData.rackPart==='handHead')))(${R('wall')}.children.find(m=>m.userData.rackPart==='hand'))`);
  assert.strictEqual(Math.round(Math.hypot(hh.c[0], hh.c[1] - 50)), 43, 'the handle goes into the head\'s side: 55 − 12 from its centre');
  assert.ok(hh.rot < -Math.PI / 2, 'the face tilted down from square to the handle');
  // the hose: smooth (no step turns more than 15°), 1750 long, clear of the thermostat bar (Ø60 at 70 out, 1150 up) and of the tray
  const path = p.run(`${R('wall')}.children.find(m=>m.userData.rackPart==='hose').userData.path`);
  let len = 0, turn = 0, gap = 1;
  path.forEach((q, i) => {
    if (i) len += Math.hypot(q[0] - path[i - 1][0], q[1] - path[i - 1][1]);
    if (i > 1) { const a = Math.atan2(q[1] - path[i - 1][1], q[0] - path[i - 1][0]) - Math.atan2(path[i - 1][1] - path[i - 2][1], path[i - 1][0] - path[i - 2][0]);
      turn = Math.max(turn, Math.abs(Math.atan2(Math.sin(a), Math.cos(a)))); }
    if (q[1] > 1.15 - 0.03) gap = Math.min(gap, Math.hypot(q[0] - 0.07, q[1] - 1.15) - 0.03 - 0.008);
  });
  assert.ok(Math.abs(len - 1.75) < 0.03, `the hose 1750 long: ${Math.round(len * 1000)}`);
  assert.ok(turn < Math.PI / 12, 'no kink in the hose');
  assert.ok(gap > 0.02, 'the hose clear of the thermostat');
  assert.ok(Math.min(...path.map(q => q[1])) - 0.008 > 0.15, 'its loop over the tray');
  // the riser into the arm and the arm down to the head: rounded, quarter rings 60 and 30 mm in radius
  assert.deepStrictEqual(p.run(`${R('over')}.children.filter(m=>m.userData.rackPart==='bend').map(m=>[m.geometry.kind,tt.mm(m.geometry.args[0]),+(m.geometry.args[4]/Math.PI).toFixed(2)])`),
    [['THREE.TorusGeometry', 60, 0.5], ['THREE.TorusGeometry', 30, 0.5]]);
  // everything over the tray: inside it from the left wall to the partition, under the ceiling
  const head = at('head');
  assert.ok(head[0] - 110 > 0 && head[0] + 110 < 1000 && head[2] - 110 > 1200 && head[2] + 110 < 1900, 'the head over the tray');
  // hidden with the tray while the frame cuts the shower, shown with it
  assert.deepStrictEqual([p.run(`${R('wall')}.visible`), p.run(`${R('over')}.visible`)], [false, false]);
  const fl = p.document.querySelector('[data-panel="bath"]').querySelector('#bFrameL');
  fl.value = '1900'; fl.dispatch('input'); p.tick();
  assert.deepStrictEqual([p.run(`${R('wall')}.visible`), p.run(`${R('over')}.visible`)], [true, true]);
  // its «i»: sizes, materials, where it is
  const info = p.run(`(i=>[i.title,...i.lines])(infoOf(${R('over')}.children[0]))`);
  assert.deepStrictEqual(p.run(`(i=>[i.price,i.url,i.shop])(infoOf(${R('wall')}.children[0]))`), [21000, 'https://ozon.ru/t/RhrtHZA', 'Ozon']);
  assert.deepStrictEqual(info, ['Душевая система AM.PM Chic 2.0 с термостатом',
    'Высота 99 см (штанга выдвигается, 88–127 см), верхний душ Ø 22 см в 44 см от стены; ручная лейка Ø 11 см, шланг 1,75 м.',
    'Латунь, хром; межосевое расстояние 150 мм.',
    'Термостат в 115 см от пола (100 см над поддоном), верхний душ в 206 см; на левой стене посередине душевой.']);
  // it follows the shower on the plan
  p.run('setModel({bL:1000})'); p.tick();
  assert.strictEqual(at('thermostat')[2], 1500);
});
