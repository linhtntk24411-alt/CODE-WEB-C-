(function() {
  'use strict';

  // ===== DOM refs =====
  const elements = {
    avatar: document.getElementById('profileAvatar'),
    userName: document.getElementById('profileUserName'),
    joinDate: document.getElementById('profileJoinDate'),
    orderCount: document.getElementById('orderCount'),
    mapCount: document.getElementById('mapCount'),
    fullName: document.getElementById('fullName'),
    phoneNumber: document.getElementById('phoneNumber'),
    emailAddress: document.getElementById('emailAddress'),
    birthDate: document.getElementById('birthDate'),
    shippingAddress: document.getElementById('shippingAddress'),
    editToggle: document.getElementById('editToggle'),
    saveBtn: document.querySelector('.profile-save-btn'),
    logoutTrigger: document.getElementById('logoutTrigger'),
    changePasswordTrigger: document.getElementById('changePasswordTrigger'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    avatarUploadTrigger: document.getElementById('avatarUploadTrigger'),
    avatarFileInput: document.getElementById('avatarFileInput'),
    avatarUploadBtn: document.getElementById('avatarUploadBtn'),
    avatarDeleteBtn: document.getElementById('avatarDeleteBtn'),
    saveAvatarBtn: document.getElementById('saveAvatarBtn'),
    cancelDeleteAvatar: document.getElementById('cancelDeleteAvatar'),
    confirmDeleteAvatar: document.getElementById('confirmDeleteAvatar'),
    confirmLogout: document.getElementById('confirmLogout'),
    submitChangePassword: document.getElementById('submitChangePassword'),
    submitForgotPassword: document.getElementById('submitForgotPassword'),
    notificationOkBtn: document.getElementById('notificationOkBtn'),
    avatarPreview: document.getElementById('avatarPreview'),
    cropImage: document.getElementById('cropImage'),
    cropSaveBtn: document.getElementById('cropSaveBtn'),
    activitySection: document.getElementById('activitySection'),
  };

  // ===== USER DATA =====
  let userData = null;
  let latestOrder = null;
  let latestCustomOrder = null; // [MỚI] lưu yêu cầu thiết kế gần nhất

  // ===== TOAST SYSTEM =====
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
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    modals.forEach(m => m.classList.remove('active'));
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', closeAllModals);
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const modalId = this.getAttribute('data-close');
      if (modalId === 'modalCrop' && cropper) {
        cropper.destroy();
        cropper = null;
      }
      closeModal(modalId);
    });
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAllModals();
  });

  // ===== NOTIFICATION POPUP =====
  function showPopupNotification(message, type = 'error', title = 'Lỗi') {
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const msgEl = document.getElementById('notificationMessage');
    icon.className = 'modal-icon modal-icon--' + type;
    titleEl.textContent = title;
    msgEl.textContent = message;
    openModal('modalNotification');
  }

  document.getElementById('notificationOkBtn').addEventListener('click', function() {
    closeModal('modalNotification');
  });

  // ===== LOAD DATA =====
  async function loadUserData() {
  try {
    const userResponse = await fetch('../data/users.json');
    if (!userResponse.ok) throw new Error('Không thể tải dữ liệu người dùng');
    const data = await userResponse.json();
    
    // Lấy email từ localStorage (người dùng hiện tại)
    const currentEmail = localStorage.getItem('userEmail');
    let user = null;
    
    if (data.users && Array.isArray(data.users)) {
      if (currentEmail) {
        user = data.users.find(u => u.email.toLowerCase() === currentEmail.toLowerCase());
      }
      // Nếu không tìm thấy hoặc chưa đăng nhập, lấy user đầu tiên (mặc định)
      if (!user) {
        user = data.users[0];
      }
    } else if (data.user) {
      // Fallback cho cấu trúc cũ
      user = data.user;
    }
    
    if (!user) throw new Error('Không tìm thấy thông tin người dùng');
    
    userData = user;

    // Lấy đơn hàng gần nhất
    const ordersResponse = await fetch('../data/orders.json');
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      const sortedOrders = ordersData.orders.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('/'));
        const dateB = new Date(b.date.split('/').reverse().join('/'));
        return dateB - dateA;
      });
      latestOrder = sortedOrders.length > 0 ? sortedOrders[0] : null;
    } else {
      console.warn('Không thể tải đơn hàng');
    }

    // Lấy yêu cầu thiết kế gần nhất
    try {
      const customResponse = await fetch('../data/custom-order-list.json');
      if (customResponse.ok) {
        const customData = await customResponse.json();
        if (Array.isArray(customData) && customData.length > 0) {
          const sortedCustom = [...customData].sort((a, b) => {
            const dateA = new Date(a.date.split('/').reverse().join('/'));
            const dateB = new Date(b.date.split('/').reverse().join('/'));
            return dateB - dateA;
          });
          latestCustomOrder = sortedCustom[0];
        }
      } else {
        console.warn('Không thể tải yêu cầu thiết kế');
      }
    } catch (e) {
      console.warn('Lỗi khi tải custom orders:', e);
    }

    renderProfile(userData);
    renderActivities();

  } catch (error) {
    console.error('Lỗi tải dữ liệu:', error);
    showPopupNotification('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error', 'Lỗi');
  }
}

  // ===== RENDER PROFILE =====
  function renderProfile(data) {
    if (!data) return;
    elements.userName.textContent = data.name;
    elements.joinDate.textContent = 'Gia nhập: ' + data.joinDate;
    elements.orderCount.textContent = data.orders;
    elements.mapCount.textContent = data.maps;
    elements.fullName.value = data.name;
    elements.phoneNumber.value = data.phone;
    elements.emailAddress.value = data.email;
    elements.birthDate.value = data.birth;
    elements.shippingAddress.value = data.address;

    if (data.avatar && data.avatar.trim() !== '') {
      const avatarPath = '../assets/' + data.avatar;
      elements.avatar.src = avatarPath;
      elements.avatar.onerror = function() {
        this.onerror = null;
        this.src = '../assets/avatar-non.jpg';
      };
    } else {
      elements.avatar.src = '../assets/avatar-non.jpg';
    }
  }

  // ===== RENDER ACTIVITIES (đã sửa để hiển thị cả 2 card) =====
  function renderActivities() {
    let cardsHtml = [];

    // ---------- Card: Đơn hàng gần đây ----------
    if (latestOrder) {
      const order = latestOrder;
      const statusMap = {
        'pending': 'Đang xử lý',
        'shipping': 'Đang giao hàng',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
      };
      const statusDisplay = statusMap[order.statusType] || order.status;
      const showReview = order.statusType === 'completed' && order.showReview === true;

      let orderCardHtml = `
        <div class="profile-activity-card profile-activity-card--order">
          <div class="profile-activity-header">
            <h3 class="profile-activity-title">Đơn hàng gần đây</h3>
            <span class="profile-activity-status profile-activity-status--${order.statusType}">${statusDisplay}</span>
          </div>
          <div class="profile-activity-body">
            <p class="profile-activity-id">#${order.id}</p>
            <p class="profile-activity-desc">${order.total}</p>
            <p class="profile-activity-date">Ngày đặt: ${order.date}</p>
          </div>
          <div style="display:flex; gap:12px; margin-top:8px; flex-wrap:wrap;">
            <button class="profile-activity-btn order-detail-btn" data-order-id="${order.id}">Xem chi tiết</button>
            ${showReview ? `<button class="profile-activity-btn profile-activity-btn--review" data-order-id="${order.id}">Đánh giá</button>` : ''}
          </div>
        </div>
      `;
      cardsHtml.push(orderCardHtml);
    }

    // ---------- [MỚI] Card: Yêu cầu thiết kế gần đây ----------
    if (latestCustomOrder) {
      const custom = latestCustomOrder;
      // Chuyển statusClass thành tên hiển thị (nếu có)
      const statusText = custom.statusText || custom.statusClass || 'Đang xử lý';
      // Tạo class cho status (dùng statusClass để style)
      const statusClass = custom.statusClass || 'status-pending';

      let customCardHtml = `
        <div class="profile-activity-card profile-activity-card--request">
          <div class="profile-activity-header">
            <h3 class="profile-activity-title">Yêu cầu gần đây</h3>
            <span class="profile-activity-status ${statusClass}">${statusText}</span>
          </div>
          <div class="profile-activity-body">
            <p class="profile-activity-id">${custom.id}</p>
            <p class="profile-activity-desc">${custom.name} (${custom.size || 'N/A'})</p>
            <p class="profile-activity-date">Ngày gửi: ${custom.date}</p>
            ${custom.price ? `<p class="profile-activity-price">${custom.price}</p>` : ''}
          </div>
          <div style="display:flex; gap:12px; margin-top:8px; flex-wrap:wrap;">
            <button class="profile-activity-btn custom-detail-btn" data-custom-id="${custom.id}">Xem chi tiết</button>
          </div>
        </div>
      `;
      cardsHtml.push(customCardHtml);
    }

    // Nếu không có hoạt động nào
    if (cardsHtml.length === 0) {
      elements.activitySection.innerHTML = '<p class="profile-empty">Không có hoạt động gần đây.</p>';
      return;
    }

    // Gán HTML
    elements.activitySection.innerHTML = cardsHtml.join('');

    // ----- Gán sự kiện cho các nút (order) -----
    document.querySelectorAll('.order-detail-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const orderId = this.dataset.orderId;
        if (orderId) window.location.href = `order-detail.html?id=${orderId}`;
      });
    });

    document.querySelectorAll('.profile-activity-btn--review').forEach(btn => {
      btn.addEventListener('click', function() {
        const orderId = this.dataset.orderId;
        if (orderId) window.location.href = `review.html?order=${orderId}`;
      });
    });

    // ----- [MỚI] Gán sự kiện cho nút "Xem chi tiết" của custom order -----
    document.querySelectorAll('.custom-detail-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Chuyển đến trang danh sách yêu cầu thiết kế (có thể thêm query param để lọc)
        window.location.href = 'custom-order-list.html';
        // Hoặc nếu có trang chi tiết: `custom-order-detail.html?id=${this.dataset.customId}`
      });
    });
  }

  // ===== INIT =====
  loadUserData();

  // ===== EDIT TOGGLE =====
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

  elements.editToggle.addEventListener('click', function() {
    isEditing = !isEditing;
    setInputsEditable(isEditing);
    if (isEditing) {
      this.innerHTML = `<span class="material-symbols-outlined">close</span> Hủy`;
      if (inputs.length > 0) inputs[0].focus();
    } else {
      this.innerHTML = `<span class="material-symbols-outlined">edit</span> Chỉnh sửa`;
    }
  });

  elements.saveBtn.addEventListener('click', function() {
    if (!isEditing) {
      showPopupNotification('Vui lòng bấm "Chỉnh sửa" trước khi thay đổi thông tin.', 'warning', 'Thông báo');
      return;
    }
    const originalText = this.textContent;
    this.textContent = 'Đang lưu...';
    this.disabled = true;

    setTimeout(() => {
      this.textContent = originalText;
      this.disabled = false;
      isEditing = false;
      setInputsEditable(false);
      elements.editToggle.innerHTML = `<span class="material-symbols-outlined">edit</span> Chỉnh sửa`;
      userData.name = elements.fullName.value;
      userData.phone = elements.phoneNumber.value;
      userData.email = elements.emailAddress.value;
      userData.birth = elements.birthDate.value;
      userData.address = elements.shippingAddress.value;
      elements.userName.textContent = userData.name;
      showToast('Thông tin đã được lưu thành công!', 'success');
    }, 1500);
  });

  // ===== LOGOUT =====
  elements.logoutTrigger.addEventListener('click', function(e) {
    e.preventDefault();
    openModal('modalLogout');
  });

  elements.confirmLogout.addEventListener('click', function() {
    this.textContent = 'Đang xử lý...';
    this.disabled = true;
    setTimeout(() => {
      closeAllModals();
      showToast('Đăng xuất thành công!', 'success');
      this.textContent = 'Đăng xuất';
      this.disabled = false;
    }, 1000);
  });

  // ===== CHANGE PASSWORD =====
  elements.changePasswordTrigger.addEventListener('click', function() {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    resetPasswordRequirements();
    document.getElementById('passwordMatchFeedback').innerHTML = '';
    openModal('modalChangePassword');
  });

  elements.forgotPasswordLink.addEventListener('click', function() {
    closeModal('modalChangePassword');
    openModal('modalForgotPassword');
  });

  document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const newPw = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current) {
      showPopupNotification('Vui lòng nhập mật khẩu hiện tại.', 'warning', 'Thông báo');
      return;
    }
    if (newPw.length < 8) {
      showPopupNotification('Mật khẩu phải có ít nhất 8 ký tự.', 'warning', 'Thông báo');
      return;
    }
    if (newPw !== confirm) {
      showPopupNotification('Mật khẩu xác nhận không khớp.', 'error', 'Lỗi');
      return;
    }

    const btn = elements.submitChangePassword;
    const originalText = btn.textContent;
    btn.textContent = 'Đang xử lý...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      closeModal('modalChangePassword');
      showToast('Mật khẩu đã được cập nhật thành công!', 'success');
    }, 1500);
  });

  // ===== PASSWORD REQUIREMENTS =====
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
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

  function resetPasswordRequirements() {
    document.querySelectorAll('.req-item').forEach(item => {
      item.classList.remove('met');
    });
    matchFeedback.innerHTML = '';
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
  document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    if (!email) {
      showPopupNotification('Vui lòng nhập email.', 'warning', 'Thông báo');
      return;
    }
    const btn = elements.submitForgotPassword;
    const originalText = btn.textContent;
    btn.textContent = 'Đang gửi...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      closeModal('modalForgotPassword');
      showToast('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!', 'success');
    }, 1500);
  });

  // ============================================================
  // AVATAR MODULE
  // ============================================================
  (function avatarModule() {
    const avatarImg = elements.avatar;
    const avatarPreview = elements.avatarPreview;
    const fileInput = elements.avatarFileInput;
    const uploadBtn = elements.avatarUploadBtn;
    const deleteBtn = elements.avatarDeleteBtn;
    const cancelDeleteBtn = elements.cancelDeleteAvatar;
    const confirmDeleteBtn = elements.confirmDeleteAvatar;
    const saveBtn = elements.saveAvatarBtn;
    const cropImage = elements.cropImage;
    const cropSaveBtn = elements.cropSaveBtn;
    const uploadTrigger = elements.avatarUploadTrigger;

    let tempAvatarSrc = null;
    let cropper = null;

    uploadTrigger.addEventListener('click', function() {
      const currentAvatar = avatarImg.src;
      avatarPreview.src = currentAvatar;
      tempAvatarSrc = currentAvatar;
      openModal('modalAvatar');
    });

    uploadBtn.addEventListener('click', function() {
      fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
          cropImage.src = event.target.result;
          openModal('modalCrop');
          cropImage.onload = function() {
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropImage, {
              aspectRatio: 1,
              viewMode: 1,
              autoCropArea: 0.8,
              minCropBoxWidth: 100,
              minCropBoxHeight: 100,
            });
          };
          if (cropImage.complete) {
            cropImage.onload();
          }
        };
        reader.readAsDataURL(this.files[0]);
        this.value = '';
      }
    });

    cropSaveBtn.addEventListener('click', function() {
      if (cropper) {
        const canvas = cropper.getCroppedCanvas({
          width: 300,
          height: 300,
          imageSmoothingQuality: 'high'
        });
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        avatarPreview.src = croppedImage;
        tempAvatarSrc = croppedImage;
        closeModal('modalCrop');
        openModal('modalAvatar');
        if (cropper) {
          cropper.destroy();
          cropper = null;
        }
      }
    });

    document.querySelector('[data-close="modalCrop"]').addEventListener('click', function() {
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
      closeModal('modalCrop');
      openModal('modalAvatar');
    });

    deleteBtn.addEventListener('click', function() {
      closeModal('modalAvatar');
      openModal('modalDeleteAvatar');
    });

    cancelDeleteBtn.addEventListener('click', function() {
      closeModal('modalDeleteAvatar');
      openModal('modalAvatar');
    });

    confirmDeleteBtn.addEventListener('click', function() {
      avatarPreview.src = '../assets/avatar-non.jpg';
      tempAvatarSrc = '../assets/avatar-non.jpg';
      closeModal('modalDeleteAvatar');
      openModal('modalAvatar');
    });

    saveBtn.addEventListener('click', function() {
      avatarImg.src = tempAvatarSrc;
      userData.avatar = tempAvatarSrc;
      closeModal('modalAvatar');
      showToast('Ảnh đại diện đã được cập nhật!', 'success');
    });

  })();

  // ===== SIDEBAR ACTIVE & NAVIGATION =====
  document.querySelectorAll('.profile-nav-item:not(.profile-nav-item--logout)').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const text = this.querySelector('span:last-child')?.textContent.trim();
      if (text === 'Đơn hàng của tôi') {
        window.location.href = 'orders.html';
        return;
      }
      if (text === 'Yêu cầu thiết kế') {
        window.location.href = 'custom-order-list.html';
        return;
      }
      if (text === 'Kho map đã lưu') {
        window.location.href = 'saved-maps.html';
        return;
      }
      document.querySelectorAll('.profile-nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });

})();