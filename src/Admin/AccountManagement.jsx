import React, { useState, useEffect } from "react";
import axios from "axios";
import { getUsers } from "../api/Api";
import "./Css/AccountManagement.css";

function AccountManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    user: null,
    type: "", 
    reason: "",
  });

  const [formData, setFormData] = useState({ full_name: "", phone: "", address: "" });
  const [selectedFile, setSelectedFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null);   

  const API_BASE = "http://localhost:3003";

  useEffect(() => { fetchUsersData(); }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const openConfirmModal = (user, type) => {
    if (user.role_id === 1 && type !== "EDIT") {
      return showToast("Không thể tác động tài khoản Admin!", "error");
    }
    setConfirmModal({ show: true, user, type, reason: "" });
    if (type === "EDIT") {
      setFormData({ full_name: user.full_name || "", phone: user.phone || "", address: user.address || "" });
      setPreviewUrl(user.avatar ? `${API_BASE}${user.avatar}` : null);
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFinalAction = async () => {
    const { user, type, reason } = confirmModal;
    if ((type === "DELETE" || type === "LOCK") && !reason.trim()) {
      alert("Bạn phải nhập lý do để hệ thống gửi mail thông báo!");
      return;
    }

    try {
      if (type === "EDIT") {
        const data = new FormData();
        data.append("full_name", formData.full_name);
        data.append("phone", formData.phone);
        data.append("address", formData.address);
        if (selectedFile) data.append("avatar", selectedFile);

        const res = await axios.put(`${API_BASE}/api/users/update/${user.user_id}`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data.success) showToast("📝 Cập nhật thành công!");
      } 
      else if (type === "DELETE") {
        const res = await axios.delete(`${API_BASE}/api/users/${user.user_id}`, { data: { reason } });
        if (res.data.success) showToast("🗑️ Đã xóa người dùng!");
      } 
      else if (type === "LOCK") {
        const newRoleId = user.role_id === 0 ? 3 : 0; 
        const res = await axios.put(`${API_BASE}/api/users/status/${user.user_id}`, { role_id: newRoleId, reason });
        if (res.data.success) showToast(newRoleId === 0 ? "🔒 Đã khóa tài khoản" : "🔓 Đã mở khóa");
      }

      setConfirmModal({ show: false, user: null, type: "", reason: "" });
      fetchUsersData();
    } catch (err) {
      showToast("Lỗi thao tác thất bại", "error");
    }
  };

  return (
    <div className="account-mgmt-container">
      {toast && <div className={`sakura-toast ${toast.type}`}>{toast.message}</div>}
      
      <header className="mgmt-header">
        <div className="header-title">
          <h1>Quản lý tài khoản</h1>
          <p>Danh sách nhân viên và khách hàng trong hệ thống</p>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Tìm theo tên hoặc email..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="modern-table-card">
        <table className="account-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>THÀNH VIÊN</th>
              <th>VAI TRÒ</th>
              <th className="txt-right">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((u) => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((u) => (
                <React.Fragment key={u.user_id}>
                  <tr 
                    className={`user-row ${expandedUserId === u.user_id ? "expanded" : ""} ${u.role_id === 0 ? "locked" : ""}`}
                    onClick={() => setExpandedUserId(expandedUserId === u.user_id ? null : u.user_id)}
                  >
                    <td><strong>#{u.user_id}</strong></td>
                    <td>
                      <div className="user-info-cell">
                        <div className="avt-circle">
                          {u.avatar ? <img src={`${API_BASE}${u.avatar}`} alt="" /> : u.full_name?.charAt(0)}
                        </div>
                        <span>{u.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-role role-${u.role_id}`}>
                        {u.role_id === 1 ? "Quản trị" : u.role_id === 0 ? "Bị khóa" : "Khách hàng"}
                      </span>
                    </td>
                    <td className="txt-right" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-edit" onClick={() => openConfirmModal(u, "EDIT")}>Sửa</button>
                      <button className="btn-lock" onClick={() => openConfirmModal(u, "LOCK")}>{u.role_id === 0 ? "Mở" : "Khóa"}</button>
                      <button className="btn-delete" onClick={() => openConfirmModal(u, "DELETE")}>Xóa</button>
                    </td>
                  </tr>
                  {expandedUserId === u.user_id && (
                    <tr className="expansion-row">
                      <td colSpan="4">
                        <div className="expansion-content">
                           <div className="info-grid">
                              <div className="info-item"><strong>Email:</strong> {u.email}</div>
                              <div className="info-item"><strong>SĐT:</strong> {u.phone || "---"}</div>
                              <div className="info-item"><strong>Địa chỉ:</strong> {u.address || "---"}</div>
                              <div className="info-item"><strong>Ngày tham gia:</strong> {new Date(u.created_at).toLocaleDateString("vi-VN")}</div>
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

      {/* MODAL */}
      {confirmModal.show && (
        <div className="sakura-modal-overlay">
          <div className="sakura-modal-content">
            <div className={`modal-status-bar ${confirmModal.type}`}></div>
            <div className="modal-inner">
              <h3>{confirmModal.type === "EDIT" ? "Chỉnh sửa hồ sơ" : "Xác nhận hành động"}</h3>
              
              {confirmModal.type === "EDIT" ? (
                <div className="edit-form">
                   <div className="avatar-picker">
                      <div className="preview">
                        {previewUrl ? <img src={previewUrl} alt="" /> : <span>{formData.full_name[0]}</span>}
                        <label htmlFor="file-up">📷</label>
                      </div>
                      <input type="file" id="file-up" hidden onChange={handleFileChange} />
                   </div>
                   <div className="form-group">
                      <label>Họ tên</label>
                      <input type="text" value={formData.full_name} onChange={(e)=>setFormData({...formData, full_name: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label>Số điện thoại</label>
                      <input type="text" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label>Địa chỉ</label>
                      <textarea value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})}></textarea>
                   </div>
                </div>
              ) : (
                <div className="confirm-reason">
                   <p>Bạn đang thao tác trên tài khoản <strong>{confirmModal.user.full_name}</strong></p>
                   <textarea 
                    placeholder="Lý do..." 
                    value={confirmModal.reason} 
                    onChange={(e)=>setConfirmModal({...confirmModal, reason: e.target.value})}
                   />
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-save" onClick={handleFinalAction}>Đồng ý</button>
                <button className="btn-close" onClick={() => setConfirmModal({ show: false })}>Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountManagement;