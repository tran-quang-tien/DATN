import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/EditProfile.css"; 
import { getUserById, updateUserProfile } from "../../api/Api";
import defaultAvatar from "../../components/Picture/avt.png";

export default function Edit_Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    email: ""
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(defaultAvatar);

  useEffect(() => {
    const loadCurrentData = async () => {
      const sessionRaw = sessionStorage.getItem("user_session");
      if (!sessionRaw) return navigate("/login");

      try {
        const u = JSON.parse(sessionRaw);
        // Ưu tiên lấy .id theo đúng hình ảnh tab Application của ông
        const userId = u.id || u.user_id; 
        
        const data = await getUserById(userId);
        
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          email: data.email || ""
        });

        if (data.avatar) {
          setPreviewUrl(`http://localhost:3003${data.avatar}`);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCurrentData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sessionRaw = sessionStorage.getItem("user_session");
    if (!sessionRaw) return;
    
    const session = JSON.parse(sessionRaw);
    const userId = session.id || session.user_id;

    try {
      const data = new FormData();
      data.append("full_name", formData.full_name);
      data.append("phone", formData.phone);
      data.append("address", formData.address);
      if (selectedFile) {
        data.append("avatar", selectedFile);
      }

      const result = await updateUserProfile(userId, data);
      
      if (result.success) {
        // === FIX LỖI ĐỒNG BỘ: Ghi đè đúng cấu trúc Header cần ===
        const updatedSession = {
          ...session,
          name: formData.full_name, // Phải dùng key 'name' để Header đọc được
          avatar: result.avatarPath || session.avatar 
        };
        
        sessionStorage.setItem("user_session", JSON.stringify(updatedSession));

        // Phát sự kiện để Header nhận diện thay đổi ngay lập tức
        window.dispatchEvent(new Event("storage"));

        alert("🎉 Cập nhật hồ sơ thành công!");
        navigate("/profile"); 
      }
    } catch (error) {
      alert("❌ Lỗi: " + error.message);
    }
  };

  if (loading) return <div className="loading">🌸 Đang tải...</div>;

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        <form onSubmit={handleSubmit}>
          <h2>CHỈNH SỬA HỒ SƠ</h2>

          <div className="edit-avatar-section">
            <div className="preview-container">
              <img src={previewUrl} alt="Preview" onError={(e) => e.target.src = defaultAvatar} />
              <label htmlFor="file-input" className="change-avt-btn">Sửa ảnh</label>
              <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} hidden />
            </div>
          </div>

          <div className="edit-fields">
            <div className="input-group">
              <label>Họ và tên</label>
              <input 
                type="text" 
                name="full_name" 
                value={formData.full_name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Email (Tài khoản)</label>
              <input type="text" value={formData.email} disabled className="input-disabled" />
            </div>

            <div className="input-group">
              <label>Số điện thoại</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
              />
            </div>

            <div className="input-group">
              <label>Địa chỉ</label>
              <input 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="edit-buttons">
            <button type="button" className="btn-cancel" onClick={() => navigate("/profile")}>Hủy</button>
            <button type="submit" className="btn-save">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
}