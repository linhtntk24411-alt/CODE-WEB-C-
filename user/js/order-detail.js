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
        
        const searchId = orderId.startsWith('#') ? orderId : `#${orderId}`;

        // SỬA ĐOẠN NÀY: Dùng biến searchId thay vì orderId cũ để so khớp chính xác với JSON
        const customItem = data.find(item => item.id.trim().toUpperCase() === searchId); //[cite: 9]
        if (!customItem) { //[cite: 9]
          document.querySelector('.order-detail-container').innerHTML = '<p style="text-align:center;padding:60px 0;">Không tìm thấy đơn hàng thiết kế.</p>'; //[cite: 9]
          return; //[cite: 9]
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
              price: customItem.price ? Number(String(customItem.price).replace(/[.,đđ]/g, '')) : 297000,
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
      let order = data.orders.find(o => o.id === orderId);
      console.log('Tìm thấy order:', order);
      
      if (!order) {
        // Tìm trong localStorage
        const localOrdersSaved = localStorage.getItem('orders');
        if (localOrdersSaved) {
            const localOrders = JSON.parse(localOrdersSaved);
            if (Array.isArray(localOrders)) {
                const matchedLocal = localOrders.find(o => o.id === orderId);
                if (matchedLocal) {
                    let statusText = 'Chờ xác nhận';
                    let statusType = 'pending';
                    
                    if (matchedLocal.status === 'completed' || matchedLocal.status === 'delivered') {
                        statusText = 'Đã giao';
                        statusType = 'completed';
                    } else if (matchedLocal.status === 'cancelled') {
                        statusText = 'Đã hủy';
                        statusType = 'cancelled';
                    } else if (matchedLocal.status === 'shipping' || matchedLocal.status === 'delivering') {
                        statusText = 'Đang giao hàng';
                        statusType = 'shipping';
                    }
                    
                    const totalFormatted = typeof matchedLocal.total === 'number' 
                        ? matchedLocal.total.toLocaleString('vi-VN') + 'đ' 
                        : String(matchedLocal.total);
                    
                    order = {
                        id: matchedLocal.id,
                        date: matchedLocal.date,
                        status: statusText,
                        statusType: statusType,
                        total: totalFormatted,
                        items: matchedLocal.items || [],
                        payment: {
                            method: matchedLocal.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : (matchedLocal.paymentMethod === 'momo' ? 'Ví MoMo' : 'Chuyển khoản ngân hàng'),
                            status: matchedLocal.status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'
                        },
                        shipping: {
                            carrier: 'Giao hàng tiết kiệm',
                            method: 'Giao hàng tiêu chuẩn',
                            trackingNumber: 'GHK-' + matchedLocal.id.replace('##', '').replace('URII-', ''),
                            fee: matchedLocal.shippingFee || 0,
                            estimatedDelivery: ''
                        },
                        address: {
                            name: matchedLocal.shippingInfo?.fullName || '',
                            phone: matchedLocal.shippingInfo?.phone || '',
                            address: matchedLocal.shippingInfo?.address || ''
                        },
                        timeline: [
                            { status: 'Đã đặt hàng', time: matchedLocal.date }
                        ],
                        shippingTimeline: [
                            { status: 'Đơn hàng đã tiếp nhận', location: 'Kho Urii', time: matchedLocal.date }
                        ]
                    };
                }
            }
        }
      }

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
    const displayId = order.id.startsWith('#') ? order.id : `#${order.id}`;
    orderIdDisplay.textContent = `Đơn hàng ${displayId}`;
    orderTitle.textContent = `Đơn hàng ${displayId}`;
    orderDate.textContent = `Ngày đặt: ${order.date || 'Không xác định'}`;
    orderStatusBadge.textContent = order.status;
    orderStatusBadge.className = 'order-status order-status--' + (order.statusType || 'pending');

    renderTimeline(order.timeline, order.statusType);
    renderItems(order.items);
    renderPayment(order.payment);
    renderShipping(order.shipping);
    renderAddress(order.address);
    renderShippingTimeline(order.shippingTimeline);
    renderSummary(order);
  }

  // ===== RENDER TIMELINE =====
  function renderTimeline(timeline, statusType) {
  if (!timeline || timeline.length === 0) {
    orderTimeline.innerHTML = '<p>Chưa có thông tin timeline.</p>';
    return;
  }

  // Xác định icon cho từng status
  const getIcon = (status) => {
    if (status.includes('Đã đặt hàng')) return 'bi-cart-check';
    if (status.includes('Chờ xác nhận')) return 'bi-clock';
    if (status.includes('Đã xác nhận')) return 'bi-check2-circle';
    if (status.includes('Chờ lấy hàng') || status.includes('Đang xử lý')) return 'bi-clock-history';
    if (status.includes('Chờ giao hàng') || status.includes('Đang giao hàng')) return 'bi-truck';
    if (status.includes('Đã giao hàng') || status.includes('Đã nhận')) return 'bi-check2-all';
    if (status.includes('Đã hủy')) return 'bi-x-circle';
    if (status.includes('Trả hàng')) return 'bi-arrow-return-left';
    return 'bi-clock';
  };

  // Xác định currentIndex
  let currentIndex = timeline.length - 1; // mặc định bước cuối
  let isCompleted = false;
  if (statusType === 'completed') {
    isCompleted = true;
    // currentIndex vẫn là cuối, nhưng tất cả đều completed
  } else if (statusType === 'cancelled') {
    currentIndex = timeline.length - 1; // bước hủy là current
  } else {
    // Các trường hợp khác: pending, processing, shipping
    // Bước cuối là current
    currentIndex = timeline.length - 1;
  }

  let html = `<div class="timeline-horizontal">`;
  
  timeline.forEach((item, index) => {
    const iconClass = getIcon(item.status);
    let stepClass = '';
    if (isCompleted || index < currentIndex) {
      stepClass = 'completed';
    } else if (index === currentIndex) {
      stepClass = 'current';
    } else {
      stepClass = 'pending'; // chưa tới
    }

    html += `
      <div class="timeline-step ${stepClass}">
        <div class="step-icon">
          <i class="bi ${iconClass}"></i>
          ${stepClass === 'completed' ? `<span class="step-check"><i class="bi bi-check-lg"></i></span>` : ''}
        </div>
        <div class="step-content">
          <div class="step-status">${item.status}</div>
          <div class="step-time">${formatDate(item.time)}</div>
          ${item.description ? `<div class="step-desc">${item.description}</div>` : ''}
        </div>
      </div>
    `;
  });

  // Nếu đã hoàn thành, thêm bước "Đánh giá" (pending)
  if (isCompleted) {
    html += `
      <div class="timeline-step pending">
        <div class="step-icon">
          <i class="bi bi-star"></i>
        </div>
        <div class="step-content">
          <div class="step-status">Đánh giá</div>
          <div class="step-time">Chờ bạn đánh giá</div>
        </div>
      </div>
    `;
  }

  html += `</div>`;
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
    const productLink = `productdetail.html?id=${item.productId}`;  // ← link
    html += `
      <div class="order-item">
        <div class="order-item-image">
          <a href="${productLink}">   <!-- ← link ở ảnh -->
            <img src="${item.image || '../assets/placeholder.jpg'}" alt="${item.name}" loading="lazy" />
          </a>
        </div>
        <div class="order-item-info">
          <div class="order-item-name">
            <a href="${productLink}" style="text-decoration: none; color: inherit; font-weight: 600;">
              ${item.name}
            </a>   <!-- ← link ở tên sản phẩm -->
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
  // ===== RENDER SHIPPING TIMELINE =====
function renderShippingTimeline(timelineData) {   // ← đổi tên tham số
  if (!timelineData || timelineData.length === 0) {
    shippingTimeline.innerHTML = '<p>Chưa có thông tin vận chuyển.</p>';
    return;
  }
  let html = '<div class="shipping-timeline-list">';
  timelineData.forEach((item, index) => {
    const isLast = index === timelineData.length - 1;
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
  shippingTimeline.innerHTML = html;   // ← dùng biến DOM toàn cục
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