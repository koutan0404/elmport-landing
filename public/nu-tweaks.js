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

// --- スクリーンショット画像のモーダル表示（オプション） ---
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const screens = document.querySelectorAll('.screen img');
    if (!screens.length) return;
    
    // モーダル作成
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <img src="" alt="">
        <button class="modal-close" aria-label="閉じる">×</button>
      </div>
    `;
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
    `;
    
    // スタイル追加
    const style = document.createElement('style');
    style.textContent = `
      .image-modal { display: none; }
      .image-modal.active { display: flex; align-items: center; justify-content: center; }
      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
      }
      .modal-content {
        position: relative;
        max-width: 90%;
        max-height: 90vh;
        z-index: 1;
      }
      .modal-content img {
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }
      .modal-close {
        position: absolute;
        top: -40px;
        right: 0;
        background: white;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      .modal-close:hover {
        transform: scale(1.1);
      }
      .screen {
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    const modalImg = modal.querySelector('.modal-content img');
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    // クリックイベント
    screens.forEach(img => {
      img.addEventListener('click', () => {
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });
    
    // 閉じる処理
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  });
})();

// --- スクリーンショットの左右スクロールボタン（オプション） ---
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.screens-wrapper');
    const container = document.querySelector('.screens');
    if (!wrapper || !container) return;
    
    // ボタン追加
    const prevBtn = document.createElement('button');
    const nextBtn = document.createElement('button');
    
    prevBtn.className = 'scroll-btn scroll-prev';
    nextBtn.className = 'scroll-btn scroll-next';
    prevBtn.innerHTML = '‹';
    nextBtn.innerHTML = '›';
    prevBtn.setAttribute('aria-label', '前へ');
    nextBtn.setAttribute('aria-label', '次へ');
    
    wrapper.appendChild(prevBtn);
    wrapper.appendChild(nextBtn);
    
    // スタイル追加
    const style = document.createElement('style');
    style.textContent = `
      .screens-wrapper {
        position: relative;
      }
      .scroll-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--line);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .scroll-btn:hover {
        background: var(--nu-green);
        color: white;
        transform: translateY(-50%) scale(1.1);
      }
      .scroll-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .scroll-prev { left: -20px; }
      .scroll-next { right: -20px; }
      @media (max-width: 640px) {
        .scroll-btn { display: none; }
      }
    `;
    document.head.appendChild(style);
    
    // スクロール処理
    const scrollAmount = 300;
    
    const updateButtons = () => {
      prevBtn.disabled = container.scrollLeft <= 0;
      nextBtn.disabled = container.scrollLeft >= container.scrollWidth - container.clientWidth;
    };
    
    prevBtn.addEventListener('click', () => {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    
    nextBtn.addEventListener('click', () => {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    
    container.addEventListener('scroll', updateButtons);
    updateButtons();
  });
})();