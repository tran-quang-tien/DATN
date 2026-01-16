import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../api/Api";
import "./Css/Menu.css";

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  const sectionRefs = useRef({});
  const contentRef = useRef(null);

  const getUser = () => {
    return JSON.parse(sessionStorage.getItem("user_session"));
  };

  const updateCartCount = () => {
    const user = getUser();
    if (!user) {
      setTotalItems(0);
      return;
    }
    const cart = JSON.parse(localStorage.getItem("sakura_cart")) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setTotalItems(count);
  };

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data || []);
      setLoading(false);
    });

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  const handleAddToCartNotify = () => {
    updateCartCount();
  };

  const groupedProducts = products.reduce((acc, product) => {
    const catName = product.category_name || "Món khác";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(product);
    return acc;
  }, {});

  if (loading) return <div className="loading-spinner">🌸 Đang tải menu...</div>;

  return (
    <div className="sakura-modern-page">
      {/* 1. THANH TRẠNG THÁI CỐ ĐỊNH */}
      <div className="order-status-fixed-container">
        <div className="order-status-bar">
          <div className="status-content">
            <span className="status-text">🌸 Sakura Café đang phục vụ</span>

            {getUser() ? (
              <button
                className="order-count-pill"
                onClick={() => navigate("/cart")}
              >
                Tổng số món bạn đang đặt: <strong>{totalItems}</strong>
              </button>
            ) : (
              <button
                className="order-count-pill"
                onClick={() => navigate("/login")}
              >
                Đăng nhập để đặt món
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. LAYOUT CHÍNH */}
      <div className="sakura-main-layout">
        {/* SIDEBAR BÊN TRÁI */}
        <aside className="sakura-left-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">DANH MỤC</h3>
            <nav className="sidebar-nav">
              {Object.keys(groupedProducts).map((cat) => (
                <button
                  key={cat}
                  className="nav-btn"
                  onClick={() => {
                    const container = contentRef.current;
                    const target = sectionRefs.current[cat];

                    if (container && target) {
                      const top = target.offsetTop - container.offsetTop;
                      container.scrollTo({
                        top,
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  🌸 {cat}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* NỘI DUNG CUỘN BÊN PHẢI */}
        <main className="sakura-right-content" ref={contentRef}>
          {Object.keys(groupedProducts).map((cat) => (
            <section
              key={cat}
              ref={(el) => (sectionRefs.current[cat] = el)}
              className="menu-section"
            >
              <h2 className="section-title">{cat}</h2>
              <div className="product-grid-container">
                {groupedProducts[cat].map((item) => (
                  <ProductCard
                    key={item.product_id}
                    product={item}
                    onAddToCart={handleAddToCartNotify}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}