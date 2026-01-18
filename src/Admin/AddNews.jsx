import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import "./Css/AddNews.css"; 

export default function NewsManagement() {
  const [listNews, setListNews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [newsForm, setNewsForm] = useState({
    id: null, title: "", summary: "", content: "", image: null, preview: null
  });
  const [viewingNews, setViewingNews] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNews = async () => {
    try {
      const res = await axios.get("http://localhost:3003/api/news");
      setListNews(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách", "error");
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const handleOpenAdd = () => {
    setNewsForm({ id: null, title: "", summary: "", content: "", image: null, preview: null });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setNewsForm({
      id: item.id, // Lưu ID vào đây để biết là đang sửa
      title: item.title,
      summary: item.summary,
      content: item.content,
      image: null,
      preview: `http://localhost:3003/uploads/${item.image}`
    });
    setShowModal(true);
  };

  const handleOpenView = (item) => {
    setViewingNews(item);
    setShowViewModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append("title", newsForm.title);
    formData.append("summary", newsForm.summary);
    formData.append("content", newsForm.content);
    // Chỉ gửi ảnh lên nếu người dùng có chọn ảnh mới
    if (newsForm.image) formData.append("image", newsForm.image);

    try {
      let res;
      if (newsForm.id) {
        // TRƯỜNG HỢP SỬA: Dùng phương thức PUT và truyền ID trên URL
        res = await axios.put(`http://localhost:3003/api/news/${newsForm.id}`, formData);
      } else {
        // TRƯỜNG HỢP TẠO MỚI: Dùng POST
        res = await axios.post("http://localhost:3003/api/news", formData);
      }

      if (res.data.success) {
        showToast(newsForm.id ? "🌸 Cập nhật thành công!" : "🌸 Đăng bài mới thành công!");
        setShowModal(false);
        fetchNews(); // Load lại danh sách bài viết
      }
    } catch (err) {
      showToast("Lỗi server rồi ông ơi!", "error");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa là mất luôn đó, chắc chưa?")) {
      try {
        await axios.delete(`http://localhost:3003/api/news/${id}`);
        showToast("Đã xóa xong!");
        fetchNews();
      } catch (err) { showToast("Xóa lỗi rồi", "error"); }
    }
  };

  return (
    <div className="sakura-admin-layout">
      {toast && <div className={`sakura-toast ${toast.type}`}>{toast.msg}</div>}

      <aside className="sakura-sidebar">
        <div className="sidebar-brand">SAKURA ADMIN</div>
        <nav className="sidebar-nav">
          <NavLink to="/admin/products" className="nav-item">📦 Thực đơn</NavLink>
          <NavLink to="/admin/accounts" className="nav-item">👥 Tài khoản</NavLink>
          <NavLink to="/admin/bookings" className="nav-item">📅 Đặt bàn</NavLink>
          <NavLink to="/admin/news/add" className="nav-item active">📝 Tin tức</NavLink>
          <NavLink to="/Home" className="nav-item">🏠 Trang chủ</NavLink>
        </nav>
      </aside>

      <main className="sakura-main-content">
        <div className="admin-header-box flex-header">
          <h1>📝 Quản lý Tin tức</h1>
          <button className="btn-add-new" onClick={handleOpenAdd}>➕ Viết bài mới</button>
        </div>

        <div className="news-list-container">
          <table className="sakura-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Ảnh</th>
                <th>Tiêu đề</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {listNews.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td><img src={`http://localhost:3003/uploads/${item.image}`} className="table-img-news cursor-pointer" onClick={() => handleOpenView(item)} alt="" /></td>
                  <td className="bold-text cursor-pointer" onClick={() => handleOpenView(item)}>{item.title}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-edit" onClick={() => handleOpenEdit(item)}>Sửa</button>
                      <button className="btn-delete" onClick={() => handleDelete(item.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL THÊM / SỬA */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{newsForm.id ? "🌸 Chỉnh sửa bài viết" : "🌸 Tạo bài viết mới"}</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Tiêu đề</label>
                  <input type="text" value={newsForm.title} onChange={(e) => setNewsForm({...newsForm, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Tóm tắt</label>
                  <textarea rows="2" value={newsForm.summary} onChange={(e) => setNewsForm({...newsForm, summary: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label>Nội dung</label>
                  <textarea rows="5" value={newsForm.content} onChange={(e) => setNewsForm({...newsForm, content: e.target.value})} required></textarea>
                </div>
                <div className="image-upload-section">
                   <input type="file" id="modal-img" onChange={(e) => {
                     const file = e.target.files[0];
                     if(file) setNewsForm({...newsForm, image: file, preview: URL.createObjectURL(file)});
                   }} hidden />
                   <label htmlFor="modal-img" className="btn-select-image">🖼️ Thay ảnh</label>
                   {newsForm.preview && <img src={newsForm.preview} className="preview-small" alt="" />}
                </div>
                <button type="submit" className="btn-submit-form" disabled={loading}>
                  {loading ? "⌛ Đang lưu..." : "🚀 Lưu thay đổi"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL XEM CHI TIẾT */}
        {showViewModal && viewingNews && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal-content view-only" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="sakura-text">{viewingNews.title}</h2>
                <button className="close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
              </div>
              <img src={`http://localhost:3003/uploads/${viewingNews.image}`} className="view-full-img" alt="" />
              <div className="view-content-text">{viewingNews.content}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}