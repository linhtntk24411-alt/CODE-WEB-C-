// ===== LOAD HEADER & FOOTER VÀ TỰ ĐỘNG KHỞI TẠO =====

function ensureFooterAccordion() {
  if (window.__footerAccordionLoaded) {
    if (window.initFooterAccordion) window.initFooterAccordion();
    return;
  }

  if (window.initFooterAccordion) {
    window.initFooterAccordion();
    return;
  }

  const existingScript = document.querySelector('script[data-footer-accordion]');
  if (existingScript) return;

  const script = document.createElement('script');
  script.src = '../js/footer.js';
  script.setAttribute('data-footer-accordion', 'true');
  script.onload = function () {
    window.__footerAccordionLoaded = true;
    if (window.initFooterAccordion) window.initFooterAccordion();
  };
  document.body.appendChild(script);
}

// ===== TỰ ĐỘNG KHỞI TẠO HEADER KHI ĐƯỢC CHÈN VÀO DOM =====
(function autoInitHeader() {
  if (document.querySelector('.urii-header') && window.__headerInitDone) return;

  const headerPlaceholder = document.getElementById('header-placeholder');
  if (!headerPlaceholder) return;

  const observer = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const header = document.querySelector('.urii-header');
        if (header && !window.__headerInitDone) {
          if (typeof window.initHeader === 'function') {
            window.initHeader();
          }
          observer.disconnect();
          break;
        }
      }
    }
  });

  observer.observe(headerPlaceholder, { childList: true, subtree: true });

  if (document.querySelector('.urii-header') && !window.__headerInitDone) {
    if (typeof window.initHeader === 'function') {
      window.initHeader();
      observer.disconnect();
    }
  }
})();

// ===== TỰ ĐỘNG KHỞI TẠO FOOTER ACCORDION KHI ĐƯỢC CHÈN =====
// ===== TỰ ĐỘNG KHỞI TẠO FOOTER ACCORDION KHI ĐƯỢC CHÈN =====
(function autoInitFooter() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (!footerPlaceholder) return;

  const observer = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const footer = document.querySelector('.urii-footer');
        if (footer) {
          // Gọi handleAdminLink bất kể initFooterAccordion có sẵn hay không
          handleAdminLink();
          if (typeof window.initFooterAccordion === 'function') {
            window.initFooterAccordion();
          }
          observer.disconnect();
          break;
        }
      }
    }
  });

  observer.observe(footerPlaceholder, { childList: true, subtree: true });

  if (document.querySelector('.urii-footer')) {
    handleAdminLink();
    if (typeof window.initFooterAccordion === 'function') {
      window.initFooterAccordion();
    }
    observer.disconnect();
  }
})();

// ===== LOAD COMPONENT (giữ nguyên) =====
function loadComponent(elementId, filePath) {
  fetch(filePath)
    .then(response => {
      if (!response.ok) throw new Error(`Không thể tải file: ${filePath}`);
      return response.text();
    })
    .then(data => {
      document.getElementById(elementId).innerHTML = data;
      if (elementId === 'footer-component' || filePath.includes('footer.html')) {
        setTimeout(ensureFooterAccordion, 0);
        setTimeout(handleAdminLink, 50);
      }
      if (elementId === 'header-component' || filePath.includes('header.html')) {
        setTimeout(ensureHeaderBehavior, 0);
      }
      syncCartBadge();
    })
    .catch(error => console.error(error));
}

function syncCartBadge() {
  const cartCount = document.getElementById('cartCount');
  if (!cartCount) return;

  try {
    const saved = localStorage.getItem('cartItems');
    const items = saved ? JSON.parse(saved) : [];
    const total = Array.isArray(items)
      ? items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : 0;
    cartCount.textContent = total;
    cartCount.style.display = total > 0 ? 'flex' : 'none';
  } catch (error) {
    cartCount.textContent = '0';
    cartCount.style.display = 'none';
  }
}

function shouldLoadChatbotWidget() {
  return true;
}

function injectChatbotWidget() {
  if (!shouldLoadChatbotWidget()) {
    const existingRoot = document.getElementById('urii-chatbot-root');
    if (existingRoot) {
      existingRoot.remove();
    }
    return;
  }

  if (document.getElementById('urii-chatbot-root') || document.getElementById('chat-fab')) return;

  const mountPoint = document.body;

  if (!document.querySelector('link[data-chatbot-styles]')) {
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = '../css/chatbot-widget.css';
    styles.setAttribute('data-chatbot-styles', 'true');
    document.head.appendChild(styles);
  }

  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Poppins"]')) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const fontStyles = document.createElement('link');
    fontStyles.rel = 'stylesheet';
    fontStyles.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Nunito+Sans:wght@300;400;600;700&display=swap';
    document.head.appendChild(fontStyles);

    const materialStyles = document.createElement('link');
    materialStyles.rel = 'stylesheet';
    materialStyles.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    document.head.appendChild(materialStyles);
  }

  if (!document.querySelector('link[href*="bootstrap-icons"]')) {
    const bi = document.createElement('link');
    bi.rel = 'stylesheet';
    bi.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css';
    document.head.appendChild(bi);
  }

  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'urii-chatbot-root';
  widgetContainer.innerHTML = `
    <div class="chatbot-wrapper">
      <section id="chat-window" class="chat-window hidden">
        <header class="chat-header">
          <div class="avatar-container">
            <img alt="Urii Mascot" class="bot-avatar-main" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKCfogwmg9DqaHtDqBGDh2EszSFoIZZh0_VFx8XTmsJvJQ6DvK6lTFpYUUQs4gkh03sU5B-CdJyukuKQI3rhRuKYPk2pen2JL5L9V5UXot14qDw1uz15BgBW1Jh-_7sxS2iwTvcE1_UVMGC7Wu4F-C4-vvBpA-xS01AIjeDjyDacX277JxX4u6OEYYqLtZWfvfEzFCFrgr5UPRDjkM8VL5YkMrne_f-MHbFHDpbTcGg_2j3mJ9MsLj1Od2yBZT76XH2Av_mLj0vLZu">
            <span class="status-dot"></span>
          </div>
          <div class="header-info">
            <h2 class="bot-name">Trợ lý ảo Urii</h2>
            <p class="bot-status">Đang trực tuyến</p>
          </div>
          <nav class="header-actions">
            <button id="btn-minimize" class="action-btn"><i class="bi bi-dash"></i></button>
            <button id="btn-close" class="action-btn"><i class="bi bi-x-lg"></i></button>
          </nav>
        </header>

        <main id="chat-body" class="chat-body">
          <div class="date-separator"><span>Hôm nay</span></div>
          <div id="typing-indicator" class="typing-indicator hidden">
            <div class="typing-bubble">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>
        </main>

        <footer class="chat-footer">
          <div class="input-container">
            <button class="icon-btn"><i class="bi bi-plus-circle"></i></button>
            <button class="icon-btn"><i class="bi bi-emoji-smile"></i></button>
            <input id="chat-input" type="text" placeholder="Nhập tin nhắn...">
            <button id="btn-send" class="send-btn">
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
          <p class="credits">Cung cấp bởi Urii AI Engine v2.0</p>
        </footer>
      </section>

      <aside class="fab-container">
        <button id="chat-fab" class="chat-fab">
          <i class="bi bi-stars"></i>
          <span class="pulse-ring"></span>
        </button>
      </aside>
    </div>
  `;
  mountPoint.appendChild(widgetContainer);

  if (!document.querySelector('script[data-chatbot-script]')) {
    const chatScript = document.createElement('script');
    chatScript.src = '../js/chatbot-widget.js';
    chatScript.setAttribute('data-chatbot-script', 'true');
    chatScript.onload = function () {
      if (typeof window.initChatbotWidget === 'function') {
        window.initChatbotWidget();
      }
    };
    document.body.appendChild(chatScript);
  } else if (typeof window.initChatbotWidget === 'function') {
    window.initChatbotWidget();
  }
}

// ===== KHỞI TẠO KHI DOM SẴN SÀNG =====
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById('header-component') && !document.getElementById('header-component').innerHTML) {
    loadComponent("header-component", "../components/header.html");
  }
  if (document.getElementById('footer-component') && !document.getElementById('footer-component').innerHTML) {
    loadComponent("footer-component", "../components/footer.html");
  }
  syncCartBadge();

  setTimeout(ensureFooterAccordion, 100);
  injectChatbotWidget();
});

// ===== LẮNG NGHE SỰ KIỆN GIỎ HÀNG =====
window.addEventListener('cart:updated', syncCartBadge);
window.addEventListener('storage', syncCartBadge);

console.log('✅ main.js loaded – header sẽ tự động khởi tạo khi được chèn.');

// ===== HÀM HIỂN THỊ/ẨN LINK ADMIN =====
function handleAdminLink() {
    const adminDiv = document.getElementById('adminLinkWrapper');
    if (!adminDiv) return;
    const role = localStorage.getItem('userRole');
    adminDiv.style.display = (role === 'admin') ? 'block' : 'none';
}
window.handleAdminLink = handleAdminLink;

// ===== LẮNG NGHE THAY ĐỔI STORAGE (để cập nhật khi userRole thay đổi ở tab khác) =====
window.addEventListener('storage', function(e) {
  if (e.key === 'userRole') {
    handleAdminLink();
  }
  if (e.key === 'cartItems') {
    syncCartBadge();
  }
});

// ===== OBSERVER TOÀN CỤC CHO FOOTER =====
(function globalFooterObserver() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const callback = function(mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.classList && node.classList.contains('urii-footer')) {
            setTimeout(() => {
              if (typeof window.handleAdminLink === 'function') {
                window.handleAdminLink();
              }
            }, 50);
            if (typeof window.initFooterAccordion === 'function') {
              window.initFooterAccordion();
            }
          }
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
})();