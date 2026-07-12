let allProducts = [];

function formatPrice(price) {
    if (!price) return '0₫';
    return price.toLocaleString('vi-VN') + '₫';
}

function getSearchTerm() {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
}

function renderResults() {
    const query = getSearchTerm().trim();
    const summary = document.getElementById('searchSummary');
    const container = document.getElementById('searchResults');

    if (!query) {
        if (summary) summary.textContent = 'Vui lòng nhập từ khóa để tìm kiếm.';
        if (container) container.innerHTML = '<div class="text-secondary">Không có từ khóa tìm kiếm.</div>';
        return;
    }

    const term = query.toLowerCase();
    const filtered = allProducts.filter(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        return name.includes(term) || category.includes(term) || description.includes(term);
    });

    if (summary) {
        summary.textContent = filtered.length > 0
            ? `Tìm thấy ${filtered.length} sản phẩm phù hợp với từ khóa “${query}”`
            : `Không tìm thấy sản phẩm phù hợp với từ khóa “${query}”`;
    }

    if (!filtered.length) {
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-secondary">Không tìm thấy sản phẩm phù hợp</p>
                </div>`;
        }
        return;
    }

    if (container) {
        container.innerHTML = filtered.map(product => {
            const hasDiscount = product.isSale && product.currentPrice;
            const discountPercent = hasDiscount ? Math.round((1 - product.currentPrice / product.originalPrice) * 100) : 0;
            const displayPrice = product.currentPrice || product.originalPrice;
            const priceHtml = hasDiscount
                ? `<span class="current-price">${formatPrice(displayPrice)}</span><span class="original-price">${formatPrice(product.originalPrice)}</span>`
                : `<span class="current-price no-discount">${formatPrice(displayPrice)}</span>`;

            return `
                <div class="product-card">
                    <div class="product-image-wrapper">
                        <a href="productdetail.html?id=${product.id}" class="d-block">
                            <img src="${product.image}" alt="${product.name}" loading="lazy">
                        </a>
                        ${hasDiscount ? `<span class="badge-discount">-${discountPercent}%</span>` : ''}
                    </div>
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <div class="product-price">${priceHtml}</div>
                    </div>
                </div>`;
        }).join('');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    fetch('../data/product.json')
        .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
        .then(data => {
            allProducts = data.products || data;
            renderResults();
        })
        .catch(err => {
            console.error(err);
            const container = document.getElementById('searchResults');
            if (container) {
                container.innerHTML = '<div class="text-danger">Không thể tải dữ liệu sản phẩm.</div>';
            }
        });
});
