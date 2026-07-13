// =============================================================
// CHECKOUT.JS - Xử lý trang thanh toán (Có validate trực tiếp)
// =============================================================

// Biến toàn cục
let cartItems = [];
let allProducts = [];
let userData = null;
let promoCode = '';
let discountPercent = 0;
let discountAmount = 0;
let isFreeShip = false;
let toastInstance = null;
let selectedAddressId = null;
let addresses = [];

// Dữ liệu địa chỉ từ API
let provinceData = [];
let wardData = [];

// Select2 instances
let provinceSelect2 = null;
let wardSelect2 = null;

// API endpoints - API V2
const API_BASE = 'https://provinces.open-api.vn/api/v2';

// Danh sách ngân hàng
const banks = [
    { name: 'Vietcombank', img: '../assets/vcb.png' },
    { name: 'Techcombank', img: '../assets/tcb.jpg' },
    { name: 'BIDV', img: '../assets/bidv.png' },
    { name: 'VietinBank', img: '../assets/viettin.png' },
    { name: 'Agribank', img: '../assets/agri.png' },
    { name: 'MB Bank', img: '../assets/MB.png' },
    { name: 'ACB', img: '../assets/acb.jpg' },
    { name: 'TPBank', img: '../assets/tp.jpg' },
    { name: 'Sacombank', img: '../assets/scb.png' },
    { name: 'VPBank', img: '../assets/vp.jpg' }
];

// =============================================================
// KHỞI TẠO
// =============================================================

// =============================================================
// KIỂM TRA ĐĂNG NHẬP KHI VÀO TRANG CHECKOUT
// =============================================================

document.addEventListener('DOMContentLoaded', function() {
    // LOG ĐỂ DEBUG
    console.log('Checkout page loaded');
    console.log('isLoggedIn:', localStorage.getItem('isLoggedIn'));
    console.log('userEmail:', localStorage.getItem('userEmail'));
    console.log('userName:', localStorage.getItem('userName'));
    
    // Kiểm tra đăng nhập
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    
    // NẾU CHƯA ĐĂNG NHẬP HOẶC KHÔNG CÓ EMAIL
    if (!isLoggedIn || !userEmail) {
        console.log('User not logged in, redirecting to login');
        if (typeof window.ariiAlert === 'function') {
            window.ariiAlert('Vui lòng đăng nhập để thanh toán', {
                type: 'info',
                callback: () => {
                    localStorage.setItem('redirectAfterLogin', window.location.href);
                    localStorage.setItem('checkoutAction', 'true');
                    window.location.href = 'login.html';
                }
            });
        } else {
            alert('Vui lòng đăng nhập để thanh toán');
            localStorage.setItem('redirectAfterLogin', window.location.href);
            localStorage.setItem('checkoutAction', 'true');
            window.location.href = 'login.html';
        }
        return;
    }
    
    console.log('User is logged in, loading checkout...');
    
    // Nếu đã đăng nhập, tiếp tục load trang
    includeHeaderFooter();
    initToast();
    
    // Nạp dữ liệu sản phẩm trước, sau đó nạp giỏ hàng
    fetch('../data/product.json')
        .then(res => res.json())
        .then(data => {
            allProducts = data.products || [];
            console.log('Loaded products in checkout:', allProducts.length);
            loadCartData();
            
            // Tải thông tin chi tiết người dùng (bao gồm phone và address)
            return loadUserData();
        })
        .then(() => {
            // Chỉ tải địa chỉ, khu vực, ngân hàng sau khi có thông tin người dùng
            loadAddresses();
            loadProvinces();
            renderBanks();
            initSelect2();
        })
        .catch(err => {
            console.error('Failed to initialize checkout page data:', err);
            loadAddresses();
            loadProvinces();
            renderBanks();
            initSelect2();
        });
        
    // Đảm bảo header hiển thị đúng sau khi load
    setTimeout(function() {
        if (typeof window.checkAndUpdateAuthState === 'function') {
            window.checkAndUpdateAuthState();
        }
        if (typeof window.initHeader === 'function') {
            window.initHeader();
        }
    }, 300);
});

// =============================================================
// LẮNG NGHE SỰ KIỆN AUTH CHANGED
// =============================================================

document.addEventListener('auth:changed', function() {
    console.log('Auth changed in checkout - reloading data');
    
    // Kiểm tra lại trạng thái đăng nhập
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    
    if (!isLoggedIn || !userEmail) {
        console.log('User logged out, redirecting to login');
        if (typeof window.ariiAlert === 'function') {
            window.ariiAlert('Vui lòng đăng nhập để thanh toán', {
                type: 'info',
                callback: () => {
                    localStorage.setItem('redirectAfterLogin', window.location.href);
                    localStorage.setItem('checkoutAction', 'true');
                    window.location.href = 'login.html';
                }
            });
        } else {
            alert('Vui lòng đăng nhập để thanh toán');
            localStorage.setItem('redirectAfterLogin', window.location.href);
            localStorage.setItem('checkoutAction', 'true');
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Reload dữ liệu
    loadUserData().then(() => {
        loadAddresses();
        renderOrderSummary();
    });
    
    // Cập nhật header
    if (typeof window.initHeader === 'function') {
        window.initHeader();
    }
});

// Lắng nghe storage change
window.addEventListener('storage', function(e) {
    if (e.key === 'isLoggedIn' || e.key === 'userName' || e.key === 'userEmail') {
        console.log('Storage changed in checkout:', e.key);
        
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userEmail = localStorage.getItem('userEmail');
        
        if (!isLoggedIn || !userEmail) {
            console.log('User logged out, redirecting to login');
            window.location.href = 'login.html';
        } else {
            loadUserData().then(() => {
                loadAddresses();
                renderOrderSummary();
            });
            if (typeof window.initHeader === 'function') {
                window.initHeader();
            }
        }
    }
});

// =============================================================
// NHÚNG HEADER & FOOTER
// =============================================================

function includeHeaderFooter() {
    fetch('../components/header.html')
        .then(res => res.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            // ĐỢI HEADER RENDER XONG RỒI CẬP NHẬT TRẠNG THÁI
            setTimeout(function() {
                if (typeof window.checkAndUpdateAuthState === 'function') {
                    window.checkAndUpdateAuthState();
                }
                if (typeof window.initHeader === 'function') {
                    window.initHeader();
                }
            }, 200);
        })
        .catch(() => console.warn('Header not found'));
    
    fetch('../components/footer.html')
        .then(res => res.text())
        .then(data => document.getElementById('footer-placeholder').innerHTML = data)
        .catch(() => console.warn('Footer not found'));
}
// =============================================================
// KHỞI TẠO SELECT2 (CHỈ CÓ TỈNH VÀ PHƯỜNG/XÃ)
// =============================================================

function initSelect2() {
    console.log('Initializing Select2...');
    
    // Cấu hình Select2 chung
    const select2Config = {
        theme: 'bootstrap-5',
        width: '100%',
        placeholder: '-- Chọn --',
        allowClear: true,
        dropdownParent: $('#addressManagerModal')
    };

    // Province Select2
    provinceSelect2 = $('#newProvince').select2({
        ...select2Config,
        placeholder: '-- Nhập tên Tỉnh / Thành phố --',
        language: {
            searching: function() { return 'Đang tìm kiếm...'; },
            noResults: function() { return 'Không tìm thấy kết quả'; }
        }
    });

    // Ward Select2
    wardSelect2 = $('#newWard').select2({
        ...select2Config,
        placeholder: '-- Chọn Phường / Xã --',
        data: []
    });

    // ====== SỰ KIỆN CHANGE CHO PROVINCE ======
    $('#newProvince').off('change').on('change', function() {
        const provinceCode = $(this).val();
        console.log('Đã chọn tỉnh:', provinceCode);
        
        // Xóa lỗi khi đã chọn
        clearError('newProvince');
        
        if (provinceCode) {
            // Reset ward với placeholder đang tải
            wardSelect2.empty().select2({
                ...select2Config,
                placeholder: '-- Đang tải phường/xã... --',
                data: []
            });
            
            // Load wards trực tiếp từ tỉnh
            loadWardsByProvince(provinceCode);
        } else {
            // Nếu bỏ chọn tỉnh
            wardSelect2.empty().select2({
                ...select2Config,
                placeholder: '-- Chọn Phường / Xã --',
                data: []
            });
        }
    });

    // ====== SỰ KIỆN CHANGE CHO WARD ======
    $('#newWard').on('change', function() {
        clearError('newWard');
    });

    console.log('Select2 initialized successfully');
}

// =============================================================
// TẢI DỮ LIỆU ĐỊA CHỈ TỪ API V2
// =============================================================

// 1. Load Tỉnh/Thành phố
async function loadProvinces() {
    try {
        console.log('Loading provinces...');
        const response = await fetch(`${API_BASE}/p/`);
        if (!response.ok) throw new Error('Failed to fetch provinces');
        provinceData = await response.json();
        
        console.log('Số tỉnh/thành tìm thấy:', provinceData.length);
        
        const options = provinceData.map(p => ({
            id: p.code,
            text: p.name
        }));
        
        // Cập nhật Province Select2
        if (provinceSelect2) {
            provinceSelect2.empty().select2({
                data: options,
                theme: 'bootstrap-5',
                width: '100%',
                placeholder: '-- Nhập tên Tỉnh / Thành phố --',
                allowClear: true,
                dropdownParent: $('#addressManagerModal'),
                language: {
                    searching: function() { return 'Đang tìm kiếm...'; },
                    noResults: function() { return 'Không tìm thấy kết quả'; }
                }
            });
        }

    } catch (error) {
        console.error('Error loading provinces:', error);
        showToast('Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại sau.');
    }
}

// 2. Load Phường/Xã TRỰC TIẾP từ Tỉnh/Thành phố
async function loadWardsByProvince(provinceCode) {
    try {
        console.log('Đang tải phường/xã cho tỉnh code:', provinceCode);
        
        const response = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`);
        if (!response.ok) throw new Error('Failed to fetch wards');
        const data = await response.json();
        
        console.log('Data từ API:', data);
        
        wardData = data.wards || [];
        
        console.log('Số phường/xã tìm thấy:', wardData.length);
        
        if (wardData.length === 0) {
            showToast('Không tìm thấy phường/xã cho tỉnh này');
            wardSelect2.empty().select2({
                data: [{ id: '', text: '-- Không có dữ liệu --' }],
                theme: 'bootstrap-5',
                width: '100%',
                placeholder: '-- Chọn Phường / Xã --',
                allowClear: true,
                dropdownParent: $('#addressManagerModal')
            });
            return;
        }
        
        const options = wardData.map(w => ({
            id: w.code,
            text: w.name
        }));
        
        wardSelect2.empty().select2({
            data: options,
            theme: 'bootstrap-5',
            width: '100%',
            placeholder: '-- Chọn Phường / Xã --',
            allowClear: true,
            dropdownParent: $('#addressManagerModal'),
            language: {
                searching: function() { return 'Đang tìm kiếm...'; },
                noResults: function() { return 'Không tìm thấy kết quả'; }
            }
        });

        wardSelect2.trigger('change');

    } catch (error) {
        console.error('Error loading wards:', error);
        showToast('Không thể tải danh sách phường/xã. Vui lòng thử lại sau.');
        
        wardSelect2.empty().select2({
            data: [{ id: '', text: '-- Lỗi tải dữ liệu --' }],
            theme: 'bootstrap-5',
            width: '100%',
            dropdownParent: $('#addressManagerModal')
        });
    }
}

// =============================================================
// VALIDATION - HIỂN THỊ LỖI TRỰC TIẾP DƯỚI INPUT (ĐÃ SỬA)
// =============================================================

// Hàm hiển thị lỗi
function showError(inputId, message) {
    // Xóa lỗi cũ
    clearError(inputId);
    
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Thêm class lỗi
    input.classList.add('is-invalid');
    
    // Tạo thẻ hiển thị lỗi
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.id = inputId + '-error';
    errorDiv.textContent = message;
    
    // KIỂM TRA: Nếu là Select2 (có class select2-hidden-accessible)
    if (input.classList.contains('select2-hidden-accessible')) {
        // Tìm parent container của Select2
        const select2Container = input.nextElementSibling;
        if (select2Container && select2Container.classList.contains('select2-container')) {
            // Chèn sau Select2 container
            select2Container.parentNode.insertBefore(errorDiv, select2Container.nextSibling);
        } else {
            // Fallback: chèn sau input
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
    } else {
        // Chèn sau input thường
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
}

// Hàm xóa lỗi
function clearError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.classList.remove('is-invalid');
    
    // Xóa thẻ lỗi nếu có
    const errorDiv = document.getElementById(inputId + '-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    
    // Xóa thẻ lỗi của Select2 nếu có (được chèn sau select2-container)
    const select2Container = input.nextElementSibling;
    if (select2Container && select2Container.classList && select2Container.classList.contains('select2-container')) {
        const nextSibling = select2Container.nextSibling;
        if (nextSibling && nextSibling.classList && nextSibling.classList.contains('invalid-feedback')) {
            nextSibling.remove();
        }
    }
}

// Hàm validate tất cả các trường
function validateAddressForm() {
    let isValid = true;
    
    // Validate Họ và tên
    const name = document.getElementById('newFullName').value.trim();
    if (!name) {
        showError('newFullName', '*Vui lòng nhập họ và tên');
        isValid = false;
    } else {
        clearError('newFullName');
    }
    
    // Validate Số điện thoại
    const phone = document.getElementById('newPhone').value.trim();
    if (!phone) {
        showError('newPhone', '*Vui lòng nhập số điện thoại');
        isValid = false;
    } else if (!/^[0-9]{10,11}$/.test(phone)) {
        showError('newPhone', '*Số điện thoại không hợp lệ (10-11 số)');
        isValid = false;
    } else {
        clearError('newPhone');
    }
    
    // Validate Địa chỉ chi tiết
    const detail = document.getElementById('newAddressDetail').value.trim();
    if (!detail) {
        showError('newAddressDetail', '*Vui lòng nhập địa chỉ chi tiết');
        isValid = false;
    } else {
        clearError('newAddressDetail');
    }
    
    // Validate Tỉnh/Thành phố - LẤY TRỰC TIẾP TỪ SELECT
    const provinceSelect = document.getElementById('newProvince');
    const provinceCode = provinceSelect ? provinceSelect.value : '';
    if (!provinceCode) {
        showError('newProvince', '*Vui lòng chọn Tỉnh/Thành phố');
        isValid = false;
    } else {
        clearError('newProvince');
    }
    
    // Validate Phường/Xã - LẤY TRỰC TIẾP TỪ SELECT
    const wardSelect = document.getElementById('newWard');
    const wardCode = wardSelect ? wardSelect.value : '';
    if (!wardCode) {
        showError('newWard', '*Vui lòng chọn Phường/Xã');
        isValid = false;
    } else {
        clearError('newWard');
    }
    
    return isValid;
}

// Hàm xóa tất cả lỗi
function clearAllErrors() {
    clearError('newFullName');
    clearError('newPhone');
    clearError('newAddressDetail');
    clearError('newProvince');
    clearError('newWard');
}

// =============================================================
// LẤY DỮ LIỆU GIỎ HÀNG TỪ LOCALSTORAGE
// =============================================================

function loadCartData() {
    try {
        // Ưu tiên lấy từ checkoutItems (được set từ cart)
        let savedCart = localStorage.getItem('checkoutItems');
        
        if (savedCart) {
            cartItems = JSON.parse(savedCart);
            // Xóa checkoutItems sau khi lấy để tránh dùng lại
            localStorage.removeItem('checkoutItems');
            window.isSubsetCheckout = true;
            window.checkoutSourceItems = [...cartItems];
            console.log('✅ Loaded checkout items:', cartItems.length);
        } else {
            // Fallback: lấy từ cartItems (đồng bộ với giỏ hàng thực tế)
            savedCart = localStorage.getItem('cartItems');
            window.isSubsetCheckout = false;
            window.checkoutSourceItems = null;
            if (savedCart) {
                cartItems = JSON.parse(savedCart);
                console.log('✅ Loaded cart items:', cartItems.length);
            } else {
                cartItems = [];
                showToast('Giỏ hàng của bạn đang trống');
            }
        }
        
        // Bổ sung thông tin chi tiết (name, price, image) từ allProducts
        cartItems = cartItems.map(item => {
            // Nếu sản phẩm đã có sẵn thông tin chi tiết, giữ nguyên
            if (item.name && item.price && item.image) {
                return item;
            }
            
            // Nếu chỉ có productId, tìm kiếm chi tiết trong allProducts
            const productId = item.productId || item.id;
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                const variantName = item.variant || (product.variants ? product.variants[0].name : null);
                let price = product.currentPrice || product.originalPrice;
                
                if (product.variants && variantName) {
                    const matchedVariant = product.variants.find(v => v.name === variantName);
                    if (matchedVariant) {
                        price = matchedVariant.price;
                    }
                }
                
                return {
                    ...item,
                    id: productId,
                    productId: productId,
                    name: product.name,
                    price: price,
                    image: product.image,
                    variant: variantName
                };
            }
            return item;
        });
        
        renderOrderSummary();
        
        // Tự động áp dụng mã giảm giá đã chọn từ giỏ hàng và gắn sự kiện click
        setTimeout(() => {
            const promoInput = document.getElementById('promoInput');
            if (promoInput) {
                promoInput.addEventListener('click', function() {
                    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    if (typeof window.openCouponSelector === 'function') {
                        window.openCouponSelector('promoInput', subtotal, function(code) {
                            if (code === '') {
                                promoCode = '';
                                isFreeShip = false;
                                discountAmount = 0;
                                discountPercent = 0;
                                localStorage.removeItem('appliedPromoCode');
                                promoInput.value = '';
                                showToast('Đã hủy áp dụng mã giảm giá');
                                renderOrderSummary();
                            } else {
                                promoInput.value = code;
                                applyPromo();
                            }
                        });
                    }
                });
            }

            const savedPromo = localStorage.getItem('appliedPromoCode');
            if (savedPromo && promoInput) {
                promoInput.value = savedPromo;
                applyPromo();
            }
        }, 100);
    } catch (e) {
        console.error('Error loading cart:', e);
        cartItems = [];
        renderOrderSummary();
    }
}

// =============================================================
// LẤY THÔNG TIN NGƯỜI DÙNG - ĐÃ SỬA
// =============================================================

function loadUserData() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        console.warn('No userEmail found in localStorage');
        return Promise.resolve(null);
    }
    
    console.log('Loading user data from users.json for email:', userEmail);
    
    return fetch('../data/users.json')
        .then(res => {
            if (!res.ok) throw new Error('Không thể tải users.json');
            return res.json();
        })
        .then(data => {
            if (data.users && data.users.length > 0) {
                const user = data.users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
                if (user) {
                    userData = user;
                    // Đồng bộ đầy đủ thông tin vào localStorage
                    localStorage.setItem('userName', user.name);
                    localStorage.setItem('userAvatar', user.avatar || '');
                    localStorage.setItem('userRole', user.role || 'user');
                    localStorage.setItem('userPhone', user.phone || '');
                    localStorage.setItem('userAddress', user.address || '');
                    console.log('✅ User data loaded from users.json:', userData);
                    return user;
                }
            }
            // Fallback nếu không khớp email trong json nhưng có ở localStorage
            const userName = localStorage.getItem('userName');
            const userAvatar = localStorage.getItem('userAvatar');
            const userRole = localStorage.getItem('userRole');
            userData = {
                name: userName || '',
                email: userEmail,
                avatar: userAvatar || '',
                role: userRole || 'user',
                phone: localStorage.getItem('userPhone') || '',
                address: localStorage.getItem('userAddress') || ''
            };
            return userData;
        })
        .catch(err => {
            console.error('Could not load users.json, falling back:', err);
            const userName = localStorage.getItem('userName');
            const userAvatar = localStorage.getItem('userAvatar');
            const userRole = localStorage.getItem('userRole');
            userData = {
                name: userName || '',
                email: userEmail,
                avatar: userAvatar || '',
                role: userRole || 'user',
                phone: localStorage.getItem('userPhone') || '',
                address: localStorage.getItem('userAddress') || ''
            };
            return userData;
        });
}

// =============================================================
// QUẢN LÝ ĐỊA CHỈ
// =============================================================

function loadAddresses() {
    const userEmail = localStorage.getItem('userEmail') || 'anonymous';
    const storageKey = `addresses_${userEmail}`;
    const savedAddresses = localStorage.getItem(storageKey);
    
    if (savedAddresses) {
        addresses = JSON.parse(savedAddresses);
    } else {
        addresses = [];
    }
    
    // Nếu danh sách địa chỉ trống, kéo từ thông tin tài khoản người dùng hiện tại
    if (addresses.length === 0) {
        let name = '';
        let phone = '';
        let addressStr = '';
        
        if (userData) {
            name = userData.name;
            phone = userData.phone;
            addressStr = userData.address;
        } else {
            name = localStorage.getItem('userName') || '';
            phone = localStorage.getItem('userPhone') || '';
            addressStr = localStorage.getItem('userAddress') || '';
        }
        
        // Hỗ trợ fallback cứng cho Nguyễn Minh Anh nếu không tải được users.json (lỗi file:// CORS)
        if (!addressStr && userEmail.toLowerCase() === 'minhanh.uri@gmail.com') {
            name = 'Nguyễn Minh Anh';
            phone = '0901 234 567';
            addressStr = '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
        }
        
        // Hỗ trợ fallback cứng cho Urii Admin
        if (!addressStr && userEmail.toLowerCase() === 'admin@gmail.com') {
            name = 'Urii Admin';
            phone = '0909 888 777';
            addressStr = 'Số 1, Đường Nguyễn Du, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh';
        }
        
        if (addressStr) {
            const defaultAddress = createAddressObject(name, phone, addressStr, true);
            addresses = [defaultAddress];
            localStorage.setItem(storageKey, JSON.stringify(addresses));
        } else {
            showToast('Vui lòng thêm địa chỉ nhận hàng');
        }
    }
    
    // Đảm bảo Nguyễn Minh Anh luôn có ít nhất địa chỉ mặc định trong mảng addresses
    if (addresses.length === 0 && userEmail.toLowerCase() === 'minhanh.uri@gmail.com') {
        const defaultAddress = createAddressObject(
            'Nguyễn Minh Anh',
            '0901 234 567',
            '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
            true
        );
        addresses = [defaultAddress];
        localStorage.setItem(storageKey, JSON.stringify(addresses));
    }
    
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
    if (defaultAddr) {
        selectedAddressId = defaultAddr.id;
        displayDefaultAddress(defaultAddr);
    } else {
        // Clear default display if no addresses exist
        document.getElementById('defaultName').textContent = 'Chưa có địa chỉ';
        document.getElementById('defaultPhone').innerHTML = `<i class="bi bi-phone"></i> Chưa có số điện thoại`;
        document.getElementById('defaultAddress').innerHTML = `<i class="bi bi-geo-alt"></i> Chưa có địa chỉ. Vui lòng nhấn "Thay đổi" để thêm.`;
    }
}

function createAddressObject(name, phone, address, isDefault = true) {
    const parts = address.split(', ');
    const detail = parts[0] || '';
    const ward = parts[1] || '';
    const province = parts[2] || '';
    
    return {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: name || '',
        phone: phone || '',
        detail: detail,
        ward: ward,
        province: province,
        fullAddress: address || '',
        isDefault: isDefault || false
    };
}

function saveAddresses() {
    const userEmail = localStorage.getItem('userEmail') || 'anonymous';
    const storageKey = `addresses_${userEmail}`;
    localStorage.setItem(storageKey, JSON.stringify(addresses));
}

function displayDefaultAddress(address) {
    if (!address) return;
    
    document.getElementById('defaultName').textContent = address.name;
    document.getElementById('defaultPhone').innerHTML = `<i class="bi bi-phone"></i> ${address.phone}`;
    document.getElementById('defaultAddress').innerHTML = `<i class="bi bi-geo-alt"></i> ${address.fullAddress}`;
}

function getCurrentAddress() {
    return addresses.find(a => a.id === selectedAddressId) || addresses[0];
}

// =============================================================
// MỞ/ĐÓNG MODAL QUẢN LÝ ĐỊA CHỈ
// =============================================================

function openAddressManager() {
    const overlay = document.getElementById('addressManagerOverlay');
    const modal = document.getElementById('addressManagerModal');
    
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Xóa lỗi khi mở modal
    clearAllErrors();
    
    renderAddressList();
}

function closeAddressManager() {
    const overlay = document.getElementById('addressManagerOverlay');
    const modal = document.getElementById('addressManagerModal');
    
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Xóa lỗi khi đóng modal
    clearAllErrors();
    
    const current = getCurrentAddress();
    if (current) {
        displayDefaultAddress(current);
    }
}

// =============================================================
// RENDER DANH SÁCH ĐỊA CHỈ
// =============================================================

function renderAddressList() {
    const container = document.getElementById('addressList');
    if (!container) return;
    
    if (addresses.length === 0) {
        container.innerHTML = `
            <div class="address-empty">
                <i class="bi bi-geo-alt"></i>
                <h6>Chưa có địa chỉ nào</h6>
                <p>Thêm địa chỉ nhận hàng để tiện cho việc mua sắm</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    addresses.forEach((addr) => {
        const isActive = addr.id === selectedAddressId;
        const isDefault = addr.isDefault;
        
        html += `
            <div class="address-item ${isActive ? 'active' : ''}" onclick="selectAddress('${addr.id}')">
                <div class="address-info">
                    <div class="address-name">
                        ${addr.name}
                        ${isDefault ? '<span class="address-badge">MẶC ĐỊNH</span>' : ''}
                    </div>
                    <div class="address-phone">
                        <i class="bi bi-phone"></i> ${addr.phone}
                    </div>
                    <div class="address-detail">
                        <i class="bi bi-geo-alt"></i> ${addr.fullAddress}
                    </div>
                </div>
                <div class="address-actions">
                    ${!isDefault ? `
                        <button class="btn-set-default" onclick="event.stopPropagation(); setDefaultAddress('${addr.id}')">
                            <i class="bi bi-star"></i> Mặc định
                        </button>
                    ` : ''}
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteAddress('${addr.id}')">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// =============================================================
// CHỌN ĐỊA CHỈ
// =============================================================

function selectAddress(id) {
    selectedAddressId = id;
    renderAddressList();
    
    addresses.forEach(a => {
        a.isDefault = a.id === id;
    });
    saveAddresses();
    
    const selected = addresses.find(a => a.id === id);
    if (selected) {
        displayDefaultAddress(selected);
    }
}

function setDefaultAddress(id) {
    addresses.forEach(a => {
        a.isDefault = a.id === id;
    });
    selectedAddressId = id;
    saveAddresses();
    renderAddressList();
    
    const selected = addresses.find(a => a.id === id);
    if (selected) {
        displayDefaultAddress(selected);
    }
}

function deleteAddress(id) {
    if (addresses.length <= 1) {
        showToast('Bạn cần ít nhất một địa chỉ nhận hàng');
        return;
    }
    
    if (typeof window.ariiConfirm === 'function') {
        window.ariiConfirm('Bạn có chắc chắn muốn xóa địa chỉ này?', {
            onConfirm: () => {
                const isDefault = addresses.find(a => a.id === id)?.isDefault;
                addresses = addresses.filter(a => a.id !== id);
                
                if (isDefault && addresses.length > 0) {
                    addresses[0].isDefault = true;
                    selectedAddressId = addresses[0].id;
                } else if (selectedAddressId === id) {
                    selectedAddressId = addresses[0]?.id || null;
                }
                
                saveAddresses();
                renderAddressList();
            }
        });
    } else {
        if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
        
        const isDefault = addresses.find(a => a.id === id)?.isDefault;
        addresses = addresses.filter(a => a.id !== id);
        
        if (isDefault && addresses.length > 0) {
            addresses[0].isDefault = true;
            selectedAddressId = addresses[0].id;
        } else if (selectedAddressId === id) {
            selectedAddressId = addresses[0]?.id || null;
        }
        
        saveAddresses();
        renderAddressList();
        
        const current = getCurrentAddress();
        if (current) {
            displayDefaultAddress(current);
        }
    }
}

// =============================================================
// THÊM ĐỊA CHỈ MỚI (CÓ VALIDATE)
// =============================================================

function toggleAddAddressForm() {
    const form = document.getElementById('addAddressForm');
    if (form) {
        const isVisible = form.style.display !== 'none';
        form.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            clearNewAddressForm();
            clearAllErrors();
        }
    }
}

function toggleCheckbox(element) {
    const checkbox = element.querySelector('.form-check-input');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
    }
}

function clearNewAddressForm() {
    document.getElementById('newFullName').value = '';
    document.getElementById('newPhone').value = '';
    document.getElementById('newAddressDetail').value = '';
    
    if (provinceSelect2) {
        provinceSelect2.val(null).trigger('change');
    }
    if (wardSelect2) {
        wardSelect2.empty().select2({
            data: [],
            theme: 'bootstrap-5',
            width: '100%',
            placeholder: '-- Chọn Phường / Xã --',
            allowClear: true,
            dropdownParent: $('#addressManagerModal')
        });
    }
    
    document.getElementById('newSetDefault').checked = false;
    
    // Xóa lỗi
    clearAllErrors();
}

function saveNewAddressFromModal() {
    // Validate dữ liệu trước khi lưu
    if (!validateAddressForm()) {
        // Cuộn lên đầu form để thấy lỗi
        const form = document.getElementById('addAddressForm');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }
    
    const name = document.getElementById('newFullName').value.trim();
    const phone = document.getElementById('newPhone').value.trim();
    const detail = document.getElementById('newAddressDetail').value.trim();
    
    const provinceCode = provinceSelect2 ? provinceSelect2.val() : '';
    const wardCode = wardSelect2 ? wardSelect2.val() : '';
    
    let provinceName = '';
    let wardName = '';
    
    const provinceObj = provinceData.find(p => p.code == provinceCode);
    if (provinceObj) provinceName = provinceObj.name;
    
    const wardObj = wardData.find(w => w.code == wardCode);
    if (wardObj) wardName = wardObj.name;
    
    const fullAddress = `${detail}, ${wardName}, ${provinceName}`;
    
    const newAddress = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: name,
        phone: phone,
        detail: detail,
        ward: wardName,
        province: provinceName,
        fullAddress: fullAddress,
        isDefault: false
    };
    
    const setDefault = document.getElementById('newSetDefault').checked;
    
    if (setDefault) {
        addresses.forEach(a => a.isDefault = false);
        newAddress.isDefault = true;
        selectedAddressId = newAddress.id;
    }
    
    addresses.push(newAddress);
    saveAddresses();
    renderAddressList();
    toggleAddAddressForm();
    
    if (setDefault) {
        displayDefaultAddress(newAddress);
    }
    
    // Reset form và xóa lỗi
    clearNewAddressForm();
    clearAllErrors();
    
    showToast('Đã thêm địa chỉ mới thành công!');
}

// =============================================================
// RENDER TÓM TẮT ĐƠN HÀNG
// =============================================================

function renderOrderSummary() {
    const container = document.getElementById('cartItemsSummary');
    if (!container) return;
    
    if (!cartItems || cartItems.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">Giỏ hàng trống</p>';
        document.getElementById('subtotal').textContent = '0₫';
        document.getElementById('totalAmount').textContent = '0₫';
        document.getElementById('shippingFee').textContent = '0₫';
        return;
    }
    
    let html = '';
    let subtotal = 0;
    
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
            <div class="cart-item">
                <img src="${item.image || 'https://picsum.photos/seed/' + item.id + '/100'}" class="cart-item-img" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="text-muted small">${item.variant || ''}</div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <span class="cart-item-price">${formatCurrency(item.price)}</span>
                        <span class="text-muted small">x${item.quantity}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    let shippingFee = subtotal > 0 ? (subtotal >= 200000 ? 0 : 30000) : 0;
    if (isFreeShip) {
        shippingFee = 0;
    }
    let discount = 0;
    if (discountAmount > 0) {
        discount = discountAmount;
    } else if (discountPercent > 0) {
        discount = Math.round(subtotal * discountPercent / 100);
    }
    if (discount > subtotal) {
        discount = subtotal;
    }
    const total = subtotal + shippingFee - discount;
    
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('shippingFee').textContent = shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee);
    
    if (discount > 0) {
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('discountAmount').textContent = '-' + formatCurrency(discount);
    } else {
        document.getElementById('discountRow').style.display = 'none';
    }
    
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

// =============================================================
// MÃ GIẢM GIÁ
// =============================================================

function applyPromo() {
    const input = document.getElementById('promoInput');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    
    if (!code) {
        showToast('Vui lòng nhập mã giảm giá');
        return;
    }
    
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (typeof window.validateCoupon === 'function') {
        const result = window.validateCoupon(code, subtotal);
        if (result.success) {
            promoCode = code;
            if (result.isFreeShip) {
                isFreeShip = true;
                discountAmount = 0;
                discountPercent = 0;
            } else {
                isFreeShip = false;
                discountAmount = result.discountAmount;
                discountPercent = 0;
            }
            showToast(result.message);
            renderOrderSummary();
            input.value = code;
            localStorage.setItem('appliedPromoCode', code);
        } else {
            showToast(result.message);
        }
    } else {
        // Fallback đơn giản nếu không tải được hệ thống mã giảm giá chung
        if (code === 'URII10') {
            discountPercent = 10;
            discountAmount = 0;
            isFreeShip = false;
            promoCode = code;
            showToast(`Áp dụng mã giảm giá ${code} thành công!`);
            renderOrderSummary();
            input.value = code;
        } else {
            showToast('Mã giảm giá không hợp lệ');
        }
    }
}

// =============================================================
// CHỌN PHƯƠNG THỨC THANH TOÁN
// =============================================================

function selectPayment(element) {
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    const radio = element.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
}

// =============================================================
// XỬ LÝ ĐẶT HÀNG
// =============================================================

function handlePlaceOrder() {
    if (!cartItems || cartItems.length === 0) {
        showToast('Giỏ hàng của bạn đang trống');
        return;
    }
    
    const currentAddress = getCurrentAddress();
    if (!currentAddress) {
        showToast('Vui lòng chọn địa chỉ nhận hàng');
        return;
    }
    
    const orderId = '#URII-' + Math.floor(10000 + Math.random() * 90000);
    const totalText = document.getElementById('totalAmount').textContent;
    const totalAmount = parseInt(totalText.replace(/[₫,.]/g, '')) || 0;
    
    const selectedPayment = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethod = selectedPayment ? selectedPayment.value : 'cod';
    
    switch(paymentMethod) {
        case 'cod':
            if (typeof window.ariiConfirm === 'function') {
                window.ariiConfirm(`Xác nhận đặt hàng với hình thức Thanh toán khi nhận hàng (COD)<br><strong style="color: #dc3545;">Tổng tiền: ${formatCurrency(totalAmount)}</strong>`, {
                    onConfirm: () => {
                        createOrder(orderId, 'cod', totalAmount, currentAddress);
                    }
                });
            } else {
                if (confirm(`Xác nhận đặt hàng với hình thức Thanh toán khi nhận hàng (COD)\nTổng tiền: ${formatCurrency(totalAmount)}`)) {
                    createOrder(orderId, 'cod', totalAmount, currentAddress);
                }
            }
            break;
        case 'momo':
            document.getElementById('momoOrderId').textContent = orderId;
            document.getElementById('momoAmount').textContent = formatCurrency(totalAmount);
            openPopup('momoPopup');
            startTimer('momoTimer', 300);
            break;
        case 'vnpay':
            document.getElementById('vnpayOrderId').textContent = orderId;
            document.getElementById('vnpayAmount').textContent = formatCurrency(totalAmount);
            openPopup('vnpayPopup');
            break;
        default:
            showToast('Vui lòng chọn phương thức thanh toán');
    }
}

function createOrder(orderId, paymentMethod, totalAmount, address) {
    const subtotalVal = parseInt(document.getElementById('subtotal').textContent.replace(/[₫,.]/g, '')) || 0;
    let discountVal = 0;
    if (discountAmount > 0) {
        discountVal = discountAmount;
    } else if (discountPercent > 0) {
        discountVal = Math.round(subtotalVal * discountPercent / 100);
    }
    
    const order = {
        id: orderId,
        date: new Date().toLocaleString('vi-VN'),
        items: cartItems,
        subtotal: subtotalVal,
        shippingFee: document.getElementById('shippingFee').textContent === 'Miễn phí' ? 0 : 30000,
        discount: discountVal,
        total: totalAmount,
        paymentMethod: paymentMethod,
        status: 'pending',
        shippingInfo: {
            fullName: address.name,
            phone: address.phone,
            address: address.fullAddress,
            note: document.getElementById('orderNote').value.trim()
        }
    };
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Xóa sản phẩm đã mua khỏi giỏ hàng
    if (window.isSubsetCheckout && window.checkoutSourceItems) {
        try {
            const mainCartSaved = localStorage.getItem('cartItems');
            let mainCart = mainCartSaved ? JSON.parse(mainCartSaved) : [];
            if (Array.isArray(mainCart)) {
                mainCart = mainCart.filter(item => {
                    return !window.checkoutSourceItems.some(purchased => 
                        purchased.productId === item.productId && 
                        (purchased.variant || null) === (item.variant || null)
                    );
                });
                localStorage.setItem('cartItems', JSON.stringify(mainCart));
            }
        } catch (e) {
            console.error('Error updating cart after checkout:', e);
            localStorage.removeItem('cartItems');
        }
    } else {
        localStorage.removeItem('cartItems');
    }
    
    // Xóa mã giảm giá đã áp dụng
    localStorage.removeItem('appliedPromoCode');
    
    // Reset các biến mã giảm giá
    isFreeShip = false;
    discountAmount = 0;
    discountPercent = 0;
    promoCode = '';
    
    // Phát sự kiện cập nhật giỏ hàng để cập nhật header
    window.dispatchEvent(new CustomEvent('cart:updated'));
    window.dispatchEvent(new Event('storage'));
    
    cartItems = [];
    renderOrderSummary();
    
    showToast(`Đặt hàng thành công! Mã đơn: ${orderId}`);
    
    setTimeout(() => {
        window.location.href = 'orders.html';
    }, 2000);
}

function confirmPayment(method) {
    const totalText = document.getElementById('totalAmount').textContent;
    const totalAmount = parseInt(totalText.replace(/[₫,.]/g, '')) || 0;
    const orderId = '##URII-' + Math.floor(10000 + Math.random() * 90000);
    const currentAddress = getCurrentAddress();
    
    closePopup('momoPopup');
    closePopup('vnpayQrPopup');
    
    createOrder(orderId, method, totalAmount, currentAddress);
}

// =============================================================
// RENDER DANH SÁCH NGÂN HÀNG
// =============================================================

function renderBanks() {
    const grid = document.getElementById('bankGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    banks.forEach(b => {
        const div = document.createElement('div');
        div.className = 'bank-item';
        div.onclick = function() {
            closePopup('vnpayPopup');
            document.getElementById('selectedBankName').innerText = b.name;
            
            const orderId = document.getElementById('vnpayOrderId').textContent;
            const totalText = document.getElementById('vnpayAmount').textContent;
            const totalAmount = parseInt(totalText.replace(/[₫,.]/g, '')) || 0;
            
            // Tạo thông tin QR động bao gồm ngân hàng, mã đơn, và số tiền
            const qrData = encodeURIComponent(`Nganhang: ${b.name}, MaDon: ${orderId}, SoTien: ${totalAmount}đ`);
            const qrImg = document.getElementById('vnpayQrImg');
            if (qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}`;
            }
            
            openPopup('vnpayQrPopup');
        };
        div.innerHTML = `<img src="${b.img}" alt="${b.name}"><span>${b.name}</span>`;
        grid.appendChild(div);
    });
}

function filterBanks() {
    const search = document.getElementById('bankSearch').value.toLowerCase();
    const items = document.querySelectorAll('.bank-item');
    items.forEach(item => {
        const name = item.querySelector('span').textContent.toLowerCase();
        item.style.display = name.includes(search) ? 'block' : 'none';
    });
}

// =============================================================
// POPUP FUNCTIONS
// =============================================================

function openPopup(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePopup(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.querySelectorAll('.payment-popup-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// =============================================================
// TIMER
// =============================================================

function startTimer(elementId, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let time = duration;
    element.textContent = formatTime(time);
    
    const interval = setInterval(() => {
        time--;
        element.textContent = formatTime(time);
        if (time <= 0) {
            clearInterval(interval);
            element.textContent = 'Hết hạn';
            element.style.color = '#dc3545';
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// =============================================================
// TOAST
// =============================================================

function initToast() {
    const toastEl = document.getElementById('checkoutToast');
    if (toastEl) {
        toastInstance = new bootstrap.Toast(toastEl, { delay: 5000 });
    }
}

function showToast(message) {
    const body = document.getElementById('toastMessage');
    if (body) body.textContent = message;
    if (toastInstance) {
        toastInstance.show();
    }
}

// =============================================================
// UTILITY
// =============================================================

function formatCurrency(amount) {
    if (!amount && amount !== 0) return '0₫';
    return amount.toLocaleString('vi-VN') + '₫';
}

// =============================================================
// EXPORT
// =============================================================

window.formatCurrency = formatCurrency;
window.selectPayment = selectPayment;
window.handlePlaceOrder = handlePlaceOrder;
window.applyPromo = applyPromo;
window.openPopup = openPopup;
window.closePopup = closePopup;
window.confirmPayment = confirmPayment;
window.openAddressManager = openAddressManager;
window.closeAddressManager = closeAddressManager;
window.selectAddress = selectAddress;
window.setDefaultAddress = setDefaultAddress;
window.deleteAddress = deleteAddress;
window.toggleAddAddressForm = toggleAddAddressForm;
window.toggleCheckbox = toggleCheckbox;
window.saveNewAddressFromModal = saveNewAddressFromModal;
window.filterBanks = filterBanks;