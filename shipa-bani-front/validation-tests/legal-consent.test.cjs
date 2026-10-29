const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('RU and KZ document URLs route to six real pages and open in new tabs',()=>{
  assert.match(html,/legalOfferUrl:s\.lang==='KZ'\?'legal\/offer-kz\.html':'legal\/offer-ru\.html'/);
  assert.match(html,/legalConsentUrl:s\.lang==='KZ'\?'legal\/consent-kz\.html':'legal\/consent-ru\.html'/);
  assert.match(html,/legalPrivacyUrl:s\.lang==='KZ'\?'legal\/privacy-kz\.html':'legal\/privacy-ru\.html'/);
  assert.match(html,/href="\{\{ legalOfferUrl \}\}" target="_blank" rel="noopener noreferrer"/);
  for(const lang of ['ru','kz']) for (const type of ['offer','consent','privacy']) {
    const f=path.join(__dirname,'..','legal',`${type}-${lang}.html`);
    assert.ok(fs.existsSync(f),f);
    const s=fs.readFileSync(f,'utf8');
    assert.ok(s.includes('<article class="legal-document"'),f);
    assert.ok(s.length>6500,f);
  }
});
test('Both permissions are unchecked by default and reset for every new booking',()=>{
  assert.match(html,/form:\{name:'',phone:'',agree:false,privacy:false\}/);
  assert.match(html,/form:\{\.\.\.this\.state\.form,agree:false,privacy:false\},fe:FE0/);
  assert.match(html,/restoreBooking\(\)[\s\S]{0,350}agree:false,privacy:false/);
  assert.match(html,/draftBk:dr\.bk,form:\{\.\.\.st\.form,name:dr\.form\?\.name\|\|'',phone:dr\.form\?\.phone\|\|'',agree:false,privacy:false\}/);
  assert.doesNotMatch(html, /form:\{name:'Алекс'[^}]*agree:true/);
});
test('Booking has independent offer and privacy checkboxes with viewable documents',()=>{
  assert.match(html,/id="bk-agree"[^>]+checked="\{\{ form\.agree \}\}"/);
  assert.match(html,/id="bk-privacy"[^>]+checked="\{\{ form\.privacy \}\}"/);
  assert.match(html,/onChange="\{\{ setAgree \}\}"/);
  assert.match(html,/onChange="\{\{ setPrivacy \}\}"/);
  assert.match(html,/legalOfferShortLabel/);
  assert.match(html,/legalConsentLabel/);
});
test('Validation blocks step five unless both checkboxes are ticked',()=>{
  assert.match(html,/formOk\(\)\{const f=this\.state\.form;return nameValid\(f\.name\)&&phoneValid\(f\.phone\)&&!!f\.agree&&!!f\.privacy/);
  assert.match(html,/needOffer=scope==='bk'&&!\(s\.bk&&s\.bk\.pre\)/);
  assert.match(html,/needPrivacy=scope==='bk'/);
  assert.match(html,/if\(!e\.name&&!e\.phone&&!e\.agree&&!e\.privacy\)/);
  assert.match(html,/if\(bk\.step===4\)\{if\(this\.state\.sending\)return;if\(!this\.validate\('bk'\)\)return/);
});
test('Pre-ordering personal data also requires explicit consent, without requiring a contract offer',()=>{
  assert.match(html,/<sc-if value="\{\{ pre \}\}" hint-placeholder-val="\{\{ false \}\}">\s*<div class="shipa-legal-choice-group">/);
  assert.match(html,/needOffer=scope==='bk'&&!\(s\.bk&&s\.bk\.pre\)/);
  assert.match(html,/needPrivacy=scope==='bk'/);
});

test('No redundant legal help, duplicate list or docs heading in booking flow',()=>{
  assert.doesNotMatch(html, /\{\{ legalOfferOptionalNote \}\}/);
  assert.doesNotMatch(html, /\{\{ legalDocsHint \}\}/);
  assert.doesNotMatch(html, /class="shipa-legal-links(?:\s|")/);
  assert.doesNotMatch(html, /class="shipa-legal-links__title"/);
  assert.match(html, /id="bk-agree"[\s\S]{0,400}legalOfferShortLabel/);
  assert.match(html, /id="bk-privacy"[\s\S]{0,400}legalConsentLabel/);
});
