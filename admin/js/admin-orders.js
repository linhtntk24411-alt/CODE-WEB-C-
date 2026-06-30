// ================================================================
// JS QUẢN LÝ ĐƠN HÀNG (Phiên bản HOÀN CHỈNH - Load JSON + Thao tác)
// ================================================================

let orders = [];
let cancelRequests = [];
let currentPage = 1;
let currentCancelPage = 1;
const ITEMS_PER_PAGE = 4;

const statusMap = {
    "pending": { text: "Chờ xác nhận", class: "badge-status-pending" },
    "approved": { text: "Đã xác nhận", class: "badge-status-approved" },
    "completed": { text: "Hoàn thành", class: "badge-status-completed" },
    "cancelled": { text: "Đã hủy", class: "badge-status-cancelled" }
};

// ================================================================
// HÀM ĐỌC DỮ LIỆU TỪ JSON
// ================================================================
async function loadOrdersFromJson() {
    try {
        // ĐÃ SỬA ĐƯỜNG DẪN Ở ĐÂY
        const response = await fetch('../data/orders.json');
        if (response.ok) {
            orders = await response.json();
        } else {
            throw new Error("Không tìm thấy file JSON");
        }
    } catch (error) {
        console.warn("Dùng dữ liệu mặc định (mock) vì không load được JSON.");
        orders = getMockOrders();
    } finally {
        // Luôn luôn sinh dữ liệu hủy giả lập
        cancelRequests = getMockCancelRequests();
        renderStats();
        renderOrders();
        renderCancelRequests();
    }
}

function getMockOrders() {
    return [
        { id: "DH001", customerName: "Nguyễn Thị Mai", customerAvatar: "NM", product: "Bộ KIT Mùa Hè", date: "24/10/2024", total: 250000, status: "pending" },
        { id: "DH002", customerName: "Trần Minh Anh", customerAvatar: "TA", product: "Móc khóa Pixel Art", date: "23/10/2024", total: 35000, status: "approved" },
        { id: "DH003", customerName: "Lê Khánh Linh", customerAvatar: "LK", product: "Lót ly thủ công", date: "23/10/2024", total: 45000, status: "completed" },
        { id: "DH004", customerName: "Phạm Hoàng Nam", customerAvatar: "HN", product: "Tranh Pixel Art", date: "22/10/2024", total: 850000, status: "cancelled" }
    ];
}

function getMockCancelRequests() {
    return [
        { id: "DH095", customer: "Lê Văn Tùng", reason: "Đặt nhầm sản phẩm, muốn đổi mẫu khác", date: "Vừa xong", status: "pending_approval" },
        { id: "DH088", customer: "Hoàng Bảo Anh", reason: "Thời gian giao hàng quá lâu", date: "2 giờ trước", status: "pending_approval" }
    ];
}

// ================================================================
// RENDER FUNCTIONS
// ================================================================
function renderStats() {
    document.getElementById('stat-total').innerText = orders.length;
    document.getElementById('stat-pending').innerText = orders.filter(o => o.status === 'pending').length;
    document.getElementById('stat-approved').innerText = orders.filter(o => o.status === 'approved').length;
    document.getElementById('stat-cancel').innerText = cancelRequests.length;
}

function renderOrders() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = orders.slice(start, end);

    const tbody = document.getElementById('order-list');
    tbody.innerHTML = '';

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
                        <button class="btn-action-icon" onclick="viewOrder('${o.id}')" title="Xem chi tiết"><i class="bi bi-eye"></i></button>
                        <button class="btn-action-icon" onclick="editOrder('${o.id}')" title="Chỉnh sửa"><i class="bi bi-pencil"></i></button>
                        <button class="btn-action-icon text-danger" onclick="deleteOrder('${o.id}')" title="Xóa"><i class="bi bi-x-circle"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById('pagination-info').innerText = `Hiển thị ${start + 1}-${Math.min(end, orders.length)} của ${orders.length} đơn`;

    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
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
    const start = (currentCancelPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = cancelRequests.slice(start, end);

    const tbody = document.getElementById('cancel-list');
    tbody.innerHTML = '';
    pageData.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td class="ps-4"><span class="order-id">#${r.id}</span></td>
                <td>${r.customer}</td>
                <td class="cancel-reason" title="${r.reason}">${r.reason}</td>
                <td>${r.date}</td>
                <td><span class="badge-status badge-status-pending_approval">Chờ duyệt</span></td>
                <td class="pe-4">
                    <div class="action-btn-group">
                        <button class="btn-process-cancel" onclick="approveCancel('${r.id}')">Đồng ý</button>
                        <button class="btn-ignore-cancel" onclick="rejectCancel('${r.id}')">Từ chối</button>
                    </div>
                </td>
            </tr>
        `;
    });

    const totalPages = Math.ceil(cancelRequests.length / ITEMS_PER_PAGE);
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
// CÁC HÀM THAO TÁC (SỰ KIỆN)
// ================================================================
function viewOrder(id) {
    alert(`Đang mở chi tiết đơn hàng #${id}`);
}

function editOrder(id) {
    alert(`Đang mở form chỉnh sửa đơn hàng #${id}`);
}

function deleteOrder(id) {
    if (confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${id} không?`)) {
        orders = orders.filter(o => o.id !== id);
        renderStats();
        renderOrders();
        alert(`Đã xóa đơn hàng #${id}`);
    }
}

function approveCancel(id) {
    if (confirm(`Đồng ý hủy đơn hàng #${id}?`)) {
        cancelRequests = cancelRequests.filter(r => r.id !== id);
        // Cập nhật trạng thái đơn hàng gốc thành cancelled (nếu còn trong danh sách)
        const order = orders.find(o => o.id === id);
        if (order) order.status = 'cancelled';
        
        renderStats();
        renderOrders();
        renderCancelRequests();
        alert(`Đã duyệt hủy đơn hàng #${id}`);
    }
}

function rejectCancel(id) {
    if (confirm(`Từ chối hủy đơn hàng #${id}?`)) {
        cancelRequests = cancelRequests.filter(r => r.id !== id);
        renderCancelRequests();
        alert(`Đã từ chối hủy đơn hàng #${id}`);
    }
}

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Gọi hàm load JSON khi trang load xong
    loadOrdersFromJson();
});