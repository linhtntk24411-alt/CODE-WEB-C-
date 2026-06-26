// user/js/main.js
document.addEventListener('DOMContentLoaded', function() {
  // Hàm load component
  function loadComponent(selector, url) {
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Không thể tải ' + url);
        return response.text();
      })
      .then(html => {
        document.querySelector(selector).innerHTML = html;
      })
      .catch(error => {
        console.error('Lỗi load component:', error);
        document.querySelector(selector).innerHTML = 
          '<p style="color:red; padding: 10px;">⚠️ Không tải được component</p>';
      });
  }

  // Load các component (đường dẫn từ file HTML trong thư mục html/)
  loadComponent('#header-placeholder', '../components/header.html');
  loadComponent('#footer-placeholder', '../components/footer.html');
  loadComponent('#chatbot-placeholder', '../components/chatbot-widget.html');
});