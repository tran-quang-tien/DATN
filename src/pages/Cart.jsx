import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Css/Cart.css";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("sakura_cart")) || [];
    setCart(savedCart);
  }, []);

  const updateQuantity = (id, delta) => {
    const newCart = cart.map(item =>
      item.product_id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    setCart(newCart);
    localStorage.setItem("sakura_cart", JSON.stringify(newCart));
  };

  const removeItem = (id) => {
    const newCart = cart.filter(item => item.product_id !== id);
    setCart(newCart);
    localStorage.setItem("sakura_cart", JSON.stringify(newCart));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-wrapper">
      <div className="cart-page">
        <h2 className="cart-title">🛒 GIỎ HÀNG CỦA BẠN</h2>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <p>Giỏ hàng trống</p>
            <button onClick={() => navigate("/menu")}>Đi mua sắm ngay</button>
          </div>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Tổng</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.product_id}>
                    <td className="product-name">{item.name}</td>
                    <td>{Number(item.price).toLocaleString()}đ</td>
                    <td>
                      <div className="qty-box">
                        <button onClick={() => updateQuantity(item.product_id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, 1)}>+</button>
                      </div>
                    </td>
                    <td className="total-price">
                      {(item.price * item.quantity).toLocaleString()}đ
                    </td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.product_id)}
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-footer">
              <div className="cart-total">
                Tổng tiền: <span>{totalAmount.toLocaleString()}đ</span>
              </div>
              <button
                className="checkout-btn"
                onClick={() => navigate("/checkout")}
              >
                THANH TOÁN
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
