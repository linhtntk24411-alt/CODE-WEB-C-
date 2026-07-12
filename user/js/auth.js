// user/js/auth.js
(function() {
  'use strict';

  // ===== TOAST =====
  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast--fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  // ===== Toggle password visibility =====
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = this.querySelector('.material-symbols-outlined');
      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        icon.textContent = 'visibility';
      }
    });
  });

  // ===== PASSWORD REQUIREMENTS (cho register) =====
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');
  const matchFeedback = document.getElementById('passwordMatchFeedback');

  function checkPasswordRequirements(password) {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
  }

  function updateRequirements(password) {
    const checks = checkPasswordRequirements(password);
    document.querySelectorAll('.req-item').forEach(item => {
      const req = item.dataset.req;
      if (checks[req]) {
        item.classList.add('met');
      } else {
        item.classList.remove('met');
      }
    });
  }

  function checkPasswordMatch(pw1, pw2) {
    if (pw1 && pw2) {
      if (pw1 === pw2) {
        matchFeedback.innerHTML = `<span class="match-circle"></span> Mật khẩu khớp!`;
        matchFeedback.className = 'password-match-feedback match';
      } else {
        matchFeedback.innerHTML = `<span class="match-circle"></span> Mật khẩu không khớp`;
        matchFeedback.className = 'password-match-feedback no-match';
      }
    } else {
      matchFeedback.innerHTML = '';
      matchFeedback.className = 'password-match-feedback';
    }
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      updateRequirements(this.value);
      if (confirmInput.value) {
        checkPasswordMatch(this.value, confirmInput.value);
      }
    });
  }

  if (confirmInput) {
    confirmInput.addEventListener('input', function() {
      checkPasswordMatch(passwordInput.value, this.value);
    });
  }

  // ============================================================
  // LOGIN PAGE (login.html)
  // ============================================================
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

  //// --- Xử lý form login ---
  const loginForm = document.getElementById('auth-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = loginForm.querySelector('.auth-btn');
      const originalText = btn.textContent;
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');

      btn.textContent = 'Đang xử lý...';
      btn.disabled = true;
      btn.classList.add('loading');

      try {
        const response = await fetch('../data/users.json');
        if (!response.ok) throw new Error('Không thể tải thông tin người dùng');
        const data = await response.json();
        const users = data.users || [];
        const enteredEmail = (emailInput?.value || '').trim().toLowerCase();
        const enteredPassword = (passwordInput?.value || '').trim();

        const foundUser = users.find(u => 
          u.email.toLowerCase() === enteredEmail && 
          u.password === enteredPassword
        );

        if (foundUser) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userName', foundUser.name);
          localStorage.setItem('userEmail', foundUser.email);
          localStorage.setItem('userAvatar', foundUser.avatar || '');
          localStorage.setItem('userRole', foundUser.role || 'user');

          showToast('Đăng nhập thành công! Chào mừng bạn trở lại.', 'success');

          if (typeof window.initHeader === 'function') {
            window.initHeader();
          }

          // Gọi handleAdminLink để cập nhật footer ngay
          if (typeof window.handleAdminLink === 'function') {
            setTimeout(window.handleAdminLink, 100);
          }

          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1500);
        } else {
          showToast('Email hoặc mật khẩu không đúng. Vui lòng thử lại.', 'error');
        }
      } catch (error) {
        console.error(error);
        showToast('Đã có lỗi khi đăng nhập. Vui lòng thử lại.', 'error');
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });
  }

  // ============================================================
  // REGISTER PAGE (register.html)
  // ============================================================
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const btn = registerForm.querySelector('.auth-btn');
      const originalText = btn.textContent;

      const fullname = document.getElementById('fullname');
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const confirm = document.getElementById('confirm-password');

      // Kiểm tra các trường
      if (!fullname.value.trim()) {
        showToast('Vui lòng nhập họ và tên!', 'error');
        return;
      }
      if (!email.value.trim()) {
        showToast('Vui lòng nhập email!', 'error');
        return;
      }
      if (password.value.length < 8) {
        showToast('Mật khẩu phải có ít nhất 8 ký tự!', 'error');
        return;
      }
      if (password.value !== confirm.value) {
        showToast('Mật khẩu xác nhận không khớp!', 'error');
        return;
      }

      btn.textContent = 'Đang xử lý...';
      btn.disabled = true;
      btn.classList.add('loading');

      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('loading');
        showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
        // Chuyển về trang login sau 1.5s
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      }, 1500);
    });
  }

  // ============================================================
  // FORGOT PASSWORD MODAL (login.html)
  // ============================================================
  (function() {
    const forgotLink = document.getElementById('forgotPasswordLink');
    const modal = document.getElementById('modalForgotPassword');
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('closeForgotModal');
    const cancelBtn = document.getElementById('cancelForgotBtn');
    const form = document.getElementById('forgotPasswordForm');
    const submitBtn = document.getElementById('submitForgotPassword');

    function openModal() {
      if (modal) modal.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      if (modal) modal.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (forgotLink) {
      forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        openModal();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('resetEmail');
        if (!email.value.trim()) {
          showToast('Vui lòng nhập email!', 'error');
          return;
        }

        submitBtn.textContent = 'Đang gửi...';
        submitBtn.disabled = true;

        setTimeout(() => {
          submitBtn.textContent = 'Gửi yêu cầu';
          submitBtn.disabled = false;
          closeModal();
          showToast('✅ Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!', 'success');
          console.log('Link reset: http://localhost:5500/user/html/reset-password.html');
        }, 1500);
      });
    }
  })();

})();