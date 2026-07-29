// Lightweight, dependency-free lightbox for the Gallery page.
// Click a photo to enlarge it; use the on-screen arrows, the keyboard
// arrow keys, or Escape to navigate/close.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  if (!items.length) return;

  var lightbox = document.getElementById('lightbox');
  var img = document.getElementById('lightbox-img');
  var btnClose = lightbox.querySelector('.lightbox-close');
  var btnPrev = lightbox.querySelector('.lightbox-prev');
  var btnNext = lightbox.querySelector('.lightbox-next');
  var current = 0;

  function show(index) {
    current = (index + items.length) % items.length;
    var link = items[current];
    img.src = link.getAttribute('href');
    img.alt = link.querySelector('img').alt || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.hidden = true;
    img.src = '';
    document.body.style.overflow = '';
  }

  items.forEach(function (link, index) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      show(index);
    });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function () { show(current - 1); });
  btnNext.addEventListener('click', function () { show(current + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();
