'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

test('Only three VIP houses are bookable; other houses are marked soon',()=>{
 const rows=[...html.matchAll(/^ \{id:'([^']+)',n:'([^']+)',cat:'([^']+)',name:'[^']+'.*?\},?$/gm)];
 assert.equal(rows.length,8,'eight house definitions');
 const available=rows.filter(r=>!r[0].includes('soon:true'));
 assert.equal(available.length,3,'only three houses currently bookable');
 assert.deepEqual(available.map(r=>r[2]),['01','02','03']);
 assert.ok(available.every(r=>r[3].includes('Vip')),'only VIP among open houses');
});

test('Booking Standard tab renders a coming soon state rather than an empty list',()=>{
 assert.match(html,/const bookingStandardSoon=sortId==='std'/);
 assert.match(html,/if\(bookingStandardSoon\)ordered=\[\]/);
 assert.match(html,/<sc-if value="\{\{ bookingStandardSoon \}\}"/);
 assert.match(html,/<sc-if value="\{\{ bookingShowVipResults \}\}"/);
 assert.match(html,/bookingShowVipResults:!bookingStandardSoon/);
 assert.match(html,/bookingSoonShowVip:\(\)=>this\.setBk\(\{sort:'vip'\}\)/);
 assert.match(html,/bookingSoonHeading/);
 assert.match(html,/bookingSoonDescription/);
 assert.match(html,/bookingSoonVipLabel/);
});

test('Coming soon copy is present in RU and KZ with a working VIP back action',()=>{
 assert.match(html,/Standard үйлері жақында ашылады/);
 assert.match(html,/Дома Standard скоро откроются/);
 assert.match(html,/VIP үйлерін көру/);
 assert.match(html,/Посмотреть VIP-дома/);
 assert.match(html,/onClick="\{\{ bookingSoonShowVip \}\}"/);
 assert.match(html,/step2Sub:bookingStandardSoon\?/);
});
