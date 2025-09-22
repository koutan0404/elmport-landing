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

// --- Active nav highlight ---
(() => {
  const path = location.pathname.replace(/\/index\.html$/,'/') || '/';
  const links = document.querySelectorAll('#site-nav a[data-path]');
  let hit = false;
  links.forEach(a => {
    const p = a.getAttribute('data-path');
    const match = (p === '/' && (path === '/' || path === '')) || (p !== '/' && path.startsWith(p));
    if (match && !hit) { // 先頭一致の最初のものを使用
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
      hit = true;
    }
  });
})();