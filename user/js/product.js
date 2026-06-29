// ===========================
// 📦 STATE
// ===========================
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 8;
let selectedColors = new Set();
let selectedPrices = new Set();
let searchTerm = '';
let currentSort = 'popular';

// ===========================
// 📥 LOAD DATA
// ===========================
async function loadProducts() {
    try {
        const response = await fetch('../da');
        const data = await response.json();
        allProducts = data.products;
        filteredProducts = [...allProducts];
        render();
    } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        // Fallback: dùng dữ liệu mẫu
        allProducts = getFallbackData();
        filteredProducts = [...allProducts];
        render();
    }
}

// Fallback data (để test khi chưa có file JSON)
function getFallbackData() {
    return [
        {
            "id": 1,
            "name": "Set Cơ Bản 24 Màu",
            "slug": "set-co-ban-24-mau",
            "category": "kit",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuATEOl-5AfBgCYPaU8rH7TB4YOyYf2v43qXOijRPCZv1IudmAXnGdIwUpOIBSXkDz4x_ZyByQvsbdQs8HbhyHIWuPqs1SI_-CMWfqcBKhRy1wQ7zK6MPB816rRYfXKWKHOupSEtBOy_4VYoaM7uJ30pGz6mz5mBcZkochkQ9qbI7rT7M3BrnpelBo6oY6FnIC0OfM90oFIHLaTg-VMDnYyvMYHg2KpqoOncK-ukxzzgwZ0sn_EyPGLGtGMmgpmABKPdDF2s0pU0TggJ",
            "isSale": true,
            "isHot": true,
            "badge": "-20%",
            "originalPrice": 150000,
            "currentPrice": 120000,
            "stock": 15,
            "stockPercent": 30,
            "sold": 245,
            "rating": 5,
            "reviewCount": 120,
            "colors": ["red", "blue", "yellow", "green"]
        },
        // ... thêm các sản phẩm khác nếu cần
    ];
}

// ===========================
// 🎨 RENDER FUNCTIONS
// ===========================
function render() {
    applyFiltersAndSort();
    renderProducts();
    renderPagination();
    updateInfoText();
}

function applyFiltersAndSort() {
    let result = [...allProducts];

    // Filter by search
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        result = result.filter(p => p.name.toLowerCase().includes(term));
    }

    // Filter by price
    if (selectedPrices.size > 0) {
        result = result.filter(p => {
            const price = p.isSale ? p.currentPrice : p.originalPrice;
            for (const range of selectedPrices) {
                if (range === 'under50' && price < 50000) return true;
                if (range === '50-200' && price >= 50000 && price <= 200000) return true;
                if (range === '200-500' && price > 200000 && price <= 500000) return true;
                if (range === 'over500' && price > 500000) return true;
            }
            return false;
        });
    }

    // Filter by color
    if (selectedColors.size > 0) {
        result = result.filter(p => {
            return p.colors && p.colors.some(c => selectedColors.has(c));
        });
    }

    // Sort
    switch (currentSort) {
        case 'price-asc':
            result.sort((a, b) => {
                const priceA = a.isSale ? a.currentPrice : a.originalPrice;
                const priceB = b.isSale ? b.currentPrice : b.originalPrice;
                return priceA - priceB;
            });
            break;
        case 'price-desc':
            result.sort((a, b) => {
                const priceA = a.isSale ? a.currentPrice : a.originalPrice;
                const priceB = b.isSale ? b.currentPrice : b.originalPrice;
                return priceB - priceA;
            });
            break;
        case 'name-asc':
            result.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            result.sort((a, b) => b.name.localeCompare(a.name));
            break;
        default: // popular
            result.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    }

    filteredProducts = result;
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredProducts.slice(start, end);

    if (pageItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="bi bi-box-seam"></i>
                <h5>Không tìm thấy sản phẩm</h5>
                <p class="text-muted">Vui lòng thử lại với bộ lọc khác</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = pageItems.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const isOnSale = product.isSale && product.currentPrice !== null;
    const currentPrice = isOnSale ? product.currentPrice : product.originalPrice;
    const originalPrice = isOnSale ? product.originalPrice : null;
    
    // Xác định badge
    let badgeLeft = '';
    let badgeRight = '';
    
    if (product.isSale && product.badge) {
        badgeLeft = `<span class="badge-sale">${product.badge}</span>`;
    }
    
    if (product.isHot) {
        badgeRight = `<span class="badge-hot">Bán chạy</span>`;
    }

    // Timer
    let timerHtml = '';
    if (product.timer) {
        timerHtml = `
            <div class="product-card__timer">
                <span class="timer-label">
                    <i class="bi bi-clock"></i> Còn lại
                </span>
                <span class="timer-countdown" data-timer="${product.timer}">
                    <span>${String(product.hours).padStart(2, '0')}</span>:
                    <span>${String(product.minutes).padStart(2, '0')}</span>:
                    <span>${String(product.seconds).padStart(2, '0')}</span>
                </span>
            </div>
        `;
    }

    // Stock
    const stockPercent = product.stockPercent || 0;
    const stockHtml = `
        <div class="product-card__stock">
            <div class="stock-info">
                <span class="stock-label"><i class="bi bi-box"></i></span>
                <span class="stock-text">Đã bán: <strong class="stock-count">${product.sold || 0}</strong></span>
            </div>
            <div class="stock-bar">
                <div class="stock-bar__fill" style="width: ${stockPercent}%"></div>
            </div>
        </div>
    `;

    // Rating
    const rating = product.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="bi bi-star-fill"></i>';
    }
    if (hasHalf) {
        starsHtml += '<i class="bi bi-star-half"></i>';
    }
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="bi bi-star empty"></i>';
    }

    // Pricing
    const priceHtml = `
        <div class="product-card__pricing">
            <span class="price-current">${formatCurrency(currentPrice)}</span>
            ${originalPrice ? `<span class="price-original">${formatCurrency(originalPrice)}</span>` : ''}
        </div>
    `;

    return `
        <div class="product-card">
            <div class="product-card__media">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${badgeLeft ? `<div class="product-card__badge product-card__badge--top-left">${badgeLeft}</div>` : ''}
                ${badgeRight ? `<div class="product-card__badge product-card__badge--top-right">${badgeRight}</div>` : ''}
            </div>
            <div class="product-card__body">
                <h3>${product.name}</h3>
                <div class="stars mb-2">
                    ${starsHtml}
                    <span class="text-muted-urii ms-1">(${product.reviewCount || 0})</span>
                </div>
                ${timerHtml}
                ${stockHtml}
                <div class="product-card__footer">
                    ${priceHtml}
                    <button class="btn-urii btn-urii-sm" onclick="addToCart(${product.id})">
                        <i class="bi bi-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    
    // Previous
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
        }
    }

    // Next
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    pagination.innerHTML = html;
}

function updateInfoText() {
    const total = filteredProducts.length;
    const start = Math.min((currentPage - 1) * itemsPerPage + 1, total);
    const end = Math.min(currentPage * itemsPerPage, total);
    
    document.getElementById('startCount').textContent = total > 0 ? start : 0;
    document.getElementById('endCount').textContent = end;
    document.getElementById('totalCount').textContent = total;
}

// ===========================
// 🛠 UTILITY FUNCTIONS
// ===========================
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

// ===========================
// 🎯 ACTIONS
// ===========================
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProducts();
    renderPagination();
    updateInfoText();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
        // Có thể gọi API hoặc update giỏ hàng ở đây
    }
}

// ===========================
// 🔍 FILTER EVENTS
// ===========================
function setupFilters() {
    // Price filters
    document.querySelectorAll('.price-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                selectedPrices.add(this.value);
            } else {
                selectedPrices.delete(this.value);
            }
            currentPage = 1;
            render();
        });
    });

    // Color filters
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const color = this.dataset.color;
            if (selectedColors.has(color)) {
                selectedColors.delete(color);
                this.classList.remove('active');
            } else {
                selectedColors.add(color);
                this.classList.add('active');
            }
            currentPage = 1;
            render();
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', function() {
        searchTerm = this.value;
        currentPage = 1;
        render();
    });

    // Sort
    document.getElementById('sortSelect').addEventListener('change', function() {
        currentSort = this.value;
        currentPage = 1;
        render();
    });

    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', function() {
        // Clear price filters
        document.querySelectorAll('.price-filter').forEach(cb => cb.checked = false);
        selectedPrices.clear();
        
        // Clear color filters
        document