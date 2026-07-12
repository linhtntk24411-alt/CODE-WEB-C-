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
    script.onerror = function () {
        console.warn('Không thể tải footer accordion');
    };
    document.body.appendChild(script);
}

function ensureHeaderBehavior() {
    // KHÔNG gọi initHeader ở đây nữa, để loadComponent tự gọi
    if (window.__headerBehaviorLoaded) {
        return;
    }

    if (window.initHeader) {
        return;
    }

    const existingScript = document.querySelector('script[data-header-behavior]');
    if (existingScript) {
        existingScript.addEventListener('load', function () {
            window.__headerBehaviorLoaded = true;
        }, { once: true });
        return;
    }

    const script = document.createElement('script');
    script.src = '../js/header.js';
    script.setAttribute('data-header-behavior', 'true');
    script.onload = function () {
        window.__headerBehaviorLoaded = true;
        // Không gọi initHeader ở đây
    };
    script.onerror = function () {
        console.warn('Không thể tải header behavior');
    };
    document.body.appendChild(script);
}

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
            }
            
            if (elementId === 'header-component' || filePath.includes('header.html')) {
                // ĐỢI header được render xong rồi mới gọi initHeader
                setTimeout(function() {
                    // KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP TRƯỚC KHI INIT
                    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                    console.log('🔄 loadComponent - isLoggedIn:', isLoggedIn);
                    
                    if (typeof window.initHeader === 'function') {
                        window.initHeader();
                    }
                    
                    // Nếu đã đăng nhập, đảm bảo header hiển thị đúng
                    if (isLoggedIn) {
                        setTimeout(function() {
                            if (typeof window.checkAndUpdateAuthState === 'function') {
                                window.checkAndUpdateAuthState();
                            }
                        }, 100);
                    }
                }, 100);
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

// Chạy ngay khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    // KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP TRƯỚC
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('🔄 DOMContentLoaded - isLoggedIn:', isLoggedIn);
    
    loadComponent("header-component", "../components/header.html");
    loadComponent("footer-component", "../components/footer.html");
    syncCartBadge();
    ensureFooterAccordion();
    
    // Đảm bảo main.js được load
    if (!document.querySelector('script[data-main-js]')) {
        const s = document.createElement('script');
        s.src = '../js/main.js';
        s.setAttribute('data-main-js', 'true');
        s.onload = function() {
            try { if (typeof injectChatbotWidget === 'function') injectChatbotWidget(); } catch(e) { console.warn('injectChatbotWidget not available', e); }
        };
        s.onerror = function() { console.warn('Không thể tải main.js'); };
        document.body.appendChild(s);
    } else {
        try { if (typeof injectChatbotWidget === 'function') injectChatbotWidget(); } catch(e) {}
    }
});

window.addEventListener('cart:updated', syncCartBadge);
window.addEventListener('storage', syncCartBadge);