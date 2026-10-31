'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const locale=fs.readFileSync(path.join(__dirname,'../shipa-ru-kz.js'),'utf8');

test('Catalog intro is language-dependent rather than an untranslated Russian text node',()=>{
 assert.match(html,/\{\{ catalogIntroText \}\}/);
 assert.match(html,/catalogIntroText:'Қазір тек үш VIP үйі ашық\./);
 assert.match(html,/catalogIntroText:'Сейчас открыты только три VIP-дома/);
});
test('Kitchen table action and testimonials subtitle are explicitly localized',()=>{
 assert.match(html,/\{\{ addTableLabel \}\}/);
 assert.match(html,/\{\{ addTableHint \}\}/);
 assert.match(html,/\{\{ homeReviewsIntroText \}\}/);
 assert.match(html,/addTableLabel:s.lang==='KZ'\?'Брондауға дастарқан қосу'/);
});
test('Booking paid and pending results have native Kazakh wording',()=>{
 assert.match(html,/title:s.lang==='KZ'\?\(bk.paid\?'Брондау расталды'/);
 assert.match(html,/sub:s.lang==='KZ'\?\(bk.paid\?'Алдын ала төлем алынды\./);
 assert.match(html,/payLine:\(s.lang==='KZ'\?'Алдын ала төлем/);
 assert.match(html,/const kzDays=\['жексенбі'/);
 assert.match(html,/const kzMonths=\['қаңтар'/);
});
test('Catalog cards have complete Kazakh prices and guest/minimum labels',()=>{
 assert.match(html,/>\{\{ h.priceFromLabel \}\}<\/div>/);
 assert.match(html,/>\{\{ h.minHoursLabel \}\}<\/div>/);
 assert.match(html,/>\{\{ h.guestsCountLabel \}\}<\/div>/);
 assert.doesNotMatch(html,/>от \{\{ h.priceFrom \}\}\/ч<\/div>/);
});
test('Footer analytics settings and testimonial house captions have KZ strings',()=>{
 assert.match(html,/>\{\{ analyticsSettingsLabel \}\}<\/button>/);
 assert.match(html,/Аналитика және жарнама параметрлері/);
 assert.match(html,/01 \/ ТЫНЫС/);
 assert.match(locale,/ПІКІРГЕ СІЛТЕМЕ/);
});
