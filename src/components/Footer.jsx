import React from "react";
// Đảm bảo đường dẫn này đúng với cấu trúc thư mục của bạn
import "./Css/Footer.css"; 

export default function Footer() {
  return (
    <footer className="sakura-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-logo">SAKURA CAFÉ</h3>
          <p>
            Chạm vào cánh hoa, thưởng thức vị trà. Sakura Café mang đến không gian 
            tĩnh lặng và những tách cà phê đậm đà bản sắc Nhật Bản giữa lòng phố thị.
          </p>
          <div className="footer-social">
            <span className="social-label">Kết nối với Sakura:</span>
            <div className="social-icons">
              <a href="https://www.facebook.com/share/17rann9S3a/" target="_blank" rel="noreferrer" title="Facebook">
                <i className="fab fa-facebook"></i> Facebook
              </a>
              <a href="https://www.tiktok.com/@tonomachi209" target="_blank" rel="noreferrer" title="Tiktok">
                <i className="fab fa-tiktok"></i> Tiktok
              </a>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h3>DỊCH VỤ</h3>
          <ul className="footer-links">
            <li>Đặt bàn trực tuyến</li>
            <li>Thực đơn trà đạo</li>
            <li>Workshop trò chơi</li>
            <li>Tổ chức sự kiện</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>LIÊN HỆ ĐẶT CHỖ</h3>
          <p>📍 123 Đường Hoa Anh Đào, Quận Hoàn Kiếm, Hà Nội</p>
          <p>📞 Hotline:0969458664</p>
          <p>⏰ 07:00 AM - 11:00 PM (Mỗi ngày)</p>
          <p>📩 sakuracafe@gmail.vn</p>
        </div>
      </div>

     
    </footer>
  );
}