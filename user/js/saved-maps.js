(function() {
  'use strict';

  const mapsGrid = document.getElementById('mapsGrid');
  const paginationContainer = document.getElementById('paginationContainer');
  const filterBtn = document.getElementById('filterBtn');
  const modalFilter = document.getElementById('modalFilter');
  const overlay = document.getElementById('modalOverlay');
  const applyFilterBtn = document.getElementById('applyFilterBtn');
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  const filterAuthor = document.getElementById('filterAuthor');
  const filterRating = document.getElementById('filterRating');

  let mapsData = [];
  let filteredData = [];
  const perPage = 6;
  let currentPage = 1;

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

  // ===== MODAL =====
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
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', closeAllModals);
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeModal(this.dataset.close);
    });
  });

  // ===== LOGOUT =====
  document.getElementById('logoutTrigger')?.addEventListener('click', function(e) {
    e.preventDefault();
    openModal('modalLogout');
  });

  document.getElementById('confirmLogout')?.addEventListener('click', function() {
    const btn = this;
    btn.textContent = 'Đang xử lý...';
    btn.disabled = true;
    setTimeout(() => {
      closeAllModals();
      showToast('Đăng xuất thành công!', 'success', '👋');
      btn.textContent = 'Đăng xuất';
      btn.disabled = false;
    }, 1000);
  });

  // ===== FILTER =====
  filterBtn?.addEventListener('click', function() {
    populateFilterOptions();
    openModal('modalFilter');
  });

  function populateFilterOptions() {
    // Chỉ có 2 option: Urii Team và Người dùng
    filterAuthor.innerHTML = `
      <option value="all">Tất cả</option>
      <option value="urii">Urii Team</option>
      <option value="user">Người dùng</option>
    `;
  }

  applyFilterBtn?.addEventListener('click', function() {
    applyFilters();
    closeModal('modalFilter');
  });

  resetFilterBtn?.addEventListener('click', function() {
    document.querySelector('input[name="sortBy"][value="rating"]').checked = true;
    filterAuthor.value = 'all';
    filterRating.value = 'all';
    applyFilters();
    closeModal('modalFilter');
  });

  function applyFilters() {
    const sortBy = document.querySelector('input[name="sortBy"]:checked')?.value || 'rating';
    const authorFilter = filterAuthor.value;
    const rating = parseFloat(filterRating.value);

    let result = [...mapsData];

    // Lọc theo tác giả: urii = Urii Team, user = tất cả khác Urii Team
    if (authorFilter === 'urii') {
      result = result.filter(m => m.author === 'Urii Team');
    } else if (authorFilter === 'user') {
      result = result.filter(m => m.author !== 'Urii Team');
    }

    // Lọc theo rating
    if (!isNaN(rating)) {
      result = result.filter(m => m.rating >= rating);
    }

    // Sắp xếp
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    filteredData = result;
    currentPage = 1;
    renderMaps(currentPage);
  }

  // ===== LOAD DATA =====
  async function loadMaps() {
    try {
      const response = await fetch('../data/saved-maps.json');
      if (!response.ok) throw new Error('Không thể tải dữ liệu');
      const data = await response.json();
      mapsData = data.maps;
      filteredData = [...mapsData];
      renderMaps(currentPage);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      mapsGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--saved-maps-on-surface-variant);">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>`;
    }
  }

  // ===== RENDER MAPS =====
  function renderMaps(page) {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageItems = filteredData.slice(start, end);

    if (pageItems.length === 0) {
      mapsGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--saved-maps-on-surface-variant);">Không có map nào phù hợp.</p>`;
      paginationContainer.innerHTML = '';
      return;
    }

    let html = '';
    pageItems.forEach(map => {
      html += `
        <div class="map-card">
          <div class="map-card__image">
            <img src="${map.image}" alt="${map.title}" loading="lazy" />
            <button class="map-card__favorite" data-id="${map.id}">
              <span class="material-symbols-outlined">favorite</span>
            </button>
          </div>
          <div class="map-card__body">
            <h3 class="map-card__title">${map.title}</h3>
            <div class="map-card__meta">
              <span class="map-card__author">Tác giả: <strong>${map.author}</strong></span>
              <span class="map-card__rating">
                <span class="material-symbols-outlined">star</span>
                ${map.rating}
              </span>
            </div>
            <button class="map-card__btn" data-id="${map.id}">Xem chi tiết</button>
          </div>
        </div>
      `;
    });
    mapsGrid.innerHTML = html;

    // Sự kiện nút yêu thích
    document.querySelectorAll('.map-card__favorite').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = parseInt(this.dataset.id);
        const map = mapsData.find(m => m.id === id);
        if (map) {
          map.liked = !map.liked;
          const icon = this.querySelector('.material-symbols-outlined');
          if (map.liked) {
            icon.style.fontVariationSettings = "'FILL' 1";
            showToast('Đã thêm vào kho map yêu thích', 'success', '❤️');
          } else {
            icon.style.fontVariationSettings = "'FILL' 0";
            showToast('Đã bỏ yêu thích', 'info', '💔');
          }
        }
      });
    });

    // Sự kiện nút "Xem chi tiết"
    document.querySelectorAll('.map-card__btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        showToast('Chuyển đến chi tiết map #' + id, 'info', '📄');
        // window.location.href = `map-detail.html?id=${id}`;
      });
    });

    renderPagination(page);
  }

  // ===== PAGINATION =====
  function renderPagination(page) {
    const totalPages = Math.ceil(filteredData.length / perPage);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let html = '';
    const prevDisabled = page === 1;
    const nextDisabled = page === totalPages;

    html += `<button onclick="goToPage(${page - 1})" ${prevDisabled ? 'disabled' : ''}>
      <span class="material-symbols-outlined">chevron_left</span>
    </button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (i === page) {
        html += `<button class="active" onclick="goToPage(${i})">${i}</button>`;
      } else if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
        html += `<button onclick="goToPage(${i})">${i}</button>`;
      } else if (i === page - 2 || i === page + 2) {
        html += `<span class="dots">...</span>`;
      }
    }

    html += `<button onclick="goToPage(${page + 1})" ${nextDisabled ? 'disabled' : ''}>
      <span class="material-symbols-outlined">chevron_right</span>
    </button>`;

    paginationContainer.innerHTML = html;
  }

  window.goToPage = function(page) {
    const totalPages = Math.ceil(filteredData.length / perPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderMaps(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== SIDEBAR ACTIVE =====
  document.querySelectorAll('.saved-maps-nav-item:not(.saved-maps-nav-item--logout)').forEach(item => {
    item.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        return;
      }
      e.preventDefault();
      document.querySelectorAll('.saved-maps-nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function() {
    loadMaps();
  });

})();