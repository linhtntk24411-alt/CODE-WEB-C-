// Biến toàn cục quản lý dữ liệu
let allItems = [];          // Lưu trữ gốc từ JSON
let filteredItems = [];     // Lưu trữ sau khi qua bộ lọc
let currentPage = 1;        // Trang hiện tại
const itemsPerPage = 4;     // Số mục hiển thị trên mỗi trang

document.addEventListener("DOMContentLoaded", () => {
    fetch('../data/custom-order-list.json')
        .then(response => {
            if (!response.ok) throw new Error("Không thể nạp được file cấu hình JSON");
            return response.json();
        })
        .then(data => {
            allItems = data;
            filteredItems = data; 
            // 2. Đọc thêm dữ liệu mới được tạo từ localStorage (nếu có)
            const localData = JSON.parse(localStorage.getItem('custom_orders_cache')) || [];
            
            // 3. Gộp dữ liệu mới tạo lên trước dữ liệu file JSON gốc
            // Sử dụng toán tử spread (...) để nối 2 mảng lại với nhau
            allItems = [...localData, ...data]; // <-- ĐÃ ĐỔI THÀNH data
            filteredItems = allItems;
            
            updateStatistics(allItems); // Luôn tính toán số liệu trên tổng mảng gốc
            initStatusFilter();         // Khởi động lắng nghe sự kiện lọc
            initTableActions();
            goToPage(1);                // Về trang 1
        })
        
        .catch(error => {
            console.error("Lỗi hệ thống:", error);
            document.getElementById('request-table-body').innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Vui lòng chạy ứng dụng trên môi trường Live Server để đồng bộ dữ liệu JSON.</td></tr>`;
        });
    const createBtn = document.querySelector('.btn-primary');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
            // Thay đường dẫn dưới đây bằng tên file giao diện tạo yêu cầu của bạn
                window.location.href = '../html/custom-order-request.html'; 
            });
        }
    
});

// Hàm xử lý sự kiện lọc trạng thái đơn hàng
function initStatusFilter() {
    const filterSelect = document.getElementById('status-filter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', (e) => {
        const selectedStatus = e.target.value;
        
        if (selectedStatus === 'all') {
            filteredItems = allItems;
        } else {
            filteredItems = allItems.filter(item => item.statusClass === selectedStatus);
        }
        goToPage(1); // Reset quay về trang 1 khi lọc kết quả mới
    });
}

function updateStatistics(items) {
    const totalRequests = items.length;
    const processingRequests = items.filter(item => 
        item.statusClass === 'status-pending' || 
        item.statusClass === 'status-quoted' || 
        item.statusClass === 'status-processing'
    ).length;

    const totalStatEl = document.querySelector('.total-req .stat-number');
    const processingStatEl = document.querySelector('.processing-req .stat-number');
    
    if (totalStatEl) totalStatEl.textContent = totalRequests < 10 ? `0${totalRequests}` : totalRequests;
    if (processingStatEl) processingStatEl.textContent = processingRequests < 10 ? `0${processingRequests}` : processingRequests;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
    
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    currentPage = page;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    renderTableData(paginatedItems);
    renderPaginationControls(totalPages);
    
    const paginationInfoEl = document.querySelector('.pagination-info');
    if (paginationInfoEl) {
        paginationInfoEl.textContent = `Hiển thị ${paginatedItems.length} trên ${filteredItems.length} kết quả lọc được`;
    }
}

function renderTableData(items) {
    const tableBody = document.getElementById('request-table-body');
    tableBody.innerHTML = ''; 
    const localReviews = JSON.parse(localStorage.getItem('my_reviews_cache')) || [];

    if (items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color: var(--text-outline);">Không tìm thấy yêu cầu nào thuộc danh mục trạng thái này.</td></tr>`;
        return;
    }

    items.forEach(item => {
        let actionHTML = '';
        if (item.actionType === 'view-delete') {
            actionHTML = `
                <button class="action-icon-btn view-btn"><span class="material-symbols-outlined">visibility</span></button>
                <button class="action-icon-btn delete-btn"><span class="material-symbols-outlined">delete</span></button>
            `;
        } else if (item.actionType === 'quote-btn') {
            actionHTML = `<button class="table-btn btn-table-quote">Xem báo giá</button>`;
        } else if (item.actionType === 'track-btn') {
            // Thay thế inline style bằng class .btn-track-location đã tạo trong CSS
            actionHTML = `<button class="action-icon-btn btn-track-location"><span class="material-symbols-outlined">location_on</span></button>`;
        // THAY THẾ ĐOẠN ELSE IF TRÊN THÀNH ĐOẠN NÀY:
        } else if (item.actionType === 'review-btn') {
            // Kiểm tra xem ID của yêu cầu này đã xuất hiện trong cache đánh giá chưa
            const isReviewed = localReviews.some(rev => {
                const cleanRevId = String(rev.orderId || rev.id).replace('#', '').trim().toUpperCase();
                const cleanItemId = String(item.id).replace('#', '').trim().toUpperCase();
                return cleanRevId === cleanItemId;
            });

            // Nếu đã đánh giá thì hiển thị chữ "Đã đánh giá" và thêm thuộc tính disabled để khóa nút
            if (isReviewed) {
                actionHTML = `<button class="table-btn btn-table-review" disabled style="background-color: rgb(148, 5, 5); color: #ffffff; cursor: not-allowed;">Đã đánh giá</button>`;
            } else {
                actionHTML = `<button class="table-btn btn-table-review">Đánh giá</button>`;
            }
        }

        const rowHTML = `
            <tr>
                <td class="req-id">${item.id}</td>
                <td>
                    <div class="product-cell">
                        <img src="${item.image}" alt="${item.name}" class="product-img">
                        <div>
                            <div class="product-name">${item.name}</div>
                            <div class="product-size">Kích thước: ${item.size}</div>
                        </div>
                    </div>
                </td>
                <td class="text-center">${item.date}</td>
                <td class="text-center">
                    <span class="status-badge ${item.statusClass}">${item.statusText}</span>
                </td>
                <td class="text-right">${actionHTML}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowHTML);
    });

    addTableHoverEffects();
}

function renderPaginationControls(totalPages) {
    const container = document.querySelector('.pagination-buttons');
    if (!container) return;
    
    container.innerHTML = ''; 

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-nav';
    prevBtn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-num ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => goToPage(i));
        container.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-nav';
    nextBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    container.appendChild(nextBtn);
}

function addTableHoverEffects() {
    const rows = document.querySelectorAll('.data-table tbody tr');
    rows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.transform = 'translateY(-2px)';
            row.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
        });
        row.addEventListener('mouseleave', () => {
            row.style.transform = 'translateY(0)';
            row.style.boxShadow = 'none';
        });
    });
}
function initTableActions() {
    const tableBody = document.getElementById('request-table-body');
    if (!tableBody) return;

    tableBody.addEventListener('click', (e) => {
        // Xác định dòng <tr> chứa nút bấm để lấy Mã yêu cầu
        const targetRow = e.target.closest('tr');
        if (!targetRow) return;
        
        const reqId = targetRow.querySelector('.req-id').textContent.trim();

        // 1. XỬ LÝ CLICK NÚT XEM CHI TIẾT (Con mắt)
        if (e.target.closest('.view-btn') || (e.target.classList.contains('material-symbols-outlined') && e.target.textContent === 'visibility')) {
            showEstimatedQuote(reqId);
        }
        if (e.target.classList.contains('btn-table-quote')) {
            // Chuyển hướng sang giao diện custom-order-detail.html kèm theo tham số ID đơn hàng
            window.location.href = `custom-order-detail.html?id=${encodeURIComponent(reqId)}`;
        }

        // 2. XỬ LÝ CLICK NÚT XÓA YÊU CẦU (Thùng rác)
        if (e.target.closest('.delete-btn') || (e.target.classList.contains('material-symbols-outlined') && e.target.textContent === 'delete')) {
            if (typeof window.ariiConfirm === 'function') {
                window.ariiConfirm(`Bạn có chắc chắn muốn xóa yêu cầu thiết kế ${reqId} không?`, {
                    onConfirm: () => {
                        // Xóa mục ra khỏi 2 mảng dữ liệu (mảng gốc và mảng đang lọc)
                        allItems = allItems.filter(item => item.id !== reqId);
                        filteredItems = filteredItems.filter(item => item.id !== reqId);
                        
                        // Cập nhật lại localStorage
                        try {
                            const localData = JSON.parse(localStorage.getItem('custom_orders_cache')) || [];
                            const updatedLocal = localData.filter(item => item.id !== reqId);
                            localStorage.setItem('custom_orders_cache', JSON.stringify(updatedLocal));
                        } catch(e) {
                            console.error(e);
                        }

                        // Tính toán lại thanh số liệu Bento Sidebar & vẽ lại bảng
                        updateStatistics(allItems);
                        
                        const totalPagesAfterDelete = Math.ceil(filteredItems.length / itemsPerPage) || 1;
                        if (currentPage > totalPagesAfterDelete) {
                            currentPage = totalPagesAfterDelete;
                        }
                        
                        goToPage(currentPage);
                        
                        if (typeof window.ariiToast === 'function') {
                            window.ariiToast(`Đã xóa yêu cầu thiết kế ${reqId}`, 'success');
                        } else {
                            alert(`Đã xóa yêu cầu thiết kế ${reqId}`);
                        }
                    }
                });
            } else {
                const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa yêu cầu thiết kế ${reqId} không?`);
                if (confirmDelete) {
                    // Xóa mục ra khỏi 2 mảng dữ liệu (mảng gốc và mảng đang lọc)
                    allItems = allItems.filter(item => item.id !== reqId);
                    filteredItems = filteredItems.filter(item => item.id !== reqId);
                    
                    // Cập nhật lại localStorage
                    try {
                        const localData = JSON.parse(localStorage.getItem('custom_orders_cache')) || [];
                        const updatedLocal = localData.filter(item => item.id !== reqId);
                        localStorage.setItem('custom_orders_cache', JSON.stringify(updatedLocal));
                    } catch(e) {
                        console.error(e);
                    }

                    // Tính toán lại thanh số liệu Bento Sidebar & vẽ lại bảng
                    updateStatistics(allItems);
                    
                    const totalPagesAfterDelete = Math.ceil(filteredItems.length / itemsPerPage) || 1;
                    if (currentPage > totalPagesAfterDelete) {
                        currentPage = totalPagesAfterDelete;
                    }
                    
                    goToPage(currentPage);
                    alert(`Đã xóa yêu cầu thiết kế ${reqId}`);
                }
            }
        }
        if (e.target.classList.contains('btn-table-review')) {
            // Chuyển hướng sang trang review.html kèm theo tham số id của yêu cầu thiết kế trên URL
            window.location.href = `review.html?id=${encodeURIComponent(reqId)}&type=custom`;
        }
    });
}

// ===== THÊM HÀM INITLOGOUT =====
function initLogout() {
    const logoutTrigger = document.getElementById('logoutTrigger');
    const logoutModal = document.getElementById('modalLogout');
    const logoutOverlay = document.getElementById('modalOverlay');
    const cancelBtn = document.querySelector('[data-close="modalLogout"]');
    const confirmBtn = document.getElementById('confirmLogout');

    if (!logoutTrigger || !logoutModal || !logoutOverlay) {
        console.warn('Logout elements not found');
        return;
    }

    // Ngăn chặn hành vi mặc định của thẻ a
    logoutTrigger.href = 'javascript:void(0)';

    // Mở modal
    logoutTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        logoutOverlay.classList.add('active');
        logoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Đóng modal
    function closeLogoutModal() {
        logoutOverlay.classList.remove('active');
        logoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (cancelBtn) cancelBtn.addEventListener('click', closeLogoutModal);
    logoutOverlay.addEventListener('click', closeLogoutModal);

    // Xác nhận đăng xuất
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            this.textContent = 'Đang xử lý...';
            this.disabled = true;
            setTimeout(() => {
                localStorage.removeItem('userEmail');
                closeLogoutModal();
                window.location.href = 'login.html';
            }, 800);
        });
    }

    console.log('Logout initialized successfully.');
}

// Hàm hiển thị Popup báo giá dự kiến khi bấm vào con mắt
async function showEstimatedQuote(reqId) {
    // 1. Tìm thông tin cơ bản của yêu cầu trong allItems
    const item = allItems.find(x => x.id === reqId);
    if (!item) return;

    // 2. Thiết lập dữ liệu mặc định dự phòng
    let details = {
        designFee: 150000,
        beadsFee: 320000,
        toolsFee: 85000,
        total: 555000,
        beadType: "Midi 5.0mm (Tiêu chuẩn)",
        complexity: "Trung bình"
    };

    try {
        const response = await fetch('../data/custom-order-detail.json');
        if (response.ok) {
            const data = await response.json();
            if (data[reqId]) {
                details = data[reqId];
            } else {
                // Tính toán thông minh dựa trên kích thước nếu không có sẵn trong JSON
                details = data["default"] || details;
                if (item.size) {
                    const match = item.size.match(/(\d+)x(\d+)/);
                    if (match) {
                        const w = parseInt(match[1]);
                        const h = parseInt(match[2]);
                        const area = w * h;
                        if (area <= 400) { // 20x20
                            details = data["#URII-9811"] || details;
                        } else if (area <= 900) { // 30x30
                            details = data["#URII-9541"] || details;
                        }
                    }
                }
            }
        }
    } catch(err) {
        console.error("Lỗi khi tải chi tiết báo giá:", err);
    }

    // Helper format tiền tệ
    const formatPrice = (val) => {
        return Number(val).toLocaleString('vi-VN') + 'đ';
    };

    // 3. Tạo hoặc lấy phần tử modal từ DOM
    let modalOverlay = document.getElementById('quoteModalOverlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'quoteModalOverlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal active" id="modalQuoteDetail" style="display: block; opacity: 1; transform: scale(1); max-width: 500px; margin: 30px auto; z-index: 10001;">
                <div class="modal-content" style="padding: 24px;">
                    <div class="modal-icon" style="background-color: rgba(132, 0, 1, 0.1); color: #840001; margin: 0 auto 16px; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <span class="material-symbols-outlined" style="font-size: 32px;">payments</span>
                    </div>
                    <h3 class="modal-title" id="quoteModalTitle" style="margin-bottom: 8px; text-align: center; font-size: 20px; font-weight: 700; color: #840001;">Báo Giá Dự Kiến</h3>
                    <p style="font-size: 13px; color: #666; margin-bottom: 16px; text-align: center;">Mã yêu cầu: <strong id="quoteModalReqId">#ID</strong></p>
                    
                    <div style="background-color: #fcf8f8; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: left; border: 1px solid #f3e5e5;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                            <span style="color: #666;">Chi phí thiết kế bản vẽ (Map):</span>
                            <strong id="quoteModalDesign" style="color: #333;">0đ</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                            <span style="color: #666;">Hạt nhựa phối màu (${details.beadType}):</span>
                            <strong id="quoteModalBeads" style="color: #333;">0đ</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; border-bottom: 1px dashed #e0d0d0; padding-bottom: 10px;">
                            <span style="color: #666;">Khung Pegboard & Dụng cụ:</span>
                            <strong id="quoteModalTools" style="color: #333;">0đ</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700;">
                            <span style="color: #840001;">Tổng cộng dự kiến:</span>
                            <strong id="quoteModalTotal" style="color: #840001; font-size: 18px;">0đ</strong>
                        </div>
                    </div>

                    <div style="font-size: 12px; color: #777; line-height: 1.5; margin-bottom: 20px; background-color: #fdfdfd; padding: 10px; border-radius: 6px; border: 1px solid #eee; text-align: left;">
                        💡 <strong>Lưu ý:</strong> Báo giá này dựa trên kích thước thiết kế yêu cầu là <strong id="modalQuoteSize">${item.size || 'tiêu chuẩn'}</strong>. Giá chính thức sẽ được quản trị viên duyệt và cập nhật trong vòng 24h.
                    </div>

                    <div class="modal-actions" style="justify-content: center; display: flex; gap: 12px;">
                        <button class="modal-btn modal-btn--cancel" id="closeQuoteModalBtn" style="min-width: 120px; background-color: #840001; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Đóng</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        const closeBtn = modalOverlay.querySelector('#closeQuoteModalBtn');
        closeBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            modalOverlay.classList.remove('active');
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
                modalOverlay.classList.remove('active');
            }
        });
    }

    // 4. Cập nhật dữ liệu vào các thẻ
    modalOverlay.querySelector('#quoteModalReqId').textContent = reqId;
    modalOverlay.querySelector('#quoteModalDesign').textContent = formatPrice(details.designFee);
    modalOverlay.querySelector('#quoteModalBeads').textContent = formatPrice(details.beadsFee);
    modalOverlay.querySelector('#quoteModalTools').textContent = formatPrice(details.toolsFee);
    modalOverlay.querySelector('#quoteModalTotal').textContent = formatPrice(details.total);
    modalOverlay.querySelector('#modalQuoteSize').textContent = item.size || 'tiêu chuẩn';

    // 5. Hiển thị modal
    modalOverlay.style.display = 'flex';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100vw';
    modalOverlay.style.height = '100vh';
    modalOverlay.style.zIndex = '9999';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalOverlay.classList.add('active');
}