// ===== LOAD HEADER =====
document.addEventListener('DOMContentLoaded', function() {
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    fetch('../components/header.html')
      .then(response => {
        if (!response.ok) throw new Error('Không thể tải header');
        return response.text();
      })
      .then(html => {
        headerPlaceholder.innerHTML = html;
        // Sau khi header được chèn, gọi hàm khởi tạo logic header
        initHeaderLogic();
      })
      .catch(error => {
        console.error('Lỗi tải header:', error);
        headerPlaceholder.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Không thể tải header.</p>';
      });
  }

  // Hàm khởi tạo logic header (sao chép từ header.js nhưng không sửa file đó)
  function initHeaderLogic() {
    const authButtons = document.getElementById('authButtons');
    const accountDropdown = document.getElementById('accountDropdown');
    const btnLogout = document.getElementById('btnLogout');

    // Kiểm tra trạng thái đăng nhập
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

    // Sự kiện đăng xuất
    if (btnLogout) {
      btnLogout.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        window.location.href = '../html/index.html';
      });
    }

    checkLoginState();

    // Active nav-link theo URL
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
});