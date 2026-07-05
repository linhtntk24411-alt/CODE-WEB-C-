        // Get product ID from URL (default: 12)
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id')) || 12;

        let productData = null;
        let allReviews = [];
        let allProducts = [];
        let currentVariant = null;
        let currentRatingFilter = 'all';
        let currentRelatedCategory = 'all';
        let maxStock = 0;

        // Load data
        async function loadProductData() {
            try {
                const response = await fetch('../data/product.json');
                if (!response.ok) throw new Error('Không thể tải dữ liệu sản phẩm');
                const data = await response.json();
                
                allProducts = data.products;
                productData = allProducts.find(p => p.id === productId);
                
                if (!productData) {
                    throw new Error('Không tìm thấy sản phẩm');
                }

                allReviews = productData.reviews_list || [];

                renderProduct(productData);
                renderReviews(allReviews);
                renderRelatedProducts(productData, 'all');
                
                document.getElementById('loadingSpinner').style.display = 'none';
                document.getElementById('productDetail').style.display = 'block';
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('loadingSpinner').innerHTML = `
                    <div class="text-center">
                        <p class="text-danger">${error.message}</p>
                        <button class="btn btn-primary-custom" onclick="loadProductData()">Thử lại</button>
                    </div>
                `;
            }
        }

        // Render Product
        function renderProduct(product) {
            document.getElementById('breadcrumbProduct').textContent = product.name;
            document.getElementById('mainImage').src = product.image || 'https://via.placeholder.com/400';
            document.getElementById('mainImage').alt = product.name;

            const thumbContainer = document.getElementById('thumbnailContainer');
            thumbContainer.innerHTML = '';
            
            document.getElementById('productName').textContent = product.name;

            const stars = renderStars(product.rating || 0);
            document.getElementById('productStars').innerHTML = stars;
            document.getElementById('productRating').textContent = `${product.rating || 0} (${product.reviews || 0} đánh giá)`;
            document.getElementById('productSold').textContent = `Đã bán ${Math.floor(product.reviews * 3.5) || 0}`;

            const hasDiscount = product.isSale && product.currentPrice;
            const displayPrice = product.currentPrice || product.originalPrice;
            
            document.getElementById('currentPrice').textContent = formatPrice(displayPrice);
            
            if (hasDiscount) {
                document.getElementById('originalPrice').textContent = formatPrice(product.originalPrice);
                document.getElementById('originalPrice').style.display = 'inline';
                const discountPercent = Math.round((1 - product.currentPrice / product.originalPrice) * 100);
                document.getElementById('discountBadge').textContent = `-${discountPercent}%`;
                document.getElementById('discountBadge').style.display = 'inline-block';
            } else {
                document.getElementById('originalPrice').style.display = 'none';
                document.getElementById('discountBadge').style.display = 'none';
            }

            // Set max stock
            maxStock = product.stock || 0;
            document.getElementById('stockInfo').textContent = `${maxStock} sản phẩm có sẵn`;

            const variantSection = document.getElementById('variantSection');
            const variantContainer = document.getElementById('variantContainer');
            
            if (product.variants && product.variants.length > 0) {
                variantSection.style.display = 'block';
                variantContainer.innerHTML = '';
                
                product.variants.forEach((variant, index) => {
                    const isActive = index === 0;
                    const div = document.createElement('div');
                    div.className = `variant-option ${isActive ? 'active' : ''}`;
                    div.dataset.index = index;
                    div.dataset.price = variant.price;
                    div.dataset.stock = variant.stock;
                    div.innerHTML = `
                        <div class="variant-name">${variant.name}</div>
                        <div class="variant-desc">${formatPrice(variant.price)}</div>
                    `;
                    div.onclick = function() { selectVariant(this, product); };
                    variantContainer.appendChild(div);
                });
                
                currentVariant = product.variants[0];
                maxStock = currentVariant.stock || 0;
                document.getElementById('stockInfo').textContent = `${maxStock} sản phẩm có sẵn`;
            } else {
                variantSection.style.display = 'none';
                maxStock = product.stock || 0;
            }

            // Reset quantity
            document.getElementById('qtyInput').value = 1;
            updateQtyButtons();

            document.getElementById('productDescription').innerHTML = product.description || 'Chưa có mô tả cho sản phẩm này.';
            document.getElementById('reviewCount').textContent = allReviews.length || 0;
        }

        // Render Stars
        function renderStars(rating) {
            let html = '';
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            
            for (let i = 0; i < fullStars; i++) {
                html += '<i class="bi bi-star-fill"></i>';
            }
            if (hasHalfStar) {
                html += '<i class="bi bi-star-half"></i>';
            }
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            for (let i = 0; i < emptyStars; i++) {
                html += '<i class="bi bi-star"></i>';
            }
            return html;
        }

        // Format Price
        function formatPrice(price) {
            if (!price) return '0₫';
            return price.toLocaleString('vi-VN') + '₫';
        }

        // Select Variant
        function selectVariant(element, product) {
            document.querySelectorAll('.variant-option').forEach(el => el.classList.remove('active'));
            element.classList.add('active');
            
            const index = parseInt(element.dataset.index);
            currentVariant = product.variants[index];
            maxStock = currentVariant.stock || 0;
            
            document.getElementById('currentPrice').textContent = formatPrice(currentVariant.price);
            document.getElementById('stockInfo').textContent = `${maxStock} sản phẩm có sẵn`;
            
            // Reset quantity and update buttons
            document.getElementById('qtyInput').value = 1;
            updateQtyButtons();
        }

        // Update Quantity
        function updateQuantity(change) {
            const input = document.getElementById('qtyInput');
            let value = parseInt(input.value) + change;
            
            if (value < 1) value = 1;
            if (value > maxStock) {
                value = maxStock;
                if (maxStock === 0) {
                    alert('Sản phẩm đã hết hàng!');
                    return;
                }
            }
            
            input.value = value;
            updateQtyButtons();
        }

        function validateQuantity() {
            const input = document.getElementById('qtyInput');
            let value = parseInt(input.value);
            
            if (isNaN(value) || value < 1) {
                value = 1;
            }
            
            if (value > maxStock) {
                value = maxStock;
                if (maxStock === 0) {
                    alert('Sản phẩm đã hết hàng!');
                } else {
                    alert(`Chỉ còn ${maxStock} sản phẩm trong kho`);
                }
            }
            
            input.value = value;
            updateQtyButtons();
        }

        function updateQtyButtons() {
            const input = document.getElementById('qtyInput');
            const value = parseInt(input.value) || 1;
            const minusBtn = document.getElementById('qtyMinus');
            const plusBtn = document.getElementById('qtyPlus');
            
            minusBtn.disabled = value <= 1;
            plusBtn.disabled = value >= maxStock || maxStock === 0;
        }

        // Render Reviews
        function renderReviews(reviews, filter = 'all') {
            const container = document.getElementById('reviewsContent');
            
            if (!reviews || reviews.length === 0) {
                container.innerHTML = `<p class="text-secondary text-center py-4">Chưa có đánh giá nào cho sản phẩm này.</p>`;
                return;
            }

            let filteredReviews = reviews;
            if (filter !== 'all') {
                filteredReviews = reviews.filter(r => r.rating === parseInt(filter));
            }

            const total = reviews.length;
            const avg = (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1);
            
            let html = `
                <div class="row g-4 mb-4">
                    <div class="col-md-4 text-center">
                        <div class="display-1 fw-bold text-danger">${avg}</div>
                        <div class="stars-display fs-4">${renderStars(parseFloat(avg))}</div>
                        <span class="text-secondary">${total} đánh giá</span>
                    </div>
                    <div class="col-md-8">
            `;

            const distribution = {};
            for (let i = 5; i >= 1; i--) {
                const count = reviews.filter(r => r.rating === i).length;
                const percent = total > 0 ? (count / total * 100) : 0;
                distribution[i] = { count, percent };
            }

            for (let i = 5; i >= 1; i--) {
                const data = distribution[i] || { count: 0, percent: 0 };
                html += `
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="small text-secondary" style="width: 50px;">${i} sao</span>
                        <div class="rating-bar flex-grow-1">
                            <div class="rating-bar-fill" style="width: ${data.percent}%;"></div>
                        </div>
                        <span class="small text-secondary" style="width: 40px;">${Math.round(data.percent)}%</span>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;

            html += `
                <div class="d-flex flex-wrap gap-2 mb-4">
                    <button class="filter-review-btn ${filter === 'all' ? 'active' : ''}" onclick="filterReviews('all', this)">Tất cả</button>
                    <button class="filter-review-btn ${filter === 5 ? 'active' : ''}" onclick="filterReviews(5, this)">5 sao</button>
                    <button class="filter-review-btn ${filter === 4 ? 'active' : ''}" onclick="filterReviews(4, this)">4 sao</button>
                    <button class="filter-review-btn ${filter === 3 ? 'active' : ''}" onclick="filterReviews(3, this)">3 sao</button>
                    <button class="filter-review-btn ${filter === 2 ? 'active' : ''}" onclick="filterReviews(2, this)">2 sao</button>
                    <button class="filter-review-btn ${filter === 1 ? 'active' : ''}" onclick="filterReviews(1, this)">1 sao</button>
                </div>
            `;

            if (filteredReviews.length === 0) {
                html += `<p class="text-secondary text-center py-3">Không có đánh giá ${filter !== 'all' ? filter + ' sao' : ''}</p>`;
            } else {
                filteredReviews.forEach((review, index) => {
                    const colors = ['danger', 'warning', 'success', 'info', 'primary'];
                    const color = colors[index % colors.length];
                    html += `
                        <div class="review-item mb-3">
                            <div class="d-flex gap-3">
                                <div class="review-avatar bg-${color} bg-opacity-10 text-${color}">${review.avatar || review.user.substring(0, 2).toUpperCase()}</div>
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h6 class="fw-bold mb-0" style="font-family: 'Poppins', sans-serif;">${review.user}</h6>
                                            <div class="stars-display text-warning small">${renderStars(review.rating)}</div>
                                        </div>
                                        <span class="text-secondary small">${formatDate(review.date)}</span>
                                    </div>
                                    <p class="text-secondary mt-2 mb-0" style="font-size: 15px; line-height: 1.6;">${review.content}</p>
                                    ${review.helpful ? `
                                        <div class="mt-2">
                                            <span class="text-secondary small"><i class="bi bi-hand-thumbs-up"></i> ${review.helpful} người thấy hữu ích</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            container.innerHTML = html;
        }

        // Filter Reviews
        function filterReviews(filter, button) {
            currentRatingFilter = filter;
            renderReviews(allReviews, filter);
        }

        // Format Date
        function formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const now = new Date();
            const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            if (diff === 0) return 'Hôm nay';
            if (diff === 1) return 'Hôm qua';
            if (diff < 7) return `${diff} ngày trước`;
            if (diff < 30) return `${Math.floor(diff / 7)} tuần trước`;
            if (diff < 365) return `${Math.floor(diff / 30)} tháng trước`;
            return `${Math.floor(diff / 365)} năm trước`;
        }

        // Render Related Products
        function renderRelatedProducts(product, category = 'all') {
            const container = document.getElementById('relatedProducts');
            
            let relatedProducts = allProducts.filter(p => p.id !== product.id);
            
            if (category !== 'all') {
                relatedProducts = relatedProducts.filter(p => p.category === category);
            }
            
            if (relatedProducts.length < 6) {
                const additional = allProducts
                    .filter(p => p.id !== product.id && !relatedProducts.includes(p))
                    .slice(0, 6 - relatedProducts.length);
                relatedProducts = [...relatedProducts, ...additional];
            }

            relatedProducts = shuffleArray(relatedProducts).slice(0, 12);

            if (relatedProducts.length === 0) {
                container.innerHTML = `<p class="text-secondary">Không có sản phẩm liên quan.</p>`;
                return;
            }

            let html = '';
            relatedProducts.forEach((p, index) => {
                const globalIndex = allProducts.indexOf(p);
                const hasDiscount = p.isSale && p.currentPrice;
                const discountPercent = hasDiscount ? 
                    Math.round((1 - p.currentPrice / p.originalPrice) * 100) : 0;
                const displayPrice = p.currentPrice || p.originalPrice;

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

                const starsHtml = renderStars(p.rating || 0);

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
                <div class="product-card" onclick="window.location.href='?id=${p.id}'">
                    <div class="product-image-wrapper">
                        <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" loading="lazy">
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
                                <span><span class="rating-text">${p.rating || 0}</span></span>
                                <span class="review-count">(${p.reviews || 0})</span>
                            </div>
                            <div class="product-stock-info">
                                <i class="bi bi-box-seam"></i>
                                <span><span class="stock-number">${p.stock || 0}</span></span>
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
        }

        // Shuffle array
        function shuffleArray(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // Filter related by category
        function filterRelated(category, button) {
            currentRelatedCategory = category;
            document.querySelectorAll('#relatedCategories .category-filter-btn').forEach(btn => btn.classList.remove('active'));
            if (button) button.classList.add('active');
            renderRelatedProducts(productData, category);
        }

        // Scroll related products
        function scrollRelated(direction) {
            const container = document.getElementById('relatedProducts');
            const scrollAmount = 240;
            container.scrollBy({
                left: direction * scrollAmount,
                behavior: 'smooth'
            });
        }

        // Add to cart
        function addToCartDirect(index) {
            const product = allProducts[index];
            if (!product) return;
            alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
        }

        // Buy now
        function buyNow(index) {
            const product = allProducts[index];
            if (!product) return;
            alert(`Đang xử lý đơn hàng cho "${product.name}"...`);
        }

        // Load data on page load
        document.addEventListener('DOMContentLoaded', loadProductData);
    