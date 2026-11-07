/* SHIPÁ website analytics · GA4 + Meta Pixel · explicit opt-in · production only.
   Events never include names, phone numbers, booking identifiers or WhatsApp message text.
   NOTE: the booking/payment flow in index.html is a frontend demo. No Purchase/Lead events
   are emitted from its simulated completion state. Wire conversions only to backend success.
*/
(function () {
  'use strict';
  var GA_ID = 'G-L26CD2HKL3';
  var PIXEL_ID = '1107037388586347';
  var hostname = String(window.location.hostname || '').toLowerCase();
  var IS_PROD = hostname === 'shipabani.kz' || hostname === 'www.shipabani.kz';
  var debugQuery = new URLSearchParams(window.location.search);
  var IS_DEMO = ['bk', 'qa', 'hdr', 'w', 'scroll', 'intro'].some(function (key) { return debugQuery.has(key); });
  var ENABLED = IS_PROD && !IS_DEMO;
  var KEY = 'shipa_tracking_consent_v2';
  var OLD_KEY = 'shipa_analytics_consent_v1';
  var consent = { analytics: false, marketing: false };
  var gaReady = false;
  var pixelReady = false;

  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (value && typeof value.analytics === 'boolean' && typeof value.marketing === 'boolean') return value;
      var old = localStorage.getItem(OLD_KEY);
      if (old === 'accepted') return { analytics: true, marketing: true };
      if (old === 'rejected') return { analytics: false, marketing: false };
    } catch (_) {}
    return null;
  }
  function page() {
    var shipa = window.__shipa;
    var s = shipa && shipa.state;
    var screen = s && s.screen || 'home';
    var house = s && s.houseId || '';
    var p = screen === 'home' ? '/' : '/' + encodeURIComponent(screen);
    if (screen === 'house' && house) p += '/' + encodeURIComponent(house);
    return {
      page_title: 'SHIPÁ | ' + (screen === 'home' ? 'Главная' : screen),
      page_location: window.location.origin + p,
      page_path: p
    };
  }
  function initGa() {
    if (!ENABLED || gaReady || !consent.analytics) return;
    gaReady = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false });
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(tag);
    window.gtag('event', 'page_view', page());
  }
  function initPixel() {
    if (!ENABLED || pixelReady || !consent.marketing) return;
    pixelReady = true;
    if (!window.fbq) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function sanitize(detail) {
    // Only allow explicitly whitelisted, non-personal business dimensions.
    var allowed = ['house_id','house_name','entry_point','booking_step','payment_method','screen','source','preorder'];
    var out = {};
    if (!detail || typeof detail !== 'object') return out;
    allowed.forEach(function (key) {
      var value = detail[key];
      if (typeof value === 'string' && value.length <= 80 && /^[\w\u0400-\u04FF\u00C0-\u017F\s\-]+$/.test(value)) out[key] = value;
      else if (key === 'preorder' && typeof value === 'boolean') out[key] = value;
    });
    return out;
  }
  function content(d) {
    return d.house_id ? { content_ids: [d.house_id], content_type: 'product' } : {};
  }
  function ga(name, params) {
    if (gaReady && consent.analytics && typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  function meta(name, params, custom) {
    if (pixelReady && consent.marketing && typeof window.fbq === 'function') {
      window.fbq(custom ? 'trackCustom' : 'track', name, params || {});
    }
  }
  window.shipaTrack = function (action, data) {
    if (!ENABLED) return;
    var d = sanitize(data);
    if (action === 'virtual_page') {
      ga('page_view', page());
      meta('PageView');
    } else if (action === 'view_house' && d.house_id) {
      ga('view_item', { items: [{ item_id: d.house_id, item_name: d.house_name || d.house_id, item_category: 'House' }] });
      meta('ViewContent', Object.assign({ content_name: d.house_name || d.house_id }, content(d)));
    } else if (action === 'select_house' && d.house_id) {
      ga('select_item', { items: [{ item_id: d.house_id, item_name: d.house_name || d.house_id, item_category: 'House' }] });
      meta('SelectHouse', content(d), true);
    } else if (action === 'begin_booking') {
      ga('begin_checkout', Object.assign({ booking_entry: d.entry_point || 'website' }, d.house_id ? { items: [{ item_id: d.house_id, item_name: d.house_name || d.house_id }] } : {}));
      meta('InitiateCheckout', Object.assign({ content_category: 'house_booking' }, content(d)));
    } else if (action === 'booking_step') {
      if (!d.booking_step) return;
      ga('booking_step', { booking_step: d.booking_step, preorder: !!d.preorder });
      meta('BookingStep', { booking_step: d.booking_step, preorder: !!d.preorder }, true);
    } else if (action === 'payment_click') {
      if (!d.payment_method) return;
      ga('booking_payment_click', { payment_method: d.payment_method });
      meta('BookingPaymentClick', { payment_method: d.payment_method }, true);
    } else if (action === 'whatsapp_click') {
      ga('whatsapp_click', { source: d.source || 'website' });
      meta('Contact', { contact_method: 'whatsapp' });
    } else if (action === 'phone_click') {
      ga('phone_click', { source: d.source || 'website' });
      meta('Contact', { contact_method: 'phone' });
    }
  };
  function removeCookies(removeGa, removeMeta) {
    var names = document.cookie.split(';').map(function (x) { return x.split('=')[0].trim(); });
    var root = window.location.hostname.replace(/^www\./, '');
    names.forEach(function (name) {
      if (!((removeGa && /^(_ga|_gcl_au$)/.test(name)) || (removeMeta && /^(_fbp$|_fbc$)/.test(name)))) return;
      ['/', window.location.pathname].forEach(function (path) {
        document.cookie = name + '=; Max-Age=0; path=' + path;
        document.cookie = name + '=; Max-Age=0; path=' + path + '; domain=.' + root;
      });
    });
  }
  function save(a, m) {
    var prev = consent;
    consent = { analytics: !!a, marketing: !!m };
    try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch (_) {}
    var existing = document.getElementById('shipa-analytics-consent');
    if (existing) existing.remove();
    if ((!consent.analytics && prev.analytics) || (!consent.marketing && prev.marketing)) {
      // Reload stops old scripts immediately; revoke consent and clean known first-party cookies.
      window['ga-disable-' + GA_ID] = !consent.analytics;
      if (window.fbq && !consent.marketing) window.fbq('consent', 'revoke');
      removeCookies(!consent.analytics, !consent.marketing);
      window.location.reload();
      return;
    }
    initGa();
    initPixel();
  }
  window.shipaSetAnalyticsConsent = function (a, m) {
    // Backwards compatible with the old single boolean acceptance API.
    save(!!a, arguments.length > 1 ? !!m : !!a);
  };
  window.shipaAnalyticsSettings = function () { if (ENABLED) banner(); };
  function banner() {
    if (document.getElementById('shipa-analytics-consent')) return;
    var kz = false;
    try { kz = localStorage.getItem('shipa-lang') === 'KZ'; } catch (_) {}
    var el = document.createElement('section');
    el.id = 'shipa-analytics-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', kz ? 'Аналитика және жарнама' : 'Аналитика и реклама');
    el.style.cssText = 'position:fixed;bottom:16px;left:12px;right:12px;max-width:540px;margin:0 auto;z-index:2147483647;background:#fffaf3;color:#302923;border:1px solid #d7c9b7;border-radius:14px;padding:18px;box-shadow:0 8px 35px #0003;font:14px/1.5 Arial,sans-serif';
    var title = kz ? 'Аналитика және жарнама' : 'Аналитика и реклама';
    var note = kz ? 'Сайт статистикасын (Google Analytics) және жарнаманы (Meta Pixel) бақылауға рұқсат бересіз бе? Брондау үшін міндетті емес. Таңдауды кейін өзгертуге болады.' : 'Разрешить статистику посещений (Google Analytics) и рекламные измерения (Meta Pixel)? Это необязательно для бронирования. Выбор можно изменить позже.';
    var buttons = kz ? ['Бас тарту', 'Тек аналитика', 'Барлығына рұқсат'] : ['Отклонить', 'Только аналитика', 'Разрешить всё'];
    var colors = 'border-radius:8px;cursor:pointer;font:inherit;padding:10px 12px;';
    el.innerHTML = '<div style="font-weight:700;margin-bottom:6px">' + title + '</div><div>' + note + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:14px">' +
      '<button type="button" data-choice="no" style="' + colors + 'background:transparent;border:1px solid #a69b8d;color:inherit">' + buttons[0] + '</button>' +
      '<button type="button" data-choice="analytics" style="' + colors + 'background:transparent;border:1px solid #a69b8d;color:inherit">' + buttons[1] + '</button>' +
      '<button type="button" data-choice="all" style="' + colors + 'background:#263c36;border:1px solid #263c36;color:white">' + buttons[2] + '</button></div>';
    el.addEventListener('click', function (event) {
      var b = event.target.closest && event.target.closest('[data-choice]');
      if (!b) return;
      var c = b.getAttribute('data-choice');
      save(c === 'all' || c === 'analytics', c === 'all');
    });
    document.body.appendChild(el);
  }
  if (!ENABLED) return;
  var stored = read();
  if (stored) {
    consent = stored;
    initGa();
    initPixel();
  } else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner, { once: true });
  else banner();
  // Delegation covers WhatsApp links dynamically rendered by the SPA.
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var url;
    try { url = new URL(link.href, window.location.href); } catch (_) { return; }
    var domain = url.hostname.toLowerCase();
    if (domain === 'wa.me' || domain === 'api.whatsapp.com' || domain === 'web.whatsapp.com' || domain === 'whatsapp.com') {
      var inBooking = !!link.closest('[data-screen-label="Бронирование"]');
      window.shipaTrack('whatsapp_click', { source: inBooking ? 'booking' : 'website' });
    } else if (url.protocol === 'tel:') {
      window.shipaTrack('phone_click', { source: 'website' });
    }
  }, true);
})();
