import React, { useState, useEffect } from "react";
import { NavLink  } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { toast, ToastContainer } from "react-toastify";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

import "./Css/AdminOrderHistory.css";
import "./Css/RevenueStats.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const API_BASE = "http://localhost:3003";

export default function RevenueStats() {
    const [viewMode, setViewMode] = useState("daily");
    const [dailyData, setDailyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [profitSummary, setProfitSummary] = useState(null);
    const [rangeInfo, setRangeInfo] = useState({ start: "", end: "" });

    useEffect(() => {
        if (viewMode === "daily") fetchDailyRevenue();
        else if (startMonth && endMonth) fetchMonthlyRevenue();
    }, [viewMode, selectedDate, startMonth, endMonth]);

    const fetchDailyRevenue = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/revenue/daily?date=${selectedDate}`);
            const data = await res.json();
            setDailyData(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
    };

    const fetchMonthlyRevenue = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/revenue/monthly?startMonth=${startMonth}&endMonth=${endMonth}`);
            const data = await res.json();
            setMonthlyData(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
    };

    const buildDateRange = () => {
        if (viewMode === "daily") return { start: selectedDate, end: selectedDate };
        const start = startMonth ? `${startMonth}-01` : "";
        const end = endMonth ? new Date(new Date(endMonth + "-01").getFullYear(), new Date(endMonth + "-01").getMonth() + 1, 0).toISOString().split("T")[0] : "";
        return { start, end };
    };

    const previewWord = async () => {
        const { start, end } = buildDateRange();
        if (!start || (viewMode === "monthly" && !end)) {
            toast.warn("Vui lòng chọn đủ thời gian!");
            return;
        }
        setRangeInfo({ start, end });
        try {
            const res = await fetch(`${API_BASE}/api/admin/revenue/profit-summary?start=${start}&end=${end}`);
            const data = await res.json();
            setProfitSummary(data);
            setShowPreview(true);
        } catch (e) { toast.error("Lỗi lấy dữ liệu báo cáo"); }
    };

    const formatVND = (val) => (val || 0).toLocaleString() + " đ";

    const exportToWord = async () => {
        if (!profitSummary) return;
        try {
            const s = profitSummary;
            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAKURA CAFE", bold: true, size: 32, color: "E91E63" })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "BÁO CÁO DOANH THU & LỢI NHUẬN", bold: true, size: 28 })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `Thời gian: ${rangeInfo.start} đến ${rangeInfo.end}`, italics: true })] }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                renderRow("HẠNG MỤC", "GIÁ TRỊ", true),
                                renderRow(`Doanh thu Online (${s.online_count} cốc/đơn)`, formatVND(s.online_money)),
                                renderRow(`Doanh thu Offline (${s.offline_count} cốc/đơn)`, formatVND(s.offline_money)),
                                renderRow("TỔNG DOANH THU THÁNG", formatVND(s.gross_revenue), true),
                                renderRow("Chiết khấu (5%)", "-" + formatVND(s.discount)),
                                renderRow("Thuế VAT (8%)", "-" + formatVND(s.tax)),
                                renderRow("Chi phí nhập hàng (Mua đồ)", "-" + formatVND(s.total_import)),
                                renderRow("DOANH THU THỰC TẾ", formatVND(s.profit), true),
                            ]
                        })
                    ]
                }]
            });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Sakura_Report_${rangeInfo.start}.docx`);
            toast.success("Xuất Word thành công!");
        } catch (e) { toast.error("Lỗi khi xuất file"); }
    };

    const renderRow = (c1, c2, bold = false) => new TableRow({
        children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c1, bold })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: c2, bold })] })] }),
        ]
    });

    const chartData = {
        labels: viewMode === "daily" ? dailyData.map(r => r.order_date) : monthlyData.map(r => `${r.month}/${r.year}`),
        datasets: [
            { label: "Online", data: (viewMode === "daily" ? dailyData : monthlyData).map(r => r.total_online), backgroundColor: "#f48fb1" },
            { label: "Offline", data: (viewMode === "daily" ? dailyData : monthlyData).map(r => r.total_offline), backgroundColor: "#4db6ac" },
        ],
    };

    return (
        <div className="sakura-admin-layout">
            <ToastContainer />
            <aside className="sakura-sidebar">
                <div className="sidebar-brand">SAKURA ADMIN</div>
                <nav className="sidebar-nav">
                    <NavLink to="/admin/products" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>📦 Thực đơn</NavLink>
                    <NavLink to="/admin/accounts" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>👥 Tài khoản </NavLink>
                    <NavLink to="/admin/bookings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>  📅 Đặt bàn</NavLink>
                    <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>   📊 Lịch sử đơn </NavLink>
                    <NavLink to="/admin/purchases" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> 🚚 Nhập kho</NavLink>
                    <NavLink to="/admin/revenue" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>💰 Doanh số</NavLink>
                    <NavLink to="/admin/news/add" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>📝 Đăng tin tức</NavLink>
                    <NavLink to="/Home" className="nav-item"> 🏠 Trang chủ </NavLink>
                </nav>
             </aside>


            <main className="sakura-main">
                <div className="main-header" style={{display:'flex', justifyContent:'space-between', marginBottom: '20px'}}>
                    <div>
                        <h1 style={{color: '#e91e63', fontSize: '24px'}}>Thống kê doanh thu</h1>
                        <p style={{color: '#666'}}>Quản lý số liệu Sakura Cafe</p>
                    </div>
                    <button className="btn-add-pink" onClick={previewWord} style={{backgroundColor: '#e91e63', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'}}>
                        📝 Xem & Xuất Word
                    </button>
                </div>

                <div className="filter-container-sakura">
                    <div className="filter-tabs">
                        <button className={viewMode === "daily" ? "tab-active" : ""} onClick={() => setViewMode("daily")}>Ngày</button>
                        <button className={viewMode === "monthly" ? "tab-active" : ""} onClick={() => setViewMode("monthly")}>Tháng</button>
                    </div>
                    <div className="filter-dates">
                        {viewMode === "daily" ? (
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                        ) : (
                            <>
                                <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
                                <span>đến</span>
                                <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} />
                            </>
                        )}
                    </div>
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Bar data={chartData} />
                </div>
            </main>

            {showPreview && profitSummary && (
                <div className="modal-overlay">
                    <div className="modal-window">
                        <div className="modal-header">
                            <h2 style={{color: '#e91e63'}}>Xem trước báo cáo</h2>
                            <button className="btn-x" onClick={() => setShowPreview(false)}>&times;</button>
                        </div>
                            <div className="modal-body">
    {/* Sử dụng đúng tên biến đã map từ Backend */}
    <p>📱 Doanh thu Online ({profitSummary.online_count || 0} đơn): 
        <b> {profitSummary.online_money?.toLocaleString() || 0} đ</b>
    </p>
    <p>☕ Doanh thu Trực tiếp ({profitSummary.offline_count || 0} đơn): 
        <b> {profitSummary.offline_money?.toLocaleString() || 0} đ</b>
    </p>
    <hr style={{ border: '0.5px solid #eee', margin: '15px 0' }} />
    
    <p style={{ color: '#e91e63', fontSize: '18px' }}>
        💰 <b>Tổng doanh thu: {profitSummary.gross_revenue?.toLocaleString()} đ</b>
    </p>
    <p>📉 Chiết khấu (5%): <span style={{ color: 'red' }}>-{profitSummary.discount?.toLocaleString()} đ</span></p>
    <p>🏛️ Thuế VAT (8%): <span style={{ color: 'red' }}>-{profitSummary.tax?.toLocaleString()} đ</span></p>
    <p>🚚 Tiền nhập hàng: <span style={{ color: 'red' }}>-{profitSummary.total_import?.toLocaleString()} đ</span></p>
    <hr />
    <h3 style={{ color: '#2e7d32' }}>
        💵 DOANH THU THỰC TẾ: {profitSummary.profit?.toLocaleString()} đ
    </h3>
</div>
                        <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                            <button onClick={() => setShowPreview(false)} style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}>Hủy</button>
                            <button onClick={exportToWord} style={{flex: 1, padding: '10px', borderRadius: '8px', background: '#e91e63', color: 'white', border: 'none'}}>Xuất file Word</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}