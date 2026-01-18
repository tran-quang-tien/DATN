import React, { useState, useEffect } from "react";
import { NavLink  } from "react-router-dom";
import "./Css/ProductManagement.css"; 
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
      if (!res.ok) throw new Error("Lỗi tải đơn hàng");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      setOrders([]);
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetails([]);
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${order.order_id}/details`);
      if (!res.ok) throw new Error("Lỗi tải chi tiết");
      const data = await res.json();
      setOrderDetails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi fetch chi tiết:", error);
    }
  };

  // Tính tổng tiền tất cả đơn hiển thị
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return (
    <div className="sakura-admin-layout">
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
            <h1>Lịch sử đơn hàng</h1>
            <p>Bấm vào dòng để xem chi tiết món ăn</p>
          </div>
          <div className="header-right">
            <h3 style={{ color: "#e91e63", fontSize: "24px" }}>
              Tổng: {totalRevenue.toLocaleString("vi-VN")}đ
            </h3>
          </div>
        </header>

        <div className="filter-container-sakura">
          <div className="filter-tabs">
            {["All", "Online", "Trực tiếp"].map((t) => (
              <button
                key={t}
                className={filterType === t ? "tab-active" : ""}
                onClick={() => setFilterType(t)}
              >
                {t === "All" ? "Tất cả" : t === "Online" ? "Online" : "Tại chỗ"}
              </button>
            ))}
          </div>

          <div className="filter-dates">
            <label>Từ: </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label> Đến: </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="category-group-card">
          <table className="modern-table">
            <thead>
              <tr>
                <th>MÃ</th>
                <th>KHÁCH HÀNG</th>
                <th>LOẠI</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order.order_id}
                    onClick={() => handleViewDetails(order)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>#{order.order_id}</td>
                    <td>{order.full_name || "Khách vãng lai"}</td>
                    <td>
                      <span
                        className={`badge ${order.order_type === "Online" ? "bg-online" : "bg-local"}`}
                      >
                        {order.order_type}
                      </span>
                    </td>
                    <td>{Number(order.total_amount).toLocaleString("vi-VN")}đ</td>
                    <td>
                      <span
                        className={`status-pill ${order.status === "Đã hoàn thành" ? "completed" : "pending"}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    Không có dữ liệu đơn hàng...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal chi tiết đơn */}
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Chi tiết đơn #{selectedOrder.order_id}</h2>
                <button onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
              <div style={{ padding: "20px" }}>
                <div
                  className="customer-info-section"
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    background: "#f9f9f9",
                    borderRadius: "8px",
                  }}
                >
                  <h4 style={{ color: "#e91e63", marginBottom: "10px" }}>
                    Thông tin đơn hàng
                  </h4>
                  <p>
                    <strong>Khách hàng:</strong>{" "}
                    {orderDetails[0]?.full_name || "Khách vãng lai"}
                  </p>
                  <p>
                    <strong>Số điện thoại:</strong>{" "}
                    {orderDetails[0]?.phone || "N/A"}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong>{" "}
                    {orderDetails[0]?.address || "Tại cửa hàng"}
                  </p>
                  <p>
                    <strong>Ghi chú:</strong> {selectedOrder.note || "Không có"}
                  </p>
                </div>

                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Món ăn</th>
                      <th>SL</th>
                      <th style={{ textAlign: "right" }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.length > 0 ? (
                      orderDetails.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td style={{ textAlign: "right" }}>
                            {(item.quantity * item.price).toLocaleString("vi-VN")}đ
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center" }}>
                          Không có chi tiết món...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}