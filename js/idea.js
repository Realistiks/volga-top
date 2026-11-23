// Обратный отсчёт, конструктор промта и статус связи с агентом
(function () {
  'use strict';

  var LOCAL = location.protocol === 'http:' &&
    (location.hostname === '127.0.0.1' || location.hostname === 'localhost');
  var ENDPOINT = window.CHAT_ENDPOINT || (LOCAL ? '' : 'http://127.0.0.1:8765');

  // Обратный отсчёт до сдачи отборочного этапа, 27 ноября 23:59 МСК
  var countdown = document.getElementById('countdown');
  if (countdown) {
    var deadline = new Date('2026-11-27T23:59:00+03:00').getTime();
    function tick() {
      var diff = deadline - Date.now();
      if (diff <= 0) {
        countdown.textContent = 'Отборочный этап: срок сдачи прошёл';
        return;
      }
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var minutes = Math.floor((diff % 3600000) / 60000);
      countdown.textContent = 'До сдачи работ: ' + days + ' д ' +
        String(hours).padStart(2, '0') + ' ч ' + String(minutes).padStart(2, '0') + ' м';
    }
    tick();
    window.setInterval(tick, 30000);
  }

  // Статус локального моста и ИИ-агента
  var status = document.getElementById('chat-status');
  if (status) {
    function setStatus(label, active) {
      status.innerHTML = '<i></i> ' + label;
      status.classList.toggle('active', Boolean(active));
    }
    async function refreshStatus() {
      try {
        var response = await fetch(ENDPOINT + '/health', { cache: 'no-store' });
        if (!response.ok) throw new Error('health failed');
        var data = await response.json();
        setStatus(
          data.active ? 'Агент на связи' : 'Удалённый чат неактивен',
          Boolean(data.active)
        );
      } catch (error) {
        setStatus('Удалённый чат неактивен', false);
      }
    }
    refreshStatus();
    window.setInterval(refreshStatus, 15000);
  }

  // Конструктор промта капитана
  var roleSelect = document.getElementById('prompt-role');
  var taskSelect = document.getElementById('prompt-task');
  var output = document.getElementById('prompt-output');
  var buildBtn = document.getElementById('prompt-build');
  var copyBtn = document.getElementById('prompt-copy');
  var hint = document.getElementById('prompt-hint');

  if (!roleSelect || !taskSelect || !output || !buildBtn) return;

  var roles = {
    ilnur: { name: 'Ильнур', zone: 'HTML и разметка' },
    andrey: { name: 'Андрей', zone: 'стили и цветовая гамма' },
    nikita: { name: 'Никита', zone: 'шрифты и дизайн' },
    masha: { name: 'Маша', zone: 'видеодемонстрация и визитка' },
    captain: { name: 'капитан', zone: 'интеграция и сдача работ' }
  };

  var tasks = {
    build: {
      text: 'собрать новый блок страницы',
      steps: [
        'Опиши структуру блока и его место среди существующих разделов',
        'Сделай заготовку в своей зоне ответственности',
        'Проверь, как блок выглядит на ширине 375 px'
      ]
    },
    fix: {
      text: 'исправить замеченный недочёт',
      steps: [
        'Сформулируй, что именно выглядит неправильно',
        'Предложи минимальное исправление без переписывания соседних блоков',
        'Проверь, не сломалось ли соседнее состояние'
      ]
    },
    adapt: {
      text: 'адаптировать блок под мобильный экран',
      steps: [
        'Укажи, какие элементы перестраиваются при ширине меньше 760 px',
        'Предложи порядок элементов в одну колонку',
        'Проверь читаемость текста и размеры карточек'
      ]
    },
    review: {
      text: 'проверить результат и подготовить объяснение для жюри',
      steps: [
        'Назови, что сделано именно в твоей зоне',
        'Объясни, почему выбран такой способ',
        'Отметь, что можно развить дальше'
      ]
    }
  };

  function buildPrompt() {
    var role = roles[roleSelect.value];
    var task = tasks[taskSelect.value];
    output.value =
      'Ты - ' + role.name + ', участник команды 322. Твоя зона: ' + role.zone + '.\n' +
      'Задача: ' + task.text + '.\n\n' +
      'Что сделать:\n' +
      task.steps.map(function (step, index) { return (index + 1) + '. ' + step; }).join('\n') + '\n\n' +
      'Ограничения: сохраняй тёмную тему и зелёный акцент сайта, проверяй адаптив на 375 px, ' +
      'не оставляй сгенерированный результат без содержательной правки.\n' +
      'В конце коротко объясни, что именно ты изменил(а), чтобы команда могла рассказать это жюри.';
    if (hint) hint.textContent = 'Заготовка готова - проверь её и добавь свои детали';
  }

  buildBtn.addEventListener('click', buildPrompt);
  buildPrompt();

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = output.value;
      function fallback() {
        output.focus();
        output.select();
        try {
          document.execCommand('copy');
          if (hint) hint.textContent = 'Скопировано';
        } catch (error) {
          if (hint) hint.textContent = 'Выделите текст и скопируйте вручную';
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          if (hint) hint.textContent = 'Скопировано';
        }).catch(fallback);
      } else {
        fallback();
      }
    });
  }
})();
