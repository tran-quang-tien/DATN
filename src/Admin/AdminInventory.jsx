import React, { useState, useEffect } from "react";

export default function AdminInventory() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const API_BASE = "http://localhost:3003";

  // Lấy danh sách phiếu nhập kho
  useEffect(() => {
    fetch(`${API_BASE}/api/purchase-orders`)
      .then(res => res.json())
      .then(data => setPurchaseOrders(data))
      .catch(err => console.error("Lỗi tải phiếu nhập kho:", err));
  }, []);

  // Xem chi tiết phiếu nhập
  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/${order.order_id}/details`);
      if (!res.ok) throw new Error("Lỗi tải chi tiết");
      const data = await res.json();
      setOrderDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Thêm phiếu nhập mới (ví dụ)
  const handleAddNew = () => {
    // Bạn có thể mở modal hoặc form để nhập dữ liệu mới
  };

  return (
    <div className="inventory-container">
      <h1>Quản lý nhập kho</h1>
      <button onClick={handleAddNew}>Thêm phiếu nhập mới</button>

      <table className="modern-table">
        <thead>
          <tr>
            <th>Mã phiếu</th>
            <th>Nhà cung cấp</th>
            <th>Tổng tiền</th>
            <th>Ngày tạo</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {purchaseOrders.length > 0 ? (
            purchaseOrders.map((order) => (
              <tr key={order.order_id} onClick={() => handleViewDetails(order)} style={{ cursor: "pointer" }}>
                <td>#{order.order_id}</td>
                <td>{order.supplier}</td>
                <td>{Number(order.total_amount).toLocaleString("vi-VN")}đ</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>{order.status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center" }}>Không có dữ liệu</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Xem chi tiết phiếu nhập */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h2>Chi tiết phiếu #{selectedOrder.order_id}</h2>
            <button onClick={() => setSelectedOrder(null)}>Đóng</button>
            <h3>Thông tin nhà cung cấp: {selectedOrder.supplier}</h3>
            <h4>Danh sách nguyên liệu:</h4>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nguyên liệu</th>
                  <th>Số lượng</th>
                  <th>Giá nhập</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.map((item, index) => (
                  <tr key={index}>
                    <td>{item.ingredient_name}</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.import_price).toLocaleString("vi-VN")}đ</td>
                    <td>{(item.quantity * item.import_price).toLocaleString("vi-VN")}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p><strong>Ngày tạo:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            <p><strong>Trạng thái:</strong> {selectedOrder.status}</p>
          </div>
        </div>
      )}
    </div>
  );
}