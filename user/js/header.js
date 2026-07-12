// ==========================================================================
//   URII HEADER JS – Gợi ý tìm kiếm + Avatar + Logout Modal
// ==========================================================================

function initHeader() {
    const authButtons = document.getElementById('authButtons');
    const accountDropdown = document.getElementById('accountDropdown');
    const btnLogout = document.getElementById('btnLogout');
    
    // Nếu chưa có các phần tử cốt lõi này trong DOM, trì hoãn init cho đến khi chúng sẵn sàng
    if (!authButtons || !accountDropdown || !btnLogout) {
        console.log('⏳ Header elements not fully loaded yet. Deferring initialization...');
        clearTimeout(window.__headerInitTimeout);
        window.__headerInitTimeout = setTimeout(initHeader, 50);
        return;
    }

    // NẾU ĐÃ INIT RỒI, CHỈ CẬP NHẬT UI, KHÔNG TẠO LẠI SỰ KIỆN
    if (window.__headerInitDone) {
        console.log('🔄 Header already initialized, updating UI only');
        checkAndUpdateAuthState();
        if (typeof updateHeaderCartBadge === 'function') {
            updateHeaderCartBadge();
        }
        return;
    }
    
    console.log('🔄 Initializing header...');
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('initHeader - isLoggedIn:', isLoggedIn);
    
    // Cập nhật UI ngay lập tức
    if (isLoggedIn) {
        authButtons.style.display = 'none';
        accountDropdown.style.display = 'flex';
    } else {
        authButtons.style.display = 'flex';
        accountDropdown.style.display = 'none';
    }
    updateAvatar();
    
    // Cập nhật badge giỏ hàng ngay lập tức khi khởi tạo
    if (typeof updateHeaderCartBadge === 'function') {
        updateHeaderCartBadge();
    }
    
    // Đánh dấu đã init để không chạy lại
    window.__headerInitDone = true;

    const menuBtn = document.getElementById('mobileMenuBtn');
    const headerNav = document.getElementById('headerNav');
    const accountWrapper = document.querySelector('.account-icon-wrapper');

    function updateAvatar() {
        const avatarImg = document.getElementById('accountAvatar');
        const avatarSvg = document.getElementById('accountSvg');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const avatarUrl = localStorage.getItem('userAvatar');

        if (!avatarImg || !avatarSvg) return;

        if (isLoggedIn) {
            if (avatarUrl && avatarUrl.trim() !== '') {
                avatarImg.src = avatarUrl;
            } else {
                avatarImg.src = '../assets/avatar-non.jpg';
            }
            avatarImg.style.display = 'block';
            avatarSvg.style.display = 'none';
            avatarImg.onerror = function() {
                this.onerror = null;
                this.src = '../assets/avatar-non.jpg';
            };
        } else {
            avatarImg.style.display = 'none';
            avatarSvg.style.display = 'block';
        }
    }

    function checkLoginState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');

        if (isLoggedIn === 'true') {
            if (authButtons) authButtons.style.display = 'none';
            if (accountDropdown) accountDropdown.style.display = 'flex';
            updateAvatar();
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (accountDropdown) accountDropdown.style.display = 'none';
            updateAvatar();
        }
    }

    // ===== LOGOUT MODAL =====
    const logoutModal = document.getElementById('logoutModal');
    const logoutOverlay = document.getElementById('logoutModalOverlay');
    const confirmLogoutBtn = document.getElementById('confirmHeaderLogout');
    const cancelLogoutBtns = logoutModal ? logoutModal.querySelectorAll('[data-close="logoutModal"]') : [];

    function openLogoutModal() {
        if (logoutModal) logoutModal.classList.add('active');
        if (logoutOverlay) logoutOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLogoutModal() {
        if (logoutModal) logoutModal.classList.remove('active');
        if (logoutOverlay) logoutOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (btnLogout) {
        btnLogout.removeEventListener('click', openLogoutModal);
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openLogoutModal();
        });
    }

    if (logoutOverlay) {
        logoutOverlay.addEventListener('click', closeLogoutModal);
    }
    cancelLogoutBtns.forEach(btn => {
        btn.addEventListener('click', closeLogoutModal);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && logoutModal && logoutModal.classList.contains('active')) {
            closeLogoutModal();
        }
    });

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            this.textContent = 'Đang xử lý...';
            this.disabled = true;
            setTimeout(() => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userAvatar');
                localStorage.removeItem('userRole');
                
                // PHÁT SỰ KIỆN AUTH CHANGED
                document.dispatchEvent(new CustomEvent('auth:changed'));
                
                if (authButtons) authButtons.style.display = 'flex';
                if (accountDropdown) accountDropdown.style.display = 'none';
                updateAvatar();
                closeLogoutModal();
                window.location.href = '../html/index.html';
            }, 1000);
        });
    }

    // ===== ACCOUNT DROPDOWN =====
    function closeAccountMenu() {
        if (accountWrapper) {
            accountWrapper.classList.remove('open');
            accountWrapper.setAttribute('aria-expanded', 'false');
        }
    }

    function toggleAccountMenu(forceOpen) {
        if (!accountWrapper || accountDropdown?.style.display === 'none') return;
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !accountWrapper.classList.contains('open');
        accountWrapper.classList.toggle('open', shouldOpen);
        accountWrapper.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    }

    if (accountWrapper) {
        accountWrapper.setAttribute('role', 'button');
        accountWrapper.setAttribute('tabindex', '0');
        accountWrapper.setAttribute('aria-haspopup', 'true');
        accountWrapper.setAttribute('aria-expanded', 'false');

        accountWrapper.addEventListener('click', function (e) {
            if (e.target.closest('.btn-logout')) return;
            e.stopPropagation();
            toggleAccountMenu();
        });

        accountWrapper.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                toggleAccountMenu();
            } else if (e.key === 'Escape') {
                closeAccountMenu();
            }
        });
    }

    document.addEventListener('click', function (e) {
        if (accountWrapper && !accountWrapper.contains(e.target)) {
            closeAccountMenu();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAccountMenu();
    });

    checkLoginState();

    // ===== HAMBURGER MENU =====
    if (menuBtn && headerNav) {
        // Xóa overlay cũ nếu có
        const oldOverlay = document.querySelector('.mobile-nav-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        document.body.appendChild(overlay);

        function closeMenu() {
            headerNav.classList.remove('show');
            menuBtn.classList.remove('active');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
            headerNav.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }

        function openMenu() {
            headerNav.classList.add('show');
            menuBtn.classList.add('active');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        menuBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (headerNav.classList.contains('show')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        overlay.addEventListener('click', closeMenu);

        headerNav.querySelectorAll('.nav-dropdown > .nav-link').forEach(toggle => {
            toggle.addEventListener('click', function (e) {
                const parentDropdown = this.closest('.nav-dropdown');
                if (!parentDropdown) return;

                const target = e.target;
                const isSvg = target.closest('svg');

                if (isSvg) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    const shouldOpen = !parentDropdown.classList.contains('open');

                    headerNav.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
                        if (dropdown !== parentDropdown) {
                            dropdown.classList.remove('open');
                        }
                    });

                    parentDropdown.classList.toggle('open', shouldOpen);
                    this.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
                }
            });
        });

        headerNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function (e) {
                if (this.classList.contains('nav-dropdown-toggle')) return;
                if (this.closest('.nav-dropdown') && this.classList.contains('nav-link') && window.innerWidth <= 1024) {
                    return;
                }
                closeMenu();
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // ===== ACTIVE NAV LINK =====
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('../html/', ''))) {
            link.classList.add('active');
        }
    });

    // ============================================================
    // TÌM KIẾM VỚI GỢI Ý – CHỈ LẤY TỪ product.json
    // ============================================================

    const searchInput = document.querySelector('.search-box input');
    const searchBtn = document.querySelector('.btn-search-icon');

    function ensureHeaderSuggestionBox(searchBox) {
        let box = searchBox.querySelector('.header-search-suggestions');
        if (!box) {
            box = document.createElement('div');
            box.className = 'header-search-suggestions';
            searchBox.appendChild(box);
        }
        return box;
    }

    function hideHeaderSuggestions(searchBox) {
        const box = searchBox ? searchBox.querySelector('.header-search-suggestions') : null;
        if (box) {
            box.classList.remove('show');
            box.innerHTML = '';
        }
    }

    async function updateHeaderSuggestions(value, searchBox) {
        if (!searchBox || window.innerWidth <= 768) {
            hideHeaderSuggestions(searchBox);
            return;
        }

        const suggestionsBox = ensureHeaderSuggestionBox(searchBox);
        const term = (value || '').toLowerCase().trim();

        if (!term) {
            suggestionsBox.innerHTML = '';
            suggestionsBox.classList.remove('show');
            return;
        }

        const products = await loadProductData();

        const filtered = products.filter(product => {
            const name = (product.name || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            return name.includes(term) || category.includes(term);
        }).slice(0, 6);

        if (!filtered.length) {
            suggestionsBox.innerHTML = '<div class="header-search-suggestion-item" style="cursor: default; color: var(--muted);">Không có gợi ý phù hợp</div>';
            suggestionsBox.classList.add('show');
            return;
        }

        suggestionsBox.innerHTML = filtered.map(product => `
            <button type="button" class="header-search-suggestion-item" data-name="${product.name}">
                <span>${product.name}</span>
                <span>${product.category || 'Sản phẩm'}</span>
            </button>
        `).join('');

        suggestionsBox.classList.add('show');

        suggestionsBox.querySelectorAll('.header-search-suggestion-item').forEach(item => {
            item.addEventListener('mousedown', function (e) {
                e.preventDefault();
            });

            item.addEventListener('click', function () {
                const selectedName = this.getAttribute('data-name');
                if (selectedName) {
                    if (searchInput) {
                        searchInput.value = selectedName;
                    }
                    submitSearch(selectedName);
                }
            });
        });
    }

    async function loadProductData() {
        if (window.__productData) return window.__productData;

        try {
            const scripts = document.getElementsByTagName('script');
            let currentScript = null;
            for (let s of scripts) {
                if (s.src && s.src.includes('header.js')) {
                    currentScript = s.src;
                    break;
                }
            }

            let basePath = '';
            if (currentScript) {
                const scriptDir = currentScript.substring(0, currentScript.lastIndexOf('/') + 1);
                basePath = scriptDir.replace(/\/js\//, '/');
            } else {
                basePath = window.location.origin + '/';
            }

            const jsonUrl = basePath + 'data/product.json';
            const response = await fetch(jsonUrl);

            if (!response.ok) throw new Error('Không thể tải dữ liệu sản phẩm');

            const data = await response.json();
            const products = Array.isArray(data.products) ? data.products : [];

            window.__productData = products;
            return window.__productData;

        } catch (error) {
            console.warn('Không thể tải product.json – gợi ý sẽ không hiển thị:', error);
            window.__productData = [];
            return window.__productData;
        }
    }

    function createSearchPopup() {
        if (document.getElementById('mobileSearchPopup')) {
            return document.getElementById('mobileSearchPopup');
        }

        const popup = document.createElement('div');
        popup.id = 'mobileSearchPopup';
        popup.className = 'mobile-search-popup';
        popup.innerHTML = `
            <div class="mobile-search-panel">
                <div class="mobile-search-header">
                    <h3>Tìm kiếm sản phẩm</h3>
                    <button type="button" class="mobile-search-close" aria-label="Đóng tìm kiếm">×</button>
                </div>
                <div class="mobile-search-input-wrap">
                    <input type="text" placeholder="Nhập tên sản phẩm..." />
                    <button type="button" class="mobile-search-submit">Tìm</button>
                </div>
                <div class="mobile-search-suggestions"></div>
            </div>
        `;

        document.body.appendChild(popup);
        return popup;
    }

    function closeSearchPopup() {
        const popup = document.getElementById('mobileSearchPopup');
        if (popup) {
            popup.classList.remove('show');
        }
        document.body.style.overflow = '';
    }

    function bindSearchPopupEvents(popup) {
        if (!popup || popup.dataset.bound === 'true') return;
        popup.dataset.bound = 'true';

        popup.addEventListener('click', function (e) {
            if (e.target === popup) {
                closeSearchPopup();
            }
        });

        const closeBtn = popup.querySelector('.mobile-search-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                closeSearchPopup();
            });
        }

        const popupInput = popup.querySelector('input');
        const popupSubmit = popup.querySelector('.mobile-search-submit');

        if (popupInput) {
            popupInput.addEventListener('input', function () {
                updateMobileSuggestions(this.value, popup);
            });

            popupInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitSearch(this.value);
                }
            });
        }

        if (popupSubmit) {
            popupSubmit.addEventListener('click', function () {
                if (popupInput) {
                    submitSearch(popupInput.value);
                }
            });
        }
    }

    function openSearchPopup() {
        const popup = createSearchPopup();
        popup.classList.add('show');
        bindSearchPopupEvents(popup);
        const popupInput = popup.querySelector('input');
        if (popupInput) {
            popupInput.focus();
            popupInput.value = searchInput ? searchInput.value : '';
            updateMobileSuggestions(popupInput.value, popup);
        }
        document.body.style.overflow = 'hidden';
    }

    function submitSearch(query) {
        const value = (query || '').trim();
        if (!value) return;
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            hideHeaderSuggestions(searchBox);
        }
        closeSearchPopup();
        const base = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/');
        window.location.href = base + '/product.html?search=' + encodeURIComponent(value);
    }

    async function updateMobileSuggestions(value, popup) {
        const suggestionsBox = popup.querySelector('.mobile-search-suggestions');
        if (!suggestionsBox) return;

        const term = (value || '').toLowerCase().trim();
        if (!term) {
            suggestionsBox.innerHTML = '';
            return;
        }

        const products = await loadProductData();

        const filtered = products.filter(product => {
            const name = (product.name || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            return name.includes(term) || category.includes(term);
        }).slice(0, 6);

        if (!filtered.length) {
            suggestionsBox.innerHTML = '<div class="mobile-search-empty">Không có gợi ý phù hợp</div>';
            return;
        }

        suggestionsBox.innerHTML = filtered.map(product => `
            <button type="button" class="mobile-search-item" data-name="${product.name}">
                <span>${product.name}</span>
                <span style="font-size:11px;color:#999;margin-left:8px;">${product.category || ''}</span>
            </button>
        `).join('');

        suggestionsBox.querySelectorAll('.mobile-search-item').forEach(item => {
            item.addEventListener('click', function() {
                const selectedName = this.getAttribute('data-name');
                if (selectedName) {
                    const input = popup.querySelector('input');
                    if (input) {
                        input.value = selectedName;
                    }
                    submitSearch(selectedName);
                }
            });
        });
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function(e) {
            if (window.innerWidth <= 1024) {
                e.preventDefault();
                openSearchPopup();
                return;
            }

            const query = searchInput.value.trim();
            if (query) {
                submitSearch(query);
            }
        });

        searchInput.addEventListener('focus', function () {
            if (window.innerWidth > 768) {
                updateHeaderSuggestions(this.value, this.closest('.search-box'));
            }
        });

        searchInput.addEventListener('input', function () {
            if (window.innerWidth > 768) {
                updateHeaderSuggestions(this.value, this.closest('.search-box'));
            }
        });

        searchInput.addEventListener('blur', function () {
            const searchBox = this.closest('.search-box');
            if (searchBox) {
                setTimeout(() => hideHeaderSuggestions(searchBox), 150);
            }
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (window.innerWidth <= 1024) {
                    e.preventDefault();
                    openSearchPopup();
                    return;
                }
                searchBtn.click();
            }
        });
    }

    loadProductData();
}

// ===== HÀM KIỂM TRA VÀ CẬP NHẬT TRẠNG THÁI AUTH TỪ BÊN NGOÀI =====
function checkAndUpdateAuthState() {
    const authButtons = document.getElementById('authButtons');
    const accountDropdown = document.getElementById('accountDropdown');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    console.log('🔄 Updating auth state - isLoggedIn:', isLoggedIn);
    
    if (authButtons && accountDropdown) {
        if (isLoggedIn) {
            authButtons.style.display = 'none';
            accountDropdown.style.display = 'flex';
            // Cập nhật avatar
            const avatarImg = document.getElementById('accountAvatar');
            const avatarSvg = document.getElementById('accountSvg');
            const avatarUrl = localStorage.getItem('userAvatar');
            
            if (avatarImg && avatarSvg) {
                if (avatarUrl && avatarUrl.trim() !== '') {
                    avatarImg.src = avatarUrl;
                } else {
                    avatarImg.src = '../assets/avatar-non.jpg';
                }
                avatarImg.style.display = 'block';
                avatarSvg.style.display = 'none';
                avatarImg.onerror = function() {
                    this.onerror = null;
                    this.src = '../assets/avatar-non.jpg';
                };
            }
        } else {
            authButtons.style.display = 'flex';
            accountDropdown.style.display = 'none';
            // Reset avatar
            const avatarImg = document.getElementById('accountAvatar');
            const avatarSvg = document.getElementById('accountSvg');
            if (avatarImg && avatarSvg) {
                avatarImg.style.display = 'none';
                avatarSvg.style.display = 'block';
            }
        }
    }
}

// ===== CẬP NHẬT NÚT CHECKOUT KHI AUTH THAY ĐỔI =====
function updateCheckoutButton() {
    const checkoutBtn = document.querySelector('.btn-primary-custom.w-100');
    if (!checkoutBtn) return;
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Clone để xóa sự kiện cũ
    const newBtn = checkoutBtn.cloneNode(true);
    checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
    
    // Cập nhật nội dung nút
    if (!isLoggedIn) {
        newBtn.innerHTML = `<i class="bi bi-box-arrow-in-right me-2"></i>Đăng nhập để thanh toán`;
    } else {
        newBtn.innerHTML = `<i class="bi bi-credit-card me-2"></i>Tiến hành thanh toán`;
    }
    
    // Thêm sự kiện mới
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!isLoggedIn) {
            // Nếu chưa đăng nhập, chuyển đến trang login
            localStorage.setItem('redirectAfterLogin', window.location.href);
            localStorage.setItem('checkoutAction', 'true');
            window.location.href = 'login.html';
        } else {
            if (typeof window.proceedToCheckout === 'function') {
                window.proceedToCheckout();
            }
        }
    });
}

// ===== HÀM CẬP NHẬT BADGE GIỎ HÀNG =====
function updateHeaderCartBadge() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
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
}

// ===== EXPORT RA WINDOW =====
window.checkAndUpdateAuthState = checkAndUpdateAuthState;
window.initHeader = initHeader;
window.updateCheckoutButton = updateCheckoutButton;
window.updateHeaderCartBadge = updateHeaderCartBadge;

// ===== LẮNG NGHE SỰ KIỆN AUTH CHANGED ĐỂ CẬP NHẬT UI =====
document.addEventListener('auth:changed', function() {
    console.log('🔄 auth:changed event received in header.js');
    checkAndUpdateAuthState();
    updateCheckoutButton();
});

// ===== LẮNG NGHE STORAGE CHANGE =====
window.addEventListener('storage', function(e) {
    if (!e.key || e.key === 'isLoggedIn' || e.key === 'userName' || e.key === 'userAvatar' || e.key === 'userRole') {
        console.log('🔄 Storage changed in header.js:', e.key);
        checkAndUpdateAuthState();
        updateCheckoutButton();
    }
    if (!e.key || e.key === 'cartItems') {
        console.log('🔄 Cart storage changed in header.js:', e.key);
        updateHeaderCartBadge();
    }
});

// ===== LẮNG NGHE CART UPDATED =====
document.addEventListener('cart:updated', function() {
    updateHeaderCartBadge();
});

// ===== TỰ ĐỘNG INIT KHI DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.urii-header')) {
        initHeader();
    }
});

// ===== TỰ ĐỘNG INIT KHI HEADER ĐƯỢC CHÈN VÀO DOM =====
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

console.log('✅ header.js loaded - ready to initialize');