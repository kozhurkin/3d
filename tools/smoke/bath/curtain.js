// шторка на штанге (src/js/rooms/bath/curtain.js)
const { round, runPage, PAGES, check, assert } = require('../harness');

check('санузел: полупрозрачная шторка 220 см до поддона на прямой штанге, упёртой в кронштейн-шар за стенкой в конце ниши — отодвинута за стенку, по нажатию закрывает проход', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const C = 'tt.item("curtain","bath")';
  const D = "tt.fur('bath').doors.find(d=>d.key==='curtain')";
  const pos = (o) => p.run(`(m=>[m.position.x,m.position.y,m.position.z].map(v=>tt.mm(v)))(${o})`);
  // the rod, straight: from the bracket's ball (250, half way along the wall at the niche end, 0–500; its end in the ball's
  // blind hole, to its middle — nothing comes out on the far side) to the shower partition (1000); 2393 from the floor (the cloth 2200 from 160 up — 10 over the tray —, the
  // rings through its eyelets, their inside on the rod), 45 from the back of that wall (1200)
  const rp = (k) => `${C}.children.find(m=>m.userData.rodPart==='${k}')`;
  assert.deepStrictEqual(pos(rp('run')), [625, 2393, 1245]);
  assert.strictEqual(p.run(`Math.round(${rp('run')}.geometry.args[2]*1000)`), 750);
  assert.deepStrictEqual([...pos(rp('ball')), p.run(`${rp('ball')}.geometry.kind`), p.run(`Math.round(${rp('ball')}.geometry.args[0]*1000)`)], [250, 2393, 1245, 'THREE.SphereGeometry', 16]);
  // the flanges: Ø30 on the partition, the bracket's Ø46 on the wall
  assert.deepStrictEqual(p.run(`${C}.children.filter(m=>m.userData.rodPart==='flange').map(m=>[Math.round(m.geometry.args[0]*2000),tt.mm(m.position.x),tt.mm(m.position.z)])`), [[30, 996, 1245], [46, 250, 1203]]);
  assert.strictEqual(p.run(`${C}.children.some(m=>m.geometry.kind==='THREE.TorusGeometry')`), false, 'no bend');
  assert.strictEqual(p.run(`${C}.userData.walkThrough`), true, 'the walker goes through it');
  // frosted vinyl, grey, 60 % clear; its shadow 40 % of a full one: drawn through a sieve (its own depth material)
  assert.match(PAGES.app, /const CURT_OP=\.4,curtainMat=new THREE\.MeshStandardMaterial\(\{color:new THREE\.Color\('#cccccc'\)[^}]*transparent:true,opacity:CURT_OP/);
  assert.strictEqual(p.run(`${D}.g.children[0].castShadow`), true);
  assert.match(PAGES.app, /cloth\.customDepthMaterial=curtainShadowMat/);
  assert.match(PAGES.app, /curtainShadowMat=new THREE\.MeshDepthMaterial\(\{depthPacking:THREE\.RGBADepthPacking,alphaTest:1-CURT_OP,/);
  // drawn back: gathered behind the wall at the niche end, from the ball up to 10 short of its end (490 of its 500); a door of the room, closed
  assert.deepStrictEqual(p.run(`[${D}.a,${D}.t,${D}.g.userData.edge]`), [0, 0, 490]);
  // its rings: closed, chrome as the rod, 32 × 56 (half circles R16 joined by straight bits); the cloth 2200 from 160 up
  assert.deepStrictEqual(p.run(`${D}.g.children.filter(m=>m.userData.ring===true).map(m=>m.geometry.kind+':'+m.geometry.args[4])`), Array(10).fill('THREE.TubeGeometry:true'));
  assert.strictEqual(p.run(`${D}.g.children.find(m=>m.userData.ring===true).material===${rp('run')}.material`), true, 'as the rod');
  assert.strictEqual(p.run(`${D}.g.userData.top`), 2360);
  // the eyelets: 12 under the cloth's top, one per ring, each ring through its hole (the hole's top on the ring's bottom: the ring's
  // centre 2348 + 4 − 2.5 + 28), so the cloth's top is over the rings' bottoms; no faces over the holes
  const eyes = () => p.run(`${D}.g.userData.eyes`), rings = () => p.run(`${D}.g.children.filter(m=>m.userData.ring===true).map(m=>[tt.mm(m.position.x),m.position.y*1000])`);
  assert.deepStrictEqual(eyes().map((e) => e[1]), Array(10).fill(2348));
  assert.deepStrictEqual(rings().map((r) => r[0]), eyes().map((e) => e[0]), 'a ring through each eyelet');
  assert.ok(rings().every((r) => Math.abs(r[1] - 2377.5) < 0.01), 'its bottom in the hole\'s top');
  assert.ok(2360 > 2377.5 - 28, 'the cloth over the rings\' bottoms');
  assert.strictEqual(p.run(`${D}.g.children[0].userData.tris`), (2 + 10 * 4 + 9 * 23 - 1) * 3 * 2 - 10 * 2, 'a hole in the band at each eyelet: 249 columns, 4 rows, a quad less at each');
  // the folds as deep to either side; drawn back 42, off the wall (the rod 45 out from it)
  assert.strictEqual(p.run(`${D}.g.userData.fold`), 42);
  // a fold's shape: off the rod a third of the way along the first fold (column 12) against its crest (column 16), the flat by the eyelet (column 4) at the rod;
  // drawn back the crest blunt (steep sides: nearly the full depth there), drawn across plain sin² (sin²(π/3) = 0.75)
  const third = () => p.run(`(z=>(z(12)-z(4))/(z(16)-z(4)))(c=>${D}.g.children[0].userData.pos[c*4*3+2])`);
  assert.ok(third() > 0.97, 'drawn back: a blunt crest');
  // a click: across the opening, up to 10 short of the partition
  p.run(`${D}.t=${D}.a=${D}.max`); p.tick();
  assert.strictEqual(p.run(`${D}.g.userData.edge`), 990);
  assert.strictEqual(p.run(`${D}.g.userData.fold`), 34, 'drawn across: shallower');
  assert.ok(Math.abs(third() - 0.75) < 0.01, 'drawn across: plain sin² folds');
  // hidden with the tray while the frame cuts the shower, shown with it
  assert.strictEqual(p.run(`${C}.visible`), false);
  const fl = p.document.querySelector('[data-panel="bath"]').querySelector('#bFrameL');
  fl.value = '1900'; fl.dispatch('input'); p.tick();
  assert.strictEqual(p.run(`${C}.visible`), p.run(`wallParts.find(x=>x.id==='nicheEnd').f()`), 'shown with the wall at the niche end');
  // the cut mode: it hides with the wall at the niche end (1100–1200 on the plan) once the camera is past it, in the shower
  const at = (z) => p.run(`(()=>{camera.position.set(-1.5,1.5,${z});frameHooks.forEach(h=>h(0,()=>0));return [${C}.visible,wallParts.find(x=>x.id==='nicheEnd').f()];})()`);
  assert.deepStrictEqual(at(0.9), [true, true]);
  assert.deepStrictEqual(at(1.5), [false, false]);
  p.run(`VS.bath.Wm='edges'`); assert.deepStrictEqual(at(1.5)[0], true, 'not in the other wall modes');
  p.run(`VS.bath.Wm='auto'`); at(0.9);
  // its «i»
  assert.deepStrictEqual(p.run(`(i=>[i.title,...i.lines])(infoOf(${C}.children[0]))`), ['Шторка для душа',
    '100 × 220 см, клеёнка (PEVA), полупрозрачная, матовая; люверсы и кольца — хром.',
    'Штанга прямая, 75 см: слева в перегородку, справа заходит за стенку у ниши и упирается в шар кронштейна на её задней стороне; нержавеющая сталь, хром, Ø 2 см; в 239 см от пола.',
    'Низ шторки в 1 см над поддоном.',
    'Нажатие задёргивает шторку или отодвигает её за стенку.']);
  // a wider opening (the shaft narrower, the wall at the niche end as it was) and a shorter niche on the plan: the rod longer and nearer, the curtain stays drawn across
  p.run('setModel({bGap:600,vW:750,bL:1000})'); p.tick();
  assert.deepStrictEqual(pos(rp('run')), [675, 2393, 1145]);
  assert.strictEqual(p.run(`${D}.g.userData.edge`), 1090);
});
