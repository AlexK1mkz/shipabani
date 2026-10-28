const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');

test('all eight site sections have a route-entry animation hook', () => {
  for (const name of ['Главная','Дома','Карточка дома','Парение и услуги','Кухня','Отзывы','О нас','Контакты'])
    assert.ok(html.includes(`class="shipa-page-enter" data-screen-label="${name}"`), name);
  assert.equal((html.match(/class="shipa-page-enter"/g)||[]).length, 8);
});
test('route animation respects native transition support and reduced-motion', () => {
  for (const token of ['routeTransition(apply)', "data-shipa-native-vt", 'shipaRouteEnter','shipaRouteExit','prefers-reduced-motion:reduce'])
    assert.ok(html.includes(token), token);
});
test('dynamic sections and list cards reveal smoothly', () => {
  assert.ok((html.match(/<section data-reveal/g)||[]).length >= 18);
  assert.equal((html.match(/class="shipa-stagger-cards"/g)||[]).length,3);
  assert.ok(html.includes('shipaCardEnter'));
});
test('320-px catalog keeps a single flexible column and non-overflowing CTA controls', () => {
  assert.ok(html.includes('.shipa-catalog-grid{grid-template-columns:minmax(0,1fr)!important'));
  assert.ok(html.includes('min-width:0;padding-inline:10px!important'));
  assert.ok(html.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'));
});
test('mobile gallery thumbnails and contact text remain reachable', () => {
  assert.ok(html.includes('.shipa-house-photo-viewer__thumbs{justify-content:flex-start'));
  assert.ok(html.includes('a[href^="tel:"]{overflow-wrap:anywhere;}'));
});
test('prior booking and local launch features survive', () => {
  assert.ok(html.includes("const PAY_LINKS={kaspi:''}"));
  assert.ok(html.includes('Күндіз') && html.includes('Кешке'));
  assert.ok(fs.existsSync(require('node:path').join(__dirname,'..','START_WINDOWS.bat')));
});
