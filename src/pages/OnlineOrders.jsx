import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Css/OnlineOrders.css";

export default function OnlineOrders() {
    const [orders, setOrders] = useState([]);
    const [toast, setToast] = useState({ show: false, message: "" });
    const navigate = useNavigate();

    // Hàm lấy dữ liệu đơn hàng kèm chi tiết món
    const fetchOrders = async () => {
        try {
            const res = await axios.get("http://localhost:3003/api/admin/orders/pending");
            const ordersWithItems = await Promise.all(res.data.map(async (order) => {
                const detailsRes = await axios.get(`http://localhost:3003/api/admin/orders/${order.order_id}/details`);
                return { ...order, items: detailsRes.data };
            }));
            setOrders(ordersWithItems);
        } catch (err) {
            console.error("Lỗi tải đơn hàng:", err);
        }
    };

    // Thiết lập Polling: Tự động cập nhật mỗi 5 giây
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    // Hiển thị thông báo Box tự động tắt thay vì Alert
    const showAutoToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
    };

    const handleConfirmAction = async (id) => {
        try {
            await axios.put(`http://localhost:3003/api/admin/orders/${id}/complete`);
            setOrders(prev => prev.filter(o => o.order_id !== id));
            showAutoToast(`✅ Đã xong đơn hàng #${id}`);
        } catch (err) {
            showAutoToast("❌ Lỗi khi cập nhật trạng thái!");
        }
    };

    return (
        <div className="online-orders-pos">
            {/* Box thông báo hiện lên phía trên */}
            {toast.show && <div className="auto-toast-box">{toast.message}</div>}
            
            <div className="pos-header">
                <button onClick={() => navigate("/staff/order")} className="back-btn">⬅ POS</button>
                <h2>🛎️ DANH SÁCH CHẾ BIẾN (ONLINE)</h2>
            </div>

            <div className="orders-container">
                {orders.length === 0 ? (
                    <div className="no-data">Đang chờ đơn hàng mới...</div>
                ) : (
                    orders.map(order => (
                        <div key={order.order_id} className="kitchen-card">
                            <div className="card-header">
                                <strong>#ID: {order.order_id}</strong>
                                {/* Fix lỗi lệch 7 tiếng bằng múi giờ Asia/Ho_Chi_Minh */}
                                <span>
                                    {new Date(order.created_at).toLocaleTimeString('vi-VN', { 
                                        hour12: false, 
                                        timeZone: 'Asia/Ho_Chi_Minh' 
                                    })}
                                </span>
                            </div>
                            <div className="card-body">
                                <div className="customer-info">
                                    <p>👤 {order.fullname || "Khách vãng lai"}</p>
                                    <p>📞 {order.phone || "N/A"}</p>
                                </div>
                                <hr />
                                {order.items?.map(item => (
                                    <div key={item.detail_id} className="food-item">
                                        <span className="qty">{item.quantity}x</span>
                                        <span className="name">{item.product_name}</span>
                                    </div>
                                ))}

                                {order.note && (
                                    <div className="order-note-box">
                                        <strong>📝 Ghi chú:</strong>
                                        <p>{order.note}</p>
                                    </div>
                                )}
                            </div>
                            <button className="done-btn" onClick={() => handleConfirmAction(order.order_id)}>
                                XÁC NHẬN XONG
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}