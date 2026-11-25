const {test}=require('node:test');
const assert=require('node:assert/strict');
const p=require('./phone-input.js');
test('national digits and country switch produce international value',()=>{
 let value='',id='KZ';const set=(v,c)=>{value=v;id=c};
 p.field(value,id,set).setPhone({target:{value:'7012345678'}});
 assert.equal(value,'+77012345678');assert.equal(p.field(value,id,set).value,'701 234 56 78');
 p.field(value,id,set).setCountry({target:{value:'UZ'}});
 assert.equal(value,'+998');assert.equal(p.valid(value),false);
 p.field(value,id,set).setPhone({target:{value:'901234567'}});
 assert.equal(value,'+998901234567');assert.equal(p.valid(value),true);
});
test('full paste recognises international dial code and avoids duplication',()=>{
 let value='+7',id='KZ',prevented=false;const set=(v,c)=>{value=v;id=c};
 p.field(value,id,set).paste({clipboardData:{getData:()=>'+44 7700 900123'},preventDefault:()=>prevented=true});
 assert.equal(value,'+447700900123');assert.equal(id,'GB');assert.equal(prevented,true);
 assert.equal(p.valid(value),true);assert.equal(p.valid('+4477009001234'),false);
 assert.equal(p.canonical('87012345678'),'+77012345678');
 assert.equal(p.field('+7','KZ',set).value,'');
});
