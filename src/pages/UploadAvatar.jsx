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
  // Lấy userData từ VerifyOTP truyền sang
  const userData = location.state?.user; 

  useEffect(() => {
    if (!userData) {
      console.log("Không tìm thấy thông tin user, quay lại trang đăng ký.");
      navigate("/register");
    }
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
      let finalAvatar = userData.avatar || null; 

      // 1. Gửi ảnh lên server nếu người dùng chọn file và không nhấn Bỏ qua
      if (!isSkip && selectedFile && userData?.user_id) {
        const formData = new FormData();
        formData.append("avatar", selectedFile);
        const res = await uploadAvatarApi(userData.user_id, formData);
        
        if (res.success) {
          finalAvatar = res.avatar; 
        }
      }

      // 2. CẬP NHẬT SESSION STORAGE
      // Chuyển role_id về chuỗi để kiểm tra chính xác
      const userRole = String(userData.role_id);

      const sessionData = { 
        ...userData, 
        role_id: userData.role_id, // Giữ nguyên giá trị gốc từ DB (là 3)
        avatar: finalAvatar 
      };

      // Lưu vào session để các trang khác (Navbar) dùng luôn
      sessionStorage.setItem("user_session", JSON.stringify(sessionData));
      
      // Kích hoạt event để Navbar cập nhật ảnh đại diện mới ngay lập tức
      window.dispatchEvent(new Event("storage"));

      // 3. ĐIỀU HƯỚNG DỰA TRÊN ROLE_ID THẬT
      console.log("Đang điều hướng cho Role:", userRole);
      
      if (userRole === "1") {
        // Chỉ duy nhất Role 1 mới vào Admin
        window.location.href = "/admin";
      } else {
        // Role 3 (Khách hàng) hoặc các role khác sẽ vào Home
        window.location.href = "/Home";
      }

    } catch (error) {
      console.error("Lỗi hoàn tất đăng ký:", error);
      alert("Lỗi: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="upload-avatar-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#fdf2f5" }}>
      <div className="upload-avatar-box" style={{ background: "#fff", padding: "40px", borderRadius: "20px", textAlign: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ color: "#d81b60", marginBottom: "10px" }}>🌸 Cập nhật ảnh đại diện</h2>
        <p style={{ marginBottom: "20px" }}>Chào mừng <strong>{userData?.full_name}</strong> gia nhập Sakura Cafe!</p>
        
        <div style={{ margin: "20px auto", width: "160px", height: "160px", borderRadius: "50%", border: "4px solid #ffc1e3", overflow: "hidden", background: "#eee" }}>
          <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label htmlFor="file-upload" style={{ display: "inline-block", padding: "8px 15px", background: "#f0f0f0", borderRadius: "5px", cursor: "pointer", fontSize: "14px" }}>
            Chọn ảnh từ máy tính
          </label>
          <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button 
            onClick={() => handleFinish(false)} 
            disabled={loading} 
            style={{ padding: "14px", background: "#ff7675", color: "#fff", border: "none", borderRadius: "25px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}
          >
            {loading ? "Đang lưu thông tin..." : "HOÀN TẤT & VÀO CỬA HÀNG"}
          </button>

          <button 
            onClick={() => handleFinish(true)} 
            disabled={loading}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", textDecoration: "underline" }}
          >
            Bỏ qua bước này
          </button>
        </div>
      </div>
    </div>
  );
}