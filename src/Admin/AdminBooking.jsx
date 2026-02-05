import React, { useState, useEffect, useCallback } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE = "http://localhost:3003";

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
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

  const handleUpdateStatus = async (status, reason = "") => {
    if (status === "Đã hủy" && !reason.trim()) {
      showToast("Vui lòng nhập lý do hủy!", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${selectedId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancelReason: reason }),
      });
      if (res.ok) {
        showToast(status === "Đã hủy" ? "Đã hủy & gửi mail 📧" : "Cập nhật thành công ✨");
        closeModals();
        fetchData();
      }
    } catch (err) {
      showToast("Lỗi server", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${selectedId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Đã xóa vĩnh viễn");
        closeModals();
        fetchData();
      }
    } catch (err) {
      showToast("Lỗi khi xóa", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModals = () => {
    setShowApproveModal(false);
    setShowCancelModal(false);
    setShowDeleteModal(false);
    setCancelReason("");
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
    <div className="booking-mgmt-wrapper">
      {toast && <div className={`sakura-toast ${toast.type}`}>{toast.message}</div>}
      
      <header className="mgmt-header">
        <div className="header-info">
          <h1>📅 Quản lý Đặt bàn</h1>
          <p>Tự động làm mới dữ liệu sau mỗi 30 giây</p>
        </div>
        <div className="header-filters">
          <input type="text" placeholder="🔍 Tìm SĐT..." value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </div>
      </header>

      <div className="status-nav">
        {["Tất cả", "Chờ xác nhận", "Đã xác nhận", "Đã hủy"].map((s) => (
          <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="table-card">
        <table className="booking-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>KHÁCH HÀNG</th>
              <th>TRẠNG THÁI</th>
              <th className="txt-right">CHI TIẾT</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((item) => (
              <React.Fragment key={item.booking_id}>
                <tr className={`summary-row ${expandedId === item.booking_id ? "active" : ""}`} onClick={() => setExpandedId(expandedId === item.booking_id ? null : item.booking_id)}>
                  <td className="id-cell">#{item.booking_id}</td>
                  <td>
                    <div className="cust-info">
                      <strong>{item.customer_name}</strong>
                      <span>{item.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${item.status === 'Chờ xác nhận' ? 'pending' : item.status === 'Đã xác nhận' ? 'confirmed' : 'cancelled'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="txt-right">{expandedId === item.booking_id ? "▲" : "▼"}</td>
                </tr>
                
                {expandedId === item.booking_id && (
                  <tr className="detail-row">
                    <td colSpan="4">
                      <div className="expand-box">
                        <div className="info-grid">
                          <p><strong>📅 Ngày:</strong> {new Date(item.booking_date).toLocaleDateString('vi-VN')}</p>
                          <p><strong>⏰ Giờ:</strong> {item.booking_time}</p>
                          <p><strong>👥 Số khách:</strong> {item.number_of_people} người</p>
                          <p><strong>📝 Ghi chú:</strong> {item.note || "Trống"}</p>
                        </div>
                        <div className="action-bar">
                          {isPastDate(item.booking_date) ? (
                            <span className="past-alert">⚠️ Đơn đã quá hạn</span>
                          ) : (
                            <div className="btn-group">
                              {(item.status === "Chờ xác nhận" || item.status === "Đã hủy") && (
                                <button className="btn-approve" onClick={() => { setSelectedId(item.booking_id); setShowApproveModal(true); }}>
                                  {item.status === "Đã hủy" ? "Khôi phục đơn" : "Xác nhận đơn"}
                                </button>
                              )}
                              {(item.status === "Chờ xác nhận" || item.status === "Đã xác nhận") && (
                                <button className="btn-cancel" onClick={() => { setSelectedId(item.booking_id); setShowCancelModal(true); }}>Hủy đơn</button>
                              )}
                            </div>
                          )}
                          <button className="btn-delete-text" onClick={() => { setSelectedId(item.booking_id); setShowDeleteModal(true); }}>Xóa vĩnh viễn</button>
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

      {/* MODALS (Approve/Cancel/Delete) */}
      {(showApproveModal || showCancelModal || showDeleteModal) && (
        <div className="sakura-modal-overlay">
          <div className="sakura-modal-card">
            {showApproveModal && (
              <>
                <h3>Duyệt đơn #{selectedId}</h3>
                <p>Xác nhận đặt bàn cho khách <strong>{selectedBooking?.customer_name}</strong>?</p>
                <div className="modal-btns">
                  <button className="btn-confirm" onClick={() => handleUpdateStatus("Đã xác nhận")}>{isProcessing ? "Đang lưu..." : "Đồng ý"}</button>
                  <button className="btn-close" onClick={closeModals}>Hủy</button>
                </div>
              </>
            )}
            {showCancelModal && (
              <>
                <h3>Hủy đơn #{selectedId}</h3>
                <p>Gửi lý do hủy cho khách hàng:</p>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="VD: Nhà hàng đã hết chỗ vào khung giờ này..." rows="4" />
                <div className="modal-btns">
                  <button className="btn-confirm-red" onClick={() => handleUpdateStatus("Đã hủy", cancelReason)}>{isProcessing ? "Đang gửi..." : "Xác nhận hủy"}</button>
                  <button className="btn-close" onClick={closeModals}>Quay lại</button>
                </div>
              </>
            )}
            {showDeleteModal && (
              <>
                <h3 className="red-text">Cảnh báo xóa</h3>
                <p>Dữ liệu đơn hàng <strong>#{selectedId}</strong> sẽ bị xóa khỏi hệ thống.</p>
                <div className="modal-btns">
                  <button className="btn-confirm-red" onClick={handleDelete}>{isProcessing ? "Xóa..." : "Xóa ngay"}</button>
                  <button className="btn-close" onClick={closeModals}>Quay lại</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}