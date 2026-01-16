import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Css/StaffOrder.css";

export default function StaffOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // --- CHAT STATE ---
  const [showChatModal, setShowChatModal] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); // State tìm kiếm
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Tải dữ liệu POS
  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get("http://localhost:3003/api/products"),
        axios.get("http://localhost:3003/api/categories"),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu POS:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Chat Logic (Polling mỗi 3 giây)
  const fetchChatData = async () => {
    try {
      const resCus = await axios.get("http://localhost:3003/api/messages/customers");
      setCustomers(
        resCus.data.map((c) => ({
          id: c.customer_phone,
          name: c.customer_name,
          phone: c.customer_phone,
        }))
      );

      if (selectedCustomerId) {
        const resHis = await axios.get(`http://localhost:3003/api/messages/history/${selectedCustomerId}`);
        setMessages((prev) => ({
          ...prev,
          [selectedCustomerId]: resHis.data.map((m) => ({
            text: m.message_text,
            image_url: m.image_url,
            type: m.sender_type,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          })),
        }));
      }
    } catch (err) {
      console.error("Lỗi tải chat:", err);
    }
  };

  useEffect(() => {
    let interval;
    if (showChatModal) {
      fetchChatData();
      interval = setInterval(fetchChatData, 3000);
    }
    return () => clearInterval(interval);
  }, [showChatModal, selectedCustomerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedCustomerId]);

  // 3. Gửi tin nhắn
  const handleReplyMessage = async (e, quickMsg = null) => {
    if (e) e.preventDefault();
    const textToSend = quickMsg || inputMessage;
    const file = fileInputRef.current?.files[0];

    if (!textToSend.trim() && !file) return;

    const currentCus = customers.find((c) => c.id === selectedCustomerId);
    const formData = new FormData();
    formData.append("customer_name", currentCus?.name || "Khách");
    formData.append("customer_phone", selectedCustomerId);
    formData.append("sender_type", "staff");
    formData.append("message_text", textToSend);
    if (file) formData.append("image", file);

    try {
      await axios.post("http://localhost:3003/api/messages/send", formData);
      setInputMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchChatData();
    } catch (err) {
      alert("Không gửi được tin nhắn!");
    }
  };

  // 4. Logic Giỏ hàng
  const addToCart = (p) => {
    const existing = cart.find((i) => i.product_id === p.product_id);
    if (existing) {
      setCart(cart.map((i) => (i.product_id === p.product_id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.product_id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Hàm lọc khách hàng dựa trên searchTerm
  const filteredCustomers = customers.filter(
    (cus) =>
      cus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cus.phone.includes(searchTerm)
  );

  return (
    <div className="pos-container">
      {/* --- BÊN TRÁI: GRID SẢN PHẨM --- */}
      <div className="pos-left">
        <div className="pos-nav">
          <div className="tabs">
            <button className={`tab-btn ${!activeCategoryId ? "active" : ""}`} onClick={() => setActiveCategoryId(null)}>
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                className={`tab-btn ${activeCategoryId === cat.category_id ? "active" : ""}`}
                onClick={() => setActiveCategoryId(cat.category_id)}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>
        <div className="pos-grid">
          {products &&
            products
              .filter((p) => !activeCategoryId || p.category_id === activeCategoryId)
              .map((p) => (
                <div key={p.product_id} className="pos-card" onClick={() => addToCart(p)}>
                  <div className="pos-img">
                    <img src={`http://localhost:3003${p.image}`} alt={p.name} />
                  </div>
                  <div className="pos-info">
                    <p className="name">{p.name}</p>
                    <p className="price">{Number(p.price).toLocaleString()}đ</p>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* --- BÊN PHẢI: GIỎ HÀNG --- */}
      <div className="pos-right">
        <div className="order-header">
          <h3>Đơn hàng tại quầy</h3>
          <button className="btn-clear" onClick={() => setCart([])}>Xóa hết</button>
        </div>
        <div className="order-list">
          {cart.length === 0 ? (
            <p className="empty-cart">Chưa có món nào</p>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="order-item">
                <div className="item-detail">
                  <span className="item-name">{item.name} x {item.qty}</span>
                </div>
                <div className="item-price-del">
                  <span>{(item.price * item.qty).toLocaleString()}đ</span>
                  <button className="btn-del-trash" onClick={() => removeFromCart(item.product_id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="order-footer">
          <div className="total-row">
            <span>Tổng cộng:</span>
            <span className="total-val">{total.toLocaleString()}đ</span>
          </div>
          <div className="footer-buttons">
            <button className="btn-unconfirmed" onClick={() => navigate("/staff/online-orders")}>🛍️ Đơn mới</button>
            <button className="btn-import" onClick={() => navigate("/staff/import-ingredients")}>📦 Nhập kho</button>
            <button className="btn-chat-toggle" onClick={() => setShowChatModal(true)}>💬 Tin nhắn</button>
            <button className="btn-pay">THANH TOÁN</button>
          </div>
        </div>
      </div>

      {/* --- MODAL CHAT --- */}
      {showChatModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal-content">
            <div className="chat-modal-header">
              <div className="header-info">
                <span className="online-dot"></span>
                <h3>Phản hồi khách hàng</h3>
              </div>
              <button className="close-x" onClick={() => setShowChatModal(false)}>×</button>
            </div>

            <div className="chat-layout">
              {/* CỘT TRÁI: DANH SÁCH KHÁCH HÀNG */}
              <div className="chat-sidebar">
                <div className="sidebar-search">
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc SĐT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="sidebar-list">
                  {filteredCustomers.length === 0 ? (
                    <p className="no-data">Không tìm thấy khách hàng</p>
                  ) : (
                    filteredCustomers.map((cus) => (
                      <div
                        key={cus.id}
                        className={`customer-item ${selectedCustomerId === cus.id ? "active" : ""}`}
                        onClick={() => setSelectedCustomerId(cus.id)}
                      >
                        <div className="avatar-circle">{(cus.name || "K").charAt(0)}</div>
                        <div className="cus-info">
                          <strong>{cus.name}</strong>
                          <p>{cus.phone}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT PHẢI: NỘI DUNG CHAT */}
              <div className="chat-main">
                {!selectedCustomerId ? (
                  <div className="empty-chat-state">
                    <div className="empty-icon">💬</div>
                    <p>Chọn một khách hàng để bắt đầu hỗ trợ</p>
                  </div>
                ) : (
                  <>
                    <div className="chat-messages" ref={scrollRef}>
                      {(messages[selectedCustomerId] || []).map((m, idx) => (
                        <div key={idx} className={`chat-bubble-row ${m.type === "staff" ? "staff" : "customer"}`}>
                          <div className="bubble">
                            {m.text && <p style={{ margin: 0 }}>{m.text}</p>}
                            {m.image_url && (
                              <img src={`http://localhost:3003${m.image_url}`} alt="sent" className="chat-img" />
                            )}
                            <span className="chat-time">{m.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form className="chat-input-form" onSubmit={handleReplyMessage}>
                      <div className="input-actions">
                        <label className="btn-icon">
                          📎
                          <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={() => handleReplyMessage()} />
                        </label>
                        <button type="button" className="btn-icon" onClick={() => handleReplyMessage(null, "👍")}>👍</button>
                      </div>
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                      />
                      <button type="submit" className="btn-send-chat">GỬI</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}