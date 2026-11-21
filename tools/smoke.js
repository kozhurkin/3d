// Смоук-тест собранного index.html в Node, без браузера: скрипты страниц выполняются с заглушкой THREE
// и маленьким DOM, разобранным из настоящей разметки. Ловит ошибки порядка загрузки модулей, неверные id и селекторы,
// поломки сохранения настроек и переключения вкладок. WebGL не рисует — картинку смотрит пользователь в index.html.
// Запуск: npm run check (сначала сам собирает index.html: проверяется свежая сборка); только часть: npm run check -- kitchen bath; список проверок: --list.
// Часть-папка (tools/smoke/living/: index.js и файл на предмет) — целиком (living) или один предмет (living/sofa).
// Обвязка (заглушки, runPage, помощники) — tools/smoke/harness.js, проверки — tools/smoke/<часть>.js или tools/smoke/<часть>/.
const fs = require('fs'), path = require('path');
// сборка (0,1 с) — до обвязки: она читает index.html
const build = require('child_process').spawnSync(process.execPath, [path.join(__dirname, '..', 'build.js')], { encoding: 'utf8' });
if (build.status !== 0) { console.error('сборка не прошла:\n' + build.stderr); process.exit(1); }
const { checks } = require('./smoke/harness');
const PARTS = ['app', 'kitchen', 'living', 'bath', 'hall', 'flight', 'walk'];
const args = process.argv.slice(2), list = args.includes('--list'), only = args.filter((a) => a !== '--list');
// часть или предмет части-папки: living/sofa → tools/smoke/living/sofa.js
const known = (a) => PARTS.includes(a) || (/^\w+\/\w+$/.test(a) && a.split('/')[1] !== 'index'
  && PARTS.includes(a.split('/')[0]) && fs.existsSync(path.join(__dirname, 'smoke', a + '.js')));
const bad = only.filter((a) => !known(a));
if (bad.length) { console.error('нет такой части:', bad.join(', '), '— есть', PARTS.join(', '), '(у папки — и <часть>/<предмет>)'); process.exit(1); }
const counts = (only.length ? only : PARTS).map((f) => { const n = checks.length; require('./smoke/' + f); return `${f} ${checks.length - n}`; });
console.log(`ok: ${checks.length} checks (${counts.join(', ')})` + (list ? '\n - ' + checks.join('\n - ') : ''));
