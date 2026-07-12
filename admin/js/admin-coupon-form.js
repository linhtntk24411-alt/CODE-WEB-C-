// ================================================================
// THÊM MÃ GIẢM GIÁ - admin-coupon-form.js
// ================================================================

document.addEventListener('DOMContentLoaded', function() {

    // ── Set default date ──
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate) startDate.value = today;
    if (endDate) {
        const future = new Date();
        future.setDate(future.getDate() + 30);
        endDate.value = future.toISOString().split('T')[0];
    }

    // ── Form Submit ──
    document.getElementById('couponForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const code = document.getElementById('couponCode').value.trim();
        const percent = document.getElementById('discountPercent').value.trim();
        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        
        const alertEl = document.getElementById('alert-message');
        const alertIcon = document.getElementById('alert-icon');
        const alertText = document.getElementById('alert-text');

        // Validate
        if (!code) {
            showAlert('danger', 'exclamation-circle', 'Vui lòng nhập mã giảm giá!');
            document.getElementById('couponCode').focus();
            return;
        }
        
        if (!percent || parseFloat(percent) <= 0 || parseFloat(percent) > 100) {
            showAlert('danger', 'exclamation-circle', 'Vui lòng nhập phần trăm giảm hợp lệ (1-100)!');
            document.getElementById('discountPercent').focus();
            return;
        }
        
        if (!start || !end) {
            showAlert('danger', 'exclamation-circle', 'Vui lòng chọn ngày bắt đầu và ngày hết hạn!');
            return;
        }

        // Loading
        const btn = document.getElementById('btnSave');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu...';
        btn.disabled = true;

        // Simulate save
        setTimeout(() => {
            showAlert('success', 'check-circle', `✅ Đã tạo mã giảm giá "${code}" thành công!`);
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            // Reset form
            document.getElementById('couponForm').reset();
            if (startDate) startDate.value = today;
            if (endDate) {
                const future = new Date();
                future.setDate(future.getDate() + 30);
                endDate.value = future.toISOString().split('T')[0];
            }
        }, 1500);
    });

    // ── Helper: Show Alert ──
    function showAlert(type, icon, message) {
        const alertEl = document.getElementById('alert-message');
        const alertIcon = document.getElementById('alert-icon');
        const alertText = document.getElementById('alert-text');
        
        alertEl.className = `alert alert-${type} d-flex align-items-center`;
        alertIcon.className = `bi bi-${icon} me-2`;
        alertText.textContent = message;
        
        // Auto hide after 3s
        clearTimeout(window.alertTimeout);
        window.alertTimeout = setTimeout(() => {
            alertEl.className = 'alert d-none';
        }, 3000);
    }
});