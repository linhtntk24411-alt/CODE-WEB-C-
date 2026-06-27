(function() {
  'use strict';

  // ===== Dữ liệu người dùng =====
  const userData = {
    name: 'Nguyễn Minh Anh',
    joinDate: '15/03/2024',
    avatar: '../assets/avatar_user.jpeg', // nếu không có thì để null hoặc ''
    orders: 12,
    maps: 45,
    phone: '0901 234 567',
    email: 'minhanh.uri@gmail.com',
    birth: '12/08/1998',
    address: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
  };

  // ===== Render dữ liệu =====
  function renderProfile(data) {
    const nameEl = document.getElementById('profileUserName');
    if (nameEl) nameEl.textContent = data.name;
    const joinEl = document.getElementById('profileJoinDate');
    if (joinEl) joinEl.textContent = 'Gia nhập: ' + data.joinDate;
    const orderEl = document.getElementById('orderCount');
    if (orderEl) orderEl.textContent = data.orders;
    const mapEl = document.getElementById('mapCount');
    if (mapEl) mapEl.textContent = data.maps;

    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) fullNameInput.value = data.name;
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) phoneInput.value = data.phone;
    const emailInput = document.getElementById('emailAddress');
    if (emailInput) emailInput.value = data.email;
    const birthInput = document.getElementById('birthDate');
    if (birthInput) birthInput.value = data.birth;
    const addressTextarea = document.getElementById('shippingAddress');
    if (addressTextarea) addressTextarea.value = data.address;

    // Avatar
    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
      if (data.avatar && data.avatar.trim() !== '') {
        avatarImg.src = data.avatar;
        avatarImg.onerror = function() {
          this.onerror = null;
          this.src = '../assets/avatar-non.jpg';
        };
      } else {
        avatarImg.src = '../assets/avatar-non.jpg';
        avatarImg.onerror = null;
      }
    }
  }

  renderProfile(userData);

  // ===== MODAL SYSTEM =====
  const overlay = document.getElementById('modalOverlay');
  const modals = document.querySelectorAll('.modal');

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    const anyOpen = document.querySelector('.modal.active');
    if (!anyOpen) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function closeAllModals() {
    modals.forEach(m => m.classList.remove('active'));
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Sự kiện đóng modal bằng overlay
  overlay.addEventListener('click', closeAllModals);

  // Sự kiện đóng bằng nút close
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const modalId = this.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Đóng bằng phím ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // ===== LOGOUT =====
  document.getElementById('logoutTrigger').addEventListener('click', function(e) {
    e.preventDefault();
    openModal('modalLogout');
  });

  document.getElementById('confirmLogout').addEventListener('click', function() {
    this.textContent = 'Đang xử lý...';
    this.disabled = true;
    setTimeout(() => {
      closeAllModals();
      alert('Đăng xuất thành công! (Demo)');
      // window.location.href = 'login.html';
    }, 1000);
  });

  // ===== CHANGE PASSWORD =====
  const changePasswordTrigger = document.getElementById('changePasswordTrigger');
  const modalChangePassword = document.getElementById('modalChangePassword');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const modalForgotPassword = document.getElementById('modalForgotPassword');

  changePasswordTrigger.addEventListener('click', function() {
    // Reset các trường và trạng thái khi mở
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    resetPasswordRequirements();
    document.getElementById('passwordMatchFeedback').textContent = '';
    openModal('modalChangePassword');
  });

  // Mở modal quên mật khẩu từ link trong popup đổi mật khẩu
  forgotPasswordLink.addEventListener('click', function() {
    closeModal('modalChangePassword');
    openModal('modalForgotPassword');
  });

  // Xử lý form đổi mật khẩu
  const changePasswordForm = document.getElementById('changePasswordForm');
  const submitChangePassword = document.getElementById('submitChangePassword');

  changePasswordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const newPw = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (newPw !== confirm) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (newPw.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }

    const btn = submitChangePassword;
    const originalText = btn.textContent;
    btn.textContent = 'Đang xử lý...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      closeModal('modalChangePassword');
      alert('Mật khẩu đã được cập nhật thành công! (Demo)');
    }, 1500);
  });

  // ===== PASSWORD REQUIREMENTS (thời gian thực) =====
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const matchFeedback = document.getElementById('passwordMatchFeedback');

  function checkPasswordRequirements(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    return checks;
  }

  function updateRequirements(password) {
    const checks = checkPasswordRequirements(password);
    document.querySelectorAll('.req-item').forEach(item => {
      const req = item.dataset.req;
      const icon = item.querySelector('.req-icon');
      if (checks[req]) {
        item.classList.add('met');
        icon.textContent = '✅';
      } else {
        item.classList.remove('met');
        icon.textContent = '✖';
      }
    });
  }

  function resetPasswordRequirements() {
    document.querySelectorAll('.req-item').forEach(item => {
      item.classList.remove('met');
      item.querySelector('.req-icon').textContent = '✖';
    });
    matchFeedback.textContent = '';
  }

  newPasswordInput.addEventListener('input', function() {
    updateRequirements(this.value);
    // Kiểm tra match với confirm nếu có
    if (confirmPasswordInput.value) {
      checkPasswordMatch(this.value, confirmPasswordInput.value);
    }
  });

  confirmPasswordInput.addEventListener('input', function() {
    checkPasswordMatch(newPasswordInput.value, this.value);
  });

  function checkPasswordMatch(pw1, pw2) {
    if (pw1 && pw2) {
      if (pw1 === pw2) {
        matchFeedback.textContent = '✅ Mật khẩu khớp!';
        matchFeedback.className = 'password-match-feedback match';
      } else {
        matchFeedback.textContent = '❌ Mật khẩu không khớp';
        matchFeedback.className = 'password-match-feedback no-match';
      }
    } else {
      matchFeedback.textContent = '';
    }
  }

  // Toggle hiển thị mật khẩu
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

  // ===== FORGOT PASSWORD =====
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const submitForgotPassword = document.getElementById('submitForgotPassword');

  forgotPasswordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    if (!email) {
      alert('Vui lòng nhập email!');
      return;
    }
    const btn = submitForgotPassword;
    const originalText = btn.textContent;
    btn.textContent = 'Đang gửi...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      closeModal('modalForgotPassword');
      alert('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn! (Demo)');
    }, 1500);
  });

  // ===== AVATAR UPLOAD / DELETE =====
  const avatarUploadTrigger = document.getElementById('avatarUploadTrigger');
  const avatarModal = document.getElementById('modalAvatar');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const avatarUploadBtn = document.getElementById('avatarUploadBtn');
  const avatarDeleteBtn = document.getElementById('avatarDeleteBtn');
  const saveAvatarBtn = document.getElementById('saveAvatarBtn');
  const deleteAvatarModal = document.getElementById('modalDeleteAvatar');
  const cancelDeleteBtn = document.getElementById('cancelDeleteAvatar');
  const confirmDeleteBtn = document.getElementById('confirmDeleteAvatar');
  let tempAvatarSrc = null;

  // Mở modal avatar
  avatarUploadTrigger.addEventListener('click', function() {
    const currentAvatar = document.getElementById('profileAvatar');
    avatarPreview.src = currentAvatar.src;
    tempAvatarSrc = currentAvatar.src;
    openModal('modalAvatar');
  });

  // Upload ảnh mới
  avatarUploadBtn.addEventListener('click', function() {
    avatarFileInput.click();
  });

  avatarFileInput.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function(event) {
        avatarPreview.src = event.target.result;
        tempAvatarSrc = event.target.result;
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

  // Nút Xóa ảnh → đóng modal cập nhật, mở modal xác nhận
  avatarDeleteBtn.addEventListener('click', function() {
    closeModal('modalAvatar');
    openModal('modalDeleteAvatar');
  });

  // Hủy xóa → đóng modal xác nhận, mở lại modal cập nhật
  cancelDeleteBtn.addEventListener('click', function() {
    closeModal('modalDeleteAvatar');
    openModal('modalAvatar');
  });

  // Xác nhận xóa → cập nhật ảnh preview thành ảnh mặc định, đóng modal xác nhận, mở lại modal cập nhật
  confirmDeleteBtn.addEventListener('click', function() {
    avatarPreview.src = '../assets/avatar-non.jpg';
    tempAvatarSrc = '../assets/avatar-non.jpg';
    closeModal('modalDeleteAvatar');
    openModal('modalAvatar');
  });

  // Lưu thay đổi avatar
  saveAvatarBtn.addEventListener('click', function() {
    const profileAvatar = document.getElementById('profileAvatar');
    profileAvatar.src = tempAvatarSrc;
    userData.avatar = tempAvatarSrc;
    closeModal('modalAvatar');
    alert('Ảnh đại diện đã được cập nhật! (Demo)');
  });

  // ===== EDIT TOGGLE =====
  const editBtn = document.getElementById('editToggle');
  const saveBtn = document.querySelector('.profile-save-btn');
  const inputs = document.querySelectorAll('.profile-info-input, .profile-info-textarea');
  let isEditing = false;

  function setInputsEditable(editable) {
    inputs.forEach(input => {
      input.readOnly = !editable;
      if (editable) {
        input.classList.add('editing');
        input.style.backgroundColor = '#ffffff';
      } else {
        input.classList.remove('editing');
        input.style.backgroundColor = '';
      }
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', function() {
      isEditing = !isEditing;
      setInputsEditable(isEditing);
      if (isEditing) {
        editBtn.innerHTML = `<span class="material-symbols-outlined">close</span> Hủy`;
        if (inputs.length > 0) inputs[0].focus();
      } else {
        editBtn.innerHTML = `<span class="material-symbols-outlined">edit</span> Chỉnh sửa`;
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      if (!isEditing) {
        alert('Vui lòng bấm "Chỉnh sửa" trước khi thay đổi thông tin.');
        return;
      }
      const originalText = this.textContent;
      this.textContent = 'Đang lưu...';
      this.disabled = true;

      setTimeout(() => {
        this.textContent = originalText;
        this.disabled = false;
        alert('Đã lưu thông tin thành công! (Demo)');
        isEditing = false;
        setInputsEditable(false);
        editBtn.innerHTML = `<span class="material-symbols-outlined">edit</span> Chỉnh sửa`;
        // Cập nhật userData
        const name = document.getElementById('fullName').value;
        userData.name = name;
        document.getElementById('profileUserName').textContent = name;
        console.log('Dữ liệu đã lưu:', Array.from(inputs).map(i => i.value));
      }, 1500);
    });
  }

  // ===== SIDEBAR ACTIVE =====
  document.querySelectorAll('.profile-nav-item:not(.profile-nav-item--logout)').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.profile-nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ===== ACTIVITY BUTTONS =====
  document.querySelectorAll('.profile-activity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.profile-activity-card');
      const title = card?.querySelector('.profile-activity-title')?.textContent || 'chi tiết';
      alert(`Chuyển đến trang ${title.toLowerCase()} (Demo)`);
    });
  });

})();