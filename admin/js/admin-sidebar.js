document.addEventListener("DOMContentLoaded", function () {
    // 1. Giữ tính năng tự động active menu dựa trên URL thực tế của trang
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

    // 2. Logic hộp thoại đăng xuất thân thiện
    const logoutBtn = document.getElementById("adminLogoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị Urii?")) {
                window.location.href = "../../user/html/login.html";
            }
        });
    }
});