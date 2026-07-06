document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Hiệu ứng động cho các Khối Thẻ Thống Kê (Stat Cards)
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-3px)';
            card.classList.remove('shadow-sm');
            card.classList.add('shadow-md');
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.classList.remove('shadow-md');
            card.classList.add('shadow-sm');
        });
    });

    // 2. Mô phỏng sự kiện bấm nút Thao tác (Dấu ba chấm) trên từng dòng sản phẩm
    const actionButtons = document.querySelectorAll('.card-action-btn');
    actionButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`Bấm tùy chọn thao tác cho sản phẩm dòng thứ: ${index + 1}`);
        });
    });
});