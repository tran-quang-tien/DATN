import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Css/main.css";

// hình ảnh
import BanhNgotImg from "./picture/bánh ngọt.png";
import CafeImg from "./picture/cafe rang.png";
import Vuichoi from "./picture/masoi.png";
import giaikhat from "./picture/giaikhat.png";
import khongian from "./picture/khonggianquan.png";
import banner from "./picture/banner.png";

export default function Home() {
  const navigate = useNavigate();
  const API_BASE = "http://localhost:3003";

  const [saleProducts, setSaleProducts] = useState([]);

  /* FETCH FLASH SALE */
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();

        const saleItems = data
          .filter(p => Array.isArray(p.discount) && p.discount[0] > 0)
          .slice(0, 4);

        setSaleProducts(saleItems);
      } catch (err) {
        console.error("Lỗi tải flash sale:", err);
      }
    };
    fetchFlashSale();
  }, []);

  return (
    <div className="home-container">

      {/* HERO */}
      <div className="home-hero-banner">
        <img src={banner} alt="Banner" className="banner-bg-image" />
        <div className="hero-overlay">
          <div className="hero-content-box">
            <h1>Sakura Café</h1>
            <div className="hero-line"></div>
            <p>Hương vị trà đạo & cà phê Nhật Bản</p>

            {/* 👉 NÚT NÀY → ĐI TỚI DANH MỤC CAFE */}
            <button
              onClick={() =>
                navigate("/menu", { state: { scrollTo: "Cà Phê" } })
              }
            >
              Xem ưu đãi
            </button>
          </div>
        </div>
      </div>

      {/* FLASH SALE */}
      {saleProducts.length > 0 && (
        <section className="flash-sale-home">
          <div className="section-title-area">
            <h2 className="sakura-title">🌸 MÓN ĐANG GIẢM GIÁ</h2>
            <p>Bấm vào để xem tất cả ưu đãi</p>
          </div>

          <div className="sale-grid-4column">
            {saleProducts.map(item => {
              const discountPercent = item.discount[0];
              const newPrice = item.price * (1 - discountPercent / 100);

              return (
                <div
                  key={item.product_id}
                  className="sale-card-item"
                  /* 👉 CLICK CARD → KHUYẾN MÃI */
                  onClick={() =>
                    navigate("/menu", { state: { scrollTo: "khuyen-mai" } })
                  }
                >
                  <div className="sale-tag">-{discountPercent}%</div>

                  <div className="img-wrapper">
                    <img
                      src={`${API_BASE}${item.image}`}
                      alt={item.name}
                    />
                  </div>

                  <div className="sale-detail">
                    <h4>{item.name}</h4>

                    <div className="price-row">
                      <span className="price-old">
                        {item.price.toLocaleString()}đ
                      </span>
                      <span className="price-new">
                        {newPrice.toLocaleString()}đ
                      </span>
                    </div>

                    <button className="buy-now-mini">
                      Xem ưu đãi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CATEGORY */}
      <div className="categories-grid">
        <div className="category-item">
          <img src={BanhNgotImg} />
          <h4>Bánh Ngọt</h4>
        </div>
        <div className="category-item">
          <img src={CafeImg} />
          <h4>Cà Phê</h4>
        </div>
        <div className="category-item">
          <img src={Vuichoi} />
          <h4>Giải Trí</h4>
        </div>
        <div className="category-item">
          <img src={giaikhat} />
          <h4>Giải Khát</h4>
        </div>
      </div>

      {/* FEATURE */}
      <div className="featured-row">
        <div className="featured-text">
          <h2>Chào mừng đến Sakura</h2>
          <p>Không gian trà đạo Nhật Bản tinh tế</p>
          <button
            className="read-more-btn"
            onClick={() => navigate("/menu")}
          >
            XEM THỰC ĐƠN
          </button>
        </div>
        <div className="featured-promo">
          <img src={khongian} alt="Không gian" />
        </div>
      </div>
    </div>
  );
}
