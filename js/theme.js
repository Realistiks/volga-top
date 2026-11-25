// Переключение светлой и тёмной темы с сохранением выбора
(function () {
  'use strict';

  var root = document.documentElement;
  var button = document.getElementById('theme-toggle');

  function updateButton() {
    if (!button) return;
    var light = root.getAttribute('data-theme') === 'light';
    button.setAttribute('aria-pressed', String(light));
    button.title = light ? 'Тёмная тема' : 'Светлая тема';
    button.setAttribute('aria-label', light ? 'Включить тёмную тему' : 'Включить светлую тему');
  }

  updateButton();

  if (!button) return;

  button.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('stcode-theme', next); } catch (error) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#ffffff' : '#0d1117');
    updateButton();
  });
})();
