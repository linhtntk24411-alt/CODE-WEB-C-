// ================================================================
// JS QUẢN LÝ MAP MẪU (Liên kết với Thư Viện Map Mẫu bên User)
// ================================================================

let maps = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 4;
let editingId = null;

// ================================================================
// HÀM LOAD DỮ LIỆU TỪ JSON
// ================================================================
async function loadMaps() {
    // Thử load từ localStorage trước
    const localData = localStorage.getItem('library_maps');
    if (localData) {
        try {
            maps = JSON.parse(localData);
            if (Array.isArray(maps) && maps.length > 0) {
                renderTable();
                return;
            }
        } catch(e) {
            console.error(e);
        }
    }

    try {
        const response = await fetch('../../user/data/gallery.json');
        if (!response.ok) {
            throw new Error(`Không thể tải file gallery.json (HTTP ${response.status})`);
        }
        maps = await response.json();
        localStorage.setItem('library_maps', JSON.stringify(maps));
        console.log("✅ Đã load dữ liệu từ gallery.json");
        renderTable();
    } catch (error) {
        console.error("❌ LỖI TẢI DỮ LIỆU:", error.message);
        
        const tbody = document.getElementById('map-list');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-5">
                    <i class="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
                    <strong>LỖI TẢI DỮ LIỆU</strong><br>
                    Không thể tải file <code>gallery.json</code>.<br>
                    <span class="text-muted small">Vui lòng kiểm tra file có tồn tại trong thư mục <code>user/data/</code>.</span>
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
        let imgPath = m.main_image || '';
        if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
            imgPath = '../../user/' + imgPath;
        }

        // Chọn badge cho độ khó
        let badgeClass = 'bg-secondary';
        if (m.difficulty === 'Dễ') badgeClass = 'bg-success';
        else if (m.difficulty === 'Trung bình') badgeClass = 'bg-warning text-dark';
        else if (m.difficulty === 'Khó') badgeClass = 'bg-danger';

        tbody.innerHTML += `
            <tr>
                <td class="ps-4"><img src="${imgPath}" alt="${m.map_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td><strong>${m.map_name}</strong></td>
                <td><span class="badge ${badgeClass}">${m.difficulty || 'Chưa rõ'}</span></td>
                <td>${m.grid_size || '--'}</td>
                <td><span class="fw-bold text-danger">${m.total_beads || 0}</span> hạt</td>
                <td class="pe-4 text-end">
                    <button class="btn-action-edit" onclick="openModal('${m.map_id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-action-delete" onclick="deleteMap('${m.map_id}')"><i class="bi bi-trash"></i></button>
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
        const response = await fetch('../../user/data/gallery.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data, null, 2)
        });
        if (!response.ok) {
            console.warn("Không thể ghi vào file JSON. Dữ liệu vẫn an toàn trong localStorage.");
        } else {
            console.log("✅ Đã đồng bộ dữ liệu xuống gallery.json");
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
        const m = maps.find(item => item.map_id === id);
        if (m) {
            modalTitle.innerText = "Chỉnh sửa mẫu";
            document.getElementById('edit-id').value = m.map_id;
            document.getElementById('map-name').value = m.map_name;
            document.getElementById('map-author').value = m.author || 'Urii Thiết kế';
            document.getElementById('map-image').value = m.main_image;
            document.getElementById('map-difficulty').value = m.difficulty || 'Dễ';
            document.getElementById('map-grid-size').value = m.grid_size || '';
            document.getElementById('map-total-beads').value = m.total_beads || '';
            document.getElementById('map-bead-type').value = m.bead_type || 'Midi 5mm';
            document.getElementById('map-desc').value = m.description || '';
            document.getElementById('map-time').value = m.time || '';
            
            const preview = document.getElementById('image-preview');
            let imgPath = m.main_image || '';
            if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
                imgPath = '../../user/' + imgPath;
            }
            preview.src = imgPath;
            preview.classList.remove('d-none');
        }
    } else {
        modalTitle.innerText = "Thêm mẫu mới";
    }

    const modal = new bootstrap.Modal(document.getElementById('mapModal'));
    modal.show();
}

// Xem trước ảnh
document.getElementById('map-image').addEventListener('input', function() {
    const url = this.value.trim();
    const preview = document.getElementById('image-preview');
    if (url) {
        let imgPath = url;
        if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
            imgPath = '../../user/' + imgPath;
        }
        preview.src = imgPath;
        preview.classList.remove('d-none');
    } else {
        preview.classList.add('d-none');
    }
});

// Lưu mẫu
document.getElementById('btn-save-map').addEventListener('click', function() {
    const map_name = document.getElementById('map-name').value.trim();
    const author = document.getElementById('map-author').value.trim();
    const main_image = document.getElementById('map-image').value.trim();
    const difficulty = document.getElementById('map-difficulty').value;
    const grid_size = document.getElementById('map-grid-size').value.trim();
    const total_beads = parseInt(document.getElementById('map-total-beads').value) || 0;
    const bead_type = document.getElementById('map-bead-type').value.trim();
    const description = document.getElementById('map-desc').value.trim();
    const time = document.getElementById('map-time').value.trim();

    if (!map_name) {
        alert("Vui lòng điền tên mẫu!");
        return;
    }

    let difficultyClass = 'badge-easy';
    if (difficulty === 'Trung bình') difficultyClass = 'badge-medium';
    else if (difficulty === 'Khó') difficultyClass = 'badge-hard';

    if (editingId) {
        // Sửa
        const index = maps.findIndex(m => m.map_id === editingId);
        if (index !== -1) {
            maps[index] = { 
                ...maps[index], 
                map_name, 
                author, 
                main_image, 
                difficulty, 
                difficultyClass, 
                grid_size, 
                total_beads, 
                bead_type, 
                description,
                time
            };
        }
    } else {
        // Thêm mới
        const nextNum = maps.length > 0 ? Math.max(...maps.map(m => {
            const num = parseInt(m.map_id.substring(1));
            return isNaN(num) ? 0 : num;
        })) + 1 : 1;
        
        const map_id = 'M' + nextNum.toString().padStart(2, '0');
        maps.push({
            map_id,
            map_name,
            author,
            main_image,
            gallery_images: [],
            difficulty,
            difficultyClass,
            categories: ["Trang trí"],
            grid_size,
            bead_type,
            total_beads,
            download_link: "",
            description,
            time: time || "15-20 phút",
            related_product_ids: []
        });
    }

    // Lưu vào localStorage
    localStorage.setItem('library_maps', JSON.stringify(maps));
    // Ghi đè vào file JSON
    saveToJsonFile(maps);
    
    renderTable();

    const modal = bootstrap.Modal.getInstance(document.getElementById('mapModal'));
    modal.hide();
});

// Xóa mẫu
function deleteMap(id) {
    if (confirm("Bạn có chắc muốn xóa mẫu này?")) {
        maps = maps.filter(m => m.map_id !== id);
        localStorage.setItem('library_maps', JSON.stringify(maps));
        saveToJsonFile(maps);
        renderTable();
    }
}

// Khởi chạy
document.getElementById('btn-add-map').addEventListener('click', () => openModal());
document.addEventListener('DOMContentLoaded', loadMaps);