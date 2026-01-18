import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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
        setCurrentUser(JSON.parse(data));
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user_session");
    setCurrentUser(null);
    setOpenMenu(false);
    navigate("/Login");
  };

  const getAvatar = (user) => {
    if (!user?.avatar) return defaultAvatar;
    if (user.avatar.startsWith('/images')) {
      return `http://localhost:3003${user.avatar}`;
    }
    return user.avatar; 
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
          
          {/* MỤC TIN TỨC MỚI THÊM VÀO */}
          <div className="sakura-news-dropdown">
            <Link to="/news" className="news-trigger">
              Tin tức 
            </Link>
  
          </div>

          <Link to="/tuyen-dung">Tuyển dụng</Link>
          <Link to="/contact">Liên hệ</Link>
        </nav>

        <div className="sakura-actions">
          <div className="sakura-user-section">
            {!currentUser ? (
              <button className="btn-login-sakura" onClick={() => navigate("/Login")}>
                Đăng nhập
              </button>
            ) : (
              <div className={`user-dropdown-wrapper ${openMenu ? "active" : ""}`} ref={dropdownRef}>
                <div className="user-trigger" onClick={(e) => { e.stopPropagation(); setOpenMenu(!openMenu); }}>
                  <img
                    src={getAvatar(currentUser)}
                    alt="avt"
                    className="nav-avatar"
                    onError={(e) => (e.target.src = defaultAvatar)}
                  />
                  <span className="user-name">{currentUser.full_name}</span>
                  <span className="arrow">▾</span>
                </div>

                <ul className="dropdown-menu">
                  <li className="dropdown-info">
                    <img src={getAvatar(currentUser)} alt="avt" onError={(e) => (e.target.src = defaultAvatar)} />
                    <div>
                      <strong>{currentUser.full_name}</strong>
                      <p>Thành viên Sakura</p>
                    </div>
                  </li>
                  <hr />
                  <li><button onClick={() => navigate("/profile")}>👤 Hồ sơ của tôi</button></li>
                  {(currentUser.role_id === 1 || currentUser.role_id === "1") && (
                    <li><button onClick={() => navigate("/admin")}>⚙️ Quản trị hệ thống</button></li>
                  )}
                  <hr />
                  <li><button className="logout-item" onClick={handleLogout}>🚪 Đăng xuất</button></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}