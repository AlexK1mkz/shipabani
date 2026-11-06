const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),locale=read('shipa-ru-kz.js'),photo=read('shipa-photo-viewer.js');
function dictionaryVm(){
 const code=locale.replace('const exact=new Map(Object.entries(dictionary));','window.__dict=dictionary;const exact=new Map(Object.entries(dictionary));')
  .replace('const originalText=new WeakMap()','window.__translate=translate;const originalText=new WeakMap()');
 const window={};
 const document={readyState:'loading',addEventListener(){},documentElement:{},body:{}};
 vm.runInNewContext(code,{window,document,localStorage:{getItem:()=>null},setTimeout(){},CustomEvent:class{}});
 return window;
}
const localeVm=dictionaryVm();
const ruInventory=read('i18n-tests/kz-template-inventory.csv').replace(/^\uFEFF/,'');
function parseCsv(str){let rows=[],row=[],cur='',q=false;for(let i=0;i<str.length;i++){const c=str[i];if(c==='"'){if(q&&str[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){row.push(cur);cur='';}else if(c==='\n'&&!q){row.push(cur.replace(/\r$/,''));rows.push(row);cur='';row=[];}else cur+=c;}return rows}
test('all previously unlocalized visible/static labels and attributes have translation',()=>{
 const exempt=new Set(['Атмосфера','Телефон','2ГИС','2ГИС ↗','Яндекс','м²','2Г','Ещё  фото']);
 const missing=[...new Set(parseCsv(ruInventory).slice(1).map(r=>r[2]).filter(x=> x && /[А-Яа-яЁё]/.test(x) && !exempt.has(x) && localeVm.__translate(x)===x))];
 assert.deepEqual(missing,[]);
});
test('all 4 kitchen tabs and 12 dishes have native KZ names, descriptions, portions and stable IDs',()=>{
 const inline=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(inline,'inline application source');
 const block=inline.slice(inline.indexOf('const KITCHEN='),inline.indexOf('const PILLARS=['));
 const window={};
 const model=vm.runInNewContext(block+'\n({KITCHEN,KITCHEN_KZ,KITCHEN_LABEL_KZ,menuDish})',{window});
 assert.equal(Object.keys(model.KITCHEN).length,4);
 for(const category of Object.keys(model.KITCHEN)){
  assert.ok(model.KITCHEN_LABEL_KZ[category] && model.KITCHEN_LABEL_KZ[category]!==category);
  const orig=model.KITCHEN[category], kk=model.KITCHEN_KZ[category];
  assert.equal(orig.length,kk.length,category);
  for(let i=0;i<orig.length;i++){
   assert.ok(kk[i].name&&kk[i].desc,category+' '+i);
   assert.notEqual(kk[i].name,orig[i].name,category+' '+i);
   assert.notEqual(kk[i].desc,orig[i].desc,category+' '+i);
   assert.equal(model.menuDish(category,i,'KZ').price,orig[i].price);
   if(orig[i].portion)assert.ok(kk[i].portion,category+' portion '+i);
   assert.equal(model.menuDish(category,i,'RU').name,orig[i].name);
  }
 }
 assert.ok(html.includes("label:s.lang==='KZ'?KITCHEN_LABEL_KZ[t]:t"));
 assert.ok(html.includes("kicker:s.lang==='KZ'?(KITCHEN_LABEL_KZ[c.cat]||'Ас мәзірі')"));
});
test('cart always displays names for current language, including items selected in another language',()=>{
 assert.ok(html.includes('const menuItemName=(item,lang)=>'));
 assert.ok(html.includes("s.cart.map(x=>menuItemName(x,s.lang)).join(', ')"));
 assert.ok(html.includes("cartProgs.length===cn?'бағдарлама':'тауар'"));
});
test('mobile navigation and conditional sections render KZ model values',()=>{
 assert.ok(html.includes("services:'Булау және қызметтер'"));
 assert.ok(html.includes("label:s.lang==='KZ'?MENU_KZ[sc]:label"));
 assert.ok(html.includes('const MASTERS_KZ=['));
 assert.ok(html.includes("...(s.lang==='KZ'?MASTERS_KZ[i]:{})"));
 assert.ok(html.includes("const WA_TEXT_KZ={"));
 assert.ok(html.includes("this.state.lang==='KZ'&&(P[k]==null||P[k]===WA_TEXT[k])"));
 assert.ok(html.includes('const SERVICE_CATS_KZ=['));
 assert.ok(html.includes('const MERCH_KZ=['));
 assert.ok(html.includes("greetTitle:s.lang==='KZ'"));
});
test('photo viewer controls localize on open and RU/KZ language change',()=>{
 assert.ok(photo.includes('function refreshLocale()'));
 assert.ok(photo.includes("document.addEventListener('shipa:languagechange',refreshLocale)"));
 assert.ok(photo.includes("currentLang()==='KZ'?`${items.length} фотосуреттің ${i+1}-і`"));
 assert.ok(locale.includes("document.dispatchEvent(new CustomEvent('shipa:languagechange'"));
});
test('reversible translator preserves known exact KZ strings in RU->KZ->RU control set',()=>{
 const d=localeVm.__dict;
 const keys=['Какой дом хотите?','Чайная карта','Как вас зовут','Основное меню','Навигация по карточкам','Парение и услуги','Меньше детей','Закрыть фотографии','Мы используем cookie для работы брони.','Изменить время и опции'];
 for(const ru of keys){
  assert.ok(d[ru],ru);
  assert.notEqual(localeVm.__translate(ru),ru);
 }
});
test('RU -> KZ -> RU restores original text and changes document language',()=>{
  const node={nodeType:3,nodeValue:'Какой дом хотите?',parentElement:{tagName:'DIV'}};
  const root={nodeType:1,tagName:'BODY',querySelectorAll(){return [];}};
  const document={readyState:'loading',body:root,documentElement:{lang:'ru'},addEventListener(){},dispatchEvent(){},querySelectorAll(){return [];},createTreeWalker(){let done=false;return {currentNode:null,nextNode(){if(done)return false;done=true;this.currentNode=node;return true}}}};
  const window={};
  vm.runInNewContext(locale,{window,document,NodeFilter:{SHOW_TEXT:4},CustomEvent:class{},localStorage:{getItem(){return null},setItem(){}},setTimeout(){}});
  window.ShipaLocale.set('KZ');
  assert.equal(node.nodeValue,'Қай үйді таңдайсыз?');
  assert.equal(document.documentElement.lang,'kk');
  window.ShipaLocale.set('RU');
  assert.equal(node.nodeValue,'Какой дом хотите?');
  assert.equal(document.documentElement.lang,'ru');
});
