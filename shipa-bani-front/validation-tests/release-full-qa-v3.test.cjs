const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const swipe=fs.readFileSync(path.join(root,'shipa-house-swipe.js'),'utf8');
const steam=fs.readFileSync(path.join(root,'brand/shipa-steam-mark.png'));

test('latest build is identifiable in deployed source',()=>{
 assert.match(html,/name="shipa-build" content="2026-11-11-kitchen-sibling-e-menu-v1"/);
 assert.match(html,/#kitchen/);
});
test('all SHIPÁ text glyphs use the real A with original steam ornament',()=>{
 assert.ok((html.match(/class="shipa-brand-steam-a"/g)||[]).length>=8);
 assert.doesNotMatch(html,/SHIP<span data-st-on="1">Á<\/span>/);
 assert.match(html,/\.shipa-brand-steam-a::after\{[^}]*background-image:url\("data:image\/png;base64,/);
 assert.match(html,/bottom:-\.36em/); // A aligned to the actual text baseline
 assert.match(html,/id="shipa-brand-global-fix"/); // dynamic RU/KZ coverage
 for(const name of ['navy','cream']){
  const image=fs.readFileSync(path.join(root,'brand',`shipa-a-steam-${name}.png`));
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 }
 assert.equal(steam.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
});
test('brand anatomy pins 1, 2, 3 stay in the margins beside the logo',()=>{
 assert.match(html,/class="shipa-meaning-logo-map"/);
 assert.match(html,/class="shipa-meaning-pin shipa-meaning-pin--\{\{ pin\.n \}\}"/);
 assert.match(html,/\.shipa-meaning-logo-map\{position:relative;padding:40px 42px 28px/);
 assert.match(html,/\.shipa-meaning-pin--1\{left:1px;top:29%/);
 assert.match(html,/\.shipa-meaning-pin--2\{left:1px;top:70%/);
 assert.match(html,/\.shipa-meaning-pin--3\{right:1px;top:18%/);
 assert.doesNotMatch(html,/meaningPins:[^\n]*style:`position:absolute;left:/);
});
test('every legal page supports the original brand A on RU/KZ',()=>{
 for(const lang of ['ru','kz'])for(const kind of ['offer','consent','privacy']){
  const legal=fs.readFileSync(path.join(root,'legal',`${kind}-${lang}.html`),'utf8');
  assert.match(legal,/id="shipa-legal-brand-fix"/);
  assert.match(legal,/id="shipa-brand-global-fix"/);
  assert.match(legal,/shipa-a-steam-navy\.png/);
  assert.match(legal,/shipa-a-steam-cream\.png/);
 }
});

test('gallery works with index.html replacement only: inline, swipe, no pagination dots',()=>{
 assert.match(html,/id="shipa-swipes-inline"/);
 assert.match(html,/window\.__SHIPA_GALLERY_SWIPE_V3/);
 assert.match(html,/\.shipa-catalog-photo-track\{touch-action:auto!important/);
 assert.match(html,/setTimeout\(\(\)=>\{[\s\S]*?scrollLeft-g\.left/);
 assert.match(html,/shipa-house-carousel__arrow--next/);
 assert.doesNotMatch(html,/data-photo-dot|class="shipa-catalog-photo-dots"/);
 assert.match(swipe,/touchcancel/);
});
test('Kitchen links now open sibling e-menu; prior cart implementation is retained',()=>{
 assert.match(html,/data-shipa-nav-screen="\{\{ m.screen \}\}"/);
 assert.match(html,/data-shipa-nav-screen="\{\{ n.screen \}\}"/);
 assert.match(html,/window\.location\.assign\(new URL\(target,document\.baseURI\)\.href\)/);
 assert.match(html,/beginTableBooking\(\)\{this\.goKitchenSection\(\);\}/);
 assert.match(html,/cartGoLabel:screen==='kitchen'/);
 assert.match(html,/kitchenSectionTitle:s\.lang==='KZ'/);
});
test('Kaspi payment behavior is unchanged from the previously approved version',()=>{
 assert.match(html,/pay\(m\)\{if\(m!==\'kaspi\'\)return;/);
 assert.match(html,/this\.finish\(paid,m\)/);
 assert.match(html,/demoPayment\?\?\'paid\'/);
 assert.match(html,/disabled="\{\{ sending \}\}"/);
 assert.doesNotMatch(html,/kaspiUnavailable|Kaspi Pay пока не подключён/);
});
test('all eight houses have three distinct local photos',()=>{
 const hashes=new Set();
 for(let i=1;i<=8;i++)for(const kind of ['int','art','acc']){
  const p=path.join(root,'img',`h${i}_${kind}.png`);
  assert.ok(fs.existsSync(p),p);
  const png=fs.readFileSync(p);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  hashes.add(require('node:crypto').createHash('sha256').update(png).digest('hex'));
 }
 assert.equal(hashes.size,24);
});
