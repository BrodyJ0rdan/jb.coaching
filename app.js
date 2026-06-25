/* ================================================================
   JB.COACHING — app.js
   Skills: emil-design-eng · impeccable
   Key principles applied:
   - Mobile menu: hamburger morphs to X via CSS, no overlap
   - Body scroll locked when menu open
   - Esc key closes menu
   - Fade-up: rAF throttled, content never gated (visible by default)
   - Stagger: 50ms between siblings
   - Carousels: scroll-synced dots, Esc/click-outside close
   ================================================================ */

'use strict';

/* ── Utility ─────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ================================================================
   NAVBAR — scroll + menu-open class
   ================================================================ */
const navbar = $('#navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 44);
}, { passive: true });

/* ================================================================
   MOBILE MENU
   - Hamburger morphs to X purely via CSS (#navbar.menu-open)
   - Body scroll locked via overflow:hidden on body
   - Closes on: close btn · nav link · Esc · backdrop click
   ================================================================ */
const hamburger  = $('#hamburger');
const mobileMenu = $('#mobileMenu');
const mobileClose = $('#mobileClose');

function openMenu() {
  mobileMenu.classList.add('open');
  navbar.classList.add('menu-open');
  document.body.style.overflow = 'hidden'; // lock scroll
  hamburger.setAttribute('aria-expanded', 'true');
  mobileMenu.setAttribute('aria-hidden', 'false');
}

function closeMenu() {
  mobileMenu.classList.remove('open');
  navbar.classList.remove('menu-open');
  document.body.style.overflow = ''; // restore scroll
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
}

hamburger?.addEventListener('click', openMenu);
mobileClose?.addEventListener('click', closeMenu);

// Close on nav link click
$$('a', mobileMenu).forEach(a => a.addEventListener('click', closeMenu));

// Esc key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
});

// Click outside (on the backdrop — the menu div itself when clicking empty space)
mobileMenu?.addEventListener('click', e => {
  if (e.target === mobileMenu) closeMenu();
});

/* ================================================================
   FADE-UP REVEAL
   Emil: never gate content on animation — elements start visible
   when JS hasn't run or IntersectionObserver not triggered yet.
   rAF throttling for smooth 60fps.
   ================================================================ */
const fadeEls = $$('.fade-up');

// Apply stagger delays to sibling groups
const staggerParents = ['.packages-grid', '.socials-grid', '.about-content', '.hero-cta-group'];
staggerParents.forEach(sel => {
  const parent = $(sel);
  if (!parent) return;
  $$('.fade-up', parent).forEach((el, i) => {
    el.style.transitionDelay = `${i * 55}ms`;
  });
});

// IntersectionObserver — more efficient than scroll listener
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target); // detach after trigger — performance
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  fadeEls.forEach(el => io.observe(el));
} else {
  // Fallback: just make everything visible
  fadeEls.forEach(el => el.classList.add('visible'));
}

/* ================================================================
   CAROUSEL FACTORY
   Handles: dots, prev/next arrows, scroll-sync, optional autoplay
   ================================================================ */
function makeCarousel({ trackId, prevId, nextId, dotsId, cardSel, autoplayMs }) {
  const track   = $(`#${trackId}`);
  const prevBtn = $(`#${prevId}`);
  const nextBtn = $(`#${nextId}`);
  const dotsWrap = $(`#${dotsId}`);
  if (!track) return;

  const cards = $$(`${cardSel}`, track);
  if (!cards.length) return;
  let current = 0;

  /* Build dot buttons */
  if (dotsWrap) {
    cards.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
      btn.addEventListener('click', () => scrollTo(i));
      dotsWrap.appendChild(btn);
    });
  }

  function updateDots() {
    dotsWrap && $$('.dot', dotsWrap).forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
  }

  function scrollTo(idx) {
    idx = Math.max(0, Math.min(idx, cards.length - 1));
    current = idx;
    const card = cards[idx];
    // Centre the card in the track viewport
    const offset = card.offsetLeft - (track.offsetWidth / 2) + (card.offsetWidth / 2);
    track.scrollTo({ left: offset, behavior: 'smooth' });
    updateDots();
  }

  prevBtn?.addEventListener('click', () => scrollTo(current - 1));
  nextBtn?.addEventListener('click', () => scrollTo(current + 1));

  // Sync dots with native swipe — debounced so it doesn't fire mid-scroll
  let syncTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const centre = track.scrollLeft + track.offsetWidth / 2;
      let closest = 0, minD = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - centre);
        if (d < minD) { minD = d; closest = i; }
      });
      if (closest !== current) { current = closest; updateDots(); }
    }, 80);
  }, { passive: true });

  // Auto-advance on desktop only (Emil: don't animate things users see constantly)
  if (autoplayMs && window.matchMedia('(min-width: 900px)').matches) {
    const id = setInterval(() => scrollTo((current + 1) % cards.length), autoplayMs);
    // Pause on hover
    track.addEventListener('mouseenter', () => clearInterval(id), { once: true });
  }
}

/* ================================================================
   ABOUT ME — photo swiper
   ================================================================ */
(function aboutSwiper() {
  const track    = $('#aboutSwiperTrack');
  const prevBtn  = $('#aboutPrev');
  const nextBtn  = $('#aboutNext');
  const dotsWrap = $('#aboutDots');
  if (!track) return;

  const slides = $$('.about-slide', track);
  let current = 0;

  /* Dots */
  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', `Photo ${i + 1} of ${slides.length}`);
    btn.addEventListener('click', () => goTo(i));
    dotsWrap?.appendChild(btn);
  });

  function updateDots() {
    dotsWrap && $$('.dot', dotsWrap).forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
  }

  function goTo(i) {
    current = Math.max(0, Math.min(i, slides.length - 1));
    track.scrollTo({ left: slides[current].offsetLeft, behavior: 'smooth' });
    updateDots();
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  let syncTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const idx = Math.round(track.scrollLeft / track.offsetWidth);
      if (idx !== current) { current = idx; updateDots(); }
    }, 80);
  }, { passive: true });
})();

/* ================================================================
   ACHIEVEMENTS — image carousel
   ================================================================ */
makeCarousel({
  trackId:    'achTrack',
  prevId:     'achPrev',
  nextId:     'achNext',
  dotsId:     'achDots',
  cardSel:    '.ach-img-card',
  autoplayMs: 4800,
});

/* ================================================================
   CONTACT FORM — Web3Forms
   Access key embedded in the HTML hidden input.
   To change recipient: update key at web3forms.com.
   ================================================================ */
(function contactForm() {
  const form        = $('#contactForm');
  const submitBtn   = $('#submitBtn');
  const successEl   = $('#formSuccess');
  const errorBanner = $('#formErrorBanner');
  const resetBtn    = $('#formResetBtn');
  const subjectEl   = $('#formSubject');
  const timestampEl = $('#cf-timestamp');
  if (!form) return;

  /* Field validation config */
  const fields = [
    { id: 'cf-name',    errId: 'err-name',    test: v => v.trim().length >= 2 },
    { id: 'cf-email',   errId: 'err-email',   test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { id: 'cf-phone',   errId: 'err-phone',   test: v => v.trim().length >= 7 },
    { id: 'cf-package', errId: 'err-package', test: v => v !== '' },
    { id: 'cf-goal',    errId: 'err-goal',    test: v => v !== '' },
    { id: 'cf-message', errId: 'err-message', test: v => v.trim().length >= 10 },
    { id: 'cf-consent', errId: 'err-consent', test: (_, el) => el.checked },
  ];

  function setState(cfg, valid) {
    const el  = $(`#${cfg.id}`);
    const err = $(`#${cfg.errId}`);
    if (!el || !err) return;
    el.classList.toggle('invalid', !valid);
    err.classList.toggle('visible', !valid);
  }

  function validateAll() {
    let ok = true;
    fields.forEach(cfg => {
      const el = $(`#${cfg.id}`);
      if (!el) return;
      const valid = cfg.test(el.value, el);
      setState(cfg, valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  /* Live validation — blur to mark, input to clear if now valid */
  fields.forEach(cfg => {
    const el = $(`#${cfg.id}`);
    if (!el) return;
    el.addEventListener('blur',   () => setState(cfg, cfg.test(el.value, el)));
    el.addEventListener('input',  () => { if (el.classList.contains('invalid') && cfg.test(el.value, el)) setState(cfg, true); });
    if (el.type === 'checkbox') el.addEventListener('change', () => { if (el.classList.contains('invalid')) setState(cfg, el.checked); });
  });

  /* Dynamic subject line */
  const nameEl = $('#cf-name');
  nameEl?.addEventListener('input', () => {
    if (subjectEl) subjectEl.value = nameEl.value.trim()
      ? `New JB.Coaching Enquiry - ${nameEl.value.trim()}`
      : 'New JB.Coaching Enquiry';
  });

  /* UI state helpers */
  const setLoading = (on) => {
    submitBtn.classList.toggle('loading', on);
    submitBtn.disabled = on;
  };

  const setError = (on) => {
    errorBanner.classList.toggle('visible', on);
    if (on) errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const showSuccess = () => {
    form.style.display = 'none';
    errorBanner.classList.remove('visible');
    successEl.classList.add('visible');
    successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const resetForm = () => {
    form.reset();
    form.style.display = '';
    successEl.classList.remove('visible');
    errorBanner.classList.remove('visible');
    fields.forEach(cfg => setState(cfg, true));
    if (subjectEl) subjectEl.value = 'New JB.Coaching Enquiry';
  };

  resetBtn?.addEventListener('click', resetForm);

  /* Submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Stamp submission time
    if (timestampEl) {
      timestampEl.value = new Date().toLocaleString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      });
    }

    if (!validateAll()) {
      $('[class~="invalid"]', form)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const res  = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body:   new FormData(form),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showSuccess();
      } else {
        console.error('Web3Forms error:', data);
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setError(true);
      setLoading(false);
    }
  });
})();

/* ── Footer year ─────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();