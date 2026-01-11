import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Css/Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart] = useState(JSON.parse(localStorage.getItem("sakura_cart")) || []);
  
  // State quản lý thông tin khách hàng và ghi chú
  const [info, setInfo] = useState({
    name: "",
    phone: "",
    address: "",
    note: "" 
  });

  // State quản lý Box thông báo tự động
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const rawData = sessionStorage.getItem("user_session");
    if (rawData) {
      const userData = JSON.parse(rawData);
      setInfo({
        name: userData.full_name || "", 
        phone: userData.phone || "",
        address: userData.address || "",
        note: ""
      });
    }
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Hàm hiển thị Box thông báo và tự động ẩn
  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type: type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
      if (type === "success") navigate("/menu"); // Nếu thành công thì chuyển trang sau khi ẩn box
    }, 2500); 
  };

  const handleOrder = async () => {
    if (!info.name || !info.phone || !info.address) {
      showToast("🌸 Vui lòng nhập đủ thông tin giao hàng!", "error");
      return;
    }

    const userData = JSON.parse(sessionStorage.getItem("user_session"));
    
    const orderData = {
      user_id: userData?.user_id || null,
      total_amount: totalAmount,
      payment_method: "COD - Tiền mặt",
      note: info.note || "Khách đặt Online", // Gửi note vào database
      cartItems: cart 
    };

    try {
      const res = await fetch("http://localhost:3003/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.removeItem("sakura_cart");
        showToast("🎉 Đặt hàng thành công! Đang quay lại Menu...");
      } else {
        showToast("❌ Lỗi: " + data.error, "error");
      }
    } catch (error) {
      showToast("❌ Không thể kết nối đến máy chủ!", "error");
    }
  };

  return (
    <div className="checkout-wrapper">
      {/* BOX THÔNG BÁO TỰ ĐỘNG */}
      {toast.show && (
        <div className={`checkout-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="checkout-container">
        <h2 className="checkout-header">🌸 THÔNG TIN GIAO HÀNG</h2>

        <div className="checkout-form-body">
          <div className="form-input-section">
            <div className="checkout-group">
              <label>Người nhận</label>
              <input 
                type="text" className="checkout-input" 
                value={info.name}
                onChange={(e) => setInfo({...info, name: e.target.value})}
                placeholder="Tên khách hàng..."
              />
            </div>

            <div className="checkout-group">
              <label>Số điện thoại</label>
              <input 
                type="text" className="checkout-input" 
                value={info.phone}
                onChange={(e) => setInfo({...info, phone: e.target.value})}
                placeholder="Số điện thoại..."
              />
            </div>

            <div className="checkout-group">
              <label>Địa chỉ chi tiết</label>
              <textarea 
                className="checkout-input" rows="2"
                value={info.address}
                onChange={(e) => setInfo({...info, address: e.target.value})}
                placeholder="Số nhà, tên đường..."
              ></textarea>
            </div>

            <div className="checkout-group">
              <label>Ghi chú đơn hàng</label>
              <textarea 
                className="checkout-input note-input" rows="2"
                value={info.note}
                onChange={(e) => setInfo({...info, note: e.target.value})}
                placeholder="Ví dụ: Ít đường, giao trước 10h..."
              ></textarea>
            </div>
          </div>

          <div className="order-summary-box">
            <h4>Tóm tắt đơn hàng</h4>
            <div className="summary-list">
              {cart.map((item, idx) => (
                <div key={idx} className="summary-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString()}đ</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <span>TỔNG CỘNG:</span>
              <span className="total-price">{totalAmount.toLocaleString()}đ</span>
            </div>
            <p className="cod-badge">📍 Thanh toán tiền khi nhận hàng</p>
          </div>
        </div>

        <button className="btn-confirm-final" onClick={handleOrder}>
          XÁC NHẬN ĐẶT HÀNG
        </button>
      </div>
    </div>
  );
}