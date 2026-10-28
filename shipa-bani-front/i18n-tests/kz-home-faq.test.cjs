const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('Home catalog heading has complete RU and KZ state-localized fragments', () => {
  assert.match(source, /houseHeadingStart:s\.lang==='KZ'\?'СЕГІЗ ҮЙ - ':'ВОСЕМЬ ДОМОВ - '/);
  assert.match(source, /houseHeadingEnd:s\.lang==='KZ'\?'СЕГІЗ ТҮРЛІ КҮЙ':'ВОСЕМЬ СОСТОЯНИЙ'/);
  assert.match(source, /\{\{ houseHeadingStart \}\}<span[^>]*>\{\{ houseHeadingEnd \}\}<\/span>/);
});

test('Fourth house has KZ name ҚУАТ, and Russian ЭНЕРГИЯ is preserved', () => {
  assert.match(source, /\"name\": \"ҚУАТ\"/);
  assert.match(source, /name:'ЭНЕРГИЯ'/);
  assert.match(source, /'ТЕПЕ-ТЕҢДІК','ҚУАТ','ЕРКІНДІК'/);
});

test('Home catalog price string is localized as one unit, without trailing / час', () => {
  assert.match(source, /\{\{ h\.priceFromLabel \}\}/);
  assert.doesNotMatch(source, />от \{\{ h\.priceFrom \}\} \/ час<\/div>/);
  assert.match(source, /priceFromLabel:s\.lang==='KZ'\?`Сағатына \$\{fmt\(this\.fromPrice\(h\)\)\} бастап`/);
});

test('FAQ has native Kazakh title and two-column safe layout', () => {
  assert.match(source, /faqHeadingStart:s\.lang==='KZ'\?'ЖИІ ҚОЙЫЛАТЫН'/);
  assert.match(source, /faqHeadingEnd:s\.lang==='KZ'\?'СҰРАҚТАР'/);
  assert.match(source, /\.shipa-faq-layout\{display:grid;grid-template-columns:minmax\(0,350px\) minmax\(0,1fr\)/);
  assert.match(source, /@media\(max-width:900px\)\{\s*\.shipa-faq-layout\{grid-template-columns:minmax\(0,1fr\)/);
  assert.doesNotMatch(source, /grid-column:span 2;display:flex;flex-direction:column;gap:10px;min-width:0;/);
});
