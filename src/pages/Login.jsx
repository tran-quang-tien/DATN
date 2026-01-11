import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Css/Login.css";
import loginBg from "./picture/Login.png";
import { loginUser } from "../api/Api"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  setErrorMsg("");

  try {
    const response = await loginUser({ email, password });

    if (response.success) {
      // 🔥 XÓA GIỎ CŨ (CỰC QUAN TRỌNG)
      localStorage.removeItem("sakura_cart");

      // LƯU SESSION USER
      sessionStorage.setItem(
        "user_session",
        JSON.stringify(response.user)
      );

      window.dispatchEvent(new Event("storage"));

      // PHÂN QUYỀN
      if (response.user.role_id === 1) {
        window.location.href = "/admin";
      } else if (response.user.role_id === 2) {
        window.location.href = "/staff/order";
      } else {
        window.location.href = "/Home";
      }
    }
  } catch (error) {
    setErrorMsg(error.message || "Email hoặc mật khẩu không đúng!");
  }
};
  return (
    <div className="login-container">
      <div className="login-bg">
        <img src={loginBg} alt="Login background" />
        <div className="login-box">
          <h2>Đăng nhập hệ thống</h2>
          {errorMsg && (
            <div style={{ background: '#ffeaea', color: '#d63031', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #fab1a0', textAlign: 'center' }}>
              ⚠️ {errorMsg}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email tài khoản</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Nhập email..." />
            </div>
            <div className="form-group" style={{ position: "relative" }}>
              <label>Mật khẩu</label>
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Nhập mật khẩu..." />
              <span onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "15px", top: "40px", cursor: "pointer" }}>
                {showPass ? "👁️" : "🙈"}
              </span>
            </div>
            <button type="submit" className="login-btn">Đăng nhập</button>
          </form>
          <div className="login-footer">
            <p>Chưa có tài khoản?</p>
            <button className="register-link-btn" onClick={() => navigate('/register')}>Đăng ký ngay</button>
          </div>
        </div>
      </div>
    </div>
  );
}