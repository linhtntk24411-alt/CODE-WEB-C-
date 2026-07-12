// ================================================================
// DASHBOARD - admin-dashboard.js (Hoàn chỉnh)
// ================================================================

let revenueChart = null;

document.addEventListener('DOMContentLoaded', function() {

    // ── 1. KHỞI TẠO BIỂU ĐỒ ──
    initRevenueChart();

    // ── 2. STAT CARD HOVER + CLICK ──
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        card.addEventListener('click', function() {
            const label = this.querySelector('.text-muted')?.textContent?.trim() || '';
            let url = '';
            if (label === 'Tổng doanh thu') url = 'admin-orders.html';
            else if (label === 'Tổng đơn hàng') url = 'admin-orders.html';
            else if (label === 'Người dùng hoạt động') url = 'admin-users.html';
            else if (label === 'Tương tác Blog') url = 'admin-blogs.html';
            else if (label === 'Tăng trưởng tháng') url = 'admin-orders.html';
            if (url) window.location.href = url;
        });
    });

    // ── 3. DROPDOWN ĐỔI DỮ LIỆU BIỂU ĐỒ ──
    document.querySelectorAll('.dropdown-item[data-days]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const days = parseInt(this.dataset.days);
            updateChartData(days);
            
            document.querySelectorAll('.dropdown-item[data-days]').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            const btn = this.closest('.dropdown').querySelector('.dropdown-toggle');
            const labels = { 7: '7 ngày qua', 30: '30 ngày qua', 90: '90 ngày qua' };
            btn.textContent = labels[days] || '30 ngày qua';
        });
    });

    // ── 4. NÚT XUẤT BÁO CÁO ──
    const exportBtn = document.querySelector('.btn-export-report');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            showToast('info', 'Chức năng xuất báo cáo đang phát triển!');
        });
    }

    // ── 5. NÚT XUẤT DANH SÁCH ĐƠN HÀNG ──
    const exportOrderBtn = document.querySelector('.btn-export');
    if (exportOrderBtn) {
        exportOrderBtn.addEventListener('click', function() {
            showToast('info', 'Chức năng xuất danh sách đơn hàng đang phát triển!');
        });
    }

    // ── 6. DUYỆT BÀI VIẾT (Nút Xanh) ──
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = this.closest('.blog-item');
            const title = row?.querySelector('.fw-semibold')?.textContent?.trim() || 'Bài viết';
            const author = row?.querySelector('.text-muted')?.textContent?.trim() || '';
            
            if (confirm(`Duyệt bài viết: "${title}"?`)) {
                // Hiệu ứng chuyển đổi
                row.style.transition = 'all 0.3s ease';
                row.style.backgroundColor = '#d1e7dd';
                row.style.borderLeft = '4px solid #198754';
                row.style.borderRadius = '8px';
                
                // Thay đổi trạng thái
                const btnGroup = this.closest('.d-flex');
                btnGroup.innerHTML = `
                    <span class="badge-status badge-status-approved" style="font-family: 'Segoe UI', sans-serif; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background-color: #d1e7dd; color: #0f5132;">
                        <i class="bi bi-check-circle-fill me-1"></i> Đã duyệt
                    </span>
                `;
                
                // Cập nhật badge
                updateBadgeCount();
                
                // Log
                console.log(`✅ Đã duyệt bài: "${title}" bởi ${author}`);
                
                // Thông báo
                showToast('success', `Đã duyệt bài viết: "${title}"`);
            }
        });
    });

    // ── 7. TỪ CHỐI BÀI VIẾT (Nút Đỏ) ──
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = this.closest('.blog-item');
            const title = row?.querySelector('.fw-semibold')?.textContent?.trim() || 'Bài viết';
            const author = row?.querySelector('.text-muted')?.textContent?.trim() || '';
            
            if (confirm(`Bạn có chắc muốn từ chối bài viết: "${title}"?`)) {
                // Hiệu ứng xóa
                row.style.transition = 'all 0.3s ease';
                row.style.backgroundColor = '#f8d7da';
                row.style.borderLeft = '4px solid #dc3545';
                row.style.borderRadius = '8px';
                row.style.opacity = '0';
                row.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    row.remove();
                    updateBadgeCount();
                    showToast('danger', `Đã từ chối bài viết: "${title}"`);
                }, 400);
            }
        });
    });

    // ── 8. NÚT XEM TẤT CẢ BÀI VIẾT ──
    document.querySelectorAll('.btn-view-all').forEach(btn => {
        btn.addEventListener('click', function() {
            window.location.href = 'admin-blogs.html';
        });
    });

    // ── 9. NÚT ĐẶT MUA VẬT TƯ ──
    document.querySelectorAll('.btn-supply').forEach(btn => {
        btn.addEventListener('click', function() {
            showToast('info', 'Chức năng đặt mua vật tư đang phát triển!');
        });
    });

    // ── 10. LỊCH SỬ HOẠT ĐỘNG ──
    document.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', function() {
            const text = this.querySelector('p')?.textContent?.trim() || '';
            const orderMatch = text.match(/#(\d+)/);
            if (orderMatch) {
                window.location.href = `admin-orders.html?search=#${orderMatch[1]}`;
            } else if (text.includes('Người dùng mới')) {
                window.location.href = 'admin-users.html';
            } else if (text.includes('Chiến dịch')) {
                window.location.href = 'admin-coupons.html';
            } else {
                window.location.href = 'admin-orders.html';
            }
        });
    });

    // ── 11. THAO TÁC NHANH ──
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action || '';
            if (action === 'product') {
                const modal = new bootstrap.Modal(document.getElementById('createProductModal'));
                modal.show();
            } else if (action === 'blog') {
                const modal = new bootstrap.Modal(document.getElementById('createBlogModal'));
                modal.show();
            } else if (action === 'coupon') {
                const modal = new bootstrap.Modal(document.getElementById('createCouponModal'));
                modal.show();
            }
        });
    });

    console.log('Dashboard đã sẵn sàng!');
});

// ================================================================
// CẬP NHẬT BADGE COUNT
// ================================================================
function updateBadgeCount() {
    const remaining = document.querySelectorAll('.blog-item').length;
    const badge = document.getElementById('blog-badge');
    if (badge) {
        badge.textContent = `${remaining} Mới`;
        if (remaining === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'inline-block';
        }
    }
}

// ================================================================
// HÀM HIỂN THỊ TOAST THÔNG BÁO
// ================================================================
function showToast(type, message) {
    // Xóa toast cũ nếu có
    const oldToast = document.querySelector('.custom-toast');
    if (oldToast) oldToast.remove();
    
    const colors = {
        success: { bg: '#198754', icon: 'bi-check-circle-fill' },
        danger: { bg: '#dc3545', icon: 'bi-x-circle-fill' },
        warning: { bg: '#ffc107', icon: 'bi-exclamation-triangle-fill' },
        info: { bg: '#0dcaf0', icon: 'bi-info-circle-fill' }
    };
    
    const color = colors[type] || colors.info;
    
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 30px;
        background: ${color.bg};
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 500;
        transform: translateX(120%);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-width: 420px;
        border: 1px solid rgba(255,255,255,0.15);
        backdrop-filter: blur(4px);
    `;
    
    toast.innerHTML = `
        <i class="bi ${color.icon}" style="font-size: 20px;"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            font-size: 18px;
            cursor: pointer;
            padding: 0 4px;
            margin-left: 4px;
        ">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    // Hiển thị với animation
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 50);
    
    // Tự động ẩn sau 4 giây
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 400);
    }, 4000);
}

// ================================================================
// PREVIEW ẢNH BLOG
// ================================================================
window.previewImage = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('imagePreview');
            const box = document.getElementById('imagePreviewBox');
            img.src = e.target.result;
            img.style.display = 'block';
            box.querySelector('i').style.display = 'none';
            box.querySelector('span').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
};

// ================================================================
// PREVIEW ẢNH SẢN PHẨM
// ================================================================
window.previewProductImage = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('productImagePreview');
            const box = document.getElementById('productImagePreviewBox');
            img.src = e.target.result;
            img.style.display = 'block';
            box.querySelector('i').style.display = 'none';
            box.querySelector('span').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
};

// ================================================================
// LƯU BÀI VIẾT
// ================================================================
document.getElementById('btnSaveBlog')?.addEventListener('click', function() {
    const title = document.getElementById('blogTitle').value.trim();
    const author = document.getElementById('blogAuthor').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const category = document.getElementById('blogCategory').value;

    if (!title) {
        showToast('warning', 'Vui lòng nhập tiêu đề bài viết!');
        document.getElementById('blogTitle').focus();
        return;
    }
    if (!author) {
        showToast('warning', 'Vui lòng nhập tên tác giả!');
        document.getElementById('blogAuthor').focus();
        return;
    }
    if (!content) {
        showToast('warning', 'Vui lòng nhập nội dung bài viết!');
        document.getElementById('blogContent').focus();
        return;
    }

    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Đang lưu...';
    btn.disabled = true;

    setTimeout(() => {
        const fileInput = document.getElementById('blogImage');
        const fileName = fileInput.files[0]?.name || 'Không có ảnh';

        const newPost = {
            id: '#' + Date.now().toString().slice(-6),
            title: title,
            author: author,
            content: content,
            category: category || 'Chưa phân loại',
            image: fileName,
            date: new Date().toLocaleDateString('vi-VN'),
            status: 'Chờ duyệt'
        };

        console.log('Bài viết mới:', newPost);
        showToast('success', `Đã tạo bài viết "${title}" thành công!`);

        document.getElementById('createBlogForm').reset();
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('imagePreviewBox').querySelector('i').style.display = 'block';
        document.getElementById('imagePreviewBox').querySelector('span').style.display = 'block';

        const modal = bootstrap.Modal.getInstance(document.getElementById('createBlogModal'));
        modal.hide();

        btn.innerHTML = originalText;
        btn.disabled = false;

        // Chuyển đến trang blogs để xem bài mới
        setTimeout(() => {
            window.location.href = 'admin-blogs.html';
        }, 500);
    }, 1500);
});

// ── Reset form blog khi đóng modal ──
document.getElementById('createBlogModal')?.addEventListener('hidden.bs.modal', function() {
    document.getElementById('createBlogForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imagePreviewBox').querySelector('i').style.display = 'block';
    document.getElementById('imagePreviewBox').querySelector('span').style.display = 'block';
});

// ================================================================
// LƯU SẢN PHẨM
// ================================================================
document.getElementById('btnSaveProduct')?.addEventListener('click', function() {
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const status = document.getElementById('productStatus').value;
    const price = document.getElementById('productPrice').value.trim();
    const stock = document.getElementById('productStock').value.trim();
    const fileInput = document.getElementById('productImage');
    const fileName = fileInput.files[0]?.name || 'Không có ảnh';

    if (!name) {
        showToast('warning', 'Vui lòng nhập tên sản phẩm!');
        document.getElementById('productName').focus();
        return;
    }
    if (!price || parseFloat(price) <= 0) {
        showToast('warning', 'Vui lòng nhập giá sản phẩm hợp lệ!');
        document.getElementById('productPrice').focus();
        return;
    }
    if (!stock || parseInt(stock) < 0) {
        showToast('warning', 'Vui lòng nhập số lượng kho hợp lệ!');
        document.getElementById('productStock').focus();
        return;
    }

    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Đang lưu...';
    btn.disabled = true;

    setTimeout(() => {
        const newProduct = {
            id: '#' + Date.now().toString().slice(-6),
            name: name,
            category: category,
            status: status,
            price: parseFloat(price),
            stock: parseInt(stock),
            image: fileName,
            date: new Date().toLocaleDateString('vi-VN')
        };

        console.log('Sản phẩm mới:', newProduct);
        showToast('success', `Đã thêm sản phẩm "${name}" thành công!`);

        document.getElementById('createProductForm').reset();
        document.getElementById('productImagePreview').style.display = 'none';
        document.getElementById('productImagePreviewBox').querySelector('i').style.display = 'block';
        document.getElementById('productImagePreviewBox').querySelector('span').style.display = 'block';

        const modal = bootstrap.Modal.getInstance(document.getElementById('createProductModal'));
        modal.hide();

        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 1500);
});

// ── Reset form sản phẩm khi đóng modal ──
document.getElementById('createProductModal')?.addEventListener('hidden.bs.modal', function() {
    document.getElementById('createProductForm').reset();
    document.getElementById('productImagePreview').style.display = 'none';
    document.getElementById('productImagePreviewBox').querySelector('i').style.display = 'block';
    document.getElementById('productImagePreviewBox').querySelector('span').style.display = 'block';
});

// ================================================================
// LƯU MÃ GIẢM GIÁ
// ================================================================

// ── Set default date cho coupon ──
document.getElementById('createCouponModal')?.addEventListener('show.bs.modal', function() {
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('couponStartDate');
    const endDate = document.getElementById('couponEndDate');
    if (startDate) startDate.value = today;
    if (endDate) {
        const future = new Date();
        future.setDate(future.getDate() + 30);
        endDate.value = future.toISOString().split('T')[0];
    }
});

// ── Xử lý lưu mã giảm giá ──
document.getElementById('btnSaveCoupon')?.addEventListener('click', function() {
    const code = document.getElementById('couponCode').value.trim();
    const percent = document.getElementById('couponPercent').value.trim();
    const minOrder = document.getElementById('couponMinOrder').value.trim() || 0;
    const maxUses = document.getElementById('couponMaxUses').value.trim() || 'Không giới hạn';
    const startDate = document.getElementById('couponStartDate').value;
    const endDate = document.getElementById('couponEndDate').value;
    const status = document.getElementById('couponStatus').value;
    const statusText = status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng';

    if (!code) {
        showToast('warning', 'Vui lòng nhập mã giảm giá!');
        document.getElementById('couponCode').focus();
        return;
    }
    if (!percent || parseFloat(percent) <= 0 || parseFloat(percent) > 100) {
        showToast('warning', 'Vui lòng nhập phần trăm giảm hợp lệ (1-100)!');
        document.getElementById('couponPercent').focus();
        return;
    }
    if (!startDate || !endDate) {
        showToast('warning', 'Vui lòng chọn ngày bắt đầu và ngày hết hạn!');
        return;
    }

    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Đang lưu...';
    btn.disabled = true;

    setTimeout(() => {
        const newCoupon = {
            id: '#' + Date.now().toString().slice(-6),
            code: code,
            percent: percent + '%',
            minOrder: minOrder,
            maxUses: maxUses,
            startDate: startDate,
            endDate: endDate,
            status: statusText,
            createdAt: new Date().toLocaleDateString('vi-VN')
        };

        console.log('Mã giảm giá mới:', newCoupon);
        showToast('success', `Đã thêm mã giảm giá "${code}" thành công!`);

        document.getElementById('createCouponForm').reset();

        const modal = bootstrap.Modal.getInstance(document.getElementById('createCouponModal'));
        modal.hide();

        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 1500);
});

// ── Reset form coupon khi đóng modal ──
document.getElementById('createCouponModal')?.addEventListener('hidden.bs.modal', function() {
    document.getElementById('createCouponForm').reset();
});

// ================================================================
// HÀM TẠO BIỂU ĐỒ
// ================================================================
function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const actualData = [12000, 18000, 15000, 22000, 28000, 19000, 28400];
    const forecastData = [13000, 17000, 16000, 21000, 27000, 20000, 29000];

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh thu',
                    data: actualData,
                    backgroundColor: '#840001',
                    borderRadius: 4,
                    barPercentage: 0.5
                },
                {
                    label: 'Dự kiến',
                    data: forecastData,
                    backgroundColor: 'rgba(255, 152, 0, 0.6)',
                    borderRadius: 4,
                    barPercentage: 0.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.raw.toLocaleString('en-US');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000) return '$' + (value / 1000) + 'k';
                            return '$' + value;
                        }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// ================================================================
// CẬP NHẬT DỮ LIỆU BIỂU ĐỒ
// ================================================================
function updateChartData(days) {
    if (!revenueChart) return;

    let labels = [], actualData = [], forecastData = [];

    if (days === 7) {
        labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        actualData = [12000, 18000, 15000, 22000, 28000, 19000, 28400];
        forecastData = [13000, 17000, 16000, 21000, 27000, 20000, 29000];
    } else if (days === 30) {
        labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        actualData = [45000, 52000, 48000, 61000];
        forecastData = [47000, 50000, 51000, 59000];
    } else if (days === 90) {
        labels = ['T1', 'T2', 'T3'];
        actualData = [120000, 150000, 180000];
        forecastData = [130000, 145000, 175000];
    }

    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = actualData;
    revenueChart.data.datasets[1].data = forecastData;
    revenueChart.update();
}