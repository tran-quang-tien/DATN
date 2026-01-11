import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { uploadAvatarApi } from "../api/Api";
import "./css/UploadAvatar.css"; 

export default function UploadAvatar() {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(defaultAvatar);
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const userData = location.state?.user; 

  useEffect(() => {
    if (!userData) navigate("/register");
  }, [userData, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFinish = async (isSkip = false) => {
    setLoading(true);
    try {
      let finalAvatar = userData.avatar; // Lấy avatar hiện tại (đang là NULL)

      // 1. Gửi ảnh lên server nếu có chọn file
      if (!isSkip && selectedFile && userData?.user_id) {
        const formData = new FormData();
        formData.append("avatar", selectedFile);
        const res = await uploadAvatarApi(userData.user_id, formData);
        
        if (res.success) {
          finalAvatar = res.avatar; // Lấy đường dẫn thật (ví dụ: /images/123.jpg)
        }
      }

      // 2. CẬP NHẬT SESSION ĐỂ HEADER HIỂN THỊ ĐÚNG
      const sessionData = { 
        ...userData, 
        avatar: finalAvatar 
      };
      sessionStorage.setItem("user_session", JSON.stringify(sessionData));
      
      // Kích hoạt event cập nhật Navbar ngay lập tức
      window.dispatchEvent(new Event("storage"));

      // 3. Chuyển trang
      if (userData.role_id === 1 || userData.role_id === "1") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/Home";
      }

    } catch (error) {
      alert("Lỗi: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="upload-avatar-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#fdf2f5" }}>
      <div className="upload-avatar-box" style={{ background: "#fff", padding: "40px", borderRadius: "20px", textAlign: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
        <h2 style={{ color: "#d81b60" }}>🌸 Cập nhật ảnh đại diện</h2>
        <p>Chào <strong>{userData?.full_name}</strong>!</p>
        
        <div style={{ margin: "20px auto", width: "160px", height: "160px", borderRadius: "50%", border: "4px solid #ffc1e3", overflow: "hidden" }}>
          <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: "20px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={() => handleFinish(false)} disabled={loading} style={{ padding: "12px", background: "#ff7675", color: "#fff", border: "none", borderRadius: "25px", cursor: "pointer" }}>
            {loading ? "Đang xử lý..." : "Hoàn tất & Vào Home"}
          </button>
          <button onClick={() => handleFinish(true)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>
            Bỏ qua bước này
          </button>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#d81b60", fontSize: "12px", cursor: "pointer" }}>
            Quay lại (Hủy đăng ký)
          </button>
        </div>
      </div>
    </div>
  );
}