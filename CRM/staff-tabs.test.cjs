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
    script + '\n;({Component})',
    context
  );
  return { ...api, crm: new api.Component() };
}



test('staff editor tabs preserve drafts, security demo actions require confirmation and saving',()=>{
 const store=new Map(),{crm}=demo(store);
 crm.renderVals().toggleRole();
 crm.editStaff('demo-admin');
 assert.equal(crm.staffView().mainTab,true);
 crm.setStaffDraft({name:'Айдана Тест'});
 crm.staffView().showAccess();
 assert.equal(crm.staffView().accessTab,true);
 assert.equal(crm.state.staffDraft.name,'Айдана Тест');
 crm.staffView().showSecurity();
 assert.equal(crm.staffView().securityTab,true);
 crm.staffView().askReset();
 assert.equal(crm.staffView().hasSecurityConfirm,true);
 crm.staffView().cancelSecurity();
 assert.equal(crm.staffView().hasSecurityEvents,false);
 crm.staffView().askSessions();crm.staffView().confirmSecurity();
 assert.equal(crm.staffView().securityEvents.length,1);
 assert.equal(crm.state.employees.find(x=>x.id==='demo-admin').demoSecurity,undefined);
 crm.dismissStaff();
 crm.editStaff('demo-admin');
 assert.equal(crm.staffView().hasSecurityEvents,false);
 crm.staffView().showSecurity();crm.staffView().askRecovery();crm.staffView().confirmSecurity();
 crm.saveStaff({preventDefault(){}});
 assert.equal(crm.state.employees.find(x=>x.id==='demo-admin').demoSecurity.length,1);
 assert.equal(demo(store).crm.state.employees.find(x=>x.id==='demo-admin').demoSecurity.length,1);
});
test('current owner is protected and new employee has no security actions',()=>{
 const {crm}=demo();crm.renderVals().toggleRole();crm.editStaff('demo-owner');
 crm.staffView().showSecurity();crm.staffView().askReset();crm.staffView().confirmSecurity();
 assert.equal(crm.staffView().hasSecurityConfirm,false);assert.equal(crm.staffView().hasSecurityEvents,false);
 crm.editStaff(null);crm.staffView().showSecurity();crm.staffView().askReset();crm.staffView().confirmSecurity();
 assert.equal(crm.staffView().mainTab,true);assert.equal(crm.staffView().hasSecurityConfirm,false);
});
