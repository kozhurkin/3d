// Собирает src/* в один файл index.html: приложение (app.html с модулями js/ и панелями panels/) встраивается
// в shell.html JSON-строкой и открывается в iframe через srcdoc.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src');
const read = (name) => fs.readFileSync(path.join(src, name), 'utf8');
const escapeScript = (s) => s.replaceAll('</', '<\\/');

// декоры (3,4 МБ фотографий) лежат в shell один раз; приложение берёт их у родителя, а не несёт свою копию в srcdoc
const bridge = '<script>(function(){var p=parent;["PHOTO_GAIN","DECORS","PALETTE_WOOD","PALETTE_UNI"].forEach(function(k){window[k]=p[k];});})();</script>';

// <script src="js/….js"></script> в странице → содержимое модуля прямо в странице;
// <!--include panels/….html--> → разметка из файла (панели вкладок)
const inlineModules = (html) => html
  .replace(/<!--include ([\w\/.-]+\.html)-->/g, (_, f) => read(f))
  .replace(/<script src="(js\/[\w\/.-]+\.js)"><\/script>/g,
    (_, f) => '<script>\n' + escapeScript(read(f)) + '\n</script>');

// app — одна сцена квартиры: все вкладки — её виды
const pages = Object.fromEntries(['app'].map((k) =>
  [k, inlineModules(read(k + '.html')).replaceAll('<script src="decors.js"></script>', bridge)]));

const inject = escapeScript(read('decors.js')) + '\nconst PAGES=' + escapeScript(JSON.stringify(pages)) + ';';

// replace() со строкой-шаблоном меняет только первое вхождение; функция — чтобы не трогать `$` в подставляемом коде
const body = read('shell.html')
  .replace('<script>\n(function(){', () => '<script>\n' + inject + '\n(function(){')
  .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n/g, '')
  .replace('<header', '</head><body>\n<header');

const out = '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
  + '<style>body{margin:0}[hidden]{display:none!important}</style>\n'
  + body + '\n</body></html>\n';

const dst = path.join(__dirname, 'index.html');
fs.writeFileSync(dst, out);
console.log('ok', dst, Math.floor(Buffer.byteLength(out) / 1024), 'KB');
