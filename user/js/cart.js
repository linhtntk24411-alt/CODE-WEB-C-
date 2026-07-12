// Cart data
let cartItems = [];
let allProducts = [];
let selectedItems = new Set();
let discountApplied = 0;
let suggestedCategory = 'all';

// Load data
async function loadData() {
    try {
        const response = await fetch('../data/product.json');
        if (!response.ok) throw new Error('Không thể tải dữ liệu sản phẩm');
        const data = await response.json();
        allProducts = data.products || data;

        loadCartFromStorage();
        renderCart();
        renderSuggestedProducts('all');
        
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('cartContent').style.display = 'block';
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingSpinner').innerHTML = `
            <div class="text-center">
                <p class="text-danger">${error.message}</p>
                <button class="btn btn-primary-custom" onclick="loadData()">Thử lại</button>
            </div>
        `;
    }
}

// Load cart from localStorage
function loadCartFromStorage() {
    const saved = localStorage.getItem('cartItems');
    let parsedItems = [];

    if (saved) {
        try {
            parsedItems = JSON.parse(saved);
        } catch {
            parsedItems = [];
        }
    }

    const hasLegacyDemoItems = Array.isArray(parsedItems) && parsedItems.some(item =>
        [12, 30, 40].includes(item.productId) ||
        ['Bánh Donut', 'Trứng vui vẻ', 'Combo 3 gấu'].includes(item.variant)
    );

    cartItems = Array.isArray(parsedItems) ? parsedItems : [];
    if (hasLegacyDemoItems) {
        cartItems = [];
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: cartItems }));
        window.dispatchEvent(new Event('storage'));
    }

    selectedItems = new Set(cartItems.map((_, index) => index));
}


// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: cartItems }));
    window.dispatchEvent(new Event('storage'));
}

// Get product by ID
function getProductById(id) {
    return allProducts.find(p => p.id === id);
}

// Get variant price
function getVariantPrice(product, variantName) {
    if (!product.variants) return product.currentPrice || product.originalPrice;
    const variant = product.variants.find(v => v.name === variantName);
    return variant ? variant.price : (product.currentPrice || product.originalPrice);
}

// Get variant stock
function getVariantStock(product, variantName) {
    if (!product.variants) return product.stock || 0;
    const variant = product.variants.find(v => v.name === variantName);
    return variant ? variant.stock : 0;
}

// Get variant names
function getVariantNames(product) {
    if (!product.variants) return [];
    return product.variants.map(v => v.name);
}

// Render cart
function renderCart() {
    const tbody = document.getElementById('cartItems');
    
    if (cartItems.length === 0) {
        document.getElementById('emptyCart').style.display = 'block';
        document.getElementById('cartTable').style.display = 'none';
        document.getElementById('itemCount').textContent = '0';
        document.getElementById('summaryItemCount').textContent = '0';
        // Kiểm tra tồn tại của element trước khi set
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = '0';
            cartCount.style.display = 'none';
        }
        return;
    }

    document.getElementById('emptyCart').style.display = 'none';
    document.getElementById('cartTable').style.display = 'block';

    let html = '';
    let subtotal = 0;
    let totalItems = 0;

    cartItems.forEach((item, index) => {
        const product = getProductById(item.productId);
        if (!product) return;

        const variantName = item.variant || (product.variants ? product.variants[0].name : null);
        const price = getVariantPrice(product, variantName);
        const stock = getVariantStock(product, variantName);
        const total = price * item.quantity;
        const isSelected = selectedItems.has(index);
        const variants = getVariantNames(product);

        subtotal += isSelected ? total : 0;
        totalItems += isSelected ? item.quantity : 0;

        const hasDiscount = product.isSale && product.currentPrice;
        const originalPrice = hasDiscount ? product.originalPrice : null;

        let variantHtml = '';
        if (variants.length > 0) {
            variantHtml = `
                <select class="variant-selector" onchange="changeVariant(${index}, this.value)">
                    ${variants.map(v => `
                        <option value="${v}" ${v === variantName ? 'selected' : ''}>${v}</option>
                    `).join('')}
                </select>
            `;
        } else {
            variantHtml = `<span class="variant-default">Mặc định</span>`;
        }

        html += `
            <tr class="cart-item">
                <td>
                    <input class="form-check-input" type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="toggleItem(${index})">
                </td>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <img src="${product.image || 'https://via.placeholder.com/80'}" alt="${product.name}" class="cart-item-img">
                        <div>
                            <div class="cart-item-title">${product.name}</div>
                            <div class="cart-item-variant-label">${product.category ? product.category : ''}</div>
                        </div>
                    </div>
                </td>
                <td>
                    ${variantHtml}
                </td>
                <td style="text-align: center;">
                    <span class="price-current">${formatPrice(price)}</span>
                    ${originalPrice ? `<span class="price-original">${formatPrice(originalPrice)}</span>` : ''}
                </td>
                <td style="text-align: center;">
                    <div class="qty-wrapper">
                        <button class="qty-btn" onclick="updateQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="bi bi-dash"></i>
                        </button>
                        <input type="number" class="qty-input-cart" value="${item.quantity}" 
                               min="1" max="${stock}" onchange="updateQuantityInput(${index}, this.value)">
                        <button class="qty-btn" onclick="updateQuantity(${index}, 1)" ${item.quantity >= stock ? 'disabled' : ''}>
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                </td>
                <td style="text-align: center;">
                    <span class="price-total">${formatPrice(total)}</span>
                </td>
                <td>
                    <button class="remove-btn" onclick="removeItem(${index})">
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    document.getElementById('itemCount').textContent = cartItems.length;
    document.getElementById('summaryItemCount').textContent = cartItems.filter((_, i) => selectedItems.has(i)).length;
    
    // Kiểm tra tồn tại của element trước khi set
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        cartCount.textContent = totalQuantity;
        cartCount.style.display = totalQuantity > 0 ? 'flex' : 'none';
    }
    
    updateSummary(subtotal);
}

// Change variant
function changeVariant(index, newVariant) {
    const item = cartItems[index];
    const product = getProductById(item.productId);
    
    const stock = getVariantStock(product, newVariant);
    if (stock === 0) {
        alert('Phân loại này đã hết hàng!');
        renderCart();
        return;
    }

    if (item.quantity > stock) {
        item.quantity = stock;
    }

    item.variant = newVariant;
    saveCartToStorage();
    renderCart();
}

// Update summary
function updateSummary(subtotal) {
    const discount = discountApplied;
    const total = subtotal - discount;
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    
    if (discount > 0) {
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('discountAmount').textContent = `-${formatPrice(discount)}`;
    } else {
        document.getElementById('discountRow').style.display = 'none';
    }
    
    document.getElementById('totalPrice').textContent = formatPrice(total);
}

// Update quantity
function updateQuantity(index, change) {
    const item = cartItems[index];
    const product = getProductById(item.productId);
    const stock = getVariantStock(product, item.variant);
    
    let newQty = item.quantity + change;
    if (newQty < 1) newQty = 1;
    if (newQty > stock) {
        alert(`Chỉ còn ${stock} sản phẩm trong kho`);
        newQty = stock;
    }
    
    item.quantity = newQty;
    saveCartToStorage();
    renderCart();
}

// Update quantity input
function updateQuantityInput(index, value) {
    const item = cartItems[index];
    const product = getProductById(item.productId);
    const stock = getVariantStock(product, item.variant);
    
    let newQty = parseInt(value);
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    if (newQty > stock) {
        alert(`Chỉ còn ${stock} sản phẩm trong kho`);
        newQty = stock;
    }
    
    item.quantity = newQty;
    saveCartToStorage();
    renderCart();
}

// Toggle item selection
function toggleItem(index) {
    if (selectedItems.has(index)) {
        selectedItems.delete(index);
    } else {
        selectedItems.add(index);
    }
    renderCart();
}

// Toggle select all
function toggleSelectAll() {
    const checked = document.getElementById('selectAll').checked;
    if (checked) {
        cartItems.forEach((_, index) => selectedItems.add(index));
    } else {
        selectedItems.clear();
    }
    renderCart();
}

// Remove item
function removeItem(index) {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        cartItems.splice(index, 1);
        selectedItems.clear();
        cartItems.forEach((_, i) => selectedItems.add(i));
        saveCartToStorage();
        renderCart();
        renderSuggestedProducts(suggestedCategory);
    }
}

// Apply promo code
function applyPromo() {
    const code = document.getElementById('promoCode').value.trim();
    if (!code) {
        alert('Vui lòng nhập mã giảm giá');
        return;
    }
    
    const subtotal = cartItems.reduce((sum, item, index) => {
        if (!selectedItems.has(index)) return sum;
        const product = getProductById(item.productId);
        const price = getVariantPrice(product, item.variant);
        return sum + price * item.quantity;
    }, 0);
    
    if (typeof window.validateCoupon === 'function') {
        const result = window.validateCoupon(code, subtotal);
        if (result.success) {
            if (result.isFreeShip) {
                discountApplied = 0;
                localStorage.setItem('appliedPromoCode', code.toUpperCase());
                alert('Áp dụng mã FREESHIP thành công! Phí vận chuyển sẽ được miễn phí ở trang thanh toán.');
            } else {
                discountApplied = result.discountAmount;
                localStorage.setItem('appliedPromoCode', code.toUpperCase());
                alert(`Áp dụng mã thành công! Bạn được giảm ${formatPrice(discountApplied)}`);
            }
            renderCart();
        } else {
            alert(result.message);
        }
    } else {
        // Fallback đơn giản nếu chưa nạp main.js kịp
        if (code.toUpperCase() === 'URII10') {
            discountApplied = Math.floor(subtotal * 0.1);
            localStorage.setItem('appliedPromoCode', 'URII10');
            alert(`Áp dụng mã thành công! Bạn được giảm ${formatPrice(discountApplied)}`);
            renderCart();
        } else {
            alert('Mã giảm giá không hợp lệ hoặc hệ thống chưa tải xong.');
        }
    }
}

// Render stars
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

// Format price
function formatPrice(price) {
    if (!price) return '0₫';
    return price.toLocaleString('vi-VN') + '₫';
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

// Render suggested products
function renderSuggestedProducts(category = 'all') {
    const container = document.getElementById('suggestedProducts');
    
    // Get products not in cart
    const cartProductIds = new Set(cartItems.map(item => item.productId));
    let suggested = allProducts.filter(p => !cartProductIds.has(p.id));
    
    if (category !== 'all') {
        suggested = suggested.filter(p => p.category === category);
    }
    
    suggested = shuffleArray(suggested).slice(0, 12);

    if (suggested.length === 0) {
        container.innerHTML = `<p class="text-secondary py-4">Không có sản phẩm gợi ý.</p>`;
        return;
    }

    let html = '';
    suggested.forEach(p => {
        const hasDiscount = p.isSale && p.currentPrice;
        const discountPercent = hasDiscount ? Math.round((1 - p.currentPrice / p.originalPrice) * 100) : 0;
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
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
                <div class="product-image-wrapper">
                    <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" loading="lazy">
                    ${badgeHtml}
                    <button class="cart-icon" onclick="event.stopPropagation(); addToCartFromSuggestion(${p.id})">
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
                        <button class="btn-buy" onclick="event.stopPropagation(); addToCartFromSuggestion(${p.id})">
                            <i class="bi bi-bag"></i> Mua ngay
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Add to cart from suggestion
function addToCartFromSuggestion(productId) {
    const product = getProductById(productId);
    if (!product) return;

    const existing = cartItems.find(item => item.productId === productId);
    if (existing) {
        const stock = getVariantStock(product, existing.variant);
        if (existing.quantity < stock) {
            existing.quantity++;
            saveCartToStorage();
            renderCart();
            renderSuggestedProducts(suggestedCategory);
            alert(`Đã thêm 1 "${product.name}" vào giỏ hàng!`);
        } else {
            alert('Sản phẩm đã đạt số lượng tối đa trong kho');
        }
        return;
    }

    const variantName = product.variants ? product.variants[0].name : null;
    cartItems.push({
        productId: productId,
        variant: variantName,
        quantity: 1
    });
    
    selectedItems.add(cartItems.length - 1);
    saveCartToStorage();
    renderCart();
    renderSuggestedProducts(suggestedCategory);
    alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
}

// Filter suggested by category
function filterSuggested(category, button) {
    suggestedCategory = category;
    document.querySelectorAll('#suggestedCategories .category-filter-btn').forEach(btn => btn.classList.remove('active'));
    if (button) button.classList.add('active');
    renderSuggestedProducts(category);
}

// Scroll suggested products
function scrollSuggested(direction) {
    const container = document.getElementById('suggestedProducts');
    const scrollAmount = 240;
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

function refreshCartView() {
    loadCartFromStorage();
    renderCart();
    renderSuggestedProducts(suggestedCategory);
}

// =============================================================
// CART.JS - TÍCH HỢP AUTH ĐỂ CHUYỂN SANG CHECKOUT
// =============================================================

// =============================================================
// KIỂM TRA ĐĂNG NHẬP VÀ CHUYỂN SANG CHECKOUT
// =============================================================

function proceedToCheckout() {
    // Kiểm tra xem có sản phẩm nào được chọn không
    const selectedItemsCount = cartItems.filter((_, index) => selectedItems.has(index)).length;
    
    if (selectedItemsCount === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
        return;
    }

    // Kiểm tra đăng nhập từ localStorage (do header.js quản lý)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Chưa đăng nhập - chuyển đến trang đăng nhập
        if (confirm('Bạn cần đăng nhập để tiến hành thanh toán. Bạn có muốn đăng nhập ngay không?')) {
            // Lưu action để sau khi đăng nhập sẽ tự động chuyển sang checkout
            localStorage.setItem('checkoutAction', 'true');
            // Lưu lại trang hiện tại để quay lại sau khi đăng nhập
            localStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
        }
        return;
    }

    // Đã đăng nhập - lọc các sản phẩm được chọn
    const selectedCartItems = cartItems.filter((_, index) => selectedItems.has(index));
    
    // Lưu danh sách sản phẩm đã chọn vào localStorage
    localStorage.setItem('checkoutItems', JSON.stringify(selectedCartItems));
    
    // Chuyển sang trang checkout
    window.location.href = 'checkout.html';
}

// =============================================================
// CẬP NHẬT NÚT THANH TOÁN THEO TRẠNG THÁI ĐĂNG NHẬP
// =============================================================

function updateCheckoutButton() {
    const checkoutBtn = document.querySelector('.btn-primary-custom.w-100');
    if (!checkoutBtn) return;
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Clone để xóa sự kiện cũ
    const newBtn = checkoutBtn.cloneNode(true);
    checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
    
    // Cập nhật nội dung nút
    if (!isLoggedIn) {
        newBtn.innerHTML = `<i class="bi bi-box-arrow-in-right me-2"></i>Đăng nhập để thanh toán`;
    } else {
        newBtn.innerHTML = `<i class="bi bi-credit-card me-2"></i>Tiến hành thanh toán`;
    }
    
    // Thêm sự kiện mới
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!isLoggedIn) {
            // Nếu chưa đăng nhập, chuyển đến trang login
            localStorage.setItem('redirectAfterLogin', window.location.href);
            localStorage.setItem('checkoutAction', 'true');
            window.location.href = 'login.html';
        } else {
            proceedToCheckout();
        }
    });
}

// =============================================================
// XỬ LÝ REDIRECT SAU KHI ĐĂNG NHẬP
// =============================================================

function handleRedirectAfterLogin() {
    const checkoutAction = localStorage.getItem('checkoutAction');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (checkoutAction === 'true' && isLoggedIn) {
        // Xóa flag để không lặp lại
        localStorage.removeItem('checkoutAction');
        localStorage.removeItem('redirectAfterLogin');
        
        // Chờ một chút để header cập nhật xong
        setTimeout(() => {
            // Load lại dữ liệu giỏ hàng
            loadCartFromStorage();
            renderCart();
            // Tiến hành thanh toán
            proceedToCheckout();
        }, 500);
    }
}

// =============================================================
// LẮNG NGHE SỰ KIỆN TỪ HEADER
// =============================================================

// Lắng nghe sự kiện auth:changed từ header
document.addEventListener('auth:changed', function() {
    updateCheckoutButton();
    loadCartFromStorage();
    renderCart();
});

// Lắng nghe storage change để cập nhật UI
window.addEventListener('storage', function(e) {
    if (e.key === 'isLoggedIn') {
        updateCheckoutButton();
        loadCartFromStorage();
        renderCart();
    }
});

// =============================================================
// GỌI KHI DOM READY
// =============================================================

// Mở rộng DOMContentLoaded đã có
document.addEventListener('DOMContentLoaded', function() {
    // Cập nhật nút thanh toán
    updateCheckoutButton();
    // Xử lý redirect sau khi đăng nhập
    handleRedirectAfterLogin();
});

// =============================================================
// EXPORT
// =============================================================

window.proceedToCheckout = proceedToCheckout;
window.updateCheckoutButton = updateCheckoutButton;
window.handleRedirectAfterLogin = handleRedirectAfterLogin;

window.addEventListener('cart:updated', refreshCartView);
window.addEventListener('storage', refreshCartView);

// Load data on page load
document.addEventListener('DOMContentLoaded', loadData);