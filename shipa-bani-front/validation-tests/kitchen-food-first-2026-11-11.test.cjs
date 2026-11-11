const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function meth(name){
  const i=html.indexOf(`  ${name}(`); assert.ok(i>=0,`${name} found`);
  const start=html.indexOf('{',i);let depth=0,end=-1;
  for(let p=start;p<html.length;p++){
    if(html[p]==='{')depth++;
    else if(html[p]==='}'&&!--depth){end=p+1;break;}
  }
  assert.ok(end>start);return vm.runInNewContext(`({${html.slice(i,end)}})`)[name];
}
test('Kitchen route goes to internal kitchen, never house catalogue',()=>{
 let screen=null; meth('goKitchenSection').call({go:s=>screen=s});assert.equal(screen,'kitchen');
 assert.match(html,/goKitchen:\(\)=>this\.goKitchenSection\(\)/);
 assert.match(html,/goKitchenSection\(\)\{this\.go\('kitchen'\);\}/);
});
test('Native click capture marks mobile/header/footer routes',()=>{
 assert.match(html,/data-mi="1" data-shipa-nav-screen="\{\{ m\.screen \}\}"/);
 assert.match(html,/data-nav="1" data-shipa-nav-screen="\{\{ n\.screen \}\}"/);
 assert.match(html,/<button type="button" data-shipa-nav-screen="\{\{ n\.screen \}\}" onClick="\{\{ n\.go \}\}"/);
 assert.match(html,/document\.addEventListener\('click',this\.onKitchenRouteClick,true\)/);
 assert.match(html,/if\(!el\)return;\s*e\.preventDefault\(\);e\.stopPropagation\(\)/);
});
test('Both main kitchen CTAs open the menu before booking',()=>{
 const ctx={goKitchenSection(){this.visited='kitchen'}};
 meth('beginTableBooking').call(ctx);assert.equal(ctx.visited,'kitchen');
 assert.match(html,/data-menu-cta="1" data-shipa-kitchen="1"[^>]+onClick="\{\{ goKitchen \}\}"/);
 assert.match(html,/data-shipa-kitchen="1" onClick="\{\{ beginTableBooking \}\}"/);
 assert.match(html,/Сначала блюда, затем дата и дом/);
});
test('Kitchen page has food cards and cart continues to date / house selection',()=>{
 assert.match(html,/isKitchen:screen==='kitchen'/);
 assert.match(html,/onClick="\{\{ k\.toggle \}\}"/);
 assert.match(html,/cartGoLabel:screen==='kitchen'/);
 assert.match(html,/cartGo:\(\)=>\{const cart=\[\.\.\.this\.state\.cart\];this\.openBooking\(null\)/);
 assert.match(html,/extras:\[\.\.\.new Set\(\[\.\.\.\(st\.bk\.extras\|\|\[\]\),\.\.\.\(cart\.some\(x=>x\.type==='dish'\)\?\['table'\]:\[\]\)\]\)/);
 assert.match(html,/step=h\?3:1/);
});
test('Both RU and KZ labels updated',()=>{
 for(const t of ['Выбрать блюда к бронированию','Брондауға тағам таңдау','Выбрать дату и дом','Күн мен үйді таңдау'])assert.ok(html.includes(t),t);
});
test('Prior fixes retained',()=>{
 assert.ok(!html.includes('ЧТО ВХОДИТ</h2>'));
 assert.match(html,/id="shipa-swipes-inline"/);
 assert.match(html,/data-shipa-kitchen="1"/);
 assert.match(html,/content="2026-11-11-full-qa-v3"/);
});
