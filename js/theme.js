// Переключатель темы. По умолчанию всегда тёмная, выбор не сохраняется.
(function () {
  'use strict';

  var root = document.documentElement;
  var button = document.getElementById('theme-toggle');
  if (!button) return;

  function updateButton() {
    var light = root.getAttribute('data-theme') === 'light';
    button.setAttribute('aria-pressed', String(light));
    button.setAttribute('aria-label', light ? 'Включить тёмную тему' : 'Включить светлую тему');
    button.title = light ? 'Тёмная тема' : 'Светлая тема';
  }

  updateButton();

  button.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#ffffff' : '#0d1117');
    updateButton();
  });
})();
