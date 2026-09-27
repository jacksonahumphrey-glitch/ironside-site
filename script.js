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

  /* --- the example card: one short scene per system, on rotation ------
     Without JS the card shows the finished receptionist call. With JS it
     plays each system's example in turn while it's on screen. Hovering
     the card holds the rotation; choosing a tab stops it.            */
  var card   = document.getElementById('callCard');
  var visual = document.getElementById('heroVisual');
  if (card && visual) {
    var svg = function (d, sw) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) +
             '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
    };
    var I = {
      phone:   '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z"/>',
      cal:     '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4"/>',
      bolt:    '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
      star:    '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
      refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
      wrench:  '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.3l-6 6a1.4 1.4 0 0 0 2 2l6-6a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2 2.4-2.3Z"/>',
      check:   '<path d="M20 6 9 17l-5-5"/>',
      chat:    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      user:    '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6"/>'
    };
    // Everything below is illustrative example content, shown as such on the page.
    var SCENES = [
      { title: 'Incoming call', who: 'Mike R.', when: '6:47 PM', icon: I.phone, call: true,
        pill: ['Ringing', 'Live', 'Booked'],
        banner: [I.wrench, 'You’re on a job. The receptionist picked up.'],
        msgs: [['in', 'Caller', 'Hi, our furnace quit last night. Any chance someone can come out tomorrow?'],
               ['out', 'Receptionist', 'Sorry to hear that. I can get a tech out tomorrow at 9&nbsp;AM or 1&nbsp;PM. Which works better?'],
               ['in', 'Caller', '9 is perfect.'],
               ['out', 'Receptionist', 'You’re booked for 9&nbsp;AM. A text confirmation is on its way.']],
        results: [[true, I.check, 'Booked &middot; Thu, 9:00&nbsp;AM'], [false, I.chat, 'Summary texted to you']],
        event: [I.phone, 'Missed call booked', 'Thu · 9:00 AM'] },
      { title: 'Appointment reminder', who: 'Dana K.', when: 'Tomorrow, 2:30 PM', icon: I.cal,
        pill: ['', 'Sending', 'Confirmed'],
        banner: [I.cal, 'Sent automatically ahead of the appointment.'],
        msgs: [['out', 'Your business', 'Hi Dana, a reminder that you’re booked tomorrow at 2:30&nbsp;PM. Reply C to confirm.'],
               ['in', 'Dana', 'C'],
               ['out', 'Your business', 'Thanks Dana, see you tomorrow!']],
        results: [[true, I.check, 'Confirmed &middot; Tomorrow, 2:30&nbsp;PM'], [false, I.cal, 'Slot stays filled']],
        event: [I.cal, 'Reminder confirmed', 'Tomorrow · 2:30 PM'] },
      { title: 'New enquiry', who: 'Website form', when: '2:14 PM', icon: I.bolt,
        pill: ['', 'New', 'Replied'],
        banner: [I.user, 'You’re with a customer. They hear back anyway.'],
        msgs: [['in', 'Sam', 'Looking for a quote to replace our hot water tank this week.'],
               ['out', 'Your business', 'Hi Sam, thanks for reaching out! We can come by Thursday or Friday to quote it. Which works?'],
               ['in', 'Sam', 'Friday morning is great.']],
        results: [[true, I.check, 'Replied within a minute'], [false, I.chat, 'Lead passed to you']],
        event: [I.bolt, 'New lead answered', 'Replied within a minute'] },
      { title: 'Job complete', who: 'Priya S.', when: 'Furnace repair', icon: I.star,
        pill: ['', 'Sending', 'Reviewed'],
        banner: [I.check, 'Sent right after the job, while it’s fresh.'],
        msgs: [['out', 'Your business', 'Thanks for having us out today, Priya! If you have a minute, a quick review really helps.<br><span class="sms-link">Leave a review &rarr;</span>'],
               ['in', 'Priya', 'Done! Thanks for the quick fix.']],
        results: [[true, I.star, 'New 5-star review']],
        event: [I.star, 'New 5-star review', 'Asked right after the job'] },
      { title: 'Past customer', who: 'Mark T.', when: 'Last visit 11 months ago', icon: I.refresh,
        pill: ['', 'Reaching out', 'Rebooked'],
        banner: [I.refresh, 'Reaching back out to customers who’ve gone quiet.'],
        msgs: [['out', 'Your business', 'Hi Mark, it’s been about a year since your furnace tune-up. Want to get on the schedule before winter?'],
               ['in', 'Mark', 'Yes please. Next week works.'],
               ['out', 'Your business', 'Great, you’re booked for Tuesday at 10&nbsp;AM.']],
        results: [[true, I.check, 'Rebooked &middot; Tue, 10:00&nbsp;AM']],
        event: [I.refresh, 'Past customer rebooked', 'Tue · 10:00 AM'] }
    ];
    var N = SCENES.length, HOLD = 4200;
    var stage = card.querySelector('.cc-stage');
    var tabs  = card.querySelectorAll('.scene-tab');
    var chips = visual.querySelectorAll('.float-chip');

    var run = 0, timers = [], ticker = null;
    var current = 0, playing = false, autoplay = !reduced, hovering = false, pendingNext = false, onScreen = false;

    var later = function (fn, ms, id) {
      timers.push(setTimeout(function () { if (id === run) fn(); }, ms));
    };
    var stopAll = function () {
      run++;
      timers.forEach(clearTimeout); timers = [];
      clearInterval(ticker); ticker = null;
      playing = false; pendingNext = false;
    };
    var fmt = function (sec) {
      var m = Math.floor(sec / 60), x = Math.floor(sec % 60);
      return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x;
    };

    var render = function (i) {
      var sc = SCENES[i];
      stage.innerHTML =
        '<div class="cc-head"><span class="cc-avatar">' + svg(sc.icon) + '</span>' +
          '<div class="cc-id"><p class="cc-title">' + sc.title + '</p>' +
          '<p class="cc-number">' + sc.who + (sc.when ? '<span class="cc-when"> &middot; ' + sc.when + '</span>' : '') + '</p></div>' +
          '<span class="cc-pill"><i class="cc-pill-dot"></i><span class="cc-pill-text">' + sc.pill[2] + '</span>' +
          (sc.call ? '<span class="cc-timer">00:44</span>' : '') + '</span></div>' +
        '<p class="cc-banner">' + svg(sc.banner[0]) + '<span>' + sc.banner[1] + '</span></p>' +
        '<ol class="cc-thread">' + sc.msgs.map(function (m) {
          return '<li class="msg msg--' + m[0] + '"><span class="msg-who">' + m[1] + '</span>' +
                 (m[0] === 'out' ? '<span class="dots"><i></i><i></i><i></i></span>' : '') + '<p>' + m[2] + '</p></li>';
        }).join('') + '</ol>' +
        '<div class="cc-results">' + sc.results.map(function (r) {
          return '<p class="cc-result' + (r[0] ? ' cc-result--ok' : '') + '">' + svg(r[1], r[0] ? 2.4 : 2) + r[2] + '</p>';
        }).join('') + '</div>';
      card.setAttribute('data-scene', String(i));
      card.setAttribute('data-state', 'done');
      each(tabs, function (t, k) {
        t.classList.toggle('is-active', k === i);
        t.classList.remove('is-timing');
        t.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
    };

    // The two floating notes show other systems at work at the same time.
    var setChips = function (i) {
      each(chips, function (chip, k) {
        var ev = SCENES[(i + 1 + k) % N].event;
        chip.querySelector('.float-chip-icon').innerHTML = svg(ev[0]);
        chip.querySelector('strong').textContent = ev[1];
        chip.querySelector('p span').textContent = ev[2];
      });
    };

    // Reserve the tallest scene's height so the card never jumps between them.
    var lockHeight = function () {
      stage.style.minHeight = '';
      var max = 0;
      for (var k = 0; k < N; k++) { render(k); max = Math.max(max, stage.offsetHeight); }
      stage.style.minHeight = max + 'px';
      render(current);
    };

    var showFinal = function (i) {
      stopAll();
      current = i;
      card.classList.remove('is-anim', 'is-swapping');
      render(i);
      setChips(i);
    };

    var advance = function () {
      if (!autoplay) return;
      if (hovering) { pendingNext = true; return; }
      play((current + 1) % N);
    };

    var play = function (i) {
      stopAll();
      var id = run;
      playing = true;
      current = i;
      card.classList.add('is-swapping');
      each(chips, function (c) { c.classList.add('is-swapping'); });

      later(function () {
        var sc = SCENES[i];
        render(i);
        setChips(i);
        card.classList.add('is-anim');
        card.classList.remove('is-swapping');
        each(chips, function (c) { c.classList.remove('is-swapping'); });

        var msgs    = stage.querySelectorAll('.msg');
        var results = stage.querySelectorAll('.cc-result');
        var pill    = stage.querySelector('.cc-pill-text');
        var timerEl = stage.querySelector('.cc-timer');
        var t = 450;

        if (sc.call) {
          card.setAttribute('data-state', 'ringing');
          pill.textContent = sc.pill[0];
          if (timerEl) timerEl.textContent = '00:00';
          later(function () {
            card.setAttribute('data-state', 'live');
            pill.textContent = sc.pill[1];
            var t0 = Date.now();
            ticker = setInterval(function () {
              if (timerEl) timerEl.textContent = fmt((Date.now() - t0) / 1000 * 4.6);
            }, 250);
          }, 1000, id);
          t = 1350;
        } else {
          card.setAttribute('data-state', 'live');
          pill.textContent = sc.pill[1];
        }

        each(msgs, function (m) {
          if (m.classList.contains('msg--out')) {
            later(function () { m.classList.add('is-shown', 'is-typing'); }, t, id); t += 1100;
            later(function () { m.classList.remove('is-typing'); }, t, id);        t += 1800;
          } else {
            later(function () { m.classList.add('is-shown'); }, t, id);            t += 1600;
          }
        });

        later(function () {
          clearInterval(ticker); ticker = null;
          card.setAttribute('data-state', 'done');
          pill.textContent = sc.pill[2];
          if (results[0]) results[0].classList.add('is-shown');
        }, t, id);
        if (results[1]) later(function () { results[1].classList.add('is-shown'); }, t + 600, id);

        var total = t + 600 + HOLD;
        if (autoplay) {
          var tab = tabs[i];
          if (tab) { tab.style.setProperty('--dur', total + 'ms'); void tab.offsetWidth; tab.classList.add('is-timing'); }
          later(function () { playing = false; advance(); }, total, id);
        } else {
          later(function () { playing = false; }, t + 600, id);
        }
      }, 260, id);
    };

    each(tabs, function (tab, k) {
      tab.addEventListener('click', function () {
        autoplay = false;                        // the visitor has taken over: no more rotation
        if (reduced) { showFinal(k); return; }
        play(k);
      });
    });
    card.addEventListener('mouseenter', function () { hovering = true; });
    card.addEventListener('mouseleave', function () {
      hovering = false;
      if (pendingNext) { pendingNext = false; advance(); }
    });

    lockHeight();
    var sync = function () {
      if (reduced) return;
      if (onScreen && !document.hidden) { if (!playing) play(current); }
      else showFinal(current);
    };
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.3 }).observe(card);
    } else {
      onScreen = true; sync();
    }
    document.addEventListener('visibilitychange', sync);

    var lastW = window.innerWidth, rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (window.innerWidth === lastW) return;
        lastW = window.innerWidth;
        stopAll();
        lockHeight();
        if (!reduced && onScreen) play(current); else showFinal(current);
      }, 200);
    }, { passive: true });
  }

  /* --- what it's costing: missed calls, no-shows and cold leads -------
     Assumes 1 in 4 missed calls and cold leads would have booked, and
     that a no-show loses the whole slot. The page says so too.      */
  var calc = document.getElementById('calc');
  if (calc) {
    var byId = function (id) { return document.getElementById(id); };
    var BOOK_RATE = 0.25, FULL_DESK_MONTHLY = 450;
    var fields = {
      Calls:   { input: byId('cCalls'),   out: byId('oCalls'),   unit: ['missed call', 'missed calls'] },
      Noshows: { input: byId('cNoshows'), out: byId('oNoshows'), unit: ['no-show', 'no-shows'] },
      Leads:   { input: byId('cLeads'),   out: byId('oLeads'),   unit: ['cold lead', 'cold leads'] }
    };
    var cValue = byId('cValue'), oValue = byId('oValue');
    var rYear = byId('rYear'), rMonth = byId('rMonth'), rJobs = byId('rJobs'), live = byId('calcLive');

    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-CA'); };
    var setPct = function (input) {
      var pct = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--pct', pct + '%');
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
      var value = +cValue.value;
      oValue.textContent = money(value);
      cValue.setAttribute('aria-valuetext', money(value) + ' per job');
      setPct(cValue);

      var parts = {};
      Object.keys(fields).forEach(function (key) {
        var f = fields[key], n = +f.input.value;
        f.out.textContent = n;
        f.input.setAttribute('aria-valuetext', n + ' ' + f.unit[n === 1 ? 0 : 1] + ' a week');
        setPct(f.input);
        parts[key] = n * value * 52 * (key === 'Noshows' ? 1 : BOOK_RATE);
      });

      var year = parts.Calls + parts.Noshows + parts.Leads;
      var max = Math.max(parts.Calls, parts.Noshows, parts.Leads);
      Object.keys(parts).forEach(function (key) {
        byId('v' + key).textContent = money(parts[key]);
        byId('b' + key).style.setProperty('--w', (max ? parts[key] / max * 100 : 0) + '%');
      });

      countTo(year);
      rMonth.textContent = money(year / 12);
      var jobs = Math.max(1, Math.ceil(FULL_DESK_MONTHLY / value));
      rJobs.textContent = jobs + (jobs === 1 ? ' booked job' : ' booked jobs');

      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () {
        if (live) live.textContent = 'Estimated ' + money(year) + ' a year, about ' + money(year / 12) + ' a month: ' +
          money(parts.Calls) + ' from missed calls, ' + money(parts.Noshows) + ' from no-shows, ' + money(parts.Leads) + ' from cold leads.';
      }, 600);
    };

    [fields.Calls.input, fields.Noshows.input, fields.Leads.input, cValue].forEach(function (input) {
      input.addEventListener('input', update);
    });
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
