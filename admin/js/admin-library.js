// ================================================================
// JS QUẢN LÝ MAP MẪU (Chỉ load/ghi file JSON)
// ================================================================

let maps = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 4;
let editingId = null;

// ================================================================
// HÀM LOAD DỮ LIỆU TỪ JSON
// ================================================================
async function loadMaps() {
    try {
        const response = await fetch('../data/library.json');
        if (!response.ok) {
            throw new Error(`Không thể tải file library.json (HTTP ${response.status})`);
        }
        maps = await response.json();
        console.log("✅ Đã load dữ liệu từ library.json");
        renderTable();
    } catch (error) {
        console.error("❌ LỖI TẢI DỮ LIỆU:", error.message);
        
        // Hiển thị thông báo lỗi thay vì dùng dữ liệu giả
        const tbody = document.getElementById('map-list');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-5">
                    <i class="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
                    <strong>LỖI TẢI DỮ LIỆU</strong><br>
                    Không thể tải file <code>library.json</code>.<br>
                    <span class="text-muted small">Vui lòng kiểm tra file có tồn tại trong thư mục <code>admin/data/</code>.</span>
                </td>
            </tr>
        `;
        
        document.getElementById('pagination-info').innerText = "Lỗi tải dữ liệu";
        document.getElementById('pagination-controls').innerHTML = '';
    }
}

// ================================================================
// HÀM RENDER BẢNG
// ================================================================
function renderTable() {
    if (maps.length === 0) {
        document.getElementById('map-list').innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5">Chưa có mẫu nào trong danh sách.</td></tr>`;
        document.getElementById('pagination-info').innerText = "Hiển thị 0 trên tổng số 0 mẫu";
        document.getElementById('pagination-controls').innerHTML = '';
        return;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = maps.slice(start, end);

    const tbody = document.getElementById('map-list');
    tbody.innerHTML = '';

    pageData.forEach(m => {
        const stars = '★'.repeat(Math.floor(m.rating)) + '☆'.repeat(5 - Math.floor(m.rating));
        tbody.innerHTML += `
            <tr>
                <td class="ps-4"><img src="${m.image}" alt="${m.name}"></td>
                <td><strong>${m.name}</strong></td>
                <td>${m.author}</td>
                <td>${stars} ${m.rating}</td>
                <td class="pe-4 text-end">
                    <button class="btn-action-edit" onclick="openModal(${m.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn-action-delete" onclick="deleteMap(${m.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });

    document.getElementById('pagination-info').innerText = `Hiển thị ${start + 1}-${Math.min(end, maps.length)} trên tổng số ${maps.length} mẫu`;
    
    const totalPages = Math.ceil(maps.length / ITEMS_PER_PAGE);
    const controls = document.getElementById('pagination-controls');
    controls.innerHTML = '';
    if (totalPages > 1) {
        controls.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage - 1})">«</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            controls.innerHTML += `<li class="page-item ${currentPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
        }
        controls.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage + 1})">»</a></li>`;
    }
}

function changePage(page) { currentPage = page; renderTable(); }

// ================================================================
// HÀM GHI DỮ LIỆU VÀO FILE JSON
// ================================================================
async function saveToJsonFile(data) {
    try {
        const response = await fetch('../data/library.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data, null, 2)
        });
        if (!response.ok) {
            console.warn("Không thể ghi vào file JSON. Dữ liệu vẫn an toàn trong localStorage.");
        } else {
            console.log("✅ Đã đồng bộ dữ liệu xuống library.json");
        }
    } catch (error) {
        console.warn("Lỗi khi ghi file JSON:", error);
    }
}

// ================================================================
// MODAL THÊM / SỬA
// ================================================================
function openModal(id = null) {
    editingId = id;
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('mapForm');
    form.reset();
    document.getElementById('image-preview').classList.add('d-none');

    if (id) {
        const m = maps.find(item => item.id === id);
        if (m) {
            modalTitle.innerText = "Chỉnh sửa mẫu";
            document.getElementById('edit-id').value = m.id;
            document.getElementById('map-name').value = m.name;
            document.getElementById('map-author').value = m.author;
            document.getElementById('map-image').value = m.image;
            document.getElementById('map-rating').value = m.rating;
            document.getElementById('map-desc').value = m.desc || '';
            
            const preview = document.getElementById('image-preview');
            preview.src = m.image;
            preview.classList.remove('d-none');
        }
    } else {
        modalTitle.innerText = "Thêm mẫu mới";
    }

    const modal = new bootstrap.Modal(document.getElementById('mapModal'));
    modal.show();
}

// Xem trước ảnh khi nhập URL
document.getElementById('map-image').addEventListener('input', function() {
    const url = this.value.trim();
    const preview = document.getElementById('image-preview');
    if (url) {
        preview.src = url;
        preview.classList.remove('d-none');
    } else {
        preview.classList.add('d-none');
    }
});

// Lưu mẫu
document.getElementById('btn-save-map').addEventListener('click', function() {
    const name = document.getElementById('map-name').value.trim();
    const author = document.getElementById('map-author').value.trim();
    const image = document.getElementById('map-image').value.trim();
    const rating = parseFloat(document.getElementById('map-rating').value) || 0;
    const desc = document.getElementById('map-desc').value.trim();

    if (!name || !author) {
        alert("Vui lòng điền tên và tác giả!");
        return;
    }

    if (editingId) {
        // Chế độ Sửa
        const index = maps.findIndex(m => m.id === editingId);
        if (index !== -1) {
            maps[index] = { ...maps[index], name, author, image, rating, desc };
        }
    } else {
        // Chế độ Thêm mới
        const newId = maps.length > 0 ? Math.max(...maps.map(m => m.id)) + 1 : 1;
        maps.push({ id: newId, name, author, image, rating, desc });
    }

    // Lưu vào localStorage để hiển thị ngay
    localStorage.setItem('maps', JSON.stringify(maps));
    // Ghi đè vào file JSON thật (bất đồng bộ)
    saveToJsonFile(maps);
    
    renderTable();

    const modal = bootstrap.Modal.getInstance(document.getElementById('mapModal'));
    modal.hide();
});

// Xóa mẫu
function deleteMap(id) {
    if (confirm("Bạn có chắc muốn xóa mẫu này?")) {
        maps = maps.filter(m => m.id !== id);
        localStorage.setItem('maps', JSON.stringify(maps));
        saveToJsonFile(maps);
        renderTable();
    }
}

// ================================================================
// KHỞI CHẠY
// ================================================================
document.getElementById('btn-add-map').addEventListener('click', () => openModal());

document.addEventListener('DOMContentLoaded', loadMaps);