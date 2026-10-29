/* SHIPÁ: accessible, standalone photo viewer. No network calls or external dependencies. */
(function () {
  'use strict';
  let items = [], current = 0, modal = null, mainImg = null, titleEl = null;
  let countEl = null, thumbsEl = null, prevBtn = null, nextBtn = null;
  let lastFocus = null, oldOverflow = '', gesture = null;
  const esc = (s) => String(s == null ? '' : s);

  function initialize() {
    if (modal) return;
    const style = document.createElement('style');
    style.id = 'shipa-photo-viewer-style';
    style.textContent = `
      .spv-root{position:fixed;inset:0;z-index:200;background:rgba(8,22,36,.96);color:#F9EFE3;display:flex;flex-direction:column;align-items:center;padding:env(safe-area-inset-top) 12px env(safe-area-inset-bottom);font-family:inherit;box-sizing:border-box}
      .spv-root[hidden]{display:none!important}.spv-top{width:min(1200px,100%);display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:64px;padding:5px 0}
      .spv-caption{min-width:0;overflow:hidden}.spv-title{font-weight:600;font-size:15px;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spv-count{margin-top:4px;font-size:12px;opacity:.8;font-variant-numeric:tabular-nums}
      .spv-close,.spv-arrow{display:grid;place-items:center;border:1px solid rgba(249,239,227,.5);background:rgba(249,239,227,.12);color:#F9EFE3;border-radius:50%;width:44px;height:44px;flex:0 0 44px;cursor:pointer;line-height:1;font-size:26px;padding:0}.spv-close:hover,.spv-arrow:hover{background:rgba(249,239,227,.25)}
      .spv-main{position:relative;display:flex;align-items:center;justify-content:center;flex:1;min-height:0;width:min(1200px,100%);touch-action:pan-y;user-select:none;overflow:hidden}
      .spv-image{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;-webkit-user-drag:none;user-select:none}
      .spv-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;background:rgba(10,47,79,.8)}.spv-prev{left:8px}.spv-next{right:8px}
      .spv-arrow[hidden]{display:none!important}.spv-strip{width:min(1200px,100%);display:flex;justify-content:flex-start;align-items:center;gap:9px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;scrollbar-color:rgba(249,239,227,.4) transparent;min-height:92px;padding:12px 4px;box-sizing:border-box;scroll-snap-type:x proximity}
      .spv-thumb{flex:0 0 76px;width:76px;height:58px;padding:0;border:2px solid transparent;border-radius:9px;background:#22374b;overflow:hidden;cursor:pointer;opacity:.65;scroll-snap-align:center}.spv-thumb[aria-current=true]{opacity:1;border-color:#C15C22}.spv-thumb img{display:block;width:100%;height:100%;object-fit:cover}
      .spv-close:focus-visible,.spv-arrow:focus-visible,.spv-thumb:focus-visible{outline:3px solid #F9EFE3;outline-offset:3px}
      .spv-hint{font-size:11px;opacity:.7;white-space:nowrap;margin:0 0 4px}
      @media(max-width:600px){.spv-root{padding-left:5px;padding-right:5px}.spv-top{padding:4px 12px;min-height:58px}.spv-title{font-size:14px}.spv-arrow{height:38px;width:38px;flex-basis:38px;font-size:24px}.spv-prev{left:4px}.spv-next{right:4px}.spv-strip{min-height:77px;gap:7px;padding:8px 7px}.spv-thumb{flex-basis:60px;width:60px;height:48px}.spv-hint{font-size:10px}}
      @media(prefers-reduced-motion:reduce){.spv-root *{animation:none!important;transition:none!important}}
    `;
    document.head.appendChild(style);
    modal = document.createElement('div');
    modal.className = 'spv-root';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Просмотр фотографий');
    modal.innerHTML = '<div class="spv-top"><div class="spv-caption"><div class="spv-title"></div><div class="spv-count" aria-live="polite"></div></div><button class="spv-close" type="button" aria-label="Закрыть фотографии">×</button></div><div class="spv-main"><button type="button" class="spv-arrow spv-prev" aria-label="Предыдущее фото">‹</button><img class="spv-image" alt="" draggable="false" decoding="async"><button type="button" class="spv-arrow spv-next" aria-label="Следующее фото">›</button></div><div class="spv-strip" aria-label="Миниатюры фотографий"></div><div class="spv-hint">← → — листать · Esc — закрыть · на телефоне — свайп</div>';
    document.body.appendChild(modal);
    mainImg = modal.querySelector('.spv-image');
    titleEl = modal.querySelector('.spv-title');
    countEl = modal.querySelector('.spv-count');
    thumbsEl = modal.querySelector('.spv-strip');
    prevBtn = modal.querySelector('.spv-prev');
    nextBtn = modal.querySelector('.spv-next');
    modal.querySelector('.spv-close').addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn.addEventListener('click', () => show(current + 1));
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    const media = modal.querySelector('.spv-main');
    media.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      gesture = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
    }, { passive: true });
    media.addEventListener('pointerup', (event) => {
      if (!gesture || gesture.pointer !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
    media.addEventListener('pointercancel', () => { gesture = null; });
    document.addEventListener('keydown', (event) => {
      if (!modal || modal.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); event.stopImmediatePropagation(); show(current - 1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); event.stopImmediatePropagation(); show(current + 1); }
      else if (event.key === 'Tab') {
        const focusables = [...modal.querySelectorAll('button:not([hidden])')];
        const ix = focusables.indexOf(document.activeElement);
        if (event.shiftKey && ix === 0) { event.preventDefault(); focusables[focusables.length - 1]?.focus(); }
        else if (!event.shiftKey && ix === focusables.length - 1) { event.preventDefault(); focusables[0]?.focus(); }
      }
    }, true);
  }
  function show(index) {
    if (!items.length) return;
    current = (index % items.length + items.length) % items.length;
    mainImg.src = items[current].src;
    mainImg.alt = items[current].alt || (titleEl.textContent + ' — ' + (current + 1));
    countEl.textContent = `${current + 1} / ${items.length}`;
    prevBtn.hidden = nextBtn.hidden = items.length < 2;
    [...thumbsEl.children].forEach((btn, i) => {
      const selected = i === current;
      btn.setAttribute('aria-current', String(selected));
      if (selected) btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    });
    const next = items[(current + 1) % items.length];
    if (next && next !== items[current]) { const pre = new Image(); pre.src = next.src; }
  }
  function open(photos, index, label) {
    if (!Array.isArray(photos)) return;
    items = photos.map((x) => typeof x === 'string' ? { src: x } : x).filter((x) => x && typeof x.src === 'string' && x.src.trim());
    if (!items.length) return;
    initialize();
    const wasClosed = modal.hidden;
    if (wasClosed) { lastFocus = document.activeElement; oldOverflow = document.body.style.overflow; }
    titleEl.textContent = esc(label || 'Фотографии SHIPÁ');
    thumbsEl.replaceChildren();
    items.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'spv-thumb'; btn.setAttribute('aria-label', `Фото ${i + 1} из ${items.length}`);
      const img = document.createElement('img'); img.src = item.src; img.alt = ''; img.loading = 'lazy';
      btn.appendChild(img); btn.addEventListener('click', () => show(i));
      thumbsEl.appendChild(btn);
    });
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    show(Number.isFinite(+index) ? +index : 0);
    modal.querySelector('.spv-close').focus({ preventScroll: true });
  }
  function close() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    mainImg.removeAttribute('src');
    thumbsEl.replaceChildren(); items = []; gesture = null;
    document.body.style.overflow = oldOverflow;
    if (lastFocus && document.contains(lastFocus) && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }
  window.ShipaPhotoViewer = Object.freeze({ open, close, isOpen: () => !!modal && !modal.hidden });
})();
