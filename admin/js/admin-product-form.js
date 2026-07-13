let base64ImageString = "";
let editingId = null;

document.getElementById('prod-image-file').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const preview = document.getElementById('image-preview');
      preview.src = event.target.result;
      preview.classList.remove('d-none');
      base64ImageString = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        editingId = parseInt(id);
        let products = JSON.parse(localStorage.getItem('products')) || [];
        const product = products.find(p => p.id === editingId);
        
        if (product) {
            document.getElementById('prod-name').value = product.name;
            document.getElementById('prod-category').value = product.category;
            document.getElementById('prod-status').value = product.status;
            document.getElementById('prod-price').value = product.price || product.currentPrice || '';
            document.getElementById('prod-stock').value = product.stock;
            
            if (product.image && product.image !== "https://picsum.photos/200") {
                const preview = document.getElementById('image-preview');
                preview.src = product.image;
                preview.classList.remove('d-none');
                base64ImageString = product.image;
            }
            
            document.querySelector('h2').innerHTML = `<i class="bi bi-pencil-fill text-danger"></i> Sửa Sản Phẩm`;
            document.querySelector('button[type="submit"]').innerHTML = `<i class="bi bi-save"></i> Cập nhật sản phẩm`;
        }
    }
});

// Hàm ghi dữ liệu vào file JSON thật (Đã sửa đường dẫn)
async function syncToJsonFile(updatedData) {
    try {
        const response = await fetch('../data/product.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData, null, 2)
        });
        if (!response.ok) {
            console.warn("Không thể ghi vào file JSON. Dữ liệu vẫn an toàn trong localStorage.");
        }
    } catch (error) {
        console.warn("Lỗi khi ghi file JSON:", error);
    }
}

document.getElementById('product-form').addEventListener('submit', function(e) {
  e.preventDefault(); 

  let products = JSON.parse(localStorage.getItem('products')) || [];

  const name = document.getElementById('prod-name').value;
  const category = document.getElementById('prod-category').value;
  const status = document.getElementById('prod-status').value;
  const price = parseInt(document.getElementById('prod-price').value);
  const stock = parseInt(document.getElementById('prod-stock').value);
  const image = base64ImageString || "https://picsum.photos/200";

  if (editingId) {
      const index = products.findIndex(p => p.id === editingId);
      if (index !== -1) {
          products[index] = { 
              ...products[index], 
              name, 
              category, 
              status, 
              price, 
              currentPrice: price, 
              originalPrice: price, 
              stock, 
              image 
          };
          localStorage.setItem('products', JSON.stringify(products));
          syncToJsonFile(products);
          alert('Cập nhật sản phẩm thành công!');
          window.location.href = 'admin-products.html';
      }
  } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const newProduct = { 
          id: newId, 
          name, 
          category, 
          status, 
          price, 
          currentPrice: price, 
          originalPrice: price, 
          stock, 
          image 
      };
      products.push(newProduct);
      localStorage.setItem('products', JSON.stringify(products));
      syncToJsonFile(products);
      alert('Thêm sản phẩm thành công!');
      window.location.href = 'admin-products.html';
  }
});