/* ===== JB.COACHING — app.js ===== */

// ── Navbar scroll ──────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Mobile menu ────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');
hamburger?.addEventListener('click', () => mobileMenu.classList.add('open'));
mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
mobileMenu?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => mobileMenu.classList.remove('open'))
);

// ── Fade-up on scroll (throttled via rAF) ─────────────────────
const fadeEls = document.querySelectorAll('.fade-up');
let ticking = false;

function checkFades() {
  const vh = window.innerHeight;
  fadeEls.forEach(el => {
    if (el.classList.contains('visible')) return;
    const top = el.getBoundingClientRect().top;
    if (top < vh - 50) el.classList.add('visible');
  });
  ticking = false;
}

// Stagger siblings in the same parent
document.querySelectorAll('.packages-grid, .socials-grid, .about-content').forEach(parent => {
  parent.querySelectorAll('.fade-up').forEach((el, i) => {
    el.style.transitionDelay = `${i * 70}ms`;
  });
});

window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(checkFades); ticking = true; }
}, { passive: true });
checkFades(); // run once on load

// ── Generic dot-synced carousel helper ────────────────────────
function makeCarousel({ trackId, prevId, nextId, dotsId, cardSelector, autoplay }) {
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  const dotsWrap = document.getElementById(dotsId);
  if (!track) return;

  const cards = Array.from(track.querySelectorAll(cardSelector));
  let current = 0;

  function buildDots() {
    if (!dotsWrap) return;
    cards.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Slide ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(btn);
    });
  }

  function updateDots() {
    dotsWrap?.querySelectorAll('.dot').forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, cards.length - 1));
    const card = cards[current];
    const offset = card.offsetLeft - (track.offsetWidth / 2) + (card.offsetWidth / 2);
    track.scrollTo({ left: offset, behavior: 'smooth' });
    updateDots();
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  // Sync dots on native scroll (touch swipe)
  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      let closest = 0, minDist = Infinity;
      const center = track.scrollLeft + track.offsetWidth / 2;
      cards.forEach((c, i) => {
        const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      if (closest !== current) { current = closest; updateDots(); }
    }, 80);
  }, { passive: true });

  buildDots();

  // Auto-advance on desktop
  if (autoplay && window.matchMedia('(min-width: 900px)').matches) {
    setInterval(() => goTo((current + 1) % cards.length), autoplay);
  }
}

// ── About Me image swiper ──────────────────────────────────────
(function() {
  const track = document.getElementById('aboutSwiperTrack');
  const prevBtn = document.getElementById('aboutPrev');
  const nextBtn = document.getElementById('aboutNext');
  const dotsWrap = document.getElementById('aboutDots');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.about-slide'));
  let current = 0;

  function buildDots() {
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Photo ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsWrap?.appendChild(btn);
    });
  }

  function updateDots() {
    dotsWrap?.querySelectorAll('.dot').forEach((d, i) =>
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

  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const idx = Math.round(track.scrollLeft / track.offsetWidth);
      if (idx !== current) { current = idx; updateDots(); }
    }, 80);
  }, { passive: true });

  buildDots();
})();

// ── Achievements image carousel ────────────────────────────────
makeCarousel({
  trackId: 'achTrack',
  prevId: 'achPrev',
  nextId: 'achNext',
  dotsId: 'achDots',
  cardSelector: '.ach-img-card',
  autoplay: 4500
});

// ═══════════════════════════════════════════════════════════════
//  CONTACT FORM — Web3Forms integration
//  Access key is embedded in the HTML hidden field.
//  To change the recipient, update the key at web3forms.com.
// ═══════════════════════════════════════════════════════════════

(function () {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successEl  = document.getElementById('formSuccess');
  const errorBanner= document.getElementById('formErrorBanner');
  const resetBtn   = document.getElementById('formResetBtn');
  const subjectEl  = document.getElementById('formSubject');
  const timestampEl= document.getElementById('cf-timestamp');

  if (!form) return;

  // ── Field validation config ─────────────────────────────────
  const fields = [
    { id: 'cf-name',    errId: 'err-name',    validate: v => v.trim().length >= 2 },
    { id: 'cf-email',   errId: 'err-email',   validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { id: 'cf-phone',   errId: 'err-phone',   validate: v => v.trim().length >= 7 },
    { id: 'cf-package', errId: 'err-package', validate: v => v !== '' },
    { id: 'cf-goal',    errId: 'err-goal',    validate: v => v !== '' },
    { id: 'cf-message', errId: 'err-message', validate: v => v.trim().length >= 10 },
    { id: 'cf-consent', errId: 'err-consent', validate: (_, el) => el.checked },
  ];

  // Mark a field invalid or valid
  function setFieldState(fieldCfg, valid) {
    const el  = document.getElementById(fieldCfg.id);
    const err = document.getElementById(fieldCfg.errId);
    if (!el || !err) return;
    el.classList.toggle('invalid', !valid);
    err.classList.toggle('visible', !valid);
  }

  // Validate all fields; returns true if all pass
  function validateAll() {
    let allValid = true;
    fields.forEach(cfg => {
      const el = document.getElementById(cfg.id);
      if (!el) return;
      const valid = cfg.validate(el.value, el);
      setFieldState(cfg, valid);
      if (!valid) allValid = false;
    });
    return allValid;
  }

  // Live validation on blur (touch & leave)
  fields.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    el.addEventListener('blur', () => {
      const valid = cfg.validate(el.value, el);
      setFieldState(cfg, valid);
    });
    // Clear invalid state as soon as user starts correcting
    el.addEventListener('input', () => {
      if (el.classList.contains('invalid')) {
        const valid = cfg.validate(el.value, el);
        if (valid) setFieldState(cfg, true);
      }
    });
    if (el.type === 'checkbox') {
      el.addEventListener('change', () => {
        if (el.classList.contains('invalid')) setFieldState(cfg, el.checked);
      });
    }
  });

  // ── Dynamic subject line ─────────────────────────────────────
  const nameEl = document.getElementById('cf-name');
  nameEl?.addEventListener('input', () => {
    const n = nameEl.value.trim();
    if (subjectEl) subjectEl.value = n
      ? `New JB.Coaching Enquiry - ${n}`
      : 'New JB.Coaching Enquiry';
  });

  // ── UI helpers ───────────────────────────────────────────────
  function showLoading(yes) {
    submitBtn.classList.toggle('loading', yes);
    submitBtn.disabled = yes;
  }

  function showError(yes) {
    errorBanner.classList.toggle('visible', yes);
    if (yes) errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showSuccess() {
    form.style.display = 'none';
    errorBanner.classList.remove('visible');
    successEl.classList.add('visible');
    successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resetToForm() {
    form.reset();
    form.style.display = '';
    successEl.classList.remove('visible');
    errorBanner.classList.remove('visible');
    // Clear all invalid states
    fields.forEach(cfg => setFieldState(cfg, true));
    // Reset subject
    if (subjectEl) subjectEl.value = 'New JB.Coaching Enquiry';
  }

  resetBtn?.addEventListener('click', resetToForm);

  // ── Form submit ──────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Stamp the submission time before serialising
    if (timestampEl) {
      timestampEl.value = new Date().toLocaleString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      });
    }

    // Client-side validation
    if (!validateAll()) {
      // Scroll to first invalid field
      const firstInvalid = form.querySelector('.invalid');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    showLoading(true);
    showError(false);

    try {
      const formData = new FormData(form);

      // Web3Forms endpoint
      // ▼ Access key is already embedded as a hidden field in the HTML ▼
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess();
      } else {
        // Web3Forms returned an error
        console.error('Web3Forms error:', data);
        showError(true);
        showLoading(false);
      }

    } catch (err) {
      // Network error / fetch failed
      console.error('Submission error:', err);
      showError(true);
      showLoading(false);
    }
  });

})(); // end IIFE