document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');

    fetch("../data/gallery-detail.json")
        .then(response => {
            if (!response.ok) throw new Error("Không thể tải dữ liệu.");
            return response.json();
        })
        .then(dataObject => {
            const cleanId = targetId.trim().toUpperCase();
            const currentProduct = dataObject[cleanId];

            if (currentProduct) {
                renderProductDetails(currentProduct);
            } else {
                document.getElementById("project-title").textContent = "Không tìm thấy tác phẩm!";
            }
        })
        .catch(error => console.error("Lỗi đồng bộ hệ thống:", error));
});

function renderProductDetails(product) {
    document.getElementById("breadcrumb-title").textContent = `Hướng dẫn: ${product.title}`;
    document.getElementById("project-title").textContent = `Hướng dẫn làm: ${product.title}`;
    document.getElementById("main-preview-img").src = product.mainImage;
    document.getElementById("main-preview-img").alt = product.title;
    // --- CHÈN THÊM ĐOẠN CODE DƯỚI ĐÂY VÀO NGAY TẠI ĐÂY ---
    const mainImg = document.getElementById("main-preview-img");
    const modal = document.getElementById("image-lightbox-modal");
    const lightboxImg = document.getElementById("lightbox-target-img");
    const closeBtn = document.querySelector(".lightbox-close");

    if (mainImg && modal && lightboxImg) {
        mainImg.style.cursor = "zoom-in";
        
        // Click vào ảnh chính thì mở to
        mainImg.onclick = () => {
            modal.style.display = "flex";
            lightboxImg.src = mainImg.src;
        };

        // Click vào nút X thì đóng
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = "none"; };
        }

        // Click ra vùng nền đen bên ngoài thì đóng
        modal.onclick = (e) => {
            if (e.target === modal) { modal.style.display = "none"; }
        };
    }

    document.getElementById("meta-time").textContent = product.duration || "--";
    document.getElementById("req-time").textContent = product.duration || "--";
    document.getElementById("meta-level").textContent = `Cấp độ: ${product.difficulty || "--"}`;
    document.getElementById("req-pegboard").textContent = product.pegboard || "--";

    const ratingContainer = document.getElementById("rating-stars-container");
    ratingContainer.innerHTML = "";
    const score = parseInt(product.rating) || 5;
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.className = `material-symbols-outlined text-sm ${i <= score ? 'symbol-filled' : ''}`;
        star.textContent = "star";
        ratingContainer.appendChild(star);
    }
    const scoreBadge = document.createElement("span");
    scoreBadge.className = "text-xs font-bold ml-1";
    scoreBadge.textContent = `${score}/5`;
    ratingContainer.appendChild(scoreBadge);
    const colorContainer = document.getElementById("color-list-container");
    colorContainer.innerHTML = "";
    if (product.colors && Array.isArray(product.colors)) {
        product.colors.forEach(color => {
            const item = document.createElement("div");
            item.className = "color-item";
            item.innerHTML = `<span>Mã ${color.code} (${color.name}):</span> <b>${color.quantity} hạt</b>`;
            colorContainer.appendChild(item);
        });
    }
    const stepsContainer = document.getElementById("steps-timeline-container");
    stepsContainer.innerHTML = "";
    if (product.steps && Array.isArray(product.steps)) {
        product.steps.forEach(step => {
            const stepBlock = document.createElement("div");
            stepBlock.className = "step-item";
            
            let stepHtml = `
                <div class="step-badge">${step.number}</div>
                <div class="step-content">
                    <h4>${step.title}</h4>
                    <p>${step.text}</p>
            `;
            if (step.image) stepHtml += `<img class="step-img" src="${step.image}" alt="${step.title}">`;
            if (step.tip) {
                stepHtml += `
                    <div class="tip-box">
                        <span class="material-symbols-outlined">lightbulb</span>
                        <p class="italic" style="font-size:14px; margin:0;">Mẹo: ${step.tip}</p>
                    </div>
                `;
            }
            stepHtml += `</div>`;
            stepBlock.innerHTML = stepHtml;
            stepsContainer.appendChild(stepBlock);
        });
    }

    const showcaseContainer = document.getElementById("community-showcase");
    showcaseContainer.innerHTML = "";
    if (product.showcase && Array.isArray(product.showcase.images)) {
        product.showcase.images.forEach(imgUrl => {
            const thumb = document.createElement("div");
            thumb.className = "sc-thumb";
            thumb.innerHTML = `<img src="${imgUrl}">`;
            showcaseContainer.appendChild(thumb);
        });
        const moreBadge = document.createElement("div");
        moreBadge.className = "count-badge-more";
        moreBadge.textContent = `+${product.showcase.moreCount || 12}`;
        showcaseContainer.appendChild(moreBadge);
    }
    renderRelatedProducts(product.products);

    // --- ĐOẠN CODE THÊM MỚI TẠI ĐÂY ---
    const downloadBtn = document.querySelector('.btn-action-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const pdfContent = document.createElement('div');
            pdfContent.style.width = '190mm'; 
            pdfContent.style.padding = '15px';
            pdfContent.style.fontFamily = '"Times New Roman", Times, serif';
            pdfContent.style.fontSize = '13px'; 
            pdfContent.style.boxSizing = 'border-box';
            
            // Xử lý dữ liệu các bước làm an toàn và sạch sẽ, hỗ trợ hiển thị cả thuộc tính "tip" nếu có
            let stepsHtml = '';
            if (product.steps && Array.isArray(product.steps)) {
                product.steps.forEach(step => {
                    let tipText = step.tip ? `<br><span style="color: #666; font-size: 11px; font-style: italic;">* Mẹo: ${step.tip}</span>` : '';
                    stepsHtml += `
                        <div style="margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid;">
                            <h4 style="color: #000000; margin: 2px 0; font-size: 13px; font-family: 'Times New Roman', Times, serif; font-weight: bold;">Bước ${step.number}: ${step.title}</h4>
                            <p style="margin: 2px 0; color: #333333; font-size: 12px; line-height: 1.3; font-family: 'Times New Roman', Times, serif;">
                                ${step.text}
                                ${tipText}
                            </p>
                        </div>`;
                });
            }

            // Giao diện cấu trúc dạng bảng/cột để tối ưu hóa không gian hiển thị, ngăn chặn lỗi nuốt bước
            pdfContent.innerHTML = `
                <div style="text-align: center; border-bottom: 2px solid #ff2222; padding-bottom: 6px; margin-bottom: 12px;">
                    <img src="../assets/Logo.png" style="max-width: 100px; height: auto; display: inline-block;" alt="Logo Urii" />
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #000000; letter-spacing: 1.5px; font-weight: 600; font-family: 'Times New Roman', Times, serif;">HƯỚNG DẪN LÀM MAP HẠT ỦI CHUẨN</p>
                </div>
                
                <h2 style="color: #000000; text-align: center; margin: 5px 0 2px 0; font-size: 20px; font-family: 'Times New Roman', Times, serif; font-weight: bold;">${product.title}</h2>
                <p style="text-align: center; color: #444444; font-size: 12px; margin: 0 0 15px 0; font-family: 'Times New Roman', Times, serif;">Thời gian: ${product.duration || '--'} | Cấp độ: ${product.difficulty || '--'}</p>
                
                <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 5px;">
                    <tr>
                        <td style="width: 45%; vertical-align: top; padding-right: 15px; text-align: center;">
                            <p style="font-weight: bold; color: #ff2222; font-size: 12px; margin: 0 0 6px 0; letter-spacing: 0.5px; font-family: 'Times New Roman', Times, serif; text-transform: uppercase;">MAP MẪU (IMAGE MAP)</p>
                            <img src="${product.mainImage}" style="width: 220px; height: 220px; object-fit: contain; border-radius: 8px; border: 2px solid #f0f0f0; display: inline-block;" />
                        </td>
                        
                        <td style="width: 55%; vertical-align: top; border-left: 1px dashed #cccccc; padding-left: 15px; text-align: left;">
                            <h3 style="color: #ff2222; border-left: 3px solid #ff2222; padding-left: 6px; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Times New Roman', Times, serif; font-weight: bold;">Các bước thực hiện chi tiết</h3>
                            <div>
                                ${stepsHtml}
                            </div>
                        </td>
                    </tr>
                </table>
            `;
            
            const options = {
                margin:       10,
                filename:     `Urii-Map-${product.title.replace(/\s+/g, '-')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 2, 
                    useCORS: true, 
                    logging: false, 
                    scrollX: 0, 
                    scrollY: 0 
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            html2pdf().set(options).from(pdfContent).save();
        });
    }
}

function renderRelatedProducts(products) {
    const container = document.getElementById('related-products-container');
    container.innerHTML = ""; // Xóa dữ liệu cũ

    if (products && Array.isArray(products) && products.length > 0) {
        products.forEach(item => {
            const productCard = document.createElement("a");
            productCard.className = "product-card";
            productCard.href = "#";
            productCard.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="product-info">
                    <h4>${item.title}</h4>
                    <span class="product-price">${item.price}</span>
                </div>
            `;
            container.appendChild(productCard);
        });
    } else {
        container.innerHTML = "<p style='text-align:center; color:#888;'>Chưa có sản phẩm gợi ý.</p>";
    }
}