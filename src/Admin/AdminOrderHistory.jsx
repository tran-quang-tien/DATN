import React, { useState, useEffect } from "react";
import "./Css/AdminOrderHistory.css"; 

export default function AdminOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const API_BASE = "http://localhost:3003";

  useEffect(() => {
    fetchOrders();
  }, [filterType, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      let url = `${API_BASE}/api/admin/orders-history?type=${filterType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setOrders([]);
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${order.order_id}/details`);
      const data = await res.json();
      setOrderDetails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải chi tiết:", error);
    }
  };

  // --- LOGIC THỐNG KÊ ---
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const onlineCount = orders.filter(o => o.order_type === "Online").length;
  const localCount = orders.filter(o => o.order_type === "Trực tiếp").length;

  return (
    <div className="order-history-wrapper">
      <header className="mgmt-header">
        <div className="header-info">
          <h1>📜 Lịch sử đơn hàng</h1>
          <p>Dữ liệu đang hiển thị cho tháng {new Date().getMonth() + 1}</p>
        </div>
        
        <div className="stats-summary-group">
          <div className="stat-box online">
            <span className="label">📱 Đơn Online</span>
            <span className="value">{onlineCount}</span>
          </div>
          <div className="stat-box local">
            <span className="label">🏪 Tại chỗ</span>
            <span className="value">{localCount}</span>
          </div>
          <div className="revenue-badge">
            <span className="label">Tổng doanh thu kỳ này:</span>
            <span className="amount">{totalRevenue.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>
      </header>

      <div className="filter-section-sakura">
        <div className="tab-group">
          {["All", "Online", "Trực tiếp"].map((t) => (
            <button
              key={t}
              className={filterType === t ? "active" : ""}
              onClick={() => setFilterType(t)}
            >
              {t === "All" ? "Tất cả" : t === "Online" ? "📱 Online" : "🏪 Tại chỗ"}
            </button>
          ))}
        </div>

        <div className="date-inputs">
          <div className="input-field">
            <label>Từ ngày</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="input-field">
            <label>Đến ngày</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-card-history">
        <table className="sakura-history-table">
          <thead>
            <tr>
              <th>MÃ ĐƠN</th>
              <th>KHÁCH HÀNG</th>
              <th>PHÂN LOẠI</th>
              <th>THỜI GIAN</th>
              <th>TỔNG TIỀN</th>
              <th>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id} onClick={() => handleViewDetails(order)} className="clickable-row">
                <td className="id-col">#{order.order_id}</td>
                <td>
                  <div className="cust-name">{order.fullname || "Khách vãng lai"}</div>
                  <small>{order.phone || "---"}</small>
                </td>
                <td>
                  <span className={`type-tag ${order.order_type === "Online" ? "online" : "local"}`}>
                    {order.order_type}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="amount-col">{Number(order.total_amount).toLocaleString("vi-VN")}đ</td>
                <td>
                  <span className={`status-pill ${order.status === "Đã hoàn thành" ? "done" : "other"}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="sakura-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết đơn hàng #{selectedOrder.order_id}</h3>
              <button className="close-x" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="order-summary-box">
                <div className="info-item">
                  <strong>Người nhận:</strong> <span>{selectedOrder.fullname}</span>
                </div>
                <div className="info-item">
                  <strong>Số điện thoại:</strong> <span>{selectedOrder.phone}</span>
                </div>
                <div className="info-item highlight-address">
                  <strong>📍 Địa chỉ:</strong> <span>{selectedOrder.address || "Nhận tại cửa hàng"}</span>
                </div>
                <div className="info-item">
                  <strong>Ghi chú:</strong> <span>{selectedOrder.note || "---"}</span>
                </div>
              </div>

              <table className="mini-product-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>SL</th>
                    <th className="txt-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product_name}</td>
                      <td>x{item.quantity}</td>
                      <td className="txt-right">{(item.quantity * item.price).toLocaleString("vi-VN")}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}