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
        // Làm sạch ID để tránh lỗi 404 (1:1)
        const cleanId = String(u.user_id).replace(/:/g, "");
        const data = await getUserById(cleanId);
        setCurrentUser(data);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  if (loading) return <div className="loading-sakura">🌸 Đang tải hồ sơ...</div>;
  if (!currentUser) return <div className="error-sakura">Không tìm thấy thông tin người dùng.</div>;

  return (
    <div className="profile-container">
      <div className="profile-glass-card">
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

          {/* Cột phải: Thông tin chi tiết (Đã loại bỏ role_id và is_verified) */}
          <div className="info-column">
            <div className="info-row">
              <label>Họ và tên</label>
              <div className="data-box">{currentUser.full_name || "Chưa cập nhật"}</div>
            </div>

            <div className="info-row">
              <label>Địa chỉ Email</label>
              <div className="data-box">{currentUser.email}</div>
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