// Единый источник данных об участниках. Разметка карточек строится из этого объекта.
window.TEAM_DATA = {
  name: 'St.Code',
  motto: 'Пять человек. Один репозиторий. Общий результат.',
  contact: {
    label: 'Написать команде в GitHub Issues',
    url: 'https://github.com/Realistiks/volga-top/issues'
  },
  members: [
    {
      name: 'Ильнур Рахматуллин',
      role: 'Капитан',
      group: '861-ТОП862',
      photo: 'assets/img/ilnur.jpg',
      width: 896,
      height: 1200,
      position: 'center top',
      note: 'Координирует команду, распределяет задачи и сдаёт материалы.',
      skills: ['Координация', 'Сдача работ']
    },
    {
      name: 'Кирилл Колесников',
      role: 'Программист, агентный разработчик',
      group: '861-ТОП862',
      photo: 'assets/img/kirill.jpg',
      width: 1280,
      height: 853,
      note: 'Пишет код сайта и мост к ИИ-агенту, собирает прототип.',
      skills: ['Python', 'ИИ-агент']
    },
    {
      name: 'Андрей Иванов',
      role: 'Монтаж',
      group: '861-ТОП862',
      photo: 'assets/img/andrey.jpg',
      width: 900,
      height: 1200,
      position: 'center top',
      note: 'Собирает финальные видео: склейка, переходы и оформление демонстрации.',
      skills: ['Монтаж', 'Видео']
    },
    {
      name: 'Мария Федорова',
      role: 'Режиссёр',
      group: '861-ТОП242',
      photo: 'assets/img/masha.jpg',
      width: 853,
      height: 1280,
      note: 'Придумывает сценарий и ставит кадр для демонстрации и визитки.',
      skills: ['Сценарий', 'Режиссура']
    },
    {
      name: 'Никита Роменский',
      role: 'Целостность и аудит сайта',
      group: '861-ТОП862',
      photo: 'assets/img/nikita.jpg',
      width: 709,
      height: 945,
      note: 'Проверяет сайт на ошибки и сверяет решение с требованиями перед сдачей.',
      skills: ['Аудит', 'Проверки']
    }
  ]
};
