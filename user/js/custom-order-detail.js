document.addEventListener("DOMContentLoaded", () => {
    // 1. Trích xuất Mã yêu cầu thiết kế từ đường dẫn URL (ví dụ: ?id=#URII-9811)
    const urlParams = new URLSearchParams(window.location.search);
    let requestId = urlParams.get('id');

    // Nếu không có ID trên URL, mặc định tìm đơn đã báo giá đầu tiên trong hệ thống
    if (!requestId) {
        requestId = "#URII-9811"; 
    }

    // Hiển thị mã ID lên tiêu đề giao diện
    document.getElementById('title-request-id').textContent = requestId;

    // 2. Chạy tải song song cả 2 file JSON (Danh sách đơn và Bảng giá Admin)
    Promise.all([
        fetch('../data/custom-order-list.json').then(res => res.json()),
        fetch('../data/custom-order-detail.json').then(res => res.json())
    ])
    .then(([orderList, quotations]) => {
        
        // Tìm thông tin hình ảnh từ danh sách đơn hàng custom
        const matchedOrder = orderList.find(item => item.id === requestId);

        // BẢO VỆ LOGIC: Chỉ hiển thị dữ liệu nếu trạng thái đơn là "Đã báo giá"
        if (!matchedOrder || matchedOrder.statusClass !== 'status-quoted') {
            document.querySelector('.detail-grid').innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 48px; color: var(--danger);">
                    <span class="material-symbols-outlined" style="font-size: 48px;">error</span>
                    <p style="font-size: 16px; font-weight: bold; margin-top: 12px;">
                        Yêu cầu không tồn tại hoặc chưa được Admin cấp bảng báo giá công khai.
                    </p>
                    <a href="custom-order-list.html" style="color: var(--primary-container); font-weight:600;">Quay lại danh sách theo dõi</a>
                </div>`;
            return;
        }

        // 3. Đổ dữ liệu thông tin nền từ file danh sách đơn hàng
        document.getElementById('request-image').src = matchedOrder.image;
        document.getElementById('request-date').textContent = `Gửi ngày ${matchedOrder.date}`;
        document.getElementById('spec-name').textContent = matchedOrder.name;
        document.getElementById('spec-size').textContent = matchedOrder.size;

        // 4. Tìm kiếm bảng báo giá tiền tệ tương ứng trong file admin-quotations.json
        const quoteData = quotations[requestId] || quotations['default'];

        // Đổ thông tin kỹ thuật mở rộng
        document.getElementById('spec-bead-type').textContent = quoteData.beadType;
        document.getElementById('spec-bead-count').textContent = quoteData.beadCount;
        document.getElementById('spec-complexity').textContent = quoteData.complexity;

        // Đổ chi tiết tiền tài chính (định dạng VND .toLocaleString)
        document.getElementById('price-design').textContent = `${quoteData.designFee.toLocaleString('vi-VN')}đ`;
        document.getElementById('price-beads').textContent = `${quoteData.beadsFee.toLocaleString('vi-VN')}đ`;
        document.getElementById('price-tools').textContent = `${quoteData.toolsFee.toLocaleString('vi-VN')}đ`;
        document.getElementById('price-total').textContent = `${quoteData.total.toLocaleString('vi-VN')}đ`;

        // Đổ lời khuyên kiến thức của thợ thiết kế
        document.getElementById('advice-text').innerHTML = quoteData.stylistAdvice;

        // 5. Khởi động tương tác vi mô cho các nút bấm hành động cuối trang
        initButtonInteractions(requestId);
    })
    .catch(error => {
        console.error("Lỗi đồng bộ API cục bộ:", error);
    });
});

function initButtonInteractions(id) {
    // Xử lý nút Chấp nhận
    const btnAccept = document.getElementById('btn-accept');
    if (btnAccept) {
        btnAccept.addEventListener('click', () => {
            btnAccept.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Đang kết nối...';
            setTimeout(() => {
                alert(`Đang khởi tạo cổng thanh toán an toàn cho yêu cầu ${id}.`);
                btnAccept.innerHTML = '<span class="material-symbols-outlined">shopping_cart_checkout</span> Xác nhận & Thanh toán';
            }, 1000);
        });
    }

    // Xử lý nút Từ chối
    const btnReject = document.getElementById('btn-reject');
    if (btnReject) {
        btnReject.addEventListener('click', () => {
            if (confirm(`Bạn chắc chắn muốn hủy bỏ bảng báo giá của yêu cầu thiết kế ${id}?`)) {
                alert("Yêu cầu đã được đóng lại thành công.");
                window.location.href = "custom-order-list.html";
            }
        });
    }

    // Xử lý nút Thảo luận thêm
    const btnDiscuss = document.getElementById('btn-discuss');
    if (btnDiscuss) {
        btnDiscuss.addEventListener('click', () => {
            alert(`Đang kết nối cổng chat trực tuyến 1-1 với Kỹ thuật viên phụ trách map ${id}.`);
        });
    }
}