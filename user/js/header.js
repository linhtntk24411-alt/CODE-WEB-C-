// ==========================================================================
//   URII HEADER JS – Gợi ý tìm kiếm + Avatar + Logout Modal
// ==========================================================================

function initHeader() {
    if (window.__headerInitDone) {
        const authButtons = document.getElementById('authButtons');
        const accountDropdown = document.getElementById('accountDropdown');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (authButtons && accountDropdown) {
            if (isLoggedIn === 'true') {
                authButtons.style.display = 'none';
                accountDropdown.style.display = 'flex';
                updateAvatar();
            } else {
                authButtons.style.display = 'flex';
                accountDropdown.style.display = 'none';
                updateAvatar();
            }
        }
        return;
    }
    window.__headerInitDone = true;

    const authButtons = document.getElementById('authButtons');
    const accountDropdown = document.getElementById('accountDropdown');
    const btnLogout = document.getElementById('btnLogout');
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
            // Đã đăng nhập: hiển thị avatar (có thể là ảnh user hoặc ảnh mặc định)
            if (avatarUrl && avatarUrl.trim() !== '') {
                avatarImg.src = avatarUrl;
            } else {
                avatarImg.src = '../assets/avatar-non.jpg';
            }
            avatarImg.style.display = 'block';
            avatarSvg.style.display = 'none';
            // Xử lý lỗi tải ảnh: nếu ảnh lỗi, hiển thị ảnh mặc định
            avatarImg.onerror = function() {
                this.onerror = null;
                this.src = '../assets/avatar-non.jpg';
            };
        } else {
            // Chưa đăng nhập: hiển thị SVG user
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
                localStorage.removeItem('userRole'); // Thêm dòng này
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
        if (document.querySelector('.mobile-nav-overlay')) {
            document.querySelector('.mobile-nav-overlay').remove();
        }

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
                const isSvg = target.closest('svg'); // Kiểm tra click vào mũi tên

                // Nếu click vào mũi tên (SVG) -> toggle dropdown và chặn điều hướng
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
                // Nếu click vào chữ (không phải SVG) -> để trình duyệt điều hướng bình thường
                // Không gọi preventDefault() hay stopImmediatePropagation()
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

    // ===== TÌM KIẾM ===== (giữ nguyên, không thay đổi)
    // ... (phần tìm kiếm dài, giữ nguyên)
    // Để tiết kiệm, tôi không paste lại toàn bộ phần tìm kiếm, nhưng bạn giữ nguyên code cũ.
    // Nếu cần, tôi sẽ gửi đầy đủ file header.js sau.

    loadProductData();
}

window.initHeader = initHeader;

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.urii-header')) {
        initHeader();
    }
});