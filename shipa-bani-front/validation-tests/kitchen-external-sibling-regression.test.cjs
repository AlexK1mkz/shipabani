const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('  goKitchenSection(){');
assert.ok(start>=0);
const end=html.indexOf('  openMenuUrl(){', start);
const method=html.slice(start,end).trim();
function destination(base,menuUrl){
  const ctx={window:{location:{assign(url){this.url=url;}}},document:{baseURI:base},URL};
  const o=vm.runInNewContext('({'+method+'})',ctx);
  o.goKitchenSection.call({props:{menuUrl}});
  return ctx.window.location.url;
}
test('sibling folder resolves from frontend index path',()=>{
 assert.equal(destination('https://example.org/shipa-bani-front/index.html',''),'https://example.org/e-menu/');
});
test('sibling folder resolves when frontend is at its own directory URL',()=>{
 assert.equal(destination('https://example.org/shipa-bani-front/',''),'https://example.org/e-menu/');
});
test('explicit menu URL override is respected',()=>{
 assert.equal(destination('https://example.org/shipa-bani-front/index.html','./e-menu/'),'https://example.org/shipa-bani-front/e-menu/');
});
test('mobile/desktop/menu CTA route via external method, booking payment untouched',()=>{
 assert.match(html,/data-shipa-nav-screen="\{\{ m.screen \}\}"/);
 assert.match(html,/data-shipa-nav-screen="\{\{ n.screen \}\}"/);
 assert.match(html,/data-menu-cta="1" data-shipa-kitchen="1"/);
 assert.match(html,/onKitchenRouteClick=e=>/);
 assert.match(html,/this\.goKitchenSection\(\)/);
 assert.match(html,/this\.finish\(paid,m\)/);
});
