// user/js/reset-password.js
(function() {
  'use strict';

  // ===== Toast =====
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

  // ===== Toggle mật khẩu =====
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

  // ===== Kiểm tra yêu cầu mật khẩu =====
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
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

  newPasswordInput.addEventListener('input', function() {
    updateRequirements(this.value);
    if (confirmPasswordInput.value) {
      checkPasswordMatch(this.value, confirmPasswordInput.value);
    }
  });

  confirmPasswordInput.addEventListener('input', function() {
    checkPasswordMatch(newPasswordInput.value, this.value);
  });

  // ===== Xử lý form submit =====
  const form = document.getElementById('resetPasswordForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const newPw = document.getElementById('new-password');
      const confirmPw = document.getElementById('confirm-password');
      const btn = this.querySelector('.auth-btn');
      const originalText = btn.textContent;

      // Kiểm tra yêu cầu
      const checks = checkPasswordRequirements(newPw.value);
      const allMet = Object.values(checks).every(v => v === true);
      if (!allMet) {
        showToast('Mật khẩu chưa đáp ứng đủ yêu cầu!', 'error');
        return;
      }

      if (newPw.value !== confirmPw.value) {
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
        showToast('Mật khẩu đã được cập nhật thành công!', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      }, 1500);
    });
  }
})();