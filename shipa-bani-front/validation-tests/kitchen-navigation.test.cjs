const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function method(name,context={}) {
  const marker = `  ${name}()`;
  const start=html.indexOf(marker);
  assert.ok(start>=0,`method ${name} exists`);
  let b=html.indexOf('{',start),level=0,end=-1;
  for(let i=b;i<html.length;i++){
    if(html[i]==='{')level++;
    else if(html[i]==='}' && --level===0){end=i+1;break;}
  }
  assert.ok(end>b);
  return vm.runInNewContext(`({${html.slice(start,end)}})`,context)[name];
}
test('Full menu CTA navigates to sibling e-menu folder, not internal kitchen screen',()=>{
  let opened='';
  const context={URL,window:{location:{href:'https://alexk1mkz.github.io/shipabani/shipa-bani-front/index.html',assign:(href)=>opened=href}}};
  method('openMenuUrl',context).call({props:{menuUrl:'../e-menu/'}});
  assert.equal(opened,'https://alexk1mkz.github.io/shipabani/e-menu/');
  assert.match(html,/<button[^>]+data-menu-cta="1"[^>]+onClick="\{\{ goKitchen \}\}"/);
  assert.match(html,/goKitchen:\(\)=>this\.openMenuUrl\(\)/);
  assert.match(html,/menuUrl:'\.\.\/e-menu\/'/);
});
test('Kitchen links in header, full-screen nav and booking point to e-menu',()=>{
  let called=0;
  method('goKitchenSection').call({openMenuUrl:()=>called++});
  assert.equal(called,1);
  assert.match(html,/menuItems=MENU\.map[\s\S]*?sc==='kitchen'\?this\.goKitchenSection\(\):this\.go\(sc\)/);
  assert.match(html,/navItems=\[/);
  assert.match(html,/openMenu:\(\)=>\{this\.closeBooking\(\);this\.goKitchenSection\(\);\}/);
  assert.match(html,/const menuLink='\.\.\/e-menu\/'/);
});
test('Menu URL works for repo-root localhost server',()=>{
  let opened='';
  const context={URL,window:{location:{href:'http://localhost:8000/shipa-bani-front/index.html',assign:(href)=>opened=href}}};
  method('openMenuUrl',context).call({props:{menuUrl:'../e-menu/'}});
  assert.equal(opened,'http://localhost:8000/e-menu/');
  assert.match(fs.readFileSync(path.join(__dirname,'..','START_WINDOWS.bat'),'utf8'), /\\e-menu\\index\.html/);
});
test('Menu CTA remains localized and accessible',()=>{
  assert.match(html,/menuCtaAccessibleLabel:s\.lang==='KZ'\?/);
  assert.match(html,/aria-label="\{\{ menuCtaAccessibleLabel \}\}"/);
  assert.match(fs.readFileSync(path.join(__dirname,'..','shipa-ru-kz.js'),'utf8'),/"Смотреть всё меню":"Барлық мәзірді көру"/);
});
