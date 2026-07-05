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
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('order') || params.get('slug');
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

  // ===== Tải dữ liệu =====
  async function loadOrderDetail() {
    const orderId = getOrderId();
    if (!orderId) {
      document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không tìm thấy mã đơn hàng.</p>';
      return;
    }

    try {
      const [ordersRes, detailsRes] = await Promise.all([
        fetch('../data/orders.json'),
        fetch('../data/order-details.json')
      ]);
      if (!ordersRes.ok || !detailsRes.ok) throw new Error('Không thể tải dữ liệu');

      const ordersData = await ordersRes.json();
      const detailsData = await detailsRes.json();

      const orderMeta = ordersData.orders.find(o => o.id === orderId);
      const orderDetail = detailsData.orders.find(o => o.id === orderId);

      if (!orderMeta || !orderDetail) {
        document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không tìm thấy đơn hàng.</p>';
        return;
      }

      renderOrderDetail(orderMeta, orderDetail);

    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>';
    }
  }

  // ===== Render =====
  function renderOrderDetail(meta, detail) {
    orderIdDisplay.textContent = `Đơn hàng #${detail.id}`;
    orderTitle.textContent = `Đơn hàng #${detail.id}`;
    orderDate.textContent = `Ngày đặt: ${formatDate(detail.createdAt)}`;
    orderStatusBadge.textContent = detail.status;
    orderStatusBadge.className = 'order-status order-status--' + detail.statusType;

    renderTimeline(detail.timeline);
    renderItems(detail.items);
    renderPayment(detail.payment);
    renderShipping(detail.shipping);
    renderShippingTimeline(detail.shippingTimeline);
    renderAddress(detail.address);
    renderSummary(detail);
  }

  function renderTimeline(timeline) {
    if (!timeline || timeline.length === 0) {
      orderTimeline.innerHTML = '<p>Không có thông tin timeline.</p>';
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

  function renderItems(items) {
    if (!items || items.length === 0) {
      orderItems.innerHTML = '<p>Không có sản phẩm.</p>';
      return;
    }

    let html = `<div class="order-items-list">`;
    items.forEach(item => {
      html += `
        <div class="order-item">
          <div class="order-item-image">
            <img src="${item.image || '../assets/placeholder.jpg'}" alt="${item.name}" loading="lazy" />
          </div>
          <div class="order-item-info">
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-meta">Số lượng: ${item.quantity}</div>
          </div>
          <div class="order-item-price">${formatCurrency(item.price)}</div>
        </div>
      `;
    });
    html += `</div>`;
    orderItems.innerHTML = html;
  }

  function renderPayment(payment) {
    if (!payment) {
      orderPayment.innerHTML = '<p>Không có thông tin thanh toán.</p>';
      return;
    }
    orderPayment.innerHTML = `
      <div class="payment-info">
        <p><span class="label">Phương thức:</span> ${payment.method}</p>
        <p><span class="label">Trạng thái:</span> ${payment.status}</p>
      </div>
    `;
  }

  function renderShipping(shipping) {
    if (!shipping) {
      orderShipping.innerHTML = '<p>Không có thông tin vận chuyển.</p>';
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

  // ===== Shipping Timeline với icon Bootstrap =====
  function renderShippingTimeline(timeline) {
    if (!timeline || timeline.length === 0) {
      shippingTimeline.innerHTML = '<p class="no-data">Chưa có thông tin vận chuyển.</p>';
      return;
    }
    let html = '<div class="shipping-timeline-list">';
    timeline.forEach((item, index) => {
      const isLast = index === timeline.length - 1;
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

  function renderAddress(address) {
    if (!address) {
      orderAddress.innerHTML = '<p>Không có địa chỉ nhận hàng.</p>';
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

  function renderSummary(detail) {
    if (!detail) {
      orderSummary.innerHTML = '<p>Không có dữ liệu.</p>';
      return;
    }
    const totalItems = detail.items ? detail.items.reduce((sum, item) => sum + parseInt(item.quantity), 0) : 0;
    orderSummary.innerHTML = `
      <div class="summary-row">
        <span>Tạm tính (${totalItems} sản phẩm)</span>
        <span>${formatCurrency(detail.subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Phí vận chuyển</span>
        <span>${formatCurrency(detail.shippingFee)}</span>
      </div>
      ${detail.discount && parseInt(String(detail.discount).replace(/[.,]/g,'')) > 0 ? `
        <div class="summary-row">
          <span>Giảm giá</span>
          <span>-${formatCurrency(detail.discount)}</span>
        </div>
      ` : ''}
      <div class="summary-row total">
        <span>Tổng cộng</span>
        <span class="amount">${detail.totalDisplay || formatCurrency(detail.total)}</span>
      </div>
    `;
  }

  // ===== Khởi tạo =====
  document.addEventListener('DOMContentLoaded', loadOrderDetail);
})();