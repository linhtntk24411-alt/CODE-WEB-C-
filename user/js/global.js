function loadComponent(elementId, filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`Không thể tải file: ${filePath}`);
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error(error));
}

// Chạy ngay khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header-component", "../components/header.html");
    loadComponent("footer-component", "../components/footer.html");
});