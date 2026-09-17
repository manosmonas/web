(function () {
  'use strict';

  function setupSwiper() {
    if (!window.customElements || !customElements.get('swiper-container')) return;

    var slides = Array.prototype.slice.call(document.querySelectorAll('swiper-slide'));
    if (!slides.length) return;

    // The Angular production bundle contains the slide elements but the
    // Swiper custom-element runtime was not being registered. Build the
    // missing container around the existing Angular-rendered slides.
    var groups = new Map();
    slides.forEach(function (slide) {
      if (slide.closest('swiper-container')) return;
      var parent = slide.parentElement;
      if (!parent) return;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(slide);
    });

    groups.forEach(function (groupSlides, parent) {
      if (groupSlides.length < 2) return;

      var container = document.createElement('swiper-container');
      container.setAttribute('slides-per-view', '1');
      container.setAttribute('space-between', '16');
      container.setAttribute('loop', 'true');
      container.setAttribute('navigation', 'true');
      container.setAttribute('pagination', 'true');
      container.setAttribute('pagination-clickable', 'true');
      container.setAttribute('autoplay-delay', '4000');
      container.setAttribute('autoplay-disable-on-interaction', 'false');
      container.style.display = 'block';
      container.style.width = '100%';

      var first = groupSlides[0];
      parent.insertBefore(container, first);
      groupSlides.forEach(function (slide) {
        container.appendChild(slide);
      });
    });
  }

  function start() {
    setupSwiper();
    if (document.body) {
      var observer = new MutationObserver(function () {
        setupSwiper();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(setupSwiper, 250);
      setTimeout(setupSwiper, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
