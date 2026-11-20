/* Shared between the demo review forms, storefront and CRM on the same origin. */
(() => {
  'use strict';

  const RECORD = 'shipa-review-v1:';
  const FOLLOW_UP = 'shipa-review-followup-v1:';
  const CHANGE = 'shipa:reviews-change';
  const HOUSE_IDS = new Set(['dyhanie', 'sila', 'balans', 'energiya', 'svoboda', 'lyogkost', 'stihiya', 'impuls']);
  const DATE = new Intl.DateTimeFormat('ru-KZ', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty',
  });
  const REVIEWS=[
{id:1,guest:'Арман',num:'№ 1038',house:'balans',rating:5,cats:['парение','чистота','дом'],text:'Лучшее парение в городе. Мягкий пар, лаванда, никто не торопит. Чай после — отдельное удовольствие.',date:'16.10, 09:15',source:'WhatsApp'},
{id:2,guest:'Марат',num:'№ 1044',house:'energiya',rating:3,cats:['кухня','сервис'],text:'Дом отличный, чан горячий. Но стол привезли на 40 минут позже, чем договаривались, и без приборов.',date:'16.10, 13:40',source:'WhatsApp'},
{id:3,guest:'Сауле',num:'№ 1029',house:'dyhanie',rating:5,cats:['дом','сервис'],text:'Третий раз в ДЫХАНИИ. Всё как всегда: светло, чисто, пахнет эвкалиптом. Администратор помнит, как нас зовут.',date:'12.10, 10:02',source:'сайт',reply:'Сауле, спасибо, что возвращаетесь. Ждём в ноябре!'},
{id:4,guest:'Данияр',num:'№ 1027',house:'sila',rating:4,cats:['парение','дом'],text:'Хвойное парение сильное, но контраст в чане в октябре уже холодноват. Хотелось бы подогрев повыше.',date:'11.10, 20:30',source:'2ГИС'},
{id:5,guest:'Ольга',num:'№ 1022',house:'svoboda',rating:5,cats:['чистота','кухня'],text:'Отмечали день рождения. Терраса, чай на травах, всё убрано идеально.',date:'09.10, 23:10',source:'сайт'},
{id:6,guest:'Серик',num:'№ 1019',house:'balans',rating:2,cats:['сервис'],text:'Ждали дом 25 минут после заявленного времени — ещё убирали.',date:'05.10, 19:05',source:'WhatsApp'}];

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function notify() {
    window.dispatchEvent(new Event(CHANGE));
  }

  function list() {
    const submitted = [];
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(RECORD)) continue;
        const item = read(key);
        if (item && typeof item.id === 'string' && typeof item.guest === 'string' &&
            typeof item.text === 'string' && HOUSE_IDS.has(item.house) &&
            Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5 &&
            typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)) {
          submitted.push(item);
        }
      }
    } catch { /* The seed reviews remain available when storage is blocked. */ }

    const oldReviews = read('shipa_crm_demo_v1')?.reviews;
    const legacyById = new Map(Array.isArray(oldReviews)
      ? oldReviews.filter(item => item && typeof item.reply === 'string').map(item => [item.id, item.reply])
      : []);
    return [...submitted.sort((a, b) => b.createdAt - a.createdAt), ...REVIEWS].map(item => {
      const saved = read(FOLLOW_UP + item.id);
      return {
        ...item,
        status: 'published',
        contacted: saved?.contacted === true,
        reply: saved?.reply ?? legacyById.get(item.id) ?? item.reply ?? '',
      };
    });
  }

  function submit({guest, house, rating, text = '', cats = [], num = '', phone = '', callback = false}) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !HOUSE_IDS.has(house)) {
      throw new TypeError('Invalid review');
    }
    const now = new Date();
    const item = {
      id: crypto.randomUUID(),
      guest: String(guest || '').trim().slice(0, 80),
      house,
      rating,
      text: String(text).trim().slice(0, 1500),
      cats,
      num: String(num),
      phone: String(phone).replace(/\D/g, ''),
      callback: Boolean(callback),
      date: DATE.format(now),
      createdAt: now.getTime(),
      source: 'сайт',
    };
    localStorage.setItem(RECORD + item.id, JSON.stringify(item));
    notify();
    return item.id;
  }

  function updateFollowUp(id, patch) {
    localStorage.setItem(FOLLOW_UP + id, JSON.stringify({ ...read(FOLLOW_UP + id), ...patch }));
    notify();
  }

  function published() {
    return list().map(({id, guest, house, rating, text, date, reply}) => ({
      id, guest: guest.split(/\s+/)[0], house, rating, text, date, reply,
    }));
  }

  function subscribe(listener) {
    const onStorage = ({key}) => {
      if (key === null || key.startsWith(RECORD) || key.startsWith(FOLLOW_UP)) listener();
    };
    window.addEventListener(CHANGE, listener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE, listener);
      window.removeEventListener('storage', onStorage);
    };
  }

  window.ShipaReviews = {list, submit, updateFollowUp, published, subscribe};
})();
