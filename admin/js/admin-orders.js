// ================================================================
// JS QUẢN LÝ ĐƠN HÀNG (Đã thêm bảng Custom Order riêng - Bootstrap Icons)
// ================================================================

let orders = [];
let originalOrders = [];
let currentPage = 1;
let currentCancelPage = 1;
let currentCustomPage = 1;
const ITEMS_PER_PAGE = 4;
const CUSTOM_ITEMS_PER_PAGE = 4;

const statusMap = {
    "pending": { text: "Chờ xác nhận", class: "badge-status-pending" },
    "approved": { text: "Đã xác nhận", class: "badge-status-approved" },
    "completed": { text: "Hoàn thành", class: "badge-status-completed" },
    "cancelled": { text: "Đã hủy", class: "badge-status-cancelled" },
    "pending_approval": { text: "Chờ duyệt", class: "badge-status-pending_approval" },
    "waiting_quote": { text: "Chờ báo giá", class: "badge-status-waiting_quote" },
    "processing": { text: "Đang gia công", class: "badge-status-processing" }
};

// ================================================================
// DỮ LIỆU MẪU CUSTOM ORDER
// ================================================================
const sampleCustomOrders = [
    {
        id: "DH098",
        customerName: "Trần Thị Hương",
        customerAvatar: "TH",
        phone: "0987 654 321",
        address: "456 Nguyễn Trãi, Quận 5, TP.HCM",
        date: "07/07/2026",
        product: "Tranh Pixel Art (Custom - 50x70cm)",
        total: 0,
        status: "waiting_quote",
        payment: "Chuyển khoản",
        customerNote: "Tôi muốn đặt tranh pixel art chân dung gia đình 4 người, khổ 50x70cm, màu sắc tươi sáng. Mong shop báo giá sớm!",
        isCustomOrder: true,
        quoteNote: "",
        quotedPrice: 0,
        quoteDate: "",
        customDetails: {
            "Loại": "Chân dung gia đình",
            "Kích thước": "50x70cm",
            "Màu sắc": "Tươi sáng",
            "Số người": 4,
            "Nền": "Màu pastel"
        }
    },
    {
        id: "DH099",
        customerName: "Phạm Quốc Bảo",
        customerAvatar: "PB",
        phone: "0909 123 456",
        address: "789 Lê Lợi, Quận 1, TP.HCM",
        date: "07/07/2026",
        product: "Bộ KIT Mùa Hè (Custom)",
        total: 0,
        status: "waiting_quote",
        payment: "Tiền mặt",
        customerNote: "Mình muốn đặt bộ KIT theo yêu cầu riêng: Mùa hè với họa tiết hoa hướng dương và sóng biển, số lượng 50 bộ. Gửi báo giá kèm mẫu thiết kế giúp mình nhé!",
        isCustomOrder: true,
        quoteNote: "",
        quotedPrice: 0,
        quoteDate: "",
        customDetails: {
            "Loại": "Bộ KIT theo yêu cầu",
            "Số lượng": 50,
            "Chủ đề": "Hoa hướng dương & Sóng biển",
            "Thiết kế": "Cần thiết kế mẫu",
            "Chất liệu": "Hạt nhựa cao cấp"
        }
    }
];

// ================================================================
// ĐỌC & GHI DỮ LIỆU VÀO JSON
// ================================================================
async function loadOrdersFromJson() {
    try {
        const response = await fetch('../data/order.json');
        if (!response.ok) {
            throw new Error(`Lỗi HTTP ${response.status}`);
        }
        const data = await response.json();
        originalOrders = [...data, ...sampleCustomOrders];
        orders = [...originalOrders];
        console.log("Đã load dữ liệu từ order.json + Custom Orders");
        
        renderStats();
        renderOrders();
        renderCancelRequests();
        renderCustomOrders();
    } catch (error) {
        console.error("LỖI: Không thể tải dữ liệu", error);
        originalOrders = [...sampleCustomOrders];
        orders = [...originalOrders];
        renderStats();
        renderOrders();
        renderCancelRequests();
        renderCustomOrders();
        const orderList = document.getElementById('order-list');
        if (orderList) {
            orderList.innerHTML += `<tr><td colspan="7" class="text-center text-warning py-2">
                <i class="bi bi-info-circle"></i> Đang hiển thị dữ liệu mẫu
            </td></tr>`;
        }
    }
}

async function saveOrdersToJson(data) {
    try {
        const response = await fetch('../data/order.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data, null, 2)
        });
        if (!response.ok) {
            console.warn("Không thể ghi vào file JSON.");
        }
    } catch (error) {
        console.warn("Lỗi khi ghi file JSON:", error);
    }
}

// ================================================================
// HÀM CHUYỂN ĐỔI NGÀY THÁNG (DD/MM/YYYY -> Date)
// ================================================================
function convertToDate(dateStr) {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return new Date(dateStr);
}

// ================================================================
// CÁC HÀM RENDER
// ================================================================
function renderStats() {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const approved = orders.filter(o => o.status === 'approved').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statApproved = document.getElementById('stat-approved');
    const statCancel = document.getElementById('stat-cancel');
    
    if (statTotal) statTotal.innerText = total;
    if (statPending) statPending.innerText = pending;
    if (statApproved) statApproved.innerText = approved;
    if (statCancel) statCancel.innerText = cancelled;
}

function renderOrders() {
    const regularOrders = orders.filter(o => o.status !== 'pending_approval' && !o.isCustomOrder);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = regularOrders.slice(start, end);

    const tbody = document.getElementById('order-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">Không có đơn hàng nào phù hợp.</td></tr>`;
        return;
    }

    pageData.forEach(o => {
        const status = statusMap[o.status] || { text: o.status, class: 'badge-status-pending' };
        tbody.innerHTML += `
            <tr>
                <td class="ps-4"><span class="order-id">#${o.id}</span></td>
                <td>
                    <div class="customer-info">
                        <span class="customer-avatar">${o.customerAvatar || '--'}</span>
                        <div><div class="customer-name">${o.customerName}</div></div>
                    </div>
                </td>
                <td>${o.date}</td>
                <td>${o.product}</td>
                <td class="order-total">${o.total.toLocaleString('vi-VN')}đ</td>
                <td><span class="badge-status ${status.class}">${status.text}</span></td>
                <td class="pe-4">
                    <div class="action-btn-group">
                        <button class="btn-action-icon" onclick="openOrderDetail('${o.id}')" title="Xem chi tiết"><i class="bi bi-eye"></i></button>
                        <div class="dropdown">
                            <button class="btn-action-icon" data-bs-toggle="dropdown" aria-expanded="false" title="Chỉnh sửa trạng thái">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${o.id}', 'pending')">Chờ xác nhận</a></li>
                                <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${o.id}', 'approved')">Đã xác nhận</a></li>
                                <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${o.id}', 'completed')">Hoàn thành</a></li>
                                <li class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="updateOrderStatus('${o.id}', 'cancelled')">Đã hủy</a></li>
                            </ul>
                        </div>
                        <button class="btn-action-icon text-danger" onclick="deleteOrder('${o.id}')" title="Xóa"><i class="bi bi-x-circle"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    const infoEl = document.getElementById('pagination-info');
    if (infoEl) {
        infoEl.innerText = `Hiển thị ${start + 1}-${Math.min(end, regularOrders.length)} của ${regularOrders.length} đơn`;
    }
    
    const totalPages = Math.ceil(regularOrders.length / ITEMS_PER_PAGE);
    const controls = document.getElementById('pagination-controls');
    if (controls) {
        controls.innerHTML = '';
        if (totalPages > 1) {
            controls.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage - 1})">«</a></li>`;
            for (let i = 1; i <= totalPages; i++) {
                controls.innerHTML += `<li class="page-item ${currentPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
            }
            controls.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage + 1})">»</a></li>`;
        }
    }
}

function renderCancelRequests() {
    const cancelItems = orders.filter(o => o.status === 'pending_approval');
    const start = (currentCancelPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = cancelItems.slice(start, end);

    const tbody = document.getElementById('cancel-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">Không có yêu cầu hủy nào.</td></tr>`;
        return;
    }

    pageData.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td class="ps-4"><span class="order-id">#${r.id}</span></td>
                <td>${r.customerName}</td>
                <td class="cancel-reason" title="${r.reason}">${r.reason}</td>
                <td>${r.date}</td>
                <td><span class="badge-status badge-status-pending_approval">Chờ duyệt</span></td>
                <td class="pe-4">
                    <div class="action-btn-group">
                        <button class="btn-process-cancel" onclick="handleCancelRequest('${r.id}', true)">Đồng ý</button>
                        <button class="btn-ignore-cancel" onclick="handleCancelRequest('${r.id}', false)">Từ chối</button>
                    </div>
                </td>
            </tr>
        `;
    });

    const totalPages = Math.ceil(cancelItems.length / ITEMS_PER_PAGE);
    const controls = document.getElementById('pagination-controls-cancel');
    if (controls) {
        controls.innerHTML = '';
        if (totalPages > 1) {
            controls.innerHTML += `<li class="page-item ${currentCancelPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeCancelPage(${currentCancelPage - 1})">«</a></li>`;
            for (let i = 1; i <= totalPages; i++) {
                controls.innerHTML += `<li class="page-item ${currentCancelPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changeCancelPage(${i})">${i}</a></li>`;
            }
            controls.innerHTML += `<li class="page-item ${currentCancelPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeCancelPage(${currentCancelPage + 1})">»</a></li>`;
        }
    }
}

// ================================================================
// RENDER CUSTOM ORDER (BẢNG RIÊNG - DÙNG BOOTSTRAP ICONS)
// ================================================================
function renderCustomOrders() {
    const customItems = orders.filter(o => o.isCustomOrder === true);
    
    const start = (currentCustomPage - 1) * CUSTOM_ITEMS_PER_PAGE;
    const end = start + CUSTOM_ITEMS_PER_PAGE;
    const pageData = customItems.slice(start, end);

    const tbody = document.getElementById('custom-order-list');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const countEl = document.getElementById('custom-count');
    if (countEl) countEl.innerText = customItems.length;

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">Chưa có đơn hàng custom nào.</td></tr>`;
        return;
    }

    pageData.forEach(o => {
        const status = statusMap[o.status] || { text: o.status, class: 'badge-status-pending' };
        
        let actionButtons = '';
        if (o.status === 'waiting_quote') {
            actionButtons = `
                <button class="btn-action-icon" onclick="openCustomOrderForm('${o.id}')" title="Xem form yêu cầu">
                    <i class="bi bi-file-text"></i>
                </button>
                <button class="btn-action-icon text-success" onclick="openQuoteForm('${o.id}')" title="Báo giá cho khách">
                    <i class="bi bi-cash-stack"></i>
                </button>
            `;
        } else if (o.status === 'approved' || o.status === 'pending') {
            actionButtons = `
                <button class="btn-action-icon" onclick="openCustomOrderForm('${o.id}')" title="Xem form yêu cầu">
                    <i class="bi bi-file-text"></i>
                </button>
                <button class="btn-action-icon text-warning" onclick="editQuote('${o.id}')" title="Sửa báo giá">
                    <i class="bi bi-pencil-square"></i>
                </button>
            `;
        } else {
            actionButtons = `
                <button class="btn-action-icon" onclick="openCustomOrderForm('${o.id}')" title="Xem form yêu cầu">
                    <i class="bi bi-file-text"></i>
                </button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td class="ps-4"><span class="order-id">#${o.id}</span></td>
                <td>
                    <div class="customer-info">
                        <span class="customer-avatar">${o.customerAvatar}</span>
                        <div><div class="customer-name">${o.customerName}</div></div>
                    </div>
                </td>
                <td>${o.product}</td>
                <td>
                    <span class="badge bg-info bg-opacity-10 text-info">
                        ${o.customDetails ? Object.keys(o.customDetails).length + ' yêu cầu' : 'Xem chi tiết'}
                    </span>
                </td>
                <td><span class="badge-status ${status.class}">${status.text}</span></td>
                <td class="pe-4">
                    <div class="action-btn-group">${actionButtons}</div>
                </td>
            </tr>
        `;
    });

    const totalPages = Math.ceil(customItems.length / CUSTOM_ITEMS_PER_PAGE);
    const controls = document.getElementById('pagination-controls-custom');
    if (controls) {
        controls.innerHTML = '';
        if (totalPages > 1) {
            controls.innerHTML += `<li class="page-item ${currentCustomPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeCustomPage(${currentCustomPage - 1})">«</a></li>`;
            for (let i = 1; i <= totalPages; i++) {
                controls.innerHTML += `<li class="page-item ${currentCustomPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changeCustomPage(${i})">${i}</a></li>`;
            }
            controls.innerHTML += `<li class="page-item ${currentCustomPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeCustomPage(${currentCustomPage + 1})">»</a></li>`;
        }
    }
}

function changePage(page) { currentPage = page; renderOrders(); }
function changeCancelPage(page) { currentCancelPage = page; renderCancelRequests(); }
function changeCustomPage(page) { currentCustomPage = page; renderCustomOrders(); }

// ================================================================
// CHỨC NĂNG MỞ MODAL CHI TIẾT
// ================================================================
function openOrderDetail(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const modalId = document.getElementById('modalOrderId');
    const customerName = document.getElementById('modalCustomerName');
    const customerPhone = document.getElementById('modalCustomerPhone');
    const customerAddress = document.getElementById('modalCustomerAddress');
    const paymentMethod = document.getElementById('modalPaymentMethod');
    const productName = document.getElementById('modalProductName');
    const orderDate = document.getElementById('modalOrderDate');
    const orderTotal = document.getElementById('modalOrderTotal');
    const orderStatus = document.getElementById('modalOrderStatus');
    const customerNote = document.getElementById('modalCustomerNote');

    if (modalId) modalId.innerText = `Chi tiết đơn hàng #${order.id}`;
    if (customerName) customerName.innerText = order.customerName;
    if (customerPhone) customerPhone.innerText = order.phone || 'Chưa cập nhật';
    if (customerAddress) customerAddress.innerText = order.address || 'Chưa cập nhật';
    if (paymentMethod) paymentMethod.innerText = order.payment || 'Chưa có phương thức';
    if (productName) productName.innerText = order.product;
    if (orderDate) orderDate.innerText = order.date;
    if (orderTotal) orderTotal.innerText = order.total.toLocaleString('vi-VN') + 'đ';

    const statusInfo = statusMap[order.status] || { text: order.status, class: 'badge-status-pending' };
    if (orderStatus) {
        orderStatus.innerText = statusInfo.text;
        orderStatus.className = `badge ${statusInfo.class}`;
    }

    if (customerNote) {
        if (order.customerNote && order.customerNote.trim() !== '') {
            customerNote.innerText = order.customerNote;
            customerNote.className = 'p-3 bg-light rounded text-dark';
        } else {
            customerNote.innerText = 'Không có ghi chú.';
            customerNote.className = 'p-3 bg-light rounded text-muted fst-italic';
        }
    }

    const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    modal.show();
}

// ================================================================
// MỞ FORM YÊU CẦU CUSTOM (Dùng Bootstrap Modal)
// ================================================================
function openCustomOrderForm(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    let modalEl = document.getElementById('customFormModal');
    if (!modalEl) {
        const modalHTML = `
            <div class="modal fade" id="customFormModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title fw-bold">
                                <i class="bi bi-file-text me-2"></i>
                                Yêu cầu thiết kế <span id="customFormId"></span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4" id="customFormBody"></div>
                        <div class="modal-footer" id="customFormFooter">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalEl = document.getElementById('customFormModal');
    }

    document.getElementById('customFormId').innerText = `#${order.id}`;
    
    let detailHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <h6 class="fw-bold border-bottom pb-2">Thông tin khách hàng</h6>
                <p><strong>Tên:</strong> ${order.customerName}</p>
                <p><strong>SĐT:</strong> ${order.phone || 'Chưa có'}</p>
                <p><strong>Địa chỉ:</strong> ${order.address || 'Chưa có'}</p>
            </div>
            <div class="col-md-6">
                <h6 class="fw-bold border-bottom pb-2">Sản phẩm</h6>
                <p><strong>Tên:</strong> ${order.product}</p>
                <p><strong>Ngày đặt:</strong> ${order.date}</p>
                <p><strong>Trạng thái:</strong> <span class="badge-status ${statusMap[order.status]?.class || 'badge-status-pending'}">${statusMap[order.status]?.text || order.status}</span></p>
            </div>
            <div class="col-12">
                <h6 class="fw-bold border-bottom pb-2">Chi tiết yêu cầu Custom</h6>
                ${order.customDetails ? `
                    <div class="bg-light p-3 rounded">
                        ${Object.entries(order.customDetails).map(([key, value]) => `
                            <div class="row mb-1">
                                <div class="col-4 fw-bold">${key}:</div>
                                <div class="col-8">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-muted">Không có chi tiết cụ thể</p>'}
            </div>
            <div class="col-12">
                <h6 class="fw-bold border-bottom pb-2">Ghi chú của khách</h6>
                <div class="bg-light p-3 rounded">${order.customerNote || 'Không có ghi chú'}</div>
            </div>
            ${order.quotedPrice > 0 ? `
                <div class="col-12">
                    <h6 class="fw-bold border-bottom pb-2 text-success">Báo giá đã gửi</h6>
                    <div class="bg-success bg-opacity-10 p-3 rounded">
                        <p><strong>Giá:</strong> ${order.quotedPrice.toLocaleString('vi-VN')}đ</p>
                        <p><strong>Ngày:</strong> ${order.quoteDate || 'Chưa có'}</p>
                        ${order.quoteNote ? `<p><strong>Ghi chú:</strong> ${order.quoteNote}</p>` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('customFormBody').innerHTML = detailHTML;

    const footer = document.getElementById('customFormFooter');
    if (footer) {
        if (order.status === 'waiting_quote') {
            footer.innerHTML = `
                <button class="btn btn-success fw-bold" onclick="openQuoteForm('${order.id}')">
                    <i class="bi bi-cash-stack me-1"></i> Báo giá ngay
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            `;
        } else {
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            `;
        }
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// ================================================================
// MỞ FORM BÁO GIÁ (Dùng Bootstrap Modal)
// ================================================================
function openQuoteForm(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const customModal = document.getElementById('customFormModal');
    if (customModal) {
        const instance = bootstrap.Modal.getInstance(customModal);
        if (instance) instance.hide();
    }

    let modalEl = document.getElementById('quoteModal');
    if (!modalEl) {
        const modalHTML = `
            <div class="modal fade" id="quoteModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title fw-bold">
                                <i class="bi bi-cash-stack me-2"></i>
                                Báo giá đơn custom <span id="quoteOrderId"></span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Giá báo (VNĐ)</label>
                                    <input type="number" id="quotePriceInput" class="form-control" placeholder="Nhập giá tiền...">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Ngày báo giá</label>
                                    <input type="date" id="quoteDateInput" class="form-control">
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold">Ghi chú báo giá</label>
                                    <textarea id="quoteNoteInput" class="form-control" rows="3" placeholder="Nhập thông tin báo giá, ưu đãi, thời gian giao hàng..."></textarea>
                                </div>
                                <div class="col-12">
                                    <div class="bg-light p-3 rounded" id="quoteCustomerInfo"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                            <button type="button" class="btn btn-success fw-bold" id="btnSubmitQuote">
                                <i class="bi bi-send me-1"></i> Gửi báo giá
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalEl = document.getElementById('quoteModal');
    }

    document.getElementById('quoteOrderId').innerText = `#${order.id}`;
    document.getElementById('quotePriceInput').value = order.quotedPrice || '';
    document.getElementById('quoteDateInput').value = order.quoteDate || new Date().toISOString().split('T')[0];
    document.getElementById('quoteNoteInput').value = order.quoteNote || '';
    document.getElementById('quoteCustomerInfo').innerHTML = `
        <p class="mb-1"><strong>Khách hàng:</strong> ${order.customerName}</p>
        <p class="mb-1"><strong>Sản phẩm:</strong> ${order.product}</p>
        <p class="mb-0"><strong>Ghi chú:</strong> ${order.customerNote || 'Không có'}</p>
    `;

    document.getElementById('btnSubmitQuote').onclick = function() {
        submitQuote(id);
    };

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// ================================================================
// SỬA BÁO GIÁ (Dùng Bootstrap Modal)
// ================================================================
function editQuote(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (order.quotedPrice <= 0) {
        alert('Đơn hàng này chưa có báo giá. Vui lòng báo giá trước!');
        return;
    }

    let modalEl = document.getElementById('editQuoteModal');
    if (!modalEl) {
        const modalHTML = `
            <div class="modal fade" id="editQuoteModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title fw-bold">
                                <i class="bi bi-pencil-square me-2"></i>
                                Sửa báo giá <span id="editOrderId"></span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold"> Giá mới (VNĐ)</label>
                                    <input type="number" id="editPriceInput" class="form-control" placeholder="Nhập giá mới...">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold"> Ngày cập nhật</label>
                                    <input type="date" id="editDateInput" class="form-control">
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold"> Ghi chú mới</label>
                                    <textarea id="editNoteInput" class="form-control" rows="3" placeholder="Cập nhật thông tin báo giá..."></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                            <button type="button" class="btn btn-warning fw-bold" id="btnUpdateQuote">
                                <i class="bi bi-save me-1"></i> Cập nhật báo giá
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalEl = document.getElementById('editQuoteModal');
    }

    document.getElementById('editOrderId').innerText = `#${order.id}`;
    document.getElementById('editPriceInput').value = order.quotedPrice || '';
    document.getElementById('editDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('editNoteInput').value = order.quoteNote || '';

    document.getElementById('btnUpdateQuote').onclick = function() {
        updateQuote(id);
    };

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// ================================================================
// XỬ LÝ GỬI BÁO GIÁ
// ================================================================
function submitQuote(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const price = document.getElementById('quotePriceInput').value;
    const quoteDate = document.getElementById('quoteDateInput').value;
    const note = document.getElementById('quoteNoteInput').value;

    if (!price || parseFloat(price) <= 0) {
        alert(' Vui lòng nhập giá báo hợp lệ!');
        return;
    }

    order.quotedPrice = parseFloat(price);
    order.quoteDate = quoteDate;
    order.quoteNote = note;
    order.total = parseFloat(price);
    order.status = 'approved';

    saveOrdersToJson(orders);
    localStorage.setItem('orders', JSON.stringify(orders));

    const modalEl = document.getElementById('quoteModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    renderStats();
    renderOrders();
    renderCancelRequests();
    renderCustomOrders();

    alert(` Đã gửi báo giá cho đơn hàng #${id}\n Giá: ${price.toLocaleString('vi-VN')}đ`);
}

// ================================================================
// CẬP NHẬT BÁO GIÁ
// ================================================================
function updateQuote(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const price = document.getElementById('editPriceInput').value;
    const date = document.getElementById('editDateInput').value;
    const note = document.getElementById('editNoteInput').value;

    if (!price || parseFloat(price) <= 0) {
        alert(' Vui lòng nhập giá hợp lệ!');
        return;
    }

    order.quotedPrice = parseFloat(price);
    order.quoteDate = date;
    order.quoteNote = note;
    order.total = parseFloat(price);

    saveOrdersToJson(orders);
    localStorage.setItem('orders', JSON.stringify(orders));

    const modalEl = document.getElementById('editQuoteModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    renderStats();
    renderOrders();
    renderCancelRequests();
    renderCustomOrders();

    alert(` Đã cập nhật báo giá cho đơn hàng #${id}\n Giá mới: ${price.toLocaleString('vi-VN')}đ`);
}

// ================================================================
// LOGIC XỬ LÝ CÒN LẠI
// ================================================================
function updateOrderStatus(id, newStatus) {
    const order = orders.find(o => o.id === id);
    if (order && order.status !== newStatus) {
        order.status = newStatus;
        saveOrdersToJson(orders);
        localStorage.setItem('orders', JSON.stringify(orders));
        renderStats();
        renderOrders();
        renderCancelRequests();
        renderCustomOrders();
        alert(` Đã cập nhật đơn hàng #${id} thành "${statusMap[newStatus].text}"`);
    }
}

function deleteOrder(id) {
    if (confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${id} không?`)) {
        orders = orders.filter(o => o.id !== id);
        saveOrdersToJson(orders);
        localStorage.setItem('orders', JSON.stringify(orders));
        renderStats();
        renderOrders();
        renderCancelRequests();
        renderCustomOrders();
    }
}

function handleCancelRequest(id, isApproved) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (isApproved) {
        order.status = 'cancelled';
        saveOrdersToJson(orders);
        localStorage.setItem('orders', JSON.stringify(orders));
        renderStats();
        renderOrders();
        renderCancelRequests();
        renderCustomOrders();
        alert(` Đã đồng ý hủy đơn hàng #${id}`);
    } else {
        order.status = 'pending';
        saveOrdersToJson(orders);
        localStorage.setItem('orders', JSON.stringify(orders));
        renderStats();
        renderOrders();
        renderCancelRequests();
        renderCustomOrders();
        alert(` Đã từ chối hủy đơn hàng #${id}`);
    }
}

// ================================================================
//  HÀM LỌC - GIỮ NGUYÊN DỮ LIỆU CHO CÁC BẢNG KHÁC
// ================================================================
function applyFilters() {
    const searchTerm = document.getElementById('search-name').value.toLowerCase().trim();
    const statusFilter = document.getElementById('filter-status').value;
    const dateFilter = document.getElementById('filter-date').value;
    const sortFilter = document.getElementById('filter-sort').value;

    console.log('🔍 Đang lọc với:', { searchTerm, statusFilter, dateFilter, sortFilter });

    // Lọc từ dữ liệu GỐC (originalOrders) - CHỈ LỌC ĐƠN HÀNG THƯỜNG
    let filteredRegularOrders = originalOrders.filter(o => {
        // CHỈ LẤY đơn hàng thường (không phải custom, không phải pending_approval)
        if (o.isCustomOrder || o.status === 'pending_approval') return false;
        
        // Tìm kiếm
        const matchId = o.id.toLowerCase().includes(searchTerm);
        const matchName = o.customerName.toLowerCase().includes(searchTerm);
        const matchSearch = matchId || matchName;
        
        // Lọc theo trạng thái
        const matchStatus = statusFilter === '' || o.status === statusFilter;
        
        // Lọc theo ngày
        let matchDate = true;
        if (dateFilter && dateFilter !== '') {
            const parts = dateFilter.split('-');
            const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            matchDate = o.date === formattedDate;
        }
        
        return matchSearch && matchStatus && matchDate;
    });

    // Sắp xếp
    if (sortFilter === 'newest') {
        filteredRegularOrders.sort((a, b) => {
            const dateA = convertToDate(a.date);
            const dateB = convertToDate(b.date);
            return dateB - dateA;
        });
    } else if (sortFilter === 'oldest') {
        filteredRegularOrders.sort((a, b) => {
            const dateA = convertToDate(a.date);
            const dateB = convertToDate(b.date);
            return dateA - dateB;
        });
    }

    console.log('📊 Kết quả lọc:', filteredRegularOrders.length, 'đơn hàng thường');

    // GIỮ NGUYÊN dữ liệu cho các bảng khác (Custom + Cancel)
    const customOrders = originalOrders.filter(o => o.isCustomOrder === true);
    const cancelRequests = originalOrders.filter(o => o.status === 'pending_approval');

    // GỘP lại thành orders
    orders = [...filteredRegularOrders, ...customOrders, ...cancelRequests];
    currentPage = 1;
    
    // Render lại TẤT CẢ
    renderStats();
    renderOrders();
    renderCancelRequests();
    renderCustomOrders();
}

// ================================================================
// KHỞI TẠO KHI TRANG LOAD
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    const filterBtn = document.getElementById('btn-filter');
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }
    loadOrdersFromJson();
});