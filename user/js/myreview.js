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
function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    const totalSpan = document.getElementById('totalReviews');
    if (!container) return;

    // Cập nhật tổng số
    totalSpan.textContent = myReviews.length + ' đánh giá';

    // Xóa nội dung cũ
    container.innerHTML = '';

    // Lặp qua từng review
    myReviews.forEach(function(review) {
        const starsHtml = renderStars(review.rating);
        const formattedDate = formatDate(review.date);
        const detailLink = 'order-detail.html?id=' + encodeURIComponent(review.orderId);

        const card = document.createElement('div');
        card.className = 'review-card';

        card.innerHTML = `
            <div class="review-product-image">
                <img src="${review.productImage}" alt="${review.productName}" onerror="this.src='https://via.placeholder.com/140x140/cccccc/666666?text=No+Image'" />
            </div>
            <div class="review-content-wrapper">
                <div class="review-product-name">
                    <a href="${detailLink}" class="product-link">${review.productName}</a>
                </div>
                <div class="review-stars">${starsHtml}</div>
                <div class="review-text">"${review.content}"</div>
                <div class="review-date">${formattedDate}</div>
                <div class="review-order-link">
                    <a href="${detailLink}" class="product-link">Xem đơn hàng →</a>
                </div>
            </div>
        `;

        // Click vào card cũng chuyển trang
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
    var date = new Date(dateString);
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