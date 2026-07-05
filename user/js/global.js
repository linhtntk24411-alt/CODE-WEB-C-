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
    if (window.__headerBehaviorLoaded) {
        if (window.initHeader) window.initHeader();
        return;
    }

    if (window.initHeader) {
        window.initHeader();
        return;
    }

    const existingScript = document.querySelector('script[data-header-behavior]');
    if (existingScript) {
        existingScript.addEventListener('load', function () {
            if (window.initHeader) window.initHeader();
        }, { once: true });
        return;
    }

    const script = document.createElement('script');
    script.src = '../js/header.js';
    script.setAttribute('data-header-behavior', 'true');
    script.onload = function () {
        window.__headerBehaviorLoaded = true;
        if (window.initHeader) window.initHeader();
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

// Chạy ngay khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header-component", "../components/header.html");
    loadComponent("footer-component", "../components/footer.html");
    syncCartBadge();
    ensureFooterAccordion();
});

window.addEventListener('cart:updated', syncCartBadge);
window.addEventListener('storage', syncCartBadge);