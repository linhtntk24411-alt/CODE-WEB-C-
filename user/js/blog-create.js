(function() {
  'use strict';

  // ===== DOM refs =====
  const titleInput = document.getElementById('postTitle');
  const categorySelect = document.getElementById('postCategory');
  const editorContent = document.getElementById('editorContent');
  const wordCount = document.getElementById('wordCount');
  const autoSave = document.getElementById('autoSave');
  const publishBtn = document.getElementById('publishBtn');
  const draftBtn = document.getElementById('saveDraftBtn');
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  const uploadArea = document.getElementById('uploadArea');
  const seoToggle = document.getElementById('seoToggle');
  const seoPanel = document.getElementById('seoPanel');
  const seoTitle = document.getElementById('seoTitle');
  const seoDesc = document.getElementById('seoDesc');
  const postTags = document.getElementById('postTags');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  let autoSaveTimer = null;
  let imageFiles = [];

  // ===== TOAST =====
  function showToast(message, type = 'success', icon = '✅') {
    const oldContainer = document.querySelector('.toast-container');
    if (oldContainer) oldContainer.remove();

    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast--fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ===== CUSTOM PROMPT =====
  function showPrompt(title, placeholder, defaultValue = '') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;
        z-index:9999; backdrop-filter:blur(4px);
      `;
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { overlay.remove(); resolve(null); }
      });

      const modal = document.createElement('div');
      modal.style.cssText = `
        background:#fff; padding:32px 24px 24px; border-radius:12px; max-width:480px; width:90%;
        box-shadow:0 20px 60px rgba(0,0,0,0.2); font-family:'Segoe UI', sans-serif;
        animation:fadeIn 0.2s ease;
      `;
      modal.innerHTML = `
        <h3 style="font-family:'Segoe UI',sans-serif; font-size:20px; font-weight:600; margin-bottom:12px; color:#1b1c1c;">${title}</h3>
        <input type="text" id="customPromptInput" value="${defaultValue}" placeholder="${placeholder}" style="
          width:100%; padding:12px 16px; border:1px solid #e5bdb7; border-radius:8px;
          font-size:16px; font-family:'Segoe UI',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s;
          margin-bottom:16px; box-sizing:border-box;
        " />
        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button id="customPromptCancel" style="
            padding:8px 24px; border:1px solid #e5bdb7; border-radius:8px; background:transparent;
            font-family:'Segoe UI',sans-serif; font-weight:600; font-size:14px; cursor:pointer; color:#5c403b;
          ">Hủy</button>
          <button id="customPromptConfirm" style="
            padding:8px 24px; border:none; border-radius:8px; background:#840001; color:#fff;
            font-family:'Segoe UI',sans-serif; font-weight:600; font-size:14px; cursor:pointer;
            box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);
          ">OK</button>
        </div>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const input = modal.querySelector('#customPromptInput');
      input.focus(); input.select();
      const confirmBtn = modal.querySelector('#customPromptConfirm');
      const cancelBtn = modal.querySelector('#customPromptCancel');
      const close = (result) => { overlay.remove(); resolve(result); };
      confirmBtn.addEventListener('click', () => close(input.value.trim() || null));
      cancelBtn.addEventListener('click', () => close(null));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') close(input.value.trim() || null);
        if (e.key === 'Escape') close(null);
      });
      const style = document.createElement('style');
      style.textContent = `@keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`;
      document.head.appendChild(style);
    });
  }

  // ===== RICH TEXT EDITOR =====
  document.querySelectorAll('.editor-toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const command = this.dataset.command;
      const value = this.dataset.value || null;

      if (command === 'createLink') {
        const url = await showPrompt('Chèn liên kết', 'Nhập URL (ví dụ: https://...)');
        if (url) document.execCommand('createLink', false, url);
        updateToolbarState(); updateWordCount(); autoSaveDraft();
        return;
      }
      if (command === 'insertImage') {
        const url = await showPrompt('Chèn ảnh từ URL', 'Nhập đường dẫn ảnh (https://...)');
        if (url) {
          const img = `<img src="${url}" alt="Hình ảnh" />`;
          document.execCommand('insertHTML', false, img);
        }
        updateToolbarState(); updateWordCount(); autoSaveDraft();
        return;
      }
      if (command === 'fullscreen') { toggleFullscreen(); return; }
      if (command === 'formatBlock') {
        document.execCommand(command, false, value);
      } else {
        document.execCommand(command, false, value);
      }
      updateToolbarState(); updateWordCount(); autoSaveDraft();
    });
  });

  function updateToolbarState() {
    ['bold', 'italic', 'underline'].forEach(cmd => {
      const btn = document.querySelector(`[data-command="${cmd}"]`);
      if (btn) {
        document.queryCommandState(cmd) ? btn.classList.add('active') : btn.classList.remove('active');
      }
    });
  }

  function updateWordCount() {
    const text = editorContent.innerText || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    wordCount.textContent = `Từ ngữ: ${words.length}`;
  }

  function autoSaveDraft() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveToLocalStorage('draft');
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
      autoSave.textContent = `Đã lưu tự động lúc ${timeStr}`;
    }, 1000);
  }

  // ===== XỬ LÝ ẢNH UPLOAD (hiển thị dưới hộp upload, không bị chồng) =====
  imageUpload.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
        const reader = new FileReader();
        reader.onload = function(ev) {
          const previewItem = document.createElement('div');
          previewItem.className = 'preview-item';
          previewItem.innerHTML = `
            <img src="${ev.target.result}" alt="${file.name}" />
            <span class="remove-image" data-filename="${file.name}">×</span>
          `;
          imagePreview.appendChild(previewItem);
          // Xóa ảnh (sự kiện riêng, không ảnh hưởng đến upload)
          previewItem.querySelector('.remove-image').addEventListener('click', function(e) {
            e.stopPropagation(); // Ngăn sự kiện lan ra ngoài
            const name = this.dataset.filename;
            imageFiles = imageFiles.filter(f => f.name !== name);
            this.closest('.preview-item').remove();
            if (imageFiles.length === 0) imagePreview.innerHTML = '';
          });
        };
        reader.readAsDataURL(file);
      }
    });
    imageUpload.value = '';
  });

  // Kéo thả (không can thiệp vào preview)
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = '#840001';
    this.style.backgroundColor = 'rgba(132,0,1,0.02)';
  });
  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.style.borderColor = '';
    this.style.backgroundColor = '';
  });
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = '';
    this.style.backgroundColor = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      imageUpload.files = files;
      imageUpload.dispatchEvent(new Event('change'));
    }
  });

  // ===== LƯU / XUẤT BẢN =====
  function getPostData(status) {
    const content = editorContent.innerHTML;
    const plainText = editorContent.innerText || '';
    const excerpt = plainText.split(' ').slice(0, 30).join(' ') + '...';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const images = tempDiv.querySelectorAll('img');
    const imageUrls = Array.from(images).map(img => img.src);
    return {
      id: Date.now(),
      title: titleInput.value.trim() || 'Bài viết không tiêu đề',
      slug: titleInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bai-viet-' + Date.now(),
      excerpt: excerpt,
      content: content,
      image: imageUrls.length > 0 ? imageUrls[0] : '../assets/default-banner.jpg',
      author: 'Người dùng Urii',
      avatar: '../assets/avatar-non.jpg',
      date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      category: categorySelect.options[categorySelect.selectedIndex]?.text || 'Chung',
      categorySlug: categorySelect.value || 'chung',
      isFeatured: false,
      likes: 0, comments: 0, views: 0,
      tags: postTags.value.split(',').map(t => t.trim()).filter(Boolean),
      status: status,
      createdAt: new Date().toISOString(),
      seoTitle: seoTitle.value || '',
      seoDesc: seoDesc.value || '',
      images: imageUrls,
    };
  }

  function saveToLocalStorage(status) {
    const data = getPostData(status);
    let posts = JSON.parse(localStorage.getItem('userBlogs') || '[]');
    const existingIndex = posts.findIndex(p => p.id === data.id);
    if (existingIndex >= 0) posts[existingIndex] = data;
    else posts.push(data);
    localStorage.setItem('userBlogs', JSON.stringify(posts));
    return data;
  }

  draftBtn.addEventListener('click', function() {
    saveToLocalStorage('draft');
    showToast('Đã lưu bản nháp thành công!', 'success', '✅');
  });

  publishBtn.addEventListener('click', function() {
    if (!titleInput.value.trim()) {
      showToast('Vui lòng nhập tiêu đề bài viết.', 'error', '❌');
      titleInput.focus();
      return;
    }
    if (editorContent.innerText.trim().length < 20) {
      showToast('Nội dung quá ngắn. Hãy viết ít nhất 20 ký tự.', 'error', '❌');
      editorContent.focus();
      return;
    }
    const data = saveToLocalStorage('published');
    showToast('Bài viết đã được xuất bản thành công!', 'success', '🎉');
    setTimeout(() => {
      window.location.href = `blog-detail.html?slug=${data.slug}`;
    }, 1500);
  });

  // ===== SEO TOGGLE =====
  seoToggle.addEventListener('click', function() {
    const isOpen = seoPanel.style.display !== 'none';
    seoPanel.style.display = isOpen ? 'none' : 'flex';
    this.classList.toggle('open');
  });

  // ===== FULLSCREEN =====
  function toggleFullscreen() {
    const editor = document.querySelector('.blog-create-editor');
    if (!document.fullscreenElement) {
      if (editor.requestFullscreen) editor.requestFullscreen();
      else if (editor.webkitRequestFullscreen) editor.webkitRequestFullscreen();
      fullscreenBtn.classList.add('active');
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      fullscreenBtn.classList.remove('active');
    }
  }

  // ===== TỰ ĐỘNG LƯU KHI GÕ =====
  editorContent.addEventListener('input', function() { updateWordCount(); autoSaveDraft(); updateToolbarState(); });
  titleInput.addEventListener('input', autoSaveDraft);
  categorySelect.addEventListener('change', autoSaveDraft);

  // ===== KHÔI PHỤC BẢN NHÁP =====
  function loadLastDraft() {
    const posts = JSON.parse(localStorage.getItem('userBlogs') || '[]');
    const draft = posts.filter(p => p.status === 'draft').pop();
    if (draft) {
      if (confirm('Bạn có bản nháp chưa lưu từ lần trước. Khôi phục?')) {
        titleInput.value = draft.title || '';
        categorySelect.value = draft.categorySlug || 'huong-dan-diy';
        editorContent.innerHTML = draft.content || '';
        if (draft.tags && draft.tags.length) postTags.value = draft.tags.join(', ');
        if (draft.seoTitle) seoTitle.value = draft.seoTitle;
        if (draft.seoDesc) seoDesc.value = draft.seoDesc;
        updateWordCount();
        autoSave.textContent = 'Đã khôi phục bản nháp';
        showToast('Đã khôi phục bản nháp', 'info', '📝');
      }
    }
  }

  // ===== KHỞI TẠO =====
  document.addEventListener('DOMContentLoaded', function() {
    updateWordCount();
    if (!editorContent.innerText.trim()) editorContent.innerHTML = '';
    loadLastDraft();
  });

})();