const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Keep nominative and genitive months separate: month heading ≠ calendar date.
const nom = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const gen = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
test('Date-strip headings use all 12 full month names in nominative case', () => {
  assert.match(html, /const MON_STRIP=MON_NOM;/);
  assert.match(html, /mon:i===0\|\|d\.getDate\(\)===1\?MON_STRIP\[d\.getMonth\(\)\]/);
  assert.match(html, /mon:i===s0\|\|dd\.getDate\(\)===1\?MON_STRIP\[dd\.getMonth\(\)\]/);
  assert.deepEqual(nom.map(x=>x.toLocaleUpperCase('ru-RU')).slice(9), ['ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ']);
});
test('Full dates retain grammatical genitive names', () => {
  assert.ok(html.includes(`const MON=${JSON.stringify(gen).replaceAll('"', "'")};`));
  assert.ok(html.includes(`const MON_NOM=${JSON.stringify(nom).replaceAll('"', "'")};`));
  assert.match(html, /this\.dm\(i\)/);
  assert.match(html, /this\.dayWords\(i\)/);
});
test('Kazakh month heading labels remain localized for all 12 months', () => {
  const ctx={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'shipa-booking-i18n.js'),'utf8'),ctx);
  const kz=['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
  for(let i=0;i<12;i++) assert.equal(ctx.window.ShipaBookingI18n.translate(nom[i]).toLocaleLowerCase('kk-KZ'), kz[i]);
  assert.equal(ctx.window.ShipaBookingI18n.view({quickDays:[{mon:'Октябрь'},{mon:'Ноябрь'},{mon:'Декабрь'}]}).quickDays.map(d=>d.mon).join(', '),'Қазан, Қараша, Желтоқсан');
});
