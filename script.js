/* ===================================================================
   IRONSIDE AI
   ~2 KB, no dependencies. All of it is progressive enhancement:
   with JavaScript off the page still renders and reads correctly.
   =================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- mobile nav ---------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navList   = document.getElementById('navList');

  if (navToggle && navList) {
    var setNav = function (open) {
      navList.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    navList.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
  }

  /* --- header gets a border once you leave the hero ------------------ */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- hero sizing: one screen, minus the header --------------------- */
  var hero = document.querySelector('.hero');
  var measure = function () {
    var h = 0;
    if (header) {
      var pos = getComputedStyle(header).position;
      if (pos !== 'fixed' && pos !== 'absolute') h = header.offsetHeight;
    }
    document.documentElement.style.setProperty('--header-h', h + 'px');
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });

  /* --- scroll reveals ------------------------------------------------
     Elements start at .reveal and get .is-in once, on first sight.
     If IntersectionObserver is missing, everything is simply shown.  */
  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) { /* nothing to do */ }
  else if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '240px 0px 0px 0px', threshold: 0 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });

    /* Safety net: whatever happens — a stalled observer, an odd browser,
       a headless screenshot — nothing on this page stays invisible. */
    setTimeout(function () {
      Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
    }, 2500);
  }

  /* --- hero graph parallax -------------------------------------------
     Pointer position is written once per frame as two custom properties;
     the CSS multiplies them by each layer's own --depth, which is what
     produces the sense of depth between the three layers.            */
  var field = document.querySelector('.hero-field');
  if (hero && field && !reduced && window.matchMedia('(hover: hover)').matches) {
    var x = 0, y = 0, queued = false;

    var apply = function () {
      queued = false;
      field.style.setProperty('--mx', x.toFixed(3));
      field.style.setProperty('--my', y.toFixed(3));
    };

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width  - 0.5) * 2;   // -1 … 1
      y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      if (!queued) { queued = true; requestAnimationFrame(apply); }
    }, { passive: true });

    hero.addEventListener('mouseleave', function () {
      x = 0; y = 0;
      if (!queued) { queued = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  /* --- pause the graph while the hero is off screen ------------------ */
  if (field && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var state = entry.isIntersecting ? '' : 'paused';
        field.style.animationPlayState = state;
        Array.prototype.forEach.call(field.querySelectorAll('*'), function (el) {
          el.style.animationPlayState = state;
        });
      });
    }, { threshold: 0 }).observe(field);
  }

  /* --- footer year ---------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
