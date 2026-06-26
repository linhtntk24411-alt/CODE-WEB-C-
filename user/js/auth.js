// user/js/auth.js
(function() {
  // --- Xử lý tab switching (chỉ có ở login.html) ---
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');

  function setActiveTab(active) {
    if (loginTab && registerTab) {
      loginTab.classList.toggle('active', active === 'login');
      registerTab.classList.toggle('active', active === 'register');
      loginTab.setAttribute('aria-selected', active === 'login');
      registerTab.setAttribute('aria-selected', active === 'register');
    }
  }

  if (loginTab && registerTab) {
    loginTab.addEventListener('click', function() {
      setActiveTab('login');
      if (authTitle) authTitle.textContent = 'Chào mừng trở lại';
      if (authSubtitle) authSubtitle.textContent = 'Vui lòng đăng nhập để tiếp tục sáng tạo cùng Urii.';
    });

    registerTab.addEventListener('click', function() {
      setActiveTab('register');
      if (authTitle) authTitle.textContent = 'Tham gia Urii';
      if (authSubtitle) authSubtitle.textContent = 'Bắt đầu hành trình sáng tạo những hạt đậu đầy màu sắc.';
    });
  }

  // --- Xử lý form login ---
  const loginForm = document.getElementById('auth-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const btn = loginForm.querySelector('.auth-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Đang xử lý...';
      btn.disabled = true;
      btn.classList.add('loading');

      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('loading');
        alert('Cảm ơn bạn đã đăng nhập! (Demo)');
      }, 1500);
    });
  }

  // --- Xử lý form register (nếu tồn tại) ---
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const btn = registerForm.querySelector('.auth-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Đang xử lý...';
      btn.disabled = true;
      btn.classList.add('loading');

      // Kiểm tra mật khẩu khớp
      const password = document.getElementById('password');
      const confirm = document.getElementById('confirm-password');
      if (password.value !== confirm.value) {
        alert('Mật khẩu xác nhận không khớp!');
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('loading');
        return;
      }

      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('loading');
        alert('Đăng ký thành công! (Demo)');
        // window.location.href = 'login.html';
      }, 1500);
    });
  }
})();