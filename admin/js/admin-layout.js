/**
 * ====================================================================
 * URII DIY - ADMIN LAYOUT LOGIC SYSTEM (admin-layout.js)
 * Người phụ trách: TRƯƠNG NGỌC THUỲ LINH (feature/component-layout) [cite: 88, 96, 241]
 * ====================================================================
 * MÔ TẢ: File gộp chung xử lý Javascript cho cả Sidebar và Topbar.
 * LƯU Ý: Mọi người khi tạo file HTML admin chỉ cần nhúng duy nhất file này 
 * ở cuối trang trước thẻ đóng </body> là chạy được toàn bộ logic layout.
 * ====================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
    
    // ---------------------------------------------------
    // [PHẦN 1] LOGIC XỬ LÝ SIDEBAR (MENU DỌC)
    // ---------------------------------------------------
    
    // 1. Tự động bật sáng đèn (Active) cho menu của trang hiện tại theo URL
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    const navLinks = document.querySelectorAll(".admin-sidebar .nav-item");

    navLinks.forEach(link => {
        const hrefAttribute = link.getAttribute("href");
        if (hrefAttribute && hrefAttribute.includes(currentPage)) {
            // Xóa active của tất cả các mục khác
            navLinks.forEach(item => item.classList.remove("active"));
            // Thêm active vào đúng mục trang hiện tại
            link.classList.add("active");
        }
    });

    // 2. Lắng nghe sự kiện click vào nút Đăng xuất Admin
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

    // ---------------------------------------------------
    // [PHẦN 2] LOGIC XỬ LÝ TOPBAR (THANH NGANG TRÊN ĐỈNH)
    // ---------------------------------------------------

    // 1. Xử lý hành động khi người dùng nhập dữ liệu và nhấn Enter trên ô Tìm kiếm
    const searchInput = document.querySelector(".search-input");
    if (searchInput) {
        searchInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                const query = this.value.trim();
                if (query) {
                    console.log("Hệ thống Urii đang tìm kiếm từ khóa:", query);
                    // Sau này có thể viết thêm logic chuyển hướng trang kết quả lọc tại đây
                }
            }
        });
    }

    // 2. Tạo hiệu ứng click nhanh (feedback) cho các nút tiện ích (Chuông, Cài đặt, Hộp thư)
    const iconButtons = document.querySelectorAll(".topbar-right .icon-btn");
    iconButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            this.style.transform = "scale(0.92)";
            setTimeout(() => {
                this.style.transform = "none";
            }, 100);
        });
    });
});