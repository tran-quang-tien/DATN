import React, { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2"; 
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { toast, ToastContainer } from "react-toastify";
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend,
    Filler 
} from "chart.js";

import "./Css/RevenueStats.css";

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, 
    BarElement, Title, Tooltip, Legend, Filler 
);

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
            toast.warn("Vui lòng chọn đủ khoảng thời gian!");
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

    const formatVND = (val) => (val || 0).toLocaleString("vi-VN") + " đ";

    const renderRow = (c1, c2, bold = false) => new TableRow({
        children: [
            new TableCell({ 
                padding: { top: 100, bottom: 100, left: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: c1, bold, size: 24 })] })] 
            }),
            new TableCell({ 
                padding: { top: 100, bottom: 100, right: 100 },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: c2, bold, size: 24, color: bold ? "E91E63" : "000000" })] })] 
            }),
        ]
    });

    const exportToWord = async () => {
        if (!profitSummary) return;
        try {
            const s = profitSummary;
            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAKURA CAFE", bold: true, size: 36, color: "E91E63" })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "BÁO CÁO DOANH THU & LỢI NHUẬN", bold: true, size: 28 })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Thời gian: ${rangeInfo.start} đến ${rangeInfo.end}`, italics: true, size: 22 })] }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                renderRow("HẠNG MỤC", "GIÁ TRỊ", true),
                                renderRow(`Doanh thu Online (${s.online_count} đơn)`, formatVND(s.online_money)),
                                renderRow(`Doanh thu Trực tiếp (${s.offline_count} đơn)`, formatVND(s.offline_money)),
                                renderRow("TỔNG DOANH THU", formatVND(s.gross_revenue), true),
                                renderRow("Chiết khấu & Ưu đãi", "-" + formatVND(s.discount)),
                                renderRow("Thuế VAT (8%)", "-" + formatVND(s.tax)),
                                renderRow("Chi phí nguyên liệu (Nhập hàng)", "-" + formatVND(s.total_import)),
                                renderRow("LỢI NHUẬN THỰC TẾ", formatVND(s.profit), true),
                            ]
                        }),
                        new Paragraph({ spacing: { before: 500 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Ngày lập báo cáo: ${new Date().toLocaleDateString("vi-VN")}`, italics: true })] })
                    ]
                }]
            });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Bao_Cao_Sakura_${rangeInfo.start}.docx`);
            toast.success("Đã xuất file Word!");
            setShowPreview(false);
        } catch (e) { toast.error("Lỗi xuất file"); }
    };

    const activeData = viewMode === "daily" ? dailyData : monthlyData;
    const chartData = {
        labels: viewMode === "daily" ? activeData.map(r => `${r.hour}h`) : activeData.map(r => `${r.month}/${r.year}`),
        datasets: [
            { 
                label: "Online", 
                data: activeData.map(r => r.total_online), 
                borderColor: "#e91e63", 
                backgroundColor: "rgba(233, 30, 99, 0.2)", 
                tension: 0.4, fill: true 
            },
            { 
                label: "Trực tiếp", 
                data: activeData.map(r => r.total_offline), 
                borderColor: "#009688", 
                backgroundColor: "rgba(0, 150, 136, 0.2)", 
                tension: 0.4, fill: true 
            },
        ],
    };

    return (
        <div className="revenue-stats-wrapper">
            <ToastContainer position="top-right" autoClose={2000} />
            
            <header className="stats-header">
                <div className="header-text">
                    <h1>📊 Thống kê Doanh thu</h1>
                    <p>Phân tích hiệu quả kinh doanh Sakura Cafe</p>
                </div>
                <button className="btn-export-word" onClick={previewWord}>
                    📝 Xuất Báo Cáo Word
                </button>
            </header>

            <div className="stats-filter-bar">
                <div className="mode-tabs">
                    <button className={viewMode === "daily" ? "active" : ""} onClick={() => setViewMode("daily")}>Theo Ngày</button>
                    <button className={viewMode === "monthly" ? "active" : ""} onClick={() => setViewMode("monthly")}>Theo Tháng</button>
                </div>
                
                <div className="date-inputs">
                    {viewMode === "daily" ? (
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    ) : (
                        <div className="range-picker">
                            <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
                            <span>➜</span>
                            <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            <div className="chart-main-container">
                <div className="chart-box">
                    {viewMode === "daily" ? (
                        <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                    ) : (
                        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                    )}
                </div>
            </div>

            {showPreview && profitSummary && (
                <div className="preview-modal-overlay">
                    <div className="preview-modal-content">
                        <div className="modal-top">
                            <h2>Xem trước báo cáo</h2>
                            <button className="close-x" onClick={() => setShowPreview(false)}>&times;</button>
                        </div>
                        <div className="modal-middle">
                            <div className="summary-grid">
                                <div className="sum-item"><span>Online:</span> <strong>{formatVND(profitSummary.online_money)}</strong></div>
                                <div className="sum-item"><span>Trực tiếp:</span> <strong>{formatVND(profitSummary.offline_money)}</strong></div>
                                <div className="sum-item total"><span>Tổng thu:</span> <strong>{formatVND(profitSummary.gross_revenue)}</strong></div>
                                <div className="sum-item cost"><span>Chi phí:</span> <strong style={{color: '#f44336'}}>-{formatVND(profitSummary.total_import)}</strong></div>
                            </div>
                            <div className="profit-highlight">
                                <span>LỢI NHUẬN DỰ KIẾN</span>
                                <h2>{formatVND(profitSummary.profit)}</h2>
                            </div>
                        </div>
                        <div className="modal-bottom">
                            <button className="btn-cancel" onClick={() => setShowPreview(false)}>Đóng</button>
                            <button className="btn-confirm-export" onClick={exportToWord}>Xác nhận & Tải file (.docx)</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}