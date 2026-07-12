(function() {
  'use strict';

  // ===== DOM refs =====
  const orderIdDisplay = document.getElementById('orderIdDisplay');
  const orderTitle = document.getElementById('orderTitle');
  const orderDate = document.getElementById('orderDate');
  const orderStatusBadge = document.getElementById('orderStatusBadge');
  const orderTimeline = document.getElementById('orderTimeline');
  const orderItems = document.getElementById('orderItems');
  const orderPayment = document.getElementById('orderPayment');
  const orderShipping = document.getElementById('orderShipping');
  const orderAddress = document.getElementById('orderAddress');
  const orderSummary = document.getElementById('orderSummary');
  const shippingTimeline = document.getElementById('shippingTimeline');

  // ===== Lấy orderId từ URL =====
  function getOrderId() {
    const searchString = window.location.search;
    const match = searchString.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]).trim().toUpperCase();
    }
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('order') || params.get('slug');
    return id ? id.trim().toUpperCase() : null;
  }

  // ===== Format date =====
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ===== Format currency =====
  function formatCurrency(value) {
    if (!value) return '0đ';
    const num = Number(String(value).replace(/[.,]/g, ''));
    if (isNaN(num)) return value + 'đ';
    return num.toLocaleString('vi-VN') + 'đ';
  }

  // ===== Tải dữ liệu từ orders.json (dùng đường dẫn tương đối) =====
  async function loadOrderDetail() {
    const orderId = getOrderId();
    console.log('orderId:', orderId);
    if (!orderId) {
      document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không tìm thấy mã đơn hàng.</p>';
      return;
    }
    // --- ĐOẠN CODE THÊM MỚI TẠI ĐÂY ĐỂ XỬ LÝ ĐƠN HÀNG THIẾT KẾ RIÊNG ---
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'custom') {
      try {
        const response = await fetch('../data/custom-order-list.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const customItem = data.find(item => item.id.trim().toUpperCase() === orderId);
        if (!customItem) {
          document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không tìm thấy đơn hàng thiết kế.</p>';
          return;
        }

        // Tạo cấu trúc dữ liệu giả lập chuẩn khớp 100% với form hiển thị của hệ thống
        const mockOrder = {
          id: customItem.id,
          date: customItem.date + " 09:00",
          status: "Đã giao",
          statusType: "completed",
          shippingFee: 0,
          items: [
            {
              productId: 999,
              name: customItem.name,
              quantity: 1,
              price: 335000, // Giá mặc định hoặc tùy biến cho mẫu thiết kế riêng
              image: customItem.image
            }
          ],
          payment: {
            method: "Thanh toán trực tuyến / Số dư tài khoản",
            status: "Đã thanh toán"
          },
          shipping: {
            carrier: "Giao hàng tiết kiệm",
            method: "Giao hàng tiêu chuẩn",
            trackingNumber: "GHK-" + customItem.id.replace('#', ''),
            fee: 0,
            estimatedDelivery: "2026-07-15T18:00:00"
          },
          address: {
            name: "Nguyễn Minh Anh",
            phone: "0901 234 567",
            address: "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
          },
          timeline: [
            { status: "Đã gửi yêu cầu", time: customItem.date + " 09:00" },
            { status: "Urii đã duyệt & Thiết kế mẫu", time: customItem.date + " 11:00" },
            { status: "Đã hoàn thành tác phẩm", time: customItem.date + " 16:00" }
          ],
          shippingTimeline: [
            { status: "Đơn hàng đã tiếp nhận", location: "Kho Urii", time: customItem.date + " 12:00" },
            { status: "Đã giao hàng thành công", location: "Địa chỉ nhận", time: customItem.date + " 16:00" }
          ]
        };

        // Chạy hàm render chính có sẵn của trang bằng data mới tạo
        renderOrderDetail(mockOrder);
        return; // Ngăn hàm chạy tiếp xuống phần đọc orders.json cũ ở dưới
      } catch (error) {
        console.error('Lỗi tải dữ liệu đơn hàng riêng:', error);
        document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không thể tải dữ liệu đơn hàng thiết kế.</p>';
        return;
      }
    }
    // --- KẾT THÚC ĐOẠN THÊM MỚI ---

    try {
      const response = await fetch('../data/orders.json');
      console.log('Fetch response status:', response.status);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log('Dữ liệu orders:', data);
      const order = data.orders.find(o => o.id === orderId);
      console.log('Tìm thấy order:', order);
      if (!order) {
        document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không tìm thấy đơn hàng.</p>';
        return;
      }

      renderOrderDetail(order);

    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>';
    }
  }

  // ===== Render =====
  function renderOrderDetail(order) {
    orderIdDisplay.textContent = `Đơn hàng #${order.id}`;
    orderTitle.textContent = `Đơn hàng #${order.id}`;
    orderDate.textContent = `Ngày đặt: ${order.date || 'Không xác định'}`;
    orderStatusBadge.textContent = order.status;
    orderStatusBadge.className = 'order-status order-status--' + (order.statusType || 'pending');

    renderTimeline(order.timeline);
    renderItems(order.items);
    renderPayment(order.payment);
    renderShipping(order.shipping);
    renderAddress(order.address);
    renderShippingTimeline(order.shippingTimeline);
    renderSummary(order);
  }

  // ===== RENDER TIMELINE =====
  function renderTimeline(timeline) {
    if (!timeline || timeline.length === 0) {
      orderTimeline.innerHTML = '<p>Chưa có thông tin timeline.</p>';
      return;
    }

    let html = '';
    timeline.forEach((item, index) => {
      const isLast = index === timeline.length - 1;
      const isActive = !isLast;
      html += `
        <div class="timeline-item ${isActive ? 'active' : ''}">
          <div class="timeline-content">
            <div class="timeline-status">${item.status}</div>
            <div class="timeline-time">${formatDate(item.time)}</div>
            ${item.description ? `<div class="timeline-desc">${item.description}</div>` : ''}
          </div>
        </div>
      `;
    });
    orderTimeline.innerHTML = html;
  }

  // ===== RENDER ITEMS =====
  function renderItems(items) {
    if (!items || items.length === 0) {
      orderItems.innerHTML = '<p>Không có sản phẩm.</p>';
      return;
    }

    let html = `<div class="order-items-list">`;
    items.forEach(item => {
      const productLink = `productdetail.html?id=${item.productId}`;
      html += `
        <div class="order-item">
          <div class="order-item-image">
            <a href="${productLink}">
              <img src="${item.image || '../assets/placeholder.jpg'}" alt="${item.name}" loading="lazy" />
            </a>
          </div>
          <div class="order-item-info">
            <div class="order-item-name">
              <a href="${productLink}" style="text-decoration: none; color: inherit; font-weight: 600;">
                ${item.name}
              </a>
            </div>
            <div class="order-item-meta">Số lượng: ${item.quantity}</div>
          </div>
          <div class="order-item-price">${formatCurrency(item.price)}</div>
        </div>
      `;
    });
    html += `</div>`;
    orderItems.innerHTML = html;
  }

  // ===== RENDER PAYMENT =====
  function renderPayment(payment) {
    if (!payment) {
      orderPayment.innerHTML = '<p>Chưa có thông tin thanh toán.</p>';
      return;
    }
    orderPayment.innerHTML = `
      <div class="payment-info">
        <p><span class="label">Phương thức:</span> ${payment.method}</p>
        <p><span class="label">Trạng thái:</span> ${payment.status}</p>
      </div>
    `;
  }

  // ===== RENDER SHIPPING =====
  function renderShipping(shipping) {
    if (!shipping) {
      orderShipping.innerHTML = '<p>Chưa có thông tin vận chuyển.</p>';
      return;
    }
    orderShipping.innerHTML = `
      <div class="shipping-info">
        <p><span class="label">Đơn vị vận chuyển:</span> ${shipping.carrier || 'Không có'}</p>
        <p><span class="label">Phương thức:</span> ${shipping.method || 'Không có'}</p>
        <p><span class="label">Mã vận đơn:</span> ${shipping.trackingNumber || 'Chưa cập nhật'}</p>
        <p><span class="label">Phí vận chuyển:</span> ${formatCurrency(shipping.fee)}</p>
        ${shipping.estimatedDelivery ? `<p><span class="label">Dự kiến giao:</span> ${formatDate(shipping.estimatedDelivery)}</p>` : ''}
      </div>
    `;
  }

  // ===== RENDER SHIPPING TIMELINE =====
  function renderShippingTimeline(shippingTimeline) {
    if (!shippingTimeline || shippingTimeline.length === 0) {
      shippingTimeline.innerHTML = '<p>Chưa có thông tin vận chuyển.</p>';
      return;
    }
    let html = '<div class="shipping-timeline-list">';
    shippingTimeline.forEach((item, index) => {
      const isLast = index === shippingTimeline.length - 1;
      const isActive = !isLast;
      html += `
        <div class="shipping-timeline-item ${isActive ? 'active' : ''}">
          <div class="shipping-timeline-content">
            <div class="shipping-timeline-status">${item.status}</div>
            ${item.location ? `<div class="shipping-timeline-location"><i class="bi bi-geo-alt"></i> ${item.location}</div>` : ''}
            <div class="shipping-timeline-time"><i class="bi bi-clock"></i> ${formatDate(item.time)}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    shippingTimeline.innerHTML = html;
  }

  // ===== RENDER ADDRESS =====
  function renderAddress(address) {
    if (!address) {
      orderAddress.innerHTML = '<p>Chưa có địa chỉ nhận hàng.</p>';
      return;
    }
    orderAddress.innerHTML = `
      <div class="address-info">
        <p><span class="label">Người nhận:</span> ${address.name}</p>
        <p><span class="label">Điện thoại:</span> ${address.phone}</p>
        <p><span class="label">Địa chỉ:</span> ${address.address}</p>
      </div>
    `;
  }

  // ===== RENDER SUMMARY =====
  function renderSummary(order) {
    if (!order) {
      orderSummary.innerHTML = '<p>Không có dữ liệu.</p>';
      return;
    }
    const totalItems = order.items ? order.items.reduce((sum, item) => sum + parseInt(item.quantity), 0) : 0;
    const totalDisplay = order.total || formatCurrency(order.items ? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0);
    orderSummary.innerHTML = `
      <div class="summary-row">
        <span>Tạm tính (${totalItems} sản phẩm)</span>
        <span>${totalDisplay}</span>
      </div>
      <div class="summary-row">
        <span>Phí vận chuyển</span>
        <span>${formatCurrency(order.shippingFee || 0)}</span>
      </div>
      ${order.discount && parseInt(String(order.discount).replace(/[.,]/g,'')) > 0 ? `
        <div class="summary-row">
          <span>Giảm giá</span>
          <span>-${formatCurrency(order.discount)}</span>
        </div>
      ` : ''}
      <div class="summary-row total">
        <span>Tổng cộng</span>
        <span class="amount">${order.totalDisplay || totalDisplay}</span>
      </div>
    `;
  }

  // ===== Khởi tạo =====
  document.addEventListener('DOMContentLoaded', loadOrderDetail);
})();