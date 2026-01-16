import React from 'react';
import './Css/Contact.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaCoffee } from 'react-icons/fa';

// Nếu bạn muốn dùng khung ảnh 'job' bao quanh bản đồ, hãy import nó
// import job from './Picture/job-bg.png'; 

export default function Contact() {
  // Đường dẫn nhúng chuẩn của Google Maps cho địa chỉ 266 Đội Cấn
  const embedMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.897106037085!2d105.8162803153853!3d21.03680239288117!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab14566d3ed1%3A0x4a18797f3747f525!2zMjY2IMSQ4buZaSBD4bqlbiwgTGnhu4V1IEdpYWksIEJhIMSQw6xuaCwgSMOgIE7hu5lpLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1625562000000!5m2!1svi!2s";

  return (
    <section className="contact-page-section">
      <div className="contact-container">
        {/* Header */}
        <div className="contact-header">
          <FaCoffee className="header-icon" />
          <h2>LIÊN HỆ</h2>
          <p className="subtitle">
            Hãy liên hệ ngay với chúng tôi để được giải đáp các thắc mắc <br />
            liên quan đến tuyển dụng tại Sakura Café một cách sớm nhất
          </p>
          <div className="title-line-gold"></div>
        </div>

        <div className="contact-content-grid">
          <div className="contact-info-box">
            <h3 className="company-name">CÔNG TY CỔ PHẦN SAKURA CAFÉ VIỆT NAM</h3>
            
            <div className="branch-list">
              <div className="branch-item">
                <FaMapMarkerAlt className="icon-map" />
                <p><strong>Trụ sở:</strong> Tầng 6 - Tòa nhà Ladeco - 266 Đội Cấn - Hà Nội</p>
              </div>
              <div className="branch-item">
                <FaMapMarkerAlt className="icon-map" />
                <p><strong>Chi nhánh HCM:</strong> Lầu 3 - Tòa nhà Lữ Gia - Số 70 Lữ Gia - Quận 11 - TP Hồ Chí Minh</p>
              </div>
            </div>

            <hr className="divider" />

            <div className="contact-footer">
              <div className="footer-item">
                <FaPhoneAlt className="icon-phone" />
                <p><strong>Số điện thoại:</strong> 024 7308 6880</p>
              </div>
              <div className="footer-item">
                <FaEnvelope className="icon-email" />
                <p><strong>Email:</strong> tuyendung@sakuracafe.vn</p>
              </div>
            </div>
          </div>

          <div className="contact-image-box">
            <img 
               src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000" 
               alt="Sakura Cafe Space" 
            />
          </div>
        </div>

        {/* Phần Bản đồ nhúng */}
        <div className="contact-map-wrapper">
          <h3 className="map-title">VỊ TRÍ TRÊN BẢN ĐỒ</h3>
          <div className="map-container">
            <iframe 
              src={embedMapUrl} 
              width="100%" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Sakura Cafe Map"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}