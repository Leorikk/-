/* Запись на приём: шаги, выбор филиала в шапке.
   Подключается на всех страницах с шапкой и окном записи (appointment-modal.html).
   Данные никуда не отправляются: нужен серверный приём заявок. */
(function () {
  'use strict';

  var BRANCHES = {
    'Владивосток': { name: 'Владивосток', address: 'г. Владивосток, ул. Лазо, д. 8', phone: '+7 (423) 292-02-90', hours: 'Ежедневно с 08:00 до 21:00', closedSun: false },
    'Уссурийск': { name: 'Уссурийск', address: 'г. Уссурийск, ул. Тимирязева, д. 8', phone: '+7 (4234) 300-470', hours: 'Ежедневно с 09:00 до 20:00', closedSun: false }
  };
  var KINDS = [
    { k: 'allergy', t: 'Аллергология', s: 'Аллергический ринит, бронхиальная астма, атопический дерматит, пищевая аллергия', ic: 'pollen' },
    { k: 'immun', t: 'Иммунология', s: 'Частые или затяжные инфекции, оценка работы иммунной системы', ic: 'virus' },
    { k: 'asit', t: 'АСИТ', s: 'Аллерген-специфическая иммунотерапия: подбор и проведение', ic: 'syringe' }
  ];
  var ICONS = {
    pin: '<path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.3-3.6 4.2-5.4 7.5-5.4s6.2 1.8 7.5 5.4"/>',
    child: '<circle cx="12" cy="7" r="3"/><path d="M7 21v-5.5L5 12.5M17 21v-5.5l2-3M8 11.5h8l1 4H7Z"/>',
    check: '<path d="M4 12.5 9 17.5 20 6.5"/>',
    pollen: '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="5.5" r="2.2"/><circle cx="18.2" cy="10" r="2.2"/><circle cx="15.8" cy="17.4" r="2.2"/><circle cx="8.2" cy="17.4" r="2.2"/><circle cx="5.8" cy="10" r="2.2"/>',
    virus: '<circle cx="12" cy="12" r="5"/><path d="M12 3.5V7M12 17v3.5M3.5 12H7M17 12h3.5M6 6l2.4 2.4M15.6 15.6 18 18M18 6l-2.4 2.4M8.4 15.6 6 18"/>',
    syringe: '<path d="m16.5 3.5 4 4M18.5 5.5 15.8 8.2M13.2 5.6l5.2 5.2M15.8 8.2 7.4 16.6l-3 .4.4-3 8.4-8.4M4.8 19.2 3 21M8.6 11.2l1.6 1.6M10.8 9l1.6 1.6"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'
  };
  var STEPS = ['Филиал', 'Направление', 'Дата и время', 'Данные пациента', 'Согласия', 'Подтверждение'];
  var BASE_TIMES = ['08:30', '09:10', '09:50', '10:40', '11:20', '12:30', '13:40', '14:50', '15:30', '16:40', '17:20', '18:10'];
  var DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var A = null;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ic(n, size) { return '<svg class="ap-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '>' + ICONS[n] + '</svg>'; }
  function plural(n, a, b, c) { var m10 = n % 10, m100 = n % 100; return (m10 === 1 && m100 !== 11) ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? b : c; }
  function yrs(n) { return n === 0 ? 'до 1 года' : n + ' ' + plural(n, 'год', 'года', 'лет'); }
  function kind(k) { return KINDS.filter(function (x) { return x.k === k; })[0]; }

  /* ---------- филиал / город ---------- */
  function getCity() { var c = null; try { c = localStorage.getItem('city'); } catch (e) {} return BRANCHES[c] ? c : 'Владивосток'; }
  function setCity(c) {
    if (!BRANCHES[c]) return;
    try { localStorage.setItem('city', c); } catch (e) {}
    syncHeader();
    if (A && !A.done && $('#apptRoot')) { A.branch = c; A.time = null; render(); }
  }
  function syncHeader() {
    var c = getCity();
    $$('.navbar-city').forEach(function (w) {
      var n = $('.navbar-city-name', w); if (n) n.textContent = c;
      $$('.navbar-city-opt', w).forEach(function (o) { o.setAttribute('aria-checked', String(o.getAttribute('data-city') === c)); });
    });
  }
  function closeCity(except) {
    $$('.navbar-city.open').forEach(function (w) {
      if (w === except) return;
      w.classList.remove('open');
      var b = $('.navbar-city-current', w); if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  window.setSiteCity = setCity;

  /* ---------- состояние ---------- */
  function start() {
    A = { step: 1, sub: 'dir', branch: getCity(), kind: null, who: null, age: null, day: 0, time: null, wish: false,
      patient: { name: '', phone: '', email: '', child: '', birth: '' }, consents: { data: false, terms: false, news: false },
      tried: false, done: false, ref: null, notice: '' };
  }
  function whoReady() { return A.who === 'adult' || (A.who === 'child' && A.age !== null); }
  function dayDate(i) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; }
  function dayLabel(i) { var d = dayDate(i); return i === 0 ? 'сегодня' : i === 1 ? 'завтра' : DOW[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function daySlots(i) {
    var d = dayDate(i), seed = A.branch.length * 11 + i * 7 + d.getDay();
    var list = BASE_TIMES.filter(function (t, k) { return (seed + k * 5) % 3 === 0; });
    if (i === 0) { var now = new Date(), hm = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2); list = list.filter(function (t) { return t > hm; }); }
    return { list: list, taken: list.length > 2 ? [list[1]] : [] };
  }
  function digits(v) { return String(v || '').replace(/\D/g, ''); }
  function fmtPhone(v) {
    var d = digits(v); if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1); if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)], o = '+7';
    if (p[0]) o += ' (' + p[0] + (p[0].length === 3 ? ')' : '');
    if (p[1]) o += ' ' + p[1]; if (p[2]) o += '-' + p[2]; if (p[3]) o += '-' + p[3];
    return o;
  }
  function fmtDate(v) { var d = digits(v).slice(0, 8); return d.length > 4 ? d.slice(0, 2) + '.' + d.slice(2, 4) + '.' + d.slice(4) : d.length > 2 ? d.slice(0, 2) + '.' + d.slice(2) : d; }
  function parseDate(v) {
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(v || '').trim()); if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    return d.getFullYear() === +m[3] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[1] ? d : null;
  }
  function birthAge(v) {
    var d = parseDate(v), t = new Date(); if (!d || d > t) return null;
    var a = t.getFullYear() - d.getFullYear();
    if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
    return a;
  }
  var validPhone = function (v) { var d = digits(v); return (d.length === 11 && /^[78]/.test(d)) || d.length === 10; };
  var validFull = function (v) { return String(v || '').trim().split(/\s+/).filter(function (w) { return /[A-Za-zА-Яа-яЁё]{2,}/.test(w); }).length >= 2; };
  var validEmail = function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); };

  /* ---------- разметка ---------- */
  function fld(id, label, o) {
    o = o || {};
    var v = A.patient[o.key || id] || '', bad = o.bad ? ' bad' : '';
    return '<div class="ap-field' + bad + '"><label for="ap-' + id + '">' + label + (o.req ? '' : ' <span class="ap-opt">(необязательно)</span>') + '</label>' +
      '<input id="ap-' + id + '" data-f="' + (o.key || id) + '" type="' + (o.type || 'text') + '" value="' + esc(v) + '" placeholder="' + esc(o.ph || '') + '"' +
      (o.mask ? ' data-mask="' + o.mask + '"' : '') + (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.bad ? ' aria-invalid="true"' : '') + '>' +
      (o.hint ? '<span class="ap-hint">' + o.hint + '</span>' : '') + '<span class="ap-err">' + esc(o.err || 'Заполните поле') + '</span></div>';
  }
  function stepper() {
    return '<ol class="ap-stepper" aria-label="Шаги записи">' + STEPS.map(function (t, i) {
      var n = i + 1, st = n < A.step ? 'done' : n === A.step ? 'now' : '';
      return '<li class="' + st + '"' + (n === A.step ? ' aria-current="step"' : '') + '><span class="b">' + (n < A.step ? ic('check', 16) : n) + '</span><span class="l">' +
        (n < A.step ? '<button type="button" data-go="' + n + '">' + t + '</button>' : t) + '</span></li>';
    }).join('') + '</ol>';
  }
  function patientLine() {
    var p = A.patient;
    if (A.who === 'child') { var age = A.age !== null ? yrs(A.age) : ''; return A.step >= 5 && p.child.trim() ? esc(p.child.trim()) + (age ? ', ' + age : '') : 'ребёнок' + (age ? ', ' + age : ''); }
    if (A.who === 'adult') return A.step >= 5 && p.name.trim() ? esc(p.name.trim()) : 'взрослый';
    return '';
  }
  function summary() {
    var b = BRANCHES[A.branch], k = kind(A.kind), pl = patientLine();
    function row(l, v) { return '<div class="row"><span>' + l + '</span><b>' + v + '</b></div>'; }
    return '<aside class="ap-summary" aria-label="Ваша запись"><h3>Ваша запись</h3>' +
      row('Специалист', 'Деркач В.В., аллерголог-иммунолог') +
      row('Филиал', esc(b.address)) +
      (k ? row('Направление', esc(k.t)) : row('Направление', 'ещё не выбрано')) +
      (pl ? row('Пациент', pl) : '') +
      row('Дата и время', A.time ? dayLabel(A.day) + ', ' + A.time : 'ещё не выбрано') +
      (A.wish ? row('Если освободится раньше', 'позвоним') : '') +
      '<p class="ap-note">Время ориентировочное: администратор подтвердит запись по телефону.</p></aside>';
  }
  function nav(label, canNext) {
    return '<div class="ap-actions">' + (A.step > 1 ? '<button class="ap-btn ap-btn-secondary" type="button" data-act="back">Назад</button>' : '') +
      '<button class="ap-btn ap-btn-primary" type="button" data-act="next"' + (canNext === false ? ' aria-disabled="true"' : '') + '>' + (label || 'Продолжить') + '</button></div>';
  }
  function notice() { return A.notice ? '<div class="ap-notice" role="status">' + ic('info') + '<p>' + A.notice + '</p></div>' : ''; }

  function stepBranch() {
    return '<h2>В какой филиал</h2>' + notice() + '<div class="ap-stack" role="radiogroup" aria-label="Филиал">' +
      Object.keys(BRANCHES).map(function (c, i) {
        var b = BRANCHES[c], on = A.branch === c;
        return '<button class="ap-row' + (on ? ' on' : '') + '" type="button" role="radio" aria-checked="' + on + '" data-branch="' + c + '"><span class="ap-ico">' + ic('pin') + '</span><span class="t"><b>' + b.name + '</b><span>' + esc(b.address) + '</span><small>' + b.hours + ' · ' + b.phone + '</small></span><span class="ap-radio" aria-hidden="true"></span></button>';
      }).join('') + '</div>' + nav();
  }
  function trail() {
    var p = [];
    if (A.kind && A.sub !== 'dir') p.push(['dir', kind(A.kind).t]);
    return p.length ? '<ol class="ap-trail" aria-label="Уже выбрано">' + p.map(function (x) { return '<li><button type="button" data-sub="' + x[0] + '">' + esc(x[1]) + '</button></li>'; }).join('') + '</ol>' : '';
  }
  function stepKind() {
    var h = trail(), err = '';
    if (A.sub === 'dir') {
      if (A.tried && !A.kind) err = 'Выберите направление';
      return h + '<h2>Выберите направление</h2><p class="ap-lead">С чем вы обращаетесь к врачу</p>' + notice() + '<div class="ap-stack" role="radiogroup" aria-label="Направление">' +
        KINDS.map(function (K) {
          var on = A.kind === K.k;
          return '<button class="ap-row' + (on ? ' on' : '') + '" type="button" role="radio" aria-checked="' + on + '" data-kind="' + K.k + '"><span class="ap-ico">' + ic(K.ic) + '</span><span class="t"><b>' + K.t + '</b><span>' + K.s + '</span></span><span class="ap-radio" aria-hidden="true"></span></button>';
        }).join('') + '</div>' + (err ? '<span class="ap-err-line" role="alert">' + err + '</span>' : '') + nav();
    }
    if (A.tried && !whoReady()) err = A.who === 'child' ? 'Выберите, сколько полных лет ребёнку' : 'Выберите, кто идёт на приём';
    var ages = ''; for (var i = 0; i < 18; i++) ages += '<option value="' + i + '"' + (A.age === i ? ' selected' : '') + '>' + (i === 0 ? 'Меньше 1 года' : yrs(i)) + '</option>';
    return h + '<h2>Кто идёт на приём</h2><p class="ap-lead">Врач принимает взрослых и детей с рождения</p>' + notice() + '<div class="ap-stack" role="radiogroup" aria-label="Кто идёт на приём">' +
      '<button class="ap-row' + (A.who === 'adult' ? ' on' : '') + '" type="button" role="radio" aria-checked="' + (A.who === 'adult') + '" data-who="adult"><span class="ap-ico">' + ic('user') + '</span><span class="t"><b>Взрослый</b><span>18 лет и старше</span></span><span class="ap-radio" aria-hidden="true"></span></button>' +
      '<button class="ap-row' + (A.who === 'child' ? ' on' : '') + '" type="button" role="radio" aria-checked="' + (A.who === 'child') + '" data-who="child"><span class="ap-ico">' + ic('child') + '</span><span class="t"><b>Ребёнок</b><span>До 17 лет включительно, приходит с законным представителем</span></span><span class="ap-radio" aria-hidden="true"></span></button></div>' +
      (A.who === 'child' ? '<div class="ap-field ap-age' + (A.tried && A.age === null ? ' bad' : '') + '"><label for="ap-age">Сколько полных лет вашему ребёнку?</label><select id="ap-age" data-age><option value="">Выберите количество полных лет</option>' + ages + '</select><span class="ap-hint">Считайте только полные годы: если ребёнку 6 лет и 6 месяцев, выберите 6 лет.</span><span class="ap-err">Выберите, сколько полных лет ребёнку</span></div>' : '') +
      (err && A.who !== 'child' ? '<span class="ap-err-line" role="alert">' + err + '</span>' : '') + nav();
  }
  function stepTime() {
    var ds = daySlots(A.day), days = '';
    for (var i = 0; i < 10; i++) { var d = dayDate(i); days += '<button class="ap-day" type="button" data-day="' + i + '" aria-pressed="' + (A.day === i) + '">' + (i === 0 ? 'сегодня' : DOW[d.getDay()]) + '<b>' + d.getDate() + '</b>' + MON[d.getMonth()].slice(0, 3) + '</button>'; }
    return '<h2>Дата и время</h2>' + notice() + '<div class="ap-days" role="group" aria-label="День">' + days + '</div>' +
      (ds.list.length ? '<div class="ap-slots" role="group" aria-label="Время">' + ds.list.map(function (t) { var tk = ds.taken.indexOf(t) > -1; return '<button class="ap-slot" type="button" data-time="' + t + '" aria-pressed="' + (A.time === t) + '"' + (tk ? ' disabled aria-label="' + t + ', занято"' : '') + '>' + t + '</button>'; }).join('') + '</div>'
        : '<div class="ap-callout">На этот день свободного времени нет. Выберите другой день или отметьте «Нет подходящего времени» ниже.</div>') +
      (A.tried && !A.time ? '<span class="ap-err-line" role="alert">Выберите время, без точного времени запись не оформить</span>' : '') +
      '<label class="ap-check ap-callout warm"><input type="checkbox" data-wish' + (A.wish ? ' checked' : '') + '><span><b>Нет подходящего времени?</b> Отметьте, и администратор позвонит, если к врачу освободится время раньше. Запись на выбранное время сохранится.</span></label>' + nav();
  }
  function stepData() {
    var p = A.patient, t = A.tried;
    var whoLine = '<div class="ap-fixed">' + ic(A.who === 'child' ? 'child' : 'user') + '<span>Записываем <b>' + (A.who === 'child' ? 'ребёнка' + (A.age !== null ? ', ' + yrs(A.age) : '') : 'взрослого') + '</b></span><button type="button" data-sub="who">Изменить</button></div>';
    var child = A.who === 'child' ? '<div class="ap-two">' + fld('child', 'Имя и фамилия ребёнка', { req: 1, ph: 'Мария Иванова', ac: 'off', bad: t && !validFull(p.child), err: 'Укажите имя и фамилию' }) +
      fld('birth', 'Дата рождения ребёнка', { req: 1, ph: 'дд.мм.гггг', mask: 'date', inputmode: 'numeric', max: 10, bad: t && !parseDate(p.birth), err: 'Укажите дату рождения', hint: A.age !== null ? 'На предыдущем шаге указано: ' + yrs(A.age) : '' }) + '</div>' : '';
    return '<h2>Данные пациента</h2>' + notice() + whoLine + child +
      fld('name', A.who === 'child' ? 'Ваши имя и фамилия (законный представитель)' : 'Имя и фамилия', { req: 1, ph: 'Иван Иванов', ac: 'name', bad: t && !validFull(p.name), err: 'Укажите имя и фамилию' }) +
      '<div class="ap-two">' + fld('phone', 'Телефон', { req: 1, type: 'tel', ph: '+7 (___) ___-__-__', mask: 'phone', inputmode: 'tel', ac: 'tel', bad: t && !validPhone(p.phone), err: 'Введите номер телефона полностью', hint: 'На него придёт SMS с подтверждением.' }) +
      fld('email', 'Почта', { type: 'email', ph: 'name@example.ru', ac: 'email', bad: t && !validEmail(p.email), err: 'Проверьте адрес почты' }) + '</div>' +
      '<div class="ap-actions"><button class="ap-btn ap-btn-secondary" type="button" data-act="back">Назад</button><button class="ap-btn ap-btn-primary" type="button" data-act="next">Продолжить</button></div>';
  }
  function stepConsent() {
    var c = A.consents, t = A.tried;
    return '<h2>Согласия</h2><div class="ap-checks">' +
      '<label class="ap-check' + (t && !c.data ? ' bad' : '') + '"><input type="checkbox" data-c="data"' + (c.data ? ' checked' : '') + '><span>Согласен(на) на обработку персональных данных в соответствии с <a href="pages/privacy-policy.html" target="_blank" rel="noopener">политикой конфиденциальности</a></span></label>' +
      '<label class="ap-check' + (t && !c.terms ? ' bad' : '') + '"><input type="checkbox" data-c="terms"' + (c.terms ? ' checked' : '') + '><span>Подтверждаю достоверность указанных данных</span></label>' +
      '<label class="ap-check"><input type="checkbox" data-c="news"' + (c.news ? ' checked' : '') + '><span>Присылать напоминания и новости <span class="ap-opt">(необязательно)</span></span></label></div>' +
      (t && !(c.data && c.terms) ? '<span class="ap-err-line" role="alert">Отметьте два обязательных согласия</span>' : '') + nav();
  }
  function stepConfirm() {
    var b = BRANCHES[A.branch], p = A.patient, k = kind(A.kind);
    function ed(n) { return ' <button class="ap-edit" type="button" data-go="' + n + '">Изменить</button>'; }
    var bad = A.tried && !validPhone(p.phone);
    return '<h2>Проверьте запись</h2><dl class="ap-kv">' +
      '<div><dt>Филиал</dt><dd>' + esc(b.name) + ', ' + esc(b.address) + ed(1) + '</dd></div>' +
      '<div><dt>Направление</dt><dd>' + esc(k.t) + ed(2) + '</dd></div>' +
      '<div><dt>Специалист</dt><dd>Деркач В.В., аллерголог-иммунолог</dd></div>' +
      '<div><dt>Дата и время</dt><dd>' + dayLabel(A.day) + ', ' + A.time + ed(3) + '</dd></div>' +
      '<div><dt>Если освободится раньше</dt><dd>' + (A.wish ? 'Позвонить и предложить время' : 'Не звонить') + ed(3) + '</dd></div>' +
      '<div><dt>Пациент</dt><dd>' + (A.who === 'child' ? esc(p.child) + ', ' + yrs(A.age) + ', представитель ' + esc(p.name) : esc(p.name)) + ed(4) + '</dd></div></dl>' +
      '<div class="ap-phonebox">' + fld('phone', 'Телефон для SMS и звонка администратора', { req: 1, type: 'tel', ph: '+7 (___) ___-__-__', mask: 'phone', inputmode: 'tel', ac: 'tel', bad: bad, err: 'Введите номер телефона полностью', hint: 'Если в номере ошибка, исправьте его перед подтверждением записи.' }) + '</div>' +
      '<div class="ap-actions"><button class="ap-btn ap-btn-secondary" type="button" data-act="back">Назад</button><button class="ap-btn ap-btn-primary" type="button" data-act="confirm">Подтвердить запись</button></div>';
  }
  function stepDone() {
    var b = BRANCHES[A.branch];
    return '<div class="ap-done" role="status"><span class="ap-mark">' + ic('check', 28) + '</span><h2>Заявка принята</h2><p>Номер заявки <span class="ap-ref">' + A.ref + '</span>. Администратор позвонит на ' + esc(A.patient.phone) + ' и подтвердит запись.</p>' +
      '<dl class="ap-kv"><div><dt>Когда</dt><dd>' + dayLabel(A.day) + ', ' + A.time + '</dd></div><div><dt>Где</dt><dd>' + esc(b.name) + ', ' + esc(b.address) + '</dd></div></dl>' +
      '<div class="ap-actions"><a class="ap-btn ap-btn-primary" href="index.html">На главную</a></div></div>';
  }

  function render() {
    var root = $('#apptRoot'); if (!root || !A) return;
    if (A.done) { root.innerHTML = '<div class="ap-main">' + stepDone() + '</div>'; return; }
    var body = [null, stepBranch, null, stepTime, stepData, stepConsent, stepConfirm];
    var html = A.step === 2 ? stepKind() : body[A.step]();
    root.innerHTML = stepper() + '<div class="ap-layout"><div class="ap-main">' + html + '</div>' + summary() + '</div>';
  }
  function go(n) { A.step = n; A.tried = false; A.notice = ''; render(); toTop(); }
  function toTop() { var r = $('#apptRoot'); if (r && r.getBoundingClientRect().top < 0) r.scrollIntoView({ block: 'start' }); }
  function sync() {
    $$('#apptRoot [data-f]').forEach(function (el) { A.patient[el.getAttribute('data-f')] = el.value; });
  }

  function next() {
    sync();
    if (A.step === 1) { go(2); return; }
    if (A.step === 2) {
      if (A.sub === 'dir') { if (!A.kind) { A.tried = true; render(); return; } A.sub = 'who'; A.tried = false; A.notice = ''; render(); return; }
      if (!whoReady()) { A.tried = true; render(); return; }
      go(3); return;
    }
    if (A.step === 3) { if (!A.time) { A.tried = true; render(); return; } go(4); return; }
    if (A.step === 4) {
      var p = A.patient, ok = validFull(p.name) && validPhone(p.phone) && validEmail(p.email);
      if (A.who === 'child') {
        ok = ok && validFull(p.child) && !!parseDate(p.birth);
        var a = birthAge(p.birth);
        if (ok && (a === null || a > 17)) { A.tried = true; A.notice = 'Пациенту уже 18 лет, запишите его как взрослого или проверьте дату рождения.'; render(); return; }
        if (ok && A.age !== null && a !== A.age) { A.tried = true; A.notice = 'По дате рождения ребёнку ' + yrs(a) + ', а на шаге 2 указано ' + yrs(A.age) + '. Исправьте дату или возраст.'; render(); return; }
      }
      if (!ok) { A.tried = true; A.notice = ''; render(); return; }
      go(5); return;
    }
    if (A.step === 5) { if (!(A.consents.data && A.consents.terms)) { A.tried = true; render(); return; } go(6); return; }
  }
  function confirm() {
    sync();
    if (!validPhone(A.patient.phone)) { A.tried = true; render(); return; }
    A.ref = 'DV-' + Math.floor(100000 + Math.random() * 900000);
    A.done = true; render(); toTop();
    
  }

  /* ---------- события ---------- */
  var PAGE = new URL('pages/booking.html', document.baseURI);
  /* любая кнопка «Записаться» ведёт на страницу записи */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-appointment-open]');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (location.pathname !== PAGE.pathname) location.href = PAGE.href;
    else { start(); render(); window.scrollTo(0, 0); }
  }, true);
  document.addEventListener('click', function (e) {
    var t = e.target;
    var cur = t.closest && t.closest('.navbar-city-current');
    if (cur) {
      var w = cur.closest('.navbar-city'); closeCity(w);
      var o = w.classList.toggle('open'); cur.setAttribute('aria-expanded', String(o));
      return;
    }
    var opt = t.closest && t.closest('.navbar-city-opt');
    if (opt) { setCity(opt.getAttribute('data-city')); closeCity(); return; }
    if (!(t.closest && t.closest('.navbar-city'))) closeCity();

    
    var root = $('#apptRoot'); if (!root || !root.contains(t)) return;
    var el;
    if ((el = t.closest('[data-branch]'))) { A.branch = el.getAttribute('data-branch'); A.time = null; try { localStorage.setItem('city', A.branch); } catch (er) {} syncHeader(); render(); return; }
    if ((el = t.closest('[data-kind]'))) { A.kind = el.getAttribute('data-kind'); A.tried = false; render(); return; }
    if ((el = t.closest('[data-who]'))) { var v = el.getAttribute('data-who'); if (A.who !== v) { A.who = v; A.age = null; } A.tried = false; if (v === 'adult') A.patient.child = A.patient.birth = ''; render(); return; }
    if ((el = t.closest('[data-day]'))) { A.day = +el.getAttribute('data-day'); A.time = null; render(); return; }
    if ((el = t.closest('[data-time]'))) { A.time = el.getAttribute('data-time'); A.tried = false; render(); return; }
    if ((el = t.closest('[data-go]'))) { sync(); go(+el.getAttribute('data-go')); if (+el.getAttribute('data-go') === 2) { A.sub = A.kind ? 'who' : 'dir'; render(); } return; }
    if ((el = t.closest('[data-sub]'))) { sync(); var s = el.getAttribute('data-sub'); A.step = 2; A.sub = s === 'who' ? 'who' : 'dir'; A.tried = false; A.notice = ''; render(); return; }
    if ((el = t.closest('[data-act]'))) {
      var a = el.getAttribute('data-act');
      if (a === 'next') next();
      if (a === 'confirm') confirm();
      if (a === 'back') {
        sync();
        if (A.step === 2 && A.sub === 'who') { A.sub = 'dir'; A.tried = false; render(); return; }
        if (A.step === 3) { A.step = 2; A.sub = 'who'; A.tried = false; render(); return; }
        go(Math.max(1, A.step - 1));
      }
    }
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.closest || !el.closest('#apptRoot')) return;
    if (el.getAttribute('data-mask') === 'phone') { var v = fmtPhone(el.value); if (v !== el.value) el.value = v; }
    if (el.getAttribute('data-mask') === 'date') { var d = fmtDate(el.value); if (d !== el.value) el.value = d; }
    if (el.hasAttribute('data-f')) A.patient[el.getAttribute('data-f')] = el.value;
  });
  document.addEventListener('change', function (e) {
    var el = e.target; if (!el.closest || !el.closest('#apptRoot')) return;
    if (el.hasAttribute('data-age')) { A.age = el.value === '' ? null : +el.value; A.tried = false; render(); }
    if (el.hasAttribute('data-wish')) { A.wish = el.checked; render(); }
    if (el.hasAttribute('data-c')) { A.consents[el.getAttribute('data-c')] = el.checked; if (A.tried) render(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCity();
  });

  /* шапка и окно загружаются фрагментами: подставляем город, когда они появятся */
  new MutationObserver(function () {
    var w = $('.navbar-city:not([data-synced])'); if (w) { w.setAttribute('data-synced', '1'); syncHeader(); }
  }).observe(document.documentElement, { childList: true, subtree: true });
  start();
  function boot() { if ($('#apptRoot')) render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
