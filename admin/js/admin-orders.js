// ================================================================
// JS QUẢN LÝ ĐƠN HÀNG (Đã thêm nút con mắt, Modal + Thông tin chi tiết)
// ================================================================

let orders = [];
let currentPage = 1;
let currentCancelPage = 1;
const ITEMS_PER_PAGE = 4;

const statusMap = {
    "pending": { text: "Chờ xác nhận", class: "badge-status-pending" },
    "approved": { text: "Đã xác nhận", class: "badge-status-approved" },
    "completed": { text: "Hoàn thành", class: "badge-status-completed" },
    "cancelled": { text: "Đã hủy", class: "badge-status-cancelled" },
    "pending_approval": { text: "Chờ duyệt", class: "badge-status-pending_approval" }
};

// ================================================================
// ĐỌC & GHI DỮ LIỆU VÀO JSON THẬT
// ================================================================
async function loadOrdersFromJson() {
    try {
        const response = await fetch('../data/order.json');
        if (!response.ok) {
            throw new Error(`Lỗi HTTP ${response.status}`);
        }
        orders = await response.json();
        console.log("✅ Đã load dữ liệu từ order.json");
        
        renderStats();
        renderOrders();
        renderCancelRequests();
    } catch (error) {
        console.error("❌ LỖI: Không thể tải dữ liệu từ order.json", error);
        document.getElementById('order-list').innerHTML = `<tr><td colspan="7" class="text-center text-danger py-5">
            <i class="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
            <strong>LỖI TẢI DỮ LIỆU</strong><br>
            Không thể tải file <code>order.json</code>.
        </td></tr>`;
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
            console.warn("Không thể ghi vào file JSON. Dữ liệu vẫn an toàn trong LocalStorage.");
        }
    } catch (error) {
        console.warn("Lỗi khi ghi file JSON:", error);
    }
}

// ================================================================
// CÁC HÀM RENDER
// ================================================================
function renderStats() {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const approved = orders.filter(o => o.status === 'approved').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-approved').innerText = approved;
    document.getElementById('stat-cancel').innerText = cancelled;
}

function renderOrders() {
    const regularOrders = orders.filter(o => o.status !== 'pending_approval');
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = regularOrders.slice(start, end);

    const tbody = document.getElementById('order-list');
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
                        <span class="customer-avatar">${o.customerAvatar}</span>
                        <div><div class="customer-name">${o.customerName}</div></div>
                    </div>
                </td>
                <td>${o.date}</td>
                <td>${o.product}</td>
                <td class="order-total">${o.total.toLocaleString('vi-VN')}đ</td>
                <td><span class="badge-status ${status.class}">${status.text}</span></td>
                <td class="pe-4">
                    <div class="action-btn-group">
                        <!-- Nút con mắt: Mở Modal chi tiết -->
                        <button class="btn-action-icon" onclick="openOrderDetail('${o.id}')" title="Xem chi tiết"><i class="bi bi-eye"></i></button>
                        <!-- Dropdown chỉnh trạng thái -->
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

    document.getElementById('pagination-info').innerText = `Hiển thị ${start + 1}-${Math.min(end, regularOrders.length)} của ${regularOrders.length} đơn`;
    
    const totalPages = Math.ceil(regularOrders.length / ITEMS_PER_PAGE);
    const controls = document.getElementById('pagination-controls');
    controls.innerHTML = '';
    if (totalPages > 1) {
        controls.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage - 1})">«</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            controls.innerHTML += `<li class="page-item ${currentPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
        }
        controls.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage + 1})">»</a></li>`;
    }
}

function renderCancelRequests() {
    const cancelItems = orders.filter(o => o.status === 'pending_approval');
    const start = (currentCancelPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = cancelItems.slice(start, end);

    const tbody = document.getElementById('cancel-list');
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
    controls.innerHTML = '';
    if (totalPages > 1) {
        controls.innerHTML += `<li class="page-item ${currentCancelPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeCancelPage(${currentCancelPage - 1})">«</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            controls.innerHTML += `<li class="page-item ${currentCancelPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changeCancelPage(${i})">${i}</a></li>`;
        }
        controls.innerHTML += `<li class="page-item ${currentCancelPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeCancelPage(${currentCancelPage + 1})">»</a></li>`;
    }
}

function changePage(page) { currentPage = page; renderOrders(); }
function changeCancelPage(page) { currentCancelPage = page; renderCancelRequests(); }

// ================================================================
// CHỨC NĂNG MỞ MODAL CHI TIẾT
// ================================================================
function openOrderDetail(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    document.getElementById('modalOrderId').innerText = `Chi tiết đơn hàng #${order.id}`;
    document.getElementById('modalCustomerName').innerText = order.customerName;
    document.getElementById('modalCustomerPhone').innerText = order.phone || 'Chưa cập nhật';
    document.getElementById('modalCustomerAddress').innerText = order.address || 'Chưa cập nhật';
    document.getElementById('modalPaymentMethod').innerText = order.payment || 'Chưa có phương thức';
    document.getElementById('modalProductName').innerText = order.product;
    document.getElementById('modalOrderDate').innerText = order.date;
    document.getElementById('modalOrderTotal').innerText = order.total.toLocaleString('vi-VN') + 'đ';

    const statusInfo = statusMap[order.status] || { text: order.status, class: 'badge-status-pending' };
    const statusBadge = document.getElementById('modalOrderStatus');
    statusBadge.innerText = statusInfo.text;
    statusBadge.className = `badge ${statusInfo.class}`;

    const noteEl = document.getElementById('modalCustomerNote');
    if (order.customerNote && order.customerNote.trim() !== '') {
        noteEl.innerText = order.customerNote;
        noteEl.className = 'p-3 bg-light rounded text-dark';
    } else {
        noteEl.innerText = 'Không có ghi chú.';
        noteEl.className = 'p-3 bg-light rounded text-muted fst-italic';
    }

    const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    modal.show();
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
        alert(`Đã cập nhật đơn hàng #${id} thành "${statusMap[newStatus].text}"`);
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
        alert(`Đã đồng ý hủy đơn hàng #${id}`);
    } else {
        order.status = 'pending';
        saveOrdersToJson(orders);
        localStorage.setItem('orders', JSON.stringify(orders));
        renderStats();
        renderOrders();
        renderCancelRequests();
        alert(`Đã từ chối hủy đơn hàng #${id}`);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('search-name').value.toLowerCase().trim();
    const statusFilter = document.getElementById('filter-status').value;
    const dateFilter = document.getElementById('filter-date').value;

    const cancelItems = orders.filter(o => o.status === 'pending_approval');
    const regularOrders = orders.filter(o => o.status !== 'pending_approval');

    let filtered = regularOrders.filter(o => {
        const matchId = o.id.toLowerCase().includes(searchTerm);
        const matchName = o.customerName.toLowerCase().includes(searchTerm);
        const matchStatus = statusFilter === '' || o.status === statusFilter;
        const matchDate = dateFilter === '' || o.date === dateFilter;
        return (matchId || matchName) && matchStatus && matchDate;
    });

    orders = [...filtered, ...cancelItems];
    currentPage = 1;
    renderOrders();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btn-filter').addEventListener('click', applyFilters);
    loadOrdersFromJson();
});