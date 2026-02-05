import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Css/Booking.css";
import { createBooking } from "../api/Api"; 

export default function Booking() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Trạng thái thông báo (Toast)
  const [notification, setNotification] = useState({ 
    show: false, 
    message: "", 
    type: "" 
  });

  // State lưu trữ dữ liệu form - Giữ nguyên các trường của bạn
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

  // Hàm hiển thị Toast thông báo
  const showToast = (msg, type = "success") => {
    setNotification({ show: true, message: msg, type: type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Lấy thông tin user từ session khi trang web load
  useEffect(() => {
    const session = sessionStorage.getItem("user_session");
    if (session) {
      const userData = JSON.parse(session);
      setUser(userData);
      // Tự động điền thông tin thành viên vào form
      setFormData(prev => ({
        ...prev,
        customer_name: userData.full_name || userData.name || "",
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
        // Gửi toàn bộ formData kèm theo user_id lấy từ session
        const response = await createBooking({ 
            ...formData, 
            user_id: user.id 
        });
        
        if (response.success) {
            showToast("🌸 Đặt bàn thành công! Chúng tôi sẽ sớm liên hệ xác nhận.", "success");
            
            // Reset các trường không cố định sau khi đặt thành công
            setFormData(prev => ({
                ...prev,
                booking_date: "",
                booking_time: "",
                number_of_people: 1,
                note: ""
            }));
        } else {
            showToast(response.message || "Có lỗi xảy ra!", "error");
        }
    } catch (error) {
        showToast("Lỗi kết nối máy chủ, vui lòng thử lại sau!", "error");
    } finally {
        setLoading(false);
    }
  };

  // Nếu chưa đăng nhập, hiển thị thông báo yêu cầu
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
      {/* Toast Notification */}
      {notification.show && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === "success" ? "✅ " : "❌ "}
          {notification.message}
        </div>
      )}

      <div className="booking-container">
        <div className="booking-header">
          <h1>Thông Tin Đặt Bàn Online</h1>
          <p>Vui lòng đặt bàn trước giờ dùng bữa ít nhất 1 giờ để chúng tôi phục vụ tốt nhất</p>
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
                placeholder="Nhập họ và tên của bạn"
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
                placeholder="Số điện thoại liên lạc"
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
                  placeholder="Email để nhận thông tin xác nhận"
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
                max="20"
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
              onChange={handleChange}
              placeholder="Ví dụ: Bàn gần cửa sổ, kỷ niệm ngày cưới, có trẻ em..." 
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