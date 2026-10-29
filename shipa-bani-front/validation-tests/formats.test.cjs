const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('const phoneDigits=');
const end=html.indexOf('class Component extends',start);
assert.ok(start>0&&end>start);
const fns=vm.runInNewContext(html.slice(start,end)+'\n({phoneDigits,phoneValid,emailValid,nameValid,phoneFmt})');
test('Kazakhstan phone full and short variants',()=>{
 for(const good of ['+7 (701) 821-88-83','87018218883','77018218883','7018218883'])assert.equal(fns.phoneValid(good),true,good);
 for(const bad of ['','123','70211','+1 201 555 1234','+44 7700 900123','+7 701 1234','+7 (701) 821-88-831'])assert.equal(fns.phoneValid(bad),false,bad);
});
test('Phone mask shows +7 plus 10 digits',()=>assert.equal(fns.phoneFmt(fns.phoneDigits('87018218883')),'+7 (701) 821-88-83'));
test('Person name excludes numbers and symbols',()=>{
 for(const good of ['Данил','Айжан','Әлия','Aida','Мәриям-Сара'])assert.equal(fns.nameValid(good),true,good);
 for(const bad of ['','А','12345','Алекс 22','!!!'])assert.equal(fns.nameValid(bad),false,bad);
});
test('E-mail validator accepts valid addresses and rejects malformed',()=>{
 for(const good of ['info@example.kz','name.surname+test@company.com'])assert.equal(fns.emailValid(good),true,good);
 for(const bad of ['info','test@','test@example','a@@b.kz','ab cd@example.com'])assert.equal(fns.emailValid(bad),false,bad);
});
test('Tariff color legend and full month formats',()=>{
 assert.match(html,/shipa-ux-tariff-legend/);
 assert.match(html,/shipa-ux-legend-title/);
 assert.match(html,/background:#FFFFFF/);
 assert.match(html,/background:#E5E5E5/);
 assert.match(html,/shipa-ux-status-legend/);
 assert.match(html,/dayEveHint:`\$\{s\.lang/);
 assert.match(html,/const MON_S=MON;/);
 assert.match(html,/const MON_STRIP=MON_NOM;/);
 assert.doesNotMatch(html,/github\.io/);
});
