const firebaseConfig = {
    apiKey: "AIzaSyAKGtqzDgN8NLdto1MXO_LsUwTvgnQ-TmI",
    authDomain: "web-blog-b54dc.firebaseapp.com",
    projectId: "web-blog-b54dc",
    storageBucket: "web-blog-b54dc.appspot.com",
    messagingSenderId: "658376440725",
    appId: "1:658376440725:web:4d1dacbc13c4090cfcd49c",
    measurementId: "G-0QP00QDMBX"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // DOM elements
  const categoryList = document.getElementById('categoryList');
  const postList = document.getElementById('postList');
  const postDetailModal = document.getElementById('postDetailModal');
  const closeDetailModal = document.getElementById('closeDetailModal');
  const likeBtn = document.getElementById('likeBtn');
  const commentBtn = document.getElementById('commentBtn');
  const shareBtn = document.getElementById('shareBtn');
  const commentInput = document.getElementById('commentInput');
  const commentSubmit = document.getElementById('commentSubmit');
  const commentList = document.getElementById('commentList');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  // Current state
  let currentCategory = "all";
  let categories = [];
  let posts = [];
  let currentPost = null;
  let comments = [];
  
  // Load categories from Firestore
  async function loadCategories() {
    try {
      const snapshot = await db.collection("categories").where("type", "==", "baiviet").orderBy("name").get();
      
      // Clear existing categories
      categoryList.innerHTML = '';
      
      // Add "All" button
      const allButton = createCategoryButton("all", "Tất cả", true);
      categoryList.appendChild(allButton);
      
      // Process categories
      categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Display up to 4 categories in the main menu
      const maxVisible = 4;
      const visibleCategories = categories.slice(0, maxVisible);
      
      // Add visible categories to main menu
      visibleCategories.forEach(cat => {
        const button = createCategoryButton(cat.id, cat.name, false);
        categoryList.appendChild(button);
      });
      
      // Add "More" button if there are more categories
      if (categories.length > maxVisible) {
        const moreBtn = document.createElement("a");
        moreBtn.href = "#";
        moreBtn.className = "category-btn text-primary fw-bold";
        moreBtn.textContent = "Xem thêm";
        moreBtn.onclick = showMoreCategories;
        categoryList.appendChild(moreBtn);
      }
      
    } catch (err) {
      console.error("Lỗi khi tải danh mục:", err);
      categoryList.innerHTML = '<div class="text-danger">Lỗi tải danh mục</div>';
    }
  }
  
  // Create category button element
  function createCategoryButton(id, name, isActive) {
    const button = document.createElement('a');
    button.href = '#';
    button.className = `category-btn ${isActive ? 'active' : ''}`;
    button.textContent = name;
    button.dataset.id = id;
    return button;
  }
  
  // Show more categories in a modal
  function showMoreCategories() {
    // Create modal
    const modalHTML = `
      <div class="modal fade" id="categoriesModal" tabindex="-1" aria-labelledby="categoriesModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="categoriesModalLabel">Tất cả danh mục</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="d-flex flex-wrap" id="modalCategories">
                <!-- Categories will be added here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add categories to modal
    const modalCategories = document.getElementById('modalCategories');
    categories.forEach(cat => {
      const btn = createCategoryButton(cat.id, cat.name, false);
      btn.classList.add('m-2');
      modalCategories.appendChild(btn);
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('categoriesModal'));
    modal.show();
    
    // Clean up after modal is closed
    document.getElementById('categoriesModal').addEventListener('hidden.bs.modal', function() {
      this.remove();
    });
  }
  
  // Load posts from Firestore
  async function loadPosts(categoryId = "all") {
    postList.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
        <p class="mt-3">Đang tải bài viết...</p>
      </div>
    `;
    
    try {
      let query = db.collection("posts").where("status", "==", "published").orderBy("createdAt", "desc");
      
      if (categoryId !== "all") {
        query = query.where("categoryId", "==", categoryId);
      }
      
      const snapshot = await query.get();
      postList.innerHTML = "";
      
      if (snapshot.empty) {
        postList.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="fas fa-file-alt fa-3x mb-3 text-muted"></i>
            <h4 class="text-muted">Không có bài viết nào</h4>
            <p class="text-muted">Hãy quay lại sau nhé!</p>
          </div>
        `;
        return;
      }
      
      // Process posts
      posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Display posts
      posts.forEach((post, index) => {
        const image = Array.isArray(post.images) && post.images.length > 0 ? 
          post.images[0] : "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80";
        
        // Format date
        const date = post.createdAt ? post.createdAt.toDate() : new Date();
        const formattedDate = date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        // Create post card
        const carouselId = `postCarousel-${post.id}`;
let carouselImages = "";

if (Array.isArray(post.images) && post.images.length > 0) {
  post.images.forEach((img, i) => {
    const url = typeof img === 'string' ? img : img?.url || '';
    carouselImages += `
      <div class="carousel-item ${i === 0 ? 'active' : ''}">
        <img src="${url}" class="d-block w-100 post-img" style="height: 200px; object-fit: cover;" alt="${post.title}">
      </div>
    `;
  });
} else {
  carouselImages = `
    <div class="carousel-item active">
      <img src="https://via.placeholder.com/400x200?text=No+Image" class="d-block w-100 post-img" alt="No image">
    </div>
  `;
}

const html = `
  <div class="col-lg-4 col-md-6 fade-in delay-${index % 3}">
    <div class="post-card" data-id="${post.id}">
      <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">
          ${carouselImages}
        </div>
        ${post.images && post.images.length > 1 ? `
          <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
          </button>` : ''}
      </div>

      <div class="card-body">
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${post.summary || "Khám phá bài viết đầy đủ để biết thêm chi tiết..."}</p>
        <div class="post-meta">
          <div class="post-date">
            <i class="far fa-calendar-alt"></i> ${formattedDate}
          </div>
          <div class="reaction-icons">
            <button class="reaction-btn like-btn" data-id="${post.id}">
              <i class="far fa-heart"></i> <span>${post.likes || 0}</span>
            </button>
            <button class="reaction-btn">
              <i class="far fa-comment"></i> <span>${post.comments || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

        postList.insertAdjacentHTML('beforeend', html);
      });
      
      // Add event listeners to new buttons
      document.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', function(e) {
          // Prevent opening if clicking on reaction buttons
          if (e.target.closest('.reaction-icons')) {
            return;
          }
          const postId = this.dataset.id;
          showPostDetail(postId);
        });
      });
      
      // Add event listeners to like buttons
      document.querySelectorAll('.post-card .like-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
          e.stopPropagation(); // Prevent card click event
          const postId = this.dataset.id;
          const post = posts.find(p => p.id === postId);
          if (!post) return;
          
          // Toggle like state
          const isLiked = this.classList.contains('liked');
          const currentLikes = post.likes || 0;
          const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
          
          // Update UI
          this.classList.toggle('liked', !isLiked);
          const icon = this.querySelector('i');
          icon.className = isLiked ? 'far fa-heart' : 'fas fa-heart';
          this.querySelector('span').textContent = newLikes;
          
          try {
            // Update in Firestore
            await db.collection("posts").doc(postId).update({ likes: newLikes });
            // Update local state
            post.likes = newLikes;
          } catch (err) {
            console.error("Lỗi khi cập nhật lượt thích:", err);
            // Revert UI changes
            this.classList.toggle('liked', isLiked);
            icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
            this.querySelector('span').textContent = currentLikes;
            showToast("Có lỗi xảy ra, vui lòng thử lại", "error");
          }
          showNotification('Bài viết được thích', `Ai đó đã thích bài viết "${post.title}"`, 'fas fa-heart', 'success');
        });
      });
      
    } catch (err) {
      console.error("Lỗi khi tải bài viết:", err);
      postList.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
          <h4 class="text-danger">Không thể tải bài viết</h4>
          <p class="text-muted">Vui lòng thử lại sau hoặc kiểm tra kết nối mạng</p>
        </div>
      `;
    }
  }
  
  // Show post detail
  async function showPostDetail(postId) {
    try {
      // Show loading state
      document.getElementById('detailTitle').textContent = "Đang tải...";
      document.getElementById('detailContent').innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
      
      // Get post details
      const doc = await db.collection("posts").doc(postId).get();
      if (!doc.exists) {
        showToast("Bài viết không tồn tại", "error");
        return;
      }
      
      const post = doc.data();
      currentPost = { id: postId, ...post };
      
      // Format date
      const date = post.createdAt ? post.createdAt.toDate() : new Date();
      const formattedDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Update post detail view
      
      
      document.getElementById('detailTitle').textContent = post.title;
      document.getElementById('detailDate').textContent = formattedDate;
      document.getElementById('detailViews').textContent = post.views || 0;
      document.getElementById('likeCount').textContent = post.likes || 0;
      document.getElementById('commentCount').textContent = post.comments || 0;
      let htmlContent = post.content || `<p class="text-muted">Nội dung bài viết đang được cập nhật...</p>`;

if (post.video) {
  const videoId = extractYouTubeId(post.video);
  if (videoId) {
    htmlContent += `
      <div class="mt-4">
        <div class="ratio ratio-16x9">
          <iframe src="https://www.youtube.com/embed/${videoId}" 
                  frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
    `;
  }
}

// Render ảnh vào carousel
const carouselInner = document.getElementById('carouselImagesInner');
carouselInner.innerHTML = '';

if (Array.isArray(post.images) && post.images.length > 0) {
  post.images.forEach((img, index) => {
    const div = document.createElement('div');
    div.className = `carousel-item ${index === 0 ? 'active' : ''}`;
    div.innerHTML = `<img src="${img}" class="d-block w-100" style="max-height: 400px; object-fit: cover;">`;
    carouselInner.appendChild(div);
  });
  document.getElementById('imageCarouselWrapper').style.display = 'block';
} else {
  document.getElementById('imageCarouselWrapper').style.display = 'none';
}

// Gán nội dung chính vào detailContent (không chèn lại ảnh)
document.getElementById('detailContent').innerHTML = htmlContent;



//document.getElementById('detailContent').innerHTML = htmlContent;

      
      // Reset like button state
      likeBtn.classList.remove('liked');
      likeBtn.querySelector('i').className = 'far fa-heart';
      
      // Load comments
      loadComments(postId);
      
      // Show modal
      postDetailModal.classList.add('active');
      
      // Increment view count
      const views = (post.views || 0) + 1;
      await db.collection("posts").doc(postId).update({ views });
      
    } catch (err) {
      console.error("Lỗi khi tải chi tiết bài viết:", err);
      showToast("Không thể tải bài viết", "error");
    }
  }
  function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:embed\/|v\/|shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
  
  // Load comments for a post
  async function loadComments(postId) {
    try {
      commentList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';
      
      const snapshot = await db.collection("comments")
        .where("postId", "==", postId)
        .orderBy("createdAt", "desc")
        .get();
      
      comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Update comment count
      document.getElementById('commentCount').textContent = comments.length;
      
      // Render comments
      renderComments();
      
    } catch (err) {
      console.error("Lỗi khi tải bình luận:", err);
      commentList.innerHTML = '<p class="text-center text-muted">Không thể tải bình luận</p>';
    }
  }
  
  // Render comments
  function renderComments() {
    if (comments.length === 0) {
      commentList.innerHTML = '<p class="text-center text-muted">Chưa có bình luận nào</p>';
      return;
    }
    
    let html = '';
    comments.forEach(comment => {
      // Xử lý ngày tháng an toàn
      let date;
      if (comment.createdAt) {
        // Nếu là Timestamp Firebase
        if (typeof comment.createdAt.toDate === 'function') {
          date = comment.createdAt.toDate();
        } 
        // Nếu là chuỗi ISO
        else if (typeof comment.createdAt === 'string') {
          date = new Date(comment.createdAt);
        }
        // Nếu là object Date
        else if (comment.createdAt instanceof Date) {
          date = comment.createdAt;
        }
        // Trường hợp khác
        else {
          date = new Date();
        }
      } else {
        date = new Date();
      }
      
      const formattedDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      html += `
        <div class="comment-item">
          <div class="comment-avatar">${comment.author?.charAt(0) || 'A'}</div>
          <div class="comment-content">
            <div class="comment-author">${comment.author || "Người dùng"}</div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-meta">
              <span>${formattedDate}</span>
              <span class="comment-like ${comment.liked ? 'liked' : ''}" data-id="${comment.id}">
                <i class="far fa-heart"></i> ${comment.likes || 0}
              </span>
            </div>
          </div>
        </div>
      `;
    });
    
    commentList.innerHTML = html;
  
    // Add event listeners to comment likes
    document.querySelectorAll('.comment-like').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const commentId = this.dataset.id;
        likeComment(commentId);
      });
    });
  }
  
  // Like a comment
  function likeComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    const btn = document.querySelector(`.comment-like[data-id="${commentId}"]`);
    const icon = btn.querySelector('i');
    let count = parseInt(btn.textContent.match(/\d+/)[0]) || 0;
    
    if (btn.classList.contains('liked')) {
      // Unlike
      btn.classList.remove('liked');
      icon.className = 'far fa-heart';
      count--;
    } else {
      // Like
      btn.classList.add('liked');
      icon.className = 'fas fa-heart';
      count++;
    }
    
    btn.innerHTML = `<i class="${icon.className}"></i> ${count}`;
  }
  
  // Like a post
  async function likePost() {
    if (!currentPost) return;
    
    const btn = likeBtn;
    const icon = btn.querySelector('i');
    const countEl = btn.querySelector('#likeCount');
    let count = parseInt(countEl.textContent) || 0;
    
    if (btn.classList.contains('liked')) {
      // Unlike
      btn.classList.remove('liked');
      icon.className = 'far fa-heart';
      count--;
    } else {
      // Like
      btn.classList.add('liked');
      icon.className = 'fas fa-heart';
      count++;
      showToast("Bạn đã thích bài viết này", "success");
      if (typeof showNotification === 'function') {
    showNotification(
      'Bài viết được thích',
      `Bài viết "${currentPost.title}" vừa nhận được một lượt thích`,
      'fas fa-heart',
      'success'
    );
  }
    }
    
    countEl.textContent = count;
    
    // Update in Firestore
    await db.collection("posts").doc(currentPost.id).update({
      likes: count
    });
    
    // Update the card in the post list
    const card = document.querySelector(`.post-card[data-id="${currentPost.id}"]`);
    if (card) {
      const likeBtn = card.querySelector('.like-btn');
      const likeCount = likeBtn.querySelector('span');
      likeBtn.classList.toggle('liked', btn.classList.contains('liked'));
      likeBtn.querySelector('i').className = icon.className;
      likeCount.textContent = count;
    }
  }
  
  // Add a comment
  async function addComment() {
    if (!currentPost) return;
    
    const text = commentInput.value.trim();
    if (!text) {
      showToast("Vui lòng nhập bình luận", "error");
      return;
    }
    
    try {
      // Create comment - sử dụng server timestamp
      const comment = {
        postId: currentPost.id,
        text: text,
        author: "Người dùng", // Trong ứng dụng thực, sử dụng người dùng đã xác thực
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0
      };
    
      // Add to Firestore
      const docRef = await db.collection("comments").add(comment);
      
      // Add to local state
      comments.unshift({ id: docRef.id, ...comment });
      
      // Update UI
      renderComments();
      
      // Update comment count
      const commentCount = comments.length;
      document.getElementById('commentCount').textContent = commentCount;
      
      // Update post comment count in Firestore
      await db.collection("posts").doc(currentPost.id).update({
        comments: commentCount
      });
      
      // Update comment count on the post card
      const postCard = document.querySelector(`.post-card[data-id="${currentPost.id}"]`);
      if (postCard) {
        const commentCountElement = postCard.querySelector('.reaction-icons .comment-btn span');
        if (commentCountElement) {
          commentCountElement.textContent = commentCount;
        }
      }
      
      // Clear input and show success
      commentInput.value = "";
      showToast("Bình luận đã được đăng", "success");
      
    } catch (err) {
      console.error("Lỗi khi đăng bình luận:", err);
      showToast("Không thể đăng bình luận", "error");
    }
    showNotification('Bình luận mới', `Có bình luận mới trên bài viết "${currentPost.title}"`, 'fas fa-comment', 'info');
  }
  
  // Share post
  function sharePost() {
    if (!currentPost) return;
    
    // In a real app, this would be the actual URL
    const postUrl = window.location.href.split('#')[0] + `?postId=${currentPost.id}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        showToast("Đã sao chép liên kết bài viết", "success");
      })
      .catch(err => {
        console.error("Lỗi khi sao chép:", err);
        showToast("Không thể sao chép liên kết", "error");
      });
  }
  
  // Show toast notification
  function showToast(message, type = "success") {
    toastMessage.textContent = message;
    
    // Set icon based on type
    const icon = toast.querySelector('i');
    if (type === "success") {
      icon.className = "fas fa-check-circle";
      toast.style.background = "rgba(40, 167, 69, 0.9)";
    } else if (type === "error") {
      icon.className = "fas fa-exclamation-circle";
      toast.style.background = "rgba(220, 53, 69, 0.9)";
    } else {
      icon.className = "fas fa-info-circle";
      toast.style.background = "rgba(23, 162, 184, 0.9)";
    }
    
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  // Event delegation for category selection
  document.addEventListener('click', function(e) {
    // Handle category buttons in main menu and modal
    if (e.target.classList.contains('category-btn')) {
      e.preventDefault();
      
      // Update active state
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      e.target.classList.add('active');
      
      // Close modal if open
      const modal = document.getElementById('categoriesModal');
      if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
      
      // Load posts for selected category
      currentCategory = e.target.dataset.id;
      loadPosts(currentCategory);
    }
    
    // Handle floating button
    if (e.target.closest('.floating-button')) {
      showToast("Tính năng đăng bài đang được phát triển!", "info");
    }
  });
  
  // Event listeners for post detail
  closeDetailModal.addEventListener('click', () => {
    postDetailModal.classList.remove('active');
  });
  
  likeBtn.addEventListener('click', likePost);
  shareBtn.addEventListener('click', sharePost);
  commentSubmit.addEventListener('click', addComment);
  
  commentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addComment();
    }
  });
  
  // Close modal when clicking outside
  postDetailModal.addEventListener('click', (e) => {
    if (e.target === postDetailModal) {
      postDetailModal.classList.remove('active');
    }
  });
  
  // Initial load
  loadCategories();
  loadPosts();