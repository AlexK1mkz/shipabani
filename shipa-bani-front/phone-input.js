/* Shared international phone field. Values stored as full international numbers. */
(function(root){
'use strict';
const countries=[
 ['KZ','7','Казахстан','Қазақстан','Kazakhstan',[3,3,2,2]],['RU','7','Россия','Ресей','Russia',[3,3,2,2]],
 ['UZ','998','Узбекистан','Өзбекстан','Uzbekistan',[2,3,2,2]],['KG','996','Кыргызстан','Қырғызстан','Kyrgyzstan',[3,3,3]],['TJ','992','Таджикистан','Тәжікстан','Tajikistan',[2,3,2,2]],['TM','993','Туркменистан','Түрікменстан','Turkmenistan',[2,2,2,2]],
 ['BY','375','Беларусь','Беларусь','Belarus',[2,3,2,2]],['UA','380','Украина','Украина','Ukraine',[2,3,2,2]],['AZ','994','Азербайджан','Әзербайжан','Azerbaijan',[2,3,2,2]],['AM','374','Армения','Армения','Armenia',[2,3,3]],['GE','995','Грузия','Грузия','Georgia',[3,2,2,2]],
 ['TR','90','Турция','Түркия','Türkiye',[3,3,2,2]],['AE','971','ОАЭ','БАӘ','UAE',[2,3,4]],['CN','86','Китай','Қытай','China',[3,4,4]],['IN','91','Индия','Үндістан','India',[5,5]],['KR','82','Южная Корея','Оңтүстік Корея','South Korea',[2,4,4],[8,9,10]],['JP','81','Япония','Жапония','Japan',[2,4,4],[9,10]],
 ['US','1','США','АҚШ','United States',[3,3,4]],['CA','1','Канада','Канада','Canada',[3,3,4]],['GB','44','Великобритания','Ұлыбритания','United Kingdom',[4,3,3]],['DE','49','Германия','Германия','Germany',[3,4,4],[10,11]],['FR','33','Франция','Франция','France',[1,2,2,2,2]],['IT','39','Италия','Италия','Italy',[3,3,4],[6,7,8,9,10,11]],['ES','34','Испания','Испания','Spain',[3,3,3]],['NL','31','Нидерланды','Нидерланд','Netherlands',[1,4,4]],['PL','48','Польша','Польша','Poland',[3,3,3]],['AU','61','Австралия','Аустралия','Australia',[3,3,3]],['IL','972','Израиль','Израиль','Israel',[2,3,4],[8,9]],['TH','66','Таиланд','Таиланд','Thailand',[2,3,4],[8,9]]
].map(([id,code,ru,kz,en,groups,lengths])=>({id,code,ru,kz,en,groups,lengths:lengths||[groups.reduce((a,b)=>a+b,0)],flag:[...id].map(x=>String.fromCodePoint(127397+x.charCodeAt(0))).join('')}));
const get=id=>countries.find(c=>c.id===id)||countries[0];
const digits=v=>String(v??'').replace(/\D/g,'');
function parse(value,preferred='KZ',national=false){
 const c=get(preferred), raw=String(value??'').trim();let d=digits(raw), country=c;
 if(!d)return {country:c,digits:''};
 if(raw.startsWith('+')||raw.startsWith('00')){
   if(raw.startsWith('00'))d=d.slice(2);
   const matches=countries.filter(x=>d.startsWith(x.code));
   country=matches.find(x=>x.id===c.id)||matches[0];
   if(!country)return {country:c,digits:'',unsupported:true};
   d=d.slice(country.code.length);
   if(country.code==='7'&&d.length&&/^[67]/.test(d))country=get('KZ');
   else if(country.code==='7'&&d.length&&/^[3489]/.test(d))country=get('RU');
 }else if(c.code==='7'&&d.length===11&&/^[78]/.test(d))d=d.slice(1);
 else if(d.startsWith(c.code)&&c.lengths.includes(d.length-c.code.length)&&d.length>Math.max(...c.lengths))d=d.slice(c.code.length);
 else if(!national&&raw===c.code)d='';
 return {country,digits:d};
}
function format(d,c){let n=0;const out=[];for(const g of c.groups){if(n>=d.length)break;out.push(d.slice(n,n+g));n+=g}if(n<d.length)out.push(d.slice(n));return out.join(' ');}
function valid(value,id){const p=parse(value,id);return !p.unsupported&&p.country.lengths.includes(p.digits.length);}
function canonical(value,id){const p=parse(value,id);return p.digits?'+'+p.country.code+p.digits:'';}
function field(value,id,change,lang='RU'){
 const p=parse(value,id),c=p.country;
 const apply=v=>{const next=parse(v,c.id,true);if(next.unsupported)return;change('+'+next.country.code+next.digits.slice(0,15),next.country.id)};
 return {country:c.id, options:countries.map(x=>({id:x.id,label:x.flag+' +'+x.code+' · '+(x[String(lang).toLowerCase()]||x.ru)})),value:format(p.digits,c),placeholder:format('0'.repeat(Math.max(...c.lengths)),c).replace(/0/g,'_'),flag:c.flag,code:'+'+c.code,
 setCountry:e=>{const next=get(e.target.value);change('+'+next.code+(next.code===c.code?p.digits:''),next.id)},setPhone:e=>apply(e.target.value),
 paste:e=>{const v=e.clipboardData?.getData('text')||'';if(v.trim().startsWith('+')||v.trim().startsWith('00')||(c.code==='7'&&/^[78]\d{10}$/.test(digits(v)))){e.preventDefault();apply(v)}}};
}
const api={countries,parse,format,valid,canonical,field};
root.ShipaPhone=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
