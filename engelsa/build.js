// Собирает engelsa/src/* в один файл engelsa/index.html: приложение (app.html с модулями js/ и панелями panels/) встраивается
// в shell.html JSON-строкой и открывается в iframe через srcdoc. Отдельный проект: ничего вне папки engelsa не читает и не пишет.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src');
const read = (name) => fs.readFileSync(path.join(src, name), 'utf8');
const escapeScript = (s) => s.replaceAll('</', '<\\/');

// модуль из папки: её файлы в порядке data-files в одной области видимости — (function(){ … })();
// с data-export="имя" — const имя=(function(){ … return имя; })(); (внутри последний файл объявляет const имя={…})
const folderModule = (dir, files, name) => {
  const body = files.trim().split(/\s+/).map((f) => read(dir + f + '.js').replace(/\n?$/, '\n')).join('');
  return name ? `const ${name}=(function(){\n${body}return ${name};\n})();\n` : `(function(){\n${body}})();\n`;
};

// <script src="js/….js"></script> в странице → содержимое модуля прямо в странице;
// <script src="js/…/" data-files="a b c" [data-export="имя"]></script> → модуль из папки (folderModule);
// <!--include panels/….html--> → разметка из файла (панели вкладок)
const inlineModules = (html) => html
  .replace(/<!--include ([\w\/.-]+\.html)-->/g, (_, f) => read(f))
  .replace(/<script src="(js\/[\w\/.-]+\/)" data-files="([\w .-]+)"(?: data-export="(\w+)")?><\/script>/g,
    (_, dir, files, name) => '<script>\n' + escapeScript(folderModule(dir, files, name)) + '\n</script>')
  .replace(/<script src="(js\/[\w\/.-]+\.js)"><\/script>/g,
    (_, f) => '<script>\n' + escapeScript(read(f)) + '\n</script>');

// app — одна сцена комнаты: все вкладки — её виды
const pages = Object.fromEntries(['app'].map((k) => [k, inlineModules(read(k + '.html'))]));

const inject = 'const PAGES=' + escapeScript(JSON.stringify(pages)) + ';';

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
