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
  let currentBlogId = null;

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
      case 'newest': return copy.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'most-viewed': return copy.sort((a, b) => b.views - a.views);
      case 'most-liked': return copy.sort((a, b) => b.likes - a.likes);
      default: return copy;
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
    html += `</div></div></div>`;
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
          showToast('Đã lưu bài viết', 'success', '📌');
        } else {
          delete saved[id];
          showToast('Đã bỏ lưu', 'info', '📌');
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
  const DEFAULT_AVATAR = '../assets/avatar-non.jpg';

  // ---- Cấu trúc dữ liệu comment với replies ----
  // Mỗi comment có thể có mảng replies
  function buildCommentTree(comments) {
    const map = {};
    const roots = [];
    comments.forEach(c => {
      map[c.id] = { ...c, replies: [] };
    });
    comments.forEach(c => {
      if (c.parentId) {
        if (map[c.parentId]) {
          map[c.parentId].replies.push(map[c.id]);
        } else {
          // Nếu parent không tồn tại, coi như root
          roots.push(map[c.id]);
        }
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  }

  function renderCommentItems(comments) {
    const commentList = document.getElementById('commentList');
    if (comments.length === 0) {
      commentList.innerHTML = '<p class="no-comments" style="text-align:center;color:#916f6a;padding:20px;">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
      return;
    }

    // Sắp xếp comments theo thời gian (mới nhất lên đầu? tùy bạn, tôi để cũ nhất lên đầu)
    const sorted = [...comments].sort((a, b) => new Date(a.time) - new Date(b.time));
    const tree = buildCommentTree(sorted);

    let html = '';
    tree.forEach(comment => {
      html += renderCommentItem(comment, 0);
    });
    commentList.innerHTML = html;

    // Gắn sự kiện cho các nút "Trả lời" và các nút gửi reply
    attachReplyEvents();
  }

  function renderCommentItem(comment, depth) {
    const avatarSrc = comment.avatar || DEFAULT_AVATAR;
    const indent = depth * 20;
    const isReply = depth > 0;
    const replyClass = isReply ? 'comment-reply' : '';

    let html = `
      <div class="blog-detail-comments__item ${replyClass}" style="margin-left:${indent}px;" data-comment-id="${comment.id}">
        <div class="comment-main">
          <div class="blog-detail-comments__avatar">
            <img src="${avatarSrc}" alt="${comment.author}" />
          </div>
          <div style="flex:1;">
            <div class="blog-detail-comments__header">
              <span class="blog-detail-comments__username">${comment.author}</span>
              <span class="blog-detail-comments__time">${comment.time}</span>
              ${isReply ? '<span style="font-size:12px;color:#916f6a;">→ Trả lời</span>' : ''}
            </div>
            <p class="blog-detail-comments__text">${comment.content}</p>
            <button class="blog-detail-comments__reply">Trả lời</button>
          </div>
        </div>
        <!-- Reply box sẽ được chèn vào đây -->
        <div class="reply-box" id="replyBox-${comment.id}">
          <textarea placeholder="Viết phản hồi..." rows="2"></textarea>
          <div class="reply-actions">
            <button class="btn-reply-cancel">Hủy</button>
            <button class="btn-reply-submit">Gửi</button>
          </div>
        </div>
        <!-- Replies của comment này -->
        <div class="comment-replies">
          ${comment.replies.map(reply => renderCommentItem(reply, depth + 1)).join('')}
        </div>
      </div>
    `;
    return html;
  }

  function attachReplyEvents() {
    // Các nút "Trả lời"
    document.querySelectorAll('.blog-detail-comments__reply').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const item = this.closest('.blog-detail-comments__item');
        if (!item) return;
        const commentId = item.dataset.commentId;
        const replyBox = document.getElementById(`replyBox-${commentId}`);
        if (!replyBox) return;

        // Toggle hiển thị reply box
        const isActive = replyBox.classList.contains('active');
        // Đóng tất cả reply box khác
        document.querySelectorAll('.reply-box.active').forEach(box => {
          if (box !== replyBox) box.classList.remove('active');
        });
        if (isActive) {
          replyBox.classList.remove('active');
        } else {
          replyBox.classList.add('active');
          const textarea = replyBox.querySelector('textarea');
          textarea.focus();
          // Thêm @username vào textarea
          const username = item.querySelector('.blog-detail-comments__username')?.innerText || '';
          textarea.value = `@${username} `;
        }
      });
    });

    // Nút "Hủy" trong reply box
    document.querySelectorAll('.btn-reply-cancel').forEach(btn => {
      btn.addEventListener('click', function() {
        const replyBox = this.closest('.reply-box');
        if (replyBox) replyBox.classList.remove('active');
      });
    });

    // Nút "Gửi" trong reply box
    document.querySelectorAll('.btn-reply-submit').forEach(btn => {
      btn.addEventListener('click', function() {
        const replyBox = this.closest('.reply-box');
        if (!replyBox) return;
        const textarea = replyBox.querySelector('textarea');
        const content = textarea.value.trim();
        if (!content) {
          showToast('Vui lòng nhập nội dung phản hồi.', 'error', '❌');
          return;
        }
        // Lấy commentId từ id của replyBox
        const idMatch = replyBox.id.match(/replyBox-(\d+)/);
        if (!idMatch) return;
        const parentId = parseInt(idMatch[1]);

        // Tạo comment con
        const newReply = {
          id: Date.now(),
          blogId: currentBlogId,
          parentId: parentId,
          author: 'Bạn',
          avatar: '../assets/avatar_user.jpeg', // ĐÃ SỬA
          content: content,
          time: 'Vừa xong'
        };

        // Lưu vào localStorage
        let savedComments = JSON.parse(localStorage.getItem('tempComments') || '[]');
        savedComments.push(newReply);
        localStorage.setItem('tempComments', JSON.stringify(savedComments));

        showToast('Phản hồi đã được gửi!', 'success', '💬');
        replyBox.classList.remove('active');
        textarea.value = '';

        // Render lại comments (có thể cải thiện bằng cách thêm trực tiếp)
        renderAllComments();
      });
    });
  }

  // Hàm lấy comments từ cả JSON và localStorage
  function getCommentsForBlog(blogId) {
    let comments = allComments.filter(c => c.blogId === blogId);
    // Lấy comments từ localStorage
    const tempComments = JSON.parse(localStorage.getItem('tempComments') || '[]');
    const blogComments = tempComments.filter(c => c.blogId === blogId);
    // Merge: ưu tiên tempComments (có thể ghi đè)
    const merged = [...comments, ...blogComments];
    // Loại bỏ trùng lặp theo id
    const seen = new Set();
    return merged.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }

  function renderAllComments() {
    const comments = getCommentsForBlog(currentBlogId);
    const commentCount = document.getElementById('commentCount');
    commentCount.innerText = comments.length;

    // Sắp xếp mới nhất lên đầu (hoặc cũ nhất tùy bạn)
    const sorted = [...comments].sort((a, b) => new Date(a.time) - new Date(b.time));
    const tree = buildCommentTree(sorted);

    // Giới hạn hiển thị 5 comment gốc (không tính replies)
    const rootComments = tree;
    const limitedRoots = rootComments.slice(0, commentLimit);

    const commentList = document.getElementById('commentList');
    const loadMoreBtn = document.querySelector('.blog-detail-comments__loadmore-btn');

    if (rootComments.length === 0) {
      commentList.innerHTML = '<p class="no-comments" style="text-align:center;color:#916f6a;padding:20px;">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    let html = '';
    limitedRoots.forEach(comment => {
      html += renderCommentItem(comment, 0);
    });
    commentList.innerHTML = html;

    // Xử lý nút "Xem thêm"
    if (rootComments.length > commentLimit) {
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'inline-block';
        const remaining = rootComments.length - commentLimit;
        loadMoreBtn.textContent = `Xem thêm ${remaining} bình luận`;
        // Gán lại sự kiện để load tất cả
        const newLoadMore = loadMoreBtn.cloneNode(true);
        loadMoreBtn.parentNode.replaceChild(newLoadMore, loadMoreBtn);
        newLoadMore.addEventListener('click', function() {
          // Hiển thị tất cả
          let allHtml = '';
          rootComments.forEach(comment => {
            allHtml += renderCommentItem(comment, 0);
          });
          commentList.innerHTML = allHtml;
          this.style.display = 'none';
          // Gắn lại sự kiện reply sau khi render
          attachReplyEvents();
        });
      }
    } else {
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }

    // Gắn sự kiện reply cho các comment vừa render
    attachReplyEvents();
  }

  function renderComments(blogId) {
    currentBlogId = blogId;
    renderAllComments();
  }

    // ===== XỬ LÝ SUBMIT COMMENT CHÍNH =====
  function handleMainCommentSubmit() {
    const submitBtn = document.getElementById('submitComment');
    const commentInput = document.getElementById('commentInput');
    if (!submitBtn || !commentInput) return;

    submitBtn.addEventListener('click', function() {
      const text = commentInput.value.trim();
      if (!text) {
        showToast('Vui lòng nhập nội dung bình luận.', 'error', '❌');
        return;
      }
      const newComment = {
        id: Date.now(),
        blogId: currentBlogId,
        parentId: null,
        author: 'Bạn',
        avatar: '../assets/avatar_user.jpeg',
        content: text,
        time: 'Vừa xong'
      };
      let savedComments = JSON.parse(localStorage.getItem('tempComments') || '[]');
      savedComments.push(newComment);
      localStorage.setItem('tempComments', JSON.stringify(savedComments));
      showToast('Bình luận đã được gửi!', 'success', '💬');
      commentInput.value = '';
      renderAllComments();
    });

    // Cho phép Enter (không cần Ctrl) để gửi, nhưng chỉ khi textarea không rỗng
    commentInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Ngăn xuống dòng
        const text = this.value.trim();
        if (text) {
          submitBtn.click();
        }
      }
    });
  }

  // ============================================================
  // ===== RENDER BLOG DETAIL =====
  // ============================================================
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
    currentBlogId = blog.id;

    // Banner
    const banner = document.getElementById('blogBanner');
    if (blog.image) banner.style.backgroundImage = `url('${blog.image}')`;
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
    handleMainCommentSubmit();

    document.title = `${blog.title} - Urii Perler Beads`;

    // ========== THÊM LIKE & BOOKMARK ==========
    // Cập nhật số like từ dữ liệu blog
    const likeCountSpan = document.getElementById('likeCount');
    if (likeCountSpan) {
      likeCountSpan.textContent = blog.likes || 0;
    }

    // Lấy trạng thái từ localStorage
    const likesStorage = JSON.parse(localStorage.getItem('blogLikes') || '{}');
    const bookmarksStorage = JSON.parse(localStorage.getItem('bookmarks') || '{}');

    const likeBtn = document.getElementById('likeBtn');
    const bookmarkBtn = document.getElementById('bookmarkBtn');

    // Like
    if (likeBtn) {
      const isLiked = likesStorage[blog.id] || false;
      if (isLiked) {
        likeBtn.classList.add('liked');
        likeBtn.querySelector('i').classList.remove('bi-heart');
        likeBtn.querySelector('i').classList.add('bi-heart-fill');
      } else {
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('i').classList.remove('bi-heart-fill');
        likeBtn.querySelector('i').classList.add('bi-heart');
      }

      likeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const isLikedNow = this.classList.contains('liked');
        const blogId = blog.id;
        let likes = JSON.parse(localStorage.getItem('blogLikes') || '{}');
        if (isLikedNow) {
          // Bỏ like
          delete likes[blogId];
          this.classList.remove('liked');
          this.querySelector('i').classList.remove('bi-heart-fill');
          this.querySelector('i').classList.add('bi-heart');
          // Giảm số like trong blog (chỉ hiển thị, không lưu vào JSON)
          let currentLike = parseInt(likeCountSpan.textContent);
          if (currentLike > 0) likeCountSpan.textContent = currentLike - 1;
          showToast('Đã bỏ thích', 'info', '💔');
        } else {
          // Like
          likes[blogId] = true;
          this.classList.add('liked');
          this.querySelector('i').classList.remove('bi-heart');
          this.querySelector('i').classList.add('bi-heart-fill');
          let currentLike = parseInt(likeCountSpan.textContent);
          likeCountSpan.textContent = currentLike + 1;
          showToast('Đã thích bài viết', 'success', '❤️');
        }
        localStorage.setItem('blogLikes', JSON.stringify(likes));
      });
    }

    // Bookmark
    if (bookmarkBtn) {
      const isBookmarked = bookmarksStorage[blog.id] || false;
      if (isBookmarked) {
        bookmarkBtn.classList.add('bookmarked');
        bookmarkBtn.querySelector('i').classList.remove('bi-bookmark');
        bookmarkBtn.querySelector('i').classList.add('bi-bookmark-fill');
        bookmarkBtn.querySelector('span').textContent = 'Đã lưu';
      } else {
        bookmarkBtn.classList.remove('bookmarked');
        bookmarkBtn.querySelector('i').classList.remove('bi-bookmark-fill');
        bookmarkBtn.querySelector('i').classList.add('bi-bookmark');
        bookmarkBtn.querySelector('span').textContent = 'Lưu';
      }

      bookmarkBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const isBookmarkedNow = this.classList.contains('bookmarked');
        const blogId = blog.id;
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
        if (isBookmarkedNow) {
          delete bookmarks[blogId];
          this.classList.remove('bookmarked');
          this.querySelector('i').classList.remove('bi-bookmark-fill');
          this.querySelector('i').classList.add('bi-bookmark');
          this.querySelector('span').textContent = 'Lưu';
          showToast('Đã bỏ lưu', 'info', '📌');
        } else {
          bookmarks[blogId] = true;
          this.classList.add('bookmarked');
          this.querySelector('i').classList.remove('bi-bookmark');
          this.querySelector('i').classList.add('bi-bookmark-fill');
          this.querySelector('span').textContent = 'Đã lưu';
          showToast('Đã lưu bài viết', 'success', '📌');
        }
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      });
    }
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