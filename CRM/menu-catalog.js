/* Shared catalog for the CRM editor and the electronic menu. */
(() => {
'use strict';
// Порядок подкатегорий = порядок секций и чипов. chip — к какому чипу относится секция.
const BASE_SECTIONS=[
 {id:'starters',cat:'kitchen',name:['Закуски','Тіскебасар','Starters']},
 {id:'salads',cat:'kitchen',name:['Салаты','Салаттар','Salads']},
 {id:'mains',cat:'kitchen',name:['Горячее','Ыстық тағамдар','Mains']},
 {id:'desserts',cat:'kitchen',name:['Десерты','Тәттілер','Desserts']},
 {id:'tea',cat:'drinks',name:['Чайная карта','Шай картасы','Tea list']},
 {id:'drinks',cat:'drinks',name:['Напитки','Сусындар','Drinks']},
 {id:'steam',cat:'steam',name:['Парение и уход','Бу мен күтім','Steam & care'],note:'steamRequest',kind:'steam'},
 {id:'rent',cat:'merch',name:['Аренда','Жалға','Rent'],note:'kitNote',kind:'rent'},
 {id:'buy',cat:'merch',name:['Купить','Сатып алу','Buy'],kind:'buy'},
 {id:'take',cat:'merch',name:['SHIPÁ с собой','SHIPÁ-ны бірге ал','Take SHIPÁ home'],kind:'buy',chip:'buy'}];
const D0=['','',''];

// Цены с пометкой [уточнить] в ТЗ — временные
const IT=(id,sub,price,name,desc,o={})=>({id,sub,price,name,desc:desc||D0,...o});
const BASE_ITEMS=[
 IT('pickles','starters',6000,['Сет солений','Тұздық сеті','Pickle platter'],['огурцы, капуста, чеснок, черемша','қияр, қырыққабат, сарымсақ, жабайы сарымсақ','cucumbers, cabbage, garlic, wild garlic'],{photo:'Фото: соленья в керамических плошках'}),
 IT('kazy','starters',14000,['Казы и жая','Қазы мен жая','Kazy & zhaya'],['домашние конские деликатесы, лук, хлеб','үйде жасалған жылқы етінен дәмдер, пияз, нан','house-made horse-meat delicacies, onion, bread'],{photo:'Фото: казы и жая нарезкой на доске'}),
 IT('veg','starters',7500,['Овощи с дымком','Көмірде піскен көкөністер','Smoky grilled vegetables'],['баклажан, перец, томаты, зелень','баклажан, бұрыш, қызанақ, көк шөп','aubergine, peppers, tomatoes, herbs'],{photo:'Фото: овощи с углей на чугунной сковороде'}),
 IT('vegsalad','salads',4500,['Салат из свежих овощей','Жаңа көкөніс салаты','Fresh vegetable salad'],['огурцы, томаты, редис, зелень, масло','қияр, қызанақ, шомыр, көк шөп, май','cucumbers, tomatoes, radish, herbs, oil'],{photo:'Фото: салат из свежих овощей'}),
 IT('achichuk','salads',3500,['Ачичук','Ачичук','Achichuk'],['томаты, лук, острый перец, зелень','қызанақ, пияз, ащы бұрыш, көк шөп','tomatoes, onion, hot pepper, herbs'],{photo:'Фото: ачичук'}),
 IT('kazysalad','salads',5500,['Салат с казы','Қазы салаты','Kazy salad'],['казы, картофель, огурец, яйцо, зелень','қазы, картоп, қияр, жұмыртқа, көк шөп','kazy, potato, cucumber, egg, herbs'],{photo:'Фото: салат с казы'}),
 IT('beefsalad','salads',6500,['Тёплый салат с говядиной','Сиыр етінен жылы салат','Warm beef salad'],['говядина, баклажан, томаты, кинза','сиыр еті, баклажан, қызанақ, кинза','beef, aubergine, tomatoes, coriander'],{photo:'Фото: тёплый салат с говядиной'}),
 IT('besh','mains',32000,['Бешбармак','Бесбармақ','Beshbarmak'],['конина и баранина, тесто, сорпа, на 4–6 человек','жылқы және қой еті, қамыр, сорпа, 4–6 адамға','horse meat & lamb, hand-cut noodles, sorpa broth, serves 4–6'],{photo:'Фото: бешбармак на большом блюде',badge:'serves'}),
 IT('shashlik','mains',24000,['Шашлык из баранины','Қой етінен шашлык','Lamb shashlik'],['корейка, лук и лаваш','қабырға, пияз бен лаваш','rack of lamb, onion & lavash'],{photo:'Фото: шашлык из баранины на шампурах'}),
 IT('zander','mains',18000,['Судак на углях','Көмірде піскен көксерке','Charcoal-grilled zander'],['целиком, лимон, травы','тұтас, лимон, шөптер','whole, lemon, herbs'],{photo:'Фото: судак целиком с лимоном'}),
 IT('plov','mains',30000,['Узбекский плов','Өзбек палауы','Uzbek plov'],['рис девзира, баранина, нут, на 4–6 человек','девзира күріші, қой еті, ноқат, 4–6 адамға','devzira rice, lamb, chickpeas, serves 4–6'],{photo:'Фото: плов в казане',badge:'serves'}),
 IT('medovik','desserts',9000,['Медовик','Бал торты','Honey cake'],['сметанный крем, на компанию','қаймақ кремі, компанияға','sour-cream frosting, for sharing'],{photo:'Фото: медовик целиком на блюде',badge:'group'}),
 IT('baursak','desserts',3500,['Баурсаки с мёдом','Балмен бауырсақ','Baursaks with honey'],['горячие','ыстық','warm'],{photo:'Фото: баурсаки в миске, мёд рядом'}),
 IT('fruit','desserts',8000,['Сезонные фрукты','Маусымдық жемістер','Seasonal fruit'],['тарелка на 6 гостей','6 қонаққа арналған табақ','platter for 6'],{photo:'Фото: тарелка сезонных фруктов'}),
 IT('steppe','tea',4500,['Степной сбор','Дала жинағы','Steppe blend'],['чабрец, душица, зверобой','жебіршөп, киікоты, шайқурай',"thyme, oregano, St John's wort"],{photo:'Фото: чайник со степными травами'}),
 IT('ivan','tea',4800,['Иван-чай с облепихой','Шырғанақ қосылған Иван-шай','Fireweed tea with sea buckthorn'],['ферментированный, мёд отдельно','ашытылған, бал бөлек','fermented, honey on the side'],{photo:'Фото: иван-чай и облепиха в стеклянном чайнике'}),
 IT('puer','tea',6500,['Пуэр шу 2018','Шу пуэр 2018','Shu Puerh 2018'],['заваривание проливом, 6 проливов','құйып демдеу, 6 рет','gongfu brewing, 6 infusions'],{photo:'Фото: пуэр, гайвань и пиалы'}),
 IT('samovar','tea',8000,['Чай из самовара','Самаурын шайы','Samovar tea'],['травы, мёд, варенье, на компанию','шөптер, бал, тосап, компанияға','herbs, honey, jam, for sharing'],{photo:'Фото: самовар, мёд и варенье',badge:'group'}),
 IT('mors','drinks',2500,['Облепиховый морс','Шырғанақ морсы','Sea buckthorn mors'],D0,{photo:'Фото: кувшин облепихового морса'}),
 IT('kvass','drinks',2000,['Домашний квас','Үй квасы','Homemade kvass'],D0,{photo:'Фото: квас в стеклянном кувшине'}),
 IT('lemonade','drinks',3000,['Лимонад ананас-лайм','Ананас-лайм лимонады','Pineapple-lime lemonade'],['ананас, лайм, мята, газированный','ананас, лайм, жалбыз, газдалған','pineapple, lime, mint, sparkling'],{photo:'Фото: лимонад с лаймом и мятой'}),
 IT('cucumber','drinks',2500,['Огуречный смузи','Қияр смузиі','Cucumber smoothie'],['огурец, яблоко, киви, шпинат','қияр, алма, киви, шпинат','cucumber, apple, kiwi, spinach'],{photo:'Фото: зелёный смузи в стакане'}),
 IT('cherry','drinks',2500,['Смузи вишня-банан','Шие-банан смузиі','Cherry-banana smoothie'],D0,{photo:'Фото: вишнёвый смузи в стакане'}),
 IT('kumys','drinks',2000,['Кумыс','Қымыз','Kumys'],['','',"fermented mare's milk"],{photo:'Фото: кумыс в пиале'}),
 IT('water','drinks',800,['Вода минеральная','Минералды су','Mineral water'],D0,{photo:'Фото: бутылка минеральной воды'}),
 IT('classic','steam',25000,['Классическое парение','Классикалық бу','Classic steam session'],['для тех, кто впервые','алғаш келгендерге','for first-timers'],{img:'assets/h2_acc.png',photo:'Фото: мастер с берёзовым веником в пару',dur:['1,5 ч','1,5 сағ','1.5 h'],
   long:['Прогрев, два захода с веником, отдых с чаем. Темп — по самочувствию.','Қыздыру, веникпен екі рет кіру, шаймен демалыс. Қарқыны — көңіл-күйіңізге қарай.','Warm-up, two rounds with a besom, rest with tea. The pace follows how you feel.'],
   steps:[['Прогрев','Қыздыру','Warm-up',15],['Первый заход с веником','Веникпен алғашқы кіру','First round with a besom',20],['Чан','Шан','Hot tub',10],['Второй заход','Екінші кіру','Second round',20],['Чай и отдых','Шай және демалыс','Tea and rest',25]],
   incl:[['Берёзовый и дубовый веники','Қайың және емен веник','Birch and oak besoms'],['Травяной настой для пара','Буға арналған шөп тұнбасы','Herbal infusion for the steam'],['Чай после парной','Будан кейін шай','Tea after the steam room'],['Полотенца и простыни','Сүлгілер мен жаймалар','Towels and sheets']]}),
 IT('herbal','steam',28000,['Травяное парение','Шөппен бу','Herbal steam session'],['для спокойного вечера','тыныш кешке','for a calm evening'],{img:'assets/h8_acc.png',photo:'Фото: веник и травы в запарнике',dur:['1,5 ч','1,5 сағ','1.5 h'],
   long:['Настой степных трав, мягкий пар, медленный ритм. После — чай из тех же трав.','Дала шөптерінің тұнбасы, жұмсақ бу, баяу ырғақ. Соңында — сол шөптерден шай.','Steppe herb infusion, soft steam, slow rhythm. Afterwards, tea from the same herbs.'],
   steps:[['Прогрев','Қыздыру','Warm-up',15],['Запарка трав, первый заход','Шөп демдеу, алғашқы кіру','Herbs steeped, first round',25],['Отдых','Демалыс','Rest',10],['Второй заход','Екінші кіру','Second round',20],['Чай из тех же трав','Сол шөптерден шай','Tea from the same herbs',20]],
   incl:[['Сбор степных трав','Дала шөптерінің жинағы','Steppe herb blend'],['Дубовый веник','Емен веник','Oak besom'],['Травяной чай','Шөп шайы','Herbal tea'],['Полотенца и простыни','Сүлгілер мен жаймалар','Towels and sheets']]}),
 IT('conifer','steam',32000,['Хвойное парение с контрастом','Қылқан жапырақты контрастты бу','Conifer steam with contrast'],['для восстановления сил','күш жинау үшін','to recharge'],{img:'assets/h5_acc.png',photo:'Фото: хвойный веник, чан с паром на улице',dur:['2 ч','2 сағ','2 h'],demoUn:true,
   long:['Кедровый и дубовый веник, три захода, охлаждение в чане между ними.','Балқарағай мен емен веник, үш рет кіру, арасында шанда салқындау.','Cedar and oak besoms, three rounds, cooling off in the tub between them.'],
   steps:[['Прогрев','Қыздыру','Warm-up',15],['Заход с кедровым веником','Балқарағай веникпен кіру','Round with a cedar besom',20],['Чан','Шан','Hot tub',10],['Второй заход','Екінші кіру','Second round',20],['Чан','Шан','Hot tub',10],['Третий заход','Үшінші кіру','Third round',20],['Чай и отдых','Шай және демалыс','Tea and rest',25]],
   incl:[['Кедровый и дубовый веники','Балқарағай және емен веник','Cedar and oak besoms'],['Горячий чан','Ыстық шан','Hot tub'],['Чай после парной','Будан кейін шай','Tea after the steam room'],['Полотенца и простыни','Сүлгілер мен жаймалар','Towels and sheets']]}),
 IT('soft','steam',28000,['Мягкое расслабляющее','Жұмсақ релакс-бу','Gentle relaxing steam'],['для пары','жұпқа','for couples'],{img:'assets/h1_acc.png',photo:'Фото: приглушённый свет, мягкий пар',dur:['1,5 ч','1,5 сағ','1.5 h'],
   long:['Низкая температура, ароматы лаванды и сандала, без резких контрастов.','Төмен температура, лаванда мен сандал хош иісі, күрт контрастсыз.','Low heat, lavender and sandalwood, no sharp contrasts.'],
   steps:[['Мягкий прогрев','Жұмсақ қыздыру','Gentle warm-up',20],['Заход без веника, ароматы','Вениксіз кіру, хош иістер','Round without a besom, aromas',20],['Отдых','Демалыс','Rest',15],['Второй заход','Екінші кіру','Second round',20],['Чай и отдых','Шай және демалыс','Tea and rest',15]],
   incl:[['Масла лаванды и сандала','Лаванда мен сандал майлары','Lavender and sandalwood oils'],['Чай','Шай','Tea'],['Полотенца и простыни','Сүлгілер мен жаймалар','Towels and sheets']]}),
 IT('massage','steam',20000,['Массаж и уход','Массаж және күтім','Massage & care'],['после парения','будан кейін','after steam'],{img:'assets/h6_acc.png',photo:'Фото: руки мастера, масло, тёплый свет',dur:['1 ч','1 сағ','1 h'],
   long:['Массаж тёплым маслом, скраб на основе соли и мёда. В комнате отдыха.','Жылы маймен массаж, тұз бен бал негізіндегі скраб. Демалыс бөлмесінде.','Warm-oil massage and a salt-and-honey scrub, in the lounge.'],
   steps:[['Разогрев мышц','Бұлшықетті қыздыру','Muscle warm-up',10],['Спина и плечи','Арқа мен иық','Back and shoulders',30],['Ноги','Аяқ','Legs',15],['Отдых и чай','Демалыс және шай','Rest and tea',5]],
   incl:[['Тёплое масло','Жылы май','Warm oil'],['Полотенца','Сүлгілер','Towels'],['Чай','Шай','Tea']]}),
 IT('tub','steam',15000,['Горячий чан','Ыстық шан','Hot tub'],['разогреем на дровах к нужному времени','қажет уақытқа отынмен қыздырамыз','wood-fired, heated for the time you choose'],{img:'assets/h1_int.png',photo:'Фото: горячий чан с паром',tubOnly:true}),
 IT('robe','rent',3000,['Халат','Халат','Bathrobe'],D0,{photo:'Фото: халат на крючке, мягкий свет'}),
 IT('r_towel','rent',1500,['Большое полотенце','Үлкен сүлгі','Large towel'],D0,{photo:'Фото: стопка больших полотенец',pair:'t_towel'}),
 IT('sheet','rent',1500,['Простыня для парной','Бу бөлмесіне арналған жайма','Sauna sheet'],D0,{photo:'Фото: льняная простыня на полке парной'}),
 IT('r_hat','rent',1500,['Банная шапка, войлок','Киіз монша қалпағы','Felt sauna hat'],D0,{photo:'Фото: войлочная шапка на деревянной полке, мягкий тёплый свет',pair:'t_hat'}),
 IT('r_turban','rent',1500,['Тюрбан','Тюрбан','Hair turban'],D0,{photo:'Фото: тюрбан на полке',pair:'t_turban'}),
 IT('kilt','rent',2000,['Килт (парео)','Килт (парео)','Sauna kilt'],D0,{photo:'Фото: килт на крючке'}),
 IT('slippers','buy',500,['Тапочки одноразовые','Бір реттік тәпішке','Disposable slippers'],D0,{photo:'Фото: пара одноразовых тапочек'}),
 IT('oak','buy',3500,['Дубовый веник','Емен веник','Oak besom'],D0,{photo:'Фото: дубовый веник на скамье'}),
 IT('birch','buy',3000,['Берёзовый веник','Қайың веник','Birch besom'],D0,{photo:'Фото: берёзовый веник в тазу'}),
 IT('eucalyptus','buy',4500,['Эвкалиптовый веник','Эвкалипт веник','Eucalyptus besom'],D0,{photo:'Фото: эвкалиптовый веник'}),
 IT('oil','buy',4500,['Масло для парения','Буға арналған май','Steam oil'],['эвкалипт / кедр / лаванда','эвкалипт / балқарағай / лаванда','eucalyptus / cedar / lavender'],{photo:'Фото: три флакона масла для парения'}),
 IT('herbs','buy',2500,['Травяной сбор для запарки','Буға арналған шөп жинағы','Herbal steam blend'],D0,{photo:'Фото: сухие травы в льняном мешочке'}),
 IT('scrub','buy',4000,['Скраб соль и мёд','Тұз бен бал скрабы','Salt & honey scrub'],D0,{photo:'Фото: баночка скраба, соль и мёд'}),
 IT('kit','buy',2000,['Мини-набор','Шағын жинақ','Toiletry kit'],['шампунь, гель, бальзам','сусабын, гель, бальзам','shampoo, gel, conditioner'],{photo:'Фото: три мини-флакона'}),
 IT('cloth','buy',500,['Мочалка одноразовая','Бір реттік жөке','Disposable washcloth'],D0,{photo:'Фото: мочалка в упаковке'}),
 IT('t_towel','take',12000,['Полотенце SHIPÁ','SHIPÁ сүлгісі','SHIPÁ towel'],D0,{img:'assets/h3_acc.png',photo:'Фото: полотенце SHIPÁ',pair:'r_towel'}),
 IT('t_hat','take',6000,['Банная шапка SHIPÁ','SHIPÁ монша қалпағы','SHIPÁ sauna hat'],D0,{img:'assets/h7_acc.png',photo:'Фото: шапка SHIPÁ',pair:'r_hat'}),
 IT('t_turban','take',7000,['Тюрбан SHIPÁ','SHIPÁ тюрбаны','SHIPÁ turban'],D0,{img:'assets/h4_acc.png',photo:'Фото: тюрбан SHIPÁ',pair:'r_turban'}),
 IT('mug','take',5000,['Кружка SHIPÁ','SHIPÁ саптыаяғы','SHIPÁ mug'],D0,{photo:'Фото: кружка SHIPÁ с чаем на деревянном столе'})];
// Approximate portion values are indicative until confirmed by the kitchen.
// One explicit portion record for every kitchen and drinks item (25/25).
// Values with ≈ are estimates pending confirmation by the kitchen.
// Actual values for meat shashlik and specified drink volumes are from the source menu.
const PORTION_BY_ID = {
  pickles: ['Вес: ≈ 350 г', 'Салмағы: ≈ 350 г'],
  kazy: ['Вес: ≈ 350 г', 'Салмағы: ≈ 350 г'],
  veg: ['Вес: ≈ 350 г', 'Салмағы: ≈ 350 г'],
  vegsalad: ['Вес: ≈ 250 г', 'Салмағы: ≈ 250 г'],
  achichuk: ['Вес: ≈ 250 г', 'Салмағы: ≈ 250 г'],
  kazysalad: ['Вес: ≈ 250 г', 'Салмағы: ≈ 250 г'],
  beefsalad: ['Вес: ≈ 280 г', 'Салмағы: ≈ 280 г'],
  besh: ['Вес: ≈ 2 500 г · на 4–6 человек', 'Салмағы: ≈ 2 500 г · 4–6 адамға'],
  shashlik: ['Вес: 1 000 г', 'Салмағы: 1 000 г'],
  zander: ['Вес: ≈ 800 г', 'Салмағы: ≈ 800 г'],
  plov: ['Вес: ≈ 2 000 г · на 4–6 человек', 'Салмағы: ≈ 2 000 г · 4–6 адамға'],
  medovik: ['Вес: ≈ 900 г', 'Салмағы: ≈ 900 г'],
  baursak: ['Вес: ≈ 450 г', 'Салмағы: ≈ 450 г'],
  fruit: ['Вес: ≈ 1 200 г · на 6 человек', 'Салмағы: ≈ 1 200 г · 6 адамға'],
  steppe: ['Объём: 800 мл', 'Көлемі: 800 мл'],
  ivan: ['Объём: 800 мл', 'Көлемі: 800 мл'],
  puer: ['Объём: ≈ 600 мл', 'Көлемі: ≈ 600 мл'],
  samovar: ['Объём: ≈ 2 000 мл', 'Көлемі: ≈ 2 000 мл'],
  mors: ['Объём: 1 000 мл', 'Көлемі: 1 000 мл'],
  kvass: ['Объём: 1 000 мл', 'Көлемі: 1 000 мл'],
  lemonade: ['Объём: ≈ 400 мл', 'Көлемі: ≈ 400 мл'],
  cucumber: ['Объём: ≈ 350 мл', 'Көлемі: ≈ 350 мл'],
  cherry: ['Объём: ≈ 350 мл', 'Көлемі: ≈ 350 мл'],
  kumys: ['Объём: 500 мл', 'Көлемі: 500 мл'],
  water: ['Объём: 500 мл', 'Көлемі: 500 мл']
};
// Фото позиций: положите файл в assets/menu/{id}.webp и добавьте id сюда. Без фото показывается знак SHIPÁ.
const MENU_PHOTOS=["achichuk","baursak","beefsalad","besh","birch","cherry","cloth","cucumber","eucalyptus","fruit","herbs","ivan","kazy","kazysalad","kilt","kit","kvass","lemonade","medovik","mors","mug","oak","oil","pickles","plov","puer","r_hat","r_towel","r_turban","robe","samovar","shashlik","sheet","slippers","steppe","veg","vegsalad","water","zander"];
const PHOTO=Object.fromEntries(MENU_PHOTOS.map(id=>[id,'assets/menu/'+id+'.webp']));
BASE_ITEMS.forEach(i=>{if(PHOTO[i.id])i.img=PHOTO[i.id];});
// Временно: фото из референса Coffee BOOM (чужие, в релиз не идут). Чтобы убрать — очистите CB_PHOTO.
const CB_PHOTO={"baursak":"01","kazysalad":"02","beefsalad":"04","veg":"12","vegsalad":"13","zander":"14","shashlik":"15","besh":"17","plov":"18","mors":"07","lemonade":"08","kumys":"09"};BASE_ITEMS.forEach(i=>{if(CB_PHOTO[i.id])i.img='assets/cb/c'+CB_PHOTO[i.id]+'.jpeg';});
const BRAND_PHOTO={kumys:'assets/h6_acc.png',scrub:'assets/h4_acc.png'};BASE_ITEMS.forEach(i=>{if(!i.img&&BRAND_PHOTO[i.id])i.img=BRAND_PHOTO[i.id];});


const PREP={besh:90,plov:90,shashlik:40,zander:40,veg:25,beefsalad:25,vegsalad:15,achichuk:15,kazysalad:15,pickles:15,kazy:15,medovik:10,fruit:10,baursak:20,samovar:20,steppe:10,ivan:10,puer:10};

const EDITABLE = new Set(['kitchen', 'drinks']);
const STORAGE_KEY = 'shipa-menu-editor-v1';
const validId = value => typeof value === 'string' && /^[a-z][a-z0-9_-]{0,79}$/.test(value);
const statuses = new Set(['available', 'stop', 'hidden']);

function readChanges(storage = window.localStorage) {
  const stored = storage.getItem(STORAGE_KEY);
  let data;
  try { data = JSON.parse(stored || '{}'); } catch { data = {}; }
  return {
    sections: Array.isArray(data?.sections) ? data.sections : [],
    items: Array.isArray(data?.items) ? data.items : []
  };
}

function photoPath(value) {
  if (!value) return '';
  if (/^assets\/[a-z0-9/_-]+\.(?:webp|png|jpe?g|avif)$/i.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) {
      return url.href.replace(/[()'"]/g, ch => '%' + ch.charCodeAt(0).toString(16));
    }
  } catch {}
  return '';
}

function localized(values, required = false) {
  const list = [0, 1, 2].map(index => typeof values?.[index] === 'string' ? values[index].trim() : '');
  return list.map((value, index) => value || (required && index ? list[0] : ''));
}

function loadCatalog(storage) {
  let changes;
  try { changes = readChanges(storage); } catch { changes = { sections: [], items: [] }; }
  const sections = new Map(BASE_SECTIONS.map(section => [section.id, { ...section }]));
  for (const change of changes.sections) {
    if (!validId(change?.id) || !EDITABLE.has(change.cat)) continue;
    const original = sections.get(change.id);
    if (original && original.cat !== change.cat) continue;
    const name = localized(change.name, true);
    if (name[0]) sections.set(change.id, { ...original, id: change.id, cat: change.cat, name });
  }
  const items = new Map(BASE_ITEMS.map(item => [item.id, {
    ...item, portion: PORTION_BY_ID[item.id] || [], menuStatus: 'available',
    prep: item.prep ?? PREP[item.id] ?? (sections.get(item.sub)?.cat === 'drinks' ? 5 : 0)
  }]));
  for (const change of changes.items) {
    if (!validId(change?.id) || !EDITABLE.has(sections.get(change.sub)?.cat)) continue;
    const original = items.get(change.id);
    if (original && !EDITABLE.has(sections.get(original.sub)?.cat)) continue;
    const name = localized(change.name, true);
    if (!name[0] || !Number.isSafeInteger(change.price) || change.price < 0 ||
        !Number.isSafeInteger(change.prep) || change.prep < 0 || !statuses.has(change.menuStatus)) continue;
    items.set(change.id, { ...original, id: change.id, sub: change.sub, name,
      desc: localized(change.desc), portion: localized(change.portion), img: photoPath(change.img),
      price: change.price, prep: change.prep, menuEdited: true, menuStatus: change.menuStatus });
  }
  return { sections: [...sections.values()], items: [...items.values()] };
}

function saveRecord(collection, record, storage = window.localStorage) {
  const changes = readChanges(storage);
  const records = changes[collection];
  const index = records.findIndex(item => item?.id === record.id);
  if (index === -1) records.push(record);
  else records[index] = record;
  storage.setItem(STORAGE_KEY, JSON.stringify(changes));
  return loadCatalog(storage);
}

window.ShipaMenuCatalog = { loadCatalog, saveRecord, photoPath, STORAGE_KEY };
})();
