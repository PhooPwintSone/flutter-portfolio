/* =========================================================
   Flutter Portfolio — interactions
   Vanilla JS, no dependencies.
   ========================================================= */

import { inject } from '@vercel/analytics';

inject();
   (function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Sticky nav state ---------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 24);

  /* ---------- 2. Mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');

  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      navLinks.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- 3. Theme toggle ---------- */
  const themeBtn = $('#themeToggle');
  const stored = localStorage.getItem('theme');
  if (stored) document.documentElement.dataset.theme = stored;
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  });

  /* ---------- 4. Scroll reveal ---------- */
  const revealables = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('in'));
  }

  /* ---------- 5. Active nav link (scroll spy) ---------- */
  const links = $$('.nav-link');
  const sections = links
    .map((l) => ({ link: l, el: document.querySelector(l.getAttribute('href')) }))
    .filter((s) => s.el);

  const spy = () => {
    const y = window.scrollY + window.innerHeight * 0.3;
    let current = null;
    sections.forEach((s) => { if (s.el.offsetTop <= y) current = s; });
    links.forEach((l) => l.classList.remove('active'));
    if (current) current.link.classList.add('active');
  };

  /* ---------- 6. Animated counters ---------- */
  const counters = $$('[data-count]');
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const dur = 1500;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach(runCount);
  }

  /* ---------- 7. Skill meters ---------- */
  const meters = $$('.meter');
  if ('IntersectionObserver' in window) {
    const mo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const m = e.target;
          m.classList.add('done');
          $('.meter-fill', m).style.width = m.dataset.level + '%';
          mo.unobserve(m);
        }
      });
    }, { threshold: 0.5 });
    meters.forEach((m) => mo.observe(m));
  } else {
    meters.forEach((m) => { m.classList.add('done'); $('.meter-fill', m).style.width = m.dataset.level + '%'; });
  }

  /* ---------- 8. Typing effect ---------- */
  const typed = $('#typed');
  const phrases = [
    'Translating UI designs into pixel-perfect apps.',
    'Building cross-platform experiences with Flutter.',
    'Focused on clean state management & smooth performance.'
  ];
  if (typed && !reduceMotion) {
    let p = 0, i = 0, deleting = false;
    (function type() {
      const full = phrases[p];
      typed.textContent = deleting
        ? full.slice(0, --i)
        : full.slice(0, ++i);
      let delay = deleting ? 45 : 70;
      if (!deleting && i === full.length) { deleting = true; delay = 1700; }
      else if (deleting && i === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 350; }
      setTimeout(type, delay);
    })();
  } else if (typed) {
    typed.textContent = phrases[0];
  }

  /* ---------- 9. Project filters ---------- */
  const filterBtns = $$('.filter');
  const projects = $$('.project');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      const f = btn.dataset.filter;
      projects.forEach((card) => {
        const show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hide', !show);
        if (show) { card.classList.remove('in'); void card.offsetWidth; card.classList.add('in'); }
      });
    });
  });

  /* ---------- 10. Contact form (demo — wire to your backend) ---------- */
  const form = $('#contactForm');
  const msg = $('#formMsg');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name');
    const email = $('#email');
    const message = $('#message');
    let ok = true;

    const check = (input, valid, text) => {
      input.closest('.field').classList.toggle('invalid', !valid);
      if (!valid && ok) { msg.textContent = text; ok = false; }
    };
    check(name, name.value.trim().length > 1, 'Please tell me your name.');
    check(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value), 'That email address looks invalid.');
    check(message, message.value.trim().length > 9, 'A few more words about your project, please.');

    if (!ok) { msg.className = 'form-msg err'; return; }

    msg.className = 'form-msg ok';
    msg.textContent = 'Thanks! This demo form is not wired up yet — add your endpoint in script.js.';
    form.reset();
  });

  /* ---------- 11. Cursor glow ---------- */
  const glow = $('#cursorGlow');
  if (glow && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    let x = 0, y = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      glow.classList.add('on');
    });
    (function loop() {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseleave', () => glow.classList.remove('on'));
  }

  /* ---------- 12. Draggable hero chips ----------
     Pointer drag with a damped-spring return. The chip is only "armed" after a few
     pixels of movement, so a plain click never interrupts the idle bob animation. */
  const CHIP_STIFF = 210;     // spring constant — higher = snappier
  const CHIP_DAMP = 14;       // damping — lower = more overshoot
  const CHIP_RANGE = 78;      // px the chip roams from home before it starts resisting
  const CHIP_MAXV = 1200;     // px/s fling cap
  const CHIP_EDGE = 12;      // px of screen a chip may never be dragged past
  const CHIP_GRAB = 4;        // px before a press counts as a drag
  const CHIP_STEP = 1 / 120;  // fixed sim step, so motion is identical at 60/120/144Hz
  const chipState = new Map();
  let chipRaf = null;
  let chipLast = 0;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  /* Rubber band: past CHIP_RANGE the chip keeps following the pointer but with
     progressively less gain, so it can never travel further than 2x the range. */
  const leash = (px, py) => {
    const d = Math.hypot(px, py);
    if (d <= CHIP_RANGE || d === 0) return { x: px, y: py };
    const k = (CHIP_RANGE + ((d - CHIP_RANGE) * CHIP_RANGE) / d) / d;
    return { x: px * k, y: py * k };
  };

  const chipLoop = () => {
    chipRaf = null;
    const now = performance.now();
    if (!chipLast) chipLast = now;
    const frame = Math.min((now - chipLast) / 1000, 0.1);  // clamp tab-switch gaps
    chipLast = now;
    let active = false;

    chipState.forEach((s, el) => {
      if (!s.dragging) {
        s.acc += frame;
        while (s.acc >= CHIP_STEP) {            // fixed substeps keep the spring stable
          s.acc -= CHIP_STEP;
          s.vx += (-CHIP_STIFF * s.x - CHIP_DAMP * s.vx) * CHIP_STEP;
          s.vy += (-CHIP_STIFF * s.y - CHIP_DAMP * s.vy) * CHIP_STEP;
          s.x += s.vx * CHIP_STEP;
          s.y += s.vy * CHIP_STEP;
        }
        if (Math.abs(s.x) + Math.abs(s.vx) + Math.abs(s.y) + Math.abs(s.vy) < 0.12) {
          el.style.transform = '';
          el.classList.remove('is-dragging');
          chipState.delete(el);
          return;
        }
      }
      active = true;
      el.style.transform = 'translate3d(' + s.x + 'px,' + s.y + 'px,0)';
    });

    if (active) chipRaf = requestAnimationFrame(chipLoop);
    else chipLast = 0;
  };
  const runChipLoop = () => { if (chipRaf === null) chipRaf = requestAnimationFrame(chipLoop); };

  $$('.float-chip').forEach((chip) => {
    const home = chip.parentElement;
    let s = null;

    chip.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      s = { armed: false, dragging: false, x: 0, y: 0, vx: 0, vy: 0, acc: 0,
            startX: e.clientX, startY: e.clientY };
      try { chip.setPointerCapture(e.pointerId); } catch (_) { /* not fatal */ }
    });

    chip.addEventListener('pointermove', (e) => {
      if (!s) return;

      if (!s.armed) {
        if (Math.hypot(e.clientX - s.startX, e.clientY - s.startY) < CHIP_GRAB) return;
        // Arm on first real movement. Seed from the live rect + the currently animated
        // matrix so the chip doesn't jump the moment the bob animation is suspended.
        const r = chip.getBoundingClientRect();
        const hr = home.getBoundingClientRect();
        const m = new DOMMatrixReadOnly(getComputedStyle(chip).transform);
        s.armed = true;
        s.dragging = true;
        s.acc = 0;
        s.x = m.m41;
        s.y = m.m42;
        // Pointer coords are viewport-absolute but offsetLeft/Top are parent-relative,
        // so the parent's own client rect has to be carried to convert between them.
        s.ox = hr.left;
        s.oy = hr.top;
        s.baseX = chip.offsetLeft;
        s.baseY = chip.offsetTop;
        s.grabX = e.clientX - r.left;
        s.grabY = e.clientY - r.top;
        // The leash is what actually bounds the drag; these are only a safety net so a
        // chip can never be flung off the visible viewport. They always include 0, so
        // the spring can always get home regardless of where the chip starts.
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const homeLeft = s.ox + s.baseX;
        const homeTop = s.oy + s.baseY;
        s.loX = Math.min(0, CHIP_EDGE - homeLeft);
        s.hiX = Math.max(0, vw - CHIP_EDGE - chip.offsetWidth - homeLeft);
        s.loY = Math.min(0, CHIP_EDGE - homeTop);
        s.hiY = Math.max(0, vh - CHIP_EDGE - chip.offsetHeight - homeTop);
        s.lastX = e.clientX; s.lastY = e.clientY; s.lastT = performance.now();
        chip.classList.add('is-dragging');
        chipState.set(chip, s);
        runChipLoop();
      }

      const now = performance.now();
      const dt = Math.max((now - s.lastT) / 1000, 0.001);
      s.vx = clamp((e.clientX - s.lastX) / dt, -CHIP_MAXV, CHIP_MAXV);
      s.vy = clamp((e.clientY - s.lastY) / dt, -CHIP_MAXV, CHIP_MAXV);
      s.lastX = e.clientX; s.lastY = e.clientY; s.lastT = now;

      const pulled = leash(e.clientX - s.grabX - s.baseX - s.ox,
                           e.clientY - s.grabY - s.baseY - s.oy);
      s.x = clamp(pulled.x, s.loX, s.hiX);
      s.y = clamp(pulled.y, s.loY, s.hiY);
    });

    const release = (e) => {
      if (!s || !s.armed) { s = null; return; }
      s.armed = false;
      try { chip.releasePointerCapture(e.pointerId); } catch (_) { /* already gone */ }
      if (reduceMotion) {
        chipState.delete(chip);
        chip.style.transform = '';
        chip.classList.remove('is-dragging');
      } else {
        s.dragging = false;   // keep the seeded fling velocity; the loop springs home
        s.acc = 0;
        runChipLoop();
      }
      s = null;
    };
    chip.addEventListener('pointerup', release);
    chip.addEventListener('pointercancel', release);
  });

  /* ---------- 13. Year + init ---------- */
  $('#year').textContent = new Date().getFullYear();
  onScrollNav();
  spy();
  window.addEventListener('scroll', () => { onScrollNav(); spy(); }, { passive: true });

  /* ---------- 14. Time-aware greeting ---------- */
  /* The phone mockup's kicker greets the visitor using their own clock, so it tracks
     whoever is looking at the page rather than a fixed string baked into the markup.
     Buckets are hours in the visitor's local timezone; `#greeting` falls back to a
     sensible static value if this never runs (no JS, or the element is renamed). */
  const greeting = $('#greeting');
  if (greeting) {
    const hourNow = () => new Date().getHours();
    const phraseFor = (h) => {
      if (h < 5)  return 'Good night';
      if (h < 12) return 'Good morning';
      if (h < 17) return 'Good afternoon';
      if (h < 22) return 'Good evening';
      return 'Good night';
    };

    let last = phraseFor(hourNow());
    greeting.textContent = last;

    /* Re-check on a timer so a page left open across a boundary (11:59 -> 12:00)
       updates itself. Writes only when the phrase actually changes. */
    setInterval(() => {
      const next = phraseFor(hourNow());
      if (next !== last) { last = next; greeting.textContent = next; }
    }, 60000);
  }
})();
