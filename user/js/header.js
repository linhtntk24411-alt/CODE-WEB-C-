/* ==========================================================================
   URII HEADER JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const authButtons     = document.getElementById('authButtons');
    const accountDropdown = document.getElementById('accountDropdown');
    const btnLogout       = document.getElementById('btnLogout');

    function checkLoginState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');

        if (isLoggedIn === 'true') {
            authButtons.style.display     = 'none';
            accountDropdown.style.display = 'flex';
        } else {
            authButtons.style.display     = 'flex';
            accountDropdown.style.display = 'none';
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

});

// Tự động active nav-link theo URL hiện tại
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    if (link.href === window.location.href ||
        window.location.pathname.includes(link.getAttribute('href'))) {
        link.classList.add('active');
    }
});