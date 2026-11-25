/* Font-independent, horizontal dash marks for SHIPÁ copy and number ranges. */
(function () {
  'use strict';
  const DASH = /[\u2012-\u2015\u2212]|(?<!\S)-(?=\s|$)|(?<=\d)-(?=\d)|(?<=ВИДЕО)-(?=ОТЗЫВЫ)|(?<=VIP)-(?=[А-Яа-яЁё])/gu;
  const hasDash = value => { DASH.lastIndex = 0; return DASH.test(value); };
  const style = document.createElement('style');
  style.textContent = '.shipa-text-dash{display:inline-block;inline-size:.32em;block-size:max(1px,.035em);vertical-align:.22em;background:currentColor;font-style:normal!important;transform:none!important}.shipa-text-dash--short{inline-size:.32em}';
  document.head.append(style);
  function pieces(text, makeDash) {
    DASH.lastIndex = 0;
    const output = []; let end = 0;
    for (const match of text.matchAll(DASH)) {
      if (match.index > end) output.push(text.slice(end, match.index));
      output.push(makeDash(match[0], match.index)); end = match.index + 1;
    }
    if (end < text.length) output.push(text.slice(end));
    return output;
  }
  const listeners = new Set();
  document.addEventListener('shipa:languagechange', () => listeners.forEach(update => update()));
  function Text({ value }) {
    const R = window.React;
    const [, update] = R.useReducer(n => n + 1, 0);
    R.useEffect(() => { listeners.add(update); return () => listeners.delete(update); }, []);
    const lang = window.ShipaLocale?.get?.();
    const text = lang ? window.ShipaLocale.translate(value, lang) : value;
    const children = pieces(text, (glyph, key) => R.createElement('span', {
      key, className: 'shipa-text-dash' + (glyph === '-' || glyph === '−' ? ' shipa-text-dash--short' : ''),
      role: 'img', 'aria-label': glyph
    }));
    return R.createElement('span', { 'data-shipa-typography': '' }, ...children);
  }
  window.ShipaTypography = { renderText(value) {
    if (typeof value !== 'string' || !hasDash(value)) return value;
    return window.React.createElement(Text, { value });
  }};
  // Static articles and the demo review have no React-owned text nodes.
  function decorate(root) {
    if (!root || !root.isConnected) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = root.nodeType === 3 ? [root] : [];
    if (root.nodeType !== 3) while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest('#dc-root,x-dc,[data-dc-script],script,style,textarea,input,code,pre,option,[contenteditable],.shipa-text-dash')) continue;
      if (!hasDash(node.nodeValue || '')) continue;
      const fragment = document.createDocumentFragment();
      for (const part of pieces(node.nodeValue, glyph => {
        const span = document.createElement('span'); span.className = 'shipa-text-dash' + (glyph === '-' || glyph === '−' ? ' shipa-text-dash--short' : '');
        span.setAttribute('role', 'img'); span.setAttribute('aria-label', glyph); return span;
      })) fragment.append(typeof part === 'string' ? document.createTextNode(part) : part);
      node.replaceWith(fragment);
    }
  }
  function start() {
    decorate(document.body);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') decorate(record.target);
        else record.addedNodes.forEach(decorate);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
