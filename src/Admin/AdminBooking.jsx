import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./Css/AdminBooking.css";

export default function AdminBooking() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("Tất cả");
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchPhone, setSearchPhone] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  
  // Trạng thái xử lý để tránh bấm nút nhiều lần
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE = "http://localhost:3003";

  // 1. Hàm tải dữ liệu (đưa vào useCallback để tối ưu)
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    }
  }, [API_BASE]);

  // 2. Thiết lập tự động Reload sau mỗi 30 giây
  useEffect(() => {
    fetchData(); // Chạy ngay lần đầu

    const interval = setInterval(() => {
      fetchData(); 
      console.log("Đã tự động cập nhật danh sách mới...");
    }, 30000); // 30000ms = 30 giây

    return () => clearInterval(interval); // Xóa bộ đếm khi thoát trang
  }, [fetchData]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isPastDate = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(dateString);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate < today;
  };

  // 3. Hàm cập nhật trạng thái (Duyệt/Hủy)
  const handleUpdateStatus = async (status, reason = "") => {
    if (status === "Đã hủy" && !reason.trim()) {
      showToast("Vui lòng nhập lý do hủy!", "error");
      return;
    }

    setIsProcessing(true); // Bắt đầu xử lý
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${selectedId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancelReason: reason }),
      });

      if (res.ok) {
        showToast(status === "Đã hủy" ? "Đã hủy & gửi mail cho khách 📧" : "Cập nhật thành công ✨");
        setShowApproveModal(false);
        setShowCancelModal(false);
        setCancelReason(""); 
        fetchData(); // Tải lại dữ liệu ngay lập tức
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Cập nhật thất bại", "error");
      }
    } catch (err) {
      showToast("Lỗi hệ thống hoặc Server chưa phản hồi", "error");
    } finally {
      setIsProcessing(false); // Kết thúc xử lý
    }
  };

  // 4. Hàm xóa đơn
  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${selectedId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Đã xóa vĩnh viễn");
        setShowDeleteModal(false);
        fetchData(); // Tải lại dữ liệu ngay lập tức
      }
    } catch (err) {
      showToast("Lỗi khi xóa", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = filter === "Tất cả" ? true : b.status === filter;
    const matchesPhone = b.phone.includes(searchPhone);
    const bDate = b.booking_date.split("T")[0];
    const matchesDate = filterDate === "" ? true : bDate === filterDate;
    return matchesStatus && matchesPhone && matchesDate;
  });

  const selectedBooking = bookings.find((b) => b.booking_id === selectedId);

  return (
    <div className="sakura-admin-layout">
      {toast && <div className={`sakura-toast ${toast.type}`}>{toast.message}</div>}

      <aside className="sakura-sidebar">
        <div className="sidebar-brand">SAKURA ADMIN</div>
        <nav className="sidebar-nav">
          <Link to="/admin/products" className="nav-item">📦 Thực đơn</Link>
          <Link to="/admin/accounts" className="nav-item">👥 Tài khoản</Link>
          <Link to="/admin/bookings" className="nav-item active">📅 Đặt bàn</Link>
          <Link to="/admin/orders" className="nav-item">📊 Lịch sử đơn</Link>
          <Link to="/Home" className="nav-item">🏠 Trang chủ</Link>
        </nav>
      </aside>

      <main className="sakura-main">
        <header className="main-header">
          <div className="header-left">
            <h1>Quản lý đặt bàn</h1>
            <small style={{ color: "#888" }}>Tự động cập nhật dữ liệu sau 30s 🔄</small>
          </div>
          <div className="header-controls">
            <input type="text" placeholder="Tìm SĐT..." value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
        </header>

        <div className="admin-filter-bar">
          <div className="admin-filter-pills">
            {["Tất cả", "Chờ xác nhận", "Đã xác nhận", "Đã hủy"].map((s) => (
              <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>KHÁCH HÀNG</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: "right" }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((item) => (
                <React.Fragment key={item.booking_id}>
                  <tr className="summary-row" onClick={() => setExpandedId(expandedId === item.booking_id ? null : item.booking_id)}>
                    <td className="txt-bold">#{item.booking_id}</td>
                    <td>{item.customer_name} <br /> <small>{item.phone}</small></td>
                    <td><span className={`status-pill ${item.status === 'Đã hủy' ? 'status-cancel' : ''}`}>{item.status}</span></td>
                    <td style={{ textAlign: "right" }}>{expandedId === item.booking_id ? "🔼" : "🔽"}</td>
                  </tr>
                  {expandedId === item.booking_id && (
                    <tr className="detail-row">
                      <td colSpan="4">
                        <div className="detail-content">
                          <p><strong>Ngày đặt:</strong> {new Date(item.booking_date).toLocaleDateString()}</p>
                          <p><strong>Giờ:</strong> {item.booking_time} | <strong>Số người:</strong> {item.number_of_people}</p>
                          <p><strong>Ghi chú:</strong> {item.note || "Không có"}</p>
                          
                          <div className="detail-actions">
                            {isPastDate(item.booking_date) ? (
                              <span style={{ color: "#f0ad4e", fontWeight: "bold" }}>⚠️ Đã quá ngày</span>
                            ) : (
                              <>
                                {(item.status === "Chờ xác nhận" || item.status === "Đã hủy") && (
                                  <button className="btn-approve" onClick={() => { setSelectedId(item.booking_id); setShowApproveModal(true); }}>
                                    {item.status === "Đã hủy" ? "Đặt lại đơn" : "Duyệt đơn"}
                                  </button>
                                )}
                                {(item.status === "Chờ xác nhận" || item.status === "Đã xác nhận") && (
                                  <button className="btn-cancel" onClick={() => { setSelectedId(item.booking_id); setShowCancelModal(true); }}>
                                    Hủy đơn
                                  </button>
                                )}
                              </>
                            )}
                            <button className="btn-delete" onClick={() => { setSelectedId(item.booking_id); setShowDeleteModal(true); }}>
                              Xóa đơn
                            </button>
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

      {/* MODAL DUYỆT */}
      {showApproveModal && (
        <div className="sakura-modal-overlay">
          <div className="sakura-modal">
            <h3>Xác nhận thay đổi?</h3>
            <p>Hành động: <strong>{selectedBooking?.status === "Đã hủy" ? "Khôi phục đặt bàn" : "Duyệt đặt bàn"}</strong></p>
            <div className="modal-actions">
              <button className="btn-confirm-approve" disabled={isProcessing} onClick={() => handleUpdateStatus("Đã xác nhận")}>
                {isProcessing ? "Đang xử lý..." : "Đồng ý"}
              </button>
              <button className="btn-close" onClick={() => setShowApproveModal(false)}>Quay lại</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HỦY */}
      {showCancelModal && (
        <div className="sakura-modal-overlay">
          <div className="sakura-modal">
            <h3>Lý do hủy đơn</h3>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Lý do gửi tới khách..." rows="4" />
            <div className="modal-actions">
              <button className="btn-confirm-cancel" disabled={isProcessing} onClick={() => handleUpdateStatus("Đã hủy", cancelReason)}>
                {isProcessing ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
              <button className="btn-close" onClick={() => setShowCancelModal(false)}>Quay lại</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÓA */}
      {showDeleteModal && (
        <div className="sakura-modal-overlay">
          <div className="sakura-modal">
            <h3 style={{ color: "red" }}>⚠️ Cảnh báo xóa</h3>
            <p>Xóa vĩnh viễn đơn <strong>#{selectedId}</strong>?</p>
            <div className="modal-actions">
              <button className="btn-confirm-delete" disabled={isProcessing} onClick={handleDelete}>
                {isProcessing ? "Xóa..." : "Xóa ngay"}
              </button>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}