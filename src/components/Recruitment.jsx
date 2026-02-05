import React, { useState, useEffect } from "react";
import axios from 'axios';
import "./css/Recruitment.css";
import { FaCrown, FaCheck, FaStar, FaBolt } from "react-icons/fa";

export default function Recruitment() {
  const [showToast, setShowToast] = useState(false);

  // 1. Khởi tạo State Form
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    position: "Phục vụ",
    shift: "Ca sáng (7h - 12h)",
    experience: "",
    note: ""
  });

  // 2. Tự động lấy Session khi load trang (Sửa lỗi lấy tên)
  useEffect(() => {
    const savedUser = sessionStorage.getItem("user_session");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Kiểm tra cả 2 trường hợp name hoặc full_name để không bị undefined
      const userName = userData.name || userData.full_name || "";
      const userPhone = userData.phone || "";
      
      setFormData((prev) => ({
        ...prev,
        name: userName,
        phone: userPhone
      }));
    }
  }, []);

  // 3. Xử lý gửi Form (Sửa lỗi undefined khi gửi đi)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra nhanh để chắc chắn có tên trước khi gửi
    if (!formData.name) {
      alert("Vui lòng nhập họ tên của bạn!");
      return;
    }

    try {
        // Gửi dữ liệu formData hiện tại sang Backend
        const response = await axios.post('http://localhost:3003/api/send-recruitment', formData);

        if (response.data.success) {
            // Hiện Toast thành công 2s
            setShowToast(true);

            // Reset form nhưng vẫn giữ lại Tên và SĐT để người dùng không phải nhập lại nếu muốn gửi đơn khác
            setFormData((prev) => ({
                ...prev,
                experience: "",
                note: ""
            }));
        }
    } catch (error) {
        console.error("Lỗi khi gửi đơn:", error);
        alert("Không thể gửi đơn lúc này. Bạn hãy kiểm tra xem Backend đã bật chưa nhé!");
    }
  };

  // 4. Tự động ẩn Toast sau 2 giây
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="recruit-page">
      {/* Thông báo Toast hiện 2s */}
      {showToast && (
        <div className="toast-success">
          <FaCheck /> Đã gửi đơn ứng tuyển thành công!
        </div>
      )}

      {/* HERO SECTION */}
      <section className="recruit-hero">
        <div className="hero-overlay">
          <span className="brand-tag">#SakuraNextGen</span>
          <h1>
            SAKURA CAFÉ TUYỂN DỤNG <br />
            <span className="highlight-text">LỚN NHẤT NĂM 2026</span>
          </h1>
          <p>Tìm kiếm những gương mặt Gen Z năng động gia nhập đội ngũ Sakura!</p>
          <div className="time-tag">Hạn đăng ký: 13/06 - 30/06</div>
        </div>
      </section>

      <div className="recruit-body">
        {/* THÔNG TIN VỊ TRÍ */}
        <div className="job-info-grid">
          <div className="job-card">
            <h3><FaBolt className="icon-pink" /> CÁC VỊ TRÍ HOT</h3>
            <ul>
              <li><strong>Phục vụ:</strong> Tươi tắn, nhanh nhẹn, yêu khách hàng.</li>
              <li><strong>Pha chế:</strong> Có đam mê với Coffee & Trà (Được đào tạo).</li>
              <li><strong>Social Media:</strong> Sáng tạo nội dung Tiktok/Facebook cho quán.</li>
            </ul>
          </div>
          <div className="job-card">
            <h3><FaStar className="icon-gold" /> QUYỀN LỢI</h3>
            <ul>
              <li>Môi trường làm việc Gen Z cực kỳ thoải mái.</li>
              <li>Lương thưởng xứng đáng theo năng lực.</li>
              <li>Được uống Café "free" mỗi ngày làm việc.</li>
            </ul>
          </div>
        </div>

        {/* QUY TRÌNH TUYỂN DỤNG */}
        <section className="process-section">
          <h3 className="section-title-center">QUY TRÌNH TUYỂN DỤNG</h3>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-num">01</div>
              <h4>CV ONLINE</h4>
              <p>Điền form bên dưới</p>
            </div>
            <div className="step-item">
              <div className="step-num">02</div>
              <h4>PHỎNG VẤN</h4>
              <p>Gặp gỡ tại quán</p>
            </div>
            <div className="step-item">
              <div className="step-num">03</div>
              <h4>THỬ VIỆC</h4>
              <p>Nhận việc ngay</p>
            </div>
          </div>
        </section>

        {/* FORM ĐĂNG KÝ */}
        <section className="form-section">
          <div className="form-container">
            <h3>ĐƠN ỨNG TUYỂN ONLINE ☕🌸</h3>
            
            {sessionStorage.getItem("user_session") && (
              <p className="session-hint">✨ Đã tự động điền thông tin từ tài khoản của bạn.</p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="input-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nhập họ tên"
                    value={formData.name || ""}
                    required
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="Số điện thoại liên hệ"
                    value={formData.phone || ""}
                    required
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="row">
                <div className="input-group">
                  <label>Vị trí ứng tuyển</label>
                  <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}>
                    <option>Phục vụ</option>
                    <option>Pha chế</option>
                    <option>Thu ngân</option>
                    <option>Social Media Manager</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Ca làm việc mong muốn</label>
                  <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })}>
                    <option>Ca sáng (7h - 12h)</option>
                    <option>Ca chiều (12h - 17h)</option>
                    <option>Ca tối (17h - 22h)</option>
                    <option>Ca xoay (Linh hoạt)</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Kinh nghiệm làm việc</label>
                <input
                  type="text"
                  placeholder="Kinh nghiệm của bạn..."
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Lời nhắn / Giới thiệu thêm</label>
                <textarea
                  rows="3"
                  placeholder="Giới thiệu bản thân hoặc tài lẻ..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                ></textarea>
              </div>

              <button type="submit" className="btn-send">
                GỬI HỒ SƠ NGAY <FaCrown />
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}