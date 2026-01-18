import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Css/NewsDetail.css";
export default function NewsDetail() {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Gọi API lấy bài viết theo news_id từ backend
    axios.get(`http://localhost:3003/api/news/${id}`)
      .then(res => setNews(res.data))
      .catch(err => console.error("Lỗi lấy chi tiết bài viết:", err));
  }, [id]);

  if (!news) return <div style={{textAlign: 'center', marginTop: '50px'}}>Đang tải bài viết...</div>;

  return (
    <div style={{ maxWidth: "850px", margin: "40px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{marginBottom: '20px', cursor: 'pointer', padding: '8px 15px', border: '1px solid #ccc', borderRadius: '5px'}}
      >
        ← Quay lại trang tin tức
      </button>

      {/* Tiêu đề bài viết từ SQL */}
      <h1 style={{ color: "#b22830", fontSize: '32px', marginBottom: '10px' }}>{news.title}</h1>
      
      <p style={{ color: "#666", fontStyle: 'italic' }}>
        📅 Ngày đăng: {new Date(news.created_at).toLocaleDateString('vi-VN')}
      </p>

      {/* Ảnh bài viết lấy từ images */}
      <img 
        src={`http://localhost:3003${news.image}`} 
        alt={news.title}
        style={{ width: "100%", borderRadius: "10px", margin: "25px 0", boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
        onError={(e) => e.target.src = 'https://via.placeholder.com/800x400?text=Sakura+Cafe+News'}
      />

      {/* Nội dung chi tiết bài viết */}
      <div style={{ lineHeight: "1.8", fontSize: "18px", color: "#333" }}>
        <p style={{ fontWeight: "bold", fontSize: "21px", color: "#000" }}>{news.summary}</p>
        <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #eee' }} />
        <div style={{ whiteSpace: "pre-line" }}>
          {news.content}
        </div>
      </div>
    </div>
  );
}