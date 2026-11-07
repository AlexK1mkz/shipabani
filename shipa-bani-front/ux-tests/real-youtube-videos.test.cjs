'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const home=html.slice(html.indexOf('<section data-reveal id="video"'),html.indexOf('<!-- HOUSE -->'));

const atmosphere=['aJ-setkE8K4','18I1z2_c6WI','30zbnPSyyh8','fPm4bVECuiM','IRFIUWDYoJE','Vbe0zz7YYzc','RUfCTHoyLqk','Exm4anJyb4Y'];
const reviews=['N8_4y0uMMss','4PqFCETg_XE','WfFJD7Noc9M','eNn3Z3bZt9c','-6B9CUF9wrI'];
function extractIds(k){const m=html.match(new RegExp(`${k}:\\[([^\\]]*)\\]`));assert.ok(m,`${k} array`);return [...m[1].matchAll(/'([-A-Za-z0-9_]{11})'/g)].map(x=>x[1]);}

test('all 8 supplied atmosphere videos are used once and in the provided order',()=>{
 assert.deepEqual(extractIds('atmosphere'),atmosphere);
});
test('all 5 supplied video reviews are used once and in the provided order',()=>{
 assert.deepEqual(extractIds('reviews'),reviews);
});
test('real clips are rendered in existing carousels with clickable cards and video IDs',()=>{
 assert.match(home,/id="car-atm"/);assert.match(home,/id="car-vrev"/);
 assert.equal((home.match(/data-video-id="\{\{ v\.videoId \}\}"/g)||[]).length,2);
 assert.equal((home.match(/onClick="\{\{ laneTap \}\}"/g)||[]).length,2);
 assert.match(html,/https:\/\/i\.ytimg\.com\/vi\/\$\{videoId\}\/hqdefault\.jpg/);
 assert.match(html,/const VREV=VIDEO_IDS\.reviews\.map/);
 assert.match(html,/const ATM=VIDEO_IDS\.atmosphere\.map/);
});
test('clicking a clip starts a real Shorts embed inline inside the card, not in a modal or a new window',()=>{
 assert.match(html,/https:\/\/www\.youtube-nocookie\.com\/embed\/\$\{videoId\}\?autoplay=1&playsinline=1&rel=0/);
 assert.match(html,/this\.setState\(\{playing:id\}\)/);
 assert.equal((home.match(/<sc-if value="\{\{ v\.playing \}\}"/g)||[]).length,2);
 assert.match(home,/<iframe src="\{\{ v\.embed \}\}"/);
 assert.match(home,/allow="autoplay; encrypted-media; picture-in-picture; web-share"/);
 assert.match(home,/class="shipa-inline-video__stop"[^>]*onClick="\{\{ v\.stop \}\}"/);
 assert.match(home,/referrerpolicy="strict-origin-when-cross-origin"/);
 assert.doesNotMatch(html,/shipa-video-overlay|aria-modal="true" aria-label="\{\{ vid\.name \}\}"/);
 assert.doesNotMatch(home,/target="_blank"[^>]*youtube|youtube[^>]*target="_blank"/);
 assert.doesNotMatch(html,/window\.open\([^)]*youtube/);
});
test('player starts on intentional click, stops on Escape or the stop button, and does not preload iframes',()=>{
 assert.match(html,/this\.state\.playing&&e\.key==='Escape'/);
 assert.match(html,/stopVideo\(\)\{if\(this\.state\.playing\)this\.setState\(\{playing:null\}\);\}/);
 assert.match(html,/if\(open\)\{\s*const id=String\(card\.dataset\.videoId/);
 assert.match(html,/if\(s\.playing&&prev\.screen!==s\.screen\)/);
 assert.match(html,/\.shipa-inline-video\{[^}]*animation:shipaVidIn/);
 assert.match(html,/@media\(prefers-reduced-motion:reduce\)\{\.shipa-inline-video/);
});
test('no invented guest names and locally defined Kazakh video labels',()=>{
 assert.doesNotMatch(html,/name:'Айгерим',house:|name:'Дмитрий',house:|name:'Алия',house:|name:'Руслан',house:|name:'Мадина и Тимур',house:/);
 assert.match(html,/name:s\.lang==='KZ'\?`Бейнепікір \$\{i\+1\}`/);
 assert.match(html,/name:s\.lang==='KZ'\?`SHIPÁ бейнесі \$\{i\+1\}`/);
});

test('dedicated Reviews page also presents all 5 real testimonials',()=>{
 const reviewPage=html.slice(html.indexOf('<!-- REVIEWS -->'),html.indexOf('<!-- ABOUT -->'));
 assert.match(reviewPage,/id="car-vrev-page"/);
 assert.match(reviewPage,/<sc-for list="\{\{ videoReviews \}\}" as="v" hint-placeholder-count="5">/);
 assert.match(reviewPage,/data-video-id="\{\{ v\.videoId \}\}"/);
 assert.match(reviewPage,/onClick="\{\{ laneTap \}\}"/);
 assert.match(reviewPage,/id="\{\{ v\.pageSlot \}\}"/);
 assert.match(html,/reviewVideosTitle:s\.lang==='KZ'\?'ҚОНАҚТАРДЫҢ БЕЙНЕПІКІРЛЕРІ'/);
});

test('gallery back button and other unrelated booking flows are still preserved',()=>{
 assert.match(html,/class="shipa-house-back-link"/);
 assert.match(html,/allHouses:'Все дома'/);
 assert.match(html,/openMenuUrl\(\)/);
});
