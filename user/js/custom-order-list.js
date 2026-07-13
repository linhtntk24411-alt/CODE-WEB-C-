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

        // // 1. XỬ LÝ CLICK NÚT XEM CHI TIẾT (Con mắt)
        // if (e.target.closest('.view-btn') || (e.target.classList.contains('material-symbols-outlined') && e.target.textContent === 'visibility')) {
        //     // Chuyển hướng sang giao diện chi tiết kèm ID đơn hàng trên thanh URL
        //     window.location.href = `custom-order-request.html?id=${encodeURIComponent(reqId)}&step=3`;
        // }
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
                        
                        // Tính toán lại thanh số liệu Bento Sidebar & vẽ lại bảng
                        updateStatistics(allItems);
                        
                        const totalPagesAfterDelete = Math.ceil(filteredItems.length / itemsPerPage) || 1;
                        if (currentPage > totalPagesAfterDelete) {
                            currentPage = totalPagesAfterDelete;
                        }
                        
                        renderTable(filteredItems, currentPage);
                        renderPagination(filteredItems.length, currentPage);
                        
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
                    
                    // Tính toán lại thanh số liệu Bento Sidebar & vẽ lại bảng
                    updateStatistics(allItems);
                    
                    const totalPagesAfterDelete = Math.ceil(filteredItems.length / itemsPerPage) || 1;
                    if (currentPage > totalPagesAfterDelete) {
                        currentPage = totalPagesAfterDelete;
                    }
                    
                    renderTable(filteredItems, currentPage);
                    renderPagination(filteredItems.length, currentPage);
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