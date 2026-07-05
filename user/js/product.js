        // Global variables
        let allProducts = [];
        let filteredProducts = [];
        let currentPage = 1;
        const itemsPerPage = 9;

        function getStoredCartItems() {
            try {
                const saved = localStorage.getItem('cartItems');
                if (!saved) return [];
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('Không thể đọc giỏ hàng:', error);
                return [];
            }
        }

        function saveStoredCartItems(items) {
            localStorage.setItem('cartItems', JSON.stringify(items));
            window.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
            window.dispatchEvent(new Event('storage'));
        }

        function updateCartBadge() {
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                const items = getStoredCartItems();
                const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                cartCount.textContent = total;
                cartCount.style.display = total > 0 ? 'flex' : 'none';
            }
        }

        function getCategoryContext() {
            const params = new URLSearchParams(window.location.search);
            return {
                category: params.get('category') || ''
            };
        }

        function getCategoryLabel(category) {
            const labels = {
                kit: 'Bộ KIT DIY',
                tool: 'Dụng cụ',
                bead: 'Hạt lẻ',
                accessory: 'Phụ kiện Handmade'
            };
            return labels[category] || 'Tất cả sản phẩm';
        }

        function renderCategoryInfo() {
            const infoBox = document.getElementById('categoryInfo');
            if (!infoBox) return;

            const { category } = getCategoryContext();
            const matchedIds = filteredProducts.map(product => product.id);

            if (!category) {
                infoBox.innerHTML = '';
                infoBox.style.display = 'none';
                return;
            }

            infoBox.style.display = 'block';
            let message = `<strong>Danh mục:</strong> ${getCategoryLabel(category)}`;

            infoBox.innerHTML = message;
        }

        // Load products when page loads
        window.onload = function() {
            loadProducts();
        };

        // Load products from JSON
        function loadProducts() {
            fetch('../data/product.json')
            .then(function(res) {
                if (!res.ok) {
                    throw new Error('Không thể tải dữ liệu sản phẩm');
                }
                return res.json();
            })
            .then(function(data) {
                allProducts = data.products || data;
                const { category } = getCategoryContext();

                filteredProducts = [...allProducts];

                if (category) {
                    filteredProducts = filteredProducts.filter(product => product.category === category);
                }

                renderProducts();
                updatePagination();
                renderCategoryInfo();
            })
            .catch(function(error) {
                console.error('Lỗi:', error);
                document.getElementById('content').innerHTML = `
                    <div class="col-12 text-center py-5">
                        <p class="text-danger">Có lỗi xảy ra khi tải sản phẩm.</p>
                        <button class="btn btn-primary mt-3" onclick="loadProducts()">
                            <i class="bi bi-arrow-repeat"></i> Thử lại
                        </button>
                    </div>
                `;
            });
        }

        // Render products
        function renderProducts() {
            const container = document.getElementById('content');
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = filteredProducts.slice(start, end);

            if (pageItems.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <p class="text-secondary">Không tìm thấy sản phẩm phù hợp</p>
                    </div>
                `;
                updateProductCount();
                return;
            }

            let html = '';
            
            pageItems.forEach((p) => {
                const globalIndex = allProducts.indexOf(p);
                const hasDiscount = p.isSale && p.currentPrice;
                const discountPercent = hasDiscount ? 
                    Math.round((1 - p.currentPrice / p.originalPrice) * 100) : 0;
                const displayPrice = p.currentPrice || p.originalPrice;

                // Badges
                let badgeHtml = '';
                const hotStyle = 'background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 6px 14px; font-size: 13px; font-weight: 700; border-radius: 20px; box-shadow: 0 2px 10px rgba(255, 107, 53, 0.35); letter-spacing: 0.5px; border: 2px solid rgba(255,255,255,0.2); display: inline-flex; align-items: center; gap: 4px;';

                if (hasDiscount) {
                    badgeHtml += `<span class="badge-discount">-${discountPercent}%</span>`;
                    if (p.isHot) {
                        badgeHtml += `<span class="badge-hot" style="${hotStyle}">
                            <i class="bi bi-fire"></i> Hot
                        </span>`;
                    }
                } else if (p.isHot) {
                    badgeHtml += `<span class="badge-discount" style="${hotStyle}">
                        <i class="bi bi-fire"></i> Hot
                    </span>`;
                }

                // Rating
                const starsHtml = renderStars(p.rating || 0);

                // Price HTML
                let priceHtml = '';
                if (hasDiscount) {
                    priceHtml = `
                        <span class="current-price">${formatPrice(displayPrice)}</span>
                        <span class="original-price">${formatPrice(p.originalPrice)}</span>
                    `;
                } else {
                    priceHtml = `
                        <span class="current-price no-discount">${formatPrice(displayPrice)}</span>
                    `;
                }

                html += `
                <div class="product-card">
                    <div class="product-image-wrapper">
                        <a href="productdetail.html?id=${p.id}" class="d-block" onclick="event.stopPropagation();" aria-label="Xem chi tiết ${p.name}">
                            <img src="${p.image}" alt="${p.name}" loading="lazy">
                        </a>
                        ${badgeHtml}
                        
                        <button class="cart-icon" onclick="event.stopPropagation(); addToCartDirect(${globalIndex})">
                            <i class="bi bi-cart-plus"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <div class="product-title">${p.name}</div>
                        <div class="product-price">${priceHtml}</div>
                        <div class="product-meta">
                            <div class="product-rating">
                                <i class="bi bi-star"></i>
                                <span><span class="rating-number">${p.rating}</span></span>
                                <span class="review-count">(${p.reviews || 0})</span>
                            </div>
                            <div class="product-stock-info">
                                <i class="bi bi-box-seam"></i>
                                <span><span class="stock-number">${p.stock}</span></span>
                            </div>
                        </div>
                        <div class="product-actions">
                            <button class="btn-buy" onclick="event.stopPropagation(); buyNow(${globalIndex})">
                                <i class="bi bi-bag"></i> Mua ngay
                            </button>
                        </div>
                    </div>
                </div>
                `;
            });

            container.innerHTML = html;
            updateProductCount();
            renderCategoryInfo();
        }

        // Render stars
        function renderStars(rating) {
            let html = '';
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            
            for (let i = 0; i < fullStars; i++) {
                html += `<i class="bi bi-star-fill"></i>`;
            }
            if (hasHalfStar) {
                html += `<i class="bi bi-star-half"></i>`;
            }
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            for (let i = 0; i < emptyStars; i++) {
                html += `<i class="bi bi-star"></i>`;
            }
            return html;
        }

        // Format price
        function formatPrice(price) {
            if (!price) return '0₫';
            return price.toLocaleString('vi-VN') + '₫';
        }

        // Update product count
        function updateProductCount() {
            const countElement = document.getElementById('productCount');
            const start = (currentPage - 1) * itemsPerPage + 1;
            const end = Math.min(currentPage * itemsPerPage, filteredProducts.length);
            
            if (filteredProducts.length === 0) {
                countElement.textContent = 'Không có sản phẩm';
            } else {
                countElement.textContent = `Hiển thị ${start}-${end} trong số ${filteredProducts.length} sản phẩm`;
            }
        }

        // Update pagination
        function updatePagination() {
            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
            const container = document.getElementById('paginationContainer');
            
            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }

            let html = '';
            html += `
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link rounded-3 border-0" href="#" onclick="changePage(${currentPage - 1}); return false;">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
            `;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
                    html += `
                        <li class="page-item ${i === currentPage ? 'active' : ''}">
                            <a class="page-link rounded-3 ${i === currentPage ? '' : 'border-0'}" href="#" onclick="changePage(${i}); return false;">${i}</a>
                        </li>
                    `;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    html += `<li class="page-item disabled"><a class="page-link border-0" href="#">...</a></li>`;
                }
            }

            html += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link rounded-3 border-0" href="#" onclick="changePage(${currentPage + 1}); return false;">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            `;

            container.innerHTML = html;
        }

        // Change page
        function changePage(page) {
            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
            if (page < 1 || page > totalPages) return;
            currentPage = page;
            renderProducts();
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Apply filters
        function applyFilters() {
            let filtered = [...allProducts];

            // Price filter
            const selectedPrices = document.querySelectorAll('.filter-price:checked');
            if (selectedPrices.length > 0) {
                filtered = filtered.filter(product => {
                    const price = product.currentPrice || product.originalPrice;
                    return Array.from(selectedPrices).some(checkbox => {
                        const value = checkbox.value;
                        if (value === 'under-50') return price < 50000;
                        if (value === '50-200') return price >= 50000 && price <= 200000;
                        if (value === 'over-200') return price > 200000;
                        return false;
                    });
                });
            }

            // Sale filter
            const saleChecked = document.querySelector('.filter-sale:checked');
            if (saleChecked) {
                const value = saleChecked.value;
                if (value === 'sale') {
                    filtered = filtered.filter(p => p.isSale === true);
                } else if (value === 'hot') {
                    filtered = filtered.filter(p => p.isHot === true);
                }
            }

            // Rating filter với 5 khoảng: 4.5+, 4.0+, 3.5+, 3.0+, <3.0
            const activeRating = document.querySelector('.rating-filter-btn.active');
            if (activeRating) {
                const rating = activeRating.dataset.rating;
                if (rating === '4.5') {
                    filtered = filtered.filter(p => (p.rating || 0) >= 4.5);
                } else if (rating === '4.0') {
                    filtered = filtered.filter(p => (p.rating || 0) >= 4.0);
                } else if (rating === '3.5') {
                    filtered = filtered.filter(p => (p.rating || 0) >= 3.5);
                } else if (rating === '3.0') {
                    filtered = filtered.filter(p => (p.rating || 0) >= 3.0);
                } else if (rating === 'below-3') {
                    filtered = filtered.filter(p => (p.rating || 0) < 3.0);
                }
                // 'all' không cần filter
            }

            // Sort
            const sortValue = document.getElementById('sortSelect').value;
            switch(sortValue) {
                case 'price-asc':
                    filtered.sort((a, b) => (a.currentPrice || a.originalPrice) - (b.currentPrice || b.originalPrice));
                    break;
                case 'price-desc':
                    filtered.sort((a, b) => (b.currentPrice || b.originalPrice) - (a.currentPrice || a.originalPrice));
                    break;
                case 'sale':
                    filtered.sort((a, b) => {
                        const aDiscount = a.isSale && a.currentPrice ? ((a.originalPrice - a.currentPrice) / a.originalPrice) : 0;
                        const bDiscount = b.isSale && b.currentPrice ? ((b.originalPrice - b.currentPrice) / b.originalPrice) : 0;
                        return bDiscount - aDiscount;
                    });
                    break;
                case 'popular':
                default:
                    filtered.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
                    break;
            }

            filteredProducts = filtered;
            currentPage = 1;
            renderProducts();
            updatePagination();
            renderCategoryInfo();
        }

        // Open detail page
        function openModal(index) {
            const product = allProducts[index];
            if (!product) return;
            window.location.href = `productdetail.html?id=${product.id}`;
        }

        // Add to cart
        function addToCartDirect(index) {
            const product = allProducts[index];
            if (!product) return;

            const cartItems = getStoredCartItems();
            const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0].name : null;
            const existingItem = cartItems.find(item => item.productId === product.id && (item.variant || null) === (defaultVariant || null));

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cartItems.push({ productId: product.id, variant: defaultVariant, quantity: 1 });
            }

            saveStoredCartItems(cartItems);
            updateCartBadge();
            alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
        }

        // Buy now
        function buyNow(index) {
            const product = allProducts[index];
            if (!product) return;
            alert(`Đang xử lý đơn hàng cho "${product.name}"...`);
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Filter events
            document.querySelectorAll('.filter-price, .filter-sale').forEach(checkbox => {
                checkbox.addEventListener('change', applyFilters);
            });

            document.querySelectorAll('.rating-filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.rating-filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    applyFilters();
                });
            });

            document.getElementById('sortSelect').addEventListener('change', applyFilters);

            document.getElementById('clearFilters').addEventListener('click', function() {
                document.querySelectorAll('.filter-price').forEach(cb => cb.checked = false);
                document.querySelectorAll('.filter-sale').forEach(cb => cb.checked = false);
                document.querySelectorAll('.rating-filter-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.rating-filter-btn[data-rating="all"]').classList.add('active');
                document.getElementById('sortSelect').value = 'popular';
                applyFilters();
            });
        });
