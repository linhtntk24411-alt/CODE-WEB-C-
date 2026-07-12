// Cấu hình các đường dẫn file dữ liệu và components
const jsonUrl = '../data/gallery.json'; 
const headerUrl = '../components/header.html';
const footerUrl = '../components/footer.html';

const gridTarget = document.getElementById('products-grid-target');
const paginationTarget = document.getElementById('pagination-target');

let allProducts = [];       
let filteredProducts = [];  
let currentPage = 1;
const productsPerPage = 9;  

let currentCategory = "Tất cả mẫu";
let selectedDifficulties = [];
let currentSort = "default";
let searchQuery = ""; 

async function includeComponents() {
    try {
        const headerTarget = document.getElementById('global-header');
        const footerTarget = document.getElementById('global-footer');

        if (headerTarget) {
            const resHeader = await fetch(headerUrl);
            if (resHeader.ok) {
                headerTarget.innerHTML = await resHeader.text();
            }
        }

        if (footerTarget) {
            const resFooter = await fetch(footerUrl);
            if (resFooter.ok) footerTarget.innerHTML = await resFooter.text();
        }
    } catch (error) {
        console.error("Lỗi nhúng Header/Footer:", error);
    }
}

document.addEventListener('focus', function(e) {
    if (e.target && e.target.classList.contains('search-input')) {
        e.target.parentElement.classList.add('search-box-focused');
    }
}, true);

document.addEventListener('blur', function(e) {
    if (e.target && e.target.classList.contains('search-input')) {
        e.target.parentElement.classList.remove('search-box-focused');
    }
}, true);

document.addEventListener('input', function(e) {
    if (e.target && e.target.classList.contains('search-input')) {
        searchQuery = e.target.value.trim().toLowerCase(); // Cập nhật từ khóa liên tục
        // applyFilters(); // Chạy bộ lọc ngay lập tức mà không cần đợi Enter
    }
});

async function fetchProductsData() {
    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        allProducts = await response.json();
        
        updateSidebarCounts(); 
        applyFilters(); 
    } catch (error) {
        console.error("Lỗi tải JSON:", error);
        if (gridTarget) gridTarget.innerHTML = `<p class="error-msg">Không thể kết nối dữ liệu JSON.</p>`;
    }
}

function applyFilters() {
    filteredProducts = allProducts.filter(product => {
        const matchCategory = (currentCategory === "Tất cả mẫu") || 
                              (product.categories && product.categories.includes(currentCategory));
        const matchDifficulty = (selectedDifficulties.length === 0) || 
                                selectedDifficulties.includes(product.difficulty);
        const matchSearch = (searchQuery === "") || 
                            (product.map_name && product.map_name.toLowerCase().includes(searchQuery));

        return matchCategory && matchDifficulty && matchSearch;
    });

    applySort();

    currentPage = 1;
    renderPage(currentPage);
}

function applySort() {
    if (currentSort === "name-az") {
        filteredProducts.sort((a, b) => a.map_name.localeCompare(b.map_name, 'vi'));
    } else if (currentSort === "beads-asc") {
        filteredProducts.sort((a, b) => a.total_beads - b.total_beads);
    }
}

function renderPage(page) {
    if (!gridTarget) return;
    
    currentPage = page;
    gridTarget.innerHTML = "";
    
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    if (pageProducts.length === 0) {
        gridTarget.innerHTML = `<p class="error-msg">Không tìm thấy mẫu Perler Beads nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.</p>`;
        if (paginationTarget) paginationTarget.innerHTML = "";
        return;
    }

    gridTarget.innerHTML = pageProducts.map(product => `
        <article class="pattern-card elevation-1">
            <!-- Tải động link điều hướng chi tiết theo map_id khi click vào vùng ảnh -->
            <div class="card-image-area" style="cursor: pointer;" onclick="window.location.href='gallery-detail.html?id=${product.map_id}'">
                <img class="card-img" src="../${product.main_image}" alt="${product.map_name}">
                <div class="card-floating-badges">
                    ${product.isPopular ? `<span class="badge-tag tag-popular"><span class="material-symbols-outlined">star</span> Phổ biến</span>` : ''}
                    ${product.isNew ? `<span class="badge-tag tag-new">Mẫu mới</span>` : ''}
                </div>
            </div>
            <div class="card-body-content">
                <div class="card-header-row">
                    <!-- Tải động link điều hướng khi click vào tiêu đề sản phẩm -->
                    <h3 class="card-item-title" style="cursor: pointer;" onclick="window.location.href='gallery-detail.html?id=${product.map_id}'">${product.map_name}</h3>
                    <span class="difficulty-badge ${product.difficultyClass || 'badge-medium'}">${product.difficulty}</span>
                </div>
                <p class="card-spec-text">Kích thước: ${product.grid_size}</p>
                <div class="card-footer-action-row">
                    <div class="card-meta-info">
                        <span>Thời gian: ${product.time || 'Đang cập nhật'}</span>
                        <span>Tổng: ${product.total_beads} hạt</span>
                    </div>
                    <div class="card-action-buttons">
                        <!-- Nút xem chi tiết (Con mắt) -->
                        <button class="btn-icon-view" onclick="window.location.href='gallery-detail.html?id=${product.map_id}'">
                            <span class="material-symbols-outlined">visibility</span>
                        </button>
                        <!-- Nút xem hướng dẫn (Quyển sách) -->
                        <button class="btn-action-primary" onclick="saveMapToData('${product.map_id}')">
                            <span class="material-symbols-outlined">menu_book</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `).join('');

    renderPaginationControls();
}

function renderPaginationControls() {
    if (!paginationTarget) return;

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    let paginationHtml = "";

    if (totalPages <= 1) {
        paginationTarget.innerHTML = "";
        return;
    }

    paginationHtml += `
        <button class="page-nav-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <button class="page-number-btn ${i === currentPage ? 'page-number-active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    paginationHtml += `
        <button class="page-nav-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            <span class="material-symbols-outlined">chevron_right</span>
        </button>
    `;

    paginationTarget.innerHTML = paginationHtml;
    setupPaginationEvents();
}

function setupPaginationEvents() {
    if (!paginationTarget) return;
    paginationTarget.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = parseInt(this.getAttribute('data-page'));
            if (targetPage && !this.hasAttribute('disabled')) {
                renderPage(targetPage);
                gridTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function updateSidebarCounts() {
    const counts = {
        "Tất cả mẫu": allProducts.length,
        "Con vật": 0,
        "Hoạt hình": 0,
        "Logo": 0,
        "Trang trí": 0,
        "Hoa quả": 0 
    };

    allProducts.forEach(product => {
        if (product.categories && Array.isArray(product.categories)) {
            product.categories.forEach(cat => {
                if (counts[cat] !== undefined) {
                    counts[cat]++;
                }
            });
        }
    });

    document.querySelectorAll('.count-badge').forEach(badge => {
        const categoryName = badge.getAttribute('data-category');
        if (categoryName && counts[categoryName] !== undefined) {
            badge.textContent = counts[categoryName];
        }
    });
}

function setupFilterEvents() {
    document.querySelectorAll('.menu-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelector('.menu-btn-active')?.classList.remove('menu-btn-active');
            this.classList.add('menu-btn-active');

            let categoryText = this.childNodes[0].textContent.trim();
            if (categoryText === "Trái cây") {
                currentCategory = "Hoa quả";
            } else {
                currentCategory = categoryText;
            }
            applyFilters();
        });
    });

    document.querySelectorAll('.custom-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const difficultyText = this.nextElementSibling.textContent.trim();
            if (this.checked) {
                selectedDifficulties.push(difficultyText);
            } else {
                selectedDifficulties = selectedDifficulties.filter(diff => diff !== difficultyText);
            }
            applyFilters();
        });
    });

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            applyFilters(); 
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    includeComponents();  
    fetchProductsData();  
    setupFilterEvents();  
});
// Hàm xử lý lưu map mẫu khi ấn nút quyển sách
function saveMapToData(mapId) {
    // Tìm thông tin map trong mảng allProducts dựa vào map_id
    const product = allProducts.find(p => p.map_id === mapId);
    if (!product) return;

    // Lấy danh sách đã lưu từ localStorage (nếu chưa có thì tạo mảng rỗng)
    let savedMaps = JSON.parse(localStorage.getItem('savedMaps')) || [];

    // Kiểm tra xem map này đã được lưu trước đó chưa
    const isExist = savedMaps.some(item => item.id === mapId);

    if (!isExist) {
        // Tạo object có cấu trúc tương thích với file saved-maps.json của bạn
        const newSavedMap = {
            id: product.map_id,
            title: product.map_name,
            author: "Urii Thiết kế", // Giá trị mặc định hoặc tùy chỉnh thêm nếu JSON gốc có author
            image: product.main_image,
            rating: 5.0, // Giá trị mặc định
            liked: true
        };

        savedMaps.push(newSavedMap);
        // Lưu lại vào localStorage
        localStorage.setItem('savedMaps', JSON.stringify(savedMaps));
        alert(`Đã lưu "${product.map_name}" vào danh sách của bạn!`);
    } else {
        alert(`Mẫu "${product.map_name}" đã tồn tại trong danh sách lưu.`);
    }
}