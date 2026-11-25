// Рендер карточек участников из window.TEAM_DATA
(function () {
  'use strict';

  var grid = document.getElementById('team-grid');
  var data = window.TEAM_DATA;
  if (!grid || !data || !data.members) return;

  var contactUrl = data.contact ? data.contact.url : '';
  var contactLabel = data.contact ? data.contact.label : '';

  data.members.forEach(function (member, index) {
    var card = document.createElement('article');
    card.className = 'member-card reveal ' + (index % 2 === 0 ? 'from-left' : 'from-right');
    if (index === data.members.length - 1 && data.members.length % 2 === 1) {
      card.classList.add('team-wide');
    }

    var img = document.createElement('img');
    img.className = 'zoomable';
    img.src = member.photo;
    img.alt = member.name;
    img.width = member.width;
    img.height = member.height;
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Увеличить фотографию ' + member.name);
    if (member.position) img.style.objectPosition = member.position;

    var text = document.createElement('div');
    text.className = 'member-text';

    var post = document.createElement('span');
    post.className = 'post';
    post.textContent = member.role;

    var name = document.createElement('h3');
    name.textContent = member.name;

    var group = document.createElement('p');
    group.className = 'member-group';
    group.textContent = 'Группа: ' + member.group;

    var note = document.createElement('p');
    note.textContent = member.note;

    var stack = document.createElement('div');
    stack.className = 'stack';
    member.skills.forEach(function (skill) {
      var chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = skill;
      stack.appendChild(chip);
    });

    if (contactUrl) {
      var link = document.createElement('a');
      link.className = 'chip member-contact';
      link.href = contactUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Связаться ↗';
      link.title = contactLabel;
      stack.appendChild(link);
    }

    text.appendChild(post);
    text.appendChild(name);
    text.appendChild(group);
    text.appendChild(note);
    text.appendChild(stack);
    card.appendChild(img);
    card.appendChild(text);
    grid.appendChild(card);
  });

  if (window.refreshReveals) window.refreshReveals();
})();
