import React, { useEffect, useState } from "react";
import { getBookingHistory } from "../api/Api";
import "./Css/BookingHistory.css"
export default function BookingHistory() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const session = JSON.parse(sessionStorage.getItem("user_session"));
    const userEmail = "yaboku209@gmail.com";

    useEffect(() => {
        if (userEmail) {
            getBookingHistory(userEmail)
                .then(data => {
                    setBookings(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [userEmail]);

    if (loading) return <div style={{padding: "100px", textAlign: "center"}}>🌸 Đang tải lịch sử đặt bàn...</div>;

   return (
    <div className="booking-history-page">
        <h2>📅 LỊCH SỬ ĐẶT BÀN</h2>

        <table className="booking-history-table">
            <thead>
                <tr>
                    <th>Mã đặt</th>
                    <th>Ngày</th>
                    <th>Giờ</th>
                    <th>Số người</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>

            <tbody>
                {bookings.map(item => (
                    <tr key={item.booking_id}>
                        <td>#BK{item.booking_id}</td>
                        <td data-label="Ngày">
                            {new Date(item.booking_date).toLocaleDateString("vi-VN")}
                        </td>
                        <td data-label="Giờ">{item.booking_time}</td>
                        <td data-label="Số người">{item.number_of_people}</td>
                        <td data-label="Trạng thái">
                            <span className={`status-badge ${
                                item.status === "Đã xác nhận"
                                    ? "status-success"
                                    : "status-pending"
                            }`}>
                                {item.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
}