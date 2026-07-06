// ================================================================
// JS QUẢN LÝ BÌNH LUẬN (Đơn giản hóa logic & Màu sắc)
// ================================================================

let allComments = [];
let currentReviewPage = 1;
let currentBlogPage = 1;
const ITEMS_PER_PAGE = 4;

// Màu sắc cho các thẻ trạng thái
const statusMap = {
    'approved': { text: 'Đã duyệt / Đã trả lời', class: 'badge-status-approved' },
    'pending': { text: 'Chờ duyệt / Chưa trả lời', class: 'badge-status-pending' },
    'flagged': { text: 'Vi phạm', class: 'badge-status-flagged' }
};

// ================================================================
// ĐỌC DỮ LIỆU TỪ JSON
// ================================================================
async function loadCommentsFromJson() {
    try {
        const response = await fetch('../data/comments.json');
        if (!response.ok) throw new Error('Không tìm thấy file comments.json');
        allComments = await response.json();
        renderStats();
        renderReviews();
        renderBlogs();
    } catch (error) {
        console.error('Lỗi load dữ liệu:', error);
    }
}

// ================================================================
// RENDER STATS
// ================================================================
function renderStats() {
    document.getElementById('stat-total').innerText = allComments.length;
    document.getElementById('stat-approved').innerText = allComments.filter(c => c.status === 'approved').length;
    document.getElementById('stat-pending').innerText = allComments.filter(c => c.status === 'pending').length;
    document.getElementById('stat-flagged').innerText = allComments.filter(c => c.status === 'flagged').length;
}

// ================================================================
// RENDER BẢNG 1: ĐÁNH GIÁ SẢN PHẨM & ĐƠN HÀNG
// ================================================================
function renderReviews() {
    let reviews = allComments.filter(c => c.targetType === 'product' || c.targetType === 'order');
    
    const keyword = document.getElementById('search-keyword').value.toLowerCase().trim();
    const type = document.getElementById('filter-type').value;
    const status = document.getElementById('filter-status').value;

    if (keyword) {
        reviews = reviews.filter(c => c.content.toLowerCase().includes(keyword) || c.authorName.toLowerCase().includes(keyword));
    }
    if (type && (type === 'product' || type === 'order')) {
        reviews = reviews.filter(c => c.targetType === type);
    }
    if (status) {
        reviews = reviews.filter(c => c.status === status);
    }

    const start = (currentReviewPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = reviews.slice(start, end);

    const tbody = document.getElementById('reviews-list');
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">Không có đánh giá nào.</td></tr>`;
        return;
    }

    pageData.forEach(c => {
        const s = statusMap[c.status] || { text: c.status, class: 'badge-status-pending' };
        const isHidden = c.status === 'hidden';

        tbody.innerHTML += `
            <tr>
                <td class="ps-4">
                    <div class="comment-content" title="${c.content}">${c.content}</div>
                    <div class="text-muted small mt-1">Trên: <strong>${c.targetName}</strong></div>
                </td>
                <td>
                    <div class="author-info">
                        <span class="author-avatar">${c.authorAvatar}</span>
                        <span class="author-name">${c.authorName}</span>
                    </div>
                </td>
                <td>${c.targetType === 'product' ? 'Sản phẩm' : 'Đơn hàng'}</td>
                <td>${c.date}</td>
                <td><span class="badge-status ${s.class}">${s.text}</span></td>
                <td class="pe-4">
                    <div class="action-btn-group">
                        <!-- Nút con mắt: Mắt gạch = Đã ẩn, Mắt thường = Chưa ẩn -->
                        <button class="btn-action-icon ${isHidden ? 'text-danger' : 'text-secondary'}" 
                                onclick="toggleHide('${c.id}')" 
                                title="${isHidden ? 'Hiện lại' : 'Tạm ẩn'}">
                            <i class="bi ${isHidden ? 'bi-eye-slash' : 'bi-eye'}"></i>
                        </button>
                        <!-- Nút bút chì: Đổi trạng thái -->
                        <div class="dropdown d-inline-block">
                            <button class="btn-action-icon" data-bs-toggle="dropdown">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item ${c.status === 'approved' ? 'active' : ''}" href="#" onclick="changeReviewStatus('${c.id}', 'approved')">Đã trả lời</a></li>
                                <li><a class="dropdown-item ${c.status === 'pending' ? 'active' : ''}" href="#" onclick="changeReviewStatus('${c.id}', 'pending')">Chưa trả lời</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="changeReviewStatus('${c.id}', 'flagged')">Vi phạm</a></li>
                            </ul>
                        </div>
                        <!-- Nút xóa -->
                        <button class="btn-action-icon text-danger" onclick="deleteComment('${c.id}')"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById('reviews-pagination-info').innerText = `Hiển thị ${start + 1}-${Math.min(end, reviews.length)} trên tổng số ${reviews.length} đánh giá`;
    
    const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
    const controls = document.getElementById('reviews-pagination');
    controls.innerHTML = '';
    if (totalPages > 1) {
        controls.innerHTML += `<li class="page-item ${currentReviewPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeReviewPage(${currentReviewPage - 1})">«</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            controls.innerHTML += `<li class="page-item ${currentReviewPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changeReviewPage(${i})">${i}</a></li>`;
        }
        controls.innerHTML += `<li class="page-item ${currentReviewPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeReviewPage(${currentReviewPage + 1})">»</a></li>`;
    }
}

// ================================================================
// RENDER BẢNG 2: BÌNH LUẬN BLOG
// ================================================================
function renderBlogs() {
    let blogs = allComments.filter(c => c.targetType === 'blog');

    const keyword = document.getElementById('search-keyword').value.toLowerCase().trim();
    const type = document.getElementById('filter-type').value;
    const status = document.getElementById('filter-status').value;

    if (keyword) {
        blogs = blogs.filter(c => c.content.toLowerCase().includes(keyword) || c.authorName.toLowerCase().includes(keyword));
    }
    if (type && type === 'blog') {
        blogs = blogs.filter(c => c.targetType === type);
    }
    if (status) {
        blogs = blogs.filter(c => c.status === status);
    }

    const start = (currentBlogPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = blogs.slice(start, end);

    const tbody = document.getElementById('blogs-list');
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">Không có bình luận blog nào.</td></tr>`;
        return;
    }

    pageData.forEach(c => {
        const s = statusMap[c.status] || { text: c.status, class: 'badge-status-pending' };
        const isHidden = c.status === 'hidden';

        tbody.innerHTML += `
            <tr>
                <td class="ps-4">
                    <div class="comment-content" title="${c.content}">${c.content}</div>
                    <div class="text-muted small mt-1">Trên blog: <strong>${c.targetName}</strong></div>
                </td>
                <td>
                    <div class="author-info">
                        <span class="author-avatar">${c.authorAvatar}</span>
                        <span class="author-name">${c.authorName}</span>
                    </div>
                </td>
                <td>${c.targetName}</td>
                <td>${c.date}</td>
                <td><span class="badge-status ${s.class}">${s.text}</span></td>
                <td class="pe-4">
                    <div class="action-btn-group">
                        <button class="btn-action-icon ${isHidden ? 'text-danger' : 'text-secondary'}" 
                                onclick="toggleHide('${c.id}')" 
                                title="${isHidden ? 'Hiện lại' : 'Tạm ẩn'}">
                            <i class="bi ${isHidden ? 'bi-eye-slash' : 'bi-eye'}"></i>
                        </button>
                        <div class="dropdown d-inline-block">
                            <button class="btn-action-icon" data-bs-toggle="dropdown">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item ${c.status === 'approved' ? 'active' : ''}" href="#" onclick="changeBlogStatus('${c.id}', 'approved')">Đã duyệt</a></li>
                                <li><a class="dropdown-item ${c.status === 'pending' ? 'active' : ''}" href="#" onclick="changeBlogStatus('${c.id}', 'pending')">Chờ duyệt</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="changeBlogStatus('${c.id}', 'flagged')">Vi phạm</a></li>
                            </ul>
                        </div>
                        <button class="btn-action-icon text-danger" onclick="deleteComment('${c.id}')"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById('blogs-pagination-info').innerText = `Hiển thị ${start + 1}-${Math.min(end, blogs.length)} trên tổng số ${blogs.length} bình luận`;
    
    const totalPages = Math.ceil(blogs.length / ITEMS_PER_PAGE);
    const controls = document.getElementById('blogs-pagination');
    controls.innerHTML = '';
    if (totalPages > 1) {
        controls.innerHTML += `<li class="page-item ${currentBlogPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeBlogPage(${currentBlogPage - 1})">«</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            controls.innerHTML += `<li class="page-item ${currentBlogPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changeBlogPage(${i})">${i}</a></li>`;
        }
        controls.innerHTML += `<li class="page-item ${currentBlogPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeBlogPage(${currentBlogPage + 1})">»</a></li>`;
    }
}

// ================================================================
// CÁC HÀM XỬ LÝ
// ================================================================
function toggleHide(id) {
    const comment = allComments.find(c => c.id === id);
    if (comment) {
        comment.status = comment.status === 'hidden' ? 'pending' : 'hidden';
        renderStats();
        renderReviews();
        renderBlogs();
    }
}

function changeReviewStatus(id, newStatus) {
    const comment = allComments.find(c => c.id === id);
    if (comment) {
        comment.status = newStatus;
        renderStats();
        renderReviews();
    }
}

function changeBlogStatus(id, newStatus) {
    const comment = allComments.find(c => c.id === id);
    if (comment) {
        comment.status = newStatus;
        renderStats();
        renderBlogs();
    }
}

function deleteComment(id) {
    if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
        allComments = allComments.filter(c => c.id !== id);
        renderStats();
        renderReviews();
        renderBlogs();
    }
}

function changeReviewPage(page) { currentReviewPage = page; renderReviews(); }
function changeBlogPage(page) { currentBlogPage = page; renderBlogs(); }

// ================================================================
// NÚT LỌC
// ================================================================
document.getElementById('btn-filter').addEventListener('click', function() {
    currentReviewPage = 1;
    currentBlogPage = 1;
    renderReviews();
    renderBlogs();
});

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    loadCommentsFromJson();
});