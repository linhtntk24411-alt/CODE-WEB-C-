document.addEventListener('DOMContentLoaded', function () {

    // ── XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT ──
    const authButtons     = document.getElementById('authButtons');
    const accountDropdown = document.getElementById('accountDropdown');
    const btnLogout       = document.getElementById('btnLogout');

    function checkLoginState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');

        if (isLoggedIn === 'true') {
            if (authButtons) authButtons.style.display = 'none';
            if (accountDropdown) accountDropdown.style.display = 'flex';
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (accountDropdown) accountDropdown.style.display = 'none';
        }
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            window.location.href = '../../html/index.html';
        });
    }

    checkLoginState();

    // ── XỬ LÝ ACTIVE NAV LINK THEO URL HIỆN TẠI ──
    const navLinks = document.querySelectorAll('.nav-link');
    const currentUrl = window.location.href;

    navLinks.forEach(link => {
        if (link.href === currentUrl || currentUrl.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });

    // ── XỬ LÝ BẬT/TẮT MENU ĐIỀU HƯỚNG TRÊN ĐIỆN THOẠI ──
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const headerNav     = document.getElementById('headerNav');

    if (mobileMenuBtn && headerNav) {
        mobileMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            headerNav.classList.toggle('show');
            this.classList.toggle('active');
        });

        // Xử lý dropdown trên mobile - click để mở
        const dropdowns = document.querySelectorAll('.nav-dropdown');
        dropdowns.forEach(dropdown => {
            const link = dropdown.querySelector('.nav-link');
            if (link) {
                link.addEventListener('click', function (e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        dropdown.classList.toggle('open');
                    }
                });
            }
        });

        // Đóng menu khi click ra ngoài
        document.addEventListener('click', function (e) {
            if (!headerNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                headerNav.classList.remove('show');
                mobileMenuBtn.classList.remove('active');
            }
        });

        // Đóng menu khi click vào link (trên mobile)
        const mobileLinks = headerNav.querySelectorAll('.nav-link:not(.nav-dropdown .nav-link)');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    headerNav.classList.remove('show');
                    mobileMenuBtn.classList.remove('active');
                }
            });
        });

        // Đóng menu khi resize lên desktop
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) {
                headerNav.classList.remove('show');
                mobileMenuBtn.classList.remove('active');
                document.querySelectorAll('.nav-dropdown.open').forEach(el => {
                    el.classList.remove('open');
                });
            }
        });
    }
});
