/* Kitchen catalog editor embedded in the CRM. */
(() => {
  'use strict';
  const store = window.ShipaMenuCatalog;
  if (!store) return;

  const labels = {
    title: ['Управление меню', 'Мәзірді басқару'],
    intro: ['Редактируйте блюда и напитки, цены и доступность для гостей.', 'Қонақтарға арналған тағамдар мен сусындарды, бағаларды және қолжетімділікті өңдеңіз.'],
    demo: ['Демо · правки видны в e-menu после обновления страницы в этом браузере.', 'Демо · өзгерістер осы браузерде e-menu бетін жаңартқаннан кейін көрінеді.'],
    open: ['Открыть e-menu', 'e-menu ашу'], add: ['Добавить позицию', 'Позиция қосу'],
    categoryAdd: ['Добавить категорию', 'Санат қосу'], categoryEdit: ['Изменить категорию', 'Санатты өзгерту'],
    category: ['Категория', 'Санат'], group: ['Раздел меню', 'Мәзір бөлімі'],
    kitchen: ['Кухня', 'Ас мәзірі'], drinks: ['Напитки', 'Сусындар'],
    allCategories: ['Все категории', 'Барлық санаттар'], allStatuses: ['Все статусы', 'Барлық күйлер'],
    available: ['В меню', 'Мәзірде'], stop: ['Стоп-лист', 'Тоқтату тізімі'], hidden: ['Скрыто', 'Жасырылған'],
    search: ['Поиск по названию или составу', 'Атауы немесе құрамы бойынша іздеу'],
    empty: ['По этим фильтрам ничего не найдено.', 'Бұл сүзгілер бойынша ештеңе табылмады.'],
    name: ['Название', 'Атауы'], desc: ['Описание и состав', 'Сипаттамасы мен құрамы'],
    portion: ['Порция / объём', 'Порция / көлем'], price: ['Цена, ₸', 'Бағасы, ₸'],
    prep: ['Приготовление, мин', 'Дайындау, мин'], photo: ['Фото (ссылка HTTPS)', 'Фото (HTTPS сілтемесі)'],
    photoError: ['Укажите корректную HTTPS-ссылку на фото.', 'Фотоға жарамды HTTPS сілтемесін енгізіңіз.'],
    status: ['Статус', 'Күйі'], statusHint: ['Стоп-лист оставляет позицию видимой и блокирует заказ. Скрытые позиции исчезают из e-menu.', 'Тоқтату тізіміндегі позиция көрінеді, бірақ тапсырыс берілмейді. Жасырылған позициялар e-menu-де көрсетілмейді.'],
    edit: ['Изменить', 'Өзгерту'], itemEdit: ['Редактирование позиции', 'Позицияны өңдеу'],
    cancel: ['Отмена', 'Бас тарту'], save: ['Сохранить', 'Сақтау'], saved: ['Изменения сохранены.', 'Өзгерістер сақталды.'],
    saveError: ['Не удалось сохранить изменения в браузере.', 'Өзгерістерді браузерде сақтау мүмкін болмады.'],
    translations: ['Переводы KZ / EN', 'KZ / EN аудармалары'], newPhoto: ['Оставьте пустым, чтобы использовать текущую фотографию.', 'Ағымдағы фотосуретті сақтау үшін өрісті бос қалдырыңыз.']
  };
  const langIndex = () => document.documentElement.lang === 'kk' ? 1 : 0;
  const tr = key => labels[key][langIndex()];
  const title = record => record.name[langIndex()] || record.name[0];
  const money = value => new Intl.NumberFormat(langIndex() ? 'kk-KZ' : 'ru-RU').format(value) + ' ₸';
  const allowed = category => category === 'kitchen' || category === 'drinks';
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function button(text, click, primary = false) {
    const el = node('button', primary ? 'km-btn km-primary' : 'km-btn', text);
    el.type = 'button';
    el.addEventListener('click', click);
    return el;
  }
  function select(name, options, value) {
    const el = node('select', 'km-control');
    el.name = name;
    for (const [id, label] of options) el.add(new Option(label, id));
    el.value = value;
    return el;
  }
  function input(name, value, settings = {}) {
    const el = node(settings.multiline ? 'textarea' : 'input', 'km-control');
    el.name = name;
    el.value = value ?? '';
    if (settings.multiline) el.rows = 3;
    else el.type = settings.type || 'text';
    if (settings.required) el.required = true;
    if (settings.type === 'number') {
      el.min = '0';
      el.max = settings.max;
      el.step = '1';
    } else el.maxLength = settings.max || 120;
    return el;
  }
  function field(label, control, wide = false) {
    const el = node('label', wide ? 'km-field km-wide' : 'km-field');
    el.append(node('span', '', label), control);
    return el;
  }
  function mount(host) {
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    const style = node('style');
    style.textContent = document.getElementById('crm-menu-styles').textContent + '\n*{box-sizing:border-box}';
    const root = node('div');
    shadow.replaceChildren(style, root);
    let catalog = store.loadCatalog();
    const filters = { query: '', section: '', status: '' };
    let notice = '';
    const sections = () => catalog.sections.filter(section => allowed(section.cat));
    const items = () => catalog.items.filter(item => sections().some(section => section.id === item.sub));
    const statusOptions = () => ['available', 'stop', 'hidden'].map(value => [value, tr(value)]);
    const sectionOptions = () => sections().map(section => [section.id, title(section)]);
    const menuUrl = new URL('../e-menu/', location.href);

    function edit(collection, record) {
      const isItem = collection === 'items';
      const dialog = node('dialog', 'km-dialog');
      const heading = node('h2', '', tr(isItem ? record ? 'itemEdit' : 'add' : record ? 'categoryEdit' : 'categoryAdd'));
      heading.id = 'km-dialog-title';
      dialog.setAttribute('aria-labelledby', heading.id);
      const form = node('form', 'km-form');
      const header = node('header', 'km-dialog-head');
      header.append(heading, button('×', () => dialog.close()));
      header.lastChild.setAttribute('aria-label', tr('cancel'));
      const body = node('div', 'km-dialog-body');
      const fields = node('div', 'km-fields');
      fields.append(field(tr('name') + ' · RU', input('name0', record?.name[0], { required: true }), true));
      if (isItem) {
        fields.append(
          field(tr('category'), select('sub', sectionOptions(), record?.sub || filters.section || sections()[0].id)),
          field(tr('price'), input('price', record?.price, { type: 'number', required: true, max: 99999999 })),
          field(tr('desc') + ' · RU', input('desc0', record?.desc[0], { multiline: true, max: 1200 }), true),
          field(tr('portion') + ' · RU', input('portion0', record?.portion?.[0])),
          field(tr('prep'), input('prep', record?.prep ?? 0, { type: 'number', required: true, max: 1440 })),
          field(tr('status'), select('menuStatus', statusOptions(), record?.menuStatus || 'available')),
          field(tr('photo'), input('img', record?.img?.startsWith('https://') ? record.img : '', { type: 'url', max: 2048 }))
        );
        const help = node('p', 'km-help km-wide', tr('statusHint'));
        fields.append(help);
        if (record?.img && !record.img.startsWith('https://')) fields.append(node('p', 'km-help km-wide', tr('newPhoto')));
      } else {
        const group = select('cat', ['kitchen', 'drinks'].map(key => [key, tr(key)]), record?.cat || 'kitchen');
        group.disabled = Boolean(record);
        fields.append(field(tr('group'), group, true));
      }
      const translations = node('details', 'km-translations');
      translations.append(node('summary', '', tr('translations')));
      const translatedFields = node('div', 'km-fields');
      for (const [index, lang] of [[1, 'KZ'], [2, 'EN']]) {
        translatedFields.append(field(tr('name') + ' · ' + lang, input('name' + index, record?.name[index]), true));
        if (isItem) translatedFields.append(
          field(tr('desc') + ' · ' + lang, input('desc' + index, record?.desc[index], { multiline: true, max: 1200 }), true),
          field(tr('portion') + ' · ' + lang, input('portion' + index, record?.portion?.[index]), true)
        );
      }
      translations.append(translatedFields);
      const error = node('p', 'km-error');
      error.setAttribute('role', 'alert');
      error.hidden = true;
      body.append(fields, translations, error);
      const footer = node('footer', 'km-dialog-foot');
      const submit = node('button', 'km-btn km-primary', tr('save'));
      submit.type = 'submit';
      footer.append(button(tr('cancel'), () => dialog.close()), submit);
      form.append(header, body, footer);
      dialog.append(form);
      dialog.addEventListener('close', () => dialog.remove(), { once: true });
      form.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const texts = key => [0, 1, 2].map(index => String(data.get(key + index) || '').trim());
        const name = texts('name');
        if (!name[0]) {
          const mainName = form.elements.name0;
          mainName.value = '';
          mainName.reportValidity();
          return;
        }
        const id = record?.id || (isItem ? 'dish-' : 'section-') + crypto.randomUUID();
        let update = { id, cat: record?.cat || data.get('cat'), name };
        if (isItem) {
          const photo = String(data.get('img') || '').trim();
          const img = photo ? store.photoPath(photo) : (record?.img?.startsWith('https://') ? '' : record?.img || '');
          if (photo && !img) {
            error.hidden = false;
            error.textContent = tr('photoError');
            return;
          }
          update = { id, name, sub: data.get('sub'), price: Number(data.get('price')), prep: Number(data.get('prep')),
            desc: texts('desc'), portion: texts('portion'), img, menuStatus: data.get('menuStatus') };
        }
        try {
          catalog = store.saveRecord(collection, update);
          if (!isItem) filters.section = id;
          notice = tr('saved');
          dialog.close();
          render();
        } catch {
          error.hidden = false;
          error.textContent = tr('saveError');
        }
      });
      root.append(dialog);
      dialog.showModal();
    }

    function render() {
      const top = node('div', 'km-hero');
      const copy = node('div');
      copy.append(node('h2', '', tr('title')), node('p', '', tr('intro')));
      const actions = node('div', 'km-actions');
      const open = node('a', 'km-btn', tr('open') + ' ↗');
      open.href = '../e-menu/?lang=' + (langIndex() ? 'KZ' : 'RU');
      open.target = '_blank';
      open.rel = 'noopener';
      actions.append(open, button(tr('add'), () => edit('items'), true));
      top.append(copy, actions);
      const stats = node('div', 'km-stats');
      for (const state of ['available', 'stop', 'hidden']) {
        const card = node('button', 'km-stat');
        card.type = 'button';
        card.setAttribute('aria-pressed', String(filters.status === state));
        card.append(node('span', 'km-dot km-' + state), node('span', '', tr(state)),
          node('strong', '', items().filter(item => item.menuStatus === state).length));
        card.onclick = () => { filters.status = filters.status === state ? '' : state; render(); };
        stats.append(card);
      }
      const panel = node('div', 'km-panel');
      const bar = node('div', 'km-toolbar');
      const query = input('search', filters.query, { type: 'search' });
      query.placeholder = tr('search');
      query.setAttribute('aria-label', tr('search'));
      const category = select('category', [['', tr('allCategories')], ...sectionOptions()], filters.section);
      category.setAttribute('aria-label', tr('category'));
      const status = select('status', [['', tr('allStatuses')], ...statusOptions()], filters.status);
      status.setAttribute('aria-label', tr('status'));
      const categoryActions = node('div', 'km-actions');
      categoryActions.append(button(tr('categoryAdd'), () => edit('sections')));
      if (filters.section) categoryActions.append(button(tr('categoryEdit'), () => edit('sections', sections().find(s => s.id === filters.section))));
      bar.append(query, category, status, categoryActions);
      const rows = node('div', 'km-rows');
      function renderRows() {
        const q = filters.query.trim().toLocaleLowerCase();
        const visible = items().filter(item =>
          (!filters.section || item.sub === filters.section) &&
          (!filters.status || item.menuStatus === filters.status) &&
          (!q || [...item.name, ...item.desc].join(' ').toLocaleLowerCase().includes(q)));
        if (!visible.length) { rows.replaceChildren(node('p', 'km-empty', tr('empty'))); return; }
        rows.replaceChildren(...visible.map(item => {
          const row = node('article', 'km-row');
          const picture = node('div', 'km-photo', title(item).slice(0, 1));
          picture.setAttribute('aria-hidden', 'true');
          if (item.img) {
            const img = node('img');
            img.src = new URL(item.img, menuUrl).href;
            img.alt = '';
            img.loading = 'lazy';
            img.addEventListener('error', () => img.remove(), { once: true });
            picture.append(img);
          }
          const details = node('div', 'km-item');
          details.append(node('strong', '', title(item)),
            node('span', '', title(sections().find(s => s.id === item.sub)) + (item.portion?.[langIndex()] ? ' · ' + item.portion[langIndex()] : '')));
          const editButton = button(tr('edit'), () => edit('items', item));
          editButton.setAttribute('aria-label', tr('edit') + ' · ' + title(item));
          row.append(picture, details, node('strong', 'km-price', money(item.price)),
            node('span', 'km-status km-' + item.menuStatus, tr(item.menuStatus)), editButton);
          return row;
        }));
      }
      query.oninput = () => { filters.query = query.value; renderRows(); };
      category.onchange = () => { filters.section = category.value; render(); root.querySelector('[name="category"]').focus(); };
      status.onchange = () => { filters.status = status.value; render(); root.querySelector('[name="status"]').focus(); };
      panel.append(bar, rows);
      const feedback = node('div', 'km-help', notice);
      feedback.setAttribute('role', 'status');
      root.replaceChildren(top, stats, node('p', 'km-demo', tr('demo')), feedback, panel);
      renderRows();
    }
    render();
    return render;
  }

  let mounted;
  let refresh;
  const connect = () => {
    const root = document.getElementById('crm-menu-editor');
    if (root !== mounted) {
      mounted = root;
      refresh = root ? mount(root) : null;
    }
  };
  new MutationObserver(connect).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('shipa:localechange', () => {
    if (!mounted?.shadowRoot?.querySelector('dialog[open]')) refresh?.();
  });
  connect();
})();
