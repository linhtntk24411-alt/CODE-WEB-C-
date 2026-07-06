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