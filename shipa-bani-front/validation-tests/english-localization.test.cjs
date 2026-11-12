const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),en=read('shipa-en-text.js'),locale=read('shipa-ru-kz.js'),viewer=read('shipa-photo-viewer.js');
function translator(){
  const node={nodeType:3,nodeValue:'Найти свободный дом',parentElement:{tagName:'DIV'}};
  const body={nodeType:1,tagName:'BODY',querySelectorAll(){return [];}};
  const document={readyState:'loading',body,documentElement:{lang:'ru',dataset:{}},title:'SHIPÁ',addEventListener(){},dispatchEvent(){},querySelector(){return null;},querySelectorAll(){return [];},createTreeWalker(){let done=false;return {currentNode:null,nextNode(){if(done)return false;done=true;this.currentNode=node;return true;}}}};
  const window={};
  const context={window,document,NodeFilter:{SHOW_TEXT:4},CustomEvent:class{},localStorage:{getItem(){return null;},setItem(){}},setTimeout(){}};
  vm.runInNewContext(en,context);
  vm.runInNewContext(locale,context);
  return {window,document,node};
}
test('EN dictionary contains extensive human-authored interface translations',()=>{
  const window={};vm.runInNewContext(en,{window});
  assert.ok(Object.keys(window.ShipaEnText).length>=900);
  for(const s of ['Забронировать','Дома','Кухня','О нас','Предоплата','Отзывы','Оставить отзыв','Видео-приветствие','Скоро открытие'])assert.ok(window.ShipaEnText[s],s);
});
test('RU -> EN -> KZ -> RU correctly restores text',()=>{
  const {window,document,node}=translator();
  window.ShipaLocale.set('EN');
  assert.equal(node.nodeValue,'Find an available house');
  assert.equal(document.documentElement.lang,'en');
  window.ShipaLocale.set('KZ');
  assert.equal(node.nodeValue,'Бос үйді табу');
  assert.equal(document.documentElement.lang,'kk');
  window.ShipaLocale.set('RU');
  assert.equal(node.nodeValue,'Найти свободный дом');
  assert.equal(document.documentElement.lang,'ru');
});
test('three-language navigation UI is complete on desktop, mobile and in footer',()=>{
  assert.match(html,/const LANGS=\['RU','KZ','EN'\]/);
  assert.match(html,/const l=localStorage\.getItem\('shipa-lang'\)/);
  assert.match(html,/shipa-mobile-language__trigger/);
  assert.match(html,/shipa-mobile-language__panel/);
  assert.match(html,/langChoices:LANGS\.map/);
  assert.match(html,/shipa-en-text\.js/);
  assert.match(html,/langPopup:false/);
});
test('menu URL receives EN while preserving old RU and KZ routes',()=>{
  assert.match(html,/if\(this\.state\?\.lang==='EN'\)/);
  assert.match(html,/menuPage\.searchParams\.set\('lang','EN'\)/);
  assert.match(html,/window\.location\.assign\(new URL\(target,document\.baseURI\)\.href\)/);
});
test('legal EN pages exist, and originals are unchanged',()=>{
  for(const kind of ['offer','privacy','consent']){
    const file=read('legal/'+kind+'-en.html');
    assert.match(file,/<html lang="en"/);
    assert.match(file,/legal-document/);
    assert.match(file,/Russian original/);
    assert.match(file,/Kazakh original/);
    assert.match(html,new RegExp('legal/'+kind+'-en\\.html'));
  }
});
test('photo viewer localizes controls for EN and keeps thumbnail alignment',()=>{
  assert.match(viewer,/currentLang\(\)==='EN'\?en:ru/);
  assert.match(viewer,/Photo \$\{i\+1\} of \$\{items\.length\}/);
  assert.match(viewer,/justify-content:safe center/);
});
test('in-page legal modal loads English articles and shows EN controls',()=>{
  const match=html.match(/<script id="shipa-legal-payload" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'in-page legal payload is present');
  const docs=JSON.parse(match[1]);
  for(const kind of ['offer','privacy','consent']){
    const doc=docs[kind+'-en'];
    assert.equal(doc.lang,'en');
    assert.match(doc.nav,/English reference version/);
    assert.match(doc.article,/legal-document/);
  }
  assert.match(html,/\(offer\|privacy\|consent\)-\(ru\|kz\|en\)/);
  assert.match(html,/doc\.lang==='en'\?'Close'/);
  assert.match(html,/lang==='EN'\|\|lang==='en'/);
});
