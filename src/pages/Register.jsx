import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkRegisterInfo, sendEmailOTP } from "../api/Api"; 
import { auth } from "./Fire/firebase.JS";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import "./css/Register.css"; 

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState("EMAIL"); 
  
  const [formData, setFormData] = useState({
    full_name: "", email: "", phone: "", address: "", password: "", confirmPassword: "",role_id: 3
  });

  useEffect(() => {
    console.log("--- Khởi tạo Recaptcha ---");
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
        'size': 'invisible' 
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    console.log("1. Đã chặn Load trang (e.preventDefault)");
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      console.log("2. Đang kiểm tra Email/SĐT có trùng không...");
      await checkRegisterInfo({ 
        phone: formData.phone, 
        email: formData.email 
      });
      console.log("3. Kiểm tra thông tin OK (Không trùng)");

      if (verifyMethod === "PHONE") {
        console.log("4a. Bắt đầu luồng PHONE qua Firebase...");
        let phoneFix = formData.phone.trim();
        if (phoneFix.startsWith('0')) {
          phoneFix = '+84' + phoneFix.substring(1);
        }

        const confirmation = await signInWithPhoneNumber(auth, phoneFix, window.recaptchaVerifier);
        window.confirmationResult = confirmation;
        
        console.log("5a. Firebase gửi SMS thành công. Chuẩn bị Navigate...");
        navigate("/verify-email", { 
          state: { type: "PHONE", target: formData.phone, userData: formData } 
        });

      } else {
        console.log("4b. Bắt đầu luồng EMAIL qua Backend...");
        const res = await sendEmailOTP({ email: formData.email });
        
        console.log("5b. Kết quả API gửi Email:", res);
        if (res.success) {
          console.log("6b. Gửi Mail thành công. Chuẩn bị Navigate...");
          navigate("/verify-email", { 
            state: { type: "EMAIL", target: formData.email, userData: formData } 
          });
        }
      }
    } catch (error) {
      console.error("❌ LỖI TẠI ĐÂY:", error);
      const msg = error.response?.data?.message || "Lỗi hệ thống hoặc thông tin đã tồn tại!";
      setErrorMsg(msg);
      
      // Nếu có lỗi, chúng ta không Navigate, tránh bị văng trang
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div id="recaptcha-container"></div>
      <div className="register-card">
        <h2 className="register-title">Tạo tài khoản mới 🌸</h2>
        
        {errorMsg && <div className="error-banner" style={{color: 'red', padding: '10px', background: '#ffeeee'}}>⚠️ {errorMsg}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-grid">
            <div className="input-group full-column">
              <label>Họ và tên</label>
              <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Số điện thoại</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>

            <div className="input-group full-column">
              <label>Địa chỉ</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Mật khẩu</label>
              <input type={showPass ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Xác nhận lại</label>
              <input type={showPass ? "text" : "password"} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required />
            </div>
          </div>

          <div className="method-selection">
            <p>Nhận mã qua:</p>
            <div style={{display: 'flex', gap: '10px'}}>
               <button type="button" onClick={() => setVerifyMethod('EMAIL')} style={{background: verifyMethod === 'EMAIL' ? 'pink' : '#eee'}}>Email</button>
               <button type="button" onClick={() => setVerifyMethod('PHONE')} style={{background: verifyMethod === 'PHONE' ? 'pink' : '#eee'}}>SĐT</button>
            </div>
          </div>

          <button type="submit" className="btn-register-submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "ĐĂNG KÝ NGAY"}
          </button>
        </form>
      </div>
    </div>
  );
}