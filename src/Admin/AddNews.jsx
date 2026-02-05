import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Css/AddNews.css"; 

export default function NewsManagement() {
  const [listNews, setListNews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [newsForm, setNewsForm] = useState({
    id: null, title: "", summary: "", content: "", image: null, preview: null
  });

  const API_BASE = "http://localhost:3003";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/news`);
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
      id: item.news_id, 
      title: item.title,
      summary: item.summary,
      content: item.content,
      image: null,
      preview: `${API_BASE}${item.image}`
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append("title", newsForm.title);
    formData.append("summary", newsForm.summary);
    formData.append("content", newsForm.content);
    if (newsForm.image) formData.append("image", newsForm.image);

    try {
      let res;
      if (newsForm.id) {
        res = await axios.put(`${API_BASE}/api/news/${newsForm.id}`, formData);
      } else {
        res = await axios.post(`${API_BASE}/api/news`, formData);
      }

      if (res.data.success) {
        showToast(newsForm.id ? "🌸 Cập nhật thành công!" : "🌸 Đăng bài mới thành công!");
        setShowModal(false);
        fetchNews();
      }
    } catch (err) {
      showToast("Lỗi server rồi!", "error");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa bài viết này? Thao tác không thể hoàn tác!")) {
      try {
        await axios.delete(`${API_BASE}/api/news/${id}`);
        showToast("Đã xóa xong!");
        fetchNews();
      } catch (err) { showToast("Xóa lỗi rồi", "error"); }
    }
  };

  return (
    <div className="news-mgmt-wrapper">
      {toast && <div className={`sakura-toast ${toast.type}`}>{toast.msg}</div>}
      
      <header className="mgmt-header">
        <div className="header-info">
          <h1>📝 Quản lý Tin tức</h1>
          <p>Cập nhật những thông tin mới nhất cho khách hàng</p>
        </div>
        <button className="btn-add-primary" onClick={handleOpenAdd}>
          <span>+</span> Viết bài mới
        </button>
      </header>

      <div className="news-grid-container">
        <table className="sakura-table-modern">
          <thead>
            <tr>
              <th width="80">STT</th>
              <th width="150">Hình ảnh</th>
              <th>Tiêu đề & Tóm tắt</th>
              <th width="200">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {listNews.length > 0 ? (
              listNews.map((item, index) => (
                <tr key={item.news_id}>
                  <td className="stt-cell">{index + 1}</td>
                  <td>
                    <div className="table-img-wrapper">
                      <img 
                        src={`${API_BASE}${item.image}`} 
                        alt="news" 
                        onError={(e) => e.target.src = 'https://via.placeholder.com/150x100?text=No+Image'} 
                      />
                    </div>
                  </td>
                  <td>
                    <div className="news-info-cell">
                      <h3 className="news-title-text">{item.title}</h3>
                      <p className="news-summary-text">{item.summary}</p>
                    </div>
                  </td>
                  <td>
                    <div className="action-btns-group">
                      <button className="btn-edit-action" onClick={() => handleOpenEdit(item)}>Sửa</button>
                      <button className="btn-delete-action" onClick={() => handleDelete(item.news_id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="empty-row">Chưa có bài viết nào được đăng...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="sakura-modal-overlay">
          <div className="sakura-modal-card">
            <div className="modal-header">
              <h2>{newsForm.id ? "🌸 Cập nhật bài viết" : "🌸 Soạn bài viết mới"}</h2>
              <button className="btn-close-x" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <label>Tiêu đề bài viết</label>
                <input 
                  type="text" 
                  placeholder="Nhập tiêu đề thu hút..."
                  value={newsForm.title} 
                  onChange={(e) => setNewsForm({...newsForm, title: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-row">
                <label>Tóm tắt ngắn</label>
                <textarea 
                  rows="2" 
                  placeholder="Mô tả ngắn gọn nội dung..."
                  value={newsForm.summary} 
                  onChange={(e) => setNewsForm({...newsForm, summary: e.target.value})}
                ></textarea>
              </div>
              <div className="form-row">
                <label>Nội dung chi tiết</label>
                <textarea 
                  rows="6" 
                  placeholder="Nội dung bài viết..."
                  value={newsForm.content} 
                  onChange={(e) => setNewsForm({...newsForm, content: e.target.value})} 
                  required
                ></textarea>
              </div>
              <div className="form-row upload-row">
                 <div className="upload-box">
                    <input type="file" id="news-up" hidden onChange={(e) => {
                      const file = e.target.files[0];
                      if(file) setNewsForm({...newsForm, image: file, preview: URL.createObjectURL(file)});
                    }} />
                    <label htmlFor="news-up" className="btn-upload-label">🖼️ {newsForm.id ? "Đổi ảnh bìa" : "Tải ảnh bìa"}</label>
                 </div>
                 {newsForm.preview && <img src={newsForm.preview} className="img-preview-rect" alt="preview" />}
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-submit-news" disabled={loading}>
                  {loading ? "⌛ Đang lưu..." : "🚀 Đăng bài viết"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}