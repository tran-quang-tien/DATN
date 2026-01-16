import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Css/ProductManagement.css"; 
import "./Css/AdminOrderHistory.css"; 
import { getPurchaseHistory } from '../api/Api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminPurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseDetails, setPurchaseDetails] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const API_BASE = "http://localhost:3003";

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const data = await getPurchaseHistory(); 
      let filteredData = data;
      if (startDate && endDate) {
        filteredData = data.filter(p => {
          const date = p.created_at.split('T')[0];
          return date >= startDate && date <= endDate;
        });
      }
      setPurchases(filteredData);
    } catch (err) {
      console.error("Lỗi:", err);
      toast.error("Lỗi tải dữ liệu nhập kho");
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [startDate, endDate]);

  const handleViewDetails = async (purchase) => {
    setSelectedPurchase(purchase);
    try {
      const res = await fetch(`${API_BASE}/api/staff/purchase-orders/${purchase.purchase_id}/details`);
      if (!res.ok) throw new Error("Lỗi tải chi tiết phiếu nhập");
      const data = await res.json();
      setPurchaseDetails(data);
    } catch (error) {
      toast.error("Không thể lấy chi tiết phiếu nhập");
      console.error(error);
    }
  };

  const totalExpense = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

  return (
    <div className="sakura-admin-layout">
      <ToastContainer />
      <aside className="sakura-sidebar">
        <div className="sidebar-brand">SAKURA ADMIN</div>
        <nav className="sidebar-nav">
          <Link to="/admin/products" className="nav-item">📦 Thực đơn</Link>
          <Link to="/admin/accounts" className="nav-item">👥 Tài khoản</Link>
          <Link to="/admin/bookings" className="nav-item">📅 Đặt bàn</Link>
          <Link to="/admin/orders" className="nav-item">📊 Lịch sử đơn</Link>
          <Link to="/admin/purchases" className="nav-item active">🚚 Nhập kho</Link>
           <Link to="/admin/revenue" className="nav-item active">💰 Doanh số</Link>
          <div className="nav-divider"></div>
          <Link to="/Home" className="nav-item">🏠 Trang chủ</Link>
        </nav>
      </aside>

      <main className="sakura-main">
        <header className="main-header">
          <div className="header-left">
            <h1>Lịch sử nhập hàng</h1>
            <p>Quản lý chi phí nguyên liệu đầu vào</p>
          </div>
          <div className="header-right">
            <h3 style={{ color: "#e91e63", fontSize: "24px" }}>
              Tổng chi: {totalExpense.toLocaleString("vi-VN")}đ
            </h3>
          </div>
        </header>

        <div className="filter-container-sakura">
          <div className="filter-dates">
            <label>Từ ngày: </label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label> Đến: </label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button className="btn-view" onClick={() => {setStartDate(""); setEndDate("");}} style={{marginLeft: '10px'}}>Xóa lọc</button>
          </div>
        </div>

        <div className="category-group-card">
          <table className="modern-table">
            <thead>
              <tr>
                <th>MÃ PHIẾU</th>
                <th>NHÀ CUNG CẤP</th>
                <th>GHI CHÚ</th>
                <th>TỔNG TIỀN</th>
                <th>NGÀY NHẬP</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length > 0 ? (
                purchases.map((p) => (
                  <tr key={p.purchase_id} onClick={() => handleViewDetails(p)} style={{ cursor: "pointer" }}>
                    <td>#{p.purchase_id}</td>
                    <td>{p.supplier_name}</td>
                    <td>{p.note || "---"}</td>
                    <td style={{ fontWeight: "bold", color: "#e91e63" }}>
                      {Number(p.total_amount).toLocaleString("vi-VN")}đ
                    </td>
                    <td>{new Date(p.created_at).toLocaleString("vi-VN")}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: "center" }}>Chưa có dữ liệu nhập kho...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedPurchase && (
          <div className="modal-overlay" onClick={() => setSelectedPurchase(null)}>
            <div className="modal-window" style={{width: '750px'}} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Chi tiết phiếu nhập #{selectedPurchase.purchase_id}</h2>
                <button onClick={() => setSelectedPurchase(null)}>✕</button>
              </div>
              <div style={{ padding: "20px" }}>
                <div style={{ background: "#fff5f7", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                   <p><strong>Nhà cung cấp:</strong> {selectedPurchase.supplier_name}</p>
                   <p><strong>Số điện thoại:</strong> {selectedPurchase.supplier_phone || "N/A"}</p>
                   <p><strong>Ghi chú:</strong> {selectedPurchase.note || "Không có"}</p>
                </div>

                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Nguyên liệu</th>
                      <th>SL</th>
                      <th>Đơn giá</th>
                      <th style={{ textAlign: "right" }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseDetails.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                            <div>{item.ingredient_name}</div>
                            {/* Hiển thị hạn sử dụng nhỏ phía dưới nếu có */}
                            <small style={{color: '#666'}}>HSD: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString("vi-VN") : "N/A"}</small>
                        </td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>{Number(item.import_price).toLocaleString("vi-VN")}đ</td>
                        <td style={{ textAlign: "right" }}>
                          {Number(item.total_price).toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                      <tr>
                          <td colSpan="3" style={{textAlign: 'right', fontWeight: 'bold'}}>TỔNG CỘNG:</td>
                          <td style={{textAlign: 'right', fontWeight: 'bold', color: '#e91e63'}}>
                              {Number(selectedPurchase.total_amount).toLocaleString("vi-VN")}đ
                          </td>
                      </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}