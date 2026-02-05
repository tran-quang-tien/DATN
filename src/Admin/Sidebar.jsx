import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
// Lưu ý: Kiểm tra lại đường dẫn CSS của ông nếu bị lỗi trắng trang
import "../styles/main.css"; 

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem("user_session");
    navigate("/login");
  };

  const menuItems = [
    { to: "/admin/products", icon: "☕", label: "Thực đơn" },
    { to: "/admin/accounts", icon: "👥", label: "Tài khoản" },
    { to: "/admin/bookings", icon: "📅", label: "Đặt bàn" },
    { to: "/admin/orders", icon: "📊", label: "Lịch sử đơn" },
    { to: "/admin/purchases", icon: "🚚", label: "Nhập kho" },
    { to: "/admin/revenue", icon: "💰", label: "Doanh số" },
    { to: "/admin/news/add", icon: "📝", label: "Đăng tin tức" },
    { to: "/admin/recipes", icon: "📜", label: "Công thức" },
    { to: "/admin/packaging", icon: "📦", label: "Bao bì" }
  ];

  return (
    <>
      <aside className={`sakura-sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {!isCollapsed && <div className="sidebar-brand" style={{ fontWeight: "bold", color: "#e91e63" }}>SAKURA</div>}
          <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: "pointer", border: "none", background: "none" }}>
            {isCollapsed ? "❯" : "❮"}
          </button>
        </div>
        
        <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "10px" }}>
          {menuItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                padding: "12px",
                textDecoration: "none",
                borderRadius: "8px",
                color: isActive ? "#fff" : "#444",
                background: isActive ? "#e91e63" : "transparent",
                gap: "15px"
              })}
            >
              <span className="icon-wrapper">{item.icon}</span>
              {!isCollapsed && <span className="nav-text">{item.label}</span>}
            </NavLink>
          ))}

          <button 
            className="logout-btn" 
            onClick={() => setShowLogoutModal(true)}
            style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "15px", padding: "12px", border: "none", background: "none", cursor: "pointer", color: "#444" }}
          >
            <span className="icon-wrapper">🚪</span>
            {!isCollapsed && <span className="nav-text">Đăng xuất</span>}
          </button>
        </nav>
      </aside>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="logout-confirm-box">
            <div style={{ fontSize: "40px" }}>⚠️</div>
            <h3>Xác nhận đăng xuất</h3>
            <p>Bạn có chắc chắn muốn rời khỏi hệ thống SAKURA không?</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ padding: "8px 20px", cursor: "pointer" }}>Hủy</button>
              <button onClick={handleLogout} style={{ padding: "8px 20px", background: "#e91e63", color: "white", border: "none", cursor: "pointer" }}>Đăng xuất</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;