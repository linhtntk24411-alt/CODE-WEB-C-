(function() {
  'use strict';

  let ordersData = [];
  let currentFilter = 'all';

  // ===== MODAL SYSTEM =====
  function openLogoutModal() {
    const modal = document.getElementById('modalLogout');
    const overlay = document.getElementById('modalOverlay');
    if (modal && overlay) {
      overlay.classList.add('active');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLogoutModal() {
    const modal = document.getElementById('modalLogout');
    const overlay = document.getElementById('modalOverlay');
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
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

  // ===== TẢI DỮ LIỆU =====
  async function loadOrders() {
    try {
      const response = await fetch('../data/orders.json');
      if (!response.ok) throw new Error('Không thể tải dữ liệu đơn hàng');
      const data = await response.json();
      ordersData = data.orders;
      renderOrders(currentFilter);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
      document.getElementById('ordersList').innerHTML =
        '<p style="text-align:center;padding:40px;color:var(--orders-on-surface-variant);">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>';
    }
  }

  // ===== RENDER DANH SÁCH ĐƠN HÀNG =====
  function renderOrders(filter = 'all') {
    const list = document.getElementById('ordersList');
    let filtered = ordersData;

    if (filter !== 'all') {
      const statusMap = {
        'pending': ['pending'],
        'delivered': ['completed', 'shipping']
      };
      const allowed = statusMap[filter] || [];
      filtered = ordersData.filter(o => allowed.includes(o.statusType));
    }

    if (filtered.length === 0) {
      list.innerHTML = `<p style="text-align:center;padding:40px;color:var(--orders-on-surface-variant);">Không có đơn hàng nào.</p>`;
      return;
    }

    let html = '';
    filtered.forEach(order => {
      const isCancelled = order.statusType === 'cancelled';
      const totalClass = isCancelled ? 'order-total-price--cancelled' : '';
      const showReview = order.statusType === 'completed' && order.showReview === true;

      html += `
        <div class="order-card" data-id="${order.id}">
          <div class="order-card-header">
            <div class="order-card-left">
              <div class="order-icon">
                <span class="material-symbols-outlined">${order.icon}</span>
              </div>
              <div>
                <div class="order-id">#${order.id}</div>
                <div class="order-date">Ngày đặt: ${order.date}</div>
              </div>
            </div>
            <span class="order-status order-status--${order.statusType}">${order.status}</span>
          </div>
          <div class="order-card-footer">
            <div class="order-total">
              <span class="order-total-label">Tổng thanh toán</span>
              <span class="order-total-price ${totalClass}">${order.total}</span>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              ${showReview ? `<button class="order-btn order-btn--review" data-order="${order.id}">Đánh giá</button>` : ''}
              <button class="order-btn order-btn--detail" data-order="${order.id}">Xem chi tiết</button>
            </div>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;

    // Gắn sự kiện cho nút "Xem chi tiết"
    list.querySelectorAll('.order-btn--detail').forEach(btn => {
      btn.addEventListener('click', function() {
        const orderId = this.dataset.order;
        window.location.href = `order-detail.html?id=${orderId}`;
      });
    });

    // Gắn sự kiện cho nút "Đánh giá"
    list.querySelectorAll('.order-btn--review').forEach(btn => {
      btn.addEventListener('click', function() {
        const orderId = this.dataset.order;
        window.location.href = `review.html?order=${orderId}`;
      });
    });
  }

  // ===== LOGOUT =====
  document.getElementById('logoutTrigger')?.addEventListener('click', function(e) {
    e.preventDefault();
    openLogoutModal();
  });

  document.getElementById('confirmLogout')?.addEventListener('click', function() {
    const btn = this;
    btn.textContent = 'Đang xử lý...';
    btn.disabled = true;
    setTimeout(() => {
      closeLogoutModal();
      showToast('Đăng xuất thành công!', 'success', '👋');
      btn.textContent = 'Đăng xuất';
      btn.disabled = false;
    }, 1000);
  });

  document.querySelector('[data-close="modalLogout"]')?.addEventListener('click', closeLogoutModal);
  document.getElementById('modalOverlay')?.addEventListener('click', closeLogoutModal);

  // ===== XỬ LÝ BỘ LỌC =====
  document.querySelectorAll('.orders-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.orders-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderOrders(currentFilter);
    });
  });

  // ===== KHỞI TẠO =====
  document.addEventListener('DOMContentLoaded', loadOrders);
})();