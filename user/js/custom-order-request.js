/**
 * URI CORE APPLICATION INTERACTION SCRIPT
 */

// Biến toàn cục lưu trữ file ảnh được chọn duy nhất
let uploadedFileObject = null; 

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('global-header', 'header.html');
    loadComponent('global-footer', 'footer.html');
    initProfileDropdown();
    initFileUploadFeatures();
});

function loadComponent(elementId, filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error("Không thể tải file: " + filePath);
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            if(elementId === 'global-header') {
                initProfileDropdown();
            }
        })
        .catch(error => console.error(error));
}

// --- 1. HANDLE ACCOUNT MENU ACCORDION OVERLAY ---
function initProfileDropdown() {
    const trigger = document.getElementById('profileTrigger');
    const menu = document.getElementById('accountMenu');

    if (!trigger || !menu) return;

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
}

// --- 2. WIZARD CORE ENGINE ---
function nextStep(stepNumber) {
    const stepPanels = document.querySelectorAll('.form-wizard-step');
    stepPanels.forEach(panel => panel.classList.add('hidden'));

    const targetPanel = document.getElementById(`step-${stepNumber}`);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('animate-fade-in');
    }

    for (let i = 1; i <= 3; i++) {
        const circleNode = document.getElementById(`step-node-${i}`);
        if (!circleNode) continue;
        
        const textLabel = circleNode.nextElementSibling;

        if (i <= stepNumber) {
            circleNode.classList.add('active');
            if (textLabel) textLabel.classList.add('active');
        } else {
            circleNode.classList.remove('active');
            if (textLabel) textLabel.classList.remove('active');
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep(step) {
    if (step === 3) {
        renderSummaryPage();
    } else {
        nextStep(step);
    }
}

// --- 3. PARSE FROM INPUT TO STEP 3 CONFIRMATION CANVASES ---
function handleSelectedFiles(files, listContainer) {
    if (files.length === 0) return;

    // Ghi nhớ file ảnh đầu tiên được tải lên để hiển thị sang Bước 3
    uploadedFileObject = files[0]; 

    listContainer.innerHTML = ""; // Xóa danh sách cũ hiển thị trực quan hơn nếu tải lại
    for (let file of files) {
        const itemBox = document.createElement('div');
        itemBox.className = "uploaded-file-item animate-fade-in";
        itemBox.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-symbols-outlined" style="color: var(--primary);">image</span>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 14px; font-weight: 600;">${file.name}</span>
                    <span style="font-size: 10px; color: var(--on-surface-variant);">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
            </div>
            <button style="background:none; border:none; cursor:pointer; color: var(--on-surface-variant);" onclick="removeUploadedFile(this)">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
        listContainer.appendChild(itemBox);
    }
}

function removeUploadedFile(buttonElement) {
    buttonElement.parentElement.remove();
    const fileList = document.getElementById('fileList');
    if (!fileList || fileList.children.length === 0) {
        uploadedFileObject = null;
    }
}

function renderSummaryPage() {
    const reqNameInput = document.getElementById('inputRequestName');
    const sizeInput = document.getElementById('inputSize');
    const beadSelect = document.getElementById('selectBeadType');
    const notesTextarea = document.getElementById('textareaNotes');

    const reqNameValue = reqNameInput ? (reqNameInput.value || '-') : '-';
    const sizeValue = sizeInput ? (sizeInput.value || '-') : '-';
    const notesValue = notesTextarea ? (notesTextarea.value || '-') : '-';
    
    let beadValue = '-';
    if (beadSelect && beadSelect.selectedIndex !== -1) {
        beadValue = beadSelect.options[beadSelect.selectedIndex].text;
    }

    // Đổ dữ liệu chữ sang các trường hiển thị ở Bước 3
    document.getElementById('reviewName').innerText = reqNameValue;
    document.getElementById('reviewSize').innerText = sizeValue;
    document.getElementById('reviewBeadType').innerText = beadValue;
    document.getElementById('reviewNotes').innerText = `"${notesValue}"`;

    // --- LOGIC TỰ ĐỘNG TÍNH TOÁN BÁO GIÁ ĐỘNG THEO KÍCH THƯỚC ---
    let mapPrice = 50000;        // Phí thiết kế cố định
    let materialPrice = 150000;  // Phí nguyên liệu mặc định ban đầu

    // Chuẩn hóa chuỗi kích thước nhập vào (Xóa khoảng trắng, chuyển chữ thường) để bắt từ khóa chính xác
    const sizeText = sizeValue.toLowerCase().replace(/\s+/g, '');

    if (sizeText.includes('5x5')) {
        materialPrice = 30000;   // Kích thước siêu nhỏ 5x5 cm
    } else if (sizeText.includes('15x15')) {
        materialPrice = 120000;  // Kích thước 15x15 cm
    } else if (sizeText.includes('20x20')) {
        materialPrice = 180000;  // Kích thước 20x20 cm
    } else if (sizeText.includes('30x30') || sizeText.includes('large')) {
        materialPrice = 280000;  // Kích thước mẫu 30x30 cm ban đầu
    } else if (sizeText.includes('40x40')) {
        materialPrice = 400000;  // Kích thước lớn 40x40 cm
    }

    // Tăng/giảm giá tiền phụ trội dựa theo độ khó của loại hạt được chọn
    if (beadValue.includes('2.6mm')) {
        materialPrice += 20000; // Hạt nhỏ mini tốn công làm hơn nên cộng thêm tiền
    } else if (beadValue.includes('10mm')) {
        materialPrice -= 20000; // Hạt đại to dễ làm hơn nên giảm bớt tiền
    }

    let totalPrice = mapPrice + materialPrice;

    // Tìm các node hiển thị số tiền tương ứng ở Bước 3 để cập nhật
    const mapPriceNode = document.getElementById('reviewMapPrice');
    const materialPriceNode = document.getElementById('reviewMaterialPrice');
    const totalPriceNode = document.getElementById('reviewTotalPrice');

    if (mapPriceNode) mapPriceNode.innerText = mapPrice.toLocaleString() + 'đ';
    if (materialPriceNode) materialPriceNode.innerText = materialPrice.toLocaleString() + 'đ';
    if (totalPriceNode) totalPriceNode.innerText = totalPrice.toLocaleString() + 'đ';

    // --- LOGIC XỬ LÝ HIỂN THỊ HÌNH ẢNH SANG BƯỚC 3 ---
    const reviewImg = document.getElementById('reviewImg');
    const reviewFileName = document.getElementById('reviewFileName');
    const imagePreviewBox = document.querySelector('.review-image-sidebar');

    if (uploadedFileObject) {
        reviewImg.src = URL.createObjectURL(uploadedFileObject);
        reviewFileName.innerText = uploadedFileObject.name;
        if (imagePreviewBox) imagePreviewBox.style.display = "flex";
    } else {
        if (imagePreviewBox) imagePreviewBox.style.display = "none";
    }

    nextStep(3);
}

// --- 4. DRAG AND DROP HANDLERS ---
function initFileUploadFeatures() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active-zone');
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('active-zone');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        handleSelectedFiles(e.dataTransfer.files, fileList);
    });

    fileInput.addEventListener('change', (e) => {
        handleSelectedFiles(e.target.files, fileList);
    });
}

// --- 5. FINALIZE ACTION PROCESSOR ---
function submitRequest() {
    const btn = document.getElementById('btnSubmitRequest');
    if (!btn) return;

    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Đang gửi...';
    btn.disabled = true;

    setTimeout(() => {
        btn.style.display = 'none';
        
        const successMsg = document.getElementById('successMessage');
        if (successMsg) successMsg.classList.remove('hidden');
        
        // --- LOGIC TẠO MÃ ĐƠN HÀNG NGẪU NHIÊN ---
        // Sinh một số ngẫu nhiên trong khoảng từ 1000 đến 9999
        const randomNumber = Math.floor(1000 + Math.random() * 9000); 
        const codeNode = document.getElementById('randomOrderCode');
        
        if (codeNode) {
            codeNode.innerText = `#ORD-${randomNumber}`;
        }
        // ----------------------------------------

        const modal = document.getElementById('successModal');
        if (modal) modal.classList.remove('hidden');
    }, 1500);
}