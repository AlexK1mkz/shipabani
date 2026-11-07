const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const src = fs.readFileSync(path.join(root, 'index.html'),'utf8');

test('RU and KZ customer FAQs omit child-visit and depth assurances', () => {
  assert.doesNotMatch(src, /\{q:'Можно ли с детьми\?'/);
  assert.doesNotMatch(src, /\{q:'Балалармен келуге бола ма\?'/);
  assert.doesNotMatch(src, /Чан неглубокий|Чан терең емес|чан аса терең емес/);
  assert.match(src, /\{q:'Есть ли предоплата\?'/);
  assert.match(src, /\{q:'Алдын ала төлем қажет пе\?'/);
});

test('No depth claim in customer reviews and both languages have equal review counts', () => {
  const ru = src.slice(src.indexOf('const REVIEWS=['),src.indexOf('const FAQ=['));
  const kz = src.slice(src.indexOf('const REVIEWS_KZ = ['),src.indexOf('const SVC_FAQ_KZ = ['));
  assert.doesNotMatch(ru,/С детьми удобно|чан неглубокий/);
  assert.doesNotMatch(kz,/Балалармен демалуға ыңғайлы|чан аса терең емес/);
  assert.equal((ru.match(/^ \{name:/gm)||[]).length, (kz.match(/^ \{date:/gm)||[]).length);
});

test('Booking guest count and prepayment logic unchanged', () => {
  assert.match(src, /kids=bk\.kids\|\|0/);
  assert.match(src, /Дети до 7 лет не считаются и не влияют на цену/);
  assert.match(src, /20 000 ₸ для Standard и 40 000 ₸ для VIP/);
});
