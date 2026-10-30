(function(){
"use strict";

const SHIPA_ADDITIONAL_TRANSLATIONS = [
  ["Парная","Бу бөлмесі"],
  ["дровяная печь, липа и кедр","Отын пеші, жөке ағашы мен балқарағай"],
  ["Чан","Ыстық чан"],
  ["горячая вода на дровах","Отынмен жылытылған ыстық су"],
  ["Комната отдыха","Демалыс бөлмесі"],
  ["стол, диваны, тишина","Үстел, дивандар және тыныштық"],
  ["Терраса","Терраса"],
  ["своя, закрытая от соседей","Жеке, көршілерден оқшауланған"],
  ["Душ и санузел","Душ және дәретхана"],
  ["в каждом доме","Әр үйде бар"],
  ["Кухонная зона","Асүй аймағы"],
  ["можно заказать стол заранее","Дастарқанға алдын ала тапсырыс беруге болады"],
  ["Комплектация домов отличается - точный состав смотрите на странице дома.","Үйлердің жабдықталуы әртүрлі. Толық тізімді әр үйдің жеке парақшасынан қараңыз."],
  ["SHIPÁ - это тепло без лишнего: свой дом, натуральный материал, тёплый свет и сервис, согласованный заранее","SHIPÁ - артық ештеңесі жоқ жайлылық: жеке үй, табиғи материалдар, жылы жарық және алдын ала келісілген қызмет"],
  ["Дуб, лён, камень и керамика. Ничего искусственного на ощупь.","Емен, зығыр, тас және керамика. Қолға сезілетін жасанды материалдар жоқ."],
  ["2700–3000 K во всех домах. Глаза отдыхают вместе с телом.","Барлық үйлерде жарық температурасы 2700–3000 K. Көзіңіз де денеңізбен бірге тынығады."],
  ["Стол, программа парения и веники согласованы при брони. По приезду - только отдых.","Дастарқан, булау бағдарламасы және монша сыпыртқылары брондау кезінде келісіледі. Келген соң тек демаласыз."],
  ["«Шипа́» по-казахски — восстановление, оздоровление.","«Шипа» қазақ тілінде «сауығу, емделу» дегенді білдіреді."],
];
const translations = new Map([
["Настоящие впечатления тех, кто уже побывал в SHIPÁ","\u0053\u0048\u0049\u0050\u00c1-\u0493\u0430 \u043a\u0435\u043b\u0433\u0435\u043d \u049b\u043e\u043d\u0430\u049b\u0442\u0430\u0440\u0434\u044b\u04a3 \u0448\u044b\u043d\u0430\u0439\u044b \u04d9\u0441\u0435\u0440\u043b\u0435\u0440\u0456"],
["Восточный стол накрываем к вашему приезду: горячий бешбармак, шашлык на углях, баурсаки с мёдом и травяной чай из самовара.","\u041a\u0435\u043b\u0443\u0456\u04a3\u0456\u0437\u0433\u0435 \u0448\u044b\u0493\u044b\u0441 \u0434\u0430\u0441\u0442\u0430\u0440\u049b\u0430\u043d\u044b\u043d \u0434\u0430\u0439\u044b\u043d\u0434\u0430\u0439\u043c\u044b\u0437: \u044b\u0441\u0442\u044b\u049b \u0431\u0435\u0441\u0431\u0430\u0440\u043c\u0430\u049b, \u043a\u04e9\u043c\u0456\u0440\u0434\u0435 \u043f\u0456\u0441\u043a\u0435\u043d \u043a\u04d9\u0443\u0430\u043f, \u0431\u0430\u043b \u049b\u043e\u0441\u044b\u043b\u0493\u0430\u043d \u0431\u0430\u0443\u044b\u0440\u0441\u0430\u049b \u0436\u04d9\u043d\u0435 \u0441\u0430\u043c\u0430\u0443\u044b\u0440\u043d\u0430\u043d \u0448\u04e9\u043f \u0448\u0430\u0439\u044b."],
["Ни спешки, ни посторонних. Только вы, пар, вода и тишина.","\u0410\u0441\u044b\u0493\u044b\u0441\u0442\u044b\u049b \u0442\u0430, \u0431\u04e9\u0433\u0434\u0435 \u0430\u0434\u0430\u043c\u0434\u0430\u0440 \u0434\u0430 \u0436\u043e\u049b. \u0422\u0435\u043a \u0441\u0456\u0437, \u0431\u0443, \u0441\u0443 \u0436\u04d9\u043d\u0435 \u0442\u044b\u043d\u044b\u0448\u0442\u044b\u049b."],
["«Шипа́» по-казахски — восстановление, оздоровление.","\u00ab\u0428\u0438\u043f\u0430\u00bb \u049b\u0430\u0437\u0430\u049b \u0442\u0456\u043b\u0456\u043d\u0434\u0435 \u00ab\u0441\u0430\u0443\u044b\u0493\u0443, \u0435\u043c\u0434\u0435\u043b\u0443\u00bb \u0434\u0435\u0433\u0435\u043d\u0434\u0456 \u0431\u0456\u043b\u0434\u0456\u0440\u0435\u0434\u0456."],
["Буква S","S \u04d9\u0440\u043f\u0456"],
["Линия пара","\u0411\u0443 \u0441\u044b\u0437\u044b\u0493\u044b"],
["Два дубовых листа","\u0415\u043a\u0456 \u0435\u043c\u0435\u043d \u0436\u0430\u043f\u044b\u0440\u0430\u0493\u044b"],
["Банный веник","\u041c\u043e\u043d\u0448\u0430 \u0441\u044b\u043f\u044b\u0440\u0442\u049b\u044b\u0441\u044b"],
["Завиток над A","A \u04d9\u0440\u043f\u0456\u043d\u0456\u04a3 \u04af\u0441\u0442\u0456\u043d\u0434\u0435\u0433\u0456 \u0438\u0456\u0440\u0456\u043c"],
["Тепло","\u0416\u044b\u043b\u0443"],
["За сколько нужно бронировать?","\u049a\u0430\u043d\u0448\u0430 \u0443\u0430\u049b\u044b\u0442 \u0431\u04b1\u0440\u044b\u043d \u0431\u0440\u043e\u043d\u0434\u0430\u0443 \u049b\u0430\u0436\u0435\u0442?"],
["Что взять с собой?","\u04e8\u0437\u0456\u043c\u0435\u043d \u043d\u0435 \u0430\u043b\u0443 \u043a\u0435\u0440\u0435\u043a?"],
["Во сколько можно приехать?","\u049a\u0430\u0439 \u0443\u0430\u049b\u044b\u0442\u0442\u0430 \u043a\u0435\u043b\u0443\u0433\u0435 \u0431\u043e\u043b\u0430\u0434\u044b?"],
["Есть ли предоплата?","\u0410\u043b\u0434\u044b\u043d \u0430\u043b\u0430 \u0442\u04e9\u043b\u0435\u043c \u0431\u0430\u0440 \u043c\u0430?"],
["Можно ли отменить или перенести?","\u0411\u0440\u043e\u043d\u0434\u0430\u0443\u0434\u044b \u0431\u043e\u043b\u0434\u044b\u0440\u043c\u0430\u0443\u0493\u0430 \u043d\u0435\u043c\u0435\u0441\u0435 \u0430\u0443\u044b\u0441\u0442\u044b\u0440\u0443\u0493\u0430 \u0431\u043e\u043b\u0430 \u043c\u0430?"],
["Что если мы опоздали?","\u041a\u0435\u0448\u0456\u0433\u0456\u043f \u049b\u0430\u043b\u0441\u0430\u049b \u043d\u0435 \u0431\u043e\u043b\u0430\u0434\u044b?"],
["Можно ли продлить на месте?","\u041e\u0440\u043d\u044b\u043d\u0434\u0430 \u0443\u0430\u049b\u044b\u0442\u0442\u044b \u04b1\u0437\u0430\u0440\u0442\u0443\u0493\u0430 \u0431\u043e\u043b\u0430 \u043c\u0430?"]
]);

for(const [ru,kz] of SHIPA_ADDITIONAL_TRANSLATIONS){
  translations.set(ru,kz);
}
let current="RU";
try{
  current=localStorage.getItem("shipa-lang")==="KZ"?"KZ":"RU";
}catch(e){}

const originals=new WeakMap();

function translateNode(node){
  if(!node.parentElement)return;
  if(["SCRIPT","STYLE","TEXTAREA"].includes(node.parentElement.tagName))return;

  let value=node.nodeValue;
  let saved=originals.get(node);

  if(!saved||saved.last!==value){
    saved={original:value,last:value};
  }

  const original=saved.original;
  const trimmed=original.trim();

  let next=original;
  if(current==="KZ"&&translations.has(trimmed)){
    next=original.replace(trimmed,translations.get(trimmed));
  }

  saved.last=next;
  originals.set(node,saved);

  if(value!==next)node.nodeValue=next;
}

function scan(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode())translateNode(walker.currentNode);
}

let scanning=false;

function apply(){
  if(scanning)return;
  scanning=true;
  try{scan()}finally{scanning=false}
}

function setLanguage(value){
  if(value!=="RU"&&value!=="KZ")return;
  current=value;
  try{localStorage.setItem("shipa-lang",value)}catch(e){}
  apply();
}

function start(){
  apply();

  const observer=new MutationObserver(()=>{
    if(!scanning)apply();
  });

  observer.observe(document.body,{
    childList:true,
    subtree:true,
    characterData:true
  });

  document.addEventListener("click",function(e){
    const button=e.target.closest&&e.target.closest("button");
    if(!button)return;

    const text=(button.textContent||"").trim();
    if(text==="RU"||text==="KZ"){
      setTimeout(()=>setLanguage(text),0);
    }
  },true);
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",start);
}else start();

window.ShipaExtraLocale={set:setLanguage};
})();