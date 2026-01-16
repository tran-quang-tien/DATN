import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Css/StaffOrder.css";

export default function StaffOrder() {
  const navigate = useNavigate();

  // POS
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // CHAT
  const [showChatModal, setShowChatModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // ================== LOAD POS DATA ==================
  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get("http://localhost:3003/api/products"),
        axios.get("http://localhost:3003/api/categories")
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Lỗi tải POS:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================== CHAT DATA ==================
  const fetchChatData = async () => {
    try {
      // 1. Danh sách khách
      const resCus = await axios.get(
        "http://localhost:3003/api/messages/customers"
      );

      const mapped = resCus.data.map(c => ({
        id: c.customer_phone,
        name: c.customer_name || "Khách",
        phone: c.customer_phone
      }));

      setCustomers(mapped);

      // Auto chọn khách đầu tiên
      if (!selectedCustomerId && mapped.length > 0) {
        setSelectedCustomerId(mapped[0].id);
        return;
      }

      // 2. Lịch sử chat
      if (selectedCustomerId) {
        const resHis = await axios.get(
          `http://localhost:3003/api/messages/history/${selectedCustomerId}`
        );

        setMessages(prev => ({
          ...prev,
          [selectedCustomerId]: resHis.data.map(m => ({
            text: m.message_text,
            image_url: m.image_url,
            type: m.sender_type, // staff | customer
            time: new Date(m.created_at).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit"
            })
          }))
        }));
      }
    } catch (err) {
      console.error("❌ Lỗi tải chat:", err);
    }
  };

  // Polling chat
  useEffect(() => {
    let interval;
    if (showChatModal) {
      fetchChatData();
      interval = setInterval(fetchChatData, 3000);
    }
    return () => clearInterval(interval);
  }, [showChatModal, selectedCustomerId]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedCustomerId]);

  // ================== SEND MESSAGE ==================
  const handleReplyMessage = async e => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    const text = inputMessage.trim();
    const file = fileInputRef.current?.files[0];
    if (!text && !file) return;

    const cus = customers.find(c => c.id === selectedCustomerId);

    const formData = new FormData();
    formData.append("customer_name", cus?.name || "Khách");
    formData.append("customer_phone", selectedCustomerId);
    formData.append("sender_type", "staff");
    formData.append("message_text", text);
    if (file) formData.append("image", file);

    try {
      await axios.post(
        "http://localhost:3003/api/messages/send",
        formData
      );
      setInputMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchChatData();
    } catch {
      alert("Không gửi được tin nhắn");
    }
  };

  // ================== CART ==================
  const addToCart = p => {
    const exist = cart.find(i => i.product_id === p.product_id);
    if (exist) {
      setCart(
        cart.map(i =>
          i.product_id === p.product_id ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
  };

  const removeFromCart = id => {
    setCart(cart.filter(i => i.product_id !== id));
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // ================== UI ==================
  return (
    <div className="pos-container">
      {/* LEFT */}
      <div className="pos-left">
        <div className="pos-nav">
          <button
            className={`tab-btn ${!activeCategoryId ? "active" : ""}`}
            onClick={() => setActiveCategoryId(null)}
          >
            Tất cả
          </button>
          {categories.map(c => (
            <button
              key={c.category_id}
              className={`tab-btn ${
                activeCategoryId === c.category_id ? "active" : ""
              }`}
              onClick={() => setActiveCategoryId(c.category_id)}
            >
              {c.category_name}
            </button>
          ))}
        </div>

        <div className="pos-grid">
          {products
            .filter(p => !activeCategoryId || p.category_id === activeCategoryId)
            .map(p => (
              <div
                key={p.product_id}
                className="pos-card"
                onClick={() => addToCart(p)}
              >
                <img src={`http://localhost:3003${p.image}`} alt={p.name} />
                <p>{p.name}</p>
                <span>{Number(p.price).toLocaleString()}đ</span>
              </div>
            ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="pos-right">
        <h3>Đơn hàng tại quầy</h3>

        <div className="order-list">
          {cart.length === 0 ? (
            <p className="empty-cart">Chưa có món</p>
          ) : (
            cart.map(i => (
              <div key={i.product_id} className="order-item">
                <span>
                  {i.name} x {i.qty}
                </span>
                <span>
                  {(i.price * i.qty).toLocaleString()}đ
                  <button onClick={() => removeFromCart(i.product_id)}>
                    🗑️
                  </button>
                </span>
              </div>
            ))
          )}
        </div>

        <div className="order-footer">
          <strong>Tổng: {total.toLocaleString()}đ</strong>
          <div className="footer-buttons">
            <button onClick={() => navigate("/staff/online-orders")}>
              🛍️ Đơn mới
            </button>
            <button onClick={() => navigate("/staff/import-ingredients")}>
              📦 Nhập kho
            </button>
            <button onClick={() => setShowChatModal(true)}>
              💬 Tin nhắn
            </button>
            <button className="btn-pay">THANH TOÁN</button>
          </div>
        </div>
      </div>

      {/* CHAT MODAL */}
      {showChatModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-header">
              <h3>Tin nhắn khách hàng</h3>
              <button onClick={() => setShowChatModal(false)}>×</button>
            </div>

            <div className="chat-body">
              <div className="chat-customer-list">
                {customers.map(c => (
                  <div
                    key={c.id}
                    className={`chat-customer ${
                      selectedCustomerId === c.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedCustomerId(c.id)}
                  >
                    <strong>{c.name}</strong>
                    <span>{c.phone}</span>
                  </div>
                ))}
              </div>

              <div className="chat-box">
                <div className="chat-messages" ref={scrollRef}>
                  {(messages[selectedCustomerId] || []).map((m, i) => (
                    <div key={i} className={`chat-msg ${m.type}`}>
                      {m.text && <p>{m.text}</p>}
                      {m.image_url && (
                        <img
                          src={`http://localhost:3003${m.image_url}`}
                          alt=""
                        />
                      )}
                      <span>{m.time}</span>
                    </div>
                  ))}
                </div>

                <form className="chat-input" onSubmit={handleReplyMessage}>
                  <input
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                  />
                  <input type="file" ref={fileInputRef} hidden />
                  <button type="submit">Gửi</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
