import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Css/StaffRecruitment.css';
import headerBanner from "./picture/back.png";
import history from "./picture/lichsu2.png";
import game from "./picture/boardgame.png"
import job from "./picture/job.png"
export default function StaffRecruitment() {
  // 1. Dữ liệu cứng các vị trí tuyển dụng
  const jobPositions = [
    { id: 1, title: "Nhân viên Pha chế (Full-time)", location: "Quận 1, TP.HCM", type: "Full-time" },
    { id: 2, title: "Cửa hàng trưởng", location: "Đống Đa, Hà Nội", type: "Full-time" },
    { id: 3, title: "Nhân viên Phục vụ (Part-time)", location: "Toàn quốc", type: "Part-time" },
  ];

  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_phone: '',
    job_target: 'Nhân viên Pha chế (Full-time)',
    message: ''
  });

  const [loading, setLoading] = useState(false);

  // 2. Hiệu ứng Scroll Reveal (Intersection Observer)
  useEffect(() => {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // 3. Hàm cuộn mượt xuống Form
  const scrollToForm = (jobTitle = null) => {
    if (jobTitle) {
      setFormData(prev => ({ ...prev, job_target: jobTitle }));
    }
    const formSection = document.getElementById('apply-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gửi dữ liệu tới API Nodemailer tại Backend port 3003
      await axios.post('http://localhost:3003/api/send-recruitment', formData);
      toast.success("🚀 Hồ sơ của bạn đã được gửi thành công!");
      setFormData({ 
        user_name: '', user_email: '', user_phone: '', 
        job_target: 'Nhân viên Pha chế (Full-time)', message: '' 
      });
    } catch (err) {
      toast.error("Gửi hồ sơ thất bại, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recruitment-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Banner chính */}
     <header 
        className="recruitment-header"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${headerBanner})` 
        }}
      >
        <div className="overlay reveal">
          <h1>GIA ĐÌNH SAKURA CAFÉ</h1>
          <p>Chúng tôi luôn tìm kiếm những người tuyệt vời!</p>
          <button className="btn-apply-now" onClick={() => scrollToForm()}>
            Gửi thông tin cho chúng tôi
          </button>
        </div>
      </header>

      {/* Phần Lịch sử (So le ảnh/chữ) */}
      <section className="history-section">
        <div className="history-item reveal">
          <div className="history-text">
            <h2>LỊCH SỬ PHÁT TRIỂN</h2>
            <p>
              Trở về những ngày đầu tiên khi Sakura Café là một cửa hàng nhỏ nhưng luôn tấp nập phục vụ khách hàng 
              những sản phẩm được làm từ nguồn nguyên liệu sạch và chất lượng hàng đầu. Thương hiệu chính thức được thành lập 
              với tâm huyết mang Cafe Việt vươn tầm quốc tế.
            </p>
          </div>
          <div className="history-image">
            <img src={history} alt="Lịch sử" />
          </div>
        </div>

        <div className="history-item reverse reveal">
          <div className="history-text">
            <h2>NHIỀU HƠN CẢ MỘT LY ĐỒ UỐNG</h2>
            <p>
              Chúng tôi kỳ vọng truyền cảm hứng và nuôi dưỡng tâm hồn con người – những người bạn, những ly trà ngọt ngào 
              và những phút giây thư giãn quý giá. Sakura Café là nơi kết nối những tâm hồn đồng điệu.
            </p>
          </div>
          <div className="history-image">
            <img src={game} alt="Văn hóa" />
          </div>
        </div>
      </section>

      {/* Danh sách công việc */}
            <section className="jobs-background-section reveal">
        {/* Chỗ này mình dùng biến 'job' mà bạn đã import nhé */}
        <div 
            className="jobs-frame-container"
            style={{ backgroundImage: `url(${job})` }} 
        >
            <div className="jobs-content-wrapper">
            <div className="jobs-header-blue">
                <span className="subtitle-blue">Hành trình nghề nghiệp</span>
                <h2 className="title-blue">CÁC VỊ TRÍ HIỆN TẠI</h2>
                <div className="line-blue"></div>
            </div>
            
            <div className="job-scroll-list">
                {jobPositions.map(item => ( // Đổi tên biến map thành item để tránh trùng với ảnh 'job'
                <div key={item.id} className="job-item-blue">
                    <div className="job-info-blue">
                    <h4>{item.title}</h4>
                    <p>📍 {item.location} | ⏳ {item.type}</p>
                    </div>
                    <button className="btn-apply-blue" onClick={() => scrollToForm(item.title)}>
                    Ứng tuyển
                    </button>
                </div>
                ))}
            </div>
            </div>
        </div>
        </section>

      {/* Form đăng ký */}
      <section id="apply-form-section" className="apply-section reveal">
        <div className="form-wrapper">
          <div className="form-header">
            <h3>ĐĂNG KÝ LÀM VIỆC</h3>
            <p>Hãy để lại thông tin, chúng tôi sẽ liên hệ với bạn sớm nhất</p>
          </div>
          
          <form onSubmit={handleSubmit} className="recruitment-form">
            <input type="text" name="user_name" value={formData.user_name} onChange={handleInputChange} placeholder="Họ và tên của bạn *" required />
            <div className="form-row">
              <input type="email" name="user_email" value={formData.user_email} onChange={handleInputChange} placeholder="Email liên lạc *" required />
              <input type="tel" name="user_phone" value={formData.user_phone} onChange={handleInputChange} placeholder="Số điện thoại *" required />
            </div>
            <select name="job_target" value={formData.job_target} onChange={handleInputChange}>
              {jobPositions.map(j => <option key={j.id} value={j.title}>{j.title}</option>)}
            </select>
            <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Kinh nghiệm & Giới thiệu ngắn..." rows="4"></textarea>
            <button type="submit" className="btn-submit-form" disabled={loading}>
              {loading ? "ĐANG GỬI HỒ SƠ..." : "GỬI THÔNG TIN NGAY"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}