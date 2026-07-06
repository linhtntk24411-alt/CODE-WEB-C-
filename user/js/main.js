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
  // Nếu header đã tồn tại và đã init, không cần làm gì
  if (document.querySelector('.urii-header') && window.__headerInitDone) return;

  const headerPlaceholder = document.getElementById('header-placeholder');
  if (!headerPlaceholder) return;

  // Sử dụng MutationObserver để theo dõi thay đổi nội dung của placeholder
  const observer = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Kiểm tra xem đã có header chưa
        const header = document.querySelector('.urii-header');
        if (header && !window.__headerInitDone) {
          // Gọi initHeader nếu chưa được khởi tạo
          if (typeof window.initHeader === 'function') {
            window.initHeader();
          }
          // Dừng observer sau khi đã init
          observer.disconnect();
          break;
        }
      }
    }
  });

  // Bắt đầu quan sát
  observer.observe(headerPlaceholder, { childList: true, subtree: true });

  // Nếu header đã được chèn trước khi observer bắt đầu (trường hợp trang load nhanh)
  if (document.querySelector('.urii-header') && !window.__headerInitDone) {
    if (typeof window.initHeader === 'function') {
      window.initHeader();
      observer.disconnect();
    }
  }
})();

// ===== TỰ ĐỘNG KHỞI TẠO FOOTER ACCORDION KHI ĐƯỢC CHÈN =====
(function autoInitFooter() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (!footerPlaceholder) return;

  const observer = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const footer = document.querySelector('.urii-footer');
        if (footer && typeof window.initFooterAccordion === 'function') {
          window.initFooterAccordion();
          observer.disconnect();
          break;
        }
      }
    }
  });

  observer.observe(footerPlaceholder, { childList: true, subtree: true });

  if (document.querySelector('.urii-footer') && typeof window.initFooterAccordion === 'function') {
    window.initFooterAccordion();
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
      // Không cần gọi init ở đây, observer sẽ lo
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

// ===== KHỞI TẠO KHI DOM SẴN SÀNG =====
document.addEventListener("DOMContentLoaded", () => {
  // Chỉ load component nếu chưa được load (tránh trùng lặp)
  if (document.getElementById('header-component') && !document.getElementById('header-component').innerHTML) {
    loadComponent("header-component", "../components/header.html");
  }
  if (document.getElementById('footer-component') && !document.getElementById('footer-component').innerHTML) {
    loadComponent("footer-component", "../components/footer.html");
  }
  syncCartBadge();

  // Nếu có placeholder riêng (không dùng header-component), observer sẽ xử lý
  // Đảm bảo accordion footer luôn được kích hoạt
  setTimeout(ensureFooterAccordion, 100);
});

// ===== LẮNG NGHE SỰ KIỆN GIỎ HÀNG =====
window.addEventListener('cart:updated', syncCartBadge);
window.addEventListener('storage', syncCartBadge);

console.log('✅ main.js loaded – header sẽ tự động khởi tạo khi được chèn.');