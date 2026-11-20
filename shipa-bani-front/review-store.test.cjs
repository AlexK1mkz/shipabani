const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = readFileSync(join(__dirname, 'review-store.js'), 'utf8');

test('publishes every rating and keeps follow-up state and contact details out of public cards', () => {
  const localStorage = {
    getItem(key) { return this[key] ?? null; },
    setItem(key, value) { this[key] = value; },
  };
  localStorage.setItem('shipa_crm_demo_v1', JSON.stringify({
    reviews: [{ id: 5, status: 'hidden', reply: 'Existing reply' }],
  }));
  const openTab = () => {
    const window = new EventTarget();
    vm.runInNewContext(source, { window, localStorage, crypto, Event });
    return window.ShipaReviews;
  };
  const form = openTab();
  const customerSite = openTab();
  const crm = openTab();
  const low = form.submit({ house: 'dyhanie', rating: 1, guest: 'Test Guest', phone: '77000000000', num: 'TEST-1', callback: true, text: 'Test feedback' });
  const high = form.submit({ house: 'sila', rating: 5 });
  assert.equal(customerSite.published().find(r => r.id === high).rating, 5);
  const published = customerSite.published().find(r => r.id === low);
  assert.equal(published.rating, 1);
  assert.equal(published.guest, 'Test');
  assert.equal(published.text, 'Test feedback');
  for (const privateKey of ['phone', 'num', 'callback', 'contacted']) assert.equal(Object.hasOwn(published, privateKey), false);
  assert.equal(crm.list().find(r => r.id === low).contacted, false);
  let updates = 0;
  const unsubscribe = crm.subscribe(() => { updates++; });
  crm.updateFollowUp(low, { contacted: true });
  crm.updateFollowUp(low, { reply: 'Thank you for your feedback' });
  unsubscribe();
  assert.equal(updates, 2);
  assert.equal(openTab().list().find(r => r.id === low).contacted, true);
  assert.equal(customerSite.published().find(r => r.id === low).reply, 'Thank you for your feedback');
  assert.equal(crm.list().find(r => r.id === 5).status, 'published');
  assert.equal(customerSite.published().find(r => r.id === 5).reply, 'Existing reply');
});
