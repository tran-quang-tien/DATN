import React, { useEffect, useState } from "react";
import { getOrderHistory } from "../api/Api"; 

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const session = JSON.parse(sessionStorage.getItem("user_session"));

    useEffect(() => {
        const fetchOrders = async () => {
            if (session?.id) {
                try {
                    const data = await getOrderHistory(session.id);
                    setOrders(data);
                } catch (err) {
                    console.error("Lỗi:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchOrders();
    }, [session?.id]);

    if (loading) return <div style={{padding: "150px", textAlign: "center", color: "#fb6f92"}}>🌸 Đang tải...</div>;

    return (
        <div style={{ padding: "120px 20px", maxWidth: "1100px", margin: "0 auto" }}>
            <h2 style={styles.title}>🛒 LỊCH SỬ MUA HÀNG</h2>
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.headerRow}>
                            <th style={styles.th}>Mã đơn</th>
                            <th style={styles.th}>Loại đơn</th>
                            <th style={styles.th}>Thanh toán</th>
                            <th style={styles.th}>Tổng tiền</th>
                            <th style={styles.th}>Ghi chú</th> 
                            <th style={styles.th}>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((item) => (
                            <tr key={item.order_id} style={styles.row}>
                                <td style={styles.td}>#ORD{item.order_id}</td>
                                <td style={styles.td}>
                                    {item.order_type === "Online" ? "Online" : "☕ Tại quán"}
                                </td>
                                <td style={styles.td}>{item.payment_method}</td>
                                <td style={{ ...styles.td, fontWeight: "bold", color: "#fb6f92" }}>
                                    {Number(item.total_amount).toLocaleString()}đ
                                </td>
                                <td style={{ ...styles.td, fontSize: "12px", fontStyle: "italic" }}>
                                    {item.note || "---"}
                                </td>
                                <td style={styles.td}>
                                    <span style={{ 
                                        ...styles.statusBadge,
                                        backgroundColor: item.status === "Đã hoàn thành" ? "#e8f5e9" : "#fff3cd",
                                        color: item.status === "Đã hoàn thành" ? "#2e7d32" : "#856404"
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    title: { color: "#fb6f92", textAlign: "center", marginBottom: "40px", borderBottom: "3px solid #ffb3c1", display: "inline-block", paddingBottom: "10px" },
    tableWrapper: { background: "#fff", borderRadius: "15px", boxShadow: "0 5px 20px rgba(0,0,0,0.05)", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    headerRow: { background: "#ffe5ec" },
    th: { padding: "15px", textAlign: "left", color: "#fb6f92" },
    td: { padding: "15px", borderBottom: "1px solid #eee" },
    statusBadge: { padding: "5px 12px", borderRadius: "20px", fontSize: "12px" }
};