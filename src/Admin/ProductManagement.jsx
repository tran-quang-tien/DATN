import React, { useState, useEffect } from "react";
import { NavLink , useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../api/Api";
import "./Css/ProductManagement.css";
import axios from "axios"; 

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  
  const navigate = useNavigate();
  const API_BASE = "http://localhost:3003";
  // Danh mục chuẩn để chọn khi sửa
  const categories = ["Cà phê", "Sinh tố", "Trà", "Bánh", "Nước ép", "Nước đóng chai", "Khác"];

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      // data từ API mới sẽ có trường 'category_name' hoặc 'loaimon'
      setProducts(data.sort((a, b) => a.product_id - b.product_id));
    } catch (err) { console.error("Lỗi tải sản phẩm:", err); }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

 const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData();
        // Đảm bảo lấy đúng tên, tránh trường hợp bị undefined
        const nameValue = editingProduct.product_name || editingProduct.name;
        const catValue = editingProduct.category_name || editingProduct.loaimon;

        formData.append("product_name", nameValue);
        formData.append("price", editingProduct.price);
        formData.append("loaimon", catValue || "Cà phê");
        
        if (selectedFile) {
            formData.append("image", selectedFile);
        }

        // Dùng axios cho đồng bộ với dự án của bạn
        const response = await axios.put(`${API_BASE}/api/products/${editingProduct.product_id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });

        if (response.data.success) {
            showToast("Cập nhật món thành công ✨");
            setEditingProduct(null);
            setSelectedFile(null);
            fetchProducts();
        }
    } catch (err) {
        console.error(err);
        showToast("Lỗi cập nhật: " + (err.response?.data?.error || "Lỗi kết nối"), "error");
    }
};

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa món này không?")) {
      try {
        const res = await deleteProduct(id);
        if (res.success) {
            showToast("Đã xóa món ăn khỏi thực đơn");
            fetchProducts();
        }
      } catch (err) { showToast("Lỗi khi xóa", "error"); }
    }
  };

  // Lọc tìm kiếm
  const filteredProducts = products.filter((p) => {
    const name = p.product_name || p.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Gom nhóm theo loại món để hiển thị
  const listLoaiMon = [...new Set(filteredProducts.map((p) => p.category_name || p.loaimon || "Khác"))].sort();

  return (
    <div className="sakura-admin-layout">
      {toast && <div className={`sakura-toast ${toast.type}`}>{toast.message}</div>}

      <aside className="sakura-sidebar">
        <div className="sidebar-brand">SAKURA ADMIN</div>
        <nav className="sidebar-nav">
          <NavLink  to="/admin/products" className="nav-item">📦 Thực đơn</NavLink >
                             <NavLink  to="/admin/accounts" className="nav-item">👥 Tài khoản</NavLink >
                             <NavLink  to="/admin/bookings" className="nav-item">📅 Đặt bàn</NavLink >
                             <NavLink  to="/admin/orders" className="nav-item">📊 Lịch sử đơn</NavLink >
                             <NavLink  to="/admin/purchases" className="nav-item">🚚 Nhập kho</NavLink >
                             <NavLink  to="/admin/revenue" className="nav-item tab-active" style={{background: '#fce4ec', color: '#e91e63'}}>💰 Doanh số</NavLink >
                             <NavLink  to="/admin/news/add" className="nav-item active">📝 Đăng tin tức</NavLink >
                             <NavLink  to="/Home" className="nav-item">🏠 Trang chủ</NavLink >
        </nav>
      </aside>

      <main className="sakura-main">
        <header className="main-header">
          <div className="header-left">
            <h1>Quản lý thực đơn</h1>
            <p>Quản lý giá bán, hình ảnh và danh mục món ăn</p>
          </div>
          <button className="btn-add-pink" onClick={() => navigate("/admin/products/add")}>
            + Thêm món mới
          </button>
        </header>

        <div className="search-container" style={{marginBottom: '20px'}}>
            <input 
              type="text" 
              className="modern-search-bar"
              placeholder="🔍 Tìm tên món ăn..." 
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {listLoaiMon.length === 0 && <p style={{textAlign: 'center', padding: '50px'}}>Không tìm thấy món ăn nào.</p>}

        {listLoaiMon.map((tenLoai) => {
          const items = filteredProducts.filter((p) => (p.category_name || p.loaimon || "Khác") === tenLoai);
          return (
            <div key={tenLoai} className="category-group-card" style={{marginBottom: '30px'}}>
              <h3 className="group-title" style={{color: '#e91e63', borderBottom: '2px solid #fce4ec', paddingBottom: '10px', marginBottom: '15px'}}>
                <span style={{marginRight: '10px'}}>🌸</span> {tenLoai}
              </h3>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th width="80">ID</th>
                    <th width="100">ẢNH</th>
                    <th>TÊN MÓN</th>
                    <th>GIÁ BÁN</th>
                    <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.product_id}>
                      <td className="txt-muted">#{item.product_id}</td>
                      <td>
                        <div className="product-img-box">
                          <img 
                            src={item.image ? `${API_BASE}${item.image}` : "https://via.placeholder.com/50"} 
                            alt="" 
                            style={{width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover'}}
                            onError={(e) => { e.target.src = "https://via.placeholder.com/50"; }}
                          />
                        </div>
                      </td>
                      <td className="txt-bold">{item.product_name || item.name}</td>
                      <td className="txt-price" style={{color: '#e91e63', fontWeight: 'bold'}}>
                        {Number(item.price).toLocaleString()}đ
                      </td>
                      <td>
                        <div className="action-NavLink s" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                          <button className="lnk-edit" style={{color: '#2196f3', border: 'none', background: 'none', cursor: 'pointer'}} onClick={() => { setEditingProduct(item); setSelectedFile(null); }}>Sửa</button>
                          <button className="lnk-delete" style={{color: '#f44336', border: 'none', background: 'none', cursor: 'pointer'}} onClick={() => handleDelete(item.product_id)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </main>

      {/* MODAL CHỈNH SỬA MÓN ĂN */}
      {editingProduct && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-window" style={{backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)'}}>
            <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
              <h2 style={{margin: 0, color: '#e91e63'}}>Chỉnh sửa món ăn</h2>
              <button className="btn-x" style={{border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer'}} onClick={() => setEditingProduct(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProduct}>
              <div className="grid-form">
                <div className="input-field" style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px'}}>Tên món</label>
                  <input 
                    type="text" 
                    style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                    value={editingProduct.product_name || editingProduct.name || ""} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="input-field" style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px'}}>Loại món</label>
                  <select 
                    className="custom-select" 
                    style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                    value={editingProduct.category_name || editingProduct.loaimon || "Cà phê"} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, loaimon: e.target.value })}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="input-field" style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px'}}>Giá bán (VNĐ)</label>
                  <input 
                    type="number" 
                    style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                    value={editingProduct.price || ""} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} 
                    required 
                  />
                </div>
                <div className="input-field" style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px'}}>Thay đổi hình ảnh</label>
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                </div>
              </div>
              <div className="modal-footer" style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                <button type="submit" className="btn-main-pink" style={{flex: 1, padding: '12px', backgroundColor: '#e91e63', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Lưu thay đổi</button>
                <button type="button" className="btn-sub-gray" style={{flex: 1, padding: '12px', backgroundColor: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer'}} onClick={() => setEditingProduct(null)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;