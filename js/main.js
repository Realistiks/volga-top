// Появление элементов при прокрутке: капитан в центре, участники с боков по двое
(function () {
  'use strict';

  var items = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
  }

  // Полноэкранный просмотр фотографий
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

  Array.prototype.forEach.call(document.querySelectorAll('.zoomable'), function (img) {
    img.addEventListener('click', function () { openLightbox(img); });
    img.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(img);
      }
    });
  });

  lightbox.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
})();
