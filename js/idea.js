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
    window.addEventListener('chat-opened', refreshStatus);
  }

  // Конструктор промта: у каждого участника свои задачи и ограничения
  var roleSelect = document.getElementById('prompt-role');
  var taskSelect = document.getElementById('prompt-task');
  var output = document.getElementById('prompt-output');
  var buildBtn = document.getElementById('prompt-build');
  var copyBtn = document.getElementById('prompt-copy');
  var hint = document.getElementById('prompt-hint');

  if (!roleSelect || !taskSelect || !output || !buildBtn) return;

  var roles = {
    ilnur: {
      name: 'Ильнур',
      zone: 'капитан, координация команды',
      constraints: 'Сверяй сроки и комплектность материалов. Не меняй код без согласования с Кириллом.',
      tasks: {
        build: {
          label: 'Спланировать этап',
          text: 'спланировать работу команды на ближайший этап',
          steps: [
            'Разложи задание на зоны всех участников',
            'Назначь ответственного и контрольный срок',
            'Проверь, что у каждого есть понятный результат'
          ]
        },
        fix: {
          label: 'Устранить расхождение',
          text: 'устранить расхождение между задачами участников',
          steps: [
            'Найди, где действия участников конфликтуют',
            'Сформулируй одно решение без переписывания всей работы',
            'Сообщи команде об изменении'
          ]
        },
        adapt: {
          label: 'Перераспределить задачи',
          text: 'перераспределить задачи перед сдачей',
          steps: [
            'Оцени, какие работы остались незавершёнными',
            'Переназначь их с учётом загрузки',
            'Обнови сроки и проверь комплектность'
          ]
        },
        review: {
          label: 'Проверить сдачу',
          text: 'проверить комплектность материалов перед отправкой',
          steps: [
            'Сверься со списком: прототип, код, два видео, описание',
            'Проверь раскрытие ИИ в README',
            'Подтверди готовность к отправке до 23:59 МСК'
          ]
        }
      }
    },
    kirill: {
      name: 'Кирилл',
      zone: 'программист и агентный разработчик',
      constraints: 'Не передавай ИИ пароли, ключи и персональные данные. Раскрытие ИИ уже оформлено в README.',
      tasks: {
        build: {
          label: 'Написать модуль',
          text: 'написать новый модуль сайта или моста',
          steps: [
            'Опиши входные данные и ожидаемый результат',
            'Напиши код в своей зоне ответственности',
            'Проверь работу локально и в браузере'
          ]
        },
        fix: {
          label: 'Исправить баг',
          text: 'исправить ошибку в коде сайта или моста',
          steps: [
            'Воспроизведи проблему и опиши симптом',
            'Исправь минимальным изменением',
            'Проверь, что соседние функции не сломались'
          ]
        },
        adapt: {
          label: 'Подключить агента',
          text: 'адаптировать мост или чат под новый режим',
          steps: [
            'Проверь endpoint в js/config.js',
            'Проверь фильтр вопросов и базовые ответы',
            'Убедись, что неактивный режим выдаёт понятное сообщение'
          ]
        },
        review: {
          label: 'Проверить код',
          text: 'проверить код и подготовить объяснение',
          steps: [
            'Назови изменённые файлы и их назначение',
            'Объясни, почему выбран такой способ',
            'Отметь, что можно развить дальше'
          ]
        }
      }
    },
    andrey: {
      name: 'Андрей',
      zone: 'монтаж видео',
      constraints: 'Не добавляй внезапные громкие звуки. Проверяй финальный кадр и длительность.',
      tasks: {
        build: {
          label: 'Собрать монтаж',
          text: 'собрать монтаж видеодемонстрации',
          steps: [
            'Отбери удачные дубли по сценарию Маши',
            'Склей эпизоды и добавь переходы',
            'Проверь общую длительность 1-2 минуты'
          ]
        },
        fix: {
          label: 'Пересобрать фрагмент',
          text: 'пересобрать неудачный фрагмент видео',
          steps: [
            'Найди момент с ошибкой или лишней паузой',
            'Замени его на чистый дубль',
            'Проверь стыки соседних сцен'
          ]
        },
        adapt: {
          label: 'Подогнать под экран',
          text: 'подготовить видео для просмотра на телефоне',
          steps: [
            'Проверь кадрирование на узком экране',
            'Убедись, что подписи читаемы',
            'Сохрани финальную версию без лишнего шума'
          ]
        },
        review: {
          label: 'Проверить видео',
          text: 'проверить смонтированное видео перед сдачей',
          steps: [
            'Просмотри ролик целиком',
            'Проверь отсутствие резких звуков',
            'Подтверди Маше готовность финала'
          ]
        }
      }
    },
    masha: {
      name: 'Маша',
      zone: 'режиссура видео',
      constraints: 'Сценарий короткий, без резких звуков, все участники должны быть видны в кадре.',
      tasks: {
        build: {
          label: 'Написать сценарий',
          text: 'написать сценарий видеодемонстрации',
          steps: [
            'Выдели три главных момента сайта для показа',
            'Распредели реплики между участниками',
            'Отдай сценарий Андрею для съёмки и монтажа'
          ]
        },
        fix: {
          label: 'Переснять сцену',
          text: 'переснять неудачную сцену',
          steps: [
            'Объясни, что именно не работает в кадре',
            'Повтори дубль с той же позицией камеры',
            'Проверь, что звук остался спокойным'
          ]
        },
        adapt: {
          label: 'Снять визитку',
          text: 'поставить кадр для видео-визитки команды',
          steps: [
            'Определи порядок выхода участников',
            'Проверь свет и фон для каждого кадра',
            'Передай материал в монтаж Андрею'
          ]
        },
        review: {
          label: 'Проверить кадр',
          text: 'проверить итоговое видео как режиссёр',
          steps: [
            'Сверь ролик со сценарием',
            'Оцени, видны ли все участники',
            'Согласуй финальную версию с капитаном'
          ]
        }
      }
    },
    nikita: {
      name: 'Никита',
      zone: 'проверка целостности и аудит сайта',
      constraints: 'Сверяйся с требованиями хакатона и README, фиксируй каждый найденный недочёт.',
      tasks: {
        build: {
          label: 'Составить чек-лист',
          text: 'составить чек-лист аудита сайта',
          steps: [
            'Включи проверку разделов, ссылок и фотографий',
            'Добавь проверку адаптива на 375 px',
            'Добавь пункт по раскрытию ИИ в README'
          ]
        },
        fix: {
          label: 'Исправить недочёт',
          text: 'исправить найденный недочёт сайта',
          steps: [
            'Опиши, где именно нарушена целостность',
            'Исправь или передай Кириллу, если это код',
            'Повторно проверь этот же блок'
          ]
        },
        adapt: {
          label: 'Проверить адаптив',
          text: 'проверить сайт на мобильном экране',
          steps: [
            'Открой страницу на ширине 375 px',
            'Проверь карточки команды и чат',
            'Зафиксируй всё, что ломается'
          ]
        },
        review: {
          label: 'Провести аудит',
          text: 'провести финальный аудит перед сдачей',
          steps: [
            'Пройди по чек-листу от начала до конца',
            'Сверь материалы с требованиями положения',
            'Передай отчёт капитану Ильнуру'
          ]
        }
      }
    }
  };

  function refreshTasks() {
    var role = roles[roleSelect.value];
    taskSelect.innerHTML = '';
    Object.keys(role.tasks).forEach(function (key) {
      var option = document.createElement('option');
      option.value = key;
      option.textContent = role.tasks[key].label;
      taskSelect.appendChild(option);
    });
  }

  function buildPrompt() {
    var role = roles[roleSelect.value];
    var task = role.tasks[taskSelect.value] || role.tasks.build;
    output.value =
      'Ты - ' + role.name + ', участник команды 322. Твоя зона: ' + role.zone + '.\n' +
      'Задача: ' + task.text + '.\n\n' +
      'Что сделать:\n' +
      task.steps.map(function (step, index) { return (index + 1) + '. ' + step; }).join('\n') + '\n\n' +
      'Ограничения: ' + role.constraints + '\n' +
      'Не оставляй сгенерированный результат без содержательной правки.\n' +
      'В конце коротко объясни, что именно ты изменил(а), чтобы команда могла рассказать это жюри.';
    if (hint) hint.textContent = 'Заготовка для ' + role.name + ' готова - проверь и добавь детали';
  }

  roleSelect.addEventListener('change', function () {
    refreshTasks();
    buildPrompt();
  });
  taskSelect.addEventListener('change', buildPrompt);
  buildBtn.addEventListener('click', buildPrompt);
  refreshTasks();
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
