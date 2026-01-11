import React from "react";
import "./Css/ProductCard.css"; 

export default function ProductCard({ product, onAddToCart }) {
  const API_BASE = "http://localhost:3003";

  const title = product?.name || "Sản phẩm";
  const displayPrice = product?.price
    ? Number(product.price).toLocaleString("vi-VN")
    : "0";

  const handleAddToCart = () => {
    const user = JSON.parse(sessionStorage.getItem("user_session"));

    // ❌ CHƯA ĐĂNG NHẬP → KHÔNG CHO ADD
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
        price: product.price,
        quantity: 1,
        image: product.image
      });
    }

    localStorage.setItem("sakura_cart", JSON.stringify(cart));

    // cập nhật menu
    window.dispatchEvent(new Event("storage")); 

    if (onAddToCart) {
      onAddToCart(product.name);
    }
  };

  return (
    <div className="product-card">
      <div className="image-box">
        <img
          src={
            product?.image
              ? `${API_BASE}${product.image}`
              : "https://via.placeholder.com/150"
          }
          alt={title}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/150";
          }}
        />
        <div
          className="add-icon"
          onClick={handleAddToCart}
          style={{ cursor: "pointer" }}
        >
          +
        </div>
      </div>

      <div className="info-box">
        <h4>{title}</h4>
        <p className="desc">
          {product?.description || "Hương vị Sakura Café"}
        </p>

        <div className="price-row">
          <span className="price">{displayPrice} đ</span>
          <button className="buy-btn" onClick={handleAddToCart}>
            Chọn mua
          </button>
        </div>
      </div>
    </div>
  );
}
