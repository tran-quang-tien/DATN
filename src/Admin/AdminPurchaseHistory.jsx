import React, { useState, useEffect } from "react";
import "./Css/AdminPurchaseHistory.css";
import { getPurchaseHistory, API_BASE } from "../api/Api";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminPurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseDetails, setPurchaseDetails] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      setPurchases(Array.isArray(filteredData) ? filteredData : []);
    } catch (err) {
      console.error("Lỗi fetch:", err);
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
      if (!res.ok) throw new Error("Lỗi tải chi tiết");
      const data = await res.json();
      setPurchaseDetails(data);
    } catch (error) {
      toast.error("Không thể lấy chi tiết phiếu nhập");
    }
  };

  const totalExpense = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

  return (
    <div className="purchase-mgmt-wrapper">
      <ToastContainer position="top-right" autoClose={2000} />
      
      <header className="mgmt-header">
        <div className="header-info">
          <h1>📦 Lịch sử Nhập hàng</h1>
          <p>Quản lý dòng tiền và nguyên liệu đầu vào</p>
        </div>
        <div className="expense-card">
          <span className="label">Tổng chi phí nhập kho:</span>
          <span className="amount">{totalExpense.toLocaleString("vi-VN")}đ</span>
        </div>
      </header>

      <div className="filter-bar-sakura">
        <div className="date-group">
          <div className="date-item">
            <label>Từ ngày</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="date-item">
            <label>Đến ngày</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button className="btn-reset" onClick={() => {setStartDate(""); setEndDate("");}}>🔄 Reset</button>
        </div>
      </div>

      <div className="table-container-history">
        <table className="purchase-table">
          <thead>
            <tr>
              <th>MÃ PHIẾU</th>
              <th>NHÀ CUNG CẤP</th>
              <th>SỐ ĐIỆN THOẠI</th>
              <th>NGÀY NHẬP</th>
              <th className="txt-right">TỔNG TIỀN</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.purchase_id} onClick={() => handleViewDetails(p)} className="row-hover">
                <td className="id-tag">#{p.purchase_id}</td>
                <td className="supplier-name">{p.supplier_name}</td>
                <td>{p.supplier_phone || "---"}</td>
                <td>{new Date(p.created_at).toLocaleDateString("vi-VN")}</td>
                <td className="txt-right total-cell">{Number(p.total_amount).toLocaleString("vi-VN")}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPurchase && (
        <div className="sakura-modal-overlay" onClick={() => setSelectedPurchase(null)}>
          <div className="modal-purchase-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Chi tiết phiếu nhập #{selectedPurchase.purchase_id}</h3>
              <button className="close-btn" onClick={() => setSelectedPurchase(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Nguyên liệu</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th className="txt-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseDetails.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.ingredient_name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{Number(item.import_price).toLocaleString("vi-VN")}đ</td>
                      <td className="txt-right">{Number(item.total_price).toLocaleString("vi-VN")}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="final-footer">
                <span>TỔNG CỘNG:</span>
                <span className="final-price">{Number(selectedPurchase.total_amount).toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}