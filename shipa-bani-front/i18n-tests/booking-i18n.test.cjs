const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '..');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(base,'shipa-booking-i18n.js'),'utf8'), context);
const {translate:t,view,staticText} = context.window.ShipaBookingI18n;
const cases = [
  ['Свободно на вторник, 27 · 6 гостей','27-сі, сейсенбі күні бос · 6 қонақ'],
  ['4 дома · нажмите на дом, чтобы выбрать время','4 үй · уақытты таңдау үшін үйді басыңыз'],
  ['Свободно: весь день','Бос: күні бойы'],
  ['Свободно: 10:00–21:00','Бос уақыт: 10:00–21:00'],
  ['На эту дату нет подходящего окна','Бұл күні сәйкес бос уақыт жоқ'],
  ['Октябрь 2026','Қазан 2026'],
  ['Бронь открыта на год вперёд. Зачёркнутые дни заняты полностью.','Бір жыл алға брондауға болады. Сызылған күндерде бос орын жоқ.'],
  ['В большинстве домов до 6 гостей — в цене, дальше от 5 000 ₸ за гостя за визит','Көптеген үйлерде 6 қонаққа дейін бағаға кіреді, одан кейін әр қосымша қонақ үшін 5 000 ₸ бастап (бір келуге)'],
  ['По часам','Сағат бойынша'],
  ['Сутки','Тәулік'],
  ['3 часа','3 сағат'],
  ['Минимум 3 часа, по часам — до 02:00.','Ең азы 3 сағат, сағаттық брондау 02:00-ге дейін.'],
  ['Пн–чт дешевле на 15%','Дүйсенбі–бейсенбі күндері 15% жеңілдік'],
  ['Вторник, 27 октября 2026','сейсенбі, 27 қазан 2026'],
  ['до 6 гостей в цене · максимум 12','6 қонаққа дейін бағаға кіреді · ең көбі 12'],
  ['7 гостей · 3 часа · 134 500 ₸','7 қонақ · 3 сағат · 134 500 ₸'],
  ['Накрыть стол к приезду','Келгеніңізге дастарқан әзірлеу'],
  ['Как с вами связаться?','Сізбен қалай байланысамыз?'],
  ['С возвращением,','Қайта қош келдіңіз,'],
  ['Предоплата','Алдын ала төлем'],
  ['Перейти к предоплате','Алдын ала төлемге өту'],
  ['Зачёркнутые дни заняты полностью.','Сызылған күндерде бос орын жоқ.'],
];
for (const [src,want] of cases) test(src,()=>assert.equal(t(src),want));

test('data-view translates calendar, cards and does not change underlying booking state or action handlers',()=>{
 const bk={houseId:'h2',date:0,guests:6,phone:'+7 700 123 45 67'};
 const call=()=>4;
 const source={weekTitle:'Октябрь 2026',step2Title:'Свободно на вторник, 27 · 6 гостей',step2Houses:[{note:'Свободно: 10:00–21:00',btnLabel:'Выбрать время',select:call,style:'width:123px',id:'h1',priceText:'от 25 000 ₸/час'}],bk,monthDays:[{day:27,aria:'27: занят'}]};
 const translated=view(source);
 assert.equal(translated.weekTitle,'Қазан 2026');
 assert.equal(translated.step2Title,'27-сі, сейсенбі күні бос · 6 қонақ');
 assert.equal(translated.step2Houses[0].note,'Бос уақыт: 10:00–21:00');
 assert.equal(translated.step2Houses[0].btnLabel,'Уақытты таңдау');
 assert.equal(translated.step2Houses[0].select,call);
 assert.equal(translated.step2Houses[0].style,'width:123px');
 assert.equal(translated.bk,bk);
 assert.equal(translated.monthDays[0].day,27);
 assert.equal(source.step2Title,'Свободно на вторник, 27 · 6 гостей');
});
test('visible booking string static dictionary covers all screenshot sections',()=>{
 for(const key of ['Дата','Гостей','Дети до 7 лет не считаются','По часам','Сутки','Свободно','Занято','мало времени','Как с вами связаться?','Имя','Телефон','Бронь подтверждается предоплатой','Согласен с','правилами бронирования'])
  assert.ok(staticText[key],key);
});
test('integration: loader order + dynamic B translation call + explicit consent checkboxes',()=>{
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 assert.ok(html.indexOf('shipa-booking-i18n.js')<html.indexOf('shipa-ru-kz.js'));
 assert.ok(html.includes('window.ShipaBookingI18n.view(B)'));
 assert.ok(html.includes('id="bk-agree"'));
 assert.ok(html.includes('id="bk-privacy"'));
 assert.ok(html.includes('href="{{ legalConsentUrl }}" target="_blank"'));
});

test('regression: screenshot — programme details and daily booking strings fully translate', () => {
 const checks = [
  ['Можно выбрать несколько. Время мастера подтвердит администратор.','Бірнеше бағдарламаны таңдауға болады. Шебердің уақытын әкімші растайды.'],
  ['ДОБАВИТЬ К БРОНИ','БРОНДАУҒА ҚОСУ'],
  ['Ср 28 окт · выберите дату заезда','Ср 28 қаз · келу күнін таңдаңыз'],
  ['На 28 октября сутки заняты — выберите другую дату заезда','28 қазан күні тәулікке брондау мүмкін емес. Басқа келу күнін таңдаңыз.'],
  ['Парение: Массаж и уход','Бағдарлама: Уқалау және күтім'],
  ['Парение: Классическое парение, Массаж и уход','Бағдарлама: Классикалық булау, Уқалау және күтім'],
  ['окт','қаз'], ['ноя','қар'],
  ['1 час · 20 000 ₸','1 сағат · 20 000 ₸'],
  ['2 часа · 32 000 ₸','2 сағат · 32 000 ₸'],
 ];
 for(const [ru,kz] of checks) assert.equal(t(ru),kz,ru);
});

test('regression: dynamic booking model KZ programme content is not re-Russified',()=>{
 const src={progSheet:{intro:'Бірнеше бағдарламаны таңдауға болады. Шебердің уақытын әкімші растайды.',list:[{name:'Уқалау және күтім',meta:'1 сағат · 20 000 ₸',desc:'Демалыс бөлмесінде жылы маймен денені уқалау және тұз бен балдан жасалған скрабпен күтім жасау.',whoLabel:'Кімге арналған:',who:'Булаудан кейін',inclLabel:'Құрамына кіреді:',incl:'Жылы май, Сүлгілер, Шай',contraLabel:'Қарсы көрсетілімдер:',contraText:'Жүктілік, жоғары қан қысымы, жедел қабыну және дене қызуының көтерілуі.'}]},dayStrip:[{wd:'ср',mon:'окт'}],panelLine:'Ср 28 окт · выберите дату заезда'};
 const out=view(src);
 assert.equal(out.progSheet.intro,src.progSheet.intro);
 assert.equal(out.progSheet.list[0].incl,'Жылы май, Сүлгілер, Шай');
 assert.equal(out.progSheet.list[0].desc,src.progSheet.list[0].desc);
 assert.equal(out.progSheet.list[0].contraText,src.progSheet.list[0].contraText);
 assert.equal(out.dayStrip[0].mon,'қаз');
 assert.equal(out.panelLine,'Ср 28 қаз · келу күнін таңдаңыз');
});

test('regression: programme translations happen on individual data fields',()=>{
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 for(const frag of [
  '{{ progSheet.intro }}', '{{ p.whoLabel }}', '{{ p.inclLabel }}',
  '{{ p.contraLabel }}', '{{ p.contraText }}',
  'meta:`${svcText(p.dur,s.lang)} · ${fmt(p.price)}`',
  'desc:svcText(p.desc,s.lang)',
  "incl:p.incl.map(t=>svcText(t,s.lang)).join(', ')",
  "contraText:s.lang==='KZ'",
  "name:svcText(p.name,s.lang)",
  "s.lang==='KZ'?'Бағдарлама: '",
 ]) assert.ok(html.includes(frag),frag);
});
