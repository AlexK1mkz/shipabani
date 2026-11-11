/* SHIPÁ v20261111: swipe catalog and house galleries; native Safari first. */
(() => {
 'use strict';
 if (window.__SHIPA_GALLERY_SWIPE_V3) return;
 window.__SHIPA_GALLERY_SWIPE_V3 = true;
 const CATALOG='.shipa-catalog-photo-track';
 const DETAIL='.shipa-house-carousel';
 const selector=CATALOG+','+DETAIL;
 const minDx=32;
 let touch=null,mouse=null,suppressUntil=0,suppressLane=null;
 const getLane=target=>target instanceof Element?target.closest(selector):null;
 const onButton=target=>target instanceof Element&&!!target.closest('button');
 function catalogIndex(lane){return Math.round(lane.scrollLeft/Math.max(1,lane.clientWidth));}
 function catalogGo(lane,direction,originIndex){
   const items=lane.querySelectorAll(':scope > img');
   if(items.length<2)return;
   const next=Math.max(0,Math.min(items.length-1,originIndex+direction));
   lane.scrollTo({left:next*lane.clientWidth,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 function go(lane,direction,index){
   if(!lane||!lane.isConnected)return;
   if(lane.matches(DETAIL)){
     const arrow=lane.querySelector(direction>0?'.shipa-house-carousel__arrow--next':'.shipa-house-carousel__arrow--prev');
     if(arrow&&!arrow.disabled)arrow.click();
   }else catalogGo(lane,direction,index);
 }
 function complete(g,x,y){
   if(!g||!g.lane.isConnected)return;
   const dx=x-g.x,dy=y-g.y;
   if(Math.abs(dx)<minDx||Math.abs(dx)<Math.abs(dy)*1.3)return;
   suppressUntil=Date.now()+700;suppressLane=g.lane;
   const dir=dx<0?1:-1;
   if(g.lane.matches(DETAIL)){go(g.lane,dir,g.index);return;}
   // If Safari has performed its own horizontal scroll, do not advance twice.
   setTimeout(()=>{
     if(!g.lane.isConnected)return;
     if(Math.abs(g.lane.scrollLeft-g.left)>6)return;
     go(g.lane,dir,g.index);
   },90);
 }
 document.addEventListener('touchstart',e=>{
   if(e.touches.length!==1||onButton(e.target)){touch=null;return;}
   const lane=getLane(e.target);if(!lane){touch=null;return;}
   const t=e.changedTouches[0];
   touch={lane,x:t.clientX,y:t.clientY,left:lane.scrollLeft,index:catalogIndex(lane),id:t.identifier};
 },{capture:true,passive:true});
 document.addEventListener('touchend',e=>{
   const g=touch;touch=null;if(!g)return;
   for(const t of e.changedTouches)if(t.identifier===g.id){complete(g,t.clientX,t.clientY);break;}
 },{capture:true,passive:true});
 document.addEventListener('touchcancel',()=>{touch=null},{capture:true,passive:true});
 document.addEventListener('pointerdown',e=>{
   if(e.pointerType!=='mouse'||e.button!==0||onButton(e.target))return;
   const lane=getLane(e.target);if(lane)mouse={lane,x:e.clientX,y:e.clientY,left:lane.scrollLeft,index:catalogIndex(lane)};
 },true);
 document.addEventListener('pointerup',e=>{
   if(e.pointerType!=='mouse')return;
   const g=mouse;mouse=null;complete(g,e.clientX,e.clientY);
 },true);
 document.addEventListener('pointercancel',()=>{mouse=null},true);
 document.addEventListener('click',e=>{
   if(Date.now()>suppressUntil||!suppressLane||!suppressLane.contains(e.target)||onButton(e.target))return;
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 },true);
 document.addEventListener('keydown',e=>{
   if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
   const lane=getLane(e.target);
   if(!lane||e.target!==lane)return;
   e.preventDefault();go(lane,e.key==='ArrowRight'?1:-1,catalogIndex(lane));
 },true);
})();
