const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
// Test the production methods directly rather than a reimplementation of the logic.
const source=html.slice(html.indexOf('  maxFrom(hi,H){'),html.indexOf('  anyFree(hi,di){'));
assert(source.startsWith('  maxFrom(hi,H){')&&source.includes('validHoursSelection(bk)'));
const CFG={open:10,close:26,lastStart:21,minH:3,maxH:16,prep:2};
const HOUSES=[{id:'a',min:3}];
const objectSource=source.replace(/\n  (canStart|validHoursSelection)\(/g,'\n  ,$1(');
const methods=new Function('CFG','HOUSES',`return ({${objectSource}})`)(CFG,HOUSES);
const make=(nextBusy=null,blocked=[])=>Object.assign({
  nextBusyH:()=>nextBusy,
  cell:(_i,H)=>blocked.includes(H)?'busy':'free',
},methods);
function selected(start,dur,date=0){return {houseId:'a',date,start:date*24+start,dur};}
test('23:00 has three hours, midnight two and 01:00 only one before 02:00 closing',()=>{
 const b=make();
 assert.equal(b.maxFrom(0,23),3);
 assert.equal(b.maxFrom(0,24),2);
 assert.equal(b.maxFrom(0,25),1);
 assert.equal(b.maxFrom(0,26),0);
 assert.equal(b.maxFrom(0,48+25),1);
});
test('late check-in forbidden even if closing is several hours away',()=>{
 const b=make();
 for(const h of [22,23,24,25])assert.equal(b.canStart(0,h),false);
 assert.equal(b.canStart(0,21),true);
});
test('20:00+8 hours, 21:00+6 hours and 01:00+8 hours are rejected',()=>{
 const b=make();
 for(const booking of [selected(20,8),selected(21,6),selected(25,8),selected(24,3),selected(22,3)]){
   assert.equal(b.validHoursSelection(booking),false,JSON.stringify(booking));
 }
});
test('valid check-ins and durations fit within closing',()=>{
 const b=make();
 for(const booking of [selected(10,16),selected(14,12),selected(18,8),selected(21,5),selected(21,3),selected(18,8,3)]){
   assert.equal(b.validHoursSelection(booking),true,JSON.stringify(booking));
 }
});
test('next booking with preparation time reduces maximum rental duration',()=>{
 const b=make(25);
 assert.equal(b.maxFrom(0,19),4); // busy from 01:00, needs 2h preparation
 assert.equal(b.validHoursSelection(selected(19,5)),false);
 assert.equal(b.validHoursSelection(selected(19,4)),true);
});
test('invalid booking date, home and duration cannot bypass validation',()=>{
 const b=make();
 assert.equal(b.validHoursSelection({date:0,start:20,dur:3,houseId:'unknown'}),false);
 assert.equal(b.validHoursSelection({date:0,start:20,dur:2,houseId:'a'}),false);
 assert.equal(b.validHoursSelection({date:0,start:20,dur:3.5,houseId:'a'}),false);
 assert.equal(b.validHoursSelection({date:1,start:20,dur:3,houseId:'a'}),false);
});
test('step 3 checks availability afresh before proceeding',()=>{
 assert.match(html,/if\(bk\.step===3\)return bk\.mode==='daily'\?this\.dailyOk\(/);
 assert.match(html,/this\.validHoursSelection\(bk\)/);
 assert.match(html,/durs:\[3,4,5,6,8,10,12\]/);
});
