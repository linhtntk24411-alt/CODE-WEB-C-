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

  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Segoe UI"]')) {
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
    fontStyles.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700&display=swap';
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
          <img src="../assets/chatbotai.png" alt="Chatbot" class="chat-fab-image">
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

// main.js - Thêm vào cuối file (sau phần observer toàn cục)

// =============================================================
// LẮNG NGHE SỰ KIỆN AUTH CHANGED
// =============================================================

document.addEventListener('auth:changed', function() {
    console.log('Auth changed event received - updating UI');
    
    // Cập nhật header
    if (typeof window.initHeader === 'function') {
        window.initHeader();
    }
    
    // Cập nhật nút checkout trong cart (nếu có)
    if (typeof window.updateCheckoutButton === 'function') {
        window.updateCheckoutButton();
    }
    
    // Cập nhật badge giỏ hàng
    if (typeof window.syncCartBadge === 'function') {
        window.syncCartBadge();
    }
    
    // Cập nhật admin link trong footer
    if (typeof window.handleAdminLink === 'function') {
        window.handleAdminLink();
    }
});

// ===== AUTH GUARD & STORAGE SYNC =====
(function authGuardAndSync() {
    const protectedPages = [
        'profile.html',
        'orders.html',
        'order-detail.html',
        'custom-order-list.html',
        'custom-order-detail.html',
        'custom-order-request.html',
        'myreview.html',
        'checkout.html'
    ];
    
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    const isProtected = protectedPages.some(page => currentPage.startsWith(page));
    
    function checkAuthAndRedirect() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isProtected && !isLoggedIn) {
            console.log('🔒 Protected page accessed without login. Redirecting to login...');
            alert('Vui lòng đăng nhập để truy cập trang này');
            localStorage.setItem('redirectAfterLogin', window.location.href);
            if (currentPage.startsWith('checkout.html')) {
                localStorage.setItem('checkoutAction', 'true');
            }
            window.location.href = 'login.html';
        }
    }

    // Chạy kiểm tra ngay khi nạp script
    checkAuthAndRedirect();
    
    // Lắng nghe storage change để cập nhật khi có thay đổi từ tab khác
    window.addEventListener('storage', function(e) {
        if (!e.key || e.key === 'isLoggedIn' || e.key === 'userName' || e.key === 'userAvatar' || e.key === 'userRole') {
            console.log('Storage changed - updating auth state:', e.key);
            
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            
            // Nếu trang hiện tại là trang bảo vệ và vừa bị đăng xuất
            if (isProtected && !isLoggedIn) {
                console.log('🔒 Detected logout in other tab on protected page. Redirecting...');
                window.location.href = 'login.html';
                return;
            }
            
            if (typeof window.initHeader === 'function') {
                window.initHeader();
            }
            if (typeof window.updateCheckoutButton === 'function') {
                window.updateCheckoutButton();
            }
            if (typeof window.syncCartBadge === 'function') {
                window.syncCartBadge();
            }
            if (typeof window.handleAdminLink === 'function') {
                window.handleAdminLink();
            }
        }
    });
})();

// ===== SHARED COUPON SYSTEM =====
(function sharedCouponSystem() {
    const defaultCoupons = [
        {
            id: 1,
            code: 'URII10',
            value: '10%',
            condition: 'Đơn tối thiểu 200k',
            created: '10/10/2026',
            startDate: '10/10/2026',
            expiry: '30/10/2027',
            status: 'active',
            statusText: 'Đang hoạt động',
            maxUses: '100',
            description: 'Mã giảm giá 10% cho đơn hàng từ 200k, áp dụng cho tất cả sản phẩm.'
        },
        {
            id: 2,
            code: 'URII20',
            value: '20k',
            condition: 'Cho bộ KIT mới',
            created: '15/10/2026',
            startDate: '15/10/2026',
            expiry: '25/12/2027',
            status: 'active',
            statusText: 'Đang hoạt động',
            maxUses: '50',
            description: 'Giảm 20k cho bộ KIT mới, hoạt động đến năm 2027.'
        },
        {
            id: 3,
            code: 'SUMMER15',
            value: '15%',
            condition: 'Tất cả sản phẩm',
            created: '01/06/2026',
            startDate: '01/06/2026',
            expiry: '30/08/2027',
            status: 'active',
            statusText: 'Đang hoạt động',
            maxUses: '200',
            description: 'Mã giảm giá mùa hè 15% cho tất cả sản phẩm, hoạt động đến năm 2027.'
        },
        {
            id: 4,
            code: 'DIY30',
            value: '30k',
            condition: 'Đơn từ 500k',
            created: '20/10/2026',
            startDate: '20/10/2026',
            expiry: '20/11/2027',
            status: 'active',
            statusText: 'Đang hoạt động',
            maxUses: '75',
            description: 'Giảm 30k cho đơn hàng từ 500k, áp dụng cho sản phẩm DIY.'
        },
        {
            id: 5,
            code: 'FREESHIP',
            value: 'Miễn phí',
            condition: 'Đơn từ 300k',
            created: '01/11/2026',
            startDate: '01/11/2026',
            expiry: '30/11/2027',
            status: 'active',
            statusText: 'Đang hoạt động',
            maxUses: 'Không giới hạn',
            description: 'Miễn phí vận chuyển cho đơn hàng từ 300k.'
        },
        {
            id: 6,
            code: 'BLACKFRI',
            value: '50k',
            condition: 'Đơn từ 1tr',
            created: '25/11/2026',
            startDate: '25/11/2026',
            expiry: '02/12/2027',
            status: 'active',
            statusText: 'Đang hoạt động',
            maxUses: '30',
            description: 'Black Friday - Giảm 50k cho đơn hàng từ 1tr, số lượng có hạn.'
        }
    ];

    function getCoupons() {
        const stored = localStorage.getItem('coupons_data');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const hasOldData = parsed.some(c => c.expiry && c.expiry.includes('/2024'));
                if (parsed.length > 0 && !hasOldData) {
                    return parsed;
                }
            } catch (e) {
                console.error('Error parsing coupons_data:', e);
            }
        }
        localStorage.setItem('coupons_data', JSON.stringify(defaultCoupons));
        return defaultCoupons;
    }

    function parseDateDDMMYYYY(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    function getMinOrderFromCondition(conditionStr) {
        if (!conditionStr) return 0;
        if (conditionStr.toLowerCase().includes('tr') || conditionStr.toLowerCase().includes('triệu')) {
            const matchTr = conditionStr.match(/(\d+)\s*(tr|triệu)/i);
            if (matchTr) return parseInt(matchTr[1]) * 1000000;
        }
        const match = conditionStr.replace(/\./g, '').match(/(\d+)\s*(k|kđ|đ|vnd|)/i);
        if (match) {
            let val = parseInt(match[1]);
            if (conditionStr.toLowerCase().includes('k')) {
                val *= 1000;
            }
            return val;
        }
        return 0;
    }

    function getDiscountAmount(valueStr, subtotal) {
        if (!valueStr) return 0;
        if (valueStr.includes('%')) {
            const percent = parseFloat(valueStr.replace('%', '')) || 0;
            return Math.round(subtotal * percent / 100);
        }
        const matchVal = valueStr.replace(/\./g, '').match(/(\d+)\s*(k|)/i);
        if (matchVal) {
            let val = parseInt(matchVal[1]);
            if (valueStr.toLowerCase().includes('k')) {
                val *= 1000;
            }
            return val;
        }
        return 0;
    }

    function validateCoupon(code, subtotal) {
        if (!code) return { success: false, message: 'Vui lòng nhập mã giảm giá' };
        const couponsList = getCoupons();
        const coupon = couponsList.find(c => c.code.trim().toUpperCase() === code.trim().toUpperCase());
        
        if (!coupon) {
            return { success: false, message: 'Mã giảm giá không tồn tại' };
        }
        
        // Check status and date
        const now = new Date();
        now.setHours(0,0,0,0);
        const start = parseDateDDMMYYYY(coupon.startDate);
        const expiry = parseDateDDMMYYYY(coupon.expiry);
        
        if (start && now < start) {
            return { success: false, message: 'Mã giảm giá chưa đến thời gian sử dụng' };
        }
        if (expiry && now > expiry) {
            return { success: false, message: 'Mã giảm giá đã hết hạn' };
        }
        if (coupon.status === 'expired') {
            return { success: false, message: 'Mã giảm giá đã hết hạn' };
        }
        
        // Check minimum order condition
        const minOrder = getMinOrderFromCondition(coupon.condition);
        if (subtotal < minOrder) {
            return { success: false, message: `Mã này chỉ áp dụng cho đơn hàng từ ${minOrder.toLocaleString('vi-VN')}đ trở lên` };
        }
        
        // Check type of discount
        const isFreeShip = coupon.value.toLowerCase().includes('miễn') || coupon.value.toLowerCase().includes('ship') || coupon.code.toUpperCase() === 'FREESHIP';
        const discountAmount = isFreeShip ? 0 : getDiscountAmount(coupon.value, subtotal);
        
        return {
            success: true,
            discountAmount: discountAmount,
            isFreeShip: isFreeShip,
            value: coupon.value,
            message: `Áp dụng mã giảm giá ${coupon.code} thành công!`
        };
    }

    window.getCoupons = getCoupons;
    window.validateCoupon = validateCoupon;
})();

console.log('Auth Guard, storage sync & Shared Coupon System initialized in main.js');
