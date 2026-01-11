import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Css/StaffOrder.css"; 

export default function StaffOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [cart, setCart] = useState([]);
  const [unconfirmedCount, setUnconfirmedCount] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState(null); 

  // Tải dữ liệu menu
  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get("http://localhost:3003/api/products"),
        axios.get("http://localhost:3003/api/categories")
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    }
  };

  // Lấy số đơn mới từ Online
  const fetchUnconfirmed = async () => {
    try {
      const res = await axios.get("http://localhost:3003/api/orders/unconfirmed-count");
      setUnconfirmedCount(res.data.count || 0);
    } catch (err) {
      console.warn("Không lấy được số lượng đơn mới");
    }
  };

  useEffect(() => {
    fetchData();
    fetchUnconfirmed();
    const interval = setInterval(fetchUnconfirmed, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- LOGIC THANH TOÁN VÀ LƯU DATABASE ---
  const handlePayment = async () => {
    if (cart.length === 0) {
      alert("Vui lòng chọn món trước khi thanh toán!");
      return;
    }

    const confirmPay = window.confirm(`Xác nhận thanh toán ${total.toLocaleString()}đ?`);
    if (!confirmPay) return;

    try {
      const orderData = {
        total_amount: total,
        payment_method: "Tiền mặt",
        items: cart.map(item => ({
          product_id: item.product_id,
          qty: item.qty,         // ← ĐÃ SỬA: dùng "qty" để khớp với backend
          price: item.price
        }))
      };

      const response = await axios.post("http://localhost:3003/api/orders/at-counter", orderData);

      if (response.data.success) {
        alert("✅ Thanh toán thành công và đã lưu đơn hàng!");
        setCart([]); // Xóa giỏ hàng sau khi xong
      }
    } catch (err) {
      console.error("Lỗi thanh toán:", err);
      alert("❌ Lỗi: Không thể lưu đơn hàng. Vui lòng kiểm tra Server!");
    }
  };

  const filteredProducts = activeCategoryId 
    ? products.filter(p => p.category_id === activeCategoryId) 
    : products;

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.product_id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const decreaseQty = (productId) => {
    const item = cart.find(i => i.product_id === productId);
    if (item && item.qty > 1) {
      setCart(cart.map(i => i.product_id === productId ? { ...i, qty: i.qty - 1 } : i));
    } else {
      setCart(cart.filter(i => i.product_id !== productId));
    }
  };

  const removeItem = (productId) => {
    setCart(cart.filter(i => i.product_id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="pos-container">
      <div className="pos-left">
        <div className="pos-nav">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeCategoryId === null ? "active" : ""}`}
              onClick={() => setActiveCategoryId(null)}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button 
                key={cat.category_id} 
                className={`tab-btn ${activeCategoryId === cat.category_id ? "active" : ""}`}
                onClick={() => setActiveCategoryId(cat.category_id)}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
          
          <div 
            className={`btn-alert ${unconfirmedCount > 0 ? "has-order" : ""}`} 
            onClick={() => navigate("/online-orders")} 
          >
            🛍️ Đơn Mới: {unconfirmedCount}
          </div>
        </div>

        <div className="pos-grid">
          {filteredProducts.map((p) => (
            <div key={p.product_id} className="pos-card" onClick={() => addToCart(p)}>
              <div className="pos-img">
                <img 
                  src={`http://localhost:3003${p.image}`} 
                  alt={p.name} 
                  onError={(e) => {e.target.onerror = null; e.target.src="https://placehold.co/150x110?text=Sakura+Cafe"}} 
                />
              </div>
              <div className="pos-info">
                <p className="name">{p.name}</p>
                <p className="price">{Number(p.price).toLocaleString()}đ</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pos-right">
        <div className="order-header">
          <h3>Hóa đơn chờ</h3>
          <button className="btn-clear" onClick={() => setCart([])}>Xóa hết</button>
        </div>

        <div className="order-list">
          {cart.length === 0 ? <p className="empty-cart">Chưa chọn món</p> : 
            cart.map((item) => (
              <div key={item.product_id} className="order-item">
                <div className="item-main">
                  <p className="item-name">{item.name}</p>
                  <div className="qty-controls">
                    <button onClick={(e) => { e.stopPropagation(); decreaseQty(item.product_id); }}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}>+</button>
                  </div>
                </div>
                <div className="item-side">
                  <p className="item-price">{(item.price * item.qty).toLocaleString()}đ</p>
                  <button className="btn-del" onClick={(e) => { e.stopPropagation(); removeItem(item.product_id); }}>🗑️</button>
                </div>
              </div>
            ))
          }
        </div>

        <div className="order-footer">
          <div className="total-row">
            <span>Tổng tiền:</span>
            <span className="total-val">{total.toLocaleString()}đ</span>
          </div>
          <button className="btn-pay" onClick={handlePayment}>
            THANH TOÁN
          </button>
        </div>
      </div>
    </div>
  );
}