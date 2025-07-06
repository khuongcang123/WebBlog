// === XỬ LÝ ĐĂNG BÀI ===
// === XỬ LÝ ĐĂNG BÀI ===
if (document.getElementById("postForm")) {
  document.getElementById("postForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const category = document.getElementById("category")?.value || "Chưa phân loại";
    const files = document.getElementById("images").files;

    const imagePromises = Array.from(files).map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(base64Images => {
      const post = {
        id: Date.now(),
        title,
        content,
        category,
        images: base64Images,
        createdAt: new Date().toLocaleString(),
        comments: [],
        reactions: {
          like: 0,
          love: 0,
          haha: 0,
          sad: 0,
          angry: 0
        }
      };

      const posts = JSON.parse(localStorage.getItem("posts")) || [];
      posts.push(post);
      localStorage.setItem("posts", JSON.stringify(posts));

      alert("🎉 Đăng bài thành công!");
      window.location.href = "index.html";
    });
  });
}


// === HIỂN THỊ DANH SÁCH BÀI VIẾT TRÊN TRANG CHỦ ===
if (document.getElementById("posts")) {
  const posts = JSON.parse(localStorage.getItem("posts")) || [];
  const postsDiv = document.getElementById("posts");

  posts.reverse().forEach(post => {
    const firstImage = post.images?.[0] || null;
    const imageHTML = firstImage
      ? `<img src="${firstImage}" class="card-img-top" style="height: 200px; object-fit: cover;" />`
      : '';

    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4 mb-4";
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <a href="view.html?id=${post.id}" class="text-decoration-none text-dark">
          ${imageHTML}
          <div class="card-body">
            <h6 class="text-primary mb-1">${post.category || "Chưa phân loại"}</h6>
<h5 class="card-title">${post.title}</h5>

            <p class="card-text text-truncate">${post.content}</p>
          </div>
        </a>
        <div class="card-footer d-flex justify-content-between align-items-center">
          <small class="text-muted">🕒 ${post.createdAt}</small>
        </div>
        <div class="p-2 d-flex justify-content-around border-top">
          <button class="btn btn-sm btn-outline-secondary reaction-btn-${post.id}">👍 Thích</button>
          <button class="btn btn-sm btn-outline-primary" onclick="quickComment(${post.id})">💬 Bình luận</button>
          <button class="btn btn-sm btn-outline-success" onclick="copyShareLink(${post.id})">🔗 Chia sẻ</button>
        </div>
      </div>
    `;
    postsDiv.appendChild(col);

    // Setup giữ chuột cho nút cảm xúc
    setTimeout(() => {
      const btn = document.querySelector(`.reaction-btn-${post.id}`);
      if (btn) setupReactionHold(btn, post.id);
    }, 0);
  });
}

// === GIỮ CHUỘT ĐỂ HIỆN CẢM XÚC ===
let holdTimer = null;

function setupReactionHold(button, postId) {
  button.onmousedown = () => {
    holdTimer = setTimeout(() => {
      showReactionBox(button, postId);
    }, 500);
  };
  button.onmouseup = () => clearTimeout(holdTimer);
  button.onmouseleave = () => clearTimeout(holdTimer);
}

// === HIỆN HỘP CẢM XÚC ===
function showReactionBox(button, postId) {
  const box = document.createElement("div");
  box.className = "reaction-box position-absolute bg-white p-2 rounded shadow";
  box.style.top = (button.getBoundingClientRect().top - 50 + window.scrollY) + "px";
  box.style.left = (button.getBoundingClientRect().left - 30 + window.scrollX) + "px";
  box.style.zIndex = "9999";
  box.innerHTML = `
    <span style="font-size:24px; cursor:pointer;" onclick="react(${postId}, 'like'); this.parentElement.remove();">👍</span>
    <span style="font-size:24px; cursor:pointer;" onclick="react(${postId}, 'love'); this.parentElement.remove();">❤️</span>
    <span style="font-size:24px; cursor:pointer;" onclick="react(${postId}, 'haha'); this.parentElement.remove();">😆</span>
    <span style="font-size:24px; cursor:pointer;" onclick="react(${postId}, 'sad'); this.parentElement.remove();">😢</span>
    <span style="font-size:24px; cursor:pointer;" onclick="react(${postId}, 'angry'); this.parentElement.remove();">😠</span>
  `;
  document.body.appendChild(box);

  setTimeout(() => {
    box.remove();
  }, 3000);
}

// === CẬP NHẬT CẢM XÚC ===
function react(postId, type) {
  const posts = JSON.parse(localStorage.getItem("posts")) || [];
  const index = posts.findIndex(p => p.id == postId);
  if (index !== -1) {
    if (!posts[index].reactions) {
      posts[index].reactions = { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };
    }
    posts[index].reactions[type]++;
    localStorage.setItem("posts", JSON.stringify(posts));
    alert(`Bạn đã ${type === 'like' ? 'thích' : type} bài viết`);
    location.reload();
  }
}

// === CHIA SẺ BÀI VIẾT ===
function copyShareLink(postId) {
  const link = `${location.origin}/view.html?id=${postId}`;
  navigator.clipboard.writeText(link).then(() => {
    alert("📎 Link bài viết đã được sao chép!");
  });
}

// === BÌNH LUẬN NHANH ===
function quickComment(postId) {
  const text = prompt("💬 Nhập bình luận:");
  if (text) {
    const posts = JSON.parse(localStorage.getItem("posts")) || [];
    const index = posts.findIndex(p => p.id == postId);
    if (index !== -1) {
      if (!posts[index].comments) posts[index].comments = [];
      posts[index].comments.push({
        text,
        time: new Date().toLocaleString()
      });
      localStorage.setItem("posts", JSON.stringify(posts));
      alert("✅ Bình luận đã được lưu!");
    }
  }
}
