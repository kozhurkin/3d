// «Обход»: вид от первого лица в комнате, стены и дверь не пускают, открытая дверь пускает.
const { runPage, PAGES, check, near, assert } = require('./harness');

const eye = (p) => p.run(() => [camera.position.x, camera.position.y, camera.position.z]);
const hold = (p, code, n) => { p.key('keydown', code); p.tick(n); p.key('keyup', code); };
function drag(p, dx) {
  const c = p.document.getElementById('c');
  c.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  c.dispatch('pointermove', { clientX: 100 + dx, clientY: 100, pointerId: 1 });
  c.dispatch('pointerup', { clientX: 100 + dx, clientY: 100, pointerId: 1 });
}
const open = () => { const p = runPage(PAGES.app, { parentWin: { appView: 'walk' } }); p.tick(); return p; };

check('обход: в комнате у двери, в середине проёма, взгляд на окно', () => {
  const p = open();
  const [x, y, z] = eye(p);
  near(x, 0.67, 'the doorway 260…1080'); near(y, 1.65, 'eye height'); near(z, 0.6, 'a step from the door');
  assert.deepStrictEqual(p.run(() => ({ view, ceil: ceiling.visible, doors: doorGroup.visible })), { view: 'walk', ceil: true, doors: true });
});

check('обход: стена с окном не пускает; закрытая дверь не пускает, открытая — пускает', () => {
  const p = open();
  hold(p, 'KeyW', 150);
  near(eye(p)[2], 4.797 - 0.15, 'stopped at the window wall');
  drag(p, Math.PI / 0.0025); p.tick();
  hold(p, 'KeyW', 150);
  near(eye(p)[2], 0.15, 'stopped at the closed door');
  p.document.querySelector('[data-panel="walk"] [data-dm="open"]').click(); p.tick(60);
  hold(p, 'KeyW', 30);
  assert.ok(eye(p)[2] < -0.2, 'through the open doorway: ' + eye(p)[2]);
});

check('обход: шкаф не пускает', () => {
  const p = open();
  drag(p, -Math.PI / 2 / 0.0025); p.tick();   // a quarter turn to the left: facing +x, toward the wardrobe
  hold(p, 'KeyW', 120);
  near(eye(p)[0], 2.188 - 0.15, 'stopped at its doors');
});
