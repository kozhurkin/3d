// Смоук-тест собранного index.html в Node, без браузера: скрипты страниц выполняются с заглушкой THREE
// и маленьким DOM, разобранным из настоящей разметки. Ловит ошибки порядка загрузки модулей, неверные id и селекторы,
// поломки сохранения настроек и переключения вкладок. WebGL не рисует — картинку смотрит пользователь в index.html.
// Запуск: npm run check (после npm run build)
// Запуск: npm run check (после npm run build); только часть: npm run check -- kitchen bath; список проверок: --list
// Обвязка (заглушки, runPage, помощники) — tools/smoke/harness.js, проверки — tools/smoke/<часть>.js.
const { checks } = require('./smoke/harness');
const PARTS = ['app', 'kitchen', 'bath', 'hall', 'flight', 'walk'];
const args = process.argv.slice(2), list = args.includes('--list'), only = args.filter((a) => a !== '--list');
const bad = only.filter((a) => !PARTS.includes(a));
if (bad.length) { console.error('нет такой части:', bad.join(', '), '— есть', PARTS.join(', ')); process.exit(1); }
const counts = (only.length ? only : PARTS).map((f) => { const n = checks.length; require('./smoke/' + f); return `${f} ${checks.length - n}`; });
console.log(`ok: ${checks.length} checks (${counts.join(', ')})` + (list ? '\n - ' + checks.join('\n - ') : ''));
