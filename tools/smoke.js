// Смоук-тест собранного index.html в Node, без браузера: скрипты страниц выполняются с заглушкой THREE
// и маленьким DOM, разобранным из настоящей разметки. Ловит ошибки порядка загрузки модулей, неверные id и селекторы,
// поломки сохранения настроек и переключения вкладок. WebGL не рисует — картинку смотрит пользователь в index.html.
// Запуск: npm run check (после npm run build)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');

/* ---------- THREE: universal stub ---------- */
function stub(name = 'stub') {
  return new Proxy(function () {}, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then' || k === Symbol.iterator) return undefined;
      if (k in t) return t[k];
      return (t[k] = stub(name + '.' + String(k)));
    },
    set(t, k, v) { t[k] = v; return true; },
    apply() { return stub(name + '()'); },
    construct(t, args) {
      const o = stub('new ' + name);
      if (name === 'THREE.PerspectiveCamera') Object.assign(o, { fov: args[0], aspect: args[1] });
      return o;
    },
  });
}
// a real vector, so camera targets and goals can be checked in numbers
class Vec3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setScalar(s) { return this.set(s, s, s); }
  copy(v) { return this.set(+v.x, +v.y, +v.z); }
  clone() { return new Vec3(this.x, this.y, this.z); }
  add(v) { this.x += +v.x; this.y += +v.y; this.z += +v.z; return this; }
  sub(v) { this.x -= +v.x; this.y -= +v.y; this.z -= +v.z; return this; }
  subVectors(a, b) { return this.set(+a.x - b.x, +a.y - b.y, +a.z - b.z); }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  addScaledVector(v, s) { this.x += +v.x * s; this.y += +v.y * s; this.z += +v.z * s; return this; }
  lerp(v, k) { this.x += (+v.x - this.x) * k; this.y += (+v.y - this.y) * k; this.z += (+v.z - this.z) * k; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { return this.multiplyScalar(1 / (this.length() || 1)); }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  setFromMatrixColumn() { return this; } applyMatrix4() { return this; } applyQuaternion() { return this; } project() { return this; }
}
const round = (v, d = 4) => +(+v).toFixed(d);

/* ---------- a small DOM: elements parsed from the page, enough for querySelector, events and attributes ---------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
function parseAttrs(s) {
  const a = {}, re = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g; let m;
  while ((m = re.exec(s))) a[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return a;
}
function el(tag, attrs = {}) {
  const e = {
    tagName: tag.toUpperCase(), attrs: { ...attrs }, children: [], parentElement: null, listeners: {}, style: {},
    textContent: '', value: attrs.value ?? '', checked: 'checked' in attrs, disabled: 'disabled' in attrs,
    clientWidth: 800, clientHeight: 600, width: 300, height: 150,
    get id() { return this.attrs.id || ''; },
    get className() { return this.attrs.class || ''; }, set className(v) { this.attrs.class = String(v); },
    focus() {}, select() {}, contains(x) { for (; x; x = x.parentElement) if (x === this) return true; return false; },
    get hidden() { return 'hidden' in this.attrs; },
    set hidden(v) { if (v) this.attrs.hidden = ''; else delete this.attrs.hidden; },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    removeAttribute(k) { delete this.attrs[k]; },
    hasAttribute(k) { return k in this.attrs; },
    set innerHTML(h) { this.children.forEach((c) => (c.parentElement = null)); this.children = []; this._html = String(h); parseHTML(this._html, this); },
    get innerHTML() { return this._html; },   // what was last written (enough for the checks)
    appendChild(c) {
      if (c.parentElement) c.parentElement.children = c.parentElement.children.filter((x) => x !== c);
      c.parentElement = this; this.children.push(c); return c;
    },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    dispatch(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ target: this, preventDefault() {}, ...ev })); },
    click() { this.dispatch('click'); },
    querySelector(s) { return this.querySelectorAll(s)[0] || null; },
    querySelectorAll(s) { return all(this).filter((x) => x !== this && matches(x, s)); },
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; },
    setPointerCapture() {}, getContext() { return stub('ctx'); },
  };
  e.dataset = new Proxy({}, {
    get: (_, k) => e.attrs['data-' + kebab(String(k))],
    set: (_, k, v) => { e.attrs['data-' + kebab(String(k))] = String(v); return true; },
  });
  return e;
}
function parseHTML(html, root = el('#root')) {
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    const [whole, close, tag, attrs, self] = m, t = tag.toLowerCase();
    if (close) { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tagName === t.toUpperCase()) { stack.length = i; break; } continue; }
    const e = stack[stack.length - 1].appendChild(el(t, parseAttrs(attrs)));
    if (t === 'script' || t === 'style') {   // raw text up to the closing tag
      const end = html.indexOf('</' + t, re.lastIndex);
      e.text = html.slice(m.index + whole.length, end); re.lastIndex = end;
    }
    if (!VOID.has(t) && !self) stack.push(e);
  }
  return root;
}
const all = (e) => [e, ...e.children.flatMap(all)];
function matchesOne(e, s) {
  return (s.match(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|^[a-z][\w-]*/g) || []).every((p) => {
    if (p[0] === '#') return e.attrs.id === p.slice(1);
    if (p[0] === '.') return (e.attrs.class || '').split(/\s+/).includes(p.slice(1));
    if (p[0] === '[') { const [, k, v] = p.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/); return k in e.attrs && (v === undefined || e.attrs[k] === v); }
    return e.tagName === p.toUpperCase();
  });
}
function matches(e, sel) {
  return sel.split(',').some((one) => {
    const parts = one.trim().split(/\s+(?![^\[]*\])/);
    if (!matchesOne(e, parts.pop())) return false;
    let a = e.parentElement;
    while (parts.length && a) { if (matchesOne(a, parts[parts.length - 1])) parts.pop(); a = a.parentElement; }
    return !parts.length;
  });
}

/* ---------- run a page's inline scripts in one context, like a browser does ---------- */
function runPage(html, { hash = '', storage = new Map(), parentWin = {} } = {}) {
  const doc = parseHTML(html), docEl = el('html'), frames = [];
  const document = {
    documentElement: docEl, fonts: undefined,
    getElementById: (id) => all(doc).find((x) => x.attrs.id === id) || null,
    querySelector: (s) => doc.querySelector(s), querySelectorAll: (s) => doc.querySelectorAll(s),
    createElement: (t) => el(t), addEventListener() {},
  };
  const localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
  const THREE = stub('THREE'); THREE.Vector3 = Vec3;
  const win = {
    THREE, document, localStorage, console, performance, setTimeout, clearTimeout, Math, JSON,
    devicePixelRatio: 1, location: { hash }, innerWidth: 1280, innerHeight: 800,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => ' #cccccc ' }),
    requestAnimationFrame: (f) => frames.push(f),
    MutationObserver: class { observe() {} }, ResizeObserver: class { observe() {} },
    Image: class { set src(v) {} }, navigator: {},
  };
  const wl = {};
  win.addEventListener = (t, f) => (wl[t] ||= []).push(f);
  win.dispatch = (t) => (wl[t] || []).forEach((f) => f({}));
  win.window = win; win.parent = { location: { hash }, ...DECOR_PARENT, ...parentWin };   // pages take the decors from the shell
  const ctx = vm.createContext(win);
  all(doc).filter((x) => x.tagName === 'SCRIPT' && !x.attrs.src).forEach((s, i) => vm.runInContext(s.text, ctx, { filename: `script#${i}` }));
  const tick = (n = 3) => { for (let i = 0; i < n; i++) { const q = frames.splice(0); q.forEach((f) => f()); } };
  return { ctx, doc, document, storage, tick, run: (code) => { const s = vm.runInContext('JSON.stringify(' + code + ')', ctx); return s === undefined ? undefined : JSON.parse(s); } };
}

/* ---------- the built file ---------- */
const root = path.join(__dirname, '..');
// the decor library the shell carries (pages read it from their parent through the bridge)
const decorsCtx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'src/decors.js'), 'utf8'), decorsCtx);
const DECOR_PARENT = Object.fromEntries(['PHOTO_GAIN', 'DECORS', 'PALETTE_WOOD', 'PALETTE_UNI', 'renderPalette'].map((k) => [k, decorsCtx[k]]));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pi = html.indexOf('const PAGES=');
const PAGES = new Function(html.slice(pi, html.indexOf(';\n', pi) + 1) + 'return PAGES;')();
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

check('страницы в index.html', () => {
  assert.deepStrictEqual(Object.keys(PAGES).sort(), ['app', 'bath', 'hall', 'kitchen']);
  Object.entries(PAGES).forEach(([k, p]) => {
    assert.ok(!/<script src="js\//.test(p), k + ': js/ module left as a link');
    assert.ok(!/<!--include /.test(p), k + ': include left in the page');
  });
});

check('приложение: «Планировка» открывается', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const r = p.run('({view, n:Object.keys(VIEWS), lines:wallLines.length, parts:wallParts.length, fade:VIEWS.plan.fade, vs:VS.plan, doors:doors.map(d=>d.g.visible)})');
  assert.strictEqual(r.view, 'plan');
  assert.deepStrictEqual(r.n, ['plan', 'kitchen']);
  assert.deepStrictEqual(r.doors, [true, true], 'both doors on the plan');
  assert.strictEqual(r.lines, 12, 'all 12 walls on the plan');
  assert.strictEqual(r.parts, 26, 'wall pieces (19) + window parts (7)');
  assert.deepStrictEqual(r.fade, { entry: '-z', rightOuter: '+x', leftOuter: '-x', window: '+z' });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.vs)), { Wm: 'auto', Wh: 100, dm: 'closed', dims: false, names: true, floors: true });
  const panel = p.document.querySelector('[data-panel="plan"]'), shared = p.document.getElementById('shared');
  assert.strictEqual(panel.hidden, false, 'plan panel shown');
  assert.ok(matches(shared, '[data-panel="plan"] [data-shared-slot] #shared') && !shared.hidden, 'light and wall colour in the plan panel');
  assert.strictEqual(panel.querySelector('[data-wh-out]').textContent, '100%');
});

check('приложение: настройки вида и общие настройки сохраняются отдельно', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  const panel = p.document.querySelector('[data-panel="plan"]');
  panel.querySelector('[data-wm="row"]').click();
  assert.strictEqual(panel.querySelector('[data-wh-out]').textContent, '10%');
  panel.querySelector('[data-dm="open"]').click();
  const dims = panel.querySelector('#pDims'); dims.checked = true; dims.dispatch('change');
  p.document.querySelector('[data-wc="greige"]').click();
  const az = p.document.getElementById('Laz'); az.value = '12'; az.dispatch('input');
  p.tick();
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-plan-v1')), { Wm: 'row', Wh: 100, dm: 'open', dims: true, names: true, floors: true });
  assert.deepStrictEqual(JSON.parse(storage.get('apt-shared-v1')), { wc: 'greige', light: { az: 12, el: 45, i: 100, a: 100 } });
  assert.ok(![...storage.keys()].some((k) => k.startsWith('apt-plan-view')), 'no old plan keys written');
  // reopened: everything comes back
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  const r = p.run('({wm:VS.plan.Wm, dm:VS.plan.dm, wc:S.wc, az:S.light.az, open:doors.every(d=>d.t===d.max)})');
  assert.deepStrictEqual({ ...r }, { wm: 'row', dm: 'open', wc: 'greige', az: 12, open: true });
});

check('приложение: кнопки камеры плана двигают камеру', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  p.document.querySelector('[data-cam="top"]').click();
  const r = p.run('({theta:goal.theta, phi:goal.phi, r:goal.r})');
  assert.strictEqual(r.phi, 0.0005);
  assert.ok(Number.isFinite(r.r) && r.r > 5 && r.r < 30, 'distance ' + r.r);
});

// a slider of the plan's wall sizes moved to v, as the browser does it
const slide = (p, k, v) => { const s = p.document.querySelector(`[data-size="${k}"]`); s.value = String(v); s.dispatch('input'); };

check('размеры стен: ползунок меняет модель и всё перестраивается', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const panel = p.document.querySelector('[data-panel="plan"]');
  assert.deepStrictEqual(p.run('aptProblems(A)'), [], 'defaults fit');
  // every slider shows its size
  const n = p.run('sizeFields.length');
  assert.strictEqual(panel.querySelectorAll('[data-size]').length, n);
  assert.strictEqual(panel.querySelector('[data-size-out="kW"]').textContent, 2200);
  assert.strictEqual(panel.querySelector('[data-size-out="eW"]').textContent, 892);
  // dimensions on: built once
  const dims = panel.querySelector('#pDims'); dims.checked = true; dims.dispatch('change'); p.tick();
  const nLabels = p.run('labels.length'); assert.ok(nLabels > 20, 'labels ' + nLabels);
  // doors open, then the kitchen wall grows by 100
  panel.querySelector('[data-dm="open"]').click();
  slide(p, 'kW', 2300);
  assert.strictEqual(p.run('dimsDirty'), true, 'dimensions marked for a rebuild');
  p.tick();
  assert.strictEqual(p.run('dimsDirty'), false, 'dimensions rebuilt on the next frame');
  const r = p.run('({kW:A.kW, xL, lines:wallLines.length, parts:wallParts.length, doors:doors.length, open:doors.every(d=>d.t===d.max), labels:labels.length, rooms:roomMats.length})');
  assert.deepStrictEqual(r, { kW: 2300, xL: -2100, lines: 12, parts: 26, doors: 2, open: true, labels: nLabels, rooms: 3 });
  assert.ok(panel.querySelector('#pFacts').children.length > 0);
  assert.match(panel.querySelector('#pSub').textContent, /^3700 × /, 'sub follows the size');
  assert.strictEqual(panel.querySelector('[data-size-out="kW"]').textContent, 2300);
  assert.strictEqual(panel.querySelector('#pSizeMsg').textContent, '');
});

check('размеры стен: ползунок упирается и говорит во что', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const msg = p.document.getElementById('pSizeMsg');
  slide(p, 'bNiche', 2000);   // the bathroom is 1900 wide: niche + 100 partition fit up to 1800
  assert.strictEqual(p.run('A.bNiche'), 1800);
  assert.match(msg.textContent, /^Дальше нельзя: /);
  slide(p, 'bNiche', 1200);
  assert.strictEqual(p.run('A.bNiche'), 1200); assert.strictEqual(msg.textContent, '');
  // the entrance moves keeping its width; its width stops at the hall's right wall
  slide(p, 'eD0', 100);
  assert.deepStrictEqual(p.run('[A.eD0,A.eD1]'), [100, 992]);
  slide(p, 'eW', 1200);
  assert.deepStrictEqual(p.run('[A.eD0,A.eD1]'), [100, 1200]);
  assert.match(msg.textContent, /Входной проём/);
  // a slider with step 10 stops on its step from the current value
  slide(p, 'vOff', 1000);
  const v = p.run('A.vOff'); assert.ok(v % 10 === 0 && v > 150 && !p.run('aptProblems(A)').length, 'vOff ' + v);
});

check('размеры стен: «Запомнить» и «Вернуть исходные»', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  slide(p, 'kW', 2300); slide(p, 'H', 2700);
  p.document.getElementById('pSaveA').click();
  assert.deepStrictEqual(JSON.parse(storage.get('apt-model-v1')), { H: 2700, kW: 2300 }, 'only what differs from the defaults');
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  assert.deepStrictEqual(p.run('[A.kW,A.H,xL]'), [2300, 2700, -2100]);
  assert.strictEqual(p.document.querySelector('[data-size-out="H"]').textContent, 2700);
  p.document.getElementById('pResetA').click();
  assert.deepStrictEqual(p.run('[A.kW,A.H]'), [2200, 2600]);
  assert.ok(!storage.has('apt-model-v1'));
  // sizes that do not fit are not taken from the browser
  storage.set('apt-model-v1', JSON.stringify({ bNiche: 5000 }));
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  assert.strictEqual(p.run('A.bNiche'), 1200);
});

// a function's source by matching braces from its start (code private to a module is checked by running its text)
function fnSource(s, name) {
  const i = s.indexOf('function ' + name + '(');
  assert.ok(i >= 0, 'no function ' + name);
  let d = 0, j = s.indexOf('{', i);
  for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; }
  return s.slice(i, j + 1);
}
const kitchenWalls = 'wallLines.map(l=>({id:l.w.id,r:l.w.r,fade:fadeSide(l.w,VIEWS.kitchen)}))';
const vec = (p, v) => p.run(`[${v}.x,${v}.y,${v}.z]`).map((x) => round(x));

check('кухня (новая): стены кухни, обрезанные рамкой, как во вкладке «Кухня»', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  assert.strictEqual(p.run('view'), 'kitchen');
  // the kitchen tab: kitchen wall 2200 × 100 behind x 0..W; left wall 200 thick from the back of the kitchen wall to L = 1350
  assert.deepStrictEqual(p.run(kitchenWalls), [
    { id: 'leftOuter', r: [-2200, -2000, 1900, 3350], fade: '-x' },
    { id: 'kitchen', r: [-2000, 200, 1900, 2000], fade: '-z' },
  ]);
  assert.deepStrictEqual(p.run('[wallParts.length, doors.map(d=>d.g.visible)]'), [2, [false, false]], 'two wall pieces, no doors, no window');
  const kp = p.document.querySelector('[data-panel="kitchen"]');
  assert.strictEqual(kp.hidden, false); assert.strictEqual(p.document.querySelector('[data-panel="plan"]').hidden, true);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="kitchen"] #shared'), 'light and wall colour moved to the kitchen');
  assert.strictEqual(kp.querySelector('#kFrameLOut').textContent, 1350);
  // camera: «3/4» on the first visit, the kitchen tab's targets moved to the kitchen's place on the plan (origin −2000, 2000)
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.15, 1.3, 2.45]); assert.deepStrictEqual(vec(p, 'cam.target'), [-1.15, 1.3, 2.45]);
  kp.querySelector('[data-cam="sink"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.775, 0.9, 2.3]);
});

check('кухня (новая): рамка левой стены, переходы и размеры с «Планировки»', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  const fl = p.document.getElementById('kFrameL');
  fl.value = '2000'; fl.dispatch('input');
  assert.deepStrictEqual(p.run(kitchenWalls)[0].r, [-2200, -2000, 1900, 4000]);
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-kitchen-v1')), { Wm: 'auto', Wh: 100, L: 2000, sizes: true, fronts: 'closed', dims: true, walls: true, edges: true });
  fl.value = '9000'; fl.dispatch('input');   // no further than the window wall, which stays out of the kitchen view
  assert.deepStrictEqual(p.run(kitchenWalls).map((w) => w.r[3]), [6750, 2000]);
  // to the plan and back: all walls and doors there, the kitchen camera where it was left
  p.document.querySelector('[data-cam="sink"]').click();
  p.run('showView("plan")'); p.tick();
  assert.deepStrictEqual(p.run('[view, wallLines.length, doors.map(d=>d.g.visible)]'), ['plan', 12, [true, true]]);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="plan"] #shared'));
  // a size changed on the plan reaches the kitchen
  slide(p, 'kW', 2300);
  p.run('showView("kitchen")'); p.tick();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.875, 0.9, 2.3], 'sink target, kitchen moved 100 left');
  assert.deepStrictEqual(p.run(kitchenWalls).map((w) => w.r), [[-2300, -2100, 1900, 6750], [-2100, 200, 1900, 2000]]);
  assert.match(p.document.getElementById('kSub').textContent, /стена 2300/);
});

check('кухня (новая): детали шкафов совпадают со старой кухней', () => {
  const pLine = PAGES.app.match(/^const P=\{W:2200,H:2600,.*\};$/m)[0];
  const got = new Function(`let T=16, TF=16; const HDF=4, G=2;\n${pLine}\n${fnSource(PAGES.app, 'computeParts')}\nT=P.T||16;TF=P.TF||16;return computeParts(P);`)();
  const want = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/kitchen-parts.json'), 'utf8'));
  assert.strictEqual(got.parts.length, want.parts.length);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(got)), want);
});

check('кухня (новая): шкафы и техника собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kp = p.document.querySelector('[data-panel="kitchen"]'), kq = (s) => kp.querySelector(s);
  const want = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/kitchen-parts.json'), 'utf8'));
  const nDoors = want.parts.filter((x) => x.mat === 'front' && (x.hinge || x.pivot)).length;
  const k = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.length, visible:f.model&&f.model.visible, P:f.P}))(VIEWS.kitchen.furniture())');
  let r = k();
  assert.deepStrictEqual([r.doors, r.parts, r.visible], [nDoors, want.parts.length, true], 'built on screen with every front on a hinge');
  // the panel: sizes, the wall and ceiling from the plan, finishes in the subtitle, what is left free
  assert.strictEqual(kq('[data-p-out="B1"]').textContent, '450 мм');
  assert.strictEqual(kq('#k-W').textContent, '2200 мм'); assert.strictEqual(kq('#k-H').textContent, '2600 мм');
  assert.match(kq('#kSub').textContent, /корпус — Белый премиум W1000 ST9; фасады — Серый кашемир U702 ST9; столешница — Дуб Каселла натуральный H1385 ST40/);
  assert.match(kq('#k-gapBase').textContent, /справа свободно 100 мм/);
  // a wider sink cabinet: the fridge niche gives way, as in the kitchen tab
  const b1 = kq('[data-p="B1"]'); b1.value = '600'; b1.dispatch('input');
  r = k(); assert.deepStrictEqual([r.P.B1, r.P.Fr], [600, 550]);
  assert.strictEqual(kq('[data-p-out="Fr"]').textContent, '550 мм');
  // no dishwasher: its front goes, a middle cabinet with a door and a shelf comes
  const dish = kq('#k-tDish'); dish.checked = false; dish.dispatch('change');
  r = p.run('VIEWS.kitchen.furniture().current.parts.map(x=>x.name)');
  assert.ok(!r.includes('Фасад посудомоечной машины') && r.includes('Полка нижнего шкафа — средний'));
  kq('[data-hob="free"]').click(); kq('[data-thick="18"][data-for="T"]').click();
  r = k(); assert.deepStrictEqual([r.P.Hob, r.P.T], ['free', 18]);
  // along the worktop the offset slider hides
  const along = kq('#k-tHobAlong'); along.checked = true; along.dispatch('change');
  assert.strictEqual(kq('#k-fHx').hidden, true);
});

check('кухня (новая): шкафы видны только в своей вкладке и следуют размерам «Планировки»', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().model'), null, 'not built while the kitchen is not on screen');
  p.run('showView("kitchen")'); p.tick();
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().model.visible'), true);
  p.run('showView("plan")'); p.tick();
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().model.visible'), false, 'hidden on the plan');
  slide(p, 'kW', 2300); p.tick();
  p.run('showView("kitchen")'); p.tick();
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().P.W'), 2300);
  assert.match(p.document.getElementById('k-gapBase').textContent, /справа свободно 200 мм/);
  assert.strictEqual(p.document.getElementById('k-W').textContent, '2300 мм');
});

check('кухня (новая): отделка — палитра, меню образца, свой цвет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'kitchen' } }); p.tick();
  const kp = p.document.querySelector('[data-panel="kitchen"]'), kq = (s) => kp.querySelector(s), sub = () => kq('#kSub').textContent;
  assert.strictEqual(kp.querySelectorAll('[data-decor]').length, DECOR_PARENT.PALETTE_WOOD.length);
  assert.strictEqual(kp.querySelectorAll('[data-uc]').length, DECOR_PARENT.PALETTE_UNI.length);
  assert.ok(matches(kq('#k-ccCard'), '[aria-label="Монотонные декоры"] .cc'), 'own colour card stays with the plain colours');
  // what each swatch carries: К carcass, Ф fronts, С worktop, А apron (follows the worktop)
  const tags = (s) => kq(s).querySelector('.tags').innerHTML;
  assert.strictEqual(tags('[data-uc="#F1F0EA"]'), '<b>К</b>'); assert.strictEqual(tags('[data-uc="#C2B8AA"]'), '<b>Ф</b>');
  assert.strictEqual(tags('[data-decor="C1385"]'), '<b>С</b><b>А</b>');
  // a click paints carcass and fronts
  kq('[data-decor="H1180"]').click();
  assert.match(sub(), /потолок 2600 мм · Дуб Галифакс натуральный H1180 ST37; столешница — Дуб Каселла/);
  // the swatch menu paints one group: the worktop
  const ctx = p.document.getElementById('ctx');
  kq('[data-uc="#F1F0EA"]').dispatch('contextmenu', { clientX: 100, clientY: 100 });
  assert.strictEqual(ctx.hidden, false);
  assert.deepStrictEqual(ctx.querySelectorAll('[data-where]').filter((b) => !b.hidden).map((b) => b.dataset.where), ['carcass', 'front', 'top', 'apron']);
  ctx.querySelector('[data-where="top"]').click();
  assert.strictEqual(ctx.hidden, true);
  assert.match(sub(), /столешница — Белый премиум W1000 ST9$/);
  // the apron on its own, then back with the worktop
  kq('[data-decor="H1180"]').dispatch('contextmenu', { clientX: 1, clientY: 1 }); ctx.querySelector('[data-where="apron"]').click();
  assert.match(kq('#k-finNow').innerHTML, /Фартук<\/span><span>Дуб Галифакс натуральный H1180 ST37 <button/);
  kq('#k-apronReset').click();
  assert.match(kq('#k-finNow').innerHTML, /Фартук<\/span><span>как столешница/);
  // own colour for the whole cabinet
  const cc = kq('#k-uniColor'); cc.click(); cc.value = '#123456'; cc.dispatch('input');
  assert.match(sub(), /Свой цвет #123456; столешница/);
  assert.strictEqual(kq('#k-ccCode').textContent, '#123456');
  const ec = kq('#k-Ec'); ec.value = '60'; ec.dispatch('input');
  assert.strictEqual(kq('#k-oEc').textContent, '60%');
});

check('кухня (новая): фасады, деталировка, настройки по умолчанию', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  let kp = p.document.querySelector('[data-panel="kitchen"]'), kq = (s) => kp.querySelector(s);
  const pressed = () => kp.querySelectorAll('[data-door]').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.door);
  assert.deepStrictEqual(pressed(), ['closed']);
  kq('[data-door="open"]').click();
  assert.deepStrictEqual(p.run('VIEWS.kitchen.furniture().doors.every(d=>d.t===d.max)'), true);
  // one front closed by hand: nothing pressed, the remembered mode stays
  p.run('(VIEWS.kitchen.furniture().doors[0].t=0, doorsChanged())');
  assert.deepStrictEqual(pressed(), []); assert.strictEqual(p.run('VS.kitchen.fronts'), 'open');
  kq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  const dims = kq('#k-tDims'); dims.checked = false; dims.dispatch('change');
  assert.deepStrictEqual(p.run('[VS.kitchen.fronts, VS.kitchen.dims]'), ['hidden', false]);
  // cut list: every part, grouped by material; the same as CSV
  assert.match(kq('#k-tot').innerHTML, /^<span>65 деталей<\/span>/);
  const csv = kq('#k-csv').value.split('\n');
  assert.strictEqual(csv[0], 'Деталь;Материал;Длина;Ширина;Толщина;Кол-во');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 65);
  assert.ok(kq('#k-cut').querySelectorAll('th.mh').length >= 3, 'groups by material');
  // remembered: cabinets and finishes, without the wall and the ceiling
  const b1 = kq('[data-p="B1"]'); b1.value = '600'; b1.dispatch('input');
  kq('[data-decor="H3154"]').click();
  kq('#k-saveDef').click();
  const saved = JSON.parse(storage.get('apt-kitchen-v2'));
  assert.deepStrictEqual([saved.P.B1, saved.P.Fr, 'W' in saved.P, 'H' in saved.P, saved.FIN.front.decor], [600, 550, false, false, 'H3154']);
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  kp = p.document.querySelector('[data-panel="kitchen"]');
  assert.deepStrictEqual(p.run('(f=>[f.P.B1,f.P.Fr,f.P.W])(VIEWS.kitchen.furniture())'), [600, 550, 2200]);
  assert.match(kq('#kSub').textContent, /Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  kq('#k-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.B1,f.P.Fr])(VIEWS.kitchen.furniture())'), [450, 600]);
  assert.ok(!storage.has('apt-kitchen-v2'));
  assert.match(kq('#kSub').textContent, /корпус — Белый премиум W1000 ST9; фасады — Серый кашемир U702 ST9/);
});

check('shell: вкладки открывают приложение или старые страницы', () => {
  const shellPage = html.slice(html.indexOf('<header'));
  const shown = [];
  const p = runPage('<html>' + shellPage, { hash: '#plan' });
  const fr = (id) => p.document.getElementById('f-' + id);
  const cur = () => p.document.querySelectorAll('[data-tab]').filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.dataset.tab);
  assert.strictEqual(fr('app').hidden, false); assert.strictEqual(fr('app').srcdoc, PAGES.app);
  ['hall', 'bath', 'kitchen'].forEach((t) => assert.strictEqual(fr(t).hidden, true));
  assert.deepStrictEqual(cur(), ['plan']);
  fr('app').contentWindow = { showView: (v) => shown.push(v) };   // the loaded app: the shell switches its view
  p.ctx.location.hash = '#kitchen'; p.ctx.dispatch('hashchange');
  assert.strictEqual(fr('kitchen').hidden, false); assert.strictEqual(fr('kitchen').srcdoc, PAGES.kitchen);
  assert.strictEqual(fr('app').hidden, true); assert.deepStrictEqual(cur(), ['kitchen']);
  p.ctx.location.hash = '#plan'; p.ctx.dispatch('hashchange');
  assert.strictEqual(fr('app').hidden, false); assert.strictEqual(fr('kitchen').hidden, true);
  // the temporary tab of the new kitchen is a view of the same app
  p.ctx.location.hash = '#kitchen-new'; p.ctx.dispatch('hashchange');
  assert.strictEqual(fr('app').hidden, false); assert.strictEqual(fr('kitchen').hidden, true);
  assert.deepStrictEqual(cur(), ['kitchen-new']); assert.strictEqual(p.ctx.appView, 'kitchen');
  assert.deepStrictEqual(shown, ['plan', 'kitchen']);
});

console.log('ok:', checks.length, 'checks\n - ' + checks.join('\n - '));
