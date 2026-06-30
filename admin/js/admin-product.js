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


// ========================================================
// HÀM KHỞI TẠO DỮ LIỆU (QUAN TRỌNG NHẤT)
// ========================================================
async function initData() {
    // 1. Kiểm tra xem trong localStorage có dữ liệu chưa
    const localData = localStorage.getItem('products');
    
    if (localData) {
        // Nếu có dữ liệu trong localStorage -> Dùng luôn (Để hiện sản phẩm vừa thêm)
        console.log("Lấy dữ liệu từ localStorage");
        products = JSON.parse(localData);
        updateStats();
        renderProducts();
    } else {
        // Nếu localStorage rỗng (Lần đầu chạy) -> Tải từ file JSON
        console.log("LocalStorage rỗng, bắt đầu tải từ product.json");
        await loadProductsFromJson();
    }
}

// Hàm tải dữ liệu từ JSON (Chỉ gọi khi lần đầu chạy)
async function loadProductsFromJson() {
    try {
        const baseUrl = window.location.origin + '/WEBKINHDOANH';
        const response = await fetch(`${baseUrl}/product.json`);
        
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        
        const data = await response.json();
        products = data; 
        
        if(products.length === 0) {
            products = getDefaultProducts();
        }

        // Lưu vào localStorage để lần sau tải nhanh hơn
        localStorage.setItem('products', JSON.stringify(products));
        
        updateStats();
        renderProducts();
        
    } catch (error) {
        console.error("Lỗi khi load product.json:", error);
        products = getDefaultProducts();
        localStorage.setItem('products', JSON.stringify(products));
        updateStats();
        renderProducts();
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
                <button class="btn-action-edit" onclick="alert('Tính năng Sửa đang phát triển!')"><i class="bi bi-pencil fs-6"></i></button>
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

document.getElementById('btn-filter').addEventListener('click', () => {
  currentPage = 1;
  renderProducts();
});

document.querySelectorAll('#pagination-controls .page-link').forEach(el => {
  el.addEventListener('click', function(e) { e.preventDefault(); });
});

// ========================================================
// KHỞI CHẠY
// ========================================================
initData();