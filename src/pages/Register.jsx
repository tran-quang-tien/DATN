import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Register.css"; // Đã đổi sang file CSS mới
import { registerUser } from "../api/Api"; 

function Register() {
  const [formData, setFormData] = useState({
    full_name: "", email: "", phone: "", address: "", password: "", confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      // Gửi dữ liệu đầy đủ bao gồm cả address
      const response = await registerUser({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address, 
        role_id: 3 
      });

      if (response.success) {
        navigate("/verify-email", { state: { email: formData.email } });
      }
    } catch (error) {
      setErrorMsg(error.message || "Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2>Tạo tài khoản mới 🌸</h2>
        
        {errorMsg && (
          <div style={{ background: '#ffeaea', color: '#d63031', padding: '12px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fab1a0', textAlign: 'center', fontSize: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group full-column">
              <label>Họ và tên</label>
              <input type="text" placeholder="Nhập họ tên đầy đủ" onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="example@gmail.com" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Số điện thoại</label>
              <input type="text" placeholder="09xxxxxxx" onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>

            <div className="input-group full-column">
              <label>Địa chỉ</label>
              <input type="text" placeholder="Nhập địa chỉ nhà..." onChange={(e) => setFormData({...formData, address: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Mật khẩu</label>
              <input type={showPass ? "text" : "password"} placeholder="••••••••" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              <span className="toggle-password" onClick={() => setShowPass(!showPass)}>
                {showPass ? "👁️" : "🙈"}
              </span>
            </div>

            <div className="input-group">
              <label>Xác nhận lại</label>
              <input type={showPass ? "text" : "password"} placeholder="••••••••" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
            </div>
          </div>

          <button type="submit" className="btn-register-submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng ký ngay"}
          </button>
        </form>
        
        <p style={{ textAlign: "center", marginTop: "20px", color: "#636e72", fontSize: "14px" }}>
          Đã có tài khoản? <span onClick={() => navigate("/Login")} style={{ color: "#ff7675", cursor: "pointer", fontWeight: "bold" }}>Đăng nhập ngay</span>
        </p>
      </div>
    </div>
  );
}

export default Register;