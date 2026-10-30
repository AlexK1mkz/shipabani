const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const mockedStorage=new Map();
const storage={getItem:k=>mockedStorage.get(k)||null,setItem:(k,v)=>mockedStorage.set(k,v),removeItem:k=>mockedStorage.delete(k)};
function getMethod(name){
 const sig=`  ${name}(`;const start=html.indexOf(sig);assert.ok(start!==-1,`method ${name} exists`);
 let first=html.indexOf('{',start); // method body starts at first '{' (all target signatures contain no object patterns)
 let depth=0,stop=first;
 for(let i=first;i<html.length;i++){if(html[i]==='{')depth++;else if(html[i]==='}'&&--depth===0){stop=i+1;break;}}
 const literal=html.slice(start,stop);
 return vm.runInNewContext(`({${literal}})`,{localStorage:storage,requestAnimationFrame:fn=>fn(),document:{querySelector:()=>({focus:()=>{}})}})[name];
}
function fake(state){const c={state:{...state},go:x=>c.navigated=x};c.setState=(patch,cb)=>{c.state={...c.state,...(typeof patch==='function'?patch(c.state):patch)};cb&&cb();};return c;}
test('Starts with two guests instead of six',()=>{
 assert.match(html,/quick:\{date:0,guests:2\}/);
 assert.match(html,/this\.state\.quick\.guests\|\|2/);
});
test('Close action asks instead of wiping an unfinished booking',()=>{
 const c=fake({bk:{step:3,date:2,houseId:'house1'},draftBk:null});
 const m=getMethod('closeBooking');m.call(c);assert.equal(c.state.exitConfirm,true);assert.equal(c.state.bk.step,3);
});
test('Save-and-exit persists draft and a later resume restores selections',()=>{
 mockedStorage.clear();const bk={step:3,date:2,houseId:'house1',guests:4,extras:['table']};
 const c=fake({bk,form:{name:'Тест',phone:'+77015550000',agree:true},savedBk:null});
 getMethod('confirmExitBooking').call(c,true);
 assert.equal(c.state.bk,null);assert.equal(c.state.draftBk.houseId,'house1');
 assert.deepEqual(JSON.parse(mockedStorage.get('shipa_draft')).bk.extras,['table']);
 getMethod('restoreBooking').call(c);assert.equal(c.state.bk.houseId,'house1');assert.equal(c.state.bk.guests,4);
 assert.equal(c.state.draftBk,null);
});
test('Discard exit clears stored draft',()=>{
 mockedStorage.set('shipa_draft','stale');const c=fake({bk:{step:4},form:{name:'',phone:'',agree:false}});
 getMethod('confirmExitBooking').call(c,false);assert.equal(mockedStorage.has('shipa_draft'),false);
 assert.equal(c.state.draftBk,null);
});
test('Return from house detail keeps step, date and guests and restores route',()=>{
 const saved={step:2,date:6,guests:3,extras:[]};
 const c=fake({screen:'house',houseId:'house2',savedBk:saved,bk:null,history:[{screen:'home',houseId:null}]});
 getMethod('returnToBooking').call(c);
 assert.equal(c.state.screen,'home');assert.equal(c.state.houseId,null);
 assert.equal(c.state.bk.step,2);assert.equal(c.state.bk.date,6);assert.equal(c.state.bk.guests,3);
 assert.equal(c.state.savedBk,null);
});
test('Kitchen CTA starts a booking with selected table service',()=>{
 const c={openBooking:(...args)=>c.args=args};getMethod('beginTableBooking').call(c);
 assert.deepEqual(Array.from(c.args[4]),['table']);
 assert.match(html,/beginTableBooking:.*this\.beginTableBooking/);
});
test('Tariff and availability colors are explained separately',()=>{
 assert.match(html,/class="shipa-ux-tariff-legend"/);
 assert.match(html,/class="shipa-ux-status-legend"/);
 assert.match(html,/Тариф \(фон ячейки\)/);
 assert.match(html,/Доступность времени/);
});
test('Alternative WhatsApp action and mobile extras controls are live',()=>{
 assert.match(html,/href="\{\{ waStep4 \}\}"[^>]+>\{\{ waAlternativeAction \}\}/);
 assert.match(html,/onClick="\{\{ toggleExtras \}\}"/);
 assert.match(html,/aria-controls="bk-extra-options"/);
 assert.match(html,/onClick="\{\{ restoreBooking \}\}"/);
 assert.match(html,/onClick="\{\{ returnToBooking \}\}"/);
});
test('All UI conditional tags remain balanced',()=>{
 for(const tag of ['sc-if','sc-for']){
 const opened=(html.match(new RegExp(`<${tag}\\s`,'g'))||[]).length;
 const closed=(html.match(new RegExp(`</${tag}>`,'g'))||[]).length;
 assert.equal(opened,closed,tag);
 }
});
