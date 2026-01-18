import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Thêm dòng này
import "./Css/News.css";

export default function News() {
  const [newsList, setNewsList] = useState([]);
  const navigate = useNavigate(); // Khởi tạo điều hướng

  const fetchNews = async () => {
    try {
      const res = await axios.get("http://localhost:3003/api/news");
      setNewsList(res.data);
    } catch (err) {
      console.error("Lỗi lấy tin tức:", err);
    }
  };

  useEffect(() => {
    fetchNews();
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
                {/* Sửa lại navigate để khớp với Route bên dưới */}
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