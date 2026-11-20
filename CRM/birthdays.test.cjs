const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]+?)<\/script>/)[1];

test('dashboard includes birthdays today through day 14, sorts them, and opens the guest', () => {
  const context = vm.createContext({
    DCLogic: class {
      setState(change, callback) {
        this.state = { ...this.state, ...(typeof change === 'function' ? change(this.state) : change) };
        this.componentDidUpdate();
        callback?.();
      }
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    URLSearchParams,
    window: { confirm: () => false, location: { reload() {} } },
    document: { querySelector: () => null },
    setTimeout: () => 1,
    clearTimeout() {},
  });
  const { Component, dkey } = vm.runInContext(script + '\n;({Component,dkey})', context);
  const crm = new Component();
  const guest = crm.state.clients[0];
  crm.state.clients = [15, 14, 8, 0].map(days => ({ ...guest, id: `birthday-${days}`, name: `Guest ${days}`, birthday: `1990${dkey(days).slice(4)}` }));
  crm.state.clients.push({ ...guest, id: 'no-birthday', birthday: '' });
  const rows = crm.renderVals().bdays;
  assert.deepEqual(Array.from(rows, row => row.name), ['Guest 0', 'Guest 8', 'Guest 14']);
  rows[2].open();
  assert.equal(crm.state.clientId, 'birthday-14');
  crm.state.clients = [{ ...guest, birthday: `1990${dkey(15).slice(4)}` }];
  assert.equal(crm.renderVals().noBdays, true);
});
