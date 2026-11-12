'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const english = fs.readFileSync(path.join(__dirname, '..', 'shipa-en-text.js'), 'utf8');

test('English landing hero is a complete sentence, never a Russian-English fragment', () => {
  assert.match(html, /Eight private bathhouses with steam rooms and outdoor hot tubs\. Your own house, your own terrace, complete privacy\./);
  assert.match(html, /l1:'FIND YOUR',\s*l2:'STATE OF MIND'/);
});
test('English hero statistics have native English units and prefixes', () => {
  assert.match(html, /\{pre:'up to ',suf:'',t:'guests'\}/);
  assert.match(html, /\{pre:'',suf:' min',t:'from the city centre'\}/);
});
test('English meaning and house heading are native, not word-for-word patches', () => {
  assert.match(html, /const SHIPA_MEANING_EN='“Shipa” means healing and restoration in Kazakh\.'/);
  assert.match(html, /houseHeadingStart:'EIGHT HOUSES - '/);
  assert.match(html, /houseHeadingEnd:'EIGHT STATES OF MIND'/);
});
test('English FAQ includes all 7 questions and full answers', () => {
  const block=html.split('const FAQ_EN=')[1]?.split('const SVC_FAQ_EN=')[0]||'';
  assert.equal((block.match(/\{q:'/g)||[]).length,7);
  for(const question of ['How far in advance should I book?','What should I bring?','What time can I arrive?','Is a deposit required?','Can I cancel or reschedule?','What if we arrive late?','Can we extend our visit?']) assert.ok(block.includes(question),question);
});
test('Guest reviews are genuinely translated rather than partially machine-replaced', () => {
  const block=html.split('const REVIEWS_EN = [')[1]?.split('const REVIEWS=[')[0]||'';
  assert.equal((block.match(/name:'/g)||[]).length,5);
  assert.match(block,/We came after work in the evening/);
});
test('English video review cards have translated labels', () => {
  assert.match(html, /`Video review \$\{i\+1\}`/);
  assert.match(html, /`Play video review \$\{i\+1\}`/);
});
test('English date strip uses natural calendar wording', () => {
  assert.match(html, /d\.toLocaleString\('en-US',\{month:'long'\}\)/);
  assert.match(html, /'EN'\?`Fully booked for/);
});
test('English booking, legal terms and footer use native labels', () => {
  assert.match(html,/legalPrivacyLabel:'Privacy policy'/);
  assert.match(html,/requisiteBusinessName:'Sole proprietorship “Kor Food”'/);
  assert.match(html,/requisiteAddressValue:'41 Nazarbayev Avenue, Karaganda, 100000, Kazakhstan'/);
  assert.match(html,/exitTitle:'Leave booking\?'/);
});
test('English service tiles and about cards have full sentences', () => {
  assert.match(html,/title:'Your own house',sub:'The steam room, hot tub and terrace are exclusively yours/);
  assert.match(html,/desc:'Warm oil massage in the relaxation room'/);
});
test('RU and KZ remain available', () => {
  assert.match(html,/s\.lang==='KZ'/);
  assert.match(html,/const FAQ_EN=/);
  assert.match(html,/const FAQ_KZ\s*=/);
});
test('English phrase dictionary and sources do not contain unresolved conflict markers',()=>{
  assert.match(english,/global\.ShipaEnText=Object\.freeze/);
  for(const file of [html,english]) {
    assert.doesNotMatch(file,/^<<<<<<< |^>>>>>>> |^=======$/m);
    assert.doesNotMatch(file,/[—–]/);
  }
});
