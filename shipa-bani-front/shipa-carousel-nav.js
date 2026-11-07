/* SHIPA: standalone carousel navigation replacing unsupported dc-import/CarNav. */
(() => {
  'use strict';
  const SELECTOR = '.shipa-carousel-nav[data-carousel-target]';
  let raf = 0;
  function getLane(nav) {
    const id = nav.getAttribute('data-carousel-target');
    return id ? document.getElementById(id) : null;
  }
  function update() {
    raf = 0;
    document.querySelectorAll(SELECTOR).forEach(nav => {
      const lane = getLane(nav);
      // An unrendered carousel or a desktop grid does not need controls.
      const hasOverflow = !!(lane && lane.getClientRects().length &&
        getComputedStyle(lane).overflowX !== 'visible' &&
        lane.scrollWidth - lane.clientWidth > 5);
      nav.dataset.active = hasOverflow ? '1' : '0';
      if (!hasOverflow) return;
      const max = lane.scrollWidth - lane.clientWidth;
      const left = lane.scrollLeft;
      nav.querySelectorAll('button[data-carousel-dir]').forEach(btn => {
        btn.disabled = btn.dataset.carouselDir === '-1' ? left < 4 : left > max - 4;
      });
    });
  }
  function schedule() {
    if (!raf) raf = requestAnimationFrame(update);
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('.shipa-carousel-nav button[data-carousel-dir]');
    if (!btn || btn.disabled) return;
    const nav = btn.closest(SELECTOR);
    const lane = nav && getLane(nav);
    if (!lane) return;
    const cards = lane.querySelectorAll(':scope > [data-card]');
    const delta = cards.length > 1
      ? Math.abs(cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left)
      : Math.max(160, lane.clientWidth * .8);
    lane.scrollBy({left: delta * Number(btn.dataset.carouselDir),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    schedule();
  });
  document.addEventListener('scroll', e => {
    if (e.target instanceof Element && e.target.classList.contains('lane')) schedule();
  }, true);
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('load', schedule);
  // Handles SPA screens, conditional carousels, and dynamically created cards.
  function start() {
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {childList:true, subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
