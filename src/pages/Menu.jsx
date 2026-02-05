import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../api/Api";
import "./css/Menu.css";

const Menu = ({ updateCartCount }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const sectionRefs = useRef({});

  /* HELPER */
  const getDiscountValue = (discount) => {
    if (Array.isArray(discount)) return Number(discount[0] || 0);
    return Number(discount || 0);
  };

  /* LOAD DATA */
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error("Không lấy được menu:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /* AUTO SCROLL TỪ HOME */
  useEffect(() => {
    if (!location.state?.scrollTo) return;

    const target = location.state.scrollTo;

    setTimeout(() => {
      scrollToCategory(target);
    }, 300);
  }, [location.state]);

  /* CART COUNT */
  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem("sakura_cart")) || [];
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };
    window.addEventListener("storage", updateCount);
    updateCount();
    return () => window.removeEventListener("storage", updateCount);
  }, []);

  /* SALE */
  const saleProducts = products.filter(
    (item) => getDiscountValue(item.discount) > 0
  );

  /* GROUP CATEGORY */
  const groupedProducts = products.reduce((acc, item) => {
    const cat = item.category_name || "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  /* SCROLL */
  const scrollToCategory = (cat) => {
    const section = sectionRefs.current[cat];
    const container = document.querySelector(".menu-content");
    const header = container?.querySelector(".menu-header");

    if (!section || !container) return;

    const headerHeight = header ? header.offsetHeight : 0;

    container.scrollTo({
      top: section.offsetTop - headerHeight - 20,
      behavior: "smooth",
    });
  };

  /* ACTIVE CATEGORY */
  useEffect(() => {
    if (!products.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.dataset.category);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    Object.values(sectionRefs.current).forEach(
      (section) => section && observer.observe(section)
    );

    return () => observer.disconnect();
  }, [products]);

  if (loading) {
    return <div className="loading-screen">🌸 Đang tải menu...</div>;
  }

  return (
    <div className="sakura-menu-page">
      <div className="menu-container">

        {/* SIDEBAR */}
        <aside className="menu-sidebar">
          <div className="sidebar-sticky">
            <h3 className="sidebar-heading">DANH MỤC</h3>

            <nav className="nav-menu">
              {saleProducts.length > 0 && (
                <button
                  className={`nav-item sale-nav-link ${
                    activeCategory === "khuyen-mai" ? "active" : ""
                  }`}
                  onClick={() => scrollToCategory("khuyen-mai")}
                >
                  🔥 Khuyến mãi
                </button>
              )}

              {Object.keys(groupedProducts).map((cat) => (
                <button
                  key={cat}
                  className={`nav-item ${
                    activeCategory === cat ? "active" : ""
                  }`}
                  onClick={() => scrollToCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </nav>

            <div className="cart-summary">
              <p>Giỏ hàng: <strong>{cartCount}</strong> món</p>
              <button className="btn-cart" onClick={() => navigate("/cart")}>
                XEM GIỎ HÀNG
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="menu-content">
          <div className="menu-header">
            <h1>MENU SAKURA</h1>
            <p>Hương vị tinh hoa Nhật Bản</p>
          </div>

          {/* KHUYẾN MÃI */}
          {saleProducts.length > 0 && (
            <section
              data-category="khuyen-mai"
              ref={(el) => (sectionRefs.current["khuyen-mai"] = el)}
              className="category-group sale-section"
            >
              <h2 className="category-name sale-title">
                🔥 KHUYẾN MÃI HOT 🔥
              </h2>

              <div className="product-grid">
                {saleProducts.map((item) => (
                  <ProductCard
                    key={`sale-${item.product_id}`}
                    product={item}
                    onAddToCart={updateCartCount}
                  />
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY */}
          {Object.keys(groupedProducts).map((cat) => (
            <section
              key={cat}
              data-category={cat}
              ref={(el) => (sectionRefs.current[cat] = el)}
              className="category-group"
            >
              <h2 className="category-name">{cat}</h2>
              <div className="product-grid">
                {groupedProducts[cat].map((item) => (
                  <ProductCard
                    key={item.product_id}
                    product={item}
                    onAddToCart={updateCartCount}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

export default Menu;
