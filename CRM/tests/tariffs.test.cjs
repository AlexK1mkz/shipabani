const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]+?)<\/script>/)[1];

function demo(storage = new Map(), confirm = () => false) {
  const context = vm.createContext({
    DCLogic: class {
      setState(change) {
        const patch = typeof change === 'function' ? change(this.state) : change;
        Object.assign(this.state, patch);
        this.componentDidUpdate();
      }
    },
    localStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    window: { confirm, location: { reload() {} } },
    document: { querySelector: () => null },
    setTimeout: () => 1,
    clearTimeout() {},
  });
  const api = vm.runInContext(
    script + '\n;({Component, BASE_VERSION, clone, calcPrice, keyOff, slotError, dkey, validateVersion, versionAt, DEMO_KEY})',
    context
  );
  return { ...api, crm: new api.Component() };
}

const event = value => ({ target: { value: String(value) } });
const visit = { house: 'dyhanie', day: 3, start: 15, dur: 4, guests: 14 };
const storedBooking = (crm, num) => crm.state.bookings.find(b => b.num === num);

test('splits day, evening and hours after midnight, and applies holiday/weekday rates', () => {
  const { calcPrice, BASE_VERSION, keyOff } = demo();
  const monday = calcPrice(BASE_VERSION, visit);
  assert.equal(monday.total, 160500); // (2 × 40000 + 2 × 45000) × 85% + 2 × 8000
  assert.equal(monday.prepay, 40000);
  assert.equal(calcPrice(BASE_VERSION, { ...visit, day: 1 }).total, 186000);
  assert.equal(calcPrice(BASE_VERSION, { ...visit, day: keyOff('2026-12-16') }).total, 186000);
  assert.equal(calcPrice(BASE_VERSION, { ...visit, day: 1, start: 21, dur: 5, guests: 12 }).total, 225000);
});

test('applies category-specific special prices on both endpoints and includes extras and deposit', () => {
  const { calcPrice, BASE_VERSION, clone, keyOff } = demo();
  const v = clone(BASE_VERSION);
  v.specials.push({ cat: 'smallStd', name: 'Период', from: '2026-10-19', to: '2026-10-20', day: 31000, evening: 34000 });
  const booking = { ...visit, house: 'energiya', guests: 8, tub: true, services: ['kit'], qty: { kit: 2 } };
  for (const key of ['2026-10-19', '2026-10-20']) {
    const price = calcPrice(v, { ...booking, day: keyOff(key) });
    assert.equal(price.total, 164000);
    assert.equal(price.prepay, 20000);
    assert.match(price.rows[0].l, /Период/);
  }
  assert.equal(calcPrice(v, { ...booking, day: keyOff('2026-10-21') }).total, 127500);
  assert.equal(calcPrice(v, visit).total, 160500);
  v.tar.bigVip.disc = 100;
  assert.equal(calcPrice(v, { ...visit, guests: 12 }).prepay, 0);
});

test('validates dates, prices, capacity, percentages, working hours and overlapping periods', () => {
  const { BASE_VERSION, clone, keyOff, slotError, validateVersion } = demo();
  const v = clone(BASE_VERSION);
  v.from = '2026-02-30';
  assert.ok(validateVersion(v, [BASE_VERSION]));
  assert.ok(Number.isNaN(keyOff('2026-02-30')));
  v.from = '2026-10-19';
  for (const [k, invalid] of [['day', -1], ['prepay', ''], ['disc', 101]]) {
    const original = v.tar.bigVip[k];
    v.tar.bigVip[k] = invalid;
    assert.ok(validateVersion(v, [BASE_VERSION]));
    v.tar.bigVip[k] = original;
  }
  v.specials = [
    { cat: 'bigVip', name: 'Первый', from: '2026-10-19', to: '2026-10-20', day: 50000, evening: 50000 },
    { cat: 'bigVip', name: 'Второй', from: '2026-10-20', to: '2026-10-22', day: 50000, evening: 50000 },
  ];
  assert.match(validateVersion(v, [BASE_VERSION]), /пересекаются/);
  assert.equal(slotError(v, { ...visit, start: 21, dur: 5 }), '');
  for (const patch of [{ start: 9 }, { start: 22 }, { start: 21, dur: 6 }, { guests: 17 }, { guests: 16, kids: 1 }, { kids: -1 }, { day: NaN }]) {
    assert.ok(slotError(v, { ...visit, ...patch }));
  }
});

test('enforces demo roles across tariffs and holidays, and cancels a draft', () => {
  const { crm } = demo();
  const admin = crm.renderVals();
  admin.startDraft();
  admin.addHol();
  admin.holRows[0].setName(event('Название'));
  admin.holRows[0].del();
  assert.equal(crm.state.tarDraft, null);
  assert.equal(crm.state.holidays.length, 12);
  admin.toggleRole();
  crm.renderVals().startDraft();
  const owner = crm.renderVals();
  owner.catRows[4].fields[2].set(event(56000));
  assert.equal(crm.state.tarDraft.tar.bigVip.day, '56000');
  owner.cancelDraft();
  assert.equal(crm.state.versions.length, 1);
  crm.renderVals().startDraft();
  const stale = crm.renderVals();
  stale.toggleRole();
  stale.addSpecial();
  stale.publishTariff();
  stale.holRows[0].del();
  assert.equal(crm.state.tarDraft, null);
  assert.equal(crm.state.versions.length, 1);
  assert.equal(crm.state.holidays.length, 12);
});

test('creates, edits, moves and persists a booking with its original price intact', () => {
  const storage = new Map();
  const { crm } = demo(storage);
  crm.setState({ nb: { ...crm.newNb({ ...visit, guests: 12, day: 90, start: 15 }), first: 'Тест', last: 'Демо' } });
  const originalForm = crm.renderVals();
  assert.equal(originalForm.nbDisabled, false, originalForm.nbConflictText);
  originalForm.createBooking();
  const num = crm.state.openId;
  const original = storedBooking(crm, num).originalQuote;
  assert.equal(original.total, 144500);
  crm.renderVals().toggleRole();
  crm.renderVals().startDraft();
  let ui = crm.renderVals();
  ui.setDraftFrom(event('2027-01-13'));
  ui.catRows[4].fields[2].set(event(60000));
  ui.publishTariff();
  assert.equal(crm.state.versions.length, 2);
  assert.equal(crm.rules(3).from, '2026-10-01');
  assert.equal(crm.rules(90).from, '2027-01-13');
  assert.equal(crm.price(storedBooking(crm, num)).total, original.total);
  assert.equal(crm.price({ ...visit, day: 90, guests: 12 }).total, 178500);

  crm.renderVals().edit.guests(event(13));
  assert.equal(storedBooking(crm, num).quote.total, original.total + 8000);
  assert.equal(storedBooking(crm, num).originalQuote.total, original.total);
  crm.startRs(num, { day: 91, start: 15 });
  ui = crm.renderVals();
  assert.equal(ui.rsv.cantSave, false, ui.rsv.err);
  ui.rsv.save();
  assert.equal(storedBooking(crm, num).quote.from, '2027-01-13');
  assert.equal(storedBooking(crm, num).originalQuote.from, '2026-10-01');

  const reloaded = demo(storage).crm;
  assert.equal(reloaded.state.versions.length, 2);
  assert.equal(storedBooking(reloaded, num).quote.total, crm.price(storedBooking(crm, num)).total);
  assert.equal(storedBooking(reloaded, num).originalQuote.total, original.total);
});

test('respects the preparation buffer, including conflicts across dates', () => {
  const { crm } = demo();
  crm.setState({ bookings: [{ num: '№ 1', house: 'sila', day: 9, start: 21, dur: 5, stage: 'confirmed' }] });
  assert.ok(crm.conflict({ house: 'sila', day: 9, start: 17, dur: 3 }));
  assert.ok(!crm.conflict({ house: 'sila', day: 9, start: 16, dur: 3 }));
  assert.ok(crm.conflict({ house: 'sila', day: 10, start: 3, dur: 3 }));
  assert.ok(!crm.conflict({ house: 'sila', day: 10, start: 4, dur: 3 }));
  assert.ok(!crm.conflict({ house: 'sila', day: 9, start: 21, dur: 5 }, '№ 1'));
});

test('validates payment, records deposit and refund, and calculates loyalty from paid sums', () => {
  const { crm } = demo();
  const b = crm.state.bookings.find(b => b.stage === 'prepay' && b.start != null);
  crm.setState({ openId: b.num, pf: { sum: '-1', type: 'Предоплата', method: 'Kaspi' } });
  crm.renderVals().fixPay();
  assert.equal(crm.paid(storedBooking(crm, b.num)), 0);
  crm.renderVals().pfSet.sum(event(100));
  crm.renderVals().fixPay();
  assert.equal(storedBooking(crm, b.num).stage, 'prepay');
  crm.renderVals().pfSet.type(event('Предоплата'));
  crm.renderVals().fixPay();
  assert.equal(crm.paid(storedBooking(crm, b.num)), crm.price(b).prepay);
  assert.equal(storedBooking(crm, b.num).stage, 'confirmed');
  crm.renderVals().pfSet.type(event('Возврат'));
  crm.renderVals().pfSet.sum(event(100));
  crm.renderVals().fixPay();
  assert.equal(crm.paid(storedBooking(crm, b.num)), crm.price(b).prepay - 100);
  const loyalGuest = crm.state.clients.find(c => c.hist > 0);
  const options = crm.discFor(loyalGuest, 3);
  assert.ok(crm.loyal(loyalGuest).pts > 0);
  assert.ok(crm.bestDisc(options).pct > 0);
});

test('renders all calendar modes and cancels or confirms the owner-only reset', () => {
  const storage = new Map([['shipa-lang', 'KZ']]);
  let confirmed = false;
  const { crm, DEMO_KEY } = demo(storage, () => confirmed);
  crm.renderVals().calWeekMode();
  assert.equal(crm.renderVals().weekDays.length, 7);
  crm.renderVals().calMonthMode();
  assert.ok(crm.renderVals().monthCells.length >= 28);
  crm.renderVals().calDayMode();
  assert.ok(crm.renderVals().calRows.length === 8);
  assert.ok(!storage.has(DEMO_KEY));
  crm.setState({ bookings: crm.state.bookings.slice(1) });
  assert.ok(storage.has(DEMO_KEY));
  crm.renderVals().resetDemo();
  assert.ok(storage.has(DEMO_KEY));
  crm.renderVals().toggleRole();
  crm.renderVals().resetDemo();
  assert.ok(storage.has(DEMO_KEY));
  confirmed = true;
  crm.renderVals().resetDemo();
  assert.ok(!storage.has(DEMO_KEY));
  assert.equal(storage.get('shipa-lang'), 'KZ');
});

test('localizes the tariff editor and restores Russian after switching back', () => {
  const script = readFileSync(join(__dirname, '..', 'shipa-ru-kz.js'), 'utf8');
  const labels = [
    'Тарифы и правила', 'Сохранить версию', '4 ч вечером × 45 000 ₸', 'Укажите от 1 до 16 гостей.',
    'Малый Standard', 'Большой Standard', 'Малый VIP', 'Средний VIP', 'Большой VIP',
    '04 ЭНЕРГИЯ · Малый Standard', 'Большой VIP · Предоплата',
  ];
  const body = { nodeType: 1, tagName: 'BODY', getAttribute: () => null, hasAttribute: () => false };
  const nodes = labels.map(nodeValue => ({ nodeType: 3, nodeValue, parentElement: body }));
  const document = {
    readyState: 'complete', documentElement: {}, body,
    addEventListener() {},
    querySelectorAll: () => [],
    createTreeWalker() {
      let i = 0;
      return { nextNode() { this.currentNode = nodes[i++]; return this.currentNode; } };
    },
  };
  const window = {};
  vm.runInNewContext(script, {
    window, document, NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: class { observe() {} },
    localStorage: { getItem: () => 'RU', setItem() {} },
  });
  window.ShipaLocale.set('KZ');
  assert.equal(document.documentElement.lang, 'kk');
  assert.deepEqual(nodes.map(n => n.nodeValue), [
    'Тарифтер мен ережелер', 'Нұсқаны сақтау', '4 сағ кешке × 45 000 ₸', 'Қонақ санын 1–16 аралығында көрсетіңіз.',
    'Шағын Standard', 'Үлкен Standard', 'Шағын VIP', 'Орташа VIP', 'Үлкен VIP',
    '04 ЭНЕРГИЯ · Шағын Standard', 'Үлкен VIP · Алдын ала төлем',
  ]);
  window.ShipaLocale.set('RU');
  assert.deepEqual(nodes.map(n => n.nodeValue), labels);
});
