import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { completeRegistration, verifyEmailOTPAPI, sendEmailOTP } from "../api/Api"; 
import { signInWithPhoneNumber } from "firebase/auth";
import { auth } from "./Fire/firebase.JS";
import "./Css/VerifyEmail.css"; 

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy dữ liệu từ trang Register truyền sang
  const { type, target, userData } = location.state || {};

  useEffect(() => {
    const isInvalidPhone = type === "PHONE" && !window.confirmationResult;
    const isInvalidEmail = type === "EMAIL" && !target;

    if (!target || isInvalidPhone || isInvalidEmail) {
      alert("Phiên làm việc đã hết hạn. Vui lòng thực hiện lại.");
      navigate("/register");
    }
  }, [type, target, navigate]);

  // --- HÀM GỬI LẠI MÃ ---
  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      if (type === "PHONE") {
        let phoneFix = target.trim();
        if (phoneFix.startsWith('0')) phoneFix = '+84' + phoneFix.substring(1);
        
        const confirmation = await signInWithPhoneNumber(auth, phoneFix, window.recaptchaVerifier);
        window.confirmationResult = confirmation;
        alert("Mã OTP mới đã được gửi đến số điện thoại!");
      } else {
        const res = await sendEmailOTP({ email: target });
        if (res.success) {
          alert("Mã OTP mới đã được gửi đến email của bạn!");
        }
      }
    } catch (error) {
      console.error("Lỗi gửi lại mã:", error);
      alert("Không thể gửi lại mã lúc này.");
    } finally {
      setResending(false);
    }
  };

  // --- HÀM XÁC THỰC MÃ ---
  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return alert("Vui lòng nhập đủ 6 chữ số");

    setLoading(true);
    try {
      let isVerified = false;

      if (type === "PHONE") {
        const result = await window.confirmationResult.confirm(otp);
        if (result.user) isVerified = true;
      } else {
        const resEmail = await verifyEmailOTPAPI({ email: target, otp: otp });
        if (resEmail.success) isVerified = true;
      }

      if (isVerified) {
        // Hoàn tất lưu user vào DB
        const res = await completeRegistration({
          ...userData,
          is_verified: 1
        });

        if (res.success) {
          alert("Xác thực thành công! 🌸");
          
          // Chuyển sang trang Avatar kèm thông tin User đúng Role
          navigate("/upload-avatar", { 
            state: { 
              user: { 
                user_id: res.user_id, 
                full_name: userData.full_name,
                // SỬA TẠI ĐÂY: Ưu tiên lấy role từ DB trả về, nếu không lấy từ form, mặc định là 3
                role_id: res.role_id || userData.role_id || 3 
              } 
            } 
          });
        } else {
          alert(res.message || "Lỗi lưu thông tin.");
        }
      }
    } catch (err) {
      console.error("Lỗi xác thực:", err);
      alert("Mã OTP không chính xác hoặc đã hết hạn!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-wrapper">
      <div className="verify-box">
        <div className="verify-icon">🔑</div>
        <h2>Xác minh mã OTP</h2>
        <p className="verify-desc">
          Mã xác thực đã được gửi đến {type === "PHONE" ? "SĐT" : "Email"}:
          <br/>
          <span className="target-highlight">{target}</span>
        </p>
        
        <form onSubmit={handleVerify} className="otp-form">
          <div className="otp-input-container">
            <input 
              className="otp-input-main"
              type="text" 
              placeholder="· · · · · ·"
              maxLength="6" 
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
              required 
              autoFocus
            />
          </div>
          
          <button type="submit" className="btn-verify-submit" disabled={loading}>
            {loading ? "Đang kiểm tra..." : "Xác nhận & Tiếp tục"}
          </button>
        </form>

        <div className="verify-footer">
          <p>
            Không nhận được mã?{" "}
            <span 
              className={`resend-link ${resending ? "disabled" : ""}`} 
              onClick={handleResend}
              style={{ cursor: "pointer", color: "#d81b60", fontWeight: "bold" }}
            >
              {resending ? "Đang gửi..." : "Gửi lại ngay"}
            </span>
          </p>
          <span className="btn-back-link" onClick={() => navigate("/register")} style={{ cursor: "pointer", display: "block", marginTop: "15px" }}>
              ← Quay lại trang đăng ký
          </span>
        </div>
      </div>
    </div>
  );
}