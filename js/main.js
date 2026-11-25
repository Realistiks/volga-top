// Появление элементов при прокрутке и полноэкранный просмотр фотографий
(function () {
  'use strict';

  var observer = null;

  function initReveals() {
    var items = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
  }

  // Карточки команды рендерятся из js/data.js, поэтому observer обновляется после вставки
  window.refreshReveals = initReveals;
  initReveals();

  // Полноэкранный просмотр фотографий, в том числе динамически добавленных
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');

  function openLightbox(img) {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('open');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightboxImg.src = '';
  }

  document.addEventListener('click', function (event) {
    var img = event.target.closest ? event.target.closest('.zoomable') : null;
    if (img) openLightbox(img);
  });

  document.addEventListener('keydown', function (event) {
    var img = event.target.closest ? event.target.closest('.zoomable') : null;
    if (img && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openLightbox(img);
      return;
    }
    if (event.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });

  lightbox.addEventListener('click', closeLightbox);
})();
