import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios"; 
import { getUsers } from "../api/Api"; 
import "./Css/AccountManagement.css"; 

function AccountManagement() {
  // --- CÁC STATE QUẢN LÝ ---
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null); // Để mở chi tiết hàng
  
  // State quản lý Modal xác nhận (Hiển thị hồ sơ + Nhập lý do gửi mail)
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    user: null,
    type: "", // "DELETE" hoặc "LOCK"
    reason: ""
  });

  const API_BASE = "http://localhost:3003";

  // Tự động tải dữ liệu khi vào trang
  useEffect(() => { 
    fetchUsersData(); 
  }, []);

  // --- HÀM 1: HIỂN THỊ THÔNG BÁO (TOAST) ---
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- HÀM 2: LẤY DANH SÁCH NGƯỜI DÙNG TỪ API ---
  const fetchUsersData = async () => {
    try {
      const data = await getUsers();
      if (Array.isArray(data)) {
        setUsers(data.sort((a, b) => a.user_id - b.user_id));
      }
    } catch (err) { 
      showToast("Lỗi tải danh sách người dùng", "error");
    }
  };

  // --- HÀM 3: MỞ BẢNG XÁC NHẬN (XEM HỒ SƠ TRƯỚC KHI XÓA/KHÓA) ---
  const openConfirmModal = (user, type) => {
    if (user.role_id === 1) return showToast("Không thể tác động tài khoản Admin!", "error");
    setConfirmModal({
      show: true,
      user: user,
      type: type,
      reason: "" // Reset lý do trắng
    });
  };

  // --- HÀM 4: XỬ LÝ GỬI LỆNH (XÓA/KHÓA) + GỬI LÝ DO QUA MAIL ---
  const handleFinalAction = async () => {
    const { user, type, reason } = confirmModal;
    
    if (!reason.trim()) {
      alert("Bạn phải nhập lý do để hệ thống gửi mail thông báo cho người dùng!");
      return;
    }

    try {
      if (type === "DELETE") {
        // Gửi lệnh xóa kèm lý do trong body (Sử dụng axios.delete với data)
        const res = await axios.delete(`${API_BASE}/api/users/${user.user_id}`, {
          data: { reason: reason }
        });
        if (res.data.success) showToast("🗑️ Đã xóa và gửi mail thông báo!");
      } 
      else if (type === "LOCK") {
        const newRoleId = user.role_id === 0 ? 3 : 0; // Đổi trạng thái (0: khóa, 3: mở)
        const res = await axios.put(`${API_BASE}/api/users/status/${user.user_id}`, {
          role_id: newRoleId,
          reason: reason
        });
        if (res.data.success) {
          showToast(newRoleId === 0 ? "🔒 Đã khóa & gửi mail" : "🔓 Đã mở khóa & gửi mail");
        }
      }

      // Đóng modal và làm mới danh sách
      setConfirmModal({ show: false, user: null, type: "", reason: "" });
      fetchUsersData();
    } catch (err) {
      showToast("Lỗi: " + (err.response?.data?.message || "Thao tác thất bại"), "error");
    }
  };

  // --- GIAO DIỆN ---
  return (
    <div className="sakura-admin-layout">
      {toast && <div className={`sakura-toast ${toast.type}`}>{toast.message}</div>}

      <aside className="sakura-sidebar">
        <div className="sidebar-brand">SAKURA ADMIN</div>
        <nav className="sidebar-nav">
          <Link to="/admin/products" className="nav-item">📦 Thực đơn</Link>
          <Link to="/admin/accounts" className="nav-item active">👥 Tài khoản</Link>
          <Link to="/admin/bookings" className="nav-item">📅 Đặt bàn</Link>
          <Link to="/admin/revenue" className="nav-item">💰 Doanh số</Link>
          <Link to="/admin/purchases" className="nav-item">🚚 Nhập kho</Link>
          <Link to="/admin/orders" className="nav-item">📊 Lịch sử đơn</Link>
          <div className="nav-divider"></div>
          <Link to="/Home" className="nav-item">🏠 Trang chủ</Link>
        </nav>
      </aside>

      <main className="sakura-main">
        <header className="main-header">
          <div className="header-left">
            <h1>Quản lý người dùng</h1>
            <p>Bấm vào người dùng để xem thông tin chi tiết</p>
          </div>
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="🔍 Tìm tên hoặc email..." 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </header>

        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th width="80">ID</th>
                <th>THÀNH VIÊN</th>
                <th>VAI TRÒ</th>
                <th style={{textAlign: 'right'}}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                <React.Fragment key={u.user_id}>
                  {/* HÀNG CHÍNH (RÚT GỌN) */}
                  <tr 
                    className={`main-row ${expandedUserId === u.user_id ? 'active' : ''} ${u.role_id === 0 ? 'is-locked' : ''}`}
                    onClick={() => setExpandedUserId(expandedUserId === u.user_id ? null : u.user_id)}
                  >
                    <td className="txt-bold">#{u.user_id}</td>
                    <td>
                      <div className="user-profile-summary">
                        <div className="avatar-small">
                          {u.avatar ? <img src={`${API_BASE}${u.avatar}`} alt="avt" /> : u.full_name?.charAt(0)}
                        </div>
                        <span className="name-text">{u.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-${u.role_id}`}>
                        {u.role_id === 1 ? 'ADMIN' : u.role_id === 0 ? 'BỊ KHÓA' : 'KHÁCH HÀNG'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{textAlign: 'right'}}>
                       <button className="btn-action-lock" onClick={() => openConfirmModal(u, "LOCK")}>
                          {u.role_id === 0 ? "🔓 Mở khóa" : "🔒 Khóa"}
                       </button>
                       <button className="btn-action-delete" onClick={() => openConfirmModal(u, "DELETE")}>🗑️ Xóa</button>
                    </td>
                  </tr>

                  {/* HÀNG CHI TIẾT SỔ XUỐNG (ACCORDION) */}
                  {expandedUserId === u.user_id && (
                    <tr className="detail-row">
                      <td colSpan="4">
                        <div className="detail-box-expand">
                           <div className="detail-grid">
                              <div className="detail-avt-large">
                                 {u.avatar ? <img src={`${API_BASE}${u.avatar}`} alt="avt" /> : <div className="no-img">{u.full_name?.charAt(0)}</div>}
                              </div>
                              <div className="detail-info-list">
                                 <p><strong>📧 Email:</strong> {u.email}</p>
                                 <p><strong>📞 Điện thoại:</strong> {u.phone || "Chưa cập nhật"}</p>
                                 <p><strong>📍 Địa chỉ:</strong> {u.address || "Chưa cập nhật"}</p>
                                 <p><strong>📅 Ngày đăng ký:</strong> {new Date(u.created_at).toLocaleDateString('vi-VN')}</p>
                              </div>
                           </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL XÁC NHẬN "XỊN" - XEM HỒ SƠ + NHẬP LÝ DO GỬI MAIL */}
      {confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-confirm-card">
            <div className={`modal-confirm-header ${confirmModal.type}`}>
              <h2>{confirmModal.type === "DELETE" ? "⚠️ XÁC NHẬN XÓA TÀI KHOẢN" : "🔔 THÔNG BÁO TÀI KHOẢN"}</h2>
              <p>Hệ thống sẽ gửi mail lý do bạn nhập dưới đây cho khách hàng</p>
            </div>

            <div className="modal-confirm-body">
              {/* Hiển thị Profile đầy đủ trong Modal */}
              <div className="user-review-box">
                 <div className="review-avt">
                    {confirmModal.user.avatar ? 
                      <img src={`${API_BASE}${confirmModal.user.avatar}`} alt="avt" /> : 
                      <div className="review-no-avt">{confirmModal.user.full_name[0]}</div>
                    }
                 </div>
                 <div className="review-data">
                    <h3>{confirmModal.user.full_name}</h3>
                    <span>ID: #{confirmModal.user.user_id} | {confirmModal.user.email}</span>
                    <p>SĐT: {confirmModal.user.phone || "Chưa có"}</p>
                    <p>Địa chỉ: {confirmModal.user.address || "Chưa có"}</p>
                 </div>
              </div>

              <div className="reason-input-group">
                <label>Lý do (Nội dung này sẽ gửi vào Email khách hàng):</label>
                <textarea 
                  rows="4"
                  placeholder="Ví dụ: Tài khoản của bạn bị khóa do vi phạm chính sách thanh toán..."
                  value={confirmModal.reason}
                  onChange={(e) => setConfirmModal({...confirmModal, reason: e.target.value})}
                ></textarea>
              </div>
            </div>

            <div className="modal-confirm-footer">
              <button className="btn-confirm-final" onClick={handleFinalAction}>Xác nhận & Gửi Mail</button>
              <button className="btn-cancel-final" onClick={() => setConfirmModal({show: false})}>Quay lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountManagement;