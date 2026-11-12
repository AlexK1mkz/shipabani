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
test('Kitchen links open sibling e-menu rather than the internal kitchen page',()=>{
 let opened='';
 const fn=method('goKitchenSection',{window:{location:{assign:u=>opened=u}},document:{baseURI:'https://example.com/shipa-bani-front/index.html'},URL});
 fn.call({props:{menuUrl:''}});
 assert.equal(opened,'https://example.com/e-menu/');
 opened='';
 fn.call({props:{menuUrl:'../e-menu/'}});
 assert.equal(opened,'https://example.com/e-menu/');
 assert.doesNotMatch(html,/goKitchenSection\(\)\{this\.go\('kitchen'\);\}/);
 assert.match(html,/data-menu-cta="1" data-shipa-kitchen="1"/);
 assert.match(html,/goKitchen:\(\)=>this\.goKitchenSection\(\)/);
});
test('Header, mobile menu, footer and kitchen cards route to the external menu',()=>{
 assert.match(html,/data-shipa-nav-screen="\{\{ n.screen \}\}"/);
 assert.match(html,/data-shipa-nav-screen="\{\{ m.screen \}\}"/);
 assert.match(html,/data-shipa-kitchen="1"/);
 assert.match(html,/document\.addEventListener\('click',this\.onKitchenRouteClick,true\)/);
 assert.match(html,/this\.goKitchenSection\(\)/);
});
test('Old shared #kitchen links redirect to sibling e-menu',()=>{
 assert.match(html,/window\.location\.hash==='#kitchen'\)this\.goKitchenSection\(\)/);
 assert.ok(html.includes('<sc-if value="{{ isKitchen }}"'));
});
test('Menu CTA remains localized and accessible',()=>{
  assert.match(html,/menuCtaAccessibleLabel:s\.lang==='KZ'\?/);
  assert.match(html,/aria-label="\{\{ menuCtaAccessibleLabel \}\}"/);
  assert.match(fs.readFileSync(path.join(__dirname,'..','shipa-ru-kz.js'),'utf8'),/"Смотреть всё меню":"Барлық мәзірді көру"/);
});
