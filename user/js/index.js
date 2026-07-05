// ============================================
// MAIN.JS - TẤT CẢ JAVASCRIPT CỦA WEB
// ============================================

let homepageProducts = [];

function getStoredCartItems() {
    try {
        const saved = localStorage.getItem('cartItems');
        const parsed = saved ? JSON.parse(saved) : [];
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

window.addCurrentProductToCart = function(productId) {
    const product = homepageProducts.find(item => item.id === productId);
    if (!product) return;

    const cartItems = getStoredCartItems();
    const existingItem = cartItems.find(item => item.productId === product.id && (item.variant || null) === null);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({ productId: product.id, variant: null, quantity: 1 });
    }

    saveStoredCartItems(cartItems);
    alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
};

document.addEventListener('DOMContentLoaded', function() {
    // ===== DATA =====
    const valuesData = [
        {
            icon: 'bi-shield-check',
            title: 'Chất liệu an toàn',
            desc: 'Hạt nhựa nguyên sinh không độc hại, an toàn cho mọi lứa tuổi'
        },
        {
            icon: 'bi-truck',
            title: 'Giao hàng nhanh chóng',
            desc: 'Ship COD toàn quốc, kiểm hàng trước khi nhận'
        },
        {
            icon: 'bi-headset',
            title: 'Hỗ trợ 24/7',
            desc: 'Tặng map mẫu và hướng dẫn ủi nhiệt miễn phí'
        }
    ];

    const categoriesData = [
        { name: 'Bộ KIT DIY', image: '../assets/index/kit.jpg', category: 'kit' },
        { name: 'Dụng Cụ', image: '../assets/index/dungcu.png', category: 'tool' },
        { name: 'Hạt Lẻ Các Loại', image: '../assets/index/hatrefill.png', category: 'bead' },
        { name: 'Phụ Kiện Handmade', image: '../assets/index/handmade.jpg', category: 'accessory' }
    ];

    const stepsData = [
        {
            number: '01',
            image: '../assets/index/step1.png',
            title: 'Xếp hạt lên bảng đinh',
            desc: 'Chọn màu sắc và xếp hạt nhựa lên bảng đinh theo map mẫu'
        },
        {
            number: '02',
            image: '../assets/index/step2.png',
            title: 'Phủ giấy nến & Ủi nhiệt',
            desc: 'Đặt giấy nến lên trên và ủi ở nhiệt độ phù hợp'
        },
        {
            number: '03',
            image: '../assets/index/step3.png',
            title: 'Hoàn thành tác phẩm',
            desc: 'Tháo sản phẩm hoàn thiện ra khỏi bảng đinh'
        }
    ];

    const galleryData = [
        '../assets/index/stcd1.png',
        '../assets/index/stcd2.png',
        '../assets/index/stcd3.png',
        '../assets/index/stcd4.png',
        '../assets/index/stcd5.png',
        '../assets/index/stcd6.png'
    ];

    // ===== RENDER FUNCTIONS =====
    function renderValues() {
        const grid = document.getElementById('valuesGrid');
        if (!grid) return;
        grid.innerHTML = valuesData.map(item => `
            <div class="value-card">
                <div class="value-icon"><i class="bi ${item.icon}"></i></div>
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
            </div>
        `).join('');
    }

    function renderCategories() {
        const grid = document.getElementById('categoryGrid');
        if (!grid) return;
        grid.innerHTML = categoriesData.map(item => `
            <a href="product.html?category=${item.category}" class="category-card-link" aria-label="Xem ${item.name}">
                <article class="category-card img-hover-effect">
                    <div class="category-card__media">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <h3>${item.name}</h3>
                </article>
            </a>
        `).join('');
    }

    function renderProducts(products) {
        const grid = document.getElementById('productGrid');
        if (!grid) return;
        grid.innerHTML = products.map(item => `
            <article class="product-card">
                <div class="product-card__media">
                    <a href="productdetail.html?id=${item.id}" class="d-block" aria-label="Xem chi tiết ${item.name}">
                        <img src="${item.image}" alt="${item.name}">
                    </a>
                    ${item.isSale ? `<span class="product-card__badge product-card__badge--sale">${item.badge}</span>` : ''}
                </div>
                <div class="product-card__body">
                    <h3>${item.name}</h3>

                    <div class="product-card__stock">
                        <div class="stock-info">
                            <span class="stock-label"><i class="bi bi-fire"></i></span>
                            <span class="stock-text">Còn lại <strong class="stock-count">${item.stock}</strong> sản phẩm</span>
                        </div>
                        <div class="stock-bar">
                            <div class="stock-bar__fill" style="width: ${item.stockPercent}%;"></div>
                        </div>
                    </div>

                    <div class="product-card__footer">
                        <div class="product-card__pricing">
                            ${item.isSale ? `
                                <span class="price price--original">${item.originalPrice.toLocaleString()}đ</span>
                                <span class="price price--current">${item.currentPrice.toLocaleString()}đ</span>
                            ` : `
                                <span class="price">${item.originalPrice.toLocaleString()}đ</span>
                            `}
                        </div>
                        <button class="btn btn-urii btn-sm" type="button" onclick="addCurrentProductToCart(${item.id})">
                            <i class="bi bi-cart"></i>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    function renderSteps() {
        const grid = document.getElementById('stepsGrid');
        if (!grid) return;
        grid.innerHTML = stepsData.map((item, index) => {
            const isLast = index === stepsData.length - 1;
            return `
                <div class="step-card">
                    <div class="step-number">${item.number}</div>
                    <div class="step-image">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <h3>${item.title}</h3>
                    <p>${item.desc}</p>
                </div>
                ${!isLast ? '<div class="step-arrow">→</div>' : ''}
            `;
        }).join('');
    }

    function renderGallery() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;
        grid.innerHTML = galleryData.map(img => `
            <article class="gallery-item img-hover-effect">
                <img src="${img}" alt="Góc sáng tạo">
            </article>
        `).join('');
    }

    function renderBestSellerTimer(products) {
        const wrapper = document.getElementById('bestSellerTimerWrap');
        if (!wrapper) return;

        const primaryProduct = products.find(item => item.isSale) || null;
        if (!primaryProduct) {
            wrapper.innerHTML = '';
            return;
        }

        const hours = primaryProduct.hours ?? 0;
        const minutes = primaryProduct.minutes ?? 0;
        const seconds = primaryProduct.seconds ?? 0;

        wrapper.innerHTML = `
            <div class="section-header__timer">
                <span class="section-header__timer-label"><i class="bi bi-clock-history"></i> Flash sale</span>
                <span class="timer-countdown section-timer-countdown" data-end="${primaryProduct.timer}">
                    <span class="timer-hours">${String(hours).padStart(2, '0')}</span>
                    <span class="timer-separator">:</span>
                    <span class="timer-minutes">${String(minutes).padStart(2, '0')}</span>
                    <span class="timer-separator">:</span>
                    <span class="timer-seconds">${String(seconds).padStart(2, '0')}</span>
                </span>
            </div>
        `;
    }

    // ===== COUNTDOWN TIMER =====
    function initCountdownTimers() {
        const timers = document.querySelectorAll('.timer-countdown');
        timers.forEach(timer => {
            const endTime = new Date(timer.dataset.end).getTime();
            
            function updateTimer() {
                const now = new Date().getTime();
                const distance = endTime - now;
                
                if (distance < 0) {
                    timer.innerHTML = '<span class="timer-expired">Đã kết thúc</span>';
                    return;
                }
                
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                const hoursEl = timer.querySelector('.timer-hours');
                const minutesEl = timer.querySelector('.timer-minutes');
                const secondsEl = timer.querySelector('.timer-seconds');
                
                if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
                if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
                if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
            }
            
            updateTimer();
            setInterval(updateTimer, 1000);
        });
    }

    // ===== LOAD PRODUCTS FROM JSON =====
    function loadProducts() {
        fetch('../data/product.json')
            .then(response => response.json())
            .then(data => {
                // Lọc sản phẩm đang sale để hiển thị
                const bestSellers = data.products.filter(p => p.isSale === true).slice(0, 4);
                homepageProducts = bestSellers;
                renderProducts(bestSellers);
                renderBestSellerTimer(bestSellers);
                initCountdownTimers();
            })
            .catch(error => {
                console.error('Lỗi tải dữ liệu:', error);
                // Fallback: dùng dữ liệu mẫu nếu không load được JSON
                const fallbackProducts = [
                    {
                        id: 1,
                        name: 'Set Cơ Bản 24 Màu',
                        image: '../assets/index/banchay.png',
                        isSale: true,
                        badge: '-20%',
                        originalPrice: 86000,
                        currentPrice: 69000,
                        stock: 15,
                        stockPercent: 30,
                        timer: '2026-07-01 23:59:59',
                        hours: 12,
                        minutes: 30,
                        seconds: 45
                    },
                    {
                        id: 2,
                        name: 'Móc Khóa Worldcup',
                        image: '../assets/index/worldcup.jpg',
                        isSale: true,
                        badge: '-15%',
                        originalPrice: 41000,
                        currentPrice: 35000,
                        stock: 8,
                        stockPercent: 16,
                        timer: '2026-07-01 23:59:59',
                        hours: 8,
                        minutes: 20,
                        seconds: 10
                    }
                ];
                homepageProducts = fallbackProducts;
                renderProducts(fallbackProducts);
                renderBestSellerTimer(fallbackProducts);
                initCountdownTimers();
            });
    }

    // ============================================
    // ===== VOUCHER POPUP =====
    // ============================================
    
    const popup = document.getElementById('voucherPopup');
    const closeBtn = document.getElementById('closePopup');
    const overlay = document.getElementById('popupOverlay');
    const form = document.getElementById('voucherForm');

    // Mở popup
    function openPopup() {
        if (popup) {
            popup.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Đóng popup
    function closePopup() {
        if (popup) {
            popup.classList.remove('active');
            document.body.style.overflow = '';
            // Reset form
            const formEl = document.querySelector('.voucher-popup__form');
            const thankYou = document.getElementById('thankYou');
            if (formEl) formEl.style.display = 'flex';
            if (thankYou) thankYou.classList.remove('active');
            if (form) form.reset();
        }
    }

    // Bắt sự kiện click vào nút "Nhận Voucher Ngay"
    document.querySelectorAll('.btn-urii').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.textContent.includes('Voucher') || this.textContent.includes('Nhận')) {
                e.preventDefault();
                openPopup();
            }
        });
    });

    // Đóng popup
    if (closeBtn) {
        closeBtn.addEventListener('click', closePopup);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closePopup);
    }

    // ESC đóng popup
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popup && popup.classList.contains('active')) {
            closePopup();
        }
    });

    // ===== XỬ LÝ SUBMIT FORM =====
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value.trim();
            const birthday = document.getElementById('birthday').value;
            const phone = document.getElementById('phone').value.trim();
            
            if (!fullName || !birthday || !phone) {
                alert('Vui lòng điền đầy đủ thông tin!');
                return;
            }
            
            // Validate số điện thoại (10 số)
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone)) {
                alert('Vui lòng nhập số điện thoại hợp lệ (10 số)!');
                return;
            }
            
            // Kiểm tra tuổi
            const birthDate = new Date(birthday);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < 6) {
                alert('Bạn phải từ 6 tuổi trở lên để nhận voucher!');
                return;
            }
            
            // Lưu dữ liệu
            const userData = {
                fullName: fullName,
                birthday: birthday,
                phone: phone,
                age: age,
                receivedAt: new Date().toISOString()
            };
            
            let users = JSON.parse(localStorage.getItem('voucherUsers')) || [];
            users.push(userData);
            localStorage.setItem('voucherUsers', JSON.stringify(users));
            
            console.log('📝 Thông tin khách hàng:', userData);
            console.log('📊 Tổng số người đăng ký:', users.length);
            
            // Hiển thị thành công
            const formEl = document.querySelector('.voucher-popup__form');
            const thankYou = document.getElementById('thankYou');
            
            if (formEl) formEl.style.display = 'none';
            if (thankYou) thankYou.classList.add('active');
            
            setTimeout(function() {
                closePopup();
            }, 4000);
        });
    }

    // Set max date cho ngày sinh
    const birthdayInput = document.getElementById('birthday');
    if (birthdayInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        birthdayInput.max = `${year}-${month}-${day}`;
    }

    // ===== RUN ALL =====
    renderValues();
    renderCategories();
    renderSteps();
    renderGallery();
    loadProducts();
});