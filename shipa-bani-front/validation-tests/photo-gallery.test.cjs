const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const viewer = fs.readFileSync(path.join(root, 'shipa-photo-viewer.js'), 'utf8');
test('full screen viewer script is loaded locally', () => {
  assert.match(html, /<script defer src="\.\/shipa-photo-viewer\.js"><\/script>/);
  assert.match(viewer, /window\.ShipaPhotoViewer\s*=\s*Object\.freeze/);
});
test('viewer has accessible controls, arrows, thumbnails and keyboard', () => {
  for (const pattern of [/aria-modal/, /spv-prev/, /spv-next/, /spv-thumb/, /ArrowLeft/, /ArrowRight/, /Escape/, /aria-current/, /pointerdown/, /pointerup/, /body\.style\.overflow/]) assert.match(viewer, pattern);
});
test('house photo collage opens a full gallery', () => {
  assert.match(html, /gallery=gsrc\.map/);
  assert.match(html, /ShipaPhotoViewer\?\.open\(gsrc,i,hk\.name\)/);
  assert.match(html, /openAllHousePhotos:\(\)=>window\.ShipaPhotoViewer\?\.open\(gsrc,0,hk\.name\)/);
});
test('catalog has a dedicated photo button without replacing house link', () => {
  assert.match(html, /shipa-photo-catalog-action/);
  assert.match(html, /photoOpen:e=>\{e\?\.stopPropagation\(\)/);
  assert.match(html, /onClick="\{\{ h\.open \}\}"/);
});
test('reviews open their complete photo collection', () => {
  assert.match(html, /ShipaPhotoViewer\?\.open\(r\.photos,i,r\.name\)/);
});
test('programs, kitchen, service sections, about use photo viewer', () => {
  for (const pattern of [/p\.openPhotos/, /g\.openPhoto/, /c\.openPhoto/, /openAboutPhoto/, /ShipaPhotoViewer\?\.open\(kitchenCards\.map/]) assert.match(html, pattern);
});
test('booking photo modal keeps a scrollable gallery and adds arrows', () => {
  for (const pattern of [/galPrev/, /galNext/, /galMultiple/, /galRef/, /galScroll/, /shipa-book-gallery-arrow/]) assert.match(html, pattern);
});
test('repaired photo is valid PNG header', () => {
  const b=fs.readFileSync(path.join(root,'brand','img1_p8.png'));
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(b.readUInt32BE(16),1536);
  assert.equal(b.readUInt32BE(20),1024);
});
