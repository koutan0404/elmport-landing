(() => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const opened = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });
  }

  let lastY = 0;
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    const y = window.scrollY || 0;
    if (!header) return;
    header.style.boxShadow = y > 8 ? '0 4px 20px #0000000a' : 'none';
    lastY = y;
  });
})();
