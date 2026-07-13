// ================================================================
// JS QUẢN LÝ BLOG (Phiên bản Đầy đủ Chức năng)
// ================================================================

let blogs = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 4;

// ================================================================
// MOCK DATA
// ================================================================
function generateMockBlogs() {
    return [
        {
            id: 1,
            title: "Hướng dẫn làm móc khóa hạt nhựa Perler Bead",
            date: "12/05/2024",
            thumbnail: "https://picsum.photos/seed/blog1/100/100",
            author: { name: "Minh Nhật", avatar: "https://i.pravatar.cc/150?u=1" },
            status: "approved",
            visible: true
        },
        {
            id: 2,
            title: "Bộ sưu tập các mẫu cốc vẽ tay sáng tạo",
            date: "10/05/2024",
            thumbnail: "https://picsum.photos/seed/blog2/100/100",
            author: { name: "Linh Hoa", avatar: "https://i.pravatar.cc/150?u=2" },
            status: "approved",
            visible: true
        },
        {
            id: 3,
            title: "Tự thiết kế lót ly Perler Bead tại nhà",
            date: "09/05/2024",
            thumbnail: "https://picsum.photos/seed/blog3/100/100",
            author: { name: "Thanh Vân", avatar: "https://i.pravatar.cc/150?u=3" },
            status: "pending",
            visible: true
        },
        {
            id: 4,
            title: "5 bước để có một bức tranh đẹp từ hạt nhựa",
            date: "08/05/2024",
            thumbnail: "https://picsum.photos/seed/blog4/100/100",
            author: { name: "Minh Nhật", avatar: "https://i.pravatar.cc/150?u=1" },
            status: "pending",
            visible: true
        },
        {
            id: 5,
            title: "Hướng dẫn sử dụng khuôn nhựa nhiệt đúng cách",
            date: "07/05/2024",
            thumbnail: "https://picsum.photos/seed/blog5/100/100",
            author: { name: "Linh Hoa", avatar: "https://i.pravatar.cc/150?u=2" },
            status: "violated",
            visible: true
        },
        {
            id: 6,
            title: "Cẩm nang mua sắm hạt nhựa cho người mới",
            date: "06/05/2024",
            thumbnail: "https://picsum.photos/seed/blog6/100/100",
            author: { name: "Thanh Vân", avatar: "https://i.pravatar.cc/150?u=3" },
            status: "violated",
            visible: true
        },
        {
            id: 7,
            title: "Test bài viết bị ẩn",
            date: "05/05/2024",
            thumbnail: "https://picsum.photos/seed/blog7/100/100",
            author: { name: "Người Dùng", avatar: "https://i.pravatar.cc/150?u=7" },
            status: "pending",
            visible: false
        }
    ];
}

// ================================================================
// CÁC HÀM RENDER
// ================================================================
function renderStats() {
    document.getElementById('stat-total').innerText = blogs.length;
    document.getElementById('stat-approved').innerText = blogs.filter(b => b.status === 'approved').length;
    document.getElementById('stat-pending').innerText = blogs.filter(b => b.status === 'pending').length;
    document.getElementById('stat-violated').innerText = blogs.filter(b => b.status === 'violated').length;
}

function populateAuthorFilter() {
    const authors = [...new Set(blogs.map(b => b.author.name))];
    const select = document.getElementById('filter-author-blog');
    select.innerHTML = '<option value="">Tất cả tác giả</option>';
    authors.forEach(name => {
        select.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

function getFilteredBlogs() {
    const status = document.getElementById('filter-status-blog').value;
    const author = document.getElementById('filter-author-blog').value;

    return blogs.filter(b => {
        const matchStatus = status === '' || b.status === status;
        const matchAuthor = author === '' || b.author.name === author;
        return matchStatus && matchAuthor;
    });
}

function renderBlogList() {
    const filtered = getFilteredBlogs();
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filtered.slice(start, end);

    const tbody = document.getElementById('blog-list');
    tbody.innerHTML = '';

    const statusMap = {
        'approved': { text: 'Đã duyệt', class: 'badge-status-approved' },
        'pending': { text: 'Chờ duyệt', class: 'badge-status-pending' },
        'violated': { text: 'Vi phạm', class: 'badge-status-violated' }
    };

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Không có bài viết nào phù hợp.</td></tr>`;
    } else {
        pageData.forEach(b => {
            const s = statusMap[b.status] || { text: b.status, class: 'badge-status-pending' };
            // Nếu đang bị ẩn (visible === false), thêm class làm mờ dòng
            const isHidden = b.visible === false;
            
            let imgPath = b.thumbnail || '';
            if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
                imgPath = imgPath.replace(/^(\.\.\/)?assets\//, '../../user/assets/');
            }
            
            tbody.innerHTML += `
                <tr class="${isHidden ? 'blog-row-hidden' : ''}">
                    <td class="ps-4"><img src="${imgPath}" alt="" class="blog-thumb ${isHidden ? 'img-muted' : ''}"></td>
                    <td>
                        <div class="blog-title ${isHidden ? 'text-muted' : ''}">${b.title}</div>
                        <span class="blog-date">Đăng ngày: ${b.date}</span>
                    </td>
                    <td>
                        <div class="author-info">
                            <span class="author-name">${b.author.name}</span>
                        </div>
                    </td>
                    <td><span class="badge-status ${s.class}">${s.text}</span></td>
                    <td class="pe-4">
                        <div class="action-btn-group">
                            <!-- Nút Toggle Ẩn/Hiện (Con mắt) -->
                            <button class="btn-action-icon ${isHidden ? 'text-danger' : 'text-success'}" onclick="toggleVisibility(${b.id})" title="${isHidden ? 'Hiện bài viết' : 'Tạm ẩn bài viết'}">
                                <i class="bi ${isHidden ? 'bi-eye-slash' : 'bi-eye'}"></i>
                            </button>
                            
                            <!-- Nút Chỉnh sửa trạng thái (Bút chì) -->
                            <div class="dropdown d-inline-block">
                                <button class="btn-action-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Thay đổi trạng thái">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item ${b.status === 'pending' ? 'active' : ''}" href="#" onclick="changeStatus(${b.id}, 'pending')">Chờ duyệt</a></li>
                                    <li><a class="dropdown-item ${b.status === 'approved' ? 'active' : ''}" href="#" onclick="changeStatus(${b.id}, 'approved')">Đã duyệt</a></li>
                                    <li><a class="dropdown-item ${b.status === 'violated' ? 'active' : ''}" href="#" onclick="changeStatus(${b.id}, 'violated')">Vi phạm</a></li>
                                </ul>
                            </div>

                            <!-- Nút Xóa vĩnh viễn -->
                            <button class="btn-action-icon text-danger" onclick="deleteBlog(${b.id})" title="Xóa bài viết"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    document.getElementById('pagination-info').innerText = `Hiển thị ${start + 1}-${Math.min(end, totalItems)} trên tổng số ${totalItems} bài viết`;
    
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

function renderPendingBlogs() {
    // 1. Lấy TẤT CẢ các bài viết có status = 'pending'
    const pending = blogs.filter(b => b.status === 'pending');
    document.getElementById('pending-count-sidebar').innerText = pending.length;

    const container = document.getElementById('pending-blogs-container');
    container.innerHTML = '';

    // 2. Render toàn bộ danh sách chờ duyệt
    if (pending.length === 0) {
        container.innerHTML = `<p class="text-muted small text-center py-3">Hiện không có bài viết nào chờ duyệt.</p>`;
    } else {
        pending.forEach(b => {
            let imgPath = b.thumbnail || '';
            if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
                imgPath = imgPath.replace(/^(\.\.\/)?assets\//, '../../user/assets/');
            }
            
            container.innerHTML += `
                <div class="pending-item">
                    <div class="d-flex align-items-start">
                        <img src="${imgPath}" class="pending-thumb">
                        <div>
                            <div class="pending-title">${b.title}</div>
                            <div class="pending-author"><i class="bi bi-person"></i> ${b.author.name}</div>
                        </div>
                    </div>
                    <div class="pending-actions">
                        <button class="btn-approve-small" onclick="approveBlog(${b.id})">Duyệt</button>
                        <button class="btn-reject-small" onclick="rejectBlog(${b.id})">Từ chối</button>
                    </div>
                </div>
            `;
        });
    }
}

// ================================================================
// CÁC HÀM XỬ LÝ SỰ KIỆN
// ================================================================
function changePage(page) {
    currentPage = page;
    renderBlogList();
}

function approveBlog(id) {
    const blog = blogs.find(b => b.id === id);
    if (blog) {
        blog.status = 'approved';
        renderAll();
    }
}

function rejectBlog(id) {
    const blog = blogs.find(b => b.id === id);
    if (blog) {
        blog.status = 'violated';
        renderAll();
    }
}

// Xóa bài viết
function deleteBlog(id) {
    if (confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
        blogs = blogs.filter(b => b.id !== id);
        renderAll();
    }
}

// Toggle Ẩn/Hiện bài viết
function toggleVisibility(id) {
    const blog = blogs.find(b => b.id === id);
    if (blog) {
        blog.visible = !blog.visible; // Đảo ngược trạng thái
        renderAll();
    }
}

// Thay đổi trạng thái (Dropdown từ cây bút chì)
function changeStatus(id, newStatus) {
    const blog = blogs.find(b => b.id === id);
    if (blog) {
        blog.status = newStatus;
        renderAll();
    }
}

// ================================================================
// CHỨC NĂNG TẠO BÀI VIẾT MỚI
// ================================================================
function openCreateModal() {
    document.getElementById('blog-form').reset();
    document.getElementById('preview-thumbnail').classList.add('d-none');
    const myModal = new bootstrap.Modal(document.getElementById('createBlogModal'));
    myModal.show();
}

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('blog-thumbnail');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('preview-thumbnail');
                    preview.src = event.target.result;
                    preview.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function submitNewBlog() {
    const title = document.getElementById('blog-title').value.trim();
    const authorName = document.getElementById('blog-author').value.trim();
    const content = document.getElementById('blog-content').value.trim();
    const previewImg = document.getElementById('preview-thumbnail');

    if (!title || !authorName || !content) {
        alert("Vui lòng điền đầy đủ thông tin (Tiêu đề, Tác giả, Nội dung)");
        return;
    }

    const newId = blogs.length > 0 ? Math.max(...blogs.map(b => b.id)) + 1 : 1;
    
    const newBlog = {
        id: newId,
        title: title,
        date: new Date().toLocaleDateString('vi-VN'),
        thumbnail: previewImg.classList.contains('d-none') ? "https://picsum.photos/seed/blog" + newId + "/100/100" : previewImg.src,
        author: { name: authorName, avatar: "https://i.pravatar.cc/150?u=" + newId },
        status: "pending",
        visible: true
    };

    blogs.push(newBlog);
    
    const modalEl = document.getElementById('createBlogModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    renderAll();
}

// ================================================================
// HÀM RENDER & INIT
// ================================================================
// ================================================================
// HÀM RENDER & INIT
// ================================================================
async function syncBlogsToJsonFile(updatedData) {
    try {
        const response = await fetch('../../user/data/blogs.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blogs: updatedData }, null, 2)
        });
        if (!response.ok) {
            console.warn("Could not write to blogs.json. Data is still safe in localStorage.");
        } else {
            console.log("✅ Đã đồng bộ dữ liệu xuống blogs.json");
        }
    } catch (error) {
        console.warn("Error writing to blogs.json:", error);
    }
}

function saveUserBlogsToLocalStorage() {
    try {
        const localBlogsSaved = localStorage.getItem('userBlogs');
        let originalUserBlogs = [];
        if (localBlogsSaved) {
            originalUserBlogs = JSON.parse(localBlogsSaved);
        }
        
        // Cập nhật trạng thái duyệt từ Admin về User Blog
        const updatedUserBlogs = originalUserBlogs.map(ub => {
            const adminVersion = blogs.find(b => b.id === ub.id);
            if (adminVersion) {
                let userStatus = 'published';
                if (adminVersion.status === 'violated') {
                    userStatus = 'draft';
                } else if (adminVersion.status === 'pending') {
                    userStatus = 'pending';
                } else if (adminVersion.status === 'approved') {
                    userStatus = 'published';
                }
                
                return {
                    ...ub,
                    status: userStatus,
                    title: adminVersion.title,
                    image: adminVersion.thumbnail,
                    visible: adminVersion.visible
                };
            }
            return ub;
        });
        
        // Thêm các blog mới do Admin viết trực tiếp vào danh sách user
        blogs.forEach(b => {
            if (b.id > 100000 && !updatedUserBlogs.some(ub => ub.id === b.id)) {
                updatedUserBlogs.push({
                    id: b.id,
                    title: b.title,
                    slug: b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bai-viet-' + b.id,
                    excerpt: b.content ? b.content.substring(0, 80) + '...' : '',
                    content: b.content || '',
                    image: b.thumbnail || '../assets/default-banner.jpg',
                    author: b.author.name,
                    avatar: b.author.avatar || '../assets/avatar-non.jpg',
                    date: b.date,
                    category: 'Chung',
                    categorySlug: 'chung',
                    isFeatured: false,
                    likes: 0, comments: 0, views: 0,
                    status: b.status === 'approved' ? 'published' : 'pending',
                    visible: b.visible
                });
            }
        });
        
        localStorage.setItem('userBlogs', JSON.stringify(updatedUserBlogs));
        syncBlogsToJsonFile(updatedUserBlogs);
    } catch (e) {
        console.error("Error saving user blogs to storage:", e);
    }
}

function renderAll() {
    saveUserBlogsToLocalStorage();
    renderStats();
    renderBlogList();
    renderPendingBlogs();
    populateAuthorFilter();
}

// Lắng nghe sự kiện lọc
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('filter-status-blog').addEventListener('change', () => {
        currentPage = 1;
        renderBlogList();
    });
    document.getElementById('filter-author-blog').addEventListener('change', () => {
        currentPage = 1;
        renderBlogList();
    });
});

document.addEventListener('DOMContentLoaded', async function() {
    let localBlogs = [];
    
    // 1. Tải từ localStorage trước
    try {
        const localBlogsSaved = localStorage.getItem('userBlogs');
        if (localBlogsSaved) {
            const parsedBlogs = JSON.parse(localBlogsSaved);
            if (Array.isArray(parsedBlogs) && parsedBlogs.length > 0) {
                localBlogs = parsedBlogs.map(b => {
                    let adminStatus = 'pending';
                    if (b.status === 'published' || b.status === 'approved') adminStatus = 'approved';
                    else if (b.status === 'draft' || b.status === 'violated') adminStatus = 'violated';
                    
                    return {
                        id: b.id,
                        title: b.title,
                        date: b.date || 'Hôm nay',
                        thumbnail: b.image || "https://picsum.photos/seed/blog/100/100",
                        author: { 
                            name: b.author || 'Khách hàng', 
                            avatar: b.avatar || '../assets/avatar-non.jpg' 
                        },
                        status: adminStatus,
                        visible: b.visible !== undefined ? b.visible : true,
                        isUserBlog: true
                    };
                });
            }
        }
    } catch (e) {
        console.error("Error loading user blogs:", e);
    }
    
    // 2. Nếu không có cache, tải từ blogs.json
    if (localBlogs.length === 0) {
        try {
            const response = await fetch('../../user/data/blogs.json');
            if (response.ok) {
                const data = await response.json();
                const jsonBlogs = data.blogs || data || [];
                localBlogs = jsonBlogs.map(b => {
                    let adminStatus = 'approved';
                    if (b.status === 'pending') adminStatus = 'pending';
                    else if (b.status === 'draft' || b.status === 'violated') adminStatus = 'violated';
                    
                    return {
                        id: b.id,
                        title: b.title,
                        date: b.date || 'Hôm nay',
                        thumbnail: b.image || "https://picsum.photos/seed/blog/100/100",
                        author: { 
                            name: b.author || 'Khách hàng', 
                            avatar: b.avatar || '../assets/avatar-non.jpg' 
                        },
                        status: adminStatus,
                        visible: b.visible !== undefined ? b.visible : true,
                        isUserBlog: true
                    };
                });
                
                // Đồng bộ ngược lại localStorage
                const userBlogsToSave = jsonBlogs.map(b => ({
                    ...b,
                    status: b.status || 'published',
                    visible: b.visible !== undefined ? b.visible : true
                }));
                localStorage.setItem('userBlogs', JSON.stringify(userBlogsToSave));
            }
        } catch(e) {
            console.error("Error fetching blogs.json:", e);
        }
    }

    blogs = localBlogs;
    renderAll();
});