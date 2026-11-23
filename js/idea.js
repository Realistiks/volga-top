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

  // Конструктор промта капитана
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
      zone: 'HTML и разметка',
      constraints: 'Сохраняй семантику, вложенность тегов и структуру разделов. Атрибуты alt у фотографий обязательны.',
      tasks: {
        build: {
          label: 'Собрать HTML-блок',
          text: 'собрать новый HTML-блок и встроить его в страницу',
          steps: [
            'Опиши структуру и место блока среди существующих разделов',
            'Используй семантические теги и классы из уже существующих стилей',
            'Проверь вложенность и читаемость на ширине 375 px'
          ]
        },
        fix: {
          label: 'Исправить разметку',
          text: 'исправить недочёт в HTML-разметке',
          steps: [
            'Найди лишние или неправильно вложенные теги',
            'Предложи минимальную правку без переписывания соседних блоков',
            'Проверь, не сломались ли анимации появления'
          ]
        },
        adapt: {
          label: 'Адаптировать вёрстку',
          text: 'адаптировать разметку под мобильный экран',
          steps: [
            'Опиши порядок элементов в одну колонку',
            'Убери лишние обёртки, которые мешают адаптиву',
            'Проверь читаемость текста и размеры карточек'
          ]
        },
        review: {
          label: 'Проверить разметку',
          text: 'проверить разметку и подготовить объяснение для жюри',
          steps: [
            'Проверь семантику и иерархию заголовков',
            'Проверь атрибуты alt у всех фотографий',
            'Объясни, что именно ты исправил и почему'
          ]
        }
      }
    },
    andrey: {
      name: 'Андрей',
      zone: 'стили и цветовая гамма',
      constraints: 'Держись палитры из CSS-переменных: --bg, --card, --accent, --blue. Проверяй контраст текста.',
      tasks: {
        build: {
          label: 'Добавить стили блоку',
          text: 'добавить стили для нового блока страницы',
          steps: [
            'Подбери цвета из переменных --accent и --blue',
            'Добавь состояние наведения и плавный переход',
            'Проверь контраст и отступы на тёмном фоне'
          ]
        },
        fix: {
          label: 'Исправить визуал',
          text: 'исправить визуальный недочёт в стилях',
          steps: [
            'Опиши, какая деталь выглядит неправильно',
            'Исправь цвет, отступ или радиус, не затрагивая соседние блоки',
            'Сверь результат с общей палитрой сайта'
          ]
        },
        adapt: {
          label: 'Подогнать под мобильный',
          text: 'адаптировать стили под узкий экран',
          steps: [
            'Проверь медиазапросы на 900 и 760 px',
            'Убедись, что карточки идут в одну колонку',
            'Проверь, что текст не обрезается'
          ]
        },
        review: {
          label: 'Проверить палитру',
          text: 'проверить стили и объяснить выбор цветов',
          steps: [
            'Назови использованные переменные цвета',
            'Проверь состояния наведения и фокуса',
            'Объясни, почему палитра остаётся цельной'
          ]
        }
      }
    },
    nikita: {
      name: 'Никита',
      zone: 'шрифты и дизайн',
      constraints: 'Используй Manrope для текста и Unbounded для заголовков. Сохраняй иерархию h1, h2, h3.',
      tasks: {
        build: {
          label: 'Оформить типографику',
          text: 'оформить новый блок типографикой',
          steps: [
            'Выбери начертание из подключённых шрифтов',
            'Выстрой иерархию заголовков и подписей',
            'Проверь межстрочный интервал и ритм блока'
          ]
        },
        fix: {
          label: 'Исправить шрифты',
          text: 'исправить недочёт в типографике',
          steps: [
            'Найди элемент с неподходящим кеглем или начертанием',
            'Исправь, сохранив стиль соседних разделов',
            'Проверь читаемость на телефоне'
          ]
        },
        adapt: {
          label: 'Подогнать дизайн',
          text: 'подогнать типографику под мобильный экран',
          steps: [
            'Уменьши размеры заголовков для узкого экрана',
            'Сохрани иерархию и абзацы',
            'Проверь, что строки не обрезаются'
          ]
        },
        review: {
          label: 'Проверить дизайн',
          text: 'проверить визуальный стиль и подготовить объяснение',
          steps: [
            'Сверь шрифты с остальной страницей',
            'Оцени цельность карточек и отступов',
            'Объясни, что можно развить дальше'
          ]
        }
      }
    },
    masha: {
      name: 'Маша',
      zone: 'видеодемонстрация и визитка',
      constraints: 'Проверяй материал без громкого звука. Длительность демо 1-2 минуты, в кадре видны все участники.',
      tasks: {
        build: {
          label: 'Записать демо сайта',
          text: 'записать видеодемонстрацию сайта',
          steps: [
            'Покажи прокрутку и появление участников с боков',
            'Покажи чат и один базовый ответ',
            'Запиши без резких звуков и проверь кадр'
          ]
        },
        fix: {
          label: 'Перезаписать фрагмент',
          text: 'перезаписать неудачный фрагмент видео',
          steps: [
            'Найди момент, который нужно повторить',
            'Запиши его заново с тем же ракурсом',
            'Проверь, что нет внезапных громких сигналов'
          ]
        },
        adapt: {
          label: 'Снять визитку',
          text: 'подготовить видео-визитку команды',
          steps: [
            'Напиши короткий сценарий на всех пятерых',
            'Сними по одному кадру на каждого участника',
            'Собери финальный клип и проверь длительность'
          ]
        },
        review: {
          label: 'Проверить видео',
          text: 'проверить готовые видео перед сдачей',
          steps: [
            'Проверь, что демо показывает ключевые блоки',
            'Убедись, что лица и подписи читаемы',
            'Проверь отсутствие громкого звука'
          ]
        }
      }
    },
    captain: {
      name: 'капитан',
      zone: 'интеграция и сдача работ',
      constraints: 'Не передавай ИИ пароли, ключи и персональные данные. Раскрытие ИИ уже в README, обновляй его при новых инструментах.',
      tasks: {
        build: {
          label: 'Собрать релиз',
          text: 'собрать рабочую версию сайта из правок команды',
          steps: [
            'Сведи изменения Ильнура, Андрея, Никиты и Маши',
            'Проверь адаптив и все ссылки',
            'Сделай коммит и отправь в репозиторий'
          ]
        },
        fix: {
          label: 'Проверить мост',
          text: 'проверить удалённый мост и чат с агентом',
          steps: [
            'Проверь endpoint в js/config.js',
            'Проверь фильтр вопросов по теме команды',
            'Проверь, что базовые ответы работают без сервера'
          ]
        },
        adapt: {
          label: 'Подготовить сдачу',
          text: 'подготовить полный комплект отборочного этапа',
          steps: [
            'Собери прототип, код и оба видео',
            'Проверь README на раскрытие ИИ по пункту 9.2',
            'Отправь материалы до 27 ноября 23:59 МСК'
          ]
        },
        review: {
          label: 'Подготовить защиту',
          text: 'подготовить команду к защите решения',
          steps: [
            'Проверь, что каждый объясняет свою часть',
            'Подготовь ответы по четырём критериям оценки',
            'Отметь идеи для развития решения'
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
