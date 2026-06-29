// ==========================================================================
//   URII HEADER JS
// ==========================================================================

function initHeader() {
    const authButtons = document.getElementById('authButtons');
    const accountDropdown = document.getElementById('accountDropdown');
    const btnLogout = document.getElementById('btnLogout');

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
            window.location.href = '../html/index.html';
        });
    }

    checkLoginState();

    // Tự động active nav-link theo URL hiện tại
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('../html/', ''))) {
            link.classList.add('active');
        }
    });

    // Tìm kiếm
    const searchInput = document.querySelector('.search-box input');
    const searchBtn = document.querySelector('.btn-search-icon');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `../html/products.html?search=${encodeURIComponent(query)}`;
            }
        });
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
}

// Đảm bảo có thể gọi từ main.js
window.initHeader = initHeader;

// Tự động chạy nếu header đã có sẵn (trường hợp không dùng fetch)
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.urii-header')) {
        initHeader();
    }
});