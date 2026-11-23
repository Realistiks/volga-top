// Чат с ИИ-агентом команды через локальный мост bot/bridge.py
(function () {
  'use strict';

  var LOCAL = location.protocol === 'http:' &&
    (location.hostname === '127.0.0.1' || location.hostname === 'localhost');
  var ENDPOINT = window.CHAT_ENDPOINT || (LOCAL ? '' : 'http://127.0.0.1:8765');

  var panel = document.getElementById('chat-panel');
  var toggle = document.getElementById('chat-toggle');
  var closeBtn = document.getElementById('chat-close');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var log = document.getElementById('chat-log');
  var chips = document.querySelectorAll('.chat-chip');
  var typing = document.getElementById('chat-typing');

  if (!panel || !toggle || !form || !input || !log) return;

  function setOpen(open) {
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      input.focus();
      log.scrollTop = log.scrollHeight;
    }
  }

  function addMessage(kind, text) {
    var bubble = document.createElement('div');
    bubble.className = 'bubble ' + kind;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function setTyping(on) {
    typing.classList.toggle('show', on);
    if (on) log.scrollTop = log.scrollHeight;
  }

  async function ask(question) {
    var text = String(question || '').trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    setTyping(true);

    try {
      var response = await fetch(ENDPOINT + '/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text })
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var data = await response.json();
      addMessage('bot', data.answer || 'Пустой ответ агента.');
    } catch (error) {
      addMessage('bot', 'Удалённый чат неактивен.');
    } finally {
      setTyping(false);
    }
  }

  toggle.addEventListener('click', function () {
    setOpen(!panel.classList.contains('open'));
  });
  closeBtn.addEventListener('click', function () { setOpen(false); });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    ask(input.value);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && panel.classList.contains('open')) setOpen(false);
  });

  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () { ask(chip.textContent.trim()); });
  });
})();
