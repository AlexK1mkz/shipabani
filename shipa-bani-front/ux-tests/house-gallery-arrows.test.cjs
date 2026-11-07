const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('<!-- HOUSE -->');
const end = html.indexOf('<div class="shipa-house-layout">', start);
const houseGallery = html.slice(start, end);

test('house details have a single unified gallery for phone and desktop', () => {
  assert.equal((houseGallery.match(/class="shipa-house-carousel"/g)||[]).length, 1);
  assert.ok(houseGallery.includes('class="shipa-house-carousel__track" style="{{ galleryTrackStyle }}"'));
  assert.ok(houseGallery.includes('<sc-for list="{{ gallery }}" as="g"'));
  assert.ok(!houseGallery.includes('shipa-house-mobile-gallery'));
  assert.ok(!houseGallery.includes('shipa-house-gallery'));
});

test('only arrow controls can change photos, image itself is not a button', () => {
  assert.ok(houseGallery.includes('class="shipa-house-carousel__slide" role="img"'));
  assert.ok(houseGallery.includes('onClick="{{ galleryPrev }}"'));
  assert.ok(houseGallery.includes('onClick="{{ galleryNext }}"'));
  assert.ok(!houseGallery.includes('onClick="{{ g.open }}"'));
  assert.ok(!houseGallery.includes('openAllHousePhotos'));
  assert.ok(!houseGallery.includes('shipa-house-all-photos'));
  assert.ok(!html.includes('gallery.map((src,i)=>({src,style:`width:100%;height:100%;background:#3B2F2A'));
  assert.ok(html.includes('gallery=gsrc.map((src,i)=>({src,style:'));
});

test('photo index and buttons are bounded at first and last photograph', () => {
  assert.ok(html.includes('galleryHasPrev:s.galleryIdx>0'));
  assert.ok(html.includes('galleryHasNext:s.galleryIdx<gallery.length-1'));
  assert.ok(html.includes('galleryIdx:Math.max(0,st.galleryIdx-1)'));
  assert.ok(html.includes('galleryIdx:Math.min(gallery.length-1,st.galleryIdx+1)'));
  assert.ok(html.includes('galleryIdx:0,hw:0')); // resets when navigating to another house
  assert.ok(houseGallery.includes('aria-live="polite" aria-atomic="true"'));
});

test('swiping cannot scroll photos and transition is horizontal and smooth', () => {
  assert.match(html,/\.shipa-house-carousel\{[^}]*overflow:hidden/);
  assert.match(html,/\.shipa-house-carousel__track\{[^}]*transition:transform 430ms cubic-bezier/);
  assert.ok(html.includes('galleryTrackStyle:`transform:translate3d(-${Math.min(Math.max(0,s.galleryIdx),gallery.length-1)*100}%,0,0);`'));
  assert.ok(!houseGallery.includes('onScroll='));
  assert.ok(!houseGallery.includes('scroll-snap-type'));
  assert.ok(html.includes('.shipa-house-carousel__slide{flex:0 0 100%'));
  assert.ok(html.includes('.shipa-house-carousel__slide{flex:0 0 100%;width:100%;height:100%;min-width:0;pointer-events:none'));
});


test('return to houses is outside the photo area and clearly labeled', () => {
  assert.ok(houseGallery.includes('class="shipa-house-back-link"'));
  assert.ok(houseGallery.includes('<span>{{ houseUi.allHouses }}</span>'));
  assert.ok(!houseGallery.includes('width:44px;height:44px;border-radius:50%;background:rgba(249,239,227,.92)'));
  assert.ok(html.includes("allHouses:'Барлық үйлер'"));
  assert.ok(html.includes("allHouses:'Все дома'"));
});
test('arrows are touch friendly, localized and motion reduced when requested', () => {
  assert.match(html,/@media\(max-width:959px\)\{\.shipa-house-hero\{[^}]*\}\.shipa-house-back-link\{[^}]*\}\.shipa-house-carousel\{[^}]*aspect-ratio:16\/10/);
  assert.ok(html.includes('.shipa-house-carousel__arrow:focus-visible'));
  assert.ok(html.includes('.shipa-house-carousel__track,.shipa-house-carousel__arrow{transition:none!important;'));
  assert.ok(html.includes("housePhotoPrevLabel:houseKz?'Алдыңғы фото':'Предыдущее фото'"));
  assert.ok(html.includes("housePhotoNextLabel:houseKz?'Келесі фото':'Следующее фото'"));
});


test('Все дома always opens the catalog, not browser history or booking', () => {
  const handler = html.includes("houseBack:()=>{this.setState({catalogFilter:'VIP'});this.go('houses');}");
  assert.ok(handler, 'the house back button must explicitly navigate to houses');
  assert.ok(houseGallery.includes('onClick="{{ houseBack }}"'));
  assert.ok(!html.includes('houseBack:()=>s.savedBk?this.returnToBooking():this.goBack()'));
  // Scenario A: the user came from home. Scenario B: the user arrived from booking.
  // In both cases the handler must take the same catalog route, preserving the
  // separate "Вернуться к выбору" action for booking return.
  assert.ok(html.includes('returnToBooking:()=>this.returnToBooking()'));
});
