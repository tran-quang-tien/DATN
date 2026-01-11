import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOTP } from "../api/Api";
import "./css/VerifyEmail.css"; // Đã import CSS mới

export default function VerifyEmail() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  // Nếu không có email (truy cập thẳng), quay về trang đăng ký
  React.useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyOTP({ email, otp });
      if (res.success) {
        // PHẦN QUAN TRỌNG: Backend trả về user chứa address, avatar 
        // Chúng ta truyền sang trang UploadAvatar để xử lý tiếp
        navigate("/upload-avatar", { state: { user: res.user } });
      } else {
        alert(res.message || "Mã OTP không chính xác");
      }
    } catch (err) {
      alert("Lỗi xác thực: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-wrapper">
      <div className="verify-box">
        <h2>Xác nhận OTP 🌸</h2>
        <p>Mã xác thực đã được gửi tới:<br/><b>{email}</b></p>
        
        <form onSubmit={handleVerify}>
          <input 
            className="otp-input"
            type="text" 
            placeholder="000000"
            maxLength="6" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)} 
            required 
          />
          
          <button type="submit" className="btn-verify" disabled={loading}>
            {loading ? "Đang kiểm tra..." : "Xác nhận & Hoàn tất"}
          </button>
        </form>

        <span className="btn-back-link" onClick={() => navigate("/register")}>
          ← Quay lại trang đăng ký
        </span>
      </div>
    </div>
  );
}