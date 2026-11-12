/* Версия для слабовидящих. Кнопка с глазом включает режим сразу (200 %, контраст, без картинок),
   настройки открываются панелью вверху страницы. Выбор хранится в localStorage,
   состояние — атрибуты data-a11y / data-a-* на <html>. Стили лежат в headerbar.html. */
(function () {
  // Панель настроек и кнопка с глазом создаются здесь, чтобы режим работал на любой странице,
  // в том числе в личном кабинете, где нет общей шапки. Стили лежат в /a11y.css.
  var BAR_HTML = `
<div class="a11y-bar" id="a11yBar" role="region" aria-label="Настройки версии для слабовидящих" hidden>
  <div class="a11y-bar-in">
    <div class="a11y-grp" role="group" aria-labelledby="a11yL1"><span class="a11y-lbl" id="a11yL1">Размер шрифта</span>
      <button type="button" data-a11y-set="size" data-v="1.5">150%</button><button type="button" data-a11y-set="size" data-v="2">200%</button></div>
    <div class="a11y-grp" role="group" aria-labelledby="a11yL2"><span class="a11y-lbl" id="a11yL2">Цвет сайта</span>
      <button type="button" class="a11y-sw" data-a11y-set="scheme" data-v="bw" style="--sw-bg:#fff;--sw-fg:#000" aria-label="Чёрным по белому">Аа</button><button type="button" class="a11y-sw" data-a11y-set="scheme" data-v="wb" style="--sw-bg:#000;--sw-fg:#fff" aria-label="Белым по чёрному">Аа</button><button type="button" class="a11y-sw" data-a11y-set="scheme" data-v="blue" style="--sw-bg:#9dd1ff;--sw-fg:#063462" aria-label="Тёмно-синим по голубому">Аа</button><button type="button" class="a11y-sw" data-a11y-set="scheme" data-v="beige" style="--sw-bg:#f7f3d6;--sw-fg:#4d4b43" aria-label="Коричневым по бежевому">Аа</button><button type="button" class="a11y-sw" data-a11y-set="scheme" data-v="brown" style="--sw-bg:#3b2716;--sw-fg:#a9e44d" aria-label="Зелёным по тёмно-коричневому">Аа</button></div>
    <div class="a11y-grp" role="group" aria-labelledby="a11yL3"><span class="a11y-lbl" id="a11yL3">Изображения</span>
      <button type="button" data-a11y-set="img" data-v="on">Цветные</button><button type="button" data-a11y-set="img" data-v="gray">Ч/б</button><button type="button" data-a11y-set="img" data-v="off">Выкл</button></div>
    <div class="a11y-grp" role="group" aria-labelledby="a11yL4"><span class="a11y-lbl" id="a11yL4">Интервал между буквами</span>
      <button type="button" data-a11y-set="ls" data-v="1">Обычный</button><button type="button" data-a11y-set="ls" data-v="2">Средний</button><button type="button" data-a11y-set="ls" data-v="3">Большой</button></div>
    <div class="a11y-grp" role="group" aria-labelledby="a11yL5"><span class="a11y-lbl" id="a11yL5">Шрифт</span>
      <button type="button" data-a11y-set="font" data-v="sans">Без засечек</button><button type="button" data-a11y-set="font" data-v="serif" style="font-family:Georgia,'Times New Roman',serif">С засечками</button></div>
    <div class="a11y-end"><button type="button" data-a11y-reset>Сбросить настройки</button><button type="button" data-a11y-exit>Обычная версия</button></div>
  </div>
</div>
`;
  var EYE_HTML = `
<button type="button" class="a11y-eye" id="a11yEye" data-a11y-toggle title="Версия для слабовидящих" aria-label="Версия для слабовидящих" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3.2"/></svg></button>
`;

  function inject() {
    if (!document.querySelector('link[href="a11y.css"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = 'a11y.css';
      document.head.appendChild(l);
    }
    if (!document.getElementById('a11yBar')) {
      var t = document.createElement('div');
      t.innerHTML = BAR_HTML;
      document.body.insertBefore(t.firstElementChild, document.body.firstChild);
    }
    // на страницах с общей шапкой кнопка стоит в самой шапке, отдельно её создаём только там, где шапки нет
    if (!document.getElementById("a11yEye") && !document.getElementById("headerbar")) {
      var e = document.createElement('div');
      e.innerHTML = EYE_HTML;
      document.body.appendChild(e.firstElementChild);
    }
  }

  var KEY = 'a11y-settings';
  var DEF = { on: false, size: '2', scheme: 'bw', img: 'off', ls: '1', font: 'sans' };
  var st = load();

  function load() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    var o = {};
    for (var k in DEF) o[k] = (k === 'on' ? s.on === true : typeof s[k] === 'string' ? s[k] : DEF[k]);
    return o;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  // zoom не меняет ширину окна для media-запросов, поэтому удваиваем пороги ширины
  // (или умножаем на выбранный масштаб), чтобы адаптивная вёрстка срабатывала как при масштабе браузера
  function scaleRules(rules, f) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.type === 4 && r.media) {
        if (r.__a11yOrig === undefined) r.__a11yOrig = r.media.mediaText;
        r.media.mediaText = r.__a11yOrig.replace(/((?:min|max)-width:\s*)(\d+(?:\.\d+)?)px/g, function (m, p, n) {
          return p + (parseFloat(n) * f) + 'px';
        });
      }
      if (r.type === 4 && r.cssRules) scaleRules(r.cssRules, f);
    }
  }
  function scaleMedia(f) {
    for (var i = 0; i < document.styleSheets.length; i++) {
      try { scaleRules(document.styleSheets[i].cssRules, f); } catch (e) {}
    }
  }

  function apply() {
    var root = document.documentElement;
    scaleMedia(st.on ? parseFloat(st.size) : 1);
    if (st.on) {
      root.setAttribute('data-a11y', 'on');
      root.setAttribute('data-a-size', st.size);
      root.setAttribute('data-a-scheme', st.scheme);
      root.setAttribute('data-a-img', st.img);
      root.setAttribute('data-a-ls', st.ls);
      root.setAttribute('data-a-font', st.font);
    } else {
      ['data-a11y', 'data-a-size', 'data-a-scheme', 'data-a-img', 'data-a-ls', 'data-a-font'].forEach(function (a) { root.removeAttribute(a); });
    }
    var bar = document.getElementById('a11yBar');
    if (bar) {
      bar.hidden = !st.on;
      var btns = bar.querySelectorAll('[data-a11y-set]');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        b.setAttribute('aria-pressed', st[b.getAttribute('data-a11y-set')] === b.getAttribute('data-v') ? 'true' : 'false');
      }
    }
    var eye = document.getElementById('a11yEye');
    if (eye) {
      eye.setAttribute('aria-pressed', st.on ? 'true' : 'false');
      eye.title = st.on ? 'Обычная версия' : 'Версия для слабовидящих';
      eye.setAttribute('aria-label', eye.title);
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-a11y-toggle],[data-a11y-set],[data-a11y-reset],[data-a11y-exit]') : null;
    if (!t) return;
    if (t.hasAttribute('data-a11y-toggle')) {
      st.on = !st.on;
      save(); apply();
      if (st.on) window.scrollTo(0, 0); // панель настроек находится вверху страницы
      return;
    }
    if (t.hasAttribute('data-a11y-exit')) { st.on = false; }
    else if (t.hasAttribute('data-a11y-reset')) { var on = st.on; st = load(); for (var k in DEF) st[k] = DEF[k]; st.on = on; }
    else { st[t.getAttribute('data-a11y-set')] = t.getAttribute('data-v'); }
    save(); apply();
  });

  function start() { inject(); apply(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
