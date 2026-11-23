/* Обвязка смоук-теста комнаты (копия обвязки основного проекта без декоров и мебели): заглушка THREE, маленький DOM, runPage,
   собранные страницы PAGES, check и помощники проверок. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');

/* ---------- THREE: universal stub ---------- */
function stub(name = 'stub') {
  return new Proxy(function () {}, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then' || k === Symbol.iterator || k === Symbol.isConcatSpreadable) return undefined;   // not a promise, not a list: [].concat(stub) keeps it whole
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
      // a sprite knows where it is in the scene (places up the parents): the dimension labels are sized by their distance
      if (name === 'THREE.Sprite') Object.assign(o, { material: args[0], getWorldPosition: (v) => { v.set(0, 0, 0); for (let q = o; q && q.position instanceof Vec3; q = q.parent) v.add(q.position); return v; } });
      // a material keeps whether it hides behind what stands in front (the dimensions between the shelves do, the others do not)
      if (/Material$/.test(name) && args[0] && 'depthTest' in args[0]) o.depthTest = args[0].depthTest;
      // and how metal it is (the sink is steel), how see-through (the edge lines)
      if (/Material$/.test(name) && args[0] && 'metalness' in args[0]) o.metalness = args[0].metalness;
      if (/Material$/.test(name) && args[0] && 'opacity' in args[0]) o.opacity = args[0].opacity;
      if (/Material$/.test(name) && args[0] && args[0].polygonOffset) Object.assign(o, { polygonOffset: true, polygonOffsetFactor: args[0].polygonOffsetFactor });
      // its colours real, so checks can see them in numbers (the edge contrast: furniture.js applyContrast); white and black, as THREE's
      if (/Material$/.test(name)) Object.assign(o, { color: new Color(args[0] && args[0].color != null ? args[0].color : 0xffffff), emissive: new Color(args[0] && args[0].emissive || 0) });
      // objects of the scene have a real place and real children, so checks can see where things stand
      // a geometry keeps its sizes
      if (/Geometry$/.test(name)) o.args = args, o.kind = name;
      // and where it was moved to (translate, as THREE's: returns itself), so a part's place in the scene can be told
      if (/Geometry$/.test(name)) { o.off = [0, 0, 0]; o.translate = (x, y, z) => { o.off[0] += x; o.off[1] += y; o.off[2] += z; return o; }; }
      // an extruded one has its vertices (none here), so code walking them runs (the wardrobe's faceted panels shade theirs)
      if (name === 'THREE.ExtrudeGeometry') o.attributes = { position: { count: 0, getY: () => 0 } };
      if (['THREE.Mesh', 'THREE.LineSegments', 'THREE.Line', 'THREE.Sprite', 'THREE.Group', 'THREE.Scene'].includes(name)) {
        // userData plain and no parent till added, as THREE's: what is not put there is not there, and a walk up the parents ends
        Object.assign(o, { position: new Vec3(), scale: new Vec3(1, 1, 1), children: [], userData: {}, parent: null });
        o.add = (...c) => { c.forEach((x) => { x.parent = o; o.children.push(x); }); return o; };
        o.remove = (...c) => { o.children = o.children.filter((x) => !c.includes(x)); c.forEach((x) => { if (x.parent === o) x.parent = null; }); return o; };
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
// a real colour, linear r, g, b as THREE's: made of a number 0xrrggbb, a '#rrggbb' string (any other string: black), a colour or r, g, b
class Color {
  constructor(r, g, b) { this.r = this.g = this.b = 0; if (r != null) this.set(r, g, b); }
  set(r, g, b) {
    if (g != null) return this.setRGB(r, g, b);
    if (r instanceof Color) return this.copy(r);
    const n = typeof r === 'number' ? r : /^#[0-9a-f]{6}$/i.test(String(r).trim()) ? parseInt(String(r).trim().slice(1), 16) : 0;
    return this.setRGB((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255);
  }
  setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; }
  setScalar(s) { return this.setRGB(s, s, s); }
  setHSL(h, s, l) {
    const q = l <= 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { t = ((t % 1) + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * 6 * (2 / 3 - t) : p; };
    return this.setRGB(f(h + 1 / 3), f(h), f(h - 1 / 3));
  }
  copy(c) { return this.setRGB(c.r, c.g, c.b); }
  clone() { return new Color().copy(this); }
  multiplyScalar(s) { return this.setRGB(this.r * s, this.g * s, this.b * s); }
  addScalar(s) { return this.setRGB(this.r + s, this.g + s, this.b + s); }
  convertSRGBToLinear() { const f = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return this.setRGB(f(this.r), f(this.g), f(this.b)); }
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

/* ---------- helpers in the page for checks' p.run code: tt ----------
   tt.mm(v): metres → whole mm; tt.wall(id): the wall of the model by its id */
const PAGE_KIT = `var tt={
  mm:v=>Math.round(v*1000),
  wall:id=>WALLS.find(w=>w.id===id),
};`;

/* ---------- run a page's inline scripts in one context, like a browser does ---------- */
function runPage(html, { hash = '', storage = new Map(), parentWin = {}, reduce = false } = {}) {
  const doc = parseHTML(html), docEl = el('html'), frames = [], clock = { t: 0 };
  const document = {
    documentElement: docEl, fonts: undefined,
    getElementById: (id) => all(doc).find((x) => x.attrs.id === id) || null,
    querySelector: (s) => doc.querySelector(s), querySelectorAll: (s) => doc.querySelectorAll(s),
    createElement: (t) => el(t),
    listeners: {}, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
  };
  // a key pressed or let go on the page (e.code: 'KeyW', 'Space'…), as the browser sends it to the document
  const key = (type, code, ev = {}) => (document.listeners[type] || []).forEach((f) => f({ code, key: code, target: doc, preventDefault() {}, ...ev }));
  const localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
  const THREE = stub('THREE'); THREE.Vector3 = Vec3; THREE.Color = Color;
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
  win.window = win; win.parent = { location: { hash }, ...parentWin };
  const ctx = vm.createContext(win);
  all(doc).filter((x) => x.tagName === 'SCRIPT' && !x.attrs.src).forEach((s, i) => vm.runInContext(s.text, ctx, { filename: `script#${i}` }));
  vm.runInContext(PAGE_KIT, ctx, { filename: 'tt' });
  // n frames of ms each; a flight between views takes 0.85 s, so fly() lets it finish
  const tick = (n = 3, ms = 16) => { for (let i = 0; i < n; i++) { clock.t += ms; const q = frames.splice(0); q.forEach((f) => f()); } };
  const fly = () => tick(60);
  // run(code): an expression in the page, its value back through JSON. code — a string, or a function written as page code:
  // it goes to the page as its text, so it sees the page (tt, VIEWS…) and nothing of the check; what it needs from the check — args (JSON)
  const run = (code, ...args) => {
    const src = typeof code === 'function' ? `(${code})(...${JSON.stringify(args)})` : code;
    const s = vm.runInContext('JSON.stringify(' + src + ')', ctx); return s === undefined ? undefined : JSON.parse(s);
  };
  return { ctx, doc, document, storage, tick, fly, key, run };
}

/* ---------- the built file ---------- */
const root = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pi = html.indexOf('const PAGES=');
const PAGES = new Function(html.slice(pi, html.indexOf(';\n', pi) + 1) + 'return PAGES;')();
const checks = [];
// what smoke.js asks, set before the parts load: grep — only the checks whose name has this text (any case);
// dry — names only, nothing run (--list); time — the ms of each into times (--time)
const run = { grep: "", dry: false, time: false }, times = [];
const check = (name, fn) => {
  if (run.grep && !name.toLowerCase().includes(run.grep)) return;
  const t = process.hrtime.bigint(); if (!run.dry) fn(); checks.push(name);
  if (run.time) times.push([name, Number(process.hrtime.bigint() - t) / 1e6]);
};

// a slider of the plan's wall sizes moved to v, as the browser does it
const slide = (p, k, v) => { const s = p.document.querySelector(`[data-size="${k}"]`); s.value = String(v); s.dispatch('input'); };

const vec = (p, v) => p.run(`[${v}.x,${v}.y,${v}.z]`).map((x) => round(x));

// a piece of a wall in the flight: its scale and place (the first piece of that wall standing on the floor)
const piece = (p, id) => p.run(`(w=>({sx:w.m.scale.x, sy:w.m.scale.y, sz:w.m.scale.z, z:w.m.position.z, visible:w.m.visible}))(wallParts.find(w=>w.id==="${id}"&&w.b===0))`);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-3, `${msg}: ${a} ≠ ${b}`);

module.exports = { fs, stub, Vec3, round, VOID, kebab, parseAttrs, el, parseHTML, all, matchesOne, matches, runPage, root, html, pi, PAGES, checks, check, run, times, slide, vec, piece, near, assert };
