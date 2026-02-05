import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Css/News.css";

export default function News() {
  const [newsList, setNewsList] = useState([]);
  const navigate = useNavigate();

  const fetchNews = async () => {
  try {
    // Thêm ?t=${Date.now()} để URL luôn khác nhau, trình duyệt không cache được
    const res = await axios.get(`http://localhost:3003/api/news?t=${Date.now()}`);
    setNewsList(res.data);
    console.log(`Làm mới lúc ${new Date().toLocaleTimeString()}: Đã lấy ${res.data.length} bài viết`);
  } catch (err) {
    console.error("Lỗi lấy tin tức:", err);
  }
};

  useEffect(() => {
    // 1. Lần đầu tiên vào trang thì lấy dữ liệu ngay
    fetchNews();

    // 2. Thiết lập tự động lấy dữ liệu sau mỗi 5 giây (Polling)
    // Sau khi ông Sửa bên Admin, tối đa 5s sau bên này sẽ tự đổi
    const interval = setInterval(() => {
      fetchNews();
    }, 5000); 

    // 3. Tự động lấy dữ liệu khi người dùng quay lại tab này (Window Focus)
    const onFocus = () => fetchNews();
    window.addEventListener("focus", onFocus);

    // Xóa bỏ các bộ hẹn giờ khi rời khỏi trang để tránh tốn tài nguyên
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <div className="news-container">
      <h1 className="news-title">TIN TỨC & SỰ KIỆN 🌸</h1>
      <div className="news-vertical-list">
        {newsList.length > 0 ? (
          newsList.map((item) => (
            <div key={item.news_id} className="news-item-horizontal">
              <div className="news-image">
                <img 
                  src={`http://localhost:3003${item.image}`} 
                  alt={item.title} 
                  onError={(e) => {e.target.src = 'https://via.placeholder.com/300x200?text=Sakura+News'}}
                />
              </div>
              <div className="news-info">
                <span className="news-date">
                    📅 {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '18/01/2026'}
                </span>
                <h3>{item.title}</h3>
                <p className="news-summary">{item.summary}</p>
                <button 
                className="btn-readmore" 
                onClick={() => navigate(`/news/${item.news_id}`)} 
              >
                Xem chi tiết ➜
              </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{textAlign: 'center'}}>Đang cập nhật những tin tức mới nhất...</p>
        )}
      </div>
    </div>
  );
}