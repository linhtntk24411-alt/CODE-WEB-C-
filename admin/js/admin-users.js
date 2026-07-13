// ================================================================
// JS QUẢN LÝ NGƯỜI DÙNG (Chỉ giữ Quản Trị Viên và Khách Hàng)
// ================================================================

let users = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 4;

// ================================================================
// MOCK DATA
// ================================================================
function generateMockUsers() {
    const firstNames = ["Nguyễn Minh", "Lê Khánh", "Phạm Hoàng", "Trần Thư", "Đặng Thanh", "Hoàng Hải", "Vũ Quốc"];
    const lastNames = ["Anh", "Linh", "Nam", "Thảo", "Hằng", "Dũng", "Bảo"];
    const roles = ["admin", "customer"];
    const statuses = ["active", "pending_verify", "locked", "active", "pending_verify", "active", "locked"];

    return Array.from({ length: 48 }, (_, i) => {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase().replace(" ", ".")}${i}@gmail.com`;
        const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
        
        const dateObj = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        const dateString = dateObj.toLocaleDateString('vi-VN');
        const dateTimestamp = dateObj.getTime();

        const role = i < 2 ? "admin" : "customer";
        const status = statuses[i % statuses.length];

        return {
            id: i + 1,
            name: fullName,
            email: email,
            phone: phone,
            date: dateString,
            timestamp: dateTimestamp,
            role: role,
            status: status,
            avatar: `https://i.pravatar.cc/150?u=${i + 50}`
        };
    });
}

// ================================================================
// RENDER FUNCTIONS
// ================================================================
function renderStats() {
    document.getElementById('stat-total').innerText = users.length;
    document.getElementById('stat-new').innerText = users.slice(0, 15).length; // Thống kê 15 người mới
    document.getElementById('stat-active').innerText = users.filter(u => u.status === 'active').length;
    document.getElementById('stat-locked').innerText = users.filter(u => u.status === 'locked').length;
}

const roleMap = {
    'admin': { text: 'Quản trị viên', class: 'role-badge-admin' },
    'customer': { text: 'Khách hàng', class: 'role-badge-customer' }
};

const statusMap = {
    'active': { text: 'Đang hoạt động', class: 'status-badge-active' },
    'pending_verify': { text: 'Chờ xác minh', class: 'status-badge-pending' },
    'locked': { text: 'Bị khóa', class: 'status-badge-locked' }
};

function renderUsers(filteredData = users) {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, end);

    const tbody = document.getElementById('users-list');
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Không có người dùng nào phù hợp.</td></tr>`;
    } else {
        pageData.forEach(u => {
            const r = roleMap[u.role] || { text: u.role, class: 'role-badge-customer' };
            const s = statusMap[u.status] || { text: u.status, class: 'status-badge-locked' };
            const isLocked = u.status === 'locked';
            const isPending = u.status === 'pending_verify';
            
            let lockIcon = 'bi-unlock';
            let lockClass = 'text-success';
            if (isLocked) {
                lockIcon = 'bi-lock-fill';
                lockClass = 'text-danger';
            } else if (isPending) {
                lockIcon = 'bi-lock';
                lockClass = 'text-warning';
            }

            tbody.innerHTML += `
                <tr>
                    <td class="ps-4">
                        <div class="user-info">
                            <img src="${u.avatar}" class="user-avatar" alt="${u.name}">
                            <div>
                                <span class="user-name">${u.name}</span>
                                <span class="user-email">${u.email}</span>
                            </div>
                        </div>
                    </td>
                    <td>${u.email}</td>
                    <td class="phone-number">${u.phone}</td>
                    <td>${u.date}</td>
                    <td><span class="role-badge ${r.class}">${r.text}</span></td>
                    <td><span class="status-badge ${s.class}">${s.text}</span></td>
                    <td class="pe-4">
                        <div class="action-btn-group">
                            <!-- Dropdown Chỉnh sửa Vai trò -->
                            <div class="dropdown d-inline-block">
                                <button class="btn-action-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Chỉnh sửa vai trò">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item ${u.role === 'admin' ? 'active' : ''}" href="#" onclick="changeRole(${u.id}, 'admin')">Quản trị viên</a></li>
                                    <li><a class="dropdown-item ${u.role === 'customer' ? 'active' : ''}" href="#" onclick="changeRole(${u.id}, 'customer')">Khách hàng</a></li>
                                </ul>
                            </div>

                            <!-- Nút Ổ khóa: Chuyển đổi trạng thái -->
                            <button class="btn-action-icon ${lockClass}" onclick="toggleStatus(${u.id})" title="Chuyển đổi trạng thái">
                                <i class="bi ${lockIcon}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    const totalItems = filteredData.length;
    document.getElementById('pagination-info').innerText = `Hiển thị ${start + 1}-${Math.min(end, totalItems)} trên tổng số ${totalItems} người dùng`;
    
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
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

// ================================================================
// HÀM XỬ LÝ SỰ KIỆN & FILTER
// ================================================================
function changeRole(id, newRole) {
    const user = users.find(u => u.id === id);
    if (user) {
        user.role = newRole;
        applyFilters();
    }
}

function toggleStatus(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        if (user.status === 'active') {
            user.status = 'pending_verify';
        } else if (user.status === 'pending_verify') {
            user.status = 'locked';
        } else if (user.status === 'locked') {
            user.status = 'active';
        }
        applyFilters();
        renderStats();
    }
}

function changePage(page) {
    currentPage = page;
    applyFilters();
}

function applyFilters() {
    const selectedRole = document.getElementById('filter-role').value;
    const selectedStatus = document.getElementById('filter-status').value;
    const searchText = document.getElementById('filter-advanced').value.toLowerCase();
    const sortOrder = document.getElementById('filter-sort').value;

    let filtered = users.filter(u => {
        const roleMatch = selectedRole === '' || u.role === selectedRole;
        const statusMatch = selectedStatus === '' || u.status === selectedStatus;
        const searchMatch = u.name.toLowerCase().includes(searchText) || u.email.toLowerCase().includes(searchText);
        return roleMatch && statusMatch && searchMatch;
    });

    if (sortOrder === 'newest') {
        filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOrder === 'oldest') {
        filtered.sort((a, b) => a.timestamp - b.timestamp);
    }

    renderUsers(filtered);
}

// ================================================================
// INIT & EVENT LISTENERS
// ================================================================
function init() {
    users = generateMockUsers();
    renderStats();
    renderUsers();

    document.getElementById('filter-role').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
    document.getElementById('filter-status').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
    document.getElementById('filter-advanced').addEventListener('input', () => {
        currentPage = 1;
        applyFilters();
    });
    document.getElementById('filter-sort').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
}

document.addEventListener('DOMContentLoaded', init);