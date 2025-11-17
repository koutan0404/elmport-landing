(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  const header = document.querySelector('.site-header');

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle('is-condensed', (window.scrollY || 0) > 8);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  if (navToggle && nav) {
    const closeNav = () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', () => {
      const opened = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        closeNav();
      }
    });
  }
})();

// --- Active nav highlight ---
(() => {
  const path = location.pathname.replace(/\/index\.html$/, '/') || '/';
  const links = document.querySelectorAll('#site-nav a[data-path]');
  let hit = false;
  links.forEach((link) => {
    const p = link.getAttribute('data-path');
    const match = (p === '/' && (path === '/' || path === '')) || (p !== '/' && path.startsWith(p));
    if (match && !hit) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
      hit = true;
    }
  });
})();

// --- Smooth scroll for in-page anchors ---
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const header = document.querySelector('.site-header');
  const offset = () => (header ? header.getBoundingClientRect().height : 0);

  const links = document.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#0"])');
  links.forEach((link) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);
    if (!target) return;

    link.addEventListener('click', (event) => {
      if (location.pathname.replace(/^\//, '') !== link.pathname.replace(/^\//, '') ||
          location.hostname !== link.hostname) {
        return;
      }
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - offset() - 12;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: 'smooth'
      });
    });
  });
})();

// --- Reveal on scroll ---
(() => {
  const items = document.querySelectorAll('.reveal-up');
  if (!items.length || typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2,
  });

  items.forEach((item) => observer.observe(item));
})();