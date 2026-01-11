import { Link } from "react-router-dom";
import "../styles/main.css";

export default function Home() {
  return (
    <section className="home">
      {/* Phần Hero: Giới thiệu chính */}
      <div className="home-hero">
        <div className="hero-content">
          <h1>Sakura Café</h1>
          <p>
            Không gian cà phê phong cách Nhật Bản – 
            nơi thưởng thức hương vị tinh tế và thư giãn trọn vẹn.
          </p>
          {/* Sửa từ thẻ <a> sang <Link> để điều hướng không bị load lại trang */}
          <Link to="/menu" className="btn-primary">
            Xem Menu ngay
          </Link>
        </div>
      </div>

      {/* Phần Intro: Giới thiệu chi tiết */}
      <div className="home-intro">
        <h2>Về Sakura Café</h2>
        <p>
          Lấy cảm hứng từ văn hóa trà đạo Nhật Bản, Sakura Café
          mang đến không gian yên tĩnh, nhẹ nhàng cùng những thức
          uống chất lượng, phù hợp cho học tập, làm việc và gặp gỡ bạn bè.
        </p>
      </div>

      {/* Phần Features: Các tính năng nổi bật */}
      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">☕</div>
          <h3>Đồ uống chất lượng</h3>
          <p>Nguyên liệu chọn lọc, hương vị tinh tế từ hoa anh đào.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🏮</div>
          <h3>Không gian Nhật Bản</h3>
          <p>Thiết kế tối giản, yên tĩnh và ấm cúng như tại Kyoto.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>Đặt bàn dễ dàng</h3>
          <p>Hỗ trợ đặt bàn nhanh chóng cho những buổi hẹn hò.</p>
        </div>
      </div>
    </section>
  );
}