// user/js/profile.js
(function() {
  'use strict';

  // ---- DOM refs ----
  const editBtn = document.getElementById('editToggle');
  const saveBtn = document.querySelector('.profile-save-btn');
  const inputs = document.querySelectorAll('.profile-info-input, .profile-info-textarea');
  let isEditing = false;

  // ---- Helper: cập nhật trạng thái của các input ----
  function setInputsEditable(editable) {
    inputs.forEach(input => {
      input.readOnly = !editable;      // true = chỉ đọc, false = có thể sửa
      if (editable) {
        input.classList.add('editing');
        input.style.backgroundColor = '#ffffff';
      } else {
        input.classList.remove('editing');
        input.style.backgroundColor = '';
      }
    });
  }

  // ---- Bấm "Chỉnh sửa" / "Hủy" ----
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      isEditing = !isEditing;
      setInputsEditable(isEditing);

      // Đổi text và icon của nút
      if (isEditing) {
        editBtn.innerHTML = `<span class="material-symbols-outlined">close</span> Hủy`;
        // Focus vào trường đầu tiên
        if (inputs.length > 0) inputs[0].focus();
      } else {
        editBtn.innerHTML = `<span class="material-symbols-outlined">edit</span> Chỉnh sửa`;
      }
    });
  }

  // ---- Bấm "Lưu thay đổi" ----
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      // Nếu chưa ở chế độ chỉnh sửa, thông báo và không làm gì
      if (!isEditing) {
        alert('Vui lòng bấm "Chỉnh sửa" trước khi thay đổi thông tin.');
        return;
      }

      // Demo lưu dữ liệu
      const originalText = this.textContent;
      this.textContent = 'Đang lưu...';
      this.disabled = true;

      // Giả lập gửi dữ liệu lên server
      setTimeout(() => {
        this.textContent = originalText;
        this.disabled = false;

        // Thông báo thành công
        alert('Đã lưu thông tin thành công! (Demo)');

        // Thoát chế độ chỉnh sửa
        isEditing = false;
        setInputsEditable(false);
        editBtn.innerHTML = `<span class="material-symbols-outlined">edit</span> Chỉnh sửa`;

        // Có thể log dữ liệu mới ra console để kiểm tra
        console.log('Dữ liệu đã lưu:');
        inputs.forEach(input => {
          console.log(input.value);
        });
      }, 1500);
    });
  }

  // ---- Sidebar navigation active ----
  const navItems = document.querySelectorAll('.profile-nav-item:not(.profile-nav-item--logout)');
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      navItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ---- Activity buttons ----
  document.querySelectorAll('.profile-activity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.profile-activity-card');
      const title = card?.querySelector('.profile-activity-title')?.textContent || 'chi tiết';
      alert(`Chuyển đến trang ${title.toLowerCase()} (Demo)`);
    });
  });

  // ---- Upload avatar ----
  const uploadBtn = document.querySelector('.profile-avatar-upload');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', function() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.click();
      input.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          reader.onload = function(event) {
            const img = document.querySelector('.profile-avatar-img');
            if (img) img.src = event.target.result;
          };
          reader.readAsDataURL(this.files[0]);
        }
      });
    });
  }

  // ---- Logout ----
  const logoutBtn = document.querySelector('.profile-nav-item--logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Bạn có chắc muốn đăng xuất?')) {
        alert('Đăng xuất thành công! (Demo)');
        // window.location.href = 'login.html';
      }
    });
  }
})();