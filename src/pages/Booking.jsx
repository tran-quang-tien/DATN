import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Css/Booking.css";
import { createBooking } from "../api/Api"; 

export default function Booking() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Trạng thái thông báo (Box tự biến mất)
  const [notification, setNotification] = useState({ 
    show: false, 
    message: "", 
    type: "" 
  });

  const [formData, setFormData] = useState({
    customer_name: "",
    email: "", 
    phone: "",
    booking_date: "",
    booking_time: "",
    number_of_people: 1,
    note: "",
    status: "Chờ xác nhận"
  });

  // Hàm điều khiển Toast
  const showToast = (msg, type = "success") => {
    setNotification({ show: true, message: msg, type: type });
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Kiểm tra session và tự động điền thông tin user
  useEffect(() => {
    const session = sessionStorage.getItem("user_session");
    if (session) {
      const userData = JSON.parse(session);
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        customer_name: userData.full_name || "",
        phone: userData.phone || "",
        email: userData.email || "" 
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showToast("Vui lòng đăng nhập để đặt bàn!", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await createBooking(formData);
      
      if (response.success) {
        showToast("🌸 Đặt bàn thành công! Email xác nhận đã được gửi.", "success");
        // Reset form sau khi thành công
        setFormData(prev => ({
          ...prev,
          booking_date: "",
          booking_time: "",
          number_of_people: 1,
          note: ""
        }));
      } else {
        showToast(response.message || "Không thể đặt bàn lúc này", "error");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      showToast("Lỗi kết nối máy chủ. Vui lòng thử lại.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="booking-auth-notice">
        <div className="notice-box">
          <h2>🌸 Sakura Café</h2>
          <p>Vui lòng đăng nhập để thực hiện đặt bàn và hưởng ưu đãi thành viên.</p>
          <button onClick={() => navigate("/Login")} className="btn-login-now">
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      {/* Box thông báo hiện lên rồi tự ẩn */}
      {notification.show && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === "success" ? "✅ " : "❌ "}
          {notification.message}
        </div>
      )}

      <div className="booking-container">
        <div className="booking-header">
          <h1>Thông Tin Đặt Bàn Online</h1>
          <p>Vui lòng đặt bàn trước giờ dùng bữa ít nhất 1 giờ</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-row">
            <div className="form-group">
              <label>HỌ TÊN KHÁCH HÀNG (*)</label>
              <input 
                type="text" 
                name="customer_name" 
                value={formData.customer_name} 
                onChange={handleChange}
                placeholder="Nhập họ tên"
                required 
              />
            </div>
            <div className="form-group">
              <label>SỐ ĐIỆN THOẠI (*)</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
                required 
              />
            </div>
          </div>

          <div className="form-row">
             <div className="form-group full-width">
                <label>EMAIL NHẬN THÔNG BÁO (*)</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="Email để nhận thông báo xác nhận/hủy bàn"
                  required 
                />
              </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>NGÀY ĐẶT (*)</label>
              <input 
                type="date" 
                name="booking_date" 
                value={formData.booking_date}
                required 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label>GIỜ ĐẶT (*)</label>
              <input 
                type="time" 
                name="booking_time" 
                value={formData.booking_time}
                required 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label>SỐ NGƯỜI (*)</label>
              <input 
                type="number" 
                name="number_of_people" 
                min="1" 
                value={formData.number_of_people} 
                onChange={handleChange} 
                required
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>GHI CHÚ / YÊU CẦU ĐẶC BIỆT</label>
            <textarea 
              name="note" 
              rows="4" 
              value={formData.note}
              placeholder="Ví dụ: Bàn gần cửa sổ, tổ chức sinh nhật..." 
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-footer">
            <button 
              type="submit" 
              className="btn-booking-submit" 
              disabled={loading}
            >
              {loading ? "ĐANG XỬ LÝ..." : "ĐẶT BÀN NGAY"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}