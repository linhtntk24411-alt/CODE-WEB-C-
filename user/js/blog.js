(function() {
  'use strict';

  // ===== PHÁT HIỆN TRANG =====
  const path = window.location.pathname;
  const isListPage = path.includes('blog-list.html') || (!path.includes('blog-detail.html') && path.endsWith('.html'));
  const isDetailPage = path.includes('blog-detail.html');

  // ===== DOM refs cho list =====
  const featuredContainer = document.getElementById('featuredContainer');
  const blogGrid = document.getElementById('blogGrid');
  const paginationContainer = document.getElementById('paginationContainer');
  const categoryTabs = document.querySelectorAll('.blog-filter__tab');
  const sortSelect = document.getElementById('sortSelect');
  const scrollBtn = document.getElementById('scrollToTop');

  // ===== Biến chung =====
  let allBlogs = [];
  let allComments = [];
  let currentCategory = 'all';
  let currentSort = 'newest';
  let currentPage = 1;
  const perPage = 6;
  let commentLimit = 5;
  let currentBlogComments = [];

  // ===== HÀM TẢI DỮ LIỆU =====
  async function loadBlogs() {
    try {
      const [blogsRes, commentsRes] = await Promise.all([
        fetch('../data/blogs.json'),
        fetch('../data/comments.json')
      ]);
      if (!blogsRes.ok) throw new Error('Không thể tải dữ liệu blog');
      if (!commentsRes.ok) throw new Error('Không thể tải dữ liệu comment');
      
      const blogsData = await blogsRes.json();
      const commentsData = await commentsRes.json();
      
      allBlogs = blogsData.blogs;
      allComments = commentsData.comments;

      if (isListPage) {
        renderBlogs();
      } else if (isDetailPage) {
        renderBlogDetail();
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      if (isListPage && blogGrid) {
        blogGrid.innerHTML = '<p style="text-align:center;padding:40px;grid-column:1/-1;color:var(--blog-on-surface-variant);">Không thể tải bài viết. Vui lòng thử lại sau.</p>';
      } else if (isDetailPage) {
        document.getElementById('detailTitle').innerText = 'Không tìm thấy bài viết';
      }
    }
  }

  // ============================================================
  // ===== LOGIC TRANG DANH SÁCH (blog-list.html) =====
  // ============================================================
  function filterBlogs(blogs, category) {
    if (category === 'all') return blogs;
    return blogs.filter(b => b.categorySlug === category);
  }

  function sortBlogs(blogs, sort) {
    const copy = [...blogs];
    switch (sort) {
      case 'newest':
        return copy.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'most-viewed':
        return copy.sort((a, b) => b.views - a.views);
      case 'most-liked':
        return copy.sort((a, b) => b.likes - a.likes);
      default:
        return copy;
    }
  }

  function paginate(blogs, page, size) {
    const start = (page - 1) * size;
    return blogs.slice(start, start + size);
  }

  function getCategoryColor(slug) {
    const colors = {
      'huong-dan-diy': '#6C5B7B',
      'meo-vat': '#F08A5D',
      'y-tuong-thiet-ke': '#B83B5E',
      'goc-nghe-thuat': '#6A9C89'
    };
    return colors[slug] || '#840001';
  }

  function renderFeatured(blogs) {
    if (!featuredContainer) return;
    if (currentCategory !== 'all') {
      featuredContainer.style.display = 'none';
      return;
    }
    featuredContainer.style.display = 'grid';
    const featured = blogs.find(b => b.isFeatured === true) || blogs[0];
    if (!featured) {
      featuredContainer.innerHTML = '';
      return;
    }
    const sidebarBlogs = blogs.filter(b => b.id !== featured.id).slice(0, 3);
    let html = `
      <div class="blog-featured__main" onclick="window.location.href='blog-detail.html?slug=${featured.slug}'">
        <div class="blog-featured__image">
          <img src="${featured.image}" alt="${featured.title}" loading="lazy">
          <span class="blog-featured__badge">Nổi bật</span>
        </div>
        <div class="blog-featured__body">
          <div class="blog-featured__meta">
            <img src="${featured.avatar}" alt="${featured.author}">
            <div>
              <div class="name">${featured.author}</div>
              <div class="date">${featured.date}</div>
            </div>
          </div>
          <h2 class="blog-featured__title">${featured.title}</h2>
          <p class="blog-featured__excerpt">${featured.excerpt}</p>
          <div class="blog-featured__stats">
            <span><i class="bi bi-heart-fill" style="color:#840001;"></i> ${featured.likes}</span>
            <span><i class="bi bi-chat"></i> ${featured.comments}</span>
          </div>
        </div>
      </div>
    `;
    html += `
      <div class="blog-featured__sidebar">
        <div class="blog-sidebar__card">
          <h3>Bài viết mới nhất</h3>
          <div class="blog-sidebar__list">
    `;
    sidebarBlogs.forEach(blog => {
      html += `
        <div class="blog-sidebar__item" onclick="window.location.href='blog-detail.html?slug=${blog.slug}'">
          <img src="${blog.image}" alt="${blog.title}" loading="lazy">
          <div class="blog-sidebar__item-content">
            <div class="blog-sidebar__item-title">${blog.title}</div>
            <div class="blog-sidebar__item-date">${blog.date}</div>
          </div>
        </div>
      `;
    });
    html += `
          </div>
        </div>
      </div>
    `;
    featuredContainer.innerHTML = html;
  }

  function renderGrid(blogs) {
    if (!blogGrid) return;
    if (blogs.length === 0) {
      blogGrid.innerHTML = '<p style="text-align:center;padding:40px;grid-column:1/-1;color:var(--blog-on-surface-variant);">Không có bài viết nào trong danh mục này.</p>';
      return;
    }
    let html = '';
    blogs.forEach(blog => {
      html += `
        <article class="blog-card" onclick="window.location.href='blog-detail.html?slug=${blog.slug}'">
          <div class="blog-card__image">
            <img src="${blog.image}" alt="${blog.title}" loading="lazy">
            <span class="blog-card__category" style="background:${getCategoryColor(blog.categorySlug)};color:#fff;">${blog.category}</span>
          </div>
          <div class="blog-card__body">
            <div class="blog-card__meta">
              <img src="${blog.avatar}" alt="${blog.author}">
              <div>
                <div class="name">${blog.author}</div>
                <div class="date">${blog.date}</div>
              </div>
            </div>
            <h3 class="blog-card__title">${blog.title}</h3>
            <p class="blog-card__excerpt">${blog.excerpt}</p>
            <div class="blog-card__footer">
              <div class="blog-card__stats">
                <span><i class="bi bi-heart-fill" style="color:#840001;"></i> ${blog.likes}</span>
                <span><i class="bi bi-chat"></i> ${blog.comments}</span>
              </div>
              <div class="blog-card__bookmark" data-id="${blog.id}">
                <i class="bi bi-bookmark"></i>
              </div>
            </div>
          </div>
        </article>
      `;
    });
    blogGrid.innerHTML = html;

    // Bookmark toggle
    document.querySelectorAll('#blogGrid .blog-card__bookmark').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const icon = this.querySelector('i');
        icon.classList.toggle('bi-bookmark');
        icon.classList.toggle('bi-bookmark-fill');
        const id = this.dataset.id;
        const saved = JSON.parse(localStorage.getItem('bookmarks') || '{}');
        if (icon.classList.contains('bi-bookmark-fill')) {
          saved[id] = true;
        } else {
          delete saved[id];
        }
        localStorage.setItem('bookmarks', JSON.stringify(saved));
      });
    });
    const saved = JSON.parse(localStorage.getItem('bookmarks') || '{}');
    document.querySelectorAll('#blogGrid .blog-card__bookmark').forEach(btn => {
      const id = btn.dataset.id;
      if (saved[id]) {
        const icon = btn.querySelector('i');
        icon.classList.remove('bi-bookmark');
        icon.classList.add('bi-bookmark-fill');
      }
    });
  }

  function renderPagination(totalPages) {
    if (!paginationContainer) return;
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    let html = '';
    const prevDisabled = currentPage === 1;
    const nextDisabled = currentPage === totalPages;
    html += `<button onclick="goToPage(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<button class="active" onclick="goToPage(${i})">${i}</button>`;
      } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        html += `<button onclick="goToPage(${i})">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span class="dots">...</span>`;
      }
    }
    html += `<button onclick="goToPage(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>`;
    paginationContainer.innerHTML = html;
  }

  function renderBlogs() {
    const filtered = filterBlogs(allBlogs, currentCategory);
    const sorted = sortBlogs(filtered, currentSort);
    const totalPages = Math.ceil(sorted.length / perPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    const paginated = paginate(sorted, currentPage, perPage);

    renderFeatured(allBlogs);
    // Thêm/xóa tiêu đề "Bài viết"
    let gridHeader = document.querySelector('.blog-grid-header');
    if (currentCategory === 'all') {
      if (!gridHeader) {
        gridHeader = document.createElement('div');
        gridHeader.className = 'blog-grid-header';
        gridHeader.innerHTML = '<h2>Bài viết</h2>';
        blogGrid.parentNode.insertBefore(gridHeader, blogGrid);
      }
    } else {
      if (gridHeader) gridHeader.remove();
    }
    renderGrid(paginated);
    renderPagination(totalPages);
  }

  window.goToPage = function(page) {
    const filtered = filterBlogs(allBlogs, currentCategory);
    const totalPages = Math.ceil(filtered.length / perPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderBlogs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================
  // ===== LOGIC TRANG CHI TIẾT (blog-detail.html) =====
  // ============================================================
  // ĐƯỜNG DẪN ẢNH MẶC ĐỊNH CHO COMMENT
  const DEFAULT_AVATAR = '../assets/avatar-non.jpg';

  function renderComments(blogId) {
    const commentList = document.getElementById('commentList');
    const commentCount = document.getElementById('commentCount');
    const loadMoreBtn = document.querySelector('.blog-detail-comments__loadmore-btn');
    
    currentBlogComments = allComments.filter(c => c.blogId === blogId);
    commentCount.innerText = currentBlogComments.length;
    
    if (currentBlogComments.length <= commentLimit) {
      renderCommentItems(currentBlogComments);
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
      renderCommentItems(currentBlogComments.slice(0, commentLimit));
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'inline-block';
        loadMoreBtn.textContent = `Xem thêm ${currentBlogComments.length - commentLimit} bình luận`;
        loadMoreBtn.onclick = function() {
          renderCommentItems(currentBlogComments);
          this.style.display = 'none';
        };
      }
    }
  }

  function renderCommentItems(comments) {
    const commentList = document.getElementById('commentList');
    if (comments.length === 0) {
      commentList.innerHTML = '<p class="no-comments" style="text-align:center;color:#916f6a;padding:20px;">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
      return;
    }
    let html = '';
    comments.forEach(comment => {
      // Sử dụng ảnh mặc định cho tất cả comment
      const avatarSrc = DEFAULT_AVATAR;
      html += `
        <div class="blog-detail-comments__item">
          <div class="blog-detail-comments__avatar" style="background: #f0f0f0; overflow:hidden;">
            <img src="${avatarSrc}" alt="${comment.author}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div>
            <div class="blog-detail-comments__header">
              <span class="blog-detail-comments__username">${comment.author}</span>
              <span class="blog-detail-comments__time">${comment.time}</span>
            </div>
            <p class="blog-detail-comments__text">${comment.content}</p>
            <button class="blog-detail-comments__reply">Trả lời</button>
          </div>
        </div>
      `;
    });
    commentList.innerHTML = html;
  }

  function renderBlogDetail() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) {
      document.getElementById('detailTitle').innerText = 'Không tìm thấy bài viết';
      return;
    }
    const blog = allBlogs.find(b => b.slug === slug);
    if (!blog) {
      document.getElementById('detailTitle').innerText = 'Bài viết không tồn tại';
      return;
    }

    // Banner
    const banner = document.getElementById('blogBanner');
    if (blog.image) {
      banner.style.backgroundImage = `url('${blog.image}')`;
    }
    document.getElementById('detailCategory').innerText = blog.category || 'Chung';
    document.getElementById('detailTitle').innerText = blog.title;
    document.getElementById('detailAvatar').src = blog.avatar || '../assets/default-avatar.jpg';
    document.getElementById('detailAuthor').innerText = blog.author;
    document.getElementById('detailDate').innerText = blog.date;

    // Nội dung
    document.getElementById('detailContent').innerHTML = blog.content;

    // Tags
    const tagsContainer = document.getElementById('detailTags');
    tagsContainer.innerHTML = '<span class="blog-detail-tags__label">Tags:</span>';
    if (blog.tags && blog.tags.length) {
      blog.tags.forEach(tag => {
        const a = document.createElement('a');
        a.href = `blog-list.html?tag=${tag}`;
        a.innerText = `#${tag}`;
        tagsContainer.appendChild(a);
      });
    }

    // Author Bio
    document.getElementById('bioAvatar').src = blog.avatar || '../assets/default-avatar.jpg';
    document.getElementById('bioName').innerText = blog.author;
    document.getElementById('bioDesc').innerText = blog.bio || 'Thành viên yêu thích handmade và sáng tạo không ngừng.';

    // Render comments
    renderComments(blog.id);

    document.title = `${blog.title} - Urii Perler Beads`;
  }

  // ============================================================
  // ===== SỰ KIỆN CHO LIST =====
  // ============================================================
  if (isListPage) {
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        categoryTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentCategory = this.dataset.category;
        currentPage = 1;
        renderBlogs();
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', function() {
        currentSort = this.value;
        currentPage = 1;
        renderBlogs();
      });
    }

    if (scrollBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
          scrollBtn.classList.add('visible');
        } else {
          scrollBtn.classList.remove('visible');
        }
      });
      scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ============================================================
  // ===== KHỞI ĐỘNG =====
  // ============================================================
  loadBlogs();

})();