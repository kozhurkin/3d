// душевой поддон за ступенькой (src/js/rooms/bath/tray.js)
const { round, runPage, PAGES, check, assert } = require('../harness');

check('санузел: душевой поддон заполняет душ за ступенькой, во вкладке — только когда рамка берёт его целиком', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  const T = 'tt.item("tray","bath")';
  const box = (o) => p.run(`(b=>[b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z].map(v=>tt.mm(v)))(new THREE.Box3().setFromObject(${o}))`);
  // the frame at 1400 cuts the shower: no tray
  assert.strictEqual(p.run(`${T}.visible`), false, 'hidden while the frame cuts it');
  // from the left wall (−2050) to the shower partition (−1050), from the wall at the niche end (1200) to the kitchen wall (1900); 150 high
  const body = `${T}.children.find(m=>m.userData.part==='Душевой поддон')`;
  assert.deepStrictEqual(box(body), [-2050, -1050, 0, 150, 1200, 1900]);
  assert.ok(p.run(`(m=>m.length===6&&m[2]!==m[0]&&m.filter(x=>x===m[0]).length===5)(${body}.material)`), 'its top (+y) slate of its own, the five other faces plain');
  // the drain: 120 square, a quarter of the way from the left wall, half way across, on the top
  const dr = box(`${T}.children[1]`);
  assert.deepStrictEqual([dr[1] - dr[0], (dr[0] + dr[1]) / 2, (dr[4] + dr[5]) / 2, dr[2]], [120, -1800, 1550, 150]);
  // its «i»: on the body and on the drain, its sizes from the plan
  const info = (o) => p.run(`(i=>i&&[i.title,i.lines[0]])(infoOf(${o}))`);
  assert.deepStrictEqual(info(body), ['Душевой поддон', '100 × 70 см, высота 15 см: во всю душевую, от левой стены до перегородки.']);
  assert.strictEqual(info(`${T}.children[1]`)[0], 'Душевой поддон');
  // the frame up to the kitchen wall takes it in whole: it shows
  const fl = p.document.querySelector('[data-panel="bath"]').querySelector('#bFrameL');
  fl.value = '1850'; fl.dispatch('input'); p.tick();
  assert.strictEqual(p.run(`${T}.visible`), false, '50 mm short: still hidden');
  fl.value = '1900'; fl.dispatch('input'); p.tick();
  assert.strictEqual(p.run(`${T}.visible`), true);
  // on the plan always; it follows the shower's walls
  p.run('showView("plan")'); p.fly(); p.tick();
  assert.strictEqual(p.run(`${T}.visible`), true, 'on the plan');
  p.run('setModel({vW:750,bL:1000})'); p.tick();
  assert.deepStrictEqual(box(body), [-2050, -950, 0, 150, 1100, 1900]);
  assert.match(info(body)[1], /^110 × 80 см/);
});
