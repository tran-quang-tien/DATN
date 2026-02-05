import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Css/Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart] = useState(JSON.parse(localStorage.getItem("sakura_cart")) || []);
  
  const [info, setInfo] = useState({
    name: "",
    phone: "",
    address: "",
    note: "" 
  });

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const rawData = sessionStorage.getItem("user_session");
    if (rawData) {
      const userData = JSON.parse(rawData);
      // Tự động điền thông tin mặc định để khách dễ chỉnh sửa
      setInfo(prev => ({
        ...prev,
        name: userData.name || "", 
        phone: userData.phone || "", 
        address: userData.address || "" 
      }));
    }
    if (cart.length === 0) navigate("/menu");
  }, [navigate, cart.length]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type: type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
      if (type === "success") navigate("/menu"); 
    }, 2500); 
  };

  const handleOrder = async () => {
    if (!info.name || !info.phone || !info.address) {
      showToast("🌸 Vui lòng nhập đủ thông tin giao hàng!", "error");
      return;
    }

    const userData = JSON.parse(sessionStorage.getItem("user_session"));

    const orderData = {
      user_id: userData?.id || null, 
      customer_name: info.name,
      customer_phone: info.phone,
      shipping_address: info.address,
      total_amount: totalAmount,
      payment_method: "COD - Tiền mặt",
      note: info.note || "Khách đặt Online",
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
        // Đã xóa phần cập nhật sessionStorage để không ghi đè địa chỉ gốc của khách
        localStorage.removeItem("sakura_cart");
        showToast("🎉 Đặt hàng thành công! Đang quay lại Menu...");
      } else {
        showToast("❌ Lỗi: " + (data.error || "Không thể đặt hàng"), "error");
      }
    } catch (error) {
      showToast("❌ Lỗi kết nối server!", "error");
    }
  };

  return (
    <div className="checkout-wrapper">
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
                placeholder="Nhập tên người nhận (có thể khác chủ tài khoản)..."
              />
            </div>

            <div className="checkout-group">
              <label>Số điện thoại nhận hàng</label>
              <input 
                type="text" className="checkout-input" 
                value={info.phone}
                onChange={(e) => setInfo({...info, phone: e.target.value})}
                placeholder="Nhập SĐT người nhận..."
              />
            </div>

            <div className="checkout-group">
              <label>Địa chỉ giao hàng</label>
              <textarea 
                className="checkout-input" rows="2"
                value={info.address}
                onChange={(e) => setInfo({...info, address: e.target.value})}
                placeholder="Địa chỉ giao hàng cho đơn này..."
              ></textarea>
            </div>

            <div className="checkout-group">
              <label>Ghi chú</label>
              <textarea 
                className="checkout-input note-input" rows="2"
                value={info.note}
                onChange={(e) => setInfo({...info, note: e.target.value})}
                placeholder="Ví dụ: Giao cho bảo vệ, Ít đá..."
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
          </div>
        </div>

        <button className="btn-confirm-final" onClick={handleOrder}>
          XÁC NHẬN ĐẶT HÀNG
        </button>
      </div>
    </div>
  );
}