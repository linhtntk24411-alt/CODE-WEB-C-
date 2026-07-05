
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
function handleSelectedFiles(files, listContainer) {
    if (files.length === 0) return;
    uploadedFileObject = files[0]; 

    listContainer.innerHTML = "";
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
    document.getElementById('reviewName').innerText = reqNameValue;
    document.getElementById('reviewSize').innerText = sizeValue;
    document.getElementById('reviewBeadType').innerText = beadValue;
    document.getElementById('reviewNotes').innerText = `"${notesValue}"`;
    let mapPrice = 50000;
    let materialPrice = 150000;
    const sizeText = sizeValue.toLowerCase().replace(/\s+/g, '');

    if (sizeText.includes('5x5')) {
        materialPrice = 30000;
    } else if (sizeText.includes('15x15')) {
        materialPrice = 120000;
    } else if (sizeText.includes('20x20')) {
        materialPrice = 180000;
    } else if (sizeText.includes('30x30') || sizeText.includes('large')) {
        materialPrice = 280000;
    } else if (sizeText.includes('40x40')) {
        materialPrice = 400000;
    }
    if (beadValue.includes('2.6mm')) {
        materialPrice += 20000;
    } else if (beadValue.includes('10mm')) {
        materialPrice -= 20000;
    }

    let totalPrice = mapPrice + materialPrice;

    const mapPriceNode = document.getElementById('reviewMapPrice');
    const materialPriceNode = document.getElementById('reviewMaterialPrice');
    const totalPriceNode = document.getElementById('reviewTotalPrice');

    if (mapPriceNode) mapPriceNode.innerText = mapPrice.toLocaleString() + 'đ';
    if (materialPriceNode) materialPriceNode.innerText = materialPrice.toLocaleString() + 'đ';
    if (totalPriceNode) totalPriceNode.innerText = totalPrice.toLocaleString() + 'đ';

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
function submitRequest() {
    const btn = document.getElementById('btnSubmitRequest');
    if (!btn) return;

    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Đang gửi...';
    btn.disabled = true;

    setTimeout(() => {
        btn.style.display = 'none';
        
        const successMsg = document.getElementById('successMessage');
        if (successMsg) successMsg.classList.remove('hidden');
        
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
// Giả định đây là sự kiện khi bấm nút Xác nhận ở Bước 3
const submitBtn = document.querySelector('.btn-submit'); // Bạn đổi class cho đúng nút của bạn

if (submitBtn) {
    submitBtn.addEventListener('click', () => {
        // 1. Lấy dữ liệu người dùng đã nhập ở Bước 1 & Bước 2
        // (Bạn thay các selector bên dưới bằng đúng ID/Class các ô input trong HTML của bạn nhé)
        const sampleName = document.getElementById('product-name-input')?.value || "Mẫu Custom Mới";
        const sampleSize = document.getElementById('product-size-select')?.value || "30x30cm";
        const sampleImage = document.getElementById('uploaded-img-preview')?.src || "../assets/gallery_assets/mau-banh-kem.webp";

        // 2. Tự động sinh Mã yêu cầu ngẫu nhiên và Ngày gửi hiện tại
        const randomID = `#URII-${Math.floor(1000 + Math.random() * 9000)}`;
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

        // 3. Tạo cấu trúc Object Yêu cầu mới chuẩn khớp với file JSON
        const newRequest = {
            "id": randomID,
            "image": sampleImage,
            "name": sampleName,
            "size": sampleSize,
            "date": formattedDate,
            "statusClass": "status-pending", // Trạng thái mặc định theo yêu cầu của bạn
            "statusText": "Đang chờ duyệt",
            "actionType": "view-delete"       // Cho phép xem/xóa
        };

        // 4. Lấy danh sách cũ từ localStorage (nếu có), nếu chưa có thì tạo mảng rỗng
        let localData = JSON.parse(localStorage.getItem('custom_orders_cache')) || [];
        
        // Đẩy phần tử mới lên đầu danh sách để khi quay lại trang quản lý nó hiện lên đầu luôn
        localData.unshift(newRequest);

        // 5. Lưu ngược lại vào localStorage
        localStorage.setItem('custom_orders_cache', JSON.stringify(localData));

        // 6. Hiển thị thông báo thành công hoặc chuyển hướng về trang danh sách sau khi nhấn
        alert(`Tạo yêu cầu ${randomID} thành công! Hệ thống sẽ đưa bạn về trang theo dõi.`);
        window.location.href = 'custom-order-list.html';
    });
}