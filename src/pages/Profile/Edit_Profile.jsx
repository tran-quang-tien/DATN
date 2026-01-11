import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/Profile.css"; 
import { updateUserProfile, getUserById } from "../../api/Api"; 
import defaultAvatar from "../../components/Picture/avt.png"; 

export default function EditProfile() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(defaultAvatar); 
  const [loading, setLoading] = useState(true);
  
  // Khởi tạo giá trị mặc định là chuỗi rỗng để tránh lỗi "value is null"
  const [userData, setUserData] = useState({
    user_id: "",
    full_name: "",
    phone: "",
    address: "",
    avatar: "",
    email: ""
  });

  useEffect(() => {
    const loadData = async () => {
      const session = sessionStorage.getItem("user_session");
      if (!session) {
        navigate("/Login");
        return;
      }

      try {
        const u = JSON.parse(session);
        // Gọi API lấy dữ liệu mới nhất
        const data = await getUserById(u.user_id);
        
        if (data) {
          // Ghi đè dữ liệu, đảm bảo không có trường nào bị null
          setUserData({
            user_id: data.user_id || u.user_id,
            full_name: data.full_name || "",
            phone: data.phone || "",
            address: data.address || "",
            avatar: data.avatar || "",
            email: data.email || ""
          });

          if (data.avatar) {
            setPreview(`http://localhost:3003${data.avatar}`);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        // Nếu lỗi 500, vẫn cho phép ở lại trang nhưng dùng dữ liệu từ session cũ
        const u = JSON.parse(session);
        setUserData(prev => ({ ...prev, user_id: u.user_id, full_name: u.full_name }));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Đảm bảo value không bao giờ là null
    setUserData(prev => ({ ...prev, [name]: value || "" }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("full_name", userData.full_name);
      formData.append("phone", userData.phone);
      formData.append("address", userData.address);
      formData.append("email", userData.email);
      
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      const response = await updateUserProfile(userData.user_id, formData);
      if (response.success) {
        // Cập nhật lại session sau khi lưu thành công
        const newData = await getUserById(userData.user_id); 
        sessionStorage.setItem("user_session", JSON.stringify(newData));
        
        // Thông báo cho các component khác (như Navbar) cập nhật lại ảnh
        window.dispatchEvent(new Event("storage")); 
        
        alert("Cập nhật thành công!");
        navigate("/profile");
      }
    } catch (error) {
      console.error("Lỗi update:", error);
      alert("Lỗi cập nhật! Vui lòng kiểm tra lại server.");
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Đang kết nối server...</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2 style={{ color: "#e91e63", marginBottom: "20px", textAlign: "center" }}>
          CHỈNH SỬA HỒ SƠ
        </h2>
        
        <div className="profile-content" style={{ display: "flex", gap: "30px", flexWrap: 'wrap' }}>
          {/* CỘT BÊN TRÁI: FORM NHẬP LIỆU */}
          <div className="profile-form" style={{ flex: 2, minWidth: '300px' }}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input 
                name="full_name" 
                value={userData.full_name} 
                onChange={handleChange} 
                placeholder="Nhập họ tên..."
              />
            </div>
            
            <div className="form-group">
              <label>Số điện thoại</label>
              <input 
                name="phone" 
                value={userData.phone} 
                onChange={handleChange} 
                placeholder="Nhập số điện thoại..."
              />
            </div>
            
            <div className="form-group">
              <label>Địa chỉ</label>
              <textarea 
                name="address" 
                value={userData.address} 
                onChange={handleChange} 
                rows="3" 
                placeholder="Nhập địa chỉ..."
              />
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-update" onClick={handleSave} style={{marginTop: '20px', flex: 1}}>
                Lưu thay đổi
              </button>
              <button className="btn-cancel" onClick={() => navigate("/profile")} style={{marginTop: '20px', backgroundColor: '#ccc', border: 'none', borderRadius: '5px', padding: '10px 20px', cursor: 'pointer'}}>
                Hủy
              </button>
            </div>
          </div>

          {/* CỘT BÊN PHẢI: AVATAR */}
          <div className="profile-avatar-section" style={{ flex: 1, textAlign: "center", borderLeft: "1px solid #eee", paddingLeft: "20px" }}>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>Ảnh đại diện</p>
            <img 
              src={preview} 
              alt="Avatar Preview" 
              style={{ width: "180px", height: "180px", borderRadius: "50%", objectFit: "cover", border: "4px solid #fce4ec", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
              onError={(e) => { e.target.src = defaultAvatar; }}
            />
            <input type="file" id="upload-avt" hidden accept="image/*" onChange={handleAvatarChange} />
            <label htmlFor="upload-avt" style={{ display: "inline-block", marginTop: "15px", cursor: "pointer", color: '#e91e63', fontWeight: "bold", padding: "8px 15px", border: "1px solid #e91e63", borderRadius: "20px" }}>
              Chọn ảnh mới
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}