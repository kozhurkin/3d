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

check('обход: диван пускает (проходишь сквозь него до окна); закрытая дверь не пускает, открытая — пускает', () => {
  const p = open();
  hold(p, 'KeyW', 150);
  near(eye(p)[2], 4.797 - 0.15, 'through the sofa (by the left wall, from 2297), stopped at the window wall');
  drag(p, Math.PI / 0.0025); p.tick();
  hold(p, 'KeyW', 150);
  near(eye(p)[2], 0.15, 'stopped at the closed door');
  p.run(() => { doors.forEach((d) => { d.t = d.max; }); }); p.tick(60);   // opened (a click or E in the browser)
  hold(p, 'KeyW', 30);
  assert.ok(eye(p)[2] < -0.2, 'through the open doorway: ' + eye(p)[2]);
});

check('обход: шкаф не пускает', () => {
  const p = open();
  drag(p, -Math.PI / 2 / 0.0025); p.tick();   // a quarter turn to the left: facing +x, toward the wardrobe
  hold(p, 'KeyW', 120);
  near(eye(p)[0], 2.188 - 0.15, 'stopped at its doors');
});

check('панель «Обхода»: стены всегда «Разрез», блоков стен и двери нет; фотообои, фальш-декор, шкаф, диван — те же, что на «Комнате»', () => {
  const storage = new Map([['eng-view-walk-v1', JSON.stringify({ Wm: 'edges', Wh: 40, dm: 'none', eye: 1500 })]]);
  const p = runPage(PAGES.app, { parentWin: { appView: 'walk' }, storage }); p.tick();
  const panel = (v) => `[data-panel="${v}"]`;
  assert.deepStrictEqual(['[data-wm]', '[data-wh]', '[data-dm]'].map((q) => p.document.querySelector(`${panel('walk')} ${q}`)), [null, null, null]);
  assert.deepStrictEqual(p.run(() => VS.walk), { arcs: false, eye: 1500 }, 'the old walls\' look and doors dropped');
  const groups = (v) => p.document.querySelectorAll(`${panel(v)} [role="group"]`).map((g) => g.getAttribute('aria-label'));
  assert.deepStrictEqual(groups('walk'), ['Фотообои', 'Фальш-декор', 'Шкаф', 'Диван', 'Цвет стен']);
  assert.deepStrictEqual(groups('plan'), ['Цвет плинтуса', 'Люстра'], 'the block is in the panel on screen only');
  p.document.querySelector(`${panel('walk')} [data-sofa="right"]`).click();
  assert.deepStrictEqual(p.run(() => [A.sofaWall, JSON.parse(localStorage.getItem('eng-choice-v1')).sofaWall]), ['right', 'right']);
  // what does not fit is said under the buttons
  p.run(() => setModel({ ...A, L: 3500, sofaWall: 'left', wardWall: 'door' }));
  p.document.querySelector(`${panel('walk')} [data-ward="right"]`).click();
  p.document.querySelector(`${panel('walk')} [data-sofa="right"]`).click();
  assert.deepStrictEqual([p.run(() => A.sofaWall), p.document.getElementById('fMsg').textContent], ['left', 'Нельзя: Шкаф и диван у одной стены не помещаются']);
  p.run(() => showView('plan', false));
  assert.deepStrictEqual(groups('plan').slice(0, 4), ['Фотообои', 'Фальш-декор', 'Шкаф', 'Диван']);
});
