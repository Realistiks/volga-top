// Партиклы за курсором: лёгкий светящийся шлейф в цветах команды
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.getElementById('particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var width = 0;
  var height = 0;
  var dots = [];
  var colors = ['#3fb950', '#58a6ff', '#e6edf3'];
  var last = { x: -100, y: -100 };

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y) {
    for (var i = 0; i < 2; i += 1) {
      dots.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7 - 0.15,
        life: 1,
        size: 1.2 + Math.random() * 2.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    if (dots.length > 180) dots = dots.slice(-180);
  }

  function onMove(x, y) {
    if (Math.hypot(x - last.x, y - last.y) > 9) {
      spawn(x, y);
      last.x = x;
      last.y = y;
    }
  }

  window.addEventListener('mousemove', function (event) {
    onMove(event.clientX, event.clientY);
  });

  window.addEventListener('touchmove', function (event) {
    if (!event.touches.length) return;
    onMove(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('resize', resize);
  resize();

  function frame() {
    ctx.clearRect(0, 0, width, height);
    dots = dots.filter(function (dot) { return dot.life > 0; });

    dots.forEach(function (dot) {
      dot.x += dot.vx;
      dot.y += dot.vy;
      dot.vy += 0.006;
      dot.life -= 0.014;
      ctx.globalAlpha = Math.max(dot.life, 0) * 0.75;
      ctx.fillStyle = dot.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = dot.color;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size * Math.max(dot.life, 0.2), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    window.requestAnimationFrame(frame);
  }

  frame();
})();
