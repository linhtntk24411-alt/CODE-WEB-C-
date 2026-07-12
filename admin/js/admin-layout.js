/**
 * ====================================================================
 * URII DIY - ADMIN LAYOUT LOGIC SYSTEM (admin-layout.js - Mở rộng)
 * ====================================================================
 * MÔ TẢ: File gộp chung xử lý Javascript cho Sidebar, Topbar và Footer.
 * ====================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
    
    // ---------------------------------------------------
    // [PHẦN 1] HÀM TẢI COMPONENT (LOAD HTML BẤT ĐỒNG BỘ)
    // ---------------------------------------------------
    
    /**
     * Hàm dùng chung để tải bất kỳ file HTML component nào vào một thẻ div móc treo
     * @param {string} url - Đường dẫn tới file HTML component
     * @param {string} targetId - ID của thẻ div sẽ chứa nội dung
     */
    async function loadComponent(url, targetId) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.text();
                document.getElementById(targetId).innerHTML = data;
            } else {
                console.warn(`Không thể tải component: ${url}`);
            }
        } catch (error) {
            console.error(`Lỗi khi load ${url}:`, error);
        }
    }

    // ---------------------------------------------------
    // [PHẦN 2] NẠP CÁC COMPONENT VÀO LAYOUT
    // ---------------------------------------------------
    
    // 1. Nạp Sidebar (Menu dọc bên trái) - Móc treo layout-sidebar
    loadComponent('../components/admin-sidebar.html', 'layout-sidebar');
    
    // 2. Nạp Topbar (Thanh ngang trên đỉnh) - Móc treo layout-topbar
    loadComponent('../components/admin-topbar.html', 'layout-topbar');
    
    // 3. Nạp Footer User (Màu đỏ dưới cùng) - Móc treo user-footer-placeholder
    // Lưu ý: Đường dẫn đi lên 2 cấp từ admin/js/ để ra user/components/
    loadComponent('../../user/components/footer.html', 'user-footer-placeholder');

    // ---------------------------------------------------
    // [PHẦN 3] LOGIC XỬ LÝ SIDEBAR (MENU DỌC)
    // ---------------------------------------------------
    
    // Tự động bật sáng đèn (Active) cho menu của trang hiện tại theo URL
    // (Sử dụng setTimeout để đảm bảo Sidebar đã được load vào DOM trước khi chạy)
    setTimeout(function() {
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
    }, 100);

    // ---------------------------------------------------
    // [PHẦN 4] LOGIC XỬ LÝ SỰ KIỆN
    // ---------------------------------------------------

    // 1. Lắng nghe sự kiện click vào nút Đăng xuất Admin
    const logoutBtn = document.getElementById("adminLogoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault(); // Ngăn hành vi chuyển hướng mặc định của thẻ <a>
            
            const confirmLogout = confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị Urii?");
            if (confirmLogout) {
                // Điều hướng về trang đăng nhập của phía khách hàng (User)
                window.location.href = "../../user/html/login.html";
            }
        });
    }

    // 2. Xử lý hành động khi người dùng nhập dữ liệu và nhấn Enter trên ô Tìm kiếm
    // (Dùng event delegation để bắt sự kiện từ Topbar đã được load động)
    document.addEventListener('keypress', function(e) {
        if (e.target.classList.contains('search-input') && e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                console.log("Hệ thống Urii đang tìm kiếm từ khóa:", query);
            }
        }
    });

    // 3. Tạo hiệu ứng click nhanh (feedback) cho các nút tiện ích (Chuông, Cài đặt, Hộp thư)
    document.addEventListener('click', function(e) {
        const iconBtn = e.target.closest('.topbar-right .icon-btn');
        if (iconBtn) {
            iconBtn.style.transform = "scale(0.92)";
            setTimeout(() => {
                iconBtn.style.transform = "none";
            }, 100);
        }
    });
});