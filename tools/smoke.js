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
      // the camera has a real position: the cut-mode rules of the walls look at it
      if (name === 'THREE.PerspectiveCamera') Object.assign(o, { fov: args[0], aspect: args[1], position: new Vec3() });
      // meshes and lines keep what they were made of, so checks can see their materials
      if (['THREE.Mesh', 'THREE.LineSegments', 'THREE.Line'].includes(name)) Object.assign(o, { geometry: args[0], material: args[1] });
      if (name === 'THREE.Sprite') o.material = args[0];
      // objects of the scene have a real place and real children, so checks can see where things stand
      if (['THREE.Mesh', 'THREE.LineSegments', 'THREE.Line', 'THREE.Sprite', 'THREE.Group'].includes(name)) {
        Object.assign(o, { position: new Vec3(), children: [] });
        o.add = (...c) => { c.forEach((x) => { x.parent = o; o.children.push(x); }); return o; };
        o.remove = (...c) => { o.children = o.children.filter((x) => !c.includes(x)); return o; };
      }
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
// a real box: the mini view's part of the apartment
class Box3 {
  constructor(min = new Vec3(), max = new Vec3()) { this.min = min; this.max = max; }
  getCenter(v) { return v.copy(this.min).lerp(this.max, 0.5); }
  getSize(v) { return v.copy(this.max).sub(this.min); }
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
function runPage(html, { hash = '', storage = new Map(), parentWin = {}, reduce = false } = {}) {
  const doc = parseHTML(html), docEl = el('html'), frames = [], clock = { t: 0 };
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
  const THREE = stub('THREE'); THREE.Vector3 = Vec3; THREE.Box3 = Box3;
  const win = {
    THREE, document, localStorage, console, setTimeout, clearTimeout, Math, JSON,
    performance: { now: () => clock.t },   // page time moves only with tick(): 16 ms a frame
    devicePixelRatio: 1, location: { hash }, innerWidth: 1280, innerHeight: 800,
    matchMedia: (q) => ({ matches: reduce && q.includes('reduce'), addEventListener() {} }),
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
  // n frames of ms each; a flight between views takes 0.85 s, so fly() lets it finish
  const tick = (n = 3, ms = 16) => { for (let i = 0; i < n; i++) { clock.t += ms; const q = frames.splice(0); q.forEach((f) => f()); } };
  const fly = () => tick(60);
  return { ctx, doc, document, storage, tick, fly, run: (code) => { const s = vm.runInContext('JSON.stringify(' + code + ')', ctx); return s === undefined ? undefined : JSON.parse(s); } };
}

/* ---------- the built file ---------- */
const root = path.join(__dirname, '..');
// the decor library the shell carries (pages read it from their parent through the bridge)
const decorsCtx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'src/decors.js'), 'utf8'), decorsCtx);
const DECOR_PARENT = Object.fromEntries(['PHOTO_GAIN', 'DECORS', 'PALETTE_WOOD', 'PALETTE_UNI'].map((k) => [k, decorsCtx[k]]));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pi = html.indexOf('const PAGES=');
const PAGES = new Function(html.slice(pi, html.indexOf(';\n', pi) + 1) + 'return PAGES;')();
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

check('страницы в index.html', () => {
  assert.deepStrictEqual(Object.keys(PAGES), ['app']);
  Object.entries(PAGES).forEach(([k, p]) => {
    assert.ok(!/<script src="js\//.test(p), k + ': js/ module left as a link');
    assert.ok(!/<!--include /.test(p), k + ': include left in the page');
  });
});

check('приложение: «Планировка» открывается', () => {
  const p = runPage(PAGES.app, { hash: '#plan' }); p.tick();
  const r = p.run('({view, n:Object.keys(VIEWS), lines:wallLines.length, parts:wallParts.length, fade:VIEWS.plan.fade, vs:VS.plan, doors:doors.map(d=>d.g.visible)})');
  assert.strictEqual(r.view, 'plan');
  assert.deepStrictEqual(r.n, ['plan', 'kitchen', 'bath', 'hall']);
  assert.deepStrictEqual(r.doors, [true, true], 'both doors on the plan');
  assert.strictEqual(r.lines, 12, 'all 12 walls on the plan');
  assert.strictEqual(r.parts, 26, 'wall pieces (19) + window parts (7)');
  assert.deepStrictEqual(r.fade, { entry: '-z', rightOuter: '+x', leftOuter: '-x', window: '+z' });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.vs)), { Wm: 'auto', Wh: 100, dm: 'closed', furn: true, fcut: true, dims: false, names: true, floors: true });
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
  const furn = panel.querySelector('#pFurn'); furn.checked = false; furn.dispatch('change');
  p.document.querySelector('[data-wc="greige"]').click();
  const az = p.document.getElementById('Laz'); az.value = '12'; az.dispatch('input');
  p.tick();
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-plan-v1')), { Wm: 'row', Wh: 100, dm: 'open', furn: false, fcut: true, dims: true, names: true, floors: true });
  assert.deepStrictEqual(JSON.parse(storage.get('apt-shared-v1')), { wc: 'greige', light: { az: 12, el: 45, i: 100, a: 100 }, poche: true, fly: true });
  assert.ok(![...storage.keys()].some((k) => k.startsWith('apt-plan-view')), 'no old plan keys written');
  // reopened: everything comes back
  p = runPage(PAGES.app, { hash: '#plan', storage }); p.tick();
  const r = p.run('({wm:VS.plan.Wm, dm:VS.plan.dm, wc:S.wc, az:S.light.az, open:doors.every(d=>d.t===d.max)})');
  assert.deepStrictEqual({ ...r }, { wm: 'row', dm: 'open', wc: 'greige', az: 12, open: true });
  assert.strictEqual(p.document.getElementById('pFurn').checked, false, 'no cabinets on the plan, as left');
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

check('кухня: стены кухни, обрезанные рамкой, как в старой вкладке', () => {
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

check('кухня: рамка левой стены, переходы и размеры с «Планировки»', () => {
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
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length, doors.map(d=>d.g.visible)]'), ['plan', 12, [true, true]]);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="plan"] #shared'));
  // a size changed on the plan reaches the kitchen
  slide(p, 'kW', 2300);
  p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.875, 0.9, 2.3], 'sink target, kitchen moved 100 left');
  assert.deepStrictEqual(p.run(kitchenWalls).map((w) => w.r), [[-2300, -2100, 1900, 6750], [-2100, 200, 1900, 2000]]);
  assert.match(p.document.getElementById('kSub').textContent, /стена 2300/);
});

check('кухня: детали шкафов совпадают со старой кухней', () => {
  const pLine = PAGES.app.match(/^const P=\{W:2200,H:2600,.*\};$/m)[0];
  const got = new Function(`let T=16, TF=16; const HDF=4, G=2;\n${pLine}\n${fnSource(PAGES.app, 'computeParts')}\nT=P.T||16;TF=P.TF||16;return computeParts(P);`)();
  const want = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/kitchen-parts.json'), 'utf8'));
  assert.strictEqual(got.parts.length, want.parts.length);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(got)), want);
});

check('кухня: шкафы и техника собираются, панель их меняет', () => {
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

check('кухня: шкафы в своей вкладке и на «Планировке», следуют её размерам', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const k = () => p.run('(f=>[f.model.visible, f.model.position.y, f.dims.visible, f.appl.visible])(VIEWS.kitchen.furniture())');
  // on the plan with «Шкафы» (on at first): the kitchen with its appliances, without its dimension lines
  assert.deepStrictEqual(k(), [true, 0, false, true]);
  p.run('showView("kitchen")'); p.fly();
  assert.deepStrictEqual(k(), [true, 0, true, true]);
  // the kitchen's «Стены и техника» off takes the appliances away in the kitchen only: the plan keeps its walls
  const wall = p.document.getElementById('k-tWall'); wall.checked = false; wall.dispatch('change'); p.tick();
  assert.deepStrictEqual(k(), [true, 0, true, false]);
  p.run('showView("plan")'); p.fly();
  assert.deepStrictEqual(k(), [true, 0, false, true]);
  // «Шкафы» off: the kitchen leaves the plan
  const furn = p.document.getElementById('pFurn'); furn.checked = false; furn.dispatch('change'); p.tick();
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().model.visible'), false, 'hidden on the plan');
  slide(p, 'kW', 2300); p.tick();
  p.run('showView("kitchen")'); p.fly();
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().P.W'), 2300);
  assert.match(p.document.getElementById('k-gapBase').textContent, /справа свободно 200 мм/);
  assert.strictEqual(p.document.getElementById('k-W').textContent, '2300 мм');
});

check('кухня: отделка — палитра, меню образца, свой цвет', () => {
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

check('кухня: фасады, деталировка, настройки по умолчанию', () => {
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

// a piece of a wall in the flight: its scale and place (the first piece of that wall standing on the floor)
const piece = (p, id) => p.run(`(w=>({sx:w.m.scale.x, sy:w.m.scale.y, sz:w.m.scale.z, z:w.m.position.z, visible:w.m.visible}))(wallParts.find(w=>w.id==="${id}"&&w.b===0))`);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-3, `${msg}: ${a} ≠ ${b}`);

const bathWalls = 'wallLines.map(l=>({id:l.w.id,r:l.w.r,fade:fadeSide(l.w,VIEWS.bath)}))';

check('санузел: стены ниши, обрезанные рамкой, как в старой вкладке', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  assert.strictEqual(p.run('view'), 'bath');
  // the bath tab (origin −2000, 0): back wall 200 from the left wall's outer face to the partition's outer face (W + 100);
  // left wall 200; partition 100 × 600 next to the tall cabinet; wall 500 × 100 at the niche end; shower partition 300 past it;
  // riser box 250 × 250. The partition hides right of its face, the walls at the niche end past it, as in the bath tab
  assert.deepStrictEqual(p.run(bathWalls), [
    { id: 'entry', r: [-2200, -700, -200, 0], fade: '-z' },
    { id: 'leftOuter', r: [-2200, -2000, 0, 1400], fade: '-x' },
    { id: 'bathStub', r: [-800, -700, 0, 600], fade: '+x' },
    { id: 'nicheEnd', r: [-2000, -1500, 1100, 1200], fade: '+z' },
    { id: 'shower', r: [-1000, -900, 1100, 1400], fade: '+z' },
    { id: 'riser', r: [-2000, -1750, 0, 250], fade: null },
  ]);
  assert.deepStrictEqual(p.run('doors.map(d=>d.g.visible)'), [false, false], 'no doors in the niche');
  const bp = p.document.querySelector('[data-panel="bath"]'), bq = (s) => bp.querySelector(s);
  assert.strictEqual(bp.hidden, false);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="bath"] #shared'), 'light and wall colour moved to the bathroom');
  assert.strictEqual(bq('#bFrameLOut').textContent, 1400);
  assert.strictEqual(bq('#bSub').textContent, 'ниша 1200 × 1100 мм · потолок 2600 мм · корпус — Диамант серый U963 ST9; фасады — Базовый коричневый декор');
  // camera: «3/4» on the first visit, the bath tab's targets moved to the bathroom's place; the sun over the back wall
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.4, 1.3, 0.55]);
  bq('[data-cam="tall"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [-1.275, 1.3, 0.15]);
  assert.deepStrictEqual([...vec(p, 'VIEWS.bath.sun()'), p.run('sunHalf')], [-1.4, 1.3, 0, 3]);
});

check('санузел: детали шкафов совпадают со старым санузлом', () => {
  const mod = PAGES.app.slice(PAGES.app.indexOf('«Санузел» view'));
  const pLine = mod.match(/^const P=\{W:1200,H:2600,.*\};$/m)[0];
  const got = new Function(`let T=16, TF=16; const HDF=4, G=2;\n${pLine}\n${fnSource(mod, 'computeParts')}\nT=P.T||16;TF=P.TF||16;return computeParts(P);`)();
  const want = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/bath-parts.json'), 'utf8'));
  assert.strictEqual(got.parts.length, 34);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(got)), want);
});

check('санузел: шкафы, инсталляция и унитаз собираются, панель их меняет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const want = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/bath-parts.json'), 'utf8'));
  const nDoors = want.parts.filter((x) => x.mat === 'front' && (x.hinge || x.pivot)).length;
  // the installation box, its flush plate, the bowl and the seat: the last group of the bathroom
  const b = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, sani:f.sani.children.map(m=>m.position.y), P:f.P}))(VIEWS.bath.furniture())');
  let r = b();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors, 34, true], 'built on screen, every door on a hinge');
  assert.strictEqual(nDoors, 6, 'four tall cabinet doors, two upper cabinet doors');
  assert.deepStrictEqual(r.sani.map((y) => round(y, 4)), [0.6, 1.0025, 0.22, 0.41]);
  // the panel: sizes, the niche and the ceiling from the plan, what is between the shelves
  assert.strictEqual(bq('[data-p-out="Hi"]').textContent, '1200 мм');
  assert.deepStrictEqual(['#b-W', '#b-L', '#b-H', '#b-R'].map((s) => bq(s).textContent), ['1200 мм', '1100 мм', '2600 мм', '250 × 250 мм']);
  assert.strictEqual(bq('#b-gapB').textContent, 'Высота дверей 1120 мм · между полками 349,3 мм');
  assert.strictEqual(bq('#b-gapM').textContent, 'Высота ниши 300 мм · внутри 268 мм');
  // a higher installation: the box and the bowl's flush plate go up with it
  const hi = bq('[data-p="Hi"]'); hi.value = '1300'; hi.dispatch('input');
  r = b(); assert.deepStrictEqual([r.P.Hi, round(r.sani[0], 3)], [1300, 0.65]);
  // the tall cabinet is never wider than the niche past the riser box
  const wc = bq('[data-p="Wc"]'); wc.value = '1400'; wc.dispatch('input');
  assert.strictEqual(b().P.Wc, 950); assert.strictEqual(wc.value, 950);
  // no niche over the installation: its boards go, its depth is off; feet under the tall cabinet
  const mid = bq('#b-tMid'); mid.checked = false; mid.dispatch('change');
  r = b(); assert.ok(!r.parts.includes('Бок ниши над инсталляцией')); assert.strictEqual(bq('#b-Dm').disabled, true);
  const feet = bq('#b-tFeet'); feet.checked = true; feet.dispatch('change');
  r = b(); assert.deepStrictEqual([r.P.Feet, r.feet], [true, 6]);
  bq('[data-thick="18"][data-for="T"]').click();
  assert.strictEqual(b().P.T, 18);
});

check('санузел: отделка — палитра, меню образца «корпус / фасады», свой цвет', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  const bp = p.document.querySelector('[data-panel="bath"]'), bq = (s) => bp.querySelector(s), sub = () => bq('#bSub').textContent;
  assert.strictEqual(bp.querySelectorAll('[data-decor]').length, DECOR_PARENT.PALETTE_WOOD.length);
  assert.strictEqual(bp.querySelectorAll('[data-uc]').length, DECOR_PARENT.PALETTE_UNI.length);
  assert.ok(matches(bq('#b-ccCard'), '[aria-label="Монотонные декоры"] .cc'), 'own colour card stays with the plain colours');
  // the bath tab's finishes: grey carcass, brown wood fronts
  const tags = (s) => bq(s).querySelector('.tags').innerHTML;
  assert.strictEqual(tags('[data-decor="H1386"]'), '<b>Ф</b>');
  assert.match(bq('#b-finNow').innerHTML, /^<span>Корпус<\/span><span>Диамант серый U963 ST9<\/span><span>Фасады<\/span><span>Базовый коричневый декор<\/span>$/);
  // a click paints the whole cabinet
  bq('[data-decor="H1180"]').click();
  assert.match(sub(), /потолок 2600 мм · Дуб Галифакс натуральный H1180 ST37$/);
  // the swatch menu offers only what the bathroom has: the carcass and the fronts
  const ctx = p.document.getElementById('ctx');
  bq('[data-uc="#F1F0EA"]').dispatch('contextmenu', { clientX: 100, clientY: 100 });
  assert.deepStrictEqual(ctx.querySelectorAll('[data-where]').filter((b) => !b.hidden).map((b) => b.dataset.where), ['carcass', 'front']);
  ctx.querySelector('[data-where="front"]').click();
  assert.match(sub(), /корпус — Дуб Галифакс натуральный H1180 ST37; фасады — Белый премиум W1000 ST9$/);
  // own colour for the whole cabinet; contrast of the end faces
  const cc = bq('#b-uniColor'); cc.click(); cc.value = '#123456'; cc.dispatch('input');
  assert.match(sub(), /мм · Свой цвет #123456$/);
  assert.strictEqual(bq('#b-ccCode').textContent, '#123456');
  const ec = bq('#b-Ec'); ec.value = '60'; ec.dispatch('input');
  assert.deepStrictEqual([bq('#b-oEc').textContent, p.run('VIEWS.bath.furniture().P.Ec')], ['60%', 60]);
});

check('санузел: фасады, размеры, деталировка, настройки по умолчанию', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  let bp = p.document.querySelector('[data-panel="bath"]');
  const bq = (s) => bp.querySelector(s);
  const pressed = () => bp.querySelectorAll('[data-door]').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.door);
  // the bath tab's 13 dimension lines (a line and a label each), hidden in a flight
  assert.strictEqual(p.run('VIEWS.bath.furniture().dims.children.length'), 26);
  assert.strictEqual(bq('#b-sizesBox').open, true, 'the sizes are open, as in the bath tab');
  assert.deepStrictEqual(pressed(), ['closed']);
  bq('[data-door="open"]').click();
  assert.strictEqual(p.run('VIEWS.bath.furniture().doors.every(d=>d.t===d.max)'), true);
  // one door closed by hand: nothing pressed, the remembered mode stays
  p.run('(VIEWS.bath.furniture().doors[0].t=0, doorsChanged())');
  assert.deepStrictEqual(pressed(), []); assert.strictEqual(p.run('VS.bath.fronts'), 'open');
  bq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  // the walls toggle takes the walls, the installation and the toilet away
  const walls = bq('#b-tWall'); walls.checked = false; walls.dispatch('change'); p.tick();
  assert.deepStrictEqual(p.run('[wallGroup.visible, VS.bath.walls]'), [false, false]);
  const dims = bq('#b-tDims'); dims.checked = false; dims.dispatch('change');
  assert.deepStrictEqual(p.run('[VS.bath.fronts, VS.bath.dims]'), ['hidden', false]);
  // cut list: every part, grouped by material; the same as CSV
  assert.match(bq('#b-tot').innerHTML, /^<span>34 детали?<\/span>|^<span>34 деталей<\/span>/);
  const csv = bq('#b-csv').value.split('\n');
  assert.strictEqual(csv[0], 'Деталь;Материал;Длина;Ширина;Толщина;Кол-во');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 34);
  assert.strictEqual(bq('#b-cut').querySelectorAll('th.mh').length, 2, 'carcass and fronts');
  // feet are listed under the parts
  const feet = bq('#b-tFeet'); feet.checked = true; feet.dispatch('change');
  assert.match(bq('#b-tot').innerHTML, /Опоры регулируемые М6, шайба Ø15×5: 6 шт/);
  // remembered: cabinets and finishes, without the niche, the ceiling and the riser box
  const hi = bq('[data-p="Hi"]'); hi.value = '1300'; hi.dispatch('input');
  bq('[data-decor="H3154"]').click();
  bq('#b-saveDef').click();
  const saved = JSON.parse(storage.get('apt-bath-v2'));
  assert.deepStrictEqual([saved.P.Hi, saved.P.Feet, ['W', 'L', 'H', 'Rx', 'Rz', 'Lt'].some((k) => k in saved.P), saved.FIN.front.decor], [1300, true, false, 'H3154']);
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  bp = p.document.querySelector('[data-panel="bath"]');
  assert.deepStrictEqual(p.run('(f=>[f.P.Hi,f.P.Feet,f.P.W])(VIEWS.bath.furniture())'), [1300, true, 1200]);
  assert.match(bq('#bSub').textContent, /Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  bq('#b-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.Hi,f.P.Feet])(VIEWS.bath.furniture())'), [1200, false]);
  assert.strictEqual(bq('#b-tFeet').checked, false);
  assert.ok(!storage.has('apt-bath-v2'));
  assert.match(bq('#bSub').textContent, /корпус — Диамант серый U963 ST9; фасады — Базовый коричневый декор$/);
});

check('санузел: без «Шкафов» на плане — только в своей вкладке, поднимаются из пола, следуют «Планировке»', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  assert.strictEqual(p.run('VIEWS.bath.furniture().model'), null, 'not built while the bathroom is not in the scene');
  p.run('showView("bath")'); p.tick(25, 17);
  const m = p.run('(f=>({y:f.model.position.y, s:presence("bath")}))(VIEWS.bath.furniture())');
  near(m.s, 0.5, 'halfway'); near(m.y, -1.35, 'halfway up out of the floor');
  p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.model.visible, f.model.position.y])(VIEWS.bath.furniture())'), [true, 0]);
  p.run('showView("plan")'); p.fly();
  assert.strictEqual(p.run('VIEWS.bath.furniture().model.visible'), false, 'hidden on the plan');
  p.run('setModel({bL:1200, H:2700})'); p.tick();
  p.run('showView("bath")'); p.fly();
  // the installation fills the rest of the left wall: 1200 − 300 = 900
  assert.deepStrictEqual(p.run('(f=>[f.P.L, f.P.H, f.P.Lt])(VIEWS.bath.furniture())'), [1200, 2700, 900]);
  assert.strictEqual(p.document.getElementById('b-H').textContent, '2700 мм');
});

check('санузел: рамка левой стены, размеры с «Планировки», перелёт', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'bath' } }); p.tick();
  const bq = (s) => p.document.querySelector('[data-panel="bath"]').querySelector(s);
  const fl = bq('#bFrameL');
  fl.value = '1900'; fl.dispatch('input');
  // up to the kitchen wall: the whole shower partition, a piece of the vent shaft wall
  const w = p.run(bathWalls);
  assert.deepStrictEqual(w.find((x) => x.id === 'leftOuter').r, [-2200, -2000, 0, 1900]);
  assert.deepStrictEqual(w.find((x) => x.id === 'shower').r, [-1000, -900, 1100, 1900]);
  assert.deepStrictEqual(w.find((x) => x.id === 'shaft').r, [-900, -700, 1400, 1500]);
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-bath-v1')), { Wm: 'auto', Wh: 100, L: 1900, sizes: true, fronts: 'closed', dims: true, walls: true, edges: true });
  // the plan makes the niche wider: the frame, the partition, the cabinets and the panel follow
  p.run('setModel({bNiche:1300})'); p.tick();
  assert.deepStrictEqual(p.run(bathWalls).find((x) => x.id === 'bathStub').r, [-700, -600, 0, 600]);
  assert.deepStrictEqual(p.run(bathWalls)[0].r, [-2200, -600, -200, 0]);
  assert.strictEqual(p.run('VIEWS.bath.furniture().P.W'), 1300);
  assert.match(bq('#bSub').textContent, /^ниша 1300 × 1100 мм/);
  // a flight to the plan and back
  p.run('showView("plan")'); assert.strictEqual(p.run('inTransition()'), true); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['plan', 12]);
  p.run('showView("bath")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['bath', 7]);
});

const hallWalls = 'wallLines.map(l=>({id:l.w.id,r:l.w.r,fade:fadeSide(l.w,VIEWS.hall)}))';

check('прихожая: несущая стена с входной дверью и боковые стены, обрезанные рамкой, как в старой вкладке', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  assert.strictEqual(p.run('view'), 'hall');
  // the hall tab: the bearing wall 200 from 100 left of the left wall to 200 right of the hall (the outer wall), the opening in it;
  // the side walls up to Sd = 650 from it; each hides from outside, as in the hall tab
  assert.deepStrictEqual(p.run(hallWalls), [
    { id: 'entry', r: [-100, 1400, -200, 0], fade: '-z' },
    { id: 'rightOuter', r: [1200, 1400, 0, 650], fade: '+x' },
    { id: 'hallBath', r: [-100, 0, 0, 650], fade: '-x' },
  ]);
  assert.deepStrictEqual(p.run('doors.map(d=>d.g.visible)'), [true, false], 'the entrance door of the model; the bathroom door is past the frame');
  const hp = p.document.querySelector('[data-panel="hall"]'), hq = (s) => hp.querySelector(s);
  assert.strictEqual(hp.hidden, false);
  assert.ok(matches(p.document.getElementById('shared'), '[data-panel="hall"] #shared'), 'light and wall colour moved to the hall');
  assert.strictEqual(hq('#hFrameSdOut').textContent, 650);
  assert.strictEqual(hq('#hSub').textContent, '1200 × 2600 × 400 мм · Базовый коричневый декор');
  // the opening left between the claddings, as the hall tab showed it
  assert.strictEqual(hq('#h-chips').innerHTML, '<span class="chip">ширина 860 мм</span><span class="chip">высота 2000 мм</span>');
  // camera: «3/4» on the first visit at the hall tab's target; the mezzanine; the sun over the middle of the cabinet
  assert.deepStrictEqual(vec(p, 'goalT'), [0.6, 1.3, 0.16]);
  hq('[data-cam="mezz"]').click();
  assert.deepStrictEqual(vec(p, 'goalT'), [0.6, 2.3, 0.2]);
  assert.deepStrictEqual([...vec(p, 'VIEWS.hall.sun()'), p.run('sunHalf')], [0.6, 1.3, 0, 3]);
});

check('прихожая: детали шкафа совпадают со старой прихожей', () => {
  const mod = PAGES.app.slice(PAGES.app.indexOf('«Прихожая» view'));
  const pLine = mod.match(/^const P=\{W:1200,H:2600,.*\};$/m)[0];
  const got = new Function(`let T=16, TF=16; const HDF=4, G=2;\n${pLine}\n${fnSource(mod, 'computeParts')}\nT=P.T||16;TF=P.TF||16;return computeParts(P);`)();
  const want = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/hall-parts.json'), 'utf8'));
  assert.strictEqual(got.parts.length, 36);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(got)), want);
  // in the app the same sizes come from the walls: the default opening gives the hall tab's false panel, column and mezzanine
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.W,f.P.Lw,f.P.Rw,f.P.Ht,f.P.Rv,f.current.parts.length])(VIEWS.hall.furniture())'), [1200, 100, 240, 600, 100, 36]);
});

check('прихожая: шкаф-портал собирается, «Состав» и размеры его меняют, проём остаётся', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'hall' } }); p.tick();
  const hq = (s) => p.document.querySelector('[data-panel="hall"]').querySelector(s);
  const want = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/hall-parts.json'), 'utf8'));
  const nDoors = want.parts.filter((x) => x.mat === 'front' && (x.hinge || x.pivot)).length;
  const h = () => p.run('(f=>({doors:f.doors.length, parts:f.current.parts.map(x=>x.name), feet:f.current.FL?f.current.feet.length:0, visible:f.model&&f.model.visible, P:f.P}))(VIEWS.hall.furniture())');
  let r = h();
  assert.deepStrictEqual([r.doors, r.parts.length, r.visible], [nDoors, 36, true], 'built on screen, every door on a hinge');
  assert.strictEqual(nDoors, 3, 'three mezzanine doors');
  // the panel: what comes from the plan, the cabinet sizes, the space between the shelves
  assert.deepStrictEqual(['W', 'Hc', 'Rv', 'Ht', 'Lw', 'Rw'].map((k) => hq('#h-' + k).textContent), ['1200 мм', '2600 мм', '100 мм', '600 мм', '100 мм', '240 мм']);
  assert.strictEqual(hq('#h-shelfGap').textContent, 'Между полками 301,3 мм · секций 6');
  assert.strictEqual(hq('#h-sizesBox').open, true, 'the sizes are open, as in the hall tab');
  // the height: from the mezzanine's least (the opening's top + 300) to the ceiling
  const hs = hq('[data-p="H"]');
  assert.deepStrictEqual([hs.min, hs.max], [2300, 2600]);
  hs.value = '2400'; hs.dispatch('input');
  r = h(); assert.deepStrictEqual([r.P.H, r.P.Ht], [2400, 400]);
  hs.value = '2100'; hs.dispatch('input');
  r = h(); assert.deepStrictEqual([r.P.H, r.P.Ht, hs.value], [2300, 300, 2300]);
  // no reveal cladding: its boards go, the false panel and the column shrink to the opening, the mezzanine goes down to it
  const rev = hq('#h-tReveal'); rev.checked = false; rev.dispatch('change');
  // (the cabinet was at its least: it grows by the board, so the mezzanine stays 300)
  r = h(); assert.deepStrictEqual([r.P.Lw, r.P.Rw, r.P.Ht, r.P.H], [84, 224, 300, 2316]);
  assert.ok(!r.parts.includes('Обрамление откоса левое'));
  assert.strictEqual(hq('#h-Lw').textContent, '84 мм');
  rev.checked = true; rev.dispatch('change');
  // thicker boards: the cladding is thicker, the false panel and the column grow with it
  hq('[data-thick="18"][data-for="T"]').click();
  r = h(); assert.deepStrictEqual([r.P.T, r.P.Lw, r.P.Rw], [18, 102, 242]);
  // no plinth: its board goes, its height is off; feet under both columns
  const pl = hq('#h-tPlinth'); pl.checked = false; pl.dispatch('change');
  r = h(); assert.ok(!r.parts.includes('Цоколь правой колонны (со стороны проёма)')); assert.strictEqual(hq('#h-Pl').disabled, true);
  const feet = hq('#h-tFeet'); feet.checked = true; feet.dispatch('change');
  assert.deepStrictEqual([h().P.Feet, h().feet], [true, 8]);
});

check('прихожая: без «Шкафов» на плане — только в своей вкладке, поднимается из пола, не выше потолка', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  assert.strictEqual(p.run('VIEWS.hall.furniture().model'), null, 'not built while the hall is not in the scene');
  p.run('showView("hall")'); p.tick(25, 17);
  const m = p.run('(f=>({y:f.model.position.y, s:presence("hall")}))(VIEWS.hall.furniture())');
  near(m.s, 0.5, 'halfway'); near(m.y, -1.35, 'halfway up out of the floor');
  p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.model.visible, f.model.position.y])(VIEWS.hall.furniture())'), [true, 0]);
  p.run('showView("plan")'); p.fly();
  assert.strictEqual(p.run('VIEWS.hall.furniture().model.visible'), false, 'hidden on the plan');
  // a lower ceiling takes the cabinet down with it
  p.run('setModel({H:2500})'); p.tick();
  p.run('showView("hall")'); p.fly();
  assert.deepStrictEqual(p.run('(f=>[f.P.H, f.P.Ht])(VIEWS.hall.furniture())'), [2500, 500]);
  assert.strictEqual(p.document.getElementById('h-Hc').textContent, '2500 мм');
});

check('прихожая: отделка, фасады, входная дверь, «Стена и дверь», размеры, деталировка, настройки по умолчанию', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'hall' } }); p.tick();
  let hp = p.document.querySelector('[data-panel="hall"]');
  const hq = (s) => hp.querySelector(s), sub = () => hq('#hSub').textContent;
  const pressed = () => hp.querySelectorAll('[data-door]').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.door);
  // finishes: the hall tab's brown decor on both; the swatch menu has the carcass and the fronts only
  assert.strictEqual(hq('[data-decor="H1386"]').querySelector('.tags').innerHTML, '<b>К</b><b>Ф</b>');
  {
    const ctx = p.document.getElementById('ctx');
    hq('[data-uc="#F1F0EA"]').dispatch('contextmenu', { clientX: 100, clientY: 100 });
    assert.deepStrictEqual(ctx.querySelectorAll('[data-where]').filter((b) => !b.hidden).map((b) => b.dataset.where), ['carcass', 'front']);
    ctx.querySelector('[data-where="front"]').click();
    assert.match(sub(), /мм · корпус — Базовый коричневый декор; фасады — Белый премиум W1000 ST9$/);
  }
  // the hall tab's six dimension lines (a line and a label each)
  assert.strictEqual(p.run('VIEWS.hall.furniture().dims.children.length'), 12);
  // fronts
  assert.deepStrictEqual(pressed(), ['closed']);
  hq('[data-door="open"]').click();
  assert.strictEqual(p.run('VIEWS.hall.furniture().doors.every(d=>d.t===d.max)'), true);
  hq('[data-door="hidden"]').click(); assert.deepStrictEqual(pressed(), ['hidden']);
  // the entrance door of the model: the box opens it, a click on the door ticks the box
  const entry = hq('#h-tEntry');
  assert.strictEqual(entry.checked, false);
  entry.checked = true; entry.dispatch('change');
  assert.strictEqual(p.run('entranceDoor().t===entranceDoor().max'), true);
  p.run('(entranceDoor().t=0, doorsChanged())');
  assert.strictEqual(entry.checked, false);
  // «Стена и дверь» off: the walls, the entrance door and its swing go
  const walls = hq('#h-tWall'); walls.checked = false; walls.dispatch('change'); p.tick();
  assert.deepStrictEqual(p.run('[wallGroup.visible, doorGroup.visible, arcs.visible]'), [false, false, false]);
  walls.checked = true; walls.dispatch('change'); p.tick();
  assert.deepStrictEqual(p.run('[wallGroup.visible, doorGroup.visible]'), [true, true]);
  // cut list: every part; the same as CSV
  assert.match(hq('#h-tot').innerHTML, /^<span>36 деталей<\/span>/);
  const csv = hq('#h-csv').value.split('\n');
  assert.strictEqual(csv.slice(1).reduce((s, l) => s + +l.split(';')[5], 0), 36);
  // a narrow opening on the plan: the chip warns
  p.run('setModel({eD0:150, eD1:900})'); p.tick();
  assert.match(hq('#h-chips').innerHTML, /<span class="chip warn">ширина 718 мм · мало для двери 800×2000<\/span>/);
  p.run('setModel({})'); p.tick();
  // remembered: the cabinet and its finishes, without what follows the walls
  const hs = hq('[data-p="H"]'); hs.value = '2500'; hs.dispatch('input');
  hq('[data-decor="H3154"]').click();
  hq('#h-saveDef').click();
  const saved = JSON.parse(storage.get('apt-hall-v2'));
  assert.deepStrictEqual([saved.P.H, ['W', 'Lw', 'Rw', 'Ht', 'Rv'].some((k) => k in saved.P), saved.FIN.front.decor], [2500, false, 'H3154']);
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'hall' } }); p.tick();
  hp = p.document.querySelector('[data-panel="hall"]');
  assert.deepStrictEqual(p.run('(f=>[f.P.H,f.P.Ht,f.P.Lw])(VIEWS.hall.furniture())'), [2500, 500, 100]);
  assert.match(sub(), /^1200 × 2500 × 400 мм · Дуб Чарльстон тёмно-коричневый/);
  assert.deepStrictEqual(pressed(), ['hidden'], 'the view remembers the fronts taken off');
  hq('#h-resetDef').click();
  assert.deepStrictEqual(p.run('(f=>[f.P.H,f.P.Ht])(VIEWS.hall.furniture())'), [2600, 600]);
  assert.ok(!storage.has('apt-hall-v2'));
  assert.strictEqual(sub(), '1200 × 2600 × 400 мм · Базовый коричневый декор');
});

check('прихожая: шкаф следует проёму с «Планировки», откос — размер двери, рамка боковых стен', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  // the opening moves and grows on the plan: the false panel and the column reach its sides, the mezzanine sits on its top
  p.run('setModel({eD0:150, eD1:1000, eDH:2100})'); p.tick();
  assert.deepStrictEqual(p.run('(f=>[f.P.Lw,f.P.Rw,f.P.Ht])(VIEWS.hall.furniture())'), [166, 216, 516]);
  // the door frame sits as deep as the reveal; the plan's slider stops where the 70 mm frame leaves the 200 mm wall
  slide(p, 'eRv', 300); p.tick();
  assert.strictEqual(p.run('A.eRv'), 130);
  assert.deepStrictEqual([p.run('VIEWS.hall.furniture().P.Rv'), round(p.run('doors[0].g.position.z'), 3)], [130, -0.2]);
  // the side walls up to the kitchen wall: the whole bathroom doorway, so its door shows too
  p.run('showView("hall")'); p.fly();
  const sd = p.document.getElementById('hFrameSd'); sd.value = '1900'; sd.dispatch('input');
  assert.deepStrictEqual(p.run(hallWalls).find((x) => x.id === 'hallBath').r, [-100, 0, 0, 1900]);
  assert.deepStrictEqual(p.run('doors.map(d=>d.g.visible)'), [true, true]);
  assert.deepStrictEqual(JSON.parse(storage.get('apt-view-hall-v1')), { Wm: 'auto', Wh: 100, Sd: 1900, sizes: true, fronts: 'closed', dims: true, walls: true, edges: true });
  // a flight to the bathroom and back
  p.run('showView("bath")'); p.fly();
  assert.strictEqual(p.run('view'), 'bath');
  p.run('showView("hall")'); p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length]'), ['hall', 3]);
});

check('«Планировка»: шкафы всех комнат по галочке «Шкафы», строятся, только когда видны', () => {
  const storage = new Map([['apt-view-plan-v1', JSON.stringify({ furn: false })]]);
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const rooms = '["kitchen","bath","hall"]';
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model)`), [null, null, null], 'off: nothing built');
  const furn = p.document.getElementById('pFurn'); furn.checked = true; furn.dispatch('change'); p.tick();
  // on: every room stands on the floor where it lies on the plan, without its dimension lines
  const at = () => p.run(`${rooms}.map(k=>{const f=VIEWS[k].furniture(),m=f.model,o=ROOMS.find(r=>r.id===k).origin;return [m.visible, m.position.y, f.dims.visible, m.position.x-o[0]*MM, m.position.z-o[1]*MM];})`);
  at().forEach((r) => { assert.deepStrictEqual(r.slice(0, 3), [true, 0, false]); near(r[3], 0, 'x'); near(r[4], 0, 'z'); });
  assert.strictEqual(JSON.parse(storage.get('apt-view-plan-v1')).furn, true);
  // a wall moved elsewhere only moves a room's cabinets; its own sizes build them anew
  p.run(`${rooms}.forEach(k=>{VIEWS[k].furniture().model.userData.tag=k;})`);
  p.run('setModel({hL1:APT_A.hL1+100})'); p.tick();
  at().forEach((r) => { near(r[3], 0, 'x'); near(r[4], 0, 'z'); });
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model.userData.tag)`), ['kitchen', 'bath', 'hall'], 'moved, not rebuilt');
  p.run('setModel({hL1:APT_A.hL1+100, kW:2300})'); p.tick();
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model.userData.tag)`), [null, 'bath', 'hall'], 'the kitchen rebuilt');
  assert.strictEqual(p.run('VIEWS.kitchen.furniture().P.W'), 2300);
  // the fronts swing on the plan too; the kitchen tab knows they are open and remembers it
  p.run('(VIEWS.kitchen.furniture().doors.forEach(d=>d.t=DMAX), doorsChanged())'); p.tick(80, 16.67);
  near(p.run('VIEWS.kitchen.furniture().doors[0].a'), p.run('DMAX'), 'open');
  assert.deepStrictEqual([p.run('VS.kitchen.fronts'), JSON.parse(storage.get('apt-view-kitchen-v1')).fronts], ['open', 'open']);
  assert.strictEqual(p.document.querySelector('[data-panel="kitchen"] [data-door="open"]').getAttribute('aria-pressed'), 'true');
  // back from a room the others rise out of the floor again
  p.run('showView("bath")'); p.fly();
  assert.deepStrictEqual(p.run(`${rooms}.map(k=>VIEWS[k].furniture().model.visible)`), [false, true, false]);
  p.run('showView("plan")'); p.tick(25, 17);
  near(p.run('VIEWS.kitchen.furniture().model.position.y'), -1.35, 'the kitchen halfway up');
  p.fly();
  at().forEach((r) => assert.deepStrictEqual(r.slice(0, 3), [true, 0, false]));
});

check('«Планировка»: «Резать шкафы по стенам» — срез на высоте стен, в «Контурах» след на полу', () => {
  const storage = new Map();
  const p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const plan = p.document.querySelector('[data-panel="plan"]'), rooms = ['kitchen', 'bath', 'hall'];
  // the top plane of a room (m), its footprint shown, its opacity
  const cut = (k) => p.run(`(f=>[f.clip[1].constant, f.foot.visible, f.foot.material.opacity])(VIEWS.${k}.furniture())`);
  assert.strictEqual(plan.querySelector('#pFurnCut').checked, true);
  near(cut('kitchen')[0], 2.6, '«Разрез» at 100 %: up to the ceiling, whole');
  // «Ряд»: every room cut at the walls' 10 %
  plan.querySelector('[data-wm="row"]').click(); p.tick();
  rooms.forEach((k) => { const c = cut(k); near(c[0], 0.26, k); assert.strictEqual(c[1], false); });
  // the walls' height slider
  plan.querySelector('[data-wm="show"]').click();
  const wh = plan.querySelector('[data-wh]'); wh.value = '50'; wh.dispatch('input'); p.tick();
  near(cut('hall')[0], 1.3, 'half the ceiling');
  // «Контуры»: nothing of the cabinets stands, their footprints are on the floor
  plan.querySelector('[data-wm="outline"]').click(); p.tick();
  rooms.forEach((k) => assert.deepStrictEqual(cut(k), [0, true, 1]));
  // to the kitchen: it grows whole and its footprint fades; the bathroom sinks cut as it was, its footprint stays on the floor and fades
  p.run('showView("kitchen")'); p.tick(25, 17);
  const c = cut('kitchen'); near(c[0], 2.65 / 2, 'the kitchen halfway up'); near(c[2], 0.5, 'its footprint');
  const b = p.run('(f=>[f.clip[1].constant, f.model.position.y, f.foot.material.opacity, f.foot.position.y+f.model.position.y])(VIEWS.bath.furniture())');
  near(b[1], -1.35, 'the bathroom halfway down'); near(b[0], b[1], 'cut at the floor, going down with it');
  near(b[2], 0.5, 'its footprint fades'); near(b[3], 0.003, 'on the floor');
  p.fly();
  assert.deepStrictEqual(cut('kitchen').slice(1), [false, 0]); near(cut('kitchen')[0], 2.65, 'whole in its own view');
  // off: whole on the plan whatever the walls; remembered; greyed out without the cabinets
  p.run('showView("plan")'); p.fly();
  const box = plan.querySelector('#pFurnCut'); box.checked = false; box.dispatch('change'); p.tick();
  assert.deepStrictEqual(cut('bath').slice(1), [false, 0]); near(cut('bath')[0], 2.65, 'whole');
  assert.strictEqual(JSON.parse(storage.get('apt-view-plan-v1')).fcut, false);
  const furn = plan.querySelector('#pFurn'); furn.checked = false; furn.dispatch('change');
  assert.strictEqual(box.disabled, true);
});

check('перелёт «Планировка» → «Кухня»: стены, шкафы, солнце и камера движутся вместе', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  // the plan is seen from the window side: the window wall is hidden by its cut-mode rule
  assert.strictEqual(piece(p, 'window').visible, false);
  const c0 = p.run('({theta:cam.theta, r:cam.r})');
  // the mini view: from the whole apartment to the kitchen's frame, with the rest of the flight, without a jump
  const inset = () => p.run('insetNow()'), b0 = inset(), bT = p.run('insetFrame(VIEWS.kitchen)');
  assert.deepStrictEqual(b0.map(Math.round), p.run('[BOX.x0, BOX.x1, BOX.z0, BOX.z1]'));
  p.run('showView("kitchen")');
  inset().forEach((v, i) => near(v, b0[i], 'the mini view does not jump at the start'));
  const g = p.run('({theta:goal.theta, r:goal.r})');
  // in the flight: the walls of both views with their outlines, nothing to click, the camera driven by the flight
  assert.deepStrictEqual(p.run('[inTransition(), wallLines.length, wallParts.length, camDrive!==null, pickDoor({clientX:0,clientY:0})]'), [true, 12, 26, true, null]);
  p.tick(25, 17);   // 425 ms of 850: halfway, the eased progress is 0.5 too
  near(p.run('tr.e'), 0.5, 'progress');
  // a wall hidden on the plan and not in the kitchen stays hidden all the way (it does not pop up to sink again)
  assert.strictEqual(piece(p, 'window').visible, false, 'hidden window wall stays hidden');
  // the left wall shrinks from the whole wall (z 0…6750) to the kitchen's frame (1900…3350): now 950…5050;
  // the kitchen's 3/4 camera is left of it, so the kitchen's cut mode hides it: it also goes down, halfway now
  const lo = piece(p, 'leftOuter');
  near(lo.sz, 4100 / 6750, 'left wall length'); near(lo.z, 3.0, 'left wall centre'); near(lo.sy, 0.5, 'left wall height');
  // a wall that is not in the kitchen is halfway down; the kitchen wall stays
  near(piece(p, 'hallBath').sy, 0.5, 'hall/bath wall height'); near(piece(p, 'kitchen').sy, 1, 'kitchen wall height');
  // footprints fade between the views: half gone under a wall that leaves, whole under one that stays; walls high above the floor are solid
  const mat = (id, k) => p.run(`morph.mats.get("${id}").${k}.opacity`);
  near(mat('hallBath', 'foot'), 0.5, 'leaving footprint'); near(mat('window', 'foot'), 0.5, 'footprint of the hidden window wall');
  near(mat('kitchen', 'foot'), 1, 'kitchen wall footprint'); near(mat('hallBath', 'body'), 1, 'a wall 1.3 m high');
  // the plan shows the cabinets: the kitchen's stay where they are, the bathroom's and the hall's are halfway into the floor;
  // the sun's shadows close in on the kitchen, the camera is halfway
  const k = p.run('({s:presence("kitchen"), y:VIEWS.kitchen.furniture().model.position.y, sb:presence("bath"), yb:VIEWS.bath.furniture().model.position.y, sh:presence("hall"), half:sunHalf, theta:cam.theta, r:cam.r})');
  near(k.s, 1, 'kitchen presence'); near(k.y, 0, 'kitchen on the floor'); near(k.half, 3.8, 'shadow box');
  near(k.sb, 0.5, 'bathroom presence'); near(k.yb, -1.35, 'bathroom below the floor'); near(k.sh, 0.5, 'hall presence');
  near(k.theta, (c0.theta + g.theta) / 2, 'camera angle'); near(k.r, (c0.r + g.r) / 2, 'camera distance');
  inset().forEach((v, i) => near(v, (b0[i] + bT[i]) / 2, 'the mini view halfway'));
  p.tick(24, 16.67);   // ≈ 0.97 of the flight: the leaving walls are below 1 cm
  const lowCut = p.run('morphWall(morph.w.get("hallBath"),morph.e).cut');
  assert.ok(lowCut > 1 && lowCut < 40, 'a low wall ' + lowCut);
  near(mat('hallBath', 'body'), lowCut / 150, 'low wall fades'); near(mat('hallBath', 'cap'), lowCut / 150, 'its dark top too');
  assert.ok(mat('hallBath', 'foot') < 0.1 && mat('hallBath', 'line') < 0.05, 'footprint and outline almost gone');
  // landed: the kitchen's own walls with outlines, the kitchen on the floor, the camera free; the left wall hidden by the
  // cut mode just as the flight ended it
  p.fly();
  const r = p.run('({tr:inTransition(), lines:wallLines.length, parts:wallParts.length, y:VIEWS.kitchen.furniture().model.position.y, half:sunHalf, drive:camDrive, theta:cam.theta, goal:goal.theta})');
  assert.deepStrictEqual([r.tr, r.lines, r.parts, r.y, r.half, r.drive], [false, 2, 2, 0, 3, null]);
  near(r.theta, r.goal, 'camera at the goal');
  inset().forEach((v, i) => near(v, bT[i], 'the mini view on the kitchen'));
  assert.deepStrictEqual([piece(p, 'leftOuter').visible, piece(p, 'kitchen').visible], [false, true]);
  // the flight's own materials are gone: the walls are back on the shared ones (the wall colour setting reaches them)
  assert.deepStrictEqual(p.run('[morph, wallParts.every(w=>w.m.material[0]===wallMat&&w.m.material[2]===capMat), wallFeet.every(f=>f.m.material===footMat)]'), [null, true, true]);
});

check('перелёт: разный вид стен у вкладок — высота и «Скелет» меняются плавно', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  const plan = p.document.querySelector('[data-panel="plan"]');
  plan.querySelector('[data-wm="row"]').click(); p.tick();   // the plan in «Ряд»: walls 10 % high
  p.run('showView("kitchen")'); p.tick(25, 17);
  near(piece(p, 'kitchen').sy, (260 + (2600 - 260) / 2) / 2600, 'kitchen wall grows from 10 % to full');
  p.fly();
  p.run('showView("plan")'); p.fly();
  plan.querySelector('[data-wm="skeleton"]').click(); p.tick();
  assert.strictEqual(p.run('wallMat.opacity'), 0);
  p.run('showView("kitchen")'); p.tick(25, 17);
  near(p.run('wallMat.opacity'), 0.5, 'see-through skeleton turns solid gradually');
  p.fly();
  assert.strictEqual(p.run('wallMat.opacity'), 1);
});

check('перелёт: прерывание, мышь забирает камеру, «уменьшить движение»', () => {
  let p = runPage(PAGES.app, { parentWin: { appView: 'plan' } }); p.tick();
  p.run('showView("kitchen")'); p.tick(25, 17);
  // back to the plan in the middle: the new flight starts from what is on screen
  p.run('showView("plan")');
  assert.deepStrictEqual(p.run('[morph.w.get("leftOuter").rF, morph.w.get("leftOuter").rT]').map((r) => r.map(Math.round)), [[-2200, -2000, 950, 5050], [-2200, -2000, 0, 6750]]);
  near(p.run('morph.w.get("leftOuter").cF'), 1300, 'the left wall starts from halfway down');
  near(p.run('tr.pres0.bath'), 0.5, 'the bathroom starts from halfway');
  p.fly();
  assert.deepStrictEqual(p.run('[view, wallLines.length, presence("bath"), VIEWS.bath.furniture().model.position.y]'), ['plan', 12, 1, 0]);
  // a drag takes the camera back; the walls finish their flight
  p.run('showView("kitchen")'); p.tick(5);
  const c = p.document.getElementById('c');
  c.dispatch('pointerdown', { pointerId: 1, clientX: 10, clientY: 10, button: 0, pointerType: 'mouse' });
  c.dispatch('pointermove', { pointerId: 1, clientX: 40, clientY: 10 });
  c.dispatch('pointerup', { pointerId: 1, clientX: 40, clientY: 10, button: 0 });
  assert.deepStrictEqual(p.run('[camDrive, inTransition()]'), [null, true]);
  p.fly();
  assert.deepStrictEqual(p.run('[inTransition(), wallLines.length]'), [false, 2]);
  // reduced motion: no flight, the kitchen at once
  p = runPage(PAGES.app, { parentWin: { appView: 'plan' }, reduce: true }); p.tick();
  p.run('showView("kitchen")');
  assert.deepStrictEqual(p.run('[inTransition(), wallLines.length]'), [false, 2]);
});

check('перелёт «Санузел» → «Прихожая»: входная дверь едет вместе с несущей стеной, а не появляется сразу', () => {
  const p = runPage(PAGES.app, { parentWin: { appView: 'bath' } }); p.tick();
  assert.deepStrictEqual(p.run('entranceDoor().g.visible'), false, 'the opening is past the bathroom frame');
  p.run('showView("hall")');
  // the door shows from the start of the flight (its opening is whole in the hall), cut to the wall's rect on the way
  const leaf = 'entranceDoor().g.children[0].material';
  assert.strictEqual(p.run('entranceDoor().g.visible'), true);
  assert.strictEqual(p.run(`${leaf}.clippingPlanes===morph.doorClips.find(c=>c.id==="entry").planes`), true);
  assert.strictEqual(p.run('arcs.children.filter(l=>l.userData.hole==="entry:0").every(l=>l.material.clippingPlanes===morph.doorClips[0].planes)'), true, 'its swing too');
  // the bearing wall goes from the niche (x −2200…−700) to the hall (−100…1400): halfway it is −1150…350, the door
  // (84…976) is not in yet
  p.tick(25, 17);
  const k = p.run('morph.doorClips.find(c=>c.id==="entry").planes.map(q=>q.constant)');
  near(k[0], 1.15, 'kept from x = −1.15 m'); near(k[1], 0.35, 'up to x = 0.35 m');
  // landed: the door has its own materials back
  p.fly();
  assert.deepStrictEqual(p.run(`[${leaf}===entMat, entranceDoor().g.visible, morph]`), [true, true, null]);
});

check('торцы стен: тёмный срез — одна настройка для всех вкладок', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const box = p.document.getElementById('wPoche');
  assert.strictEqual(box.checked, true);
  box.checked = false; box.dispatch('change');
  assert.strictEqual(JSON.parse(storage.get('apt-shared-v1')).poche, false);
  p.run('showView("kitchen")'); p.fly();
  assert.ok(matches(box, '[data-panel="kitchen"] #wPoche'), 'the setting moved with the shared block');
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  assert.deepStrictEqual([p.run('S.poche'), p.document.getElementById('wPoche').checked], [false, false]);
});


check('перелёт: без галочки «Анимированный перелёт» — как раньше: стены сразу, камера доезжает', () => {
  const storage = new Map();
  let p = runPage(PAGES.app, { storage, parentWin: { appView: 'plan' } }); p.tick();
  const box = p.document.getElementById('wFly');
  assert.strictEqual(box.checked, true);
  box.checked = false; box.dispatch('change');
  assert.strictEqual(JSON.parse(storage.get('apt-shared-v1')).fly, false);
  p.run('showView("kitchen")');
  // the kitchen's walls, furniture and shadows at once, nothing flies
  p.tick();
  assert.deepStrictEqual(p.run('[inTransition(), morph, camDrive, wallLines.length, presence("kitchen"), VIEWS.kitchen.furniture().model.position.y, sunHalf]'), [false, null, null, 2, 1, 0, 3]);
  // the camera glides to the kitchen by itself
  assert.ok(Math.abs(p.run('cam.theta-goal.theta')) > 1e-3, 'the camera is on its way');
  p.tick(120, 16.67);
  near(p.run('cam.theta'), p.run('goal.theta'), 'camera at the goal');
  // remembered: off after a reload too, and the flight is back with the box
  p = runPage(PAGES.app, { storage, parentWin: { appView: 'kitchen' } }); p.tick();
  assert.deepStrictEqual([p.run('S.fly'), p.document.getElementById('wFly').checked], [false, false]);
  const b = p.document.getElementById('wFly'); b.checked = true; b.dispatch('change');
  p.run('showView("plan")');
  assert.strictEqual(p.run('inTransition()'), true);
});

check('shell: все вкладки — виды одного приложения в одном окне', () => {
  const shellPage = html.slice(html.indexOf('<header'));
  const shown = [];
  const p = runPage('<html>' + shellPage, { hash: '#plan' });
  const fr = p.document.getElementById('f-app');
  const cur = () => p.document.querySelectorAll('[data-tab]').filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.dataset.tab);
  assert.deepStrictEqual(p.document.querySelectorAll('iframe').map((f) => f.id), ['f-app'], 'no old pages');
  assert.deepStrictEqual([fr.hidden, fr.srcdoc === PAGES.app, p.ctx.appView], [false, true, 'plan']);
  assert.deepStrictEqual(p.document.querySelectorAll('[data-tab]').map((a) => a.dataset.tab), ['plan', 'hall', 'bath', 'kitchen']);
  assert.deepStrictEqual(cur(), ['plan']);
  fr.contentWindow = { showView: (v) => shown.push(v) };   // the loaded app: the shell switches its view
  ['hall', 'bath', 'kitchen', 'plan'].forEach((t) => {
    p.ctx.location.hash = '#' + t; p.ctx.dispatch('hashchange');
    assert.deepStrictEqual([cur(), p.ctx.appView, fr.hidden], [[t], t, false]);
  });
  assert.deepStrictEqual(shown, ['hall', 'bath', 'kitchen', 'plan']);
});

console.log('ok:', checks.length, 'checks\n - ' + checks.join('\n - '));
