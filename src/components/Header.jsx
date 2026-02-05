import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Css/Header.css";
import defaultAvatar from "./Picture/avt.png";

export default function Header() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const dropdownRef = useRef(null);

  const checkUser = () => {
    const data = sessionStorage.getItem("user_session");
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        
        // Đảm bảo lấy đúng các trường từ Session Storage (xem image_b361b1.jpg)
        setCurrentUser({
          id: parsedData.id, 
          name: parsedData.name || "Thành viên",
          role_id: parsedData.role_id,
          // Nối URL server cho avatar để hiển thị được ảnh từ DB
          avatar_url: parsedData.avatar 
            ? `http://localhost:3003${parsedData.avatar}` 
            : defaultAvatar
        });
      } catch (err) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    // Lắng nghe sự kiện để cập nhật tên "tran quang tien1" ngay khi Lưu ở trang Edit
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user_session");
    setCurrentUser(null);
    setOpenMenu(false);
    navigate("/Login");
  };

  return (
    <header className="sakura-header">
      <div className="header-inner-container">
        <div className="sakura-logo" onClick={() => navigate("/Home")}>
          🌸 Sakura<span>Café</span>
        </div>

        <nav className="sakura-nav">
          <Link to="/Home">Trang chủ</Link>
          <Link to="/menu">Cửa hàng</Link>
          <Link to="/booking">Đặt bàn</Link>
          <Link to="/news">Tin tức</Link>
          <Link to="/contact">Liên hệ</Link>
          <Link to="/recuiment">Tuyển dụng</Link>
        </nav>

        <div className="sakura-actions">
          {!currentUser ? (
            <button className="btn-login-sakura" onClick={() => navigate("/Login")}>
              Đăng nhập
            </button>
          ) : (
            <div className="user-dropdown-wrapper" ref={dropdownRef}>
              <div className="user-trigger" onClick={() => setOpenMenu(!openMenu)}>
                <img
                  src={currentUser.avatar_url}
                  alt="avt"
                  className="nav-avatar"
                  onError={(e) => (e.target.src = defaultAvatar)}
                />
                {/* HIỂN THỊ TÊN CHUẨN TỪ STATE */}
                <span className="user-name">{currentUser.name}</span>
                <span className={`arrow-icon ${openMenu ? "rotate" : ""}`}>▾</span>
              </div>

              {openMenu && (
                <ul className="dropdown-menu">
                  <li className="dropdown-header">
                    <img src={currentUser.avatar_url} alt="avt" onError={(e) => (e.target.src = defaultAvatar)} />
                    <div className="header-text">
                      <strong>{currentUser.name}</strong>
                      <span>Thành viên Sakura</span>
                    </div>
                  </li>
                  <div className="divider"></div>
                  <li>
                    <button onClick={() => { navigate("/profile"); setOpenMenu(false); }}>
                      👤 Hồ sơ của tôi
                    </button>
                    <button onClick={() => { navigate("/UserBokhis"); setOpenMenu(false); }}>
                      📅 Lịch sử đặt bàn
                    </button>
                    <button onClick={() => { navigate("/UserOrderhis"); setOpenMenu(false); }}>
                      🛒 lịch sử mua hàng
                    </button>
                  </li>
                  {(currentUser.role_id === 1 || currentUser.role_id === 2) && (
                    <li>
                      <button onClick={() => { navigate("/admin"); setOpenMenu(false); }}>
                        ⚙️ Quản trị hệ thống
                      </button>
                    </li>
                  )}
                  <div className="divider"></div>
                  <li>
                    <button className="logout-btn" onClick={handleLogout}>
                      🚪 Đăng xuất
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}