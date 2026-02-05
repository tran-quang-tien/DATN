import React from "react";
import "./Css/ProductCard.css"; 

export default function ProductCard({ product, onAddToCart }) {
  const API_BASE = "http://localhost:3003";

  const title = product?.name || "Sản phẩm";

  // ===== FIX LOGIC GIẢM GIÁ =====
  const originalPrice = Number(product?.price || 0);

  const discountPercent =
    Array.isArray(product?.discount) && product.discount[0] > 0
      ? Number(product.discount[0])
      : 0;

  const hasDiscount = discountPercent > 0;

  const finalPrice = hasDiscount
    ? Math.round(originalPrice * (1 - discountPercent / 100))
    : originalPrice;
  // ==============================

  const handleAddToCart = () => {
    const user = JSON.parse(sessionStorage.getItem("user_session"));

    if (!user) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    let cart = JSON.parse(localStorage.getItem("sakura_cart")) || [];
    const existingItem = cart.find(
      item => item.product_id === product.product_id
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        product_id: product.product_id,
        name: product.name,
        price: finalPrice,          // ✅ GIÁ SAU GIẢM
        original_price: originalPrice,
        discount: discountPercent,
        quantity: 1,
        image: product.image
      });
    }

    localStorage.setItem("sakura_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage")); 

    if (onAddToCart) {
      onAddToCart(product.name);
    }
  };

  return (
    <div className="product-card">
      <div className="image-box">
        {/* BADGE GIẢM GIÁ */}
        {hasDiscount && (
          <div className="discount-badge">
            -{discountPercent}%
          </div>
        )}

        <img
          src={
            product?.image
              ? `${API_BASE}${product.image}`
              : "https://via.placeholder.com/300"
          }
          alt={title}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300";
          }}
        />

        <div className="add-icon" onClick={handleAddToCart}>+</div>
      </div>

      <div className="info-box">
        <h4>{title}</h4>
        <p className="desc">
          {product?.description || "Hương vị Sakura Café"}
        </p>

        <div className="price-row">
          <div className="price-container">
            {hasDiscount ? (
              <>
                <span className="price-old">
                  {originalPrice.toLocaleString("vi-VN")} đ
                </span>
                <span className="price-new">
                  {finalPrice.toLocaleString("vi-VN")} đ
                </span>
              </>
            ) : (
              <span className="price">
                {originalPrice.toLocaleString("vi-VN")} đ
              </span>
            )}
          </div>

          <button className="buy-btn" onClick={handleAddToCart}>
            Chọn mua
          </button>
        </div>
      </div>
    </div>
  );
}
