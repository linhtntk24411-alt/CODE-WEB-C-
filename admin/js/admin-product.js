let products = [];
let currentPage = 1;
const itemsPerPage = 4;

const categoriesMap = { "hat-nhua": "Hạt nhựa", "dung-cu": "Dụng cụ", "handmade": "Handmade" };
const statusMap = { 
  "normal": { text: "Bình thường", class: "badge-status-normal" },
  "sap-het": { text: "Sắp hết hàng", class: "badge-status-sap-het" },
  "het-hang": { text: "Hết hàng", class: "badge-status-het-hang" },
  "new": { text: "Mới", class: "badge-status-new" },
  "hot": { text: "Bán chạy", class: "badge-status-hot" }
};

async function initData() {
    const localData = localStorage.getItem('products');
    if (localData) {
        products = JSON.parse(localData);
        if (products.length > 0) {
            updateStats();
            renderProducts();
            return;
        }
    }
    await loadProductsFromJson();
}

async function loadProductsFromJson() {
    try {
        const response = await fetch('../data/product.json');
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        const data = await response.json();
        products = data; 
        if (products.length === 0) {
            console.warn("File product.json đang rỗng.");
        }
        localStorage.setItem('products', JSON.stringify(products));
        updateStats();
        renderProducts();
    } catch (error) {
        console.error("❌ LỖI:", error.message);
        document.getElementById('product-list').innerHTML = `<tr><td colspan="7" class="text-center text-danger py-5">
            <i class="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
            <strong>LỖI TẢI DỮ LIỆU</strong><br>
            Không thể tải file <code>../data/product.json</code>.
        </td></tr>`;
        document.getElementById('stat-total').innerText = "0";
        document.getElementById('stat-warning').innerText = "0";
        document.getElementById('stat-danger').innerText = "0";
        document.getElementById('stat-new').innerText = "0";
        document.getElementById('stat-hot').innerText = "0";
    }
}

function updateStats() {
  document.getElementById('stat-total').innerText = products.length;
  document.getElementById('stat-warning').innerText = products.filter(p => p.status === 'sap-het').length;
  document.getElementById('stat-danger').innerText = products.filter(p => p.status === 'het-hang').length;
  document.getElementById('stat-new').innerText = products.filter(p => p.status === 'new').length;
  document.getElementById('stat-hot').innerText = products.filter(p => p.status === 'hot').length;
}

function renderProducts() {
  const searchName = document.getElementById('search-name').value.toLowerCase();
  const catFilter = document.getElementById('filter-category').value;
  const statusFilter = document.getElementById('filter-status').value;
  const priceFilter = document.getElementById('filter-price').value;

  let filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(searchName);
    const matchCat = !catFilter || p.category === catFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    let matchPrice = true;
    if (priceFilter) {
      const [min, max] = priceFilter.split('-').map(Number);
      matchPrice = p.price >= min && p.price <= max;
    }
    return matchName && matchCat && matchStatus && matchPrice;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  const tbody = document.getElementById('product-list');
  tbody.innerHTML = '';

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">Không tìm thấy sản phẩm phù hợp</td></tr>`;
  } else {
    pageItems.forEach(p => {
      const sku = "KIT-" + p.id.toString().padStart(3, '0') + "-" + p.name.substring(0,3).toUpperCase();
      const status = statusMap[p.status] || { text: p.status, class: 'badge-status-normal' };
      
      tbody.innerHTML += `
        <tr>
          <td class="ps-4"><img src="${p.image}" alt="${p.name}"></td>
          <td>
            <strong class="text-dark fs-6">${p.name}</strong>
            <div class="sku-text text-muted">SKU: ${sku}</div>
          </td>
          <td><span class="badge bg-light text-dark border rounded-pill px-3">${categoriesMap[p.category] || p.category}</span></td>
          <td class="text-danger fw-bold">${p.price.toLocaleString('vi-VN')}đ</td>
          <td>${p.stock}</td>
          <td><span class="badge rounded-pill px-3 ${status.class}">${status.text}</span></td>
          <td class="pe-4">
            <div class="d-flex justify-content-end gap-2">
                <button class="btn-action-edit" onclick="openEditModal(${p.id})"><i class="bi bi-pencil fs-6"></i></button>
                <button class="btn-action-delete" onclick="deleteProduct(${p.id})"><i class="bi bi-trash fs-6"></i></button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  document.getElementById('pagination-info').innerText = `Hiển thị ${totalItems ? startIdx + 1 : 0}-${Math.min(startIdx + itemsPerPage, totalItems)} trên tổng số ${totalItems} sản phẩm`;
  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  const controls = document.getElementById('pagination-controls');
  controls.innerHTML = '';
  controls.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage - 1})">«</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    controls.innerHTML += `<li class="page-item ${currentPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
  }
  controls.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage + 1})">»</a></li>`;
}

function changePage(page) { currentPage = page; renderProducts(); }

function deleteProduct(id) {
  if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
    products = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(products));
    updateStats(); renderProducts();
  }
}

// ========================================================
// CHỨC NĂNG SỬA SẢN PHẨM (CÓ THỂ ĐỔI ẢNH)
// ========================================================
let editNewImageBase64 = null;

// Xem trước ảnh mới khi chọn file
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('edit-image-file');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('edit-image-preview');
                    preview.src = event.target.result;
                    preview.classList.remove('d-none');
                    editNewImageBase64 = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function openEditModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    // Reset biến ảnh mới
    editNewImageBase64 = null;
    document.getElementById('edit-image-file').value = '';

    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-category').value = product.category;
    document.getElementById('edit-status').value = product.status;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-stock').value = product.stock;

    const preview = document.getElementById('edit-image-preview');
    preview.src = product.image;
    preview.classList.remove('d-none');

    const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
    editModal.show();
}

document.getElementById('editProductForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('edit-id').value);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return;

    const name = document.getElementById('edit-name').value.trim();
    const category = document.getElementById('edit-category').value;
    const status = document.getElementById('edit-status').value;
    const price = document.getElementById('edit-price').value.trim();
    const stock = document.getElementById('edit-stock').value.trim();

    if (name !== '') products[index].name = name;
    if (category !== '') products[index].category = category;
    if (status !== '') products[index].status = status;
    if (price !== '') products[index].price = parseInt(price);
    if (stock !== '') products[index].stock = parseInt(stock);

    // Nếu có ảnh mới, cập nhật ảnh. Nếu không, giữ ảnh cũ.
    if (editNewImageBase64) {
        products[index].image = editNewImageBase64;
    }

    localStorage.setItem('products', JSON.stringify(products));
    
    const editModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
    editModal.hide();

    updateStats();
    renderProducts();
});

document.getElementById('btn-filter').addEventListener('click', () => {
  currentPage = 1;
  renderProducts();
});

document.querySelectorAll('#pagination-controls .page-link').forEach(el => {
  el.addEventListener('click', function(e) { e.preventDefault(); });
});

initData();