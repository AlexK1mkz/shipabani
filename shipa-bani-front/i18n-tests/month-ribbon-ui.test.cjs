const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

const fn = html.match(/function groupDateRibbon\(days,startOffset,dateAt,lang\)\{[\s\S]*?\n\}/);
assert.ok(fn, 'Month grouping helper exists');
const context = vm.createContext({});
vm.runInContext(`const MON_NOM=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']; const MON_NOM_KZ=['Қаңтар','Ақпан','Наурыз','Сәуір','Мамыр','Маусым','Шілде','Тамыз','Қыркүйек','Қазан','Қараша','Желтоқсан']; ${fn[0]}; this.group=groupDateRibbon;`,context);
const dateAt = offset => new Date(2026, 9, 31 + offset);
const days = Array.from({length: 5}, (_, i) => ({day: 31 + i, select: () => i}));
for (const [locale, expected] of [['RU',['Октябрь','Ноябрь']],['KZ',['Қазан','Қараша']]]) {
  test(`${locale} places October and November in distinct labelled groups`, () => {
    const groups = context.group(days, 0, dateAt, locale);
    assert.deepEqual(Array.from(groups, g => g.title), expected);
    assert.deepEqual(Array.from(groups, g => g.days.length), [1, 4]);
    assert.equal(groups.flatMap(g => g.days).length, days.length);
    assert.equal(groups[1].days[0].select(), 1);
  });
}
test('first date can start part-way through a month, across year boundary', () => {
  const groups = context.group(Array.from({length: 4}, (_, i) => ({n: i})), 60, dateAt, 'RU');
  assert.equal(groups.length, 2);
  assert.deepEqual(Array.from(groups, g=>g.title), ['Декабрь','Январь']);
});
test('both date ribbons use month headers above date buttons, not a header over every button', () => {
  assert.match(html, /list="\{\{ quickMonths \}\}"/);
  assert.match(html, /list="\{\{ dayMonths \}\}"/);
  assert.match(html, /class="shipa-date-month__heading"/);
  assert.match(html, /class="shipa-date-month__days"/);
  assert.match(html, /data-day="1" data-sel="\{\{ d.sel \}\}"/);
  assert.match(html, /ref="\{\{ quickRef \}\}" class="noscroll shipa-date-months-scroll"/);
  assert.match(html, /ref="\{\{ stripRef \}\}" onScroll="\{\{ stripScroll \}\}" class="noscroll shipa-date-months-scroll"/);
});
