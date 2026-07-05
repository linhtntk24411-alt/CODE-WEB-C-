function loadComponent(elementId, filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`Không thể tải file: ${filePath}`);
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            syncCartBadge();
        })
        .catch(error => console.error(error));
}

function syncCartBadge() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;

    try {
        const saved = localStorage.getItem('cartItems');
        const items = saved ? JSON.parse(saved) : [];
        const total = Array.isArray(items)
            ? items.reduce((sum, item) => sum + (item.quantity || 0), 0)
            : 0;
        cartCount.textContent = total;
        cartCount.style.display = total > 0 ? 'flex' : 'none';
    } catch (error) {
        cartCount.textContent = '0';
        cartCount.style.display = 'none';
    }
}

// Chạy ngay khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header-component", "../components/header.html");
    loadComponent("footer-component", "../components/footer.html");
    syncCartBadge();
});

window.addEventListener('cart:updated', syncCartBadge);
window.addEventListener('storage', syncCartBadge);