const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const used = ['index.html','shipa-ru-kz.js','shipa-booking-i18n.js','shipa-extra-kz.js','shipa-content-kz.js'];
const sources = used.map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]);

test('copy: no fuel type claims appear in the current UI and locale code',()=>{
  const obsolete = /(?:\bдровяная\b|\bна дровах\b|\bдрова\b|\bотынмен\b|\bотын пеші\b|\bгазовая печь\b|\bна газу\b)/iu;
  for(const [name,source] of sources) assert.equal(obsolete.test(source),false,name);
  assert.ok(html.includes("{name:'Парная',desc:'уютная атмосфера, липа и кедр'}"));
  assert.ok(html.includes('Горячий чан</span> входит в стоимость дома'));
  assert.ok(html.includes("'горячий чан':'Ыстық чан'"));
});

test('mobile: service details and photo actions point DOWN, not right',()=>{
  assert.match(html,/@media\(max-width:767px\)\{[\s\S]*?\.shipa-service-details-button svg[\s\S]*?\.shipa-service-photo-action svg\{transform:rotate\(90deg\);\}/);
  assert.match(html,/\.shipa-service-details-button:hover svg\{transform:translateX\(3px\);\}/);
  assert.match(html,/prefers-reduced-motion:reduce/);
});

test('actions: every button is wired (including carousel and legal buttons)',()=>{
  const buttons=[...html.matchAll(/<button\b[^>]*>/gi)].map(m=>m[0]);
  assert.ok(buttons.length>=200,`Expected complete site controls, got ${buttons.length}`);
  const inert=buttons.filter(tag=>!(/onclick\s*=/i.test(tag)||/data-carousel-dir\s*=/i.test(tag)||/id="shipa-legal-(?:close|done)"/i.test(tag)));
  assert.deepEqual(inert,[],'No button without an action handler');
  assert.match(html,/closeButton\.addEventListener\('click',close\)/);
  assert.match(html,/done\.addEventListener\('click',close\)/);
  assert.ok(fs.readFileSync(path.join(root,'shipa-carousel-nav.js'),'utf8').includes("document.addEventListener('click'"));
});

test('links: no anchors with empty / hash-only / javascript hrefs',()=>{
  const links=[...html.matchAll(/<a(?:\s|>)[^>]*>/gi)].map(m=>m[0]);
  assert.ok(links.length>40);
  for(const tag of links){
    const h=tag.match(/\bhref\s*=\s*"([^"]*)"/i);
    assert.ok(h,tag);
    assert.ok(h[1]&&h[1]!=='#'&&!/^javascript:/i.test(h[1]),tag);
  }
});

test('menu CTA is reachable in shipped archive, external URL remains configurable',()=>{
  assert.match(html,/openMenuUrl\(\)\{[\s\S]*?if\(target\)\{window\.location\.assign\([\s\S]*?this\.go\('kitchen'\)/);
  assert.match(html,/openMenu:\(\)=>\{this\.setState\(\{bk:null,[\s\S]*?this\.goKitchenSection\(\)/);
  assert.match(html,/<sc-if value="\{\{ isKitchen \}\}"/);
});

test('all included local script and legal files exist',()=>{
  const scripts=[...html.matchAll(/<script\b[^>]*?src="([^"]+)"[^>]*>/g)].map(x=>x[1]);
  for(const name of scripts) assert.ok(fs.existsSync(path.join(root,name)),name);
  for(const name of ['offer','privacy','consent']) for(const lang of ['ru','kz'])
    assert.ok(fs.existsSync(path.join(root,'legal',`${name}-${lang}.html`)));
});
