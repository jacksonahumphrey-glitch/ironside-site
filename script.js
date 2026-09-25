/* ===================================================================
   IRONSIDE AI
   No dependencies. All of it is progressive enhancement: with
   JavaScript off the page still renders and reads correctly.
   =================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

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
    document.addEventListener('click', function (e) {
      if (navToggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.main-nav')) setNav(false);
    });
  }

  /* --- header gets a border once you leave the top -------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- header height, for the hero and anchor offsets ----------------- */
  var measure = function () {
    var h = header ? header.offsetHeight : 0;
    document.documentElement.style.setProperty('--header-h', h + 'px');
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });

  /* --- scroll reveals ------------------------------------------------
     Elements start at .reveal and get .is-in once, on first sight.
     If IntersectionObserver is missing, everything is simply shown.  */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduced || !hasIO) {
      each(reveals, function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '240px 0px 0px 0px', threshold: 0 });
      each(reveals, function (el) { io.observe(el); });

      /* Safety net: whatever happens — a stalled observer, an odd browser,
         a headless screenshot — nothing on this page stays invisible. */
      setTimeout(function () {
        each(reveals, function (el) { el.classList.add('is-in'); });
      }, 2500);
    }
  }

  /* --- hero graph parallax -------------------------------------------
     Pointer position is written once per frame as two custom properties;
     the CSS multiplies them by each layer's own --depth.              */
  var hero  = document.querySelector('.hero');
  var field = document.querySelector('.hero-field');
  if (hero && field && !reduced && finePointer) {
    var px = 0, py = 0, queued = false;
    var apply = function () {
      queued = false;
      field.style.setProperty('--mx', px.toFixed(3));
      field.style.setProperty('--my', py.toFixed(3));
    };
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width  - 0.5) * 2;   // -1 … 1
      py = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      if (!queued) { queued = true; requestAnimationFrame(apply); }
    }, { passive: true });
    hero.addEventListener('mouseleave', function () {
      px = 0; py = 0;
      if (!queued) { queued = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  /* --- pause the graph while the hero is off screen ------------------ */
  if (field && hasIO) {
    var animated = field.querySelectorAll('*');
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var state = entry.isIntersecting ? '' : 'paused';
        field.style.animationPlayState = state;
        each(animated, function (el) { el.style.animationPlayState = state; });
      });
    }, { threshold: 0 }).observe(field);
  }

  /* --- the call card: plays an example call, on a loop ----------------
     Without JS (or with reduced motion) the card simply shows the
     finished call. With JS it replays while it's on screen.          */
  var card = document.getElementById('callCard');
  var visual = document.getElementById('heroVisual');
  if (card && visual && !reduced) {
    var msgs    = card.querySelectorAll('.msg');
    var results = card.querySelectorAll('.cc-result');
    var chips   = visual.querySelectorAll('.float-chip');
    var thread  = card.querySelector('.cc-thread');
    var pill    = card.querySelector('.cc-pill-text');
    var timerEl = card.querySelector('.cc-timer');
    var FINAL   = { pill: pill ? pill.textContent : '', timer: timerEl ? timerEl.textContent : '' };

    var run = 0, timers = [], ticker = null, playing = false;

    var later = function (fn, ms, id) {
      timers.push(setTimeout(function () { if (id === run) fn(); }, ms));
    };
    var stopAll = function () {
      run++;
      timers.forEach(clearTimeout); timers = [];
      clearInterval(ticker); ticker = null;
      playing = false;
    };
    var fmt = function (sec) {
      var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    };
    var setPill = function (text) { if (pill) pill.textContent = text; };

    // Reserve the finished height so the card never jumps as lines arrive.
    var lockHeight = function () {
      var wasAnim = card.classList.contains('is-anim');
      card.classList.remove('is-anim');
      thread.style.minHeight = '';
      var resultsBox = card.querySelector('.cc-results');
      var h = thread.offsetHeight;
      var rh = resultsBox ? resultsBox.offsetHeight : 0;
      thread.style.minHeight = h + 'px';
      if (resultsBox) resultsBox.style.minHeight = rh + 'px';
      if (wasAnim) card.classList.add('is-anim');
    };

    var showFinal = function () {
      stopAll();
      card.classList.remove('is-anim');
      visual.classList.remove('is-anim');
      card.setAttribute('data-state', 'done');
      each(msgs, function (m) { m.classList.remove('is-typing'); });
      setPill(FINAL.pill);
      if (timerEl) timerEl.textContent = FINAL.timer;
    };

    var play = function () {
      stopAll();
      var id = run;
      playing = true;
      each(msgs, function (m) { m.classList.remove('is-typing'); });
      lockHeight();
      card.classList.add('is-anim');
      visual.classList.add('is-anim');
      each(msgs, function (m) { m.classList.remove('is-shown', 'is-typing'); });
      each(results, function (r) { r.classList.remove('is-shown'); });
      each(chips, function (c) { c.classList.remove('is-shown'); });
      card.setAttribute('data-state', 'ringing');
      setPill('Ringing');
      if (timerEl) timerEl.textContent = '00:00';

      later(function () {
        card.setAttribute('data-state', 'live');
        setPill('Live');
        var t0 = Date.now();
        ticker = setInterval(function () {
          if (timerEl) timerEl.textContent = fmt((Date.now() - t0) / 1000 * 4.6);
        }, 250);
      }, 1000, id);

      var t = 1350;
      each(msgs, function (m) {
        if (m.classList.contains('msg--out')) {
          later(function () { m.classList.add('is-shown', 'is-typing'); }, t, id); t += 1150;
          later(function () { m.classList.remove('is-typing'); }, t, id);        t += 1900;
        } else {
          later(function () { m.classList.add('is-shown'); }, t, id);            t += 1800;
        }
      });
      if (chips[0]) later(function () { chips[0].classList.add('is-shown'); }, 2600, id);
      if (chips[1]) later(function () { chips[1].classList.add('is-shown'); }, 5600, id);

      later(function () {
        clearInterval(ticker); ticker = null;
        card.setAttribute('data-state', 'done');
        setPill('Booked');
        if (results[0]) results[0].classList.add('is-shown');
      }, t, id);
      if (results[1]) later(function () { results[1].classList.add('is-shown'); }, t + 650, id);
      later(play, t + 6500, id);   // hold the finished call, then replay
    };

    var onScreen = false;
    var sync = function () {
      if (onScreen && !document.hidden) { if (!playing) play(); }
      else showFinal();
    };
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.35 }).observe(card);
    } else {
      onScreen = true; sync();
    }
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', function () { if (!playing) return; lockHeight(); }, { passive: true });
  }

  /* --- missed-call math ---------------------------------------------- */
  var calc = document.getElementById('calc');
  if (calc) {
    var cCalls = document.getElementById('cCalls');
    var cValue = document.getElementById('cValue');
    var cRate  = document.getElementById('cRate');
    var oCalls = document.getElementById('oCalls');
    var oValue = document.getElementById('oValue');
    var oRate  = document.getElementById('oRate');
    var rYear  = document.getElementById('rYear');
    var rMonth = document.getElementById('rMonth');
    var rJobs  = document.getElementById('rJobs');
    var live   = document.getElementById('calcLive');
    var RECEPTIONIST_MONTHLY = 150;

    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-CA'); };
    var setPct = function (input) {
      var p = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--pct', p + '%');
    };

    var shown = null, raf = null, liveTimer = null;
    var countTo = function (target) {
      if (reduced || shown === null) { shown = target; rYear.textContent = money(target); return; }
      var from = shown, start = null, dur = 420;
      cancelAnimationFrame(raf);
      var step = function (ts) {
        if (start === null) start = ts;
        var k = Math.min(1, (ts - start) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        shown = from + (target - from) * e;
        rYear.textContent = money(shown);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    var update = function () {
      var calls = +cCalls.value, value = +cValue.value, rate = +cRate.value / 100;
      oCalls.textContent = calls;
      oValue.textContent = money(value);
      oRate.textContent  = cRate.value + '%';
      cCalls.setAttribute('aria-valuetext', calls + (calls === 1 ? ' call' : ' calls') + ' a week');
      cValue.setAttribute('aria-valuetext', money(value) + ' per job');
      cRate.setAttribute('aria-valuetext', cRate.value + ' percent');
      [cCalls, cValue, cRate].forEach(setPct);

      var year = calls * 52 * rate * value;
      countTo(year);
      rMonth.textContent = money(year / 12);
      var jobs = Math.max(1, Math.ceil(RECEPTIONIST_MONTHLY / value));
      rJobs.textContent = jobs + (jobs === 1 ? ' booked job' : ' booked jobs');

      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () {
        if (live) live.textContent = 'Estimated ' + money(year) + ' a year, about ' + money(year / 12) + ' a month.';
      }, 600);
    };

    [cCalls, cValue, cRate].forEach(function (input) { input.addEventListener('input', update); });
    update();
  }

  /* --- soft glow that follows the pointer on cards -------------------- */
  if (finePointer && !reduced) {
    each(document.querySelectorAll('.product-card, .pricing-card'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--x', (e.clientX - r.left) + 'px');
        el.style.setProperty('--y', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* --- highlight the nav link for the section in view ----------------- */
  if (hasIO && navList) {
    var links = {};
    each(navList.querySelectorAll('a[href^="#"]'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = links[entry.target.id];
        if (!a) return;
        if (entry.isIntersecting) {
          each(navList.querySelectorAll('a.is-active'), function (x) { x.classList.remove('is-active'); x.removeAttribute('aria-current'); });
          a.classList.add('is-active');
          a.setAttribute('aria-current', 'true');
        } else if (a.classList.contains('is-active')) {
          a.classList.remove('is-active');
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    Object.keys(links).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* --- plan buttons carry the choice down into the form --------------- */
  var planField    = document.getElementById('planField');
  var subjectField = document.getElementById('subjectField');
  var planChip     = document.getElementById('planChip');
  var planChipName = document.getElementById('planChipName');
  var planClear    = document.getElementById('planClear');
  var baseSubject  = subjectField ? subjectField.value : '';

  var setPlan = function (plan) {
    if (planField) planField.value = plan;
    if (subjectField) subjectField.value = plan ? baseSubject + ' (' + plan + ')' : baseSubject;
    if (planChip) planChip.hidden = !plan;
    if (planChipName) planChipName.textContent = plan;
  };
  each(document.querySelectorAll('[data-plan]'), function (btn) {
    btn.addEventListener('click', function () { setPlan(btn.getAttribute('data-plan')); });
  });
  if (planClear) planClear.addEventListener('click', function () { setPlan(''); });

  /* --- sticky call bar on phones: after the hero, out of the form's way */
  var bar = document.getElementById('mobileCall');
  if (bar && hasIO) {
    var pastHero = false, nearForm = false;
    var syncBar = function () { bar.classList.toggle('is-visible', pastHero && !nearForm); };
    if (hero) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
        syncBar();
      }, { threshold: 0 }).observe(hero);
    }
    var tail = [document.getElementById('contact'), document.querySelector('.site-footer')];
    var seen = {};
    var tailIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id || 'footer'] = e.isIntersecting; });
      nearForm = Object.keys(seen).some(function (k) { return seen[k]; });
      syncBar();
    }, { threshold: 0 });
    tail.forEach(function (el) { if (el) tailIO.observe(el); });
  }

  /* --- contact form: submit in place, no redirect --------------------
     Formspree returns JSON when you ask for it, so the visitor never
     leaves the page. If fetch is missing the form still posts normally
     and lands on Formspree's own page.                               */
  var form = document.getElementById('contactForm');
  if (form && window.fetch && window.FormData) {
    var submitBtn = form.querySelector('[type="submit"]');
    var mailLink  = document.querySelector('a[href^="mailto:"]');
    var email     = mailLink ? mailLink.getAttribute('href').replace('mailto:', '') : '';

    var status = document.createElement('div');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.parentNode.insertBefore(status, form.nextSibling);

    var tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    var warn = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.getAttribute('data-sending')) return;

      // A preview copy of the page can't send anywhere; say so plainly.
      if (form.hasAttribute('data-preview')) {
        status.className = 'form-status is-ok';
        status.innerHTML = tick + '<div><strong>Preview only.</strong><p>On the live site this sends straight to your inbox.</p></div>';
        return;
      }

      form.setAttribute('data-sending', '1');
      var label = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
      status.className = 'form-status';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.style.display = 'none';
        var head = form.parentNode.querySelector('.form-card-head');
        if (head) head.style.display = 'none';
        status.className = 'form-status is-ok';
        status.innerHTML = tick +
          '<div><strong>Thanks — that’s landed.</strong>' +
          '<p>I read every one of these myself' +
          (email ? ' and I’ll reply from <a href="mailto:' + email + '">' + email + '</a>' : '') +
          '. No autoresponder, no queue.</p></div>';
        status.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      })
      .catch(function () {
        status.className = 'form-status is-err';
        status.innerHTML = warn +
          '<div><strong>That didn’t send.</strong>' +
          '<p>Something went wrong on the way out' +
          (email ? ' — email me directly at <a href="mailto:' + email + '">' + email + '</a> and I’ll pick it up' : '') +
          '.</p></div>';
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = label; }
        form.removeAttribute('data-sending');
      });
    });
  }

  /* --- footer year ---------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
