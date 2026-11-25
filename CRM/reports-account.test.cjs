const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { webcrypto: crypto } = require("node:crypto");
const vm = require('node:vm');

const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]+?)<\/script>/)[1];

function demo(storage = new Map(), confirm = () => false, browser = {}, document = { querySelector: () => null }) {
  const context = vm.createContext({
    DCLogic: class {
      setState(change, callback) {
        const patch = typeof change === 'function' ? change(this.state) : change;
        this.state = { ...this.state, ...patch };
        this.componentDidUpdate();
        callback?.();
      }
    },
    localStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    sessionStorage: { getItem:key=>storage.get(key)||null, setItem:(key,value)=>storage.set(key,value) },
    crypto, TextEncoder, URLSearchParams,
    window: { confirm, location: { reload() {} }, ...browser },
    document,
    setTimeout: () => 1,
    clearTimeout() {},
  });
  const api = vm.runInContext(
    script + '\n;({Component, bookingReport, keyOff, demoPasswordMatches, DEMO_AUTH_KEY})',
    context
  );
  return { ...api, crm: new api.Component() };
}


test('weeks start Monday; months group by arrival date, financial cancellation rules and house filter',()=>{
 const {bookingReport,keyOff}=demo();
 const b=(date,stage,paid,house='dyhanie')=>({day:keyOff(date),start:12,house,stage,guests:4,paid});
 const data=[b('2026-10-04','done',100),b('2026-10-05','confirmed',20),b('2026-10-06','cancel',0),b('2026-11-01','confirmed',40,'sila'),{...b('2026-10-06','new',0),start:null}];
 const calc=group=>bookingReport(data,{from:'2026-10-01',to:'2026-11-30',group,house:'all'},()=>({total:100}),b=>b.paid);
 const week=calc('week'),month=calc('month');
 assert.equal(week.rows[0].key,'2026-09-28');
 assert.equal(week.rows[0].count,1);
 assert.equal(week.rows[1].count,2);
 assert.equal(month.rows[0].count,3);
 assert.equal(month.rows[1].count,1);
 assert.equal(month.totals.count,4);
 assert.equal(month.totals.completed,1);
 assert.equal(month.totals.cancelled,1);
 assert.equal(month.totals.guests,12);
 assert.equal(month.totals.total,300);
 assert.equal(month.totals.paid,160);
 assert.equal(month.totals.rest,140);
 assert.equal(bookingReport(data,{from:'2026-10-01',to:'2026-11-30',group:'month',house:'sila'},()=>({total:100}),b=>b.paid).totals.count,1);
 assert.ok(bookingReport(data,{from:'2026-11-30',to:'2026-10-01',group:'week',house:'all'},()=>({total:100}),b=>b.paid).error);
});
test('isolated demo password cycle: wrong current password, change, logout, recovery and new login',async()=>{
 const store=new Map();
 const {crm,demoPasswordMatches,DEMO_AUTH_KEY}=demo(store);
 const event={preventDefault(){}},set=(fn,value)=>fn({target:{value}});
 crm.setState({screen:'account'});
 let a=()=>crm.renderVals().auth;
 a().change();
 set(a().setOld,'wrong');set(a().setNew,'DemoChanged123!');set(a().setConfirm,'DemoChanged123!');
 await a().submitChange(event);
 assert.equal(crm.state.authError,'Текущий пароль неверен.');
 set(a().setOld,'Demo1234!');
 await a().submitChange(event);
 assert.equal(crm.state.authSignedIn,false);
 assert.equal(await demoPasswordMatches('Demo1234!'),false);
 assert.equal(await demoPasswordMatches('DemoChanged123!'),true);
 assert.ok(!store.get(DEMO_AUTH_KEY).includes('DemoChanged123!'));
 set(a().setLogin,'DemoChanged123!');await a().submitLogin(event);
 assert.equal(crm.state.authSignedIn,true);
 a().logout();a().recover();a().issue();
 const code=crm.state.authRecovery.code;
 set(a().setCode,code==='000000'?'111111':'000000');a().verify(event);
 assert.equal(crm.state.authError,'Неверный код.');
 set(a().setCode,code);a().verify(event);
 assert.equal(crm.state.authMode,'reset');
 set(a().setNew,'DemoRecovered123!');set(a().setConfirm,'mismatch');await a().submitReset(event);
 assert.equal(crm.state.authError,'Пароли не совпадают.');
 set(a().setConfirm,'DemoRecovered123!');await a().submitReset(event);
 assert.equal(await demoPasswordMatches('DemoChanged123!'),false);
 assert.equal(await demoPasswordMatches('DemoRecovered123!'),true);
 set(a().setLogin,'DemoRecovered123!');await a().submitLogin(event);
 assert.equal(crm.state.authSignedIn,true);
 assert.equal(crm.state.authRecovery,null);
});
