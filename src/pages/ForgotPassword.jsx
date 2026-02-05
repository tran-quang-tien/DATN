import React, { useState } from "react";
import { auth } from "./Fire/firebase.js"; 
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Css/ForgotPassword.css";

export default function ForgotPassword() {
  // Toàn bộ state được khởi tạo giá trị mặc định để tránh lỗi React
  const [identity, setIdentity] = useState(""); 
  const [method, setMethod] = useState(""); 
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); 
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Chuyển 0969... thành +84969...
  const formatPhoneNumber = (number) => {
    let cleaned = number.trim();
    if (cleaned.startsWith("0")) {
      return "+84" + cleaned.substring(1);
    }
    return cleaned;
  };

  // Khởi tạo Recaptcha (Dùng bản v2 invisible để ổn định hơn)
  const onCaptchaVerify = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          console.log("reCAPTCHA đã xác thực thành công");
        },
        'expired-callback': () => {
          alert("reCAPTCHA hết hạn, vui lòng thử lại.");
          window.location.reload();
        }
      });
    }
  };

  // --- BƯỚC 1: GỬI MÃ ---
  const handleSendCode = async () => {
    if (!identity) return alert("Vui lòng nhập Email hoặc Số điện thoại!");
    setLoading(true);

    if (identity.includes("@")) {
      // XỬ LÝ EMAIL
      setMethod("email");
      try {
        const res = await axios.post("http://localhost:3003/api/send-email-otp", { email: identity });
        if (res.data.success) {
          alert("Mã OTP đã được gửi vào Email!");
          setStep(2);
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi gửi Email OTP! Kiểm tra Terminal Backend.");
      }
    } else {
      // XỬ LÝ SỐ ĐIỆN THOẠI
      setMethod("phone");
      const formattedPhone = formatPhoneNumber(identity);
      
      try {
        onCaptchaVerify();
        const appVerifier = window.recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(result);
        setStep(2);
        alert("Mã OTP đang được gửi qua SMS!");
      } catch (err) {
        console.error("Firebase Error:", err);
        alert("Lỗi gửi SMS! Hãy kiểm tra 'Authorized Domains' trong Firebase Console.");
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      }
    }
    setLoading(false);
  };

  // --- BƯỚC 2: XÁC MINH OTP ---
  const handleVerifyOTP = async () => {
    if (!otp) return alert("Vui lòng nhập mã OTP!");
    
    setLoading(true);
    if (method === "email") {
      try {
        const res = await axios.post("http://localhost:3003/api/verify-email-otp", { 
          email: identity, 
          otp: otp 
        });
        if (res.data.success) setStep(3);
      } catch (err) {
        alert("Mã OTP Email không chính xác!");
      }
    } else {
      try {
        await confirmationResult.confirm(otp);
        setStep(3);
      } catch (err) {
        alert("Mã OTP điện thoại sai!");
      }
    }
    setLoading(false);
  };

  // --- BƯỚC 3: CẬP NHẬT MẬT KHẨU ---
  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) return alert("Mật khẩu không khớp!");
    if (newPassword.length < 6) return alert("Mật khẩu phải từ 6 ký tự!");
    
    setLoading(true);
    try {
      const payload = {
        newPassword: newPassword,
        ...(method === "email" ? { email: identity } : { phone: identity })
      };

      const res = await axios.post("http://localhost:3003/api/reset-password-db", payload);
      if (res.data.success) {
        alert("Cập nhật mật khẩu thành công! Hãy đăng nhập.");
        navigate("/login");
      }
    } catch (err) {
      alert("Lỗi lưu mật khẩu mới!");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* KHÔNG ĐƯỢC XÓA HOẶC ẨN CONTAINER NÀY */}
      <div id="recaptcha-container"></div>

      <div className="login-box">
        <h2 style={{ color: "#d81b60" }}>Quên mật khẩu 🌸</h2>

        {step === 1 && (
          <div className="form-group">
            <label>Email hoặc SĐT (Ví dụ: 0912...)</label>
            <input 
              type="text" 
              placeholder="Nhập thông tin..." 
              value={identity} 
              onChange={(e) => setIdentity(e.target.value)} 
            />
            <button className="login-btn" onClick={handleSendCode} disabled={loading}>
              {loading ? "Đang xử lý..." : "Gửi mã xác minh"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="form-group">
            <label>Nhập mã OTP vừa nhận</label>
            <input 
              type="text" 
              placeholder="Nhập 6 số" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
            />
            <button className="login-btn" onClick={handleVerifyOTP} disabled={loading}>
              {loading ? "Đang xác minh..." : "Xác minh mã"}
            </button>
            <p onClick={() => setStep(1)} style={{ cursor: 'pointer', textAlign: 'center', marginTop: '10px' }}>Quay lại</p>
          </div>
        )}

        {step === 3 && (
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input 
              type="password" 
              placeholder="Ít nhất 6 ký tự" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} 
            />
            <label style={{marginTop: '10px'}}>Xác nhận mật khẩu</label>
            <input 
              type="password" 
              placeholder="Nhập lại mật khẩu" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
            <button className="login-btn" style={{marginTop: '20px'}} onClick={handleUpdatePassword} disabled={loading}>
              {loading ? "Đang cập nhật..." : "Lưu mật khẩu"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}