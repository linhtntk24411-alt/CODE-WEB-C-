(function() {
  'use strict';

  let ordersData = [];
  let currentFilter = 'all';
  let currentPage = 1;
  const itemsPerPage = 5;

  // ===== TOAST =====
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

  // ===== MODAL LOGOUT =====
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

  // ===== LOAD ORDERS =====
  async function loadOrders() {
    try {
      // SỬA ĐƯỜNG DẪN THÀNH TƯƠNG ĐỐI TỪ THƯ MỤC HTML
      const response = await fetch('../data/orders.json');
      console.log('Fetch response:', response);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Dữ liệu orders:', data);
      ordersData = data.orders || [];
      currentPage = 1;
      renderOrders(currentFilter);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
      document.getElementById('ordersList').innerHTML =
        '<p style="text-align:center;padding:40px;color:var(--orders-on-surface-variant);">Không thể tải dữ liệu. Vui lòng thử lại sau.<br><small>' + error.message + '</small></p>';
      document.getElementById('ordersPagination').innerHTML = '';
    }
  }

  // ===== RENDER ORDERS =====
  function renderOrders(filter = 'all') {
    const list = document.getElementById('ordersList');
    const paginationContainer = document.getElementById('ordersPagination');

    if (!list) {
      console.error('Không tìm thấy #ordersList');
      return;
    }
    if (!paginationContainer) {
      console.error('Không tìm thấy #ordersPagination');
      return;
    }

    // Lọc dữ liệu
    let filtered = ordersData;
    if (filter !== 'all') {
      const statusMap = {
        'pending': ['pending'],
        'processing': ['processing'],
        'shipping': ['shipping'],
        'delivered': ['completed', 'delivered'],
        'returned': ['returned'],
        'cancelled': ['cancelled']
      };
      const allowed = statusMap[filter] || [];
      filtered = ordersData.filter(o => allowed.includes(o.statusType));
    }

    // Tính phân trang
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, totalItems);
    const pageItems = filtered.slice(start, end);

    if (totalItems === 0) {
      list.innerHTML = `<p style="text-align:center;padding:40px;color:var(--orders-on-surface-variant);">Không có đơn hàng nào.</p>`;
      paginationContainer.innerHTML = '';
      return;
    }

    // Render danh sách
    let html = '';
    pageItems.forEach(order => {
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

    // Sự kiện chi tiết
    list.querySelectorAll('.order-btn--detail').forEach(btn => {
      btn.addEventListener('click', function() {
        const orderId = this.dataset.order;
        window.location.href = `order-detail.html?id=${orderId}`;
      });
    });

    // Sự kiện đánh giá
    list.querySelectorAll('.order-btn--review').forEach(btn => {
      btn.addEventListener('click', function() {
        const orderId = this.dataset.order;
        window.location.href = `review.html?order=${orderId}`;
      });
    });

    // Render phân trang
    renderPagination(totalPages, currentPage);
  }

  // ===== RENDER PAGINATION =====
  function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('ordersPagination');
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button class="pagination-btn" onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>&lt;&lt;</button>`;
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>`;

    const range = 2;
    let start = Math.max(1, currentPage - range);
    let end = Math.min(totalPages, currentPage + range);
    if (start > 1) {
      html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
      if (start > 2) html += `<span class="pagination-dots">...</span>`;
    }
    for (let i = start; i <= end; i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span class="pagination-dots">...</span>`;
      html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;
    html += `<button class="pagination-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>&gt;&gt;</button>`;

    container.innerHTML = html;
  }

  // ===== GO TO PAGE =====
  window.goToPage = function(page) {
    const filtered = getFilteredOrders();
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderOrders(currentFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== GET FILTERED ORDERS =====
  function getFilteredOrders() {
    if (currentFilter === 'all') return ordersData;
    const statusMap = {
      'pending': ['pending'],
      'processing': ['processing'],
      'shipping': ['shipping'],
      'delivered': ['completed', 'delivered'],
      'returned': ['returned'],
      'cancelled': ['cancelled']
    };
    const allowed = statusMap[currentFilter] || [];
    return ordersData.filter(o => allowed.includes(o.statusType));
  }

  // ===== FILTER =====
  document.querySelectorAll('.orders-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.orders-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      currentPage = 1;
      renderOrders(currentFilter);
    });
  });

  // ===== SIDEBAR NAVIGATION =====
  document.querySelectorAll('.orders-nav-item:not(.orders-nav-item--logout)').forEach(item => {
    item.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href !== '#' && href !== 'orders.html') {
        window.location.href = href;
        return;
      }
      e.preventDefault();
      document.querySelectorAll('.orders-nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', loadOrders);
})();