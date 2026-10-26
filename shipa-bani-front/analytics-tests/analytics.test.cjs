// Offline unit tests for script initialization and event routing; no external requests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'shipa-analytics.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function setup(hostname, mode, search = '') {
  const elements = [];
  const events = {};
  const scripts = [];
  const saved = new Map();
  if (mode) saved.set('shipa_tracking_consent_v2', JSON.stringify(mode));
  const location = { hostname, origin: 'https://' + hostname, href: 'https://' + hostname + '/' + search, pathname: '/', search, reload() { this.reloaded = true; } };
  const document = {
    readyState: 'complete',
    head: { appendChild(el) { scripts.push(el); } },
    body: { appendChild(el) { elements.push(el); } },
    cookie: '',
    getElementById(id) { return elements.find(e => e.id === id) || null; },
    createElement(tag) { return {tag, style: {}, addEventListener(type, fn) { this[type] = fn; }, setAttribute(k, v) { this[k] = v; }, remove() { const i = elements.indexOf(this); if (i >= 0) elements.splice(i, 1); } }; },
    getElementsByTagName() { return [{ parentNode: { insertBefore(el) { scripts.push(el); } } }]; },
    addEventListener(event, fn) { events[event] = fn; }
  };
  const window = {
    location,
    dataLayer: [],
    __shipa: { state: { screen: 'home' } },
    fbq: null
  };
  const sandbox = { window, document, location, localStorage: { getItem: k => saved.get(k) || null, setItem: (k, v) => saved.set(k, v) }, URLSearchParams, URL, Date, Object, String };
  vm.runInNewContext(src, sandbox, {filename: 'shipa-analytics.js'});
  return {window, document, scripts, elements, saved, events, gEvents: () => Array.from(window.dataLayer).filter(args => args[0] === 'event').map(x => [x[1], x[2]]), metaCalls: () => window.fbq ? window.fbq.queue : []};
}
test('analytics script is loaded once and no inline old snippet is present', () => {
  assert.equal((html.match(/src="\.\/shipa-analytics\.js"/g)||[]).length, 1);
  assert.equal((html.match(/shipa_analytics_consent_v1/g)||[]).length, 0);
  assert.ok(!/fbq\('track', 'Purchase'\)/.test(html));
});
test('production without consent makes no vendor requests', () => {
  const t = setup('shipabani.kz');
  t.window.shipaTrack('begin_booking', {});
  assert.equal(t.scripts.length, 0);
  assert.equal(t.gEvents().length, 0);
  assert.ok(t.document.getElementById('shipa-analytics-consent'));
});
test('only analytics consent loads GA and not Meta', () => {
  const t = setup('shipabani.kz', {analytics: true, marketing: false});
  assert.equal(t.scripts.length, 1);
  assert.match(t.scripts[0].src, /gtag\/js/);
  assert.deepEqual(t.gEvents().map(x => x[0]), ['page_view']);
  t.window.shipaTrack('begin_booking', { house_id: 'balans' });
  assert.deepEqual(t.gEvents().map(x => x[0]), ['page_view', 'begin_checkout']);
  assert.equal(t.metaCalls().length, 0);
});
test('marketing only consent loads Meta but no GA', () => {
  const t = setup('shipabani.kz', {analytics: false, marketing: true});
  assert.equal(t.scripts.length, 1);
  assert.match(t.scripts[0].src, /fbevents/);
  assert.deepEqual(Array.from(t.metaCalls(), x => x[1]), ['1107037388586347', 'PageView']);
  t.window.shipaTrack('whatsapp_click', { source: 'booking' });
  assert.equal(t.metaCalls().at(-1)[1], 'Contact');
  assert.equal(t.gEvents().length, 0);
});
test('both active: engagement events pass, demo payment never triggers purchase', () => {
  const t = setup('www.shipabani.kz', {analytics: true, marketing: true});
  t.window.__shipa.state = { screen: 'house', houseId: 'balans' };
  t.window.shipaTrack('virtual_page');
  t.window.shipaTrack('view_house', {house_id:'balans',house_name:'БАЛАНС'});
  t.window.shipaTrack('select_house', {house_id:'balans'});
  t.window.shipaTrack('begin_booking', { house_id:'balans' });
  t.window.shipaTrack('booking_step', {booking_step:'step_5'});
  t.window.shipaTrack('payment_click', {payment_method:'kaspi'});
  t.window.shipaTrack('purchase', {value: 100000});
  assert.deepEqual(t.gEvents().map(x => x[0]), ['page_view','page_view','view_item','select_item','begin_checkout','booking_step','booking_payment_click']);
  assert.deepEqual(Array.from(t.metaCalls(), x => x[1]), ['1107037388586347','PageView','PageView','ViewContent','SelectHouse','InitiateCheckout','BookingStep','BookingPaymentClick']);
  assert.equal(t.gEvents().some(x => x[0] === 'purchase'), false);
});
test('staging, localhost and demo URL do not load tracking', () => {
  for (const [host, search] of [['staging.shipabani.kz',''],['localhost',''],['shipabani.kz','?bk=6']]) {
    const t=setup(host,{analytics:true,marketing:true},search);
    t.window.shipaTrack('begin_booking', {});
    assert.equal(t.scripts.length,0,host);
    assert.equal(t.gEvents().length,0,host);
    assert.equal(t.metaCalls().length,0,host);
  }
});
test('private data is never passed to analytics (whitelist)', () => {
  const t=setup('shipabani.kz',{analytics:true,marketing:true});
  t.window.shipaTrack('begin_booking',{entry_point:'website',house_id:'balans',phone:'+77017778899',name:'somebody',email:'test@example.com'});
  let str=JSON.stringify(t.gEvents())+JSON.stringify(t.metaCalls());
  assert.ok(!str.includes('77017778899')&&!str.includes('somebody')&&!str.includes('test@example.com'));
});
