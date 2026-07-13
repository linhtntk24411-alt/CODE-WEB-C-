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
    const total = Array.isArray(items) ? items.length : 0;
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
          <div class="input-container" style="position: relative;"> <button id="btn-plus" class="icon-btn"><i class="bi bi-plus-circle"></i></button>
            <input type="file" id="chat-file-input" style="display: none;" multiple>
            
            <button id="btn-emoji" class="icon-btn"><i class="bi bi-emoji-smile"></i></button>
            
            <div id="emoji-picker" class="emoji-picker hidden"></div>

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

  // Tự động cuộn thanh điều hướng ngang đến mục đang kích hoạt trên mobile
  setTimeout(() => {
    const activeNav = document.querySelector('.profile-nav-item.active, .orders-nav-item.active, .sidebar-nav-item.active, .saved-maps-nav-item.active');
    if (activeNav) {
      const container = activeNav.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const itemOffset = activeNav.offsetLeft;
        const itemWidth = activeNav.clientWidth;
        container.scrollLeft = itemOffset - (containerWidth / 2) + (itemWidth / 2);
      }
    }
  }, 150);
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
            if (typeof window.ariiAlert === 'function') {
                window.ariiAlert('Vui lòng đăng nhập để truy cập trang này', {
                    type: 'info',
                    callback: () => {
                        localStorage.setItem('redirectAfterLogin', window.location.href);
                        if (currentPage.startsWith('checkout.html')) {
                            localStorage.setItem('checkoutAction', 'true');
                        }
                        window.location.href = 'login.html';
                    }
                });
            } else {
                alert('Vui lòng đăng nhập để truy cập trang này');
                localStorage.setItem('redirectAfterLogin', window.location.href);
                if (currentPage.startsWith('checkout.html')) {
                    localStorage.setItem('checkoutAction', 'true');
                }
                window.location.href = 'login.html';
            }
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

    // =============================================================
    // POPUP LỰA CHỌN MÃ GIẢM GIÁ DÙNG CHUNG
    // =============================================================
    function injectCouponModalStyles() {
        if (document.getElementById('coupon-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'coupon-modal-styles';
        style.innerHTML = `
            .coupon-modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 99999;
                display: none;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(4px);
            }
            .coupon-modal-content {
                background: #f8f9fa;
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                animation: couponModalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes couponModalFadeIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .coupon-modal-header {
                background: #fff;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #e9ecef;
            }
            .coupon-modal-title {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #212529;
            }
            .coupon-modal-close {
                background: none;
                border: none;
                font-size: 28px;
                line-height: 1;
                color: #adb5bd;
                cursor: pointer;
                padding: 0;
            }
            .coupon-modal-close:hover {
                color: #495057;
            }
            .coupon-modal-body {
                padding: 20px;
                overflow-y: auto;
                flex: 1;
            }
            .coupon-section-title {
                font-size: 12px;
                font-weight: 700;
                color: #6c757d;
                margin-bottom: 12px;
                margin-top: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .coupon-card {
                display: flex;
                background: #fff;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                margin-bottom: 12px;
                overflow: hidden;
                position: relative;
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.02);
            }
            .coupon-card::before, .coupon-card::after {
                content: '';
                position: absolute;
                width: 12px;
                height: 12px;
                background: #f8f9fa;
                border-radius: 50%;
                left: 89px;
                z-index: 2;
            }
            .coupon-card::before {
                top: -6px;
                border-bottom: 1px solid #e0e0e0;
            }
            .coupon-card::after {
                bottom: -6px;
                border-top: 1px solid #e0e0e0;
            }
            .coupon-card-left {
                width: 95px;
                padding: 15px 10px;
                background: linear-gradient(135deg, #b00103, #840001);
                color: #fff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                text-align: center;
                border-right: 1px dashed #e0e0e0;
            }
            .coupon-card.disabled .coupon-card-left {
                background: linear-gradient(135deg, #ced4da, #e9ecef);
                color: #6c757d;
            }
            .coupon-card-value {
                font-size: 18px;
                font-weight: 800;
                line-height: 1.1;
            }
            .coupon-card-type {
                font-size: 10px;
                margin-top: 4px;
                opacity: 0.9;
                text-transform: uppercase;
            }
            .coupon-card-right {
                flex: 1;
                padding: 12px 15px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-width: 0;
            }
            .coupon-card-code {
                font-family: monospace;
                font-size: 12px;
                background: #e9ecef;
                color: #495057;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 700;
                width: fit-content;
            }
            .coupon-card.disabled .coupon-card-code {
                background: #f1f3f5;
                color: #adb5bd;
            }
            .coupon-card-desc {
                font-size: 12px;
                color: #495057;
                margin: 6px 0;
                font-weight: 600;
                line-height: 1.3;
                word-wrap: break-word;
            }
            .coupon-card.disabled .coupon-card-desc {
                color: #868e96;
            }
            .coupon-card-expiry {
                font-size: 10.5px;
                color: #6c757d;
            }
            .coupon-card-error {
                font-size: 11px;
                color: #dc3545;
                margin-top: 4px;
                font-weight: 600;
            }
            .coupon-btn-apply {
                background: #840001;
                color: #fff;
                border: none;
                border-radius: 20px;
                padding: 4px 14px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .coupon-btn-apply:hover {
                background: #b00103;
            }
            .coupon-btn-remove {
                background: #fff;
                color: #dc3545;
                border: 1px solid #ffc9c9;
                border-radius: 12px;
                padding: 10px 15px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
                margin-bottom: 15px;
                text-align: center;
                transition: all 0.2s;
                box-shadow: 0 2px 5px rgba(220, 53, 69, 0.05);
            }
            .coupon-btn-remove:hover {
                background: #fff5f5;
                border-color: #fa5252;
            }
        `;
        document.head.appendChild(style);
    }

    window.couponSelectorCallbacks = window.couponSelectorCallbacks || {};

    window.openCouponSelector = function(inputId, subtotal, onSelectCallback) {
        injectCouponModalStyles();
        
        let backdrop = document.getElementById('couponModalBackdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'couponModalBackdrop';
            backdrop.className = 'coupon-modal-backdrop';
            document.body.appendChild(backdrop);
            
            backdrop.addEventListener('click', function(e) {
                if (e.target === backdrop) {
                    window.closeCouponSelector();
                }
            });
        }
        
        const callbackId = 'cb_' + Date.now();
        window.couponSelectorCallbacks[callbackId] = onSelectCallback;
        
        const coupons = window.getCoupons() || [];
        const savedPromo = localStorage.getItem('appliedPromoCode');
        let hasActivePromo = savedPromo && savedPromo.trim() !== '';
        
        let availableHtml = '';
        let unavailableHtml = '';
        
        coupons.forEach(c => {
            const validation = window.validateCoupon(c.code, subtotal);
            const isFreeshipType = c.value.toLowerCase().includes('miễn') || c.value.toLowerCase().includes('ship') || c.code.toUpperCase() === 'FREESHIP';
            
            if (validation.success) {
                availableHtml += `
                    <div class="coupon-card">
                        <div class="coupon-card-left" style="background: linear-gradient(135deg, #b00103, #840001);">
                            <span class="coupon-card-value">${c.value}</span>
                            <span class="coupon-card-type">${isFreeshipType ? 'FreeShip' : 'Giảm'}</span>
                        </div>
                        <div class="coupon-card-right">
                            <div>
                                <div class="coupon-card-code">${c.code}</div>
                                <div class="coupon-card-desc">${c.description}</div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="coupon-card-expiry"><i class="bi bi-calendar3 me-1"></i>HSD: ${c.expiry}</span>
                                <button class="coupon-btn-apply" onclick="window.selectCouponAndClose('${inputId}', '${c.code}', '${callbackId}')">Áp dụng</button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                unavailableHtml += `
                    <div class="coupon-card disabled">
                        <div class="coupon-card-left">
                            <span class="coupon-card-value">${c.value}</span>
                            <span class="coupon-card-type">${isFreeshipType ? 'FreeShip' : 'Giảm'}</span>
                        </div>
                        <div class="coupon-card-right">
                            <div>
                                <div class="coupon-card-code">${c.code}</div>
                                <div class="coupon-card-desc">${c.description}</div>
                                <div class="coupon-card-error"><i class="bi bi-exclamation-circle me-1"></i>${validation.message}</div>
                            </div>
                            <div class="mt-2">
                                <span class="coupon-card-expiry"><i class="bi bi-calendar3 me-1"></i>Hiệu lực: ${c.startDate} - ${c.expiry}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        let removeButtonHtml = '';
        if (hasActivePromo) {
            removeButtonHtml = `
                <button class="coupon-btn-remove" onclick="window.selectCouponAndClose('${inputId}', '', '${callbackId}')">
                    <i class="bi bi-trash3 me-1"></i> Không sử dụng mã giảm giá
                </button>
            `;
        }
        
        backdrop.innerHTML = `
            <div class="coupon-modal-content">
                <div class="coupon-modal-header">
                    <h5 class="coupon-modal-title">Chọn mã giảm giá</h5>
                    <button type="button" class="coupon-modal-close" onclick="window.closeCouponSelector()">&times;</button>
                </div>
                <div class="coupon-modal-body">
                    ${removeButtonHtml}
                    
                    <div class="coupon-section-title">Mã giảm giá khả dụng</div>
                    ${availableHtml || '<div class="text-muted small text-center my-3">Không có mã giảm giá nào khả dụng cho đơn hàng này.</div>'}
                    
                    <div class="coupon-section-title mt-3">Mã giảm giá không khả dụng</div>
                    ${unavailableHtml || '<div class="text-muted small text-center my-3">Không có mã giảm giá nào khác.</div>'}
                </div>
            </div>
        `;
        
        backdrop.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeCouponSelector = function() {
        const backdrop = document.getElementById('couponModalBackdrop');
        if (backdrop) {
            backdrop.style.display = 'none';
        }
        document.body.style.overflow = '';
    };

    window.selectCouponAndClose = function(inputId, code, callbackId) {
        window.closeCouponSelector();
        
        const input = document.getElementById(inputId);
        if (input) {
            input.value = code;
        }
        
        const callback = window.couponSelectorCallbacks[callbackId];
        if (typeof callback === 'function') {
            callback(code);
            delete window.couponSelectorCallbacks[callbackId];
        }
    };

    // =============================================================
    // HỆ THỐNG THÔNG BÁO VÀ HỘP THOẠI TRỰC QUAN (ARII ALERTS & TOASTS)
    // =============================================================
    function injectAriiDialogStyles() {
        if (document.getElementById('arii-dialog-styles')) return;
        const style = document.createElement('style');
        style.id = 'arii-dialog-styles';
        style.innerHTML = `
            .arii-dialog-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.35);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(8px);
                font-family: 'Nunito Sans', sans-serif;
                animation: uriiFadeIn 0.25s ease-out;
            }
            .arii-dialog-box {
                background: #fff;
                border-radius: 24px;
                width: 90%;
                max-width: 380px;
                padding: 32px 24px 24px;
                box-shadow: 0 25px 50px -12px rgba(132, 0, 1, 0.08), 0 0 0 1px rgba(132, 0, 1, 0.03);
                text-align: center;
                animation: uriiScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            @keyframes uriiFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes uriiScaleIn {
                from { transform: scale(0.85) translateY(15px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .arii-dialog-icon {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-size: 30px;
                transition: all 0.2s ease;
            }
            .arii-dialog-icon.success {
                background: #e6fcf5;
                color: #0ca678;
                box-shadow: 0 0 0 8px rgba(12, 166, 120, 0.08);
            }
            .arii-dialog-icon.error {
                background: #fff5f5;
                color: #fa5252;
                box-shadow: 0 0 0 8px rgba(250, 82, 82, 0.08);
            }
            .arii-dialog-icon.warning {
                background: #fff0f0;
                color: #840001;
                box-shadow: 0 0 0 8px rgba(132, 0, 1, 0.08);
            }
            .arii-dialog-icon.info {
                background: #fff0f0;
                color: #840001;
                box-shadow: 0 0 0 8px rgba(132, 0, 1, 0.08);
            }
            .arii-dialog-title {
                font-size: 20px;
                font-weight: 800;
                color: #840001;
                margin-bottom: 10px;
                letter-spacing: -0.02em;
            }
            .arii-dialog-message {
                font-size: 14.5px;
                color: #495057;
                margin-bottom: 28px;
                line-height: 1.6;
                font-weight: 600;
            }
            .arii-dialog-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            .arii-dialog-btn {
                border: none;
                border-radius: 30px;
                padding: 11px 26px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                min-width: 110px;
                letter-spacing: 0.2px;
            }
            .arii-dialog-btn.confirm {
                background: linear-gradient(135deg, #b00103, #840001);
                color: #fff;
                box-shadow: 0 4px 12px rgba(132, 0, 1, 0.2);
            }
            .arii-dialog-btn.confirm:hover {
                box-shadow: 0 8px 20px rgba(132, 0, 1, 0.35);
                transform: translateY(-2px);
            }
            .arii-dialog-btn.confirm:active {
                transform: translateY(0);
            }
            .arii-dialog-btn.cancel {
                background: #f8f5f4;
                color: #805062;
                border: 1px solid #e5bdb7;
            }
            .arii-dialog-btn.cancel:hover {
                background: #f0eded;
                color: #700001;
                transform: translateY(-1px);
            }
            .arii-dialog-btn.cancel:active {
                transform: translateY(0);
            }

            /* Toast Styles */
            .arii-toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 9999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                font-family: 'Nunito Sans', sans-serif;
            }
            .arii-toast {
                background: #fff;
                border-radius: 16px;
                padding: 14px 22px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03);
                display: flex;
                align-items: center;
                gap: 14px;
                min-width: 280px;
                max-width: 400px;
                animation: uriiToastSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                transition: all 0.3s ease;
                border-left: 5px solid #3b5bdb;
                pointer-events: auto;
            }
            .arii-toast.success { border-left-color: #0ca678; }
            .arii-toast.error { border-left-color: #fa5252; }
            .arii-toast.warning { border-left-color: #f59f00; }
            .arii-toast.info { border-left-color: #228be6; }

            @keyframes uriiToastSlideIn {
                from { transform: translateX(80px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .arii-toast-icon {
                font-size: 22px;
            }
            .arii-toast.success .arii-toast-icon { color: #0ca678; }
            .arii-toast.error .arii-toast-icon { color: #fa5252; }
            .arii-toast.warning .arii-toast-icon { color: #f59f00; }
            .arii-toast.info .arii-toast-icon { color: #228be6; }

            .arii-toast-content {
                flex: 1;
                font-size: 14px;
                color: #334155;
                font-weight: 700;
                line-height: 1.4;
            }
            .arii-toast-close {
                background: none;
                border: none;
                color: #cbd5e1;
                cursor: pointer;
                font-size: 20px;
                line-height: 1;
                padding: 0 0 0 8px;
                transition: all 0.2s ease;
            }
            .arii-toast-close:hover {
                color: #ef4444;
            }
        `;
        document.head.appendChild(style);
    }

    window.ariiToast = function(message, type = 'success') {
        injectAriiDialogStyles();
        
        let container = document.getElementById('ariiToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ariiToastContainer';
            container.className = 'arii-toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `arii-toast ${type}`;
        
        let iconHtml = '<i class="bi bi-info-circle-fill arii-toast-icon"></i>';
        if (type === 'success') iconHtml = '<i class="bi bi-check-circle-fill arii-toast-icon"></i>';
        else if (type === 'error') iconHtml = '<i class="bi bi-x-circle-fill arii-toast-icon"></i>';
        else if (type === 'warning') iconHtml = '<i class="bi bi-exclamation-triangle-fill arii-toast-icon"></i>';
        
        toast.innerHTML = `
            ${iconHtml}
            <div class="arii-toast-content">${message}</div>
            <button class="arii-toast-close">&times;</button>
        `;
        
        container.appendChild(toast);
        
        toast.querySelector('.arii-toast-close').addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'scale(0.9) translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        });
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'scale(0.9) translateX(20px)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3500);
    };

    window.ariiAlert = function(message, options = {}) {
        injectAriiDialogStyles();
        
        const type = options.type || 'info';
        const title = options.title || 'Thông báo';
        const callback = options.callback;
        
        let backdrop = document.getElementById('ariiAlertBackdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'ariiAlertBackdrop';
            backdrop.className = 'arii-dialog-backdrop';
            document.body.appendChild(backdrop);
        }
        
        let iconHtml = '<i class="bi bi-info-circle"></i>';
        if (type === 'success') iconHtml = '<i class="bi bi-check-circle"></i>';
        else if (type === 'error') iconHtml = '<i class="bi bi-x-circle"></i>';
        else if (type === 'warning') iconHtml = '<i class="bi bi-exclamation-triangle"></i>';
        
        backdrop.innerHTML = `
            <div class="arii-dialog-box">
                <div class="arii-dialog-icon ${type}">${iconHtml}</div>
                <h5 class="arii-dialog-title">${title}</h5>
                <p class="arii-dialog-message">${message}</p>
                <div class="arii-dialog-buttons">
                    <button class="arii-dialog-btn confirm" id="ariiAlertConfirmBtn">OK</button>
                </div>
            </div>
        `;
        
        backdrop.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        const confirmBtn = document.getElementById('ariiAlertConfirmBtn');
        confirmBtn.focus();
        
        // Clean up previous listeners by cloning
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        
        newBtn.addEventListener('click', () => {
            backdrop.style.display = 'none';
            document.body.style.overflow = '';
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    window.ariiConfirm = function(message, options = {}) {
        injectAriiDialogStyles();
        
        const title = options.title || 'Xác nhận';
        const onConfirm = options.onConfirm;
        const onCancel = options.onCancel;
        const confirmText = options.confirmText || 'Xác nhận';
        const cancelText = options.cancelText || 'Hủy';
        
        let backdrop = document.getElementById('ariiConfirmBackdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'ariiConfirmBackdrop';
            backdrop.className = 'arii-dialog-backdrop';
            document.body.appendChild(backdrop);
        }
        
        backdrop.innerHTML = `
            <div class="arii-dialog-box">
                <div class="arii-dialog-icon warning"><i class="bi bi-question-circle"></i></div>
                <h5 class="arii-dialog-title">${title}</h5>
                <p class="arii-dialog-message">${message}</p>
                <div class="arii-dialog-buttons">
                    <button class="arii-dialog-btn cancel" id="ariiConfirmCancelBtn">${cancelText}</button>
                    <button class="arii-dialog-btn confirm" id="ariiConfirmOkBtn">${confirmText}</button>
                </div>
            </div>
        `;
        
        backdrop.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        const okBtn = document.getElementById('ariiConfirmOkBtn');
        const cancelBtn = document.getElementById('ariiConfirmCancelBtn');
        
        okBtn.focus();
        
        // Clone to remove old listeners
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newOkBtn.addEventListener('click', () => {
            backdrop.style.display = 'none';
            document.body.style.overflow = '';
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });
        
        newCancelBtn.addEventListener('click', () => {
            backdrop.style.display = 'none';
            document.body.style.overflow = '';
            if (typeof onCancel === 'function') {
                onCancel();
            }
        });
    };

    // Override window.alert
    window.alert = function(message) {
        console.log('Interpreting window.alert:', message);
        const msgLower = message.toLowerCase();
        
        if ((msgLower.includes('thêm') && msgLower.includes('giỏ hàng')) || 
            msgLower.includes('thành công') || 
            msgLower.includes('đã lưu') || 
            msgLower.includes('đã áp dụng')) {
            window.ariiToast(message, 'success');
            return;
        }
        
        if (msgLower.includes('lỗi') || msgLower.includes('không hợp lệ') || msgLower.includes('hết hàng') || msgLower.includes('chỉ còn')) {
            window.ariiAlert(message, { type: 'error', title: 'Lỗi' });
            return;
        }
        
        window.ariiAlert(message, { type: 'info', title: 'Thông báo' });
    };
    
    // Đăng ký toàn cục
    window.injectAriiDialogStyles = injectAriiDialogStyles;
    window.ariiToast = ariiToast;
    window.ariiAlert = ariiAlert;
    window.ariiConfirm = ariiConfirm;
    
    // Phục vụ cho khả năng tương thích ngược
    window.ariiShowSuccessToast = function(msg) { window.ariiToast(msg, 'success'); };
    window.ariiShowErrorToast = function(msg) { window.ariiToast(msg, 'error'); };
    window.ariiShowWarningToast = function(msg) { window.ariiToast(msg, 'warning'); };
    window.ariiShowInfoToast = function(msg) { window.ariiToast(msg, 'info'); };
    
    // Cập nhật lại console log debug
    console.log('Arii dialogs, alerts, and toasts initialized!');
})();

console.log('Auth Guard, storage sync & Shared Coupon System initialized in main.js');
