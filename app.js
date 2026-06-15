
/* ===== JB.COACHING — app.js ===== */
 
// ── Navbar scroll ──────────────────────────────────────────────
const navbar = document.getElementById('navbar');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 40);
  lastScroll = y;
}, { passive: true });
 
// ── Mobile menu ────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');
 
hamburger?.addEventListener('click', () => mobileMenu.classList.add('open'));
mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
mobileMenu?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});
 
// ── Fade-in on scroll ──────────────────────────────────────────
const fadeEls = document.querySelectorAll('.fade-up');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
 
fadeEls.forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  io.observe(el);
});
 
// ── Count-up animation ─────────────────────────────────────────
function countUp(el, target, suffix = '') {
  const duration = 1800;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
 
const countEls = document.querySelectorAll('[data-count]');
const countIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = +e.target.dataset.count;
      const suffix = e.target.dataset.suffix || '';
      countUp(e.target, target, suffix);
      countIO.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
countEls.forEach(el => countIO.observe(el));
 
// ── Achievements carousel ──────────────────────────────────────
const track = document.getElementById('achievementsTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsWrap = document.getElementById('carouselDots');
 
let currentIndex = 0;
const cards = track?.querySelectorAll('.achievement-card');
const cardCount = cards?.length || 0;
 
function updateDots() {
  if (!dotsWrap) return;
  dotsWrap.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentIndex);
  });
}
 
function scrollToCard(index) {
  if (!cards?.length) return;
  currentIndex = Math.max(0, Math.min(index, cardCount - 1));
  const card = cards[currentIndex];
  const trackLeft = track.getBoundingClientRect().left;
  const cardLeft = card.getBoundingClientRect().left;
  const offset = cardLeft - trackLeft - (track.offsetWidth / 2) + (card.offsetWidth / 2);
  track.scrollBy({ left: offset, behavior: 'smooth' });
  updateDots();
}
 
prevBtn?.addEventListener('click', () => scrollToCard(currentIndex - 1));
nextBtn?.addEventListener('click', () => scrollToCard(currentIndex + 1));
 
// Build dots
if (dotsWrap && cardCount) {
  for (let i = 0; i < cardCount; i++) {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to achievement ${i + 1}`);
    dot.addEventListener('click', () => scrollToCard(i));
    dotsWrap.appendChild(dot);
  }
}
 
// Sync dots on scroll
track?.addEventListener('scroll', () => {
  if (!cards?.length) return;
  let closest = 0, minDist = Infinity;
  cards.forEach((c, i) => {
    const center = c.getBoundingClientRect().left + c.offsetWidth / 2;
    const trackCenter = track.getBoundingClientRect().left + track.offsetWidth / 2;
    const dist = Math.abs(center - trackCenter);
    if (dist < minDist) { minDist = dist; closest = i; }
  });
  currentIndex = closest;
  updateDots();
}, { passive: true });
 
// Auto-advance on desktop only
if (window.matchMedia('(min-width: 900px)').matches) {
  setInterval(() => {
    const next = (currentIndex + 1) % cardCount;
    scrollToCard(next);
  }, 4000);
}
 
// ── Form submission (demo) ─────────────────────────────────────
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = contactForm.querySelector('[type=submit]');
  btn.textContent = 'Message Sent ✓';
  btn.style.background = '#22c55e';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Send Message';
    btn.style.background = '';
    btn.disabled = false;
    contactForm.reset();
  }, 3000);
});
 