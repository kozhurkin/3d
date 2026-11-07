// Собирает src/* в один файл index.html: страницы встраиваются в shell.html как JSON-строки.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src');
const read = (name) => fs.readFileSync(path.join(src, name), 'utf8');
const escapeScript = (s) => s.replaceAll('</', '<\\/');

const bridge = '<script>(function(){var p=parent;["PHOTO_GAIN","DECORS","PALETTE_WOOD","PALETTE_UNI"].forEach(function(k){window[k]=p[k];});window.renderPalette=new Function("return "+p.renderPalette.toString())();})();</script>';

const pages = Object.fromEntries(['hall', 'bath', 'kitchen'].map((k) =>
  [k, read(k + '.html').replaceAll('<script src="decors.js"></script>', bridge)]));

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
