(function() {
  'use strict';

  const orderInfo = document.getElementById('reviewOrderInfo');
  const starRating = document.getElementById('starRating');
  const ratingText = document.getElementById('ratingText');
  const reviewContent = document.getElementById('reviewContent');
  const uploadArea = document.getElementById('reviewUploadArea');
  const fileInput = document.getElementById('reviewImages');
  const previewContainer = document.getElementById('reviewImagePreview');
  const form = document.getElementById('reviewForm');

  let selectedRating = 0;
  let uploadedFiles = [];

  function getOrderId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('order') || params.get('id');
  }

  function showToast(message, type = 'success', icon = '✅') {
    const oldContainer = document.querySelector('.toast-container');
    if (oldContainer) oldContainer.remove();

    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast--fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async function loadOrderInfo() {
    const orderId = getOrderId();
    if (!orderId) {
      orderInfo.innerHTML = '<p>Không tìm thấy đơn hàng.</p>';
      return;
    }

    try {
      const response = await fetch('../data/orders.json');
      if (!response.ok) throw new Error('Không thể tải dữ liệu');
      const data = await response.json();
      const order = data.orders.find(o => o.id === orderId);

      if (!order) {
        orderInfo.innerHTML = '<p>Không tìm thấy đơn hàng.</p>';
        return;
      }

      let items = [];
      try {
        const detailRes = await fetch('../data/order-details.json');
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const detail = detailData.orders.find(d => d.id === orderId);
          if (detail && detail.items) items = detail.items;
        }
      } catch (e) {}

      let itemNames = items.map(item => item.name).join(', ');
      if (!itemNames) itemNames = 'Sản phẩm';

      orderInfo.innerHTML = `
        <div class="order-id">Đơn hàng #${order.id}</div>
        <div class="order-items">${itemNames}</div>
        <div style="font-size:14px;color:var(--review-on-surface-variant);margin-top:4px;">Ngày đặt: ${order.date}</div>
      `;
    } catch (error) {
      console.error(error);
      orderInfo.innerHTML = '<p>Không thể tải thông tin đơn hàng.</p>';
    }
  }

  // ===== STAR RATING =====
  starRating.addEventListener('click', function(e) {
    const star = e.target.closest('i');
    if (!star) return;
    const value = parseInt(star.dataset.value);
    if (isNaN(value)) return;
    selectedRating = value;
    updateStars(value);
  });

  starRating.addEventListener('mouseover', function(e) {
    const star = e.target.closest('i');
    if (!star) return;
    const value = parseInt(star.dataset.value);
    if (isNaN(value)) return;
    updateStars(value, true);
  });

  starRating.addEventListener('mouseleave', function() {
    updateStars(selectedRating, false);
  });

  function updateStars(value, hover = false) {
    const stars = starRating.querySelectorAll('i');
    stars.forEach((star, index) => {
      const starValue = index + 1;
      if (starValue <= value) {
        star.className = hover ? 'bi bi-star-fill' : 'bi bi-star-fill active';
      } else {
        star.className = hover ? 'bi bi-star' : 'bi bi-star';
      }
    });
    if (!hover) {
      const texts = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tốt'];
      ratingText.textContent = value > 0 ? texts[value] : 'Chọn số sao';
    }
  }

  // ===== UPLOAD IMAGES =====
  fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadedFiles.push(file);
        const reader = new FileReader();
        reader.onload = function(ev) {
          const item = document.createElement('div');
          item.className = 'preview-item';
          item.innerHTML = `
            <img src="${ev.target.result}" alt="${file.name}" />
            <span class="remove-image" data-filename="${file.name}">×</span>
          `;
          previewContainer.appendChild(item);
        };
        reader.readAsDataURL(file);
      }
    });
    fileInput.value = '';
  });

  // Xóa ảnh (event delegation)
  previewContainer.addEventListener('click', function(e) {
    const removeBtn = e.target.closest('.remove-image');
    if (!removeBtn) return;
    const name = removeBtn.dataset.filename;
    uploadedFiles = uploadedFiles.filter(f => f.name !== name);
    removeBtn.closest('.preview-item').remove();
    if (uploadedFiles.length === 0) previewContainer.innerHTML = '';
  });

  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = '#840001';
    this.style.backgroundColor = 'rgba(132,0,1,0.02)';
  });
  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.style.borderColor = '';
    this.style.backgroundColor = '';
  });
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = '';
    this.style.backgroundColor = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });

  // ===== SUBMIT =====
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    if (selectedRating === 0) {
      showToast('Vui lòng chọn số sao đánh giá.', 'error', '❌');
      return;
    }
    const content = reviewContent.value.trim();
    if (!content) {
      showToast('Vui lòng nhập nội dung đánh giá.', 'error', '❌');
      reviewContent.focus();
      return;
    }

    const btn = this.querySelector('.review-btn--submit');
    const originalText = btn.textContent;
    btn.textContent = 'Đang gửi...';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      showToast('Cảm ơn bạn đã đánh giá!', 'success', '⭐');
      const orderId = getOrderId();
      setTimeout(() => {
        window.location.href = `order-detail.html?id=${orderId}`;
      }, 1500);
    }, 2000);
  });

  document.addEventListener('DOMContentLoaded', loadOrderInfo);
})();