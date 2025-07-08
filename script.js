// ==== CẤU HÌNH FIREBASE ====
const firebaseConfig = {
  apiKey: "AIzaSyAKGtqzDgN8NLdto1MXO_LsUwTvgnQ-TmI",
  authDomain: "web-blog-b54dc.firebaseapp.com",
  projectId: "web-blog-b54dc",
  storageBucket: "web-blog-b54dc.appspot.com",
  messagingSenderId: "1086582654089",
  appId: "1:1086582654089:web:0e3e01709c19b21f16f27c",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==== CHUẨN HÓA DỮ LIỆU ẢNH/VIDEO ====
function normalizeFile(file) {
  if (!file) return "";
  // Trường hợp là mảng (images)
  if (Array.isArray(file)) {
    const first = file[0];
    if (first?.url) return first.url;
  }
  // Trường hợp là object có url
  if (typeof file === "object" && file.url) {
    return file.url;
  }
  // Trường hợp là string
  if (typeof file === "string") return file;
  return "";
}


// ==== TẢI DANH MỤC ====
async function loadCategories() {
  const categoryList = document.getElementById("categoryList");
  try {
    const snapshot = await db.collection("danhmuc").get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      const a = document.createElement("a");
      a.href = `#${data.tenDanhMuc}`;
      a.className = "nav-link";
      a.textContent = data.tenDanhMuc;
      categoryList.appendChild(a);
    });
  } catch (err) {
    console.error("Lỗi tải danh mục:", err);
  }
}

// ==== TẢI BÀI VIẾT ====
async function loadPosts() {
  const postList = document.getElementById("postList");
  postList.innerHTML = ""; // clear loading spinner
  try {
    const snapshot = await db.collection("baiviet").orderBy("createdAt", "desc").get();
    snapshot.forEach((doc) => {
      const post = doc.data();
      post.id = doc.id;
      const card = createPostCard(post);
      postList.appendChild(card);
    });
  } catch (err) {
    console.error("Lỗi tải bài viết:", err);
    postList.innerHTML = `<p class="text-danger text-center">Không thể tải bài viết!</p>`;
  }
}

// ==== TẠO THẺ BÀI VIẾT ====
function createPostCard(post) {
  const col = document.createElement("div");
  col.className = "col-md-4";

  const card = document.createElement("div");
  card.className = "card h-100";

  let media;
  const mediaUrl = normalizeFile(post.images || post.anh || post.video);


  if (post.video) {
    media = document.createElement("video");
    media.src = mediaUrl;
    media.controls = true;
    media.className = "card-img-top";
  } else {
    media = document.createElement("img");
    media.src = mediaUrl || "https://via.placeholder.com/400x200";
    media.className = "card-img-top";
    media.alt = post.tieuDe || "Bài viết";
  }

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  const title = document.createElement("h5");
  title.className = "card-title";
  title.textContent = post.tieuDe;

  const date = document.createElement("p");
  date.className = "card-text text-muted";
  date.innerHTML = `<i class="far fa-calendar-alt me-2"></i>${post.createdAt?.toDate().toLocaleDateString("vi-VN") || "N/A"}`;

  const btn = document.createElement("button");
  btn.className = "btn btn-outline-primary mt-2";
  btn.textContent = "Xem chi tiết";
  btn.onclick = () => openPostDetail(post);

  cardBody.append(title, date, btn);
  card.append(media, cardBody);
  col.appendChild(card);

  return col;
}

// ==== HIỂN THỊ CHI TIẾT BÀI VIẾT ====
function openPostDetail(post) {
  document.getElementById("postDetailModal").style.display = "block";

  document.getElementById("detailTitle").textContent = post.tieuDe;
  document.getElementById("detailDate").textContent = post.createdAt?.toDate().toLocaleDateString("vi-VN") || "";
  document.getElementById("detailViews").textContent = post.luotXem || 0;
  document.getElementById("likeCount").textContent = post.luotThich || 0;
  document.getElementById("commentCount").textContent = post.binhLuan?.length || 0;
  document.getElementById("detailImage").src = normalizeFile(post.images || post.anh);
  document.getElementById("detailContent").innerHTML = post.noiDung || "";

  // Nếu có video, chèn vào đầu
  if (post.video) {
    const video = document.createElement("video");
    video.src = normalizeFile(post.video);
    video.controls = true;
    video.className = "w-100 my-3";
    document.getElementById("detailContent").prepend(video);
  }

  loadComments(post);
}

// ==== ĐÓNG MODAL ====
document.getElementById("closeDetailModal").onclick = () => {
  document.getElementById("postDetailModal").style.display = "none";
};

// ==== TẢI BÌNH LUẬN ====
function loadComments(post) {
  const commentList = document.getElementById("commentList");
  commentList.innerHTML = "";
  if (post.binhLuan && post.binhLuan.length > 0) {
    post.binhLuan.forEach((cmt) => {
      const div = document.createElement("div");
      div.className = "comment-item";
      div.innerHTML = `<strong>${cmt.ten || "Ẩn danh"}</strong>: ${cmt.noiDung}`;
      commentList.appendChild(div);
    });
  } else {
    commentList.innerHTML = "<p>Chưa có bình luận.</p>";
  }
}

// ==== GỬI BÌNH LUẬN ====
document.getElementById("commentSubmit").onclick = async () => {
  const commentInput = document.getElementById("commentInput");
  const content = commentInput.value.trim();
  if (!content) return;

  const postTitle = document.getElementById("detailTitle").textContent;

  const snapshot = await db.collection("baiviet").where("tieuDe", "==", postTitle).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    const binhLuan = data.binhLuan || [];

    binhLuan.push({
      ten: "Khách", // Có thể cho nhập tên
      noiDung: content,
      thoiGian: new Date()
    });

    await db.collection("baiviet").doc(doc.id).update({ binhLuan });

    commentInput.value = "";
    openPostDetail({ ...data, id: doc.id }); // refresh
  }
};

// ==== HIỆU ỨNG FLOATING BUTTON ====
document.querySelector(".floating-button").onclick = () => {
  window.location.href = "dangbai.html";
};

// ==== KHỞI TẠO ====
document.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  await loadPosts();
});