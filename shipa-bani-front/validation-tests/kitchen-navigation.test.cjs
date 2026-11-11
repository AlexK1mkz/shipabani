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
test('Full menu CTA uses the internal kitchen screen, even when an old external URL exists',()=>{
 let screen='';
 method('openMenuUrl').call({goKitchenSection:()=>screen='kitchen',props:{menuUrl:'../e-menu/'}});
 assert.equal(screen,'kitchen');
 assert.match(html,/data-menu-cta="1" data-shipa-kitchen="1"/);
 assert.match(html,/goKitchen:\(\)=>this\.goKitchenSection\(\)/);
});
test('Header, fullscreen mobile nav, footer and kitchen buttons all route internally',()=>{
 let screen='';method('goKitchenSection').call({go:s=>screen=s});assert.equal(screen,'kitchen');
 for(const needle of ['data-shipa-nav-screen="{{ n.screen }}"','data-shipa-nav-screen="{{ m.screen }}"','data-shipa-kitchen="1"'])
   assert.ok(html.includes(needle),needle);
 assert.match(html,/document\.addEventListener\('click',this\.onKitchenRouteClick,true\)/);
 assert.match(html,/const navItems=\[\['Дома','houses'\],\['Парение','services'\],\['Кухня','kitchen'\]/);
});
test('Kitchen has a direct-load hash route for old or shared links',()=>{
 assert.match(html,/window\.location\.hash==='#kitchen'/);
 assert.match(html,/const hash=screen==='kitchen'\?'#kitchen':''/);
 assert.ok(html.includes('<sc-if value="{{ isKitchen }}"'));
});
test('Menu CTA remains localized and accessible',()=>{
  assert.match(html,/menuCtaAccessibleLabel:s\.lang==='KZ'\?/);
  assert.match(html,/aria-label="\{\{ menuCtaAccessibleLabel \}\}"/);
  assert.match(fs.readFileSync(path.join(__dirname,'..','shipa-ru-kz.js'),'utf8'),/"Смотреть всё меню":"Барлық мәзірді көру"/);
});
