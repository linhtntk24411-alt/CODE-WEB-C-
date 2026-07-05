(function() {
  'use strict';

  let supportData = {};
  const contentContainer = document.getElementById('supportContent');
  const navItems = document.querySelectorAll('.profile-nav-item[data-tab]');
  let currentTab = 'support-center';

  // ===== TẢI DỮ LIỆU =====
  async function loadSupportData() {
    try {
      const response = await fetch('../data/support.json');
      if (!response.ok) throw new Error('Không thể tải dữ liệu hỗ trợ');
      const data = await response.json();
      supportData = data.pages;
      // Load tab mặc định
      renderTab(currentTab);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      contentContainer.innerHTML = `
        <div class="support-content">
          <div class="support-content__header">
            <h1 class="support-content__title">Không thể tải dữ liệu</h1>
          </div>
          <div class="support-content__body">
            <p>Vui lòng thử lại sau.</p>
          </div>
        </div>
      `;
    }
  }

  // ===== RENDER TAB =====
  function renderTab(tabKey) {
    const page = supportData[tabKey];
    if (!page) {
      contentContainer.innerHTML = `
        <div class="support-content">
          <div class="support-content__header">
            <h1 class="support-content__title">Không tìm thấy nội dung</h1>
          </div>
        </div>
      `;
      return;
    }

    contentContainer.innerHTML = `
      <div class="support-content">
        <div class="support-content__header">
          <h1 class="support-content__title">${page.title}</h1>
        </div>
        <div class="support-content__body">
          ${page.content}
        </div>
      </div>
    `;

    // Nếu là FAQ, khởi tạo accordion
    if (tabKey === 'faq') {
      initFaqAccordion();
    }
  }

  // ===== FAQ ACCORDION =====
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (question) {
        question.addEventListener('click', function() {
          const isActive = item.classList.contains('active');
          // Đóng tất cả
          faqItems.forEach(i => i.classList.remove('active'));
          // Nếu chưa active thì mở
          if (!isActive) {
            item.classList.add('active');
          }
        });
      }
    });
  }

  // ===== NAVIGATION =====
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const tab = this.dataset.tab;
      if (tab) {
        // Cập nhật active
        navItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        currentTab = tab;
        renderTab(tab);
        // Lưu trạng thái
        localStorage.setItem('supportTab', tab);
      }
    });
  });

  // ===== KHỞI TẠO =====
  document.addEventListener('DOMContentLoaded', function() {
    // Khôi phục tab đã lưu
    const savedTab = localStorage.getItem('supportTab');
    if (savedTab && document.querySelector(`[data-tab="${savedTab}"]`)) {
      currentTab = savedTab;
      navItems.forEach(i => {
        i.classList.toggle('active', i.dataset.tab === savedTab);
      });
    }
    loadSupportData();
  });

})();