// Собирает src/* в один файл index.html: приложение (app.html с модулями js/ и панелями panels/) встраивается
// в shell.html JSON-строкой и открывается в iframe через srcdoc.
// Здесь чтение каждого файла проекта медленное (~0,3 с на файл, его проверяет система), а дата изменения — быстрая. Поэтому:
// index.html новее всех файлов прошлой сборки (их список — .build-deps.json, не в git) — ничего не читается;
// иначе все исходники читаются разом, параллельно, и собираются из памяти.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src'), dst = path.join(__dirname, 'index.html'), deps = path.join(__dirname, '.build-deps.json');
const mtime = (f) => { try { return fs.statSync(f).mtimeMs; } catch (e) { return Infinity; } };
{ // up to date: every file of the last build (and this script) older than index.html
  let list = null;
  try { list = JSON.parse(fs.readFileSync(deps, 'utf8')); } catch (e) {}
  const built = mtime(dst);
  if (list && built < Infinity && [__filename, ...list.map((n) => path.join(src, n))].every((f) => mtime(f) < built)) {
    console.log('up to date', dst);
    process.exit(0);
  }
}

const files = new Map();   // src name → its text, read before the build
const read = (name) => { if (!files.has(name)) throw new Error('не прочитан: ' + name); return files.get(name); };
const escapeScript = (s) => s.replaceAll('</', '<\\/');

// what a page takes in: panels (<!--include …-->), modules (<script src="js/….js">), the files of a folder module (data-files)
const INCLUDE = /<!--include ([\w\/.-]+\.html)-->/g;
const FOLDER = /<script src="(js\/[\w\/.-]+\/)" data-files="([\w .-]+)"(?: data-export="(\w+)")?><\/script>/g;
const MODULE = /<script src="(js\/[\w\/.-]+\.js)"><\/script>/g;
const refs = (html) => [...html.matchAll(INCLUDE)].map((m) => m[1])
  .concat([...html.matchAll(FOLDER)].flatMap((m) => m[2].trim().split(/\s+/).map((f) => m[1] + f + '.js')))
  .concat([...html.matchAll(MODULE)].map((m) => m[1]));

// декоры (3,4 МБ фотографий) лежат в shell один раз; приложение берёт их у родителя, а не несёт свою копию в srcdoc
const bridge = '<script>(function(){var p=parent;["PHOTO_GAIN","DECORS","PALETTE_WOOD","PALETTE_UNI"].forEach(function(k){window[k]=p[k];});})();</script>';

// модуль из папки: её файлы в порядке data-files в одной области видимости — (function(){ … })();
// с data-export="имя" — const имя=(function(){ … return имя; })(); (внутри последний файл объявляет const имя={…})
const folderModule = (dir, list, name) => {
  const body = list.trim().split(/\s+/).map((f) => read(dir + f + '.js').replace(/\n?$/, '\n')).join('');
  return name ? `const ${name}=(function(){\n${body}return ${name};\n})();\n` : `(function(){\n${body}})();\n`;
};

// <script src="js/….js"></script> в странице → содержимое модуля прямо в странице;
// <script src="js/…/" data-files="a b c" [data-export="имя"]></script> → модуль из папки (folderModule);
// <!--include panels/….html--> → разметка из файла (панели вкладок)
const inlineModules = (html) => html
  .replace(INCLUDE, (_, f) => read(f))
  .replace(FOLDER, (_, dir, list, name) => '<script>\n' + escapeScript(folderModule(dir, list, name)) + '\n</script>')
  .replace(MODULE, (_, f) => '<script>\n' + escapeScript(read(f)) + '\n</script>');

function build() {
  // app — одна сцена квартиры: все вкладки — её виды
  const pages = Object.fromEntries(['app'].map((k) =>
    [k, inlineModules(read(k + '.html')).replaceAll('<script src="decors.js"></script>', bridge)]));

  const inject = escapeScript(read('decors.js')) + '\nconst PAGES=' + escapeScript(JSON.stringify(pages)) + ';';

  // replace() со строкой-шаблоном меняет только первое вхождение; функция — чтобы не трогать `$` в подставляемом коде
  const body = read('shell.html')
    .replace('<script>\n(function(){', () => '<script>\n' + inject + '\n(function(){')
    .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n/g, '')
    .replace('<header', '</head><body>\n<header');

  return '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<style>body{margin:0}[hidden]{display:none!important}</style>\n'
    + body + '\n</body></html>\n';
}

(async () => {
  // read everything at once: the pages, then what they take in (panels may take in more), until nothing new
  const load = (names) => Promise.all(names.filter((n) => !files.has(n)).map(async (n) => { files.set(n, await fs.promises.readFile(path.join(src, n), 'utf8')); }));
  await load(['app.html', 'shell.html', 'decors.js']);
  for (let more; (more = [...files.entries()].filter(([n]) => n.endsWith('.html')).flatMap(([, t]) => refs(t)).filter((n) => !files.has(n))).length;) await load(more);
  const out = build();
  // the same as built before: left as it is
  const same = fs.existsSync(dst) && fs.readFileSync(dst, 'utf8') === out;
  if (!same) fs.writeFileSync(dst, out); else fs.utimesSync(dst, new Date(), new Date());   // (newer than the sources either way)
  fs.writeFileSync(deps, JSON.stringify([...files.keys()]));
  console.log(same ? 'unchanged' : 'ok', dst, Math.floor(Buffer.byteLength(out) / 1024), 'KB');
})().catch((e) => { console.error(e.message); process.exit(1); });
