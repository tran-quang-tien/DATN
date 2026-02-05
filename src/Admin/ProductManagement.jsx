import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Css/ProductManagement.css";

const API_BASE = "http://localhost:3003";

// Map tên loại sang ID để gửi về SQL Server
const categoryMap = {
  "Cà phê": 1, "Matcha": 2, "Trà": 3, "Bánh ngọt": 4,
  "Sinh tố": 5, "Nước ép": 6, "Nước đóng chai": 7, "Trà sữa": 9, "Khác": 8
};

export default function ProductManagement() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState("active");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const url = viewMode === "active"
        ? `${API_BASE}/api/products`
        : `${API_BASE}/api/products/locked`;

      const res = await axios.get(url);
      const fixedData = res.data.map(p => ({
        ...p,
        price: Number(p.price),
        discount: p.product_discount ? Number(p.product_discount) : 0
      }));
      setProducts(fixedData);
    } catch (err) {
      console.error(err);
      alert("Lỗi tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [viewMode]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", editingProduct.name);
    formData.append("price", editingProduct.price);
    // Lấy ID từ map dựa trên tên loại đang chọn trong Select
    formData.append("category_id", categoryMap[editingProduct.category_name] || 9);
    formData.append("description", editingProduct.description || "");
    formData.append("discount", editingProduct.discount || 0);

    if (selectedFile) formData.append("image", selectedFile);
    else formData.append("image", editingProduct.image);

    try {
      const res = await axios.put(`${API_BASE}/api/products/${editingProduct.product_id}`, formData);
      if (res.data.success) {
        alert("Cập nhật thành công ✨");
        setEditingProduct(null);
        setSelectedFile(null);
        loadProducts();
      }
    } catch (err) { alert("Lỗi khi lưu!"); }
  };

  // Logic hiển thị
  const filtered = products.filter(p => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const groups = [...new Set(filtered.map(p => p.category_name || "Khác"))];

  return (
    <div className="product-mgmt-container">
      <header className="page-header">
        <h1 className="page-title">🌸 Quản lý thực đơn</h1>
        <button className="add-btn-pink" onClick={() => navigate("/admin/products/add")}>
          + Thêm món mới
        </button>
      </header>

      <div className="view-mode-tabs">
        <button className={`tab-btn ${viewMode === "active" ? "active" : ""}`} onClick={() => setViewMode("active")}>
          ✅ Đang kinh doanh
        </button>
        <button className={`tab-btn ${viewMode === "locked" ? "locked-active" : ""}`} onClick={() => setViewMode("locked")}>
          🚫 Món đã khóa
        </button>
      </div>

      <div className="search-box-wrapper">
        <input
          className="sakura-search-input"
          placeholder="🔍 Tìm kiếm món ăn..."
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <div className="loading-text">Đang tải dữ liệu...</div>}

      {groups.map(group => (
        <section key={group} className="product-group-section">
          <h3 className="category-title">🍱 {group}</h3>
          <div className="product-box-grid">
            {filtered.filter(p => p.category_name === group || (!p.category_name && group === "Khác")).map(item => (
              <div key={item.product_id} className={`product-item-card ${viewMode === 'locked' ? 'is-locked' : ''}`}>
                <span className="card-id-badge">#{item.product_id}</span>
                <div className="card-img-container">
                  <img src={`${API_BASE}${item.image}`} alt={item.name} />
                </div>
                <div className="card-info">
                  <h4 className="item-name">{item.name}</h4>
                  <div className="item-prices">
                    {item.discount > 0 ? (
                      <>
                        <span className="price-old">{item.price.toLocaleString()}đ</span>
                        <span className="price-new">
                          {(item.price * (1 - item.discount / 100)).toLocaleString()}đ
                        </span>
                      </>
                    ) : (
                      <span className="price-single">{item.price.toLocaleString()}đ</span>
                    )}
                  </div>
                  <div className="card-btns">
                    {viewMode === "active" ? (
                      <>
                        <button className="btn-edit" onClick={() => {
                          setEditingProduct(item);
                          setPreviewUrl(`${API_BASE}${item.image}`);
                        }}>Sửa</button>
                        <button className="btn-lock" onClick={() => loadProducts()}>Khóa</button>
                      </>
                    ) : (
                      <button className="btn-unlock" onClick={() => loadProducts()}>🔓 Mở khóa</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* MODAL CHỈNH SỬA - ĐÃ THÊM CHỌN LOẠI MÓN */}
      {editingProduct && (
        <div className="sakura-modal-overlay">
          <div className="sakura-modal-card">
            <h2>Chỉnh sửa món</h2>
            <form onSubmit={handleUpdate} className="edit-form-layout">
              <div className="image-column">
                <label>Ảnh hiện tại</label>
                <img src={previewUrl} alt="preview" className="edit-preview-img" />
                <input type="file" onChange={(e) => {
                    const file = e.target.files[0];
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                }} />
              </div>
              <div className="form-column">
                <label>Tên món</label>
                <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
                
                <label>Loại món</label>
                <select 
                  className="sakura-select"
                  value={editingProduct.category_name || "Khác"} 
                  onChange={e => setEditingProduct({...editingProduct, category_name: e.target.value})}
                >
                  {Object.keys(categoryMap).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <label>Giá gốc (đ)</label>
                <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} required />
                
                <label>Giảm giá (%)</label>
                <input type="number" min="0" max="100" value={editingProduct.discount} onChange={e => setEditingProduct({...editingProduct, discount: e.target.value})} />
                
                <label>Mô tả</label>
                <textarea value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                
                <div className="modal-footer-btns">
                  <button type="submit" className="save-btn">Lưu thay đổi</button>
                  <button type="button" className="cancel-btn" onClick={() => setEditingProduct(null)}>Hủy</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}