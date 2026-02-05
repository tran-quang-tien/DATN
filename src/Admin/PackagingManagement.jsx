import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Css/PackagingManagement.css";

const API_BASE = "http://localhost:3003";

export default function PackagingManagement() {
  const [packages, setPackages] = useState([]);
  const [productPkgs, setProductPkgs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal và tìm kiếm
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newBinding, setNewBinding] = useState({ packaging_id: "", quantity: 1, search_text: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pkgRes, prodPkgRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE}/api/packaging`),
        axios.get(`${API_BASE}/api/product-packaging`),
        axios.get(`${API_BASE}/api/admin/recipes-list`)
      ]);
      setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : []);
      setProductPkgs(Array.isArray(prodPkgRes.data) ? prodPkgRes.data : []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prod) => {
    setSelectedProduct(prod);
    setShowModal(true);
    setNewBinding({ packaging_id: "", quantity: 1, search_text: "" }); // Reset form
  };

  const handleSaveBinding = async () => {
    if (!newBinding.packaging_id) {
      return alert("Tiến ơi, phải chọn đúng tên bao bì trong danh sách gợi ý nhé!");
    }
    try {
      await axios.post(`${API_BASE}/api/product-packaging`, {
        product_id: selectedProduct.product_id,
        packaging_id: parseInt(newBinding.packaging_id),
        quantity: parseInt(newBinding.quantity)
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  const handleUpdateStock = async (id, currentQty) => {
    const newQty = prompt("Nhập số lượng tồn kho mới:", currentQty);
    if (newQty !== null && !isNaN(newQty)) {
      await axios.put(`${API_BASE}/api/packaging/${id}`, { quantity: parseInt(newQty) });
      fetchData();
    }
  };

  if (loading) return <div className="sakura-loading">🌸 Đang kiểm kho...</div>;

  return (
    <div className="pkg-mgmt-container">
      <h2 className="title">📦 QUẢN LÝ KHO BAO BÌ</h2>

      <div className="pkg-layout">
        {/* CỘT 1: KHO TỔNG BAO BÌ */}
        <div className="pkg-section">
          <h3>📦 Danh sách bao bì trong kho</h3>
          <div className="table-wrapper">
            <table className="sakura-table">
              <thead>
                <tr>
                  <th>Tên bao bì</th>
                  <th>Kích cỡ</th>
                  <th>Tồn kho</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.packaging_id} className={pkg.quantity < 10 ? "low-stock" : ""}>
                    <td><strong>{pkg.name}</strong></td>
                    <td>{pkg.size}</td>
                    <td className="stock-cell">{pkg.quantity}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleUpdateStock(pkg.packaging_id, pkg.quantity)}>Nhập</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CỘT 2: ĐỊNH MỨC THEO MÓN */}
        <div className="pkg-section">
          <h3>🥤 Định mức bao bì theo món</h3>
          <div className="scroll-grid-wrapper">
            <div className="prod-pkg-grid">
              {products.map((prod) => (
                <div key={prod.product_id} className="prod-pkg-card">
                  <h4>{prod.product_name}</h4>
                  <div className="pkg-list-mini">
                    {productPkgs
                      .filter((pp) => pp.product_id === prod.product_id)
                      .map((item, idx) => (
                        <div key={idx} className="pkg-item-row">
                          <span>{item.pkg_name}</span>
                          <span className="qty-tag">x{item.quantity}</span>
                        </div>
                      ))}
                  </div>
                  <button className="btn-add-mini" onClick={() => handleOpenModal(prod)}>+ Thêm bao bì</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SEARCH & ADD */}
      {showModal && (
        <div className="sakura-modal-overlay">
          <div className="sakura-modal">
            <h3>Gắn bao bì cho: <br/> <span className="highlight-text">{selectedProduct?.product_name}</span></h3>
            
            <div className="modal-body">
              <label>🔍 Tìm loại bao bì:</label>
              <input 
                list="pkg-options"
                placeholder="Gõ tên để tìm nhanh..."
                className="search-input"
                onChange={(e) => {
                  const match = packages.find(p => p.name === e.target.value);
                  setNewBinding({
                    ...newBinding, 
                    search_text: e.target.value,
                    packaging_id: match ? match.packaging_id : ""
                  });
                }}
              />
              <datalist id="pkg-options">
                {packages.map(p => (
                  <option key={p.packaging_id} value={p.name}>
                    {p.size} - Tồn: {p.quantity}
                  </option>
                ))}
              </datalist>

              <label>🔢 Số lượng (định mức):</label>
              <input 
                type="number" 
                min="1" 
                value={newBinding.quantity}
                onChange={(e) => setNewBinding({...newBinding, quantity: e.target.value})}
              />
            </div>

            <div className="modal-footer">
              <button className="btn-save" onClick={handleSaveBinding}>Xác nhận lưu</button>
              <button className="btn-close" onClick={() => setShowModal(false)}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}