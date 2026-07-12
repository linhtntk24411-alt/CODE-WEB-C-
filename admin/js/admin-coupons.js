// ================================================================
// QUẢN LÝ MÃ GIẢM GIÁ - admin-coupons.js
// ================================================================

let coupons = [];
let sampleCoupons = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 4;
let currentDeleteCode = '';
let currentEditCode = '';

// ================================================================
// DỮ LIỆU MẪU
// ================================================================
const defaultCoupons = [
    {
        id: 1,
        code: 'URII10',
        value: '10%',
        condition: 'Đơn tối thiểu 200k',
        created: '10/10/2024',
        startDate: '10/10/2024',
        expiry: '30/10/2024',
        status: 'active',
        statusText: 'Đang hoạt động',
        maxUses: '100',
        description: 'Mã giảm giá 10% cho đơn hàng từ 200k, áp dụng cho tất cả sản phẩm.'
    },
    {
        id: 2,
        code: 'URII20',
        value: '20k',
        condition: 'Cho bộ KIT mới',
        created: '15/10/2024',
        startDate: '15/10/2024',
        expiry: '25/10/2024',
        status: 'expiring',
        statusText: 'Sắp hết hạn',
        maxUses: '50',
        description: 'Giảm 20k cho bộ KIT mới, sắp hết hạn vào ngày 25/10.'
    },
    {
        id: 3,
        code: 'SUMMER15',
        value: '15%',
        condition: 'Tất cả sản phẩm',
        created: '01/06/2024',
        startDate: '01/06/2024',
        expiry: '30/08/2024',
        status: 'expired',
        statusText: 'Đã hết hạn',
        maxUses: '200',
        description: 'Mã giảm giá mùa hè 15% cho tất cả sản phẩm, đã hết hạn.'
    },
    {
        id: 4,
        code: 'DIY30',
        value: '30k',
        condition: 'Đơn từ 500k',
        created: '20/10/2024',
        startDate: '20/10/2024',
        expiry: '20/11/2024',
        status: 'active',
        statusText: 'Đang hoạt động',
        maxUses: '75',
        description: 'Giảm 30k cho đơn hàng từ 500k, áp dụng cho sản phẩm DIY.'
    },
    {
        id: 5,
        code: 'FREESHIP',
        value: 'Miễn phí',
        condition: 'Đơn từ 300k',
        created: '01/11/2024',
        startDate: '01/11/2024',
        expiry: '30/11/2024',
        status: 'active',
        statusText: 'Đang hoạt động',
        maxUses: 'Không giới hạn',
        description: 'Miễn phí vận chuyển cho đơn hàng từ 300k.'
    },
    {
        id: 6,
        code: 'BLACKFRI',
        value: '50k',
        condition: 'Đơn từ 1tr',
        created: '25/11/2024',
        startDate: '25/11/2024',
        expiry: '02/12/2024',
        status: 'expiring',
        statusText: 'Sắp hết hạn',
        maxUses: '30',
        description: 'Black Friday - Giảm 50k cho đơn hàng từ 1tr, số lượng có hạn.'
    }
];

// ================================================================
// KHỞI TẠO
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    const storedData = localStorage.getItem('coupons_data');
    if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.length > 0) {
            coupons = parsedData;
            sampleCoupons = [...parsedData];
        } else {
            coupons = [...defaultCoupons];
            sampleCoupons = [...defaultCoupons];
            localStorage.setItem('coupons_data', JSON.stringify(coupons));
        }
    } else {
        coupons = [...defaultCoupons];
        sampleCoupons = [...defaultCoupons];
        localStorage.setItem('coupons_data', JSON.stringify(coupons));
    }
    
    renderStats();
    renderCoupons();
    
    document.getElementById('btn-filter').addEventListener('click', applyFilters);
    document.getElementById('btnConfirmDelete').addEventListener('click', confirmDelete);
    document.getElementById('btnUpdateCoupon').addEventListener('click', updateCoupon);
});

// ================================================================
// RENDER STATS
// ================================================================
function renderStats() {
    const total = coupons.length;
    const active = coupons.filter(c => c.status === 'active').length;
    const expiring = coupons.filter(c => c.status === 'expiring').length;
    const expired = coupons.filter(c => c.status === 'expired').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-active').innerText = active;
    document.getElementById('stat-expiring').innerText = expiring;
    document.getElementById('stat-expired').innerText = expired;
}

// ================================================================
// RENDER COUPONS
// ================================================================
function renderCoupons() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = coupons.slice(start, end);

    const tbody = document.getElementById('coupon-list');
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">Không có mã giảm giá nào.</td></tr>`;
        return;
    }

    const statusMap = {
        'active': 'badge-status-active',
        'expiring': 'badge-status-expiring',
        'expired': 'badge-status-expired'
    };
    const statusTextMap = {
        'active': 'Đang hoạt động',
        'expiring': 'Sắp hết hạn',
        'expired': 'Đã hết hạn'
    };

    pageData.forEach(c => {
        const statusClass = statusMap[c.status] || 'badge-status-expired';
        
        tbody.innerHTML += `
            <tr>
                <td class="ps-4"><span class="coupon-code">${c.code}</span></td>
                <td class="coupon-value">${c.value}</td>
                <td>${c.condition}</td>
                <td>${c.created}</td>
                <td>${c.expiry}</td>
                <td><span class="badge-status ${statusClass}">${statusTextMap[c.status] || c.statusText}</span></td>
                <td class="pe-4">
                    <div class="d-flex justify-content-end gap-1">
                        <button class="btn-action-icon text-primary" onclick="viewCoupon('${c.code}')" title="Xem chi tiết">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn-action-icon text-success" onclick="openEditModal('${c.code}')" title="Chỉnh sửa">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn-action-icon text-danger" onclick="openDeleteModal('${c.code}')" title="Xóa">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById('pagination-info').innerText = `Hiển thị ${start + 1}-${Math.min(end, coupons.length)} của ${coupons.length} mã`;
    
    const totalPages = Math.ceil(coupons.length / ITEMS_PER_PAGE);
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

function changePage(page) {
    currentPage = page;
    renderCoupons();
}

// ================================================================
// FILTERS
// ================================================================
function applyFilters() {
    const searchTerm = document.getElementById('search-coupon').value.toLowerCase().trim();
    const statusFilter = document.getElementById('filter-status').value;
    const timeFilter = document.getElementById('filter-time').value;
    const sortFilter = document.getElementById('filter-sort').value;

    let filtered = sampleCoupons.filter(c => {
        const matchCode = c.code.toLowerCase().includes(searchTerm);
        const matchCondition = c.condition.toLowerCase().includes(searchTerm);
        const matchSearch = matchCode || matchCondition;
        const matchStatus = statusFilter === '' || c.status === statusFilter;
        
        let matchTime = true;
        if (timeFilter !== '') {
            const days = parseInt(timeFilter);
            const now = new Date();
            const createdDate = new Date(c.created.split('/').reverse().join('-'));
            const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            if (timeFilter === '7') matchTime = diffDays <= 7;
            else if (timeFilter === '30') matchTime = diffDays <= 30;
            else if (timeFilter === '90') matchTime = diffDays <= 90;
        }
        
        return matchSearch && matchStatus && matchTime;
    });

    if (sortFilter === 'newest') {
        filtered.sort((a, b) => {
            const dateA = new Date(a.created.split('/').reverse().join('-'));
            const dateB = new Date(b.created.split('/').reverse().join('-'));
            return dateB - dateA;
        });
    } else if (sortFilter === 'oldest') {
        filtered.sort((a, b) => {
            const dateA = new Date(a.created.split('/').reverse().join('-'));
            const dateB = new Date(b.created.split('/').reverse().join('-'));
            return dateA - dateB;
        });
    } else if (sortFilter === 'value') {
        filtered.sort((a, b) => {
            const valA = parseInt(a.value) || 0;
            const valB = parseInt(b.value) || 0;
            return valB - valA;
        });
    }

    coupons = filtered;
    currentPage = 1;
    renderCoupons();
    renderStats();
}

// ================================================================
// MỞ MODAL THÊM MÃ GIẢM GIÁ
// ================================================================
function openAddCouponModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('couponStartDate').value = today;
    const future = new Date();
    future.setDate(future.getDate() + 30);
    document.getElementById('couponEndDate').value = future.toISOString().split('T')[0];
    
    const modal = new bootstrap.Modal(document.getElementById('createCouponModal'));
    modal.show();
}

// ================================================================
// LƯU MÃ GIẢM GIÁ (Từ Modal)
// ================================================================
document.getElementById('btnSaveCoupon')?.addEventListener('click', function() {
    const code = document.getElementById('couponCode').value.trim();
    const percent = document.getElementById('couponPercent').value.trim();
    const minOrder = document.getElementById('couponMinOrder').value.trim() || 'Không có';
    const maxUses = document.getElementById('couponMaxUses').value.trim() || 'Không giới hạn';
    const startDate = document.getElementById('couponStartDate').value;
    const endDate = document.getElementById('couponEndDate').value;
    const status = document.getElementById('couponStatus').value;
    const statusText = status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng';

    if (!code) {
        alert('Vui lòng nhập mã giảm giá!');
        document.getElementById('couponCode').focus();
        return;
    }
    if (!percent || parseFloat(percent) <= 0 || parseFloat(percent) > 100) {
        alert('Vui lòng nhập phần trăm giảm hợp lệ (1-100)!');
        document.getElementById('couponPercent').focus();
        return;
    }
    if (!startDate || !endDate) {
        alert('Vui lòng chọn ngày bắt đầu và ngày hết hạn!');
        return;
    }

    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Đang lưu...';
    btn.disabled = true;

    setTimeout(() => {
        const newCoupon = {
            id: Date.now(),
            code: code,
            value: percent + '%',
            condition: minOrder !== 'Không có' ? `Đơn tối thiểu ${parseInt(minOrder).toLocaleString('vi-VN')}đ` : 'Không có điều kiện',
            created: new Date().toLocaleDateString('vi-VN'),
            startDate: new Date(startDate).toLocaleDateString('vi-VN'),
            expiry: new Date(endDate).toLocaleDateString('vi-VN'),
            status: status,
            statusText: statusText,
            maxUses: maxUses,
            description: `Mã giảm giá ${code} - Giảm ${percent}% cho đơn hàng.`
        };

        coupons.push(newCoupon);
        sampleCoupons.push(newCoupon);
        localStorage.setItem('coupons_data', JSON.stringify(coupons));

        console.log('Mã giảm giá mới:', newCoupon);
        alert(`Đã thêm mã giảm giá "${code}" thành công!\n\n Giảm: ${percent}%\n Hạn: ${new Date(startDate).toLocaleDateString('vi-VN')} → ${new Date(endDate).toLocaleDateString('vi-VN')}`);

        document.getElementById('createCouponForm').reset();

        const modal = bootstrap.Modal.getInstance(document.getElementById('createCouponModal'));
        modal.hide();

        btn.innerHTML = originalText;
        btn.disabled = false;

        renderCoupons();
        renderStats();
    }, 1500);
});

// ── Reset form khi đóng modal ──
document.getElementById('createCouponModal')?.addEventListener('hidden.bs.modal', function() {
    document.getElementById('createCouponForm').reset();
});

// ================================================================
// XEM CHI TIẾT MÃ GIẢM GIÁ (Modal)
// ================================================================
function viewCoupon(code) {
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) {
        alert('Không tìm thấy mã giảm giá!');
        return;
    }

    document.getElementById('detailCode').innerText = coupon.code;
    document.getElementById('detailValue').innerText = coupon.value;
    document.getElementById('detailCondition').innerText = coupon.condition || 'Không có điều kiện';
    document.getElementById('detailUses').innerText = coupon.maxUses || 'Không giới hạn';
    document.getElementById('detailCreated').innerText = coupon.created || '--/--/----';
    document.getElementById('detailStart').innerText = coupon.startDate || coupon.created || '--/--/----';
    document.getElementById('detailEnd').innerText = coupon.expiry || '--/--/----';

    const statusMap = {
        'active': { text: 'Đang hoạt động', class: 'badge-status-active' },
        'expiring': { text: 'Sắp hết hạn', class: 'badge-status-expiring' },
        'expired': { text: 'Đã hết hạn', class: 'badge-status-expired' }
    };
    const statusInfo = statusMap[coupon.status] || statusMap['expired'];
    const statusEl = document.getElementById('detailStatus');
    statusEl.innerText = statusInfo.text;
    statusEl.className = `badge-status ${statusInfo.class}`;

    const descEl = document.getElementById('detailDescription');
    descEl.innerText = coupon.description || `Mã giảm giá ${coupon.code} - Giảm ${coupon.value} cho đơn hàng đáp ứng điều kiện.`;

    const modal = new bootstrap.Modal(document.getElementById('couponDetailModal'));
    modal.show();
}

// ================================================================
// MỞ MODAL CHỈNH SỬA
// ================================================================
function openEditModal(code) {
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) {
        alert('Không tìm thấy mã giảm giá!');
        return;
    }

    currentEditCode = code;
    document.getElementById('editCode').value = coupon.code;
    document.getElementById('editValue').value = coupon.value;
    document.getElementById('editCondition').value = coupon.condition || '';
    document.getElementById('editMaxUses').value = coupon.maxUses || '';
    document.getElementById('editStatus').value = coupon.status;

    const modal = new bootstrap.Modal(document.getElementById('editCouponModal'));
    modal.show();
}

// ================================================================
// CẬP NHẬT MÃ GIẢM GIÁ
// ================================================================
function updateCoupon() {
    const code = document.getElementById('editCode').value;
    const value = document.getElementById('editValue').value;
    const condition = document.getElementById('editCondition').value;
    const status = document.getElementById('editStatus').value;
    const maxUses = document.getElementById('editMaxUses').value;

    const index = coupons.findIndex(c => c.code === code);
    if (index === -1) {
        alert('Không tìm thấy mã giảm giá!');
        return;
    }

    const statusTextMap = {
        'active': 'Đang hoạt động',
        'expiring': 'Sắp hết hạn',
        'expired': 'Đã hết hạn'
    };

    coupons[index].value = value;
    coupons[index].condition = condition;
    coupons[index].status = status;
    coupons[index].statusText = statusTextMap[status];
    coupons[index].maxUses = maxUses;

    const sampleIndex = sampleCoupons.findIndex(c => c.code === code);
    if (sampleIndex !== -1) {
        sampleCoupons[sampleIndex] = { ...coupons[index] };
    }

    localStorage.setItem('coupons_data', JSON.stringify(coupons));

    const modal = bootstrap.Modal.getInstance(document.getElementById('editCouponModal'));
    modal.hide();

    renderCoupons();
    renderStats();

    alert(`Đã cập nhật mã giảm giá "${code}" thành công!`);
}

// ================================================================
// DELETE MODAL
// ================================================================
function openDeleteModal(code) {
    currentDeleteCode = code;
    document.getElementById('couponCodeDisplay').innerText = code;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

function confirmDelete() {
    if (currentDeleteCode) {
        coupons = coupons.filter(c => c.code !== currentDeleteCode);
        const sampleIndex = sampleCoupons.findIndex(c => c.code === currentDeleteCode);
        if (sampleIndex !== -1) {
            sampleCoupons.splice(sampleIndex, 1);
        }
        
        localStorage.setItem('coupons_data', JSON.stringify(coupons));
        
        renderCoupons();
        renderStats();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        
        alert(`Đã xóa mã giảm giá: ${currentDeleteCode}`);
        currentDeleteCode = '';
    }
}