
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
 
// ── Contact form (demo) ────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = contactForm.querySelector('[type=submit]');
  const orig = btn.textContent;
  btn.textContent = 'Message Sent ✓';
  btn.style.background = '#22c55e';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.disabled = false;
    contactForm.reset();
  }, 3000);
});