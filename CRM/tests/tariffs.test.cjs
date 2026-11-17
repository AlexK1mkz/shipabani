const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
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
    URLSearchParams,
    window: { confirm, location: { reload() {} }, ...browser },
    document,
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
    'Начало', 'Баллов за каждые 100 ₸', 'От, баллов', 'День защитника Отечества · 07.05.2027',
    'Особый период: Казахский пользовательский период',
    'пт 16 окт · 10:00 — 02:00 · заезды и выезды',
    'Выручка по броням дня', 'Корпоративы и события', 'Последний визит',
    'Кому · только гостям с согласием на рассылку', 'Опубликован', 'Напоминание за 24 ч',
    'Переменные: {имя} {дом}', 'Спасибо! Дом отличный.',
    'Баллы начисляются с оплаченных сумм: 3 балла за каждые 100 ₸. Уровень считается по сумме баллов за всё время. Скидка дня рождения действует 10 дн. до и после даты. При совпадении скидки складываются. Администратор видит настройки только для чтения.',
  ];
  const body = { nodeType: 1, tagName: 'BODY', getAttribute: () => null, hasAttribute: () => false };
  const originalMessage = { tagName: 'P', closest: selector => selector === '[data-shipa-no-translate]' };
  const nodes = labels.map(nodeValue => ({
    nodeType: 3,
    nodeValue,
    parentElement: nodeValue.startsWith('Спасибо!') ? originalMessage : body,
  }));
  const document = {
    readyState: 'complete', documentElement: {}, body,
    addEventListener() {},
    querySelectorAll: () => [],
    createTreeWalker() {
      let i = 0;
      return { nextNode() { this.currentNode = nodes[i++]; return this.currentNode; } };
    },
  };
  const window = new EventTarget();
  let localeChanges = 0;
  window.addEventListener('shipa:localechange', () => { localeChanges++; });
  vm.runInNewContext(script, {
    window, document, Event, NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: class { observe() {} },
    localStorage: { getItem: () => 'RU', setItem() {} },
  });
  window.ShipaLocale.set('KZ');
  assert.equal(document.documentElement.lang, 'kk');
  assert.deepEqual(nodes.map(n => n.nodeValue), [
    'Тарифтер мен ережелер', 'Нұсқаны сақтау', '4 сағ кешке × 45 000 ₸', 'Қонақ санын 1–16 аралығында көрсетіңіз.',
    'Шағын Standard', 'Үлкен Standard', 'Шағын VIP', 'Орташа VIP', 'Үлкен VIP',
    '04 ЭНЕРГИЯ · Шағын Standard', 'Үлкен VIP · Алдын ала төлем',
    'Басталу уақыты', 'Әр 100 ₸ үшін ұпай', 'Ұпай шегі', 'Отан қорғаушы күні · 07.05.2027',
    'Арнайы кезең: Казахский пользовательский период',
    'жм 16 қаз · 10:00 — 02:00 · келу және шығу',
    'Күндік брондаулар түсімі', 'Корпоративтер мен іс-шаралар', 'Соңғы келуі',
    'Кімге · таратылымға келіскен қонақтарға ғана', 'Жарияланды', '24 сағат қалғанда еске салу',
    'Айнымалылар: {имя} {дом}', 'Спасибо! Дом отличный.',
    'Төленген әр 100 ₸ үшін 3 ұпай беріледі. Деңгей барлық уақытта жиналған ұпай бойынша анықталады. Туған күн жеңілдігі туған күнге дейін және одан кейін 10 күн бойы қолданылады. Екі жеңілдік қатар қолданылса, олардың мөлшері қосылады. Әкімші баптауларды тек көре алады.',
  ]);
  assert.equal(window.ShipaLocale.text('Бронза'), 'Қола');
  window.ShipaLocale.set('RU');
  assert.equal(window.ShipaLocale.text('Бронза'), 'Бронза');
  assert.equal(localeChanges, 3);
  assert.deepEqual(nodes.map(n => n.nodeValue), labels);
});

test('retains a cancellation draft after reload and only closes the booking after confirmation', () => {
  const storage = new Map();
  let { crm, DEMO_KEY } = demo(storage);
  const booking = crm.state.bookings.find(b => b.board === 'sales' && b.stage === 'confirmed' && crm.paid(b) > 0);
  assert.ok(booking);
  assert.equal(crm.move(booking.num, 'cancel'), false);
  assert.equal(crm.state.reasonDialog.num, booking.num);
  crm.setBookingReason('  ');
  crm.confirmBookingReason();
  assert.equal(storedBooking(crm, booking.num).stage, 'confirmed');
  crm.setBookingReason('  Гость попросил отменить бронь  ');
  crm.dismissBookingReason();
  assert.equal(storedBooking(crm, booking.num).stage, 'confirmed');
  crm = demo(storage).crm;
  assert.equal(crm.state.reasonDialog, null);
  crm.move(booking.num, 'cancel');
  assert.equal(crm.renderVals().reasonInfo.draft, '  Гость попросил отменить бронь  ');
  crm.confirmBookingReason();
  assert.equal(crm.state.reasonDialog, null);
  const saved = JSON.parse(storage.get(DEMO_KEY));
  const cancelled = saved.bookings.find(b => b.num === booking.num);
  assert.equal(cancelled.stage, 'cancel');
  assert.equal(cancelled.events[0].reason, 'Гость попросил отменить бронь');
  assert.match(cancelled.events[0].text, /Отменена/);
  assert.deepEqual(saved.reasonDrafts, {});
});

test('booking calendar disables days without a slot and picks a time that fits the preparation buffer', () => {
  const { crm } = demo();
  const seed = crm.state.bookings.find(b => b.stage === 'confirmed');
  crm.setState({ bookings: [{ ...seed, num: '№ 1', house: 'sila', day: 10, start: 10, dur: 12 }],
    nb: crm.newNb({ house: 'sila', day: 9, start: 12, dur: 5 }) });
  crm.renderVals().toggleNbCalendar();
  const { cells } = crm.renderVals().nbCal;
  assert.equal(cells.find(cell => cell.day === 15).css, 'crm-calendar-past');
  const busy = cells.find(cell => cell.day === 26);
  assert.equal(busy.css, 'crm-calendar-busy');
  assert.equal(busy.disabled, true);
  busy.pick();
  assert.equal(crm.state.nb.day, 9);
  const free = cells.find(cell => cell.day === 27);
  assert.equal(free.css, 'crm-calendar-free');
  assert.equal(free.disabled, false);
  free.pick();
  assert.equal(crm.state.nb.day, 11);
  assert.equal(crm.state.nb.start, 12);
  assert.equal(crm.renderVals().nbCal.show, false);
  assert.equal(crm.renderVals().nbConflict, false);

  crm.setState({ nb: { ...crm.state.nb, start: 10 },
    bookings: [{ ...seed, num: '№ 2', house: 'sila', day: 12, start: 10, dur: 3 }] });
  crm.pickBookingDay(12);
  assert.equal(crm.state.nb.start, 15);
  assert.equal(crm.renderVals().nbConflict, false);
});

test('new booking starts with a phone prefix, accepts a full pasted number and does not store the prefix by itself', () => {
  const { crm } = demo();
  crm.setState({ nb: { ...crm.newNb({ house: 'sila', day: 90, start: 10 }), first: 'Тест', last: 'Демо' } });
  assert.equal(crm.state.nb.phone, '+7');
  let prevented = false;
  crm.renderVals().pasteNbPhone({
    target: { value: '+7' },
    clipboardData: { getData: () => '8 (701) 111-22-33' },
    preventDefault() { prevented = true; },
  });
  assert.ok(prevented);
  assert.equal(crm.state.nb.phone, '+77011112233');
  crm.renderVals().nbSet.phone(event('+7'));
  const clients = crm.state.clients.length;
  crm.renderVals().createBooking();
  assert.equal(storedBooking(crm, crm.state.openId).phone, '—');
  assert.equal(crm.state.clients.length, clients);
});

test('closed bookings reject incoming money and links while allowing refunds of existing payments', () => {
  const storage = new Map();
  const { crm } = demo(storage);
  const booking = crm.state.bookings.find(b => b.board === 'sales' && b.stage === 'confirmed' && crm.paid(b) > 0);
  const paid = crm.paid(booking);
  crm.setState({ openId: booking.num });
  const open = crm.renderVals();
  crm.move(booking.num, 'cancel');
  crm.setBookingReason('Гость попросил отменить бронь');
  crm.confirmBookingReason();
  const eventCount = storedBooking(crm, booking.num).events.length;
  open.addRest();
  open.sendPayLink();
  open.fixPay('Предоплата');
  const closed = crm.renderVals();
  assert.equal(closed.payOpen, false);
  assert.equal(closed.showPayForm, true);
  assert.equal(storedBooking(crm, booking.num).events.length, eventCount);
  assert.equal(crm.paid(storedBooking(crm, booking.num)), paid);
  closed.pfSet.sum(event(paid));
  crm.renderVals().submitPayment();
  assert.equal(crm.renderVals().showPayForm, false);
  const reloaded = demo(storage).crm;
  const saved = storedBooking(reloaded, booking.num);
  assert.equal(saved.stage, 'cancel');
  assert.equal(reloaded.paid(saved), 0);
  assert.equal(saved.pays.at(-1).type, 'Возврат');
});

test('new booking lists only available start times and updates them after date, house or duration changes', () => {
  const { crm } = demo();
  const seed = crm.state.bookings.find(b => b.stage === 'confirmed');
  crm.setState({
    bookings: [{ ...seed, house: 'sila', day: 10, start: 17, dur: 3 }],
    nb: crm.newNb({ house: 'sila', day: 11, start: 12, dur: 3 }),
  });
  crm.pickBookingDay(10);
  let ui = crm.renderVals();
  const hours = () => Array.from(crm.renderVals().nbStarts, option => option.v);
  assert.equal(ui.nbStartValue, 12);
  assert.ok(hours().includes(12));
  assert.ok(!hours().includes(13), 'preparation buffer before the existing booking');
  assert.ok(!hours().includes(21), 'preparation buffer after the existing booking');
  ui.nbSet.start(event(17));
  assert.equal(crm.renderVals().nbStartValue, 12);

  ui.nbSet.dur(event(5));
  ui = crm.renderVals();
  assert.deepEqual(hours(), [10]);
  assert.equal(ui.nbStartValue, 10);
  ui.nbSet.dur(event(6));
  ui = crm.renderVals();
  assert.equal(ui.nbNoStarts, true);
  assert.equal(ui.nbStartValue, '');
  assert.equal(ui.nbDisabled, true);
  assert.match(ui.nbConflictText, /нет свободных часов/);
  ui.nbSet.house(event('balans'));
  ui = crm.renderVals();
  assert.equal(ui.nbNoStarts, false);
  assert.equal(ui.nbStartValue, 10);
  assert.ok(hours().includes(17));
  assert.ok(hours().includes(20));
  assert.ok(!hours().includes(21), 'rental would end after closing');
});

test('opening and switching a guest’s bookings preserves the guest card and its bookings tab', () => {
  const { crm } = demo();
  const guest = crm.state.clients.find(client => crm.stats(client).bs.length > 1);
  crm.setState({ clientId: guest.id, ctab: 'bookings', pf: { sum: '300', type: 'Возврат', method: 'Карта' } });
  let ui = crm.renderVals();
  const [first, second] = ui.cv.bookings;
  first.open();
  ui = crm.renderVals();
  assert.equal(ui.hasClient, true);
  assert.equal(ui.hasOpen, true);
  assert.match(ui.guestPanelClass, /--paired/);
  assert.match(ui.bookingPanelClass, /--paired/);
  assert.equal(ui.ctab.bookings, true);
  assert.equal(ui.cv.bookings.find(row => row.num === first.num).current, 'true');
  assert.equal(ui.ob.num, first.num);
  assert.equal(ui.pf.sum, '');
  second.open();
  assert.equal(crm.renderVals().ob.num, second.num);
  crm.renderVals().closeCard();
  ui = crm.renderVals();
  assert.equal(ui.hasOpen, false);
  assert.equal(ui.hasClient, true);
  assert.equal(ui.ctab.bookings, true);
  assert.equal(crm.state.clientId, guest.id);
});

test('opening a guest from a booking keeps the booking and its current tab open', () => {
  const { crm } = demo();
  const booking = crm.state.bookings.find(b => crm.clientOf(b.phone));
  const guest = crm.clientOf(booking.phone);
  crm.setState({ openId: booking.num, tab: 'pay' });
  crm.renderVals().ob.openClient();
  let ui = crm.renderVals();
  assert.equal(ui.ob.num, booking.num);
  assert.equal(ui.tab.pay, true);
  assert.equal(ui.cv.name, guest.name);
  assert.match(ui.bookingPanelClass, /--behind/);
  assert.doesNotMatch(ui.guestPanelClass, /--behind/);
  ui.closeDetails();
  ui = crm.renderVals();
  assert.equal(ui.hasClient, false);
  assert.equal(ui.ob.num, booking.num);
  assert.equal(ui.tab.pay, true);
});

test('CRM history restores sections, calendar settings and both cards without extra entries', () => {
  const storage = new Map();
  const events = new EventTarget();
  const browser = {
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  };
  const entries = [''];
  let index = 0;
  browser.location = { hash: '' };
  browser.history = {
    replaceState(_, __, hash) {
      entries[index] = browser.location.hash = hash;
    },
    pushState(_, __, hash) {
      entries.splice(++index, entries.length, hash);
      browser.location.hash = hash;
    },
  };
  const travel = offset => {
    browser.location.hash = entries[index += offset];
    browser.dispatchEvent(new Event('popstate'));
    browser.dispatchEvent(new Event('hashchange'));
  };
  let { crm } = demo(storage, () => false, browser);
  crm.componentDidMount();
  crm.renderVals().dashSeg[1].go();
  assert.equal(browser.location.hash, '#today?day=1');
  crm.renderVals().dashToCal();
  crm.renderVals().calWeekMode();
  crm.renderVals().calNext();
  const calendarHash = browser.location.hash;
  assert.match(calendarHash, /^#calendar\?date=2026-10-24&mode=week$/);
  crm.setState({ screen: 'clients' });
  const client = crm.state.clients.find(c => crm.stats(c).bs.length);
  crm.setState({ clientId: client.id, ctab: 'bookings' });
  crm.renderVals().cv.bookings[0].open();
  crm.renderVals().tabs[1].go();
  const booking = crm.state.openId;
  const cardHash = browser.location.hash;
  assert.match(cardHash, /^#clients\?booking=\d+&bookingTab=pay&guest=c\d+&guestTab=bookings$/);
  const count = entries.length;
  crm.setState({ search: 'Поисковый текст' });
  assert.equal(entries.length, count);
  travel(-1);
  assert.equal(crm.state.tab, 'compose');
  travel(-1);
  assert.equal(crm.state.openId, null);
  assert.equal(crm.state.ctab, 'bookings');
  travel(-2);
  assert.equal(browser.location.hash, calendarHash);
  assert.equal(crm.state.calMode, 'week');
  assert.equal(crm.state.calDay, 8);
  travel(4);
  assert.equal(entries.length, count);
  assert.equal(browser.location.hash, cardHash);
  crm.componentWillUnmount();

  crm = demo(storage, () => false, browser).crm;
  crm.componentDidMount();
  assert.equal(crm.state.screen, 'clients');
  assert.equal(crm.state.clientId, client.id);
  assert.equal(crm.state.openId, booking);
  assert.equal(crm.state.tab, 'pay');
  assert.equal(entries.length, count);
  browser.location.hash = '#notif?booking=999999&guest=missing';
  browser.dispatchEvent(new Event('hashchange'));
  assert.equal(crm.state.screen, 'today');
  assert.equal(crm.state.openId, null);
  assert.equal(crm.state.clientId, null);
  assert.equal(browser.location.hash, '#today');
});

test('calendar drop explains occupancy and preparation conflicts before opening a transfer', () => {
  const { crm } = demo();
  const seed = crm.state.bookings.find(b => b.stage === 'confirmed');
  const moving = { ...seed, num: '№ 1', house: 'dyhanie', day: 7, start: 10, dur: 3, guests: 4, kids: 0 };
  const booked = { ...moving, num: '№ 2', house: 'sila', start: 15, dur: 4, guest: 'Тестовый гость' };
  crm.setState({ screen: 'calendar', calDay: 7, bookings: [moving, booked] });
  const drop = start => {
    crm.dragB = moving.num;
    const sila = crm.renderVals().calRows.find(row => row.name === 'СИЛА');
    sila.drop({ preventDefault() {}, stopPropagation() {}, clientX: (start - 10) * 10 + 5,
      currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 160 }) } });
  };
  drop(15);
  assert.match(crm.state.calDropError.message, /^Занято: № 2 .*15:00–19:00/);
  assert.equal(crm.state.rs, null);
  drop(11);
  assert.match(crm.state.calDropError.message, /Не хватает 1 ч.*№ 2/);
  assert.match(crm.state.calDropError.target, /11:00–14:00/);
  drop(10);
  assert.equal(crm.state.calDropError, null);
  const form = crm.renderVals().rsv;
  assert.equal(form.selectedInterval, '10:00–13:00 · 3 ч');
  assert.match(form.occupancy[0].when, /15:00–19:00 · 4 ч/);
  assert.equal(form.occupancy[0].prep, '13:00–15:00');
  assert.deepEqual(Array.from(form.slots, slot => slot.t), ['10:00–13:00', '21:00–00:00']);
  assert.equal(form.cantSave, false);
});

test('calendar legend filters day, week and month while hidden bookings still block transfers', () => {
  const { crm } = demo();
  const seed = crm.state.bookings.find(b => b.stage === 'confirmed');
  const confirmed = { ...seed, num: '№ 1', house: 'sila', day: 7, start: 14, dur: 3, guest: 'Подтверждённый гость' };
  const cancelled = { ...confirmed, num: '№ 2', stage: 'cancel', guest: 'Отменённый гость' };
  crm.setState({ screen: 'calendar', calDay: 7, bookings: [confirmed, cancelled] });
  const stats = Array.from(crm.renderVals().monthStats, m => m.v);
  crm.renderVals().legend.find(item => item.id === 'fail').select({ currentTarget: { closest: () => null } });
  const ui = crm.renderVals();
  assert.match(ui.calStatusLabel, /отмена/);
  assert.deepEqual(Array.from(ui.calRows.flatMap(row => row.blocks), row => row.title), ['№ 2 Отменённый гость']);
  assert.deepEqual(Array.from(ui.weekRows.flatMap(row => row.days.flatMap(day => day.items)), item => item.guest), ['Отменённый гость']);
  assert.deepEqual(Array.from(ui.monthCells.flatMap(cell => cell.items), item => item.label), ['СИЛА · Отменённый гость']);
  assert.deepEqual(Array.from(ui.monthStats, m => m.v), stats);
  assert.equal(crm.conflict({ house: 'sila', day: 7, start: 14, dur: 3 }).num, confirmed.num);
});

test('guest Excel export follows the current filter, search and sort order', () => {
  const downloads = [];
  const { crm } = demo(new Map(), () => false, {
    ShipaGuestExport: { download: (...args) => downloads.push(args) },
    ShipaLocale: { text: label => ({ 'Гости': 'Қонақтар', 'Гость': 'Қонақ' })[label] || label },
  });
  let ui = crm.renderVals();
  ui.clFilters.find(f => f.name === 'ДР в 14 дней').go();
  crm.renderVals().clSortBy.name();
  ui = crm.renderVals();
  assert.ok(ui.clRows.length > 1);
  ui.exportGuests();
  const [filename, sheet, headers, rows] = downloads[0];
  assert.match(filename, /^shipa-guests-\d{4}-\d{2}-\d{2}\.xlsx$/);
  assert.equal(sheet, 'Қонақтар');
  assert.equal(headers[0], 'Қонақ');
  assert.deepEqual(Array.from(rows, row => row[0]), Array.from(ui.clRows, row => row.name));
  assert.equal(typeof rows[0][1], 'string');
  assert.equal(typeof rows[0][4], 'number');
  assert.equal(typeof rows[0][5], 'number');
  ui.setClSearch(event(rows[0][0]));
  crm.renderVals().exportGuests();
  assert.equal(downloads[1][3].length, 1);
  assert.equal(downloads[1][3][0][0], rows[0][0]);
  crm.renderVals().setClSearch(event('нет совпадений'));
  assert.equal(crm.renderVals().clEmpty, true);
  crm.renderVals().exportGuests();
  assert.equal(downloads.length, 2);
});

test('kanban reports success only after a stage change is applied', () => {
  const { crm } = demo();
  const booking = crm.state.bookings.find(b => b.board === 'sales' && b.stage === 'new' && crm.paid(b) === 0);
  const drop = name => {
    crm.drag = booking.num;
    crm.renderVals().columns.find(col => col.name === name).drop({ preventDefault() {} });
  };
  drop('Подтверждена');
  assert.equal(storedBooking(crm, booking.num).stage, 'new');
  assert.equal(crm.renderVals().toastSuccess, false);
  assert.match(crm.state.toast, /Сначала зафиксируйте предоплату/);
  drop('Связались');
  assert.equal(storedBooking(crm, booking.num).stage, 'contact');
  assert.equal(crm.renderVals().toastSuccess, true);
  assert.match(crm.state.toast, /Бронь перемещена.*Связались/);
  crm.setState({ toast: '', toastTone: 'info' });
  drop('Отменена');
  assert.equal(crm.state.reasonDialog.kanban, true);
  assert.equal(crm.renderVals().toastSuccess, false);
  assert.equal(storedBooking(crm, booking.num).stage, 'contact');
  crm.setBookingReason('Гость отменил визит');
  crm.confirmBookingReason();
  assert.equal(storedBooking(crm, booking.num).stage, 'cancel');
  assert.equal(crm.renderVals().toastSuccess, true);
  assert.match(crm.state.toast, /Бронь перемещена.*Отменена/);
});

test('the assignee on Kanban cards and the shared filter use the saved booking assignment', () => {
  const storage = new Map();
  let { crm } = demo(storage);
  const booking = crm.state.bookings.find(b => b.board === 'sales' && b.stage === 'confirmed');
  crm.setState({ screen: 'bookings', openId: booking.num });
  crm.renderVals().setBookingAssignee(event('Сергей'));
  assert.equal(storedBooking(crm, booking.num).owner, 'Сергей');
  assert.match(storedBooking(crm, booking.num).events[0].text, /Ответственный: Сергей/);
  crm.renderVals().setAssigneeFilter(event('Сергей'));
  let ui = crm.renderVals();
  assert.equal(ui.assigneeFilter, 'Сергей');
  assert.deepEqual(Array.from(ui.columns.flatMap(column => column.cards), card => [card.num, card.assignee]), [[booking.num, 'Сергей']]);
  assert.deepEqual(Array.from(ui.listRows, row => row.num), [booking.num]);
  ui.setBookingAssignee(event('Недопустимое значение'));
  assert.equal(storedBooking(crm, booking.num).owner, 'Сергей');

  const hash = '#bookings?responsible=' + encodeURIComponent('Сергей');
  crm = demo(storage, () => false, { location: { hash } }).crm;
  assert.equal(crm.state.assigneeFilter, 'Сергей');
  assert.equal(storedBooking(crm, booking.num).owner, 'Сергей');
  crm.setState({ openId: booking.num });
  crm.renderVals().setBookingAssignee(event(''));
  crm.renderVals().setAssigneeFilter(event(''));
  ui = crm.renderVals();
  assert.equal(ui.columns.flatMap(column => column.cards)[0].assignee, 'Не назначен');
  assert.deepEqual(Array.from(ui.listRows, row => row.num), [booking.num]);
});

test('bookings Excel exports the selected board, preset, assignee and list order', () => {
  const downloads = [];
  const { crm } = demo(new Map(), () => false, {
    ShipaGuestExport: { download: (...args) => downloads.push(args) },
  });
  const requests = crm.state.bookings.filter(b => b.board === 'sales' && ['new', 'contact', 'prepay'].includes(b.stage));
  const scoped = requests.slice(0, 2).map(b => b.num);
  assert.equal(scoped.length, 2);
  crm.setState({
    screen: 'bookings', view: 'list', savedView: 'unpaid', assigneeFilter: 'Сергей',
    bookings: crm.state.bookings.map(b => scoped.includes(b.num) ? { ...b, owner: 'Сергей' } : b),
  });
  crm.renderVals().sortNum();
  const ui = crm.renderVals();
  ui.exportBookings();
  const [filename, sheet, headers, rows, widths] = downloads[0];
  assert.match(filename, /^shipa-bookings-\d{4}-\d{2}-\d{2}\.xlsx$/);
  assert.equal(sheet, 'Брони и продажи');
  assert.deepEqual(Array.from(rows, row => row[0]), Array.from(ui.listRows, row => row.num));
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row[11] === 'Сергей' && typeof row[2] === 'string'));
  assert.ok(rows.every(row => row[9] == null || typeof row[9] === 'number'));
  assert.equal(headers.length, widths.length);
  crm.setState({ board: 'cert' });
  assert.equal(crm.renderVals().bookingExportEmpty, true);
  crm.renderVals().exportBookings();
  assert.equal(downloads.length, 1);
});

test('dashboard preparation rows show the guest and open the correct visit without changing the day', () => {
  const { crm } = demo();
  crm.renderVals().dashSeg[1].go();
  const planned = crm.renderVals().prepList[0];
  assert.ok(planned.guest);
  assert.match(planned.arrival, /сб 17 окт · 12:00/);
  assert.equal(planned.startAt, '10:00');
  planned.open();
  const ui = crm.renderVals();
  assert.equal(ui.ob.guest, planned.guest);
  assert.equal(ui.tab.visit, true);
  assert.equal(crm.state.screen, 'today');
  assert.equal(crm.state.dashDay, 1);
});

test('owners manage employee roles and access, and staff records survive reload', () => {
  const storage = new Map();
  const { crm } = demo(storage);
  const submit = { preventDefault() {} };

  assert.equal(crm.renderVals().nav.some(item => item.name === 'Сотрудники'), false);
  crm.editStaff(null);
  assert.equal(crm.state.staffDraft, null);

  crm.renderVals().toggleRole();
  crm.renderVals().nav.find(item => item.name === 'Сотрудники').go();
  crm.renderVals().staff.add();
  assert.equal(crm.staffView().isExisting, false);
  crm.setStaffDraft({ deactivated: true });
  crm.setStaffDraft({ name: 'Арман', surname: 'Тестов', phone: '8 700 000 00 02', enabled: true });
  crm.saveStaff(submit);
  assert.match(crm.state.staffError, /уже есть/);
  assert.equal(crm.state.employees.length, 3);

  crm.setStaffDraft({ phone: '+7 (701) 234-56-78', surname: '' });
  crm.saveStaff(submit);
  assert.match(crm.state.staffError, /фамилию/);
  crm.staffView().setSurname({ target: { value: 'Тестов' } });
  crm.saveStaff(submit);
  const employee = crm.state.employees.find(item => item.phone === '+77012345678');
  assert.deepEqual({ name: employee.name, surname: employee.surname, role: employee.role, enabled: employee.enabled },
    { name: 'Арман', surname: 'Тестов', role: 'admin', enabled: true });
  crm.staffView().setQuery({ target: { value: 'Тестов Арман' } });
  assert.equal(crm.staffView().rows[0].fullName, 'Арман Тестов');

  assert.equal(employee.deactivated, false);
  crm.editStaff(employee.id);
  assert.equal(crm.staffView().isExisting, true);
  crm.setStaffDraft({ role: 'owner', enabled: false });
  crm.saveStaff(submit);
  const restored = demo(storage).crm.state.employees.find(item => item.id === employee.id);
  assert.equal(restored.role, 'owner');
  assert.equal(restored.enabled, false);
  assert.equal(restored.surname, 'Тестов');

  crm.editStaff('demo-owner');
  crm.setStaffDraft({ role: 'admin', enabled: false, deactivated: true });
  crm.saveStaff(submit);
  const owner = crm.state.employees.find(item => item.id === 'demo-owner');
  assert.equal(owner.role, 'owner');
  assert.equal(owner.enabled, true);
  assert.equal(owner.deactivated, false);

  crm.renderVals().toggleRole();
  assert.equal(crm.state.screen, 'today');
  assert.equal(demo(storage, undefined, { location: { hash: '#staff' } }).crm.state.screen, 'today');
});


test('staff editing opens a modal and Escape discards only the draft', () => {
  let cancel;
  const dialog = {
    open: false,
    addEventListener(name, handler, options) {
      assert.equal(name, 'cancel');
      assert.equal(options.once, true);
      cancel = handler;
    },
    showModal() { this.open = true; },
    close() { this.open = false; },
  };
  const document = { querySelector: selector => selector === '.crm-staff-dialog' ? dialog : null };
  const { crm } = demo(undefined, undefined, undefined, document);
  crm.renderVals().toggleRole();
  crm.renderVals().nav.find(item => item.name === 'Сотрудники').go();

  crm.editStaff('demo-admin');
  assert.equal(dialog.open, true);
  crm.setStaffDraft({ name: 'Черновик' });
  cancel({ preventDefault() {} });
  assert.equal(dialog.open, false);
  assert.equal(crm.state.staffDraft, null);
  assert.equal(crm.state.employees.find(item => item.id === 'demo-admin').name, 'Айдана');
  assert.equal(crm.state.screen, 'staff');

  crm.editStaff('demo-admin');
  crm.setStaffDraft({ enabled: false });
  crm.saveStaff({ preventDefault() {} });
  assert.equal(dialog.open, false);
  assert.equal(crm.state.employees.find(item => item.id === 'demo-admin').enabled, false);
});

test('deactivating an employee overrides access and keeps the saved permission for reactivation', () => {
  const storage = new Map();
  const { crm } = demo(storage);
  const submit = { preventDefault() {} };

  crm.renderVals().toggleRole();
  crm.editStaff('demo-admin');
  assert.equal(crm.staffView().deactivated, false);
  crm.staffView().setDeactivated({ target: { checked: true } });
  crm.saveStaff(submit);

  const { crm: restored } = demo(storage);
  restored.renderVals().toggleRole();
  assert.equal(restored.staffView().active, 1);
  restored.staffView().setFilter({ target: { value: 'deactivated' } });
  const [employee] = restored.staffView().rows;
  assert.equal(restored.staffView().rows.length, 1);
  assert.equal(employee.id, 'demo-admin');
  assert.equal(employee.access, 'Аккаунт деактивирован');
  assert.equal(employee.enabled, true);

  restored.editStaff(employee.id);
  restored.staffView().setDeactivated({ target: { checked: false } });
  restored.saveStaff(submit);
  assert.equal(restored.staffView().rows.length, 0);
  restored.staffView().setFilter({ target: { value: 'active' } });
  assert.equal(restored.staffView().rows.find(item => item.id === employee.id).access, 'Открыт');
});
