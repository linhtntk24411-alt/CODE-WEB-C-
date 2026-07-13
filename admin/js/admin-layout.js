/**
 * ====================================================================
 * URII DIY - ADMIN LAYOUT LOGIC SYSTEM (admin-layout.js)
 * ====================================================================
 */

(function () {
    // Tự động làm nổi bật menu active của trang hiện tại khi sidebar được nạp xong
    const checkSidebarInterval = setInterval(function() {
        const sidebar = document.querySelector(".admin-sidebar");
        if (sidebar) {
            clearInterval(checkSidebarInterval);
            highlightActiveMenu();
        }
    }, 100);

    function highlightActiveMenu() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);
        const navLinks = document.querySelectorAll(".admin-sidebar .nav-item");

        navLinks.forEach(link => {
            const hrefAttribute = link.getAttribute("href");
            if (hrefAttribute && hrefAttribute.includes(currentPage)) {
                navLinks.forEach(item => item.classList.remove("active"));
                link.classList.add("active");
            }
        });
    }

    // ---------------------------------------------------
    // [PHẦN 1] TOGGLE SIDEBAR TRÊN MOBILE (HAMBURGER)
    // ---------------------------------------------------
    document.addEventListener('click', function(e) {
        const toggleBtn = e.target.closest('#adminMenuToggleBtn');
        const sidebar = document.querySelector('.admin-sidebar');
        
        if (toggleBtn) {
            e.stopPropagation();
            if (sidebar) {
                sidebar.classList.toggle('mobile-active');
            }
        } else {
            // Click ra ngoài sidebar thì đóng sidebar trên mobile
            if (sidebar && sidebar.classList.contains('mobile-active') && !e.target.closest('.admin-sidebar')) {
                sidebar.classList.remove('mobile-active');
            }
        }
    });

    // ---------------------------------------------------
    // [PHẦN 2] ĐĂNG XUẤT ADMIN (CUSTOM POPUP MODAL)
    // ---------------------------------------------------
    function injectLogoutModalStyles() {
        if (document.getElementById('urii-logout-styles')) return;
        const style = document.createElement('style');
        style.id = 'urii-logout-styles';
        style.textContent = `
            .urii-logout-modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(27, 28, 28, 0.4);
                backdrop-filter: blur(8px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.25s ease;
            }
            .urii-logout-modal-backdrop.show {
                opacity: 1;
                pointer-events: auto;
            }
            .urii-logout-modal {
                background-color: #ffffff;
                border-radius: 20px;
                padding: 32px;
                width: 90%;
                max-width: 380px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(0, 0, 0, 0.05);
                transform: scale(0.9);
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .urii-logout-modal-backdrop.show .urii-logout-modal {
                transform: scale(1);
            }
            .urii-logout-modal-icon {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background-color: #fff1f1;
                color: #840001;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 auto 16px auto;
            }
            .urii-logout-modal-icon i {
                font-size: 24px;
            }
            .urii-logout-modal-title {
                font-family: 'Segoe UI', 'Nunito Sans', sans-serif;
                font-size: 19px;
                font-weight: 700;
                color: #1b1c1c;
                margin-bottom: 8px;
            }
            .urii-logout-modal-text {
                font-family: 'Segoe UI', 'Nunito Sans', sans-serif;
                font-size: 13.5px;
                color: #5c403b;
                line-height: 1.5;
                margin-bottom: 24px;
            }
            .urii-logout-modal-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            .urii-logout-modal-buttons button {
                padding: 10px 20px;
                border-radius: 10px;
                font-family: 'Segoe UI', 'Nunito Sans', sans-serif;
                font-size: 13.5px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: all 0.2s ease;
                flex: 1;
            }
            .urii-logout-btn-cancel {
                background-color: #f0eded;
                color: #5c403b;
            }
            .urii-logout-btn-cancel:hover {
                background-color: #e5e2e2;
            }
            .urii-logout-btn-confirm {
                background-color: #840001;
                color: #ffffff;
            }
            .urii-logout-btn-confirm:hover {
                background-color: #690001;
                box-shadow: 0 4px 12px rgba(132, 0, 1, 0.2);
            }
        `;
        document.head.appendChild(style);
    }

    function showLogoutModal() {
        injectLogoutModalStyles();
        
        let backdrop = document.getElementById('uriiLogoutModal');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'uriiLogoutModal';
            backdrop.className = 'urii-logout-modal-backdrop';
            backdrop.innerHTML = `
                <div class="urii-logout-modal">
                    <div class="urii-logout-modal-icon">
                        <i class="bi bi-box-arrow-right"></i>
                    </div>
                    <div class="urii-logout-modal-title">Đăng xuất khỏi Admin</div>
                    <div class="urii-logout-modal-text">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị Urii?</div>
                    <div class="urii-logout-modal-buttons">
                        <button class="urii-logout-btn-cancel" id="uriiLogoutCancel">Hủy bỏ</button>
                        <button class="urii-logout-btn-confirm" id="uriiLogoutConfirm">Đăng xuất</button>
                    </div>
                </div>
            `;
            document.body.appendChild(backdrop);

            backdrop.querySelector('#uriiLogoutCancel').addEventListener('click', () => {
                backdrop.classList.remove('show');
            });
            backdrop.querySelector('#uriiLogoutConfirm').addEventListener('click', () => {
                window.location.href = "../../user/html/login.html";
            });
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    backdrop.classList.remove('show');
                }
            });
        }
        
        setTimeout(() => {
            backdrop.classList.add('show');
        }, 10);
    }

    document.addEventListener('click', function (e) {
        const logoutBtn = e.target.closest("#adminLogoutBtn");
        if (logoutBtn) {
            e.preventDefault();
            showLogoutModal();
        }
    });

    // ---------------------------------------------------
    // [PHẦN 3] TÌM KIẾM
    // ---------------------------------------------------
    document.addEventListener('keypress', function(e) {
        if (e.target.classList.contains('search-input') && e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                console.log("Hệ thống Urii đang tìm kiếm từ khóa:", query);
            }
        }
    });

    // Hiệu ứng click nhanh cho icon-btn
    document.addEventListener('click', function(e) {
        const iconBtn = e.target.closest('.topbar-right .icon-btn');
        if (iconBtn) {
            iconBtn.style.transform = "scale(0.92)";
            setTimeout(() => {
                iconBtn.style.transform = "none";
            }, 100);
        }
    });

    // ---------------------------------------------------
    // [PHẦN 4] HỆ THỐNG THÔNG BÁO DỌC TOPBAR (NOTIFICATIONS)
    // ---------------------------------------------------
    
    // Toggle dropdown thông báo dùng event delegation
    document.addEventListener('click', function(e) {
        const notifyBtn = e.target.closest('#adminNotificationBtn');
        const dropdown = document.getElementById('notificationDropdown');
        
        if (notifyBtn) {
            e.stopPropagation();
            if (dropdown) {
                const isActive = dropdown.classList.toggle('active');
                if (isActive) {
                    loadAndRenderNotifications();
                }
            }
        } else if (dropdown && dropdown.classList.contains('active') && !e.target.closest('#notificationDropdown')) {
            dropdown.classList.remove('active');
        }
    });

    // Xử lý nút dọn sạch thông báo dùng event delegation
    document.addEventListener('click', function(e) {
        const clearBtn = e.target.closest('#btnClearNotifications');
        if (clearBtn) {
            e.stopPropagation();
            const badge = document.getElementById('notificationBadge');
            const body = document.getElementById('notificationBody');
            
            if (badge) badge.style.display = 'none';
            if (body) {
                body.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <span class="material-symbols-outlined fs-2">notifications_off</span>
                        <p class="mt-2 mb-0" style="font-size: 13px;">Không có thông báo mới</p>
                    </div>
                `;
            }
            alert('Đã đánh dấu tất cả thông báo là đã đọc!');
        }
    });

    // Hàm lấy và render thông báo
    function loadAndRenderNotifications() {
        const body = document.getElementById('notificationBody');
        const badge = document.getElementById('notificationBadge');
        if (!body) return;

        const notifications = [];

        // 1. Đơn hàng thường mới
        try {
            const ordersSaved = localStorage.getItem('orders');
            if (ordersSaved) {
                const orders = JSON.parse(ordersSaved);
                orders.forEach(o => {
                    if (o.status === 'pending' && !o.isCustomOrder) {
                        const custName = o.customerName || (o.shippingInfo && o.shippingInfo.fullName) || 'Khách hàng';
                        notifications.push({
                            id: 'order-' + o.id,
                            title: 'Đơn hàng mới',
                            message: `Đơn hàng #${o.id} từ ${custName} đang chờ xác nhận.`,
                            time: o.date || 'Gần đây',
                            icon: 'shopping_bag',
                            iconClass: 'bg-primary bg-opacity-10 text-primary',
                            link: '../html/admin-orders.html'
                        });
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }

        // 2. Đơn custom mới
        try {
            const customOrdersSaved = localStorage.getItem('custom_orders_cache');
            if (customOrdersSaved) {
                const customOrders = JSON.parse(customOrdersSaved);
                customOrders.forEach(o => {
                    if (o.statusClass === 'status-pending' || o.status === 'waiting_quote') {
                        notifications.push({
                            id: 'custom-' + o.id,
                            title: 'Yêu cầu Custom mới',
                            message: `Yêu cầu #${o.id} từ khách hàng cần báo giá.`,
                            time: o.date || 'Gần đây',
                            icon: 'architecture',
                            iconClass: 'bg-warning bg-opacity-10 text-warning',
                            link: '../html/admin-orders.html'
                        });
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }

        // 3. Blog mới
        try {
            const blogsSaved = localStorage.getItem('userBlogs');
            if (blogsSaved) {
                const userBlogs = JSON.parse(blogsSaved);
                userBlogs.forEach(b => {
                    if (b.status === 'published' || b.status === 'pending') {
                        notifications.push({
                            id: 'blog-' + b.id,
                            title: 'Bài viết Blog mới',
                            message: `Bài viết "${b.title}" đang chờ duyệt.`,
                            time: b.date || 'Gần đây',
                            icon: 'assignment',
                            iconClass: 'bg-info bg-opacity-10 text-info',
                            link: '../html/admin-blogs.html'
                        });
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }

        // Update badge
        if (badge) {
            if (notifications.length > 0) {
                badge.innerText = notifications.length;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }

        // Render
        if (notifications.length === 0) {
            body.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <span class="material-symbols-outlined fs-2">notifications_off</span>
                    <p class="mt-2 mb-0" style="font-size: 13px;">Không có thông báo mới</p>
                </div>
            `;
            return;
        }

        body.innerHTML = notifications.map(n => `
            <div class="notification-item" onclick="window.location.href='${n.link}'">
                <div class="notification-icon-circle ${n.iconClass}">
                    <span class="material-symbols-outlined">${n.icon}</span>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-desc">${n.message}</div>
                    <div class="notification-time">${n.time}</div>
                </div>
                <span class="notification-dot"></span>
            </div>
        `).join('');
    }

    // Định kỳ/Khởi tạo số lượng thông báo cho chuông
    function updateBadgeCount() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        let count = 0;
        try {
            // Count pending orders
            const ordersSaved = localStorage.getItem('orders');
            if (ordersSaved) {
                const orders = JSON.parse(ordersSaved);
                count += orders.filter(o => o.status === 'pending' && !o.isCustomOrder).length;
            }

            // Count pending custom orders
            const customSaved = localStorage.getItem('custom_orders_cache');
            if (customSaved) {
                const custom = JSON.parse(customSaved);
                count += custom.filter(o => o.statusClass === 'status-pending' || o.status === 'waiting_quote').length;
            }

            // Count pending blogs
            const blogsSaved = localStorage.getItem('userBlogs');
            if (blogsSaved) {
                const blogs = JSON.parse(blogsSaved);
                count += blogs.filter(b => b.status === 'published' || b.status === 'pending').length;
            }
        } catch (e) {
            console.error(e);
        }

        if (count > 0) {
            badge.innerText = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // Chạy vòng lặp kiểm tra để set số lượng badge khi topbar được nạp
    const checkInterval = setInterval(function() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            clearInterval(checkInterval);
            updateBadgeCount();
        }
    }, 100);
})();