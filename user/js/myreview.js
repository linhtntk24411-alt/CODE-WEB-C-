// ============================================================
// myreview.js – Đánh giá của tôi
// ============================================================

// Dữ liệu mẫu đánh giá của người dùng
const myReviews = [
    {
        orderId: "UR-81023",
        productId: 14,
        productName: "Nhíp kép gắp hạt nhựa ủi",
        productSlug: "nhip-kep-gap-hat-nhua-ui",
        productImage: "../assets/product/14.png",
        rating: 5,
        date: "2024-05-07T16:00:00",
        content: "Đơn hàng UR-81023 giao rất nhanh và sản phẩm đúng như mô tả. Nhíp gắp hạt rất tiện, chắc tay và dễ sử dụng."
    },
    {
        orderId: "UR-81045",
        productId: 11,
        productName: "Set cao cấp 24 màu",
        productSlug: "set-cao-cap-24-mau",
        productImage: "../assets/product/11.png",
        rating: 4,
        date: "2024-07-03T16:00:00",
        content: "Đơn hàng UR-81045 khá hài lòng. Bộ màu đẹp, chất lượng tốt, nhưng mình vẫn muốn có thêm vài màu pastel."
    },
    {
        orderId: "UR-83002",
        productId: 29,
        productName: "Set Cơ Bản 120 Màu",
        productSlug: "set-co-ban-120-mau",
        productImage: "../assets/product/29.png",
        rating: 5,
        date: "2024-07-14T16:00:00",
        content: "Đơn hàng UR-83002 rất đáng tiền. Hạt đều, màu sắc phong phú và đóng gói cẩn thận."
    },
    {
        orderId: "UR-83007",
        productId: 19,
        productName: "Móc khóa hello kitty dễ thương",
        productSlug: "moc-khoa-hello-kitty-de-thuong",
        productImage: "../assets/product/19.jpg",
        rating: 5,
        date: "2024-07-20T16:00:00",
        content: "Đơn hàng UR-83007 giao đúng hẹn và sản phẩm cực kỳ dễ thương."
    }
];

// ===== RENDER =====
async function renderReviews() { 
    const container = document.getElementById('reviewsContainer');
    const totalSpan = document.getElementById('totalReviews');
    if (!container) return;

    // 1. Lấy dữ liệu từ localStorage và mảng mẫu gốc
    const localReviews = JSON.parse(localStorage.getItem('my_reviews_cache')) || [];
    const allReviews = [...localReviews, ...myReviews];

    totalSpan.textContent = allReviews.length + ' đánh giá';
    container.innerHTML = '';

    // 2. ĐỌC DATA TỪ FILE JSON CUSTOM ĐỂ DÒ TÌM
    let jsonOrders = [];
    try {
        const response = await fetch('../data/custom-order-list.json');
        if (response.ok) {
            jsonOrders = await response.json();
        }
    } catch (err) {
        console.error("Không thể đọc file JSON để lấy ảnh:", err);
    }

    // Đọc thêm cache đơn hàng YCTK (nếu có) từ localStorage
    const localOrders = JSON.parse(localStorage.getItem('custom_orders_cache')) || [];
    const allOrders = [...localOrders, ...jsonOrders]; // Tổng hợp toàn bộ đơn hàng YCTK

    // 3. Tiến hành lặp và vẽ giao diện
    allReviews.forEach(function(review) {
        if (!review) return; 
        
        const target = review.item || review;
        
        // Lấy ID gốc (Ví dụ: "#URII-9842" hoặc "UR-81023")
        let rawId = review.orderId || target.orderId || review.id || target.id || '';
        
        // Làm sạch ID để đối chiếu chính xác
        const cleanOrderId = String(rawId).replace('#', '').trim().toUpperCase();

        // TÌM ĐƠN HÀNG KHỚP ID TRONG DANH SÁCH CUSTOM
        const matchedOrder = allOrders.find(item => {
            if (!item || !item.id) return false; 
            const cleanItemId = String(item.id).replace('#', '').trim().toUpperCase();
            return cleanOrderId === cleanItemId;
        });

        // Xác định ảnh và tên hiển thị (Ưu tiên lấy từ đơn custom nếu khớp)
        const prodImage = matchedOrder ? matchedOrder.image : (review.productImage || target.productImage || review.image || target.image || 'https://placehold.co/140x140?text=No+Image');
        const prodName = matchedOrder ? matchedOrder.name : (review.productName || target.productName || review.name || target.name || 'Đơn hàng');
        
        const rating = review.rating || target.rating || 5;
        const starsHtml = renderStars(rating);

        let rawDate = review.date || target.date || review.createdAt || target.createdAt || new Date();
        const formattedDate = formatDate(rawDate);
        
        // Lấy ID gốc (Ví dụ: "#URII-9842")
        const finalIdToUrl = matchedOrder ? matchedOrder.id : rawId; 
        
        // Làm sạch ID để truyền tham số gọn gàng (Bỏ dấu # đi khi truyền lên URL)
        const cleanIdForUrl = String(finalIdToUrl).replace('#', '').trim();
        
        // Mặc định link là đơn thường
        let detailLink = 'order-detail.html?id=' + encodeURIComponent(cleanIdForUrl);
        
        // Nếu là đơn custom, bắt buộc truyền id đã bỏ # và thêm &type=custom
        if (matchedOrder || review.type === 'custom' || target.type === 'custom' || cleanOrderId.startsWith('URII')) {
            detailLink = 'order-detail.html?id=' + encodeURIComponent(cleanIdForUrl) + '&type=custom';
        }
        const reviewText = review.content || target.content || review.comment || target.comment || 'Đánh giá không có nội dung.';

        const card = document.createElement('div');
        card.className = 'review-card';

        card.innerHTML = `
            <div class="review-product-image">
                <img src="${prodImage}" alt="${prodName}" onerror="this.onerror=null; this.src='https://placehold.co/140x140?text=No+Image'" />
            </div>
            <div class="review-content-wrapper">
                <div class="review-product-name">
                    <a href="${detailLink}" class="product-link">${prodName}</a>
                </div>
                <div class="review-stars">${starsHtml}</div>
                <div class="review-text">"${reviewText}"</div>
                <div class="review-date">${formattedDate}</div>
                <div class="review-order-link">
                    <a href="${detailLink}" class="product-link">Xem đơn hàng →</a>
                </div>
            </div>
        `;

        card.addEventListener('click', function(e) {
            if (e.target.tagName !== 'A') {
                window.location.href = detailLink;
            }
        });

        container.appendChild(card);
    });
}

// ===== HELPER: render stars =====
function renderStars(rating) {
    let html = '';
    for (var i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<span class="material-symbols-outlined star-filled">star</span>';
        } else {
            html += '<span class="material-symbols-outlined star-empty">star</span>';
        }
    }
    return html;
}

// ===== HELPER: format date =====
function formatDate(dateString) {
    if (!dateString) return 'Chưa rõ ngày';
    
    // Nếu chuỗi ngày có chứa dấu gạch chéo dạng DD/MM/YYYY (như file JSON custom của bạn)
    if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split(' ')[0].split('/'); // Tách lấy phần ngày bỏ phần giờ nếu có
        if (parts.length === 3) {
            // parts[0] là ngày, parts[1] là tháng, parts[2] là năm
            return parts[0].padStart(2, '0') + '/' + parts[1].padStart(2, '0') + '/' + parts[2];
        }
    }

    var date = new Date(dateString);
    // Nếu chạy qua new Date() mà bị lỗi không xác định được thời gian
    if (isNaN(date.getTime())) {
        return String(dateString).split(' ')[0]; // Trả về chuỗi ngày gốc cắt bớt giờ
    }

    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

// ===== LOAD HEADER & FOOTER & MODAL =====
document.addEventListener('DOMContentLoaded', function() {
    // Render reviews
    renderReviews();

    // Load Header
    fetch('../components/header.html')
        .then(function(res) {
            if (!res.ok) throw new Error('Header not found');
            return res.text();
        })
        .then(function(data) {
            document.getElementById('header-placeholder').innerHTML = data;
        })
        .catch(function() {
            console.warn('Header not found - using fallback');
            document.getElementById('header-placeholder').innerHTML = '<header>Header fallback</header>';
        });

    // Load Footer
    fetch('../components/footer.html')
        .then(function(res) {
            if (!res.ok) throw new Error('Footer not found');
            return res.text();
        })
        .then(function(data) {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(function() {
            console.warn('Footer not found - using fallback');
            document.getElementById('footer-placeholder').innerHTML = '<footer>Footer fallback</footer>';
        });

    // ===== MODAL LOGOUT =====
    var logoutTrigger = document.getElementById('logoutTrigger');
    var modalOverlay = document.getElementById('modalOverlay');
    var modalLogout = document.getElementById('modalLogout');
    var cancelBtn = document.querySelector('[data-close="modalLogout"]');
    var confirmBtn = document.getElementById('confirmLogout');

    if (logoutTrigger && modalOverlay && modalLogout) {
        logoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            modalOverlay.classList.add('active');
            modalLogout.classList.add('active');
        });

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                modalOverlay.classList.remove('active');
                modalLogout.classList.remove('active');
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                window.location.href = 'login.html';
            });
        }

        modalOverlay.addEventListener('click', function() {
            modalOverlay.classList.remove('active');
            modalLogout.classList.remove('active');
        });
    }
});