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
    get hidden() { return 'hidden' in this.attrs; },
    set hidden(v) { if (v) this.attrs.hidden = ''; else delete this.attrs.hidden; },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    removeAttribute(k) { delete this.attrs[k]; },
    hasAttribute(k) { return k in this.attrs; },
    set innerHTML(h) { this.children.forEach((c) => (c.parentElement = null)); this.children = []; parseHTML(h, this); },
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
  const win = {
    THREE: stub('THREE'), document, localStorage, console, performance, setTimeout, clearTimeout, Math, JSON,
    devicePixelRatio: 1, location: { hash },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => ' #cccccc ' }),
    requestAnimationFrame: (f) => frames.push(f),
    MutationObserver: class { observe() {} }, ResizeObserver: class { observe() {} },
  };
  const wl = {};
  win.addEventListener = (t, f) => (wl[t] ||= []).push(f);
  win.dispatch = (t) => (wl[t] || []).forEach((f) => f({}));
  win.window = win; win.parent = { location: { hash }, ...parentWin };
  const ctx = vm.createContext(win);
  all(doc).filter((x) => x.tagName === 'SCRIPT' && !x.attrs.src).forEach((s, i) => vm.runInContext(s.text, ctx, { filename: `script#${i}` }));
  const tick = (n = 3) => { for (let i = 0; i < n; i++) { const q = frames.splice(0); q.forEach((f) => f()); } };
  return { ctx, doc, document, storage, tick, run: (code) => JSON.parse(vm.runInContext('JSON.stringify(' + code + ')', ctx)) };
}

/* ---------- the built file ---------- */
const root = path.join(__dirname, '..');
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
  const r = p.run('({view, n:Object.keys(VIEWS), lines:wallLines.length, parts:wallParts.length, fade:VIEWS.plan.fade, vs:VS.plan})');
  assert.strictEqual(r.view, 'plan');
  assert.deepStrictEqual(r.n, ['plan']);
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
  assert.deepStrictEqual(shown, ['plan']);
});

console.log('ok:', checks.length, 'checks\n - ' + checks.join('\n - '));
