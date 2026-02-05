import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/Profile.css"; 
import { getUserById } from "../../api/Api"; 
import defaultAvatar from "../../components/Picture/avt.png";

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const session = sessionStorage.getItem("user_session");
      if (!session) return navigate("/login");
      
      try {
        const u = JSON.parse(session);
        const rawId = u.id || u.user_id; 

        if (!rawId) {
          console.error("Không tìm thấy ID người dùng trong Session!");
          setLoading(false);
          return;
        }

        // Làm sạch ID nếu có ký tự lạ (như dấu : từ các bản vá trước)
        const cleanId = String(rawId).split(':')[0].trim();

        // 2. Gọi API lấy dữ liệu chi tiết từ Database
        const data = await getUserById(cleanId);
        setCurrentUser(data);
      } catch (error) {
        console.error("Lỗi tải thông tin hồ sơ:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="profile-loading-container">
        <div className="sakura-spinner"></div>
        <p>🌸 Đang tải hồ sơ của bạn...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="profile-error-container">
        <p>❌ Không thể kết nối với dữ liệu người dùng.</p>
        <button onClick={() => navigate("/login")}>Quay lại Đăng nhập</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-glass-card">
        {/* Tiêu đề và nút chỉnh sửa */}
        <div className="profile-header-banner">
          <h2>HỒ SƠ CỦA TÔI</h2>
          <button className="edit-profile-btn" onClick={() => navigate('/profile/edit')}>
            ⚙️ Chỉnh sửa thông tin
          </button>
        </div>

        <div className="profile-main-content">
          {/* Cột trái: Ảnh đại diện */}
          <div className="avatar-column">
            <div className="image-circle">
              <img 
                src={currentUser.avatar ? `http://localhost:3003${currentUser.avatar}` : defaultAvatar} 
                alt="avatar" 
                onError={(e) => { e.target.src = defaultAvatar; }} 
              />
            </div>
            <p className="member-status">Thành viên Sakura Café</p>
          </div>

          {/* Cột phải: Thông tin chi tiết */}
          <div className="info-column">
            <div className="info-row">
              <label>Họ và tên</label>
              {/* Dùng full_name theo đúng cột trong DB ở hình image_a8e229.png */}
              <div className="data-box">{currentUser.full_name || "Chưa cập nhật"}</div>
            </div>

            <div className="info-row">
              <label>Địa chỉ Email</label>
              <div className="data-box">{currentUser.email || "Chưa có email"}</div>
            </div>

            <div className="info-row">
              <label>Số điện thoại</label>
              <div className="data-box">{currentUser.phone || "Chưa cập nhật"}</div>
            </div>

            <div className="info-row">
              <label>Địa chỉ nhà</label>
              <div className="data-box">{currentUser.address || "Chưa cập nhật"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}