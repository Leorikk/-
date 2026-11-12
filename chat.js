/* Чат-помощник «Доктор Поль»: кнопка справа снизу, окно диалога.
   Не ставит диагнозов: подсказывает раздел сайта и ведёт к записи. Подключается одним скриптом на всех страницах. */
(function () {
  'use strict';
  if (window.__drPaul) return; window.__drPaul = true;
  /* Путь к картинке персонажа, например 'images/paul.png'. Пока пусто — иконки нет. */
  var AVATAR = '';
  var BOOK = 'pages/booking.html';

  var css = '\
  .paul-fab{position:fixed;right:24px;bottom:24px;z-index:9990;display:flex;align-items:center;gap:10px;padding:10px 20px 10px 10px;border-radius:999px;border:0;background:#0E3440;color:#fff;cursor:pointer;box-shadow:0 16px 40px -16px rgba(14,52,64,.7);font:600 16px/1 "Manrope","Inter",sans-serif;transition:transform .24s}\
  .paul-fab:hover{transform:translateY(-2px)}\
  .paul-fab:focus-visible,.paul-btn:focus-visible,.paul-chip:focus-visible,.paul-x:focus-visible{outline:3px solid #3EB8CF;outline-offset:3px}\
  .paul-fab.noface{padding:16px 24px}\
  .paul-face{width:46px;height:46px;border-radius:50%;background:#E6F1F2;overflow:hidden;display:grid;place-items:center;flex:none;box-shadow:0 0 0 2px rgba(255,255,255,.9)}\
  .paul-face img{width:100%;height:100%;object-fit:contain;object-position:center;display:block;transform:scale(1.15)}\
  .paul-panel{position:fixed;right:24px;bottom:92px;z-index:9991;width:min(400px,calc(100vw - 32px));max-height:min(620px,calc(100vh - 120px));display:none;flex-direction:column;background:#F4F8F8;border-radius:32px 40px 28px 36px;box-shadow:0 30px 80px -30px rgba(14,52,64,.6);overflow:hidden;font-family:"Inter",sans-serif;color:#1E2A2D}\
  .paul-panel.open{display:flex;animation:paulIn .5s cubic-bezier(.22,.8,.26,1) both}\
  @keyframes paulIn{from{opacity:0;transform:translateY(16px)}}\
  @media (prefers-reduced-motion:reduce){.paul-panel.open{animation:none}.paul-fab{transition:none}}\
  .paul-head{display:flex;align-items:center;gap:12px;padding:16px 16px 16px 20px;background:#0E3440;color:#fff}\
  .paul-head .paul-face{width:48px;height:48px;box-shadow:0 0 0 2px rgba(255,255,255,.35)}\
  .paul-head b{font:600 18px/1.2 "Manrope","Inter",sans-serif;display:block}\
  .paul-head span.s{font-size:14px;color:#A9CBD2}\
  .paul-x{margin-left:auto;width:44px;height:44px;border-radius:50%;border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer}\
  .paul-x:hover{background:rgba(255,255,255,.12)}\
  .paul-log{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:10px}\
  .paul-hello{display:flex;align-items:flex-end;gap:12px}\
  .paul-hello img{width:84px;height:auto;flex:none;filter:drop-shadow(0 10px 12px rgba(14,52,64,.14))}\
  .paul-msg{max-width:88%;padding:12px 16px;border-radius:20px 20px 20px 6px;background:#fff;font-size:15px;line-height:1.45;box-shadow:0 1px 2px rgba(14,52,64,.06),0 8px 24px -12px rgba(14,52,64,.14)}\
  .paul-hello .paul-msg{margin-bottom:6px}\
  .paul-msg.me{align-self:flex-end;background:#16697A;color:#fff;border-radius:20px 20px 6px 20px}\
  .paul-msg a.paul-btn{display:inline-flex;margin-top:10px;min-height:40px;padding:8px 18px;border-radius:999px;border:1.5px solid #CFE5E9;background:#fff;color:#16697A;font:700 15px/1.2 "Manrope","Inter",sans-serif;text-decoration:none}\
  .paul-msg a.paul-btn.pri{background:#FF4111;border-color:#FF4111;color:#fff}\
  .paul-msg a.paul-btn:hover{border-color:#3EB8CF}\
  .paul-sos{display:block;margin-top:8px;padding:8px 10px;border-radius:12px;background:#FFF0E9;font-size:14px}\
  .paul-chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 10px}\
  .paul-chip{min-height:40px;padding:8px 16px;border-radius:999px;border:1.5px solid #CFE5E9;background:#fff;color:#1E2A2D;font:500 15px/1.2 "Inter",sans-serif;cursor:pointer}\
  .paul-chip:hover{border-color:#3EB8CF}\
  .paul-form{display:flex;gap:8px;padding:12px;border-top:1px solid #CFE5E9;background:#fff}\
  .paul-form input{flex:1;min-width:0;min-height:46px;border:1.5px solid #CFE5E9;border-radius:999px;padding:0 16px;font:400 16px "Inter",sans-serif;color:#1E2A2D;background:#F4F8F8}\
  .paul-form input:focus{outline:0;border-color:#3EB8CF}\
  .paul-form button{min-height:46px;padding:0 18px;border-radius:999px;border:0;background:#0E3440;color:#fff;font:700 15px "Manrope","Inter",sans-serif;cursor:pointer}\
  .paul-note{padding:8px 18px 12px;background:#fff;font-size:13px;color:#56686D;line-height:1.4}\
  @media (max-width:600px){.paul-fab{right:12px;bottom:12px;padding:8px 16px 8px 8px}.paul-panel{right:8px;bottom:76px;width:calc(100vw - 16px)}}';

  var SOS = /задыха|не дыш|синеет|без сознани|потерял сознани|судорог|перекосил|не может говорить|отёк (языка|горла)|отек (языка|горла)|не останавлива|рвота кровью|отрав|передозир|анафилакс|удушь/;
  var ROUTES = [
    { re: /запис|приём|прием|консульт|записат/, reply: 'Запись занимает пару минут: выберите филиал, направление, день и время.', to: BOOK, label: 'Записаться на приём', pri: 1 },
    { re: /цен|стоим|услуг|сколько/, reply: 'Форматы приёма и их описание собраны на странице услуг.', to: 'pages/our-services.html', label: 'Услуги' },
    { re: /адрес|где|контакт|телефон|добрат|филиал|уссур|владивост/, reply: 'Приём ведётся во Владивостоке (ул. Лазо, д. 8, +7 (423) 292-02-90) и в Уссурийске (ул. Тимирязева, д. 8, +7 (4234) 300-470).', to: 'pages/contacts.html', label: 'Контакты' },
    { re: /кабинет|результат|профиль/, reply: 'Результаты и записи доступны в личном кабинете.', to: 'pages/profile.html', label: 'Личный кабинет' },
    { re: /курс|школ|подкаст|обучен|образоват|материал/, reply: 'Образовательные проекты врача — школа пациентов, подкасты и материалы.', to: 'pages/educational-projects.html', label: 'Образовательные проекты' },
    { re: /асит|иммунотерап/, reply: 'АСИТ — аллерген-специфическая иммунотерапия. Подходит ли она вам, врач решает после консультации и обследования. Ответы на частые вопросы — внизу главной страницы.', to: 'index.html#faq', label: 'Частые вопросы' },
    { re: /прививк|вакцин/, reply: 'Врач составляет индивидуальные планы вакцинации с учётом возраста, здоровья и перенесённых заболеваний. Это обсуждается на приёме.', to: BOOK, label: 'Записаться на приём', pri: 1 },
    { re: /аллерг|сыпь|зуд|насморк|чихан|кашел|кашл|крапивниц|астм|дермат|поллиноз|отёк|отек|покраснен|пищев/, reply: 'С такими жалобами обычно обращаются к аллергологу-иммунологу. Врач оценит ситуацию на приёме. Я не ставлю диагнозов, только подсказываю, куда обратиться.', to: BOOK, label: 'Записаться к врачу', pri: 1 },
    { re: /простуд|инфекц|часто болеет|болеет|иммун|температур/, reply: 'Если инфекции повторяются или затягиваются, имеет смысл показаться клиническому иммунологу: врач оценит работу иммунной системы и подскажет, какие обследования нужны.', to: BOOK, label: 'Записаться на приём', pri: 1 }
  ];

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    var st = el('style'); st.textContent = css; document.head.appendChild(st);

    var face = function (n) { return AVATAR ? '<span class="paul-face" aria-hidden="true"><img src="' + AVATAR + '" alt="" width="' + n + '" height="' + n + '"></span>' : ''; };
    var fab = el('button', 'paul-fab' + (AVATAR ? '' : ' noface'), face(46) + 'Доктор Поль');
    fab.type = 'button'; fab.setAttribute('aria-controls', 'paulPanel'); fab.setAttribute('aria-expanded', 'false');

    var p = el('div', 'paul-panel'); p.id = 'paulPanel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Доктор Поль, помощник по сайту');
    p.innerHTML = '<div class="paul-head">' + face(48) + '<div><b>Доктор Поль</b><span class="s">Подскажет, куда обратиться</span></div><button class="paul-x" type="button" aria-label="Закрыть">×</button></div>' +
      '<div class="paul-log" aria-live="polite"><div class="paul-hello">' + (AVATAR ? '<img src="' + AVATAR + '" alt="Доктор Поль" width="84" height="110">' : '') + '<div class="paul-msg">Здравствуйте! Я Доктор Поль. Расскажите, что беспокоит, или выберите вариант ниже. Я подскажу раздел сайта и помогу записаться к врачу.</div></div></div>' +
      '<div class="paul-chips"><button class="paul-chip" type="button">Аллергия или сыпь</button><button class="paul-chip" type="button">Ребёнок часто болеет</button><button class="paul-chip" type="button">Что такое АСИТ?</button><button class="paul-chip" type="button">Как записаться?</button></div>' +
      '<form class="paul-form"><label class="vh" for="paulQ" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Ваш вопрос</label><input id="paulQ" placeholder="Опишите вопрос" autocomplete="off"><button type="submit">Спросить</button></form>' +
      '<p class="paul-note">Доктор Поль не ставит диагнозы и не заменяет врача. При тяжёлом состоянии звоните 103 или 112.</p>';
    document.body.appendChild(p); document.body.appendChild(fab);

    var log = p.querySelector('.paul-log'), inp = p.querySelector('#paulQ');
    function toggle(open) {
      var o = open == null ? !p.classList.contains('open') : open;
      p.classList.toggle('open', o); fab.setAttribute('aria-expanded', String(o));
      if (o) setTimeout(function () { inp.focus(); }, 50); else fab.focus();
    }
    function say(html, me) { var m = el('div', 'paul-msg' + (me ? ' me' : ''), html); log.appendChild(m); log.scrollTop = log.scrollHeight; }
    function ask(q) {
      say(esc(q), true);
      var lq = q.toLowerCase().replace(/ё/g, 'е');
      setTimeout(function () {
        if (SOS.test(lq)) { say('<b>Позвоните 103 или 112 сейчас.</b> Не ждите записи. Сообщите диспетчеру, что произошло, возраст и адрес.'); return; }
        var r = ROUTES.filter(function (x) { return x.re.test(lq); })[0];
        if (r) {
          var child = /реб[её]н|дет|сын|доч|малыш/.test(lq) ? '<span class="paul-sos">Детей врач принимает в присутствии законного представителя.</span>' : '';
          say(r.reply + child + '<br><a class="paul-btn' + (r.pri ? ' pri' : '') + '" href="' + r.to + '">' + r.label + '</a>'); return;
        }
        say('Пока не понял запрос. Можно записаться на консультацию — врач разберётся в вашей ситуации, или позвонить: +7 (423) 292-02-90.<br><a class="paul-btn pri" href="' + BOOK + '">Записаться на приём</a>');
      }, 350);
    }
    fab.addEventListener('click', function () { toggle(); });
    p.querySelector('.paul-x').addEventListener('click', function () { toggle(false); });
    [].forEach.call(p.querySelectorAll('.paul-chip'), function (c) { c.addEventListener('click', function () { ask(c.textContent); }); });
    p.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value.trim(); if (v) { ask(v); inp.value = ''; } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('open')) toggle(false); });
    /* кнопки «Доктор Поль» в других местах сайта */
    document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-paul]'); if (b) { e.preventDefault(); toggle(true); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
