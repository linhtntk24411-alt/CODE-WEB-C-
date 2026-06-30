let base64ImageString = "";

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

document.getElementById('product-form').addEventListener('submit', function(e) {
  e.preventDefault(); 

  let products = JSON.parse(localStorage.getItem('products')) || [];
  const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

  const newProduct = {
    id: newId,
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    status: document.getElementById('prod-status').value,
    price: parseInt(document.getElementById('prod-price').value),
    stock: parseInt(document.getElementById('prod-stock').value),
    image: base64ImageString || "https://picsum.photos/200" 
  };

  products.push(newProduct);
  localStorage.setItem('products', JSON.stringify(products));
  alert('Thêm sản phẩm thành công!');
  window.location.href = 'admin-products.html';
});