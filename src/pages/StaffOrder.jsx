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

  // --- TRẠNG THÁI MỚI: Hình thức & Thông báo ---
  const [orderType, setOrderType] = useState("Tại chỗ");
  const [alertBox, setAlertBox] = useState({ show: false, message: "", type: "success" });

  // --- CHAT & RECIPE STATE ---
  const [showChatModal, setShowChatModal] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState({});
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState({ name: "", ingredients: [], steps: [] });

  const [newOrderCount, setNewOrderCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Hàm hiển thị thông báo thay cho alert
  const showAlert = (msg, type = "success") => {
    setAlertBox({ show: true, message: msg, type: type });
    if (type === "success") {
      setTimeout(() => setAlertBox({ show: false, message: "", type: "success" }), 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedCustomerId]);

  // 1. Lấy dữ liệu POS
  const fetchData = async () => {
    try {
      const [prodRes, catRes, orderRes] = await Promise.all([
        axios.get("http://localhost:3003/api/products"),
        axios.get("http://localhost:3003/api/categories"),
        axios.get("http://localhost:3003/api/bookings"),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      const pendingOrders = (orderRes.data || []).filter((o) => o.status === "Chờ xác nhận").length;
      setNewOrderCount(pendingOrders);
    } catch (err) {
      console.error("Lỗi tải dữ liệu POS:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. Xem Công Thức
  const handleViewRecipe = async (e, product) => {
    e.stopPropagation();
    try {
      const [resRecipe, resSteps] = await Promise.all([
        axios.get(`http://localhost:3003/api/products/${product.product_id}/recipe`),
        axios.get(`http://localhost:3003/api/products/${product.product_id}/steps`),
      ]);
      setSelectedRecipe({
        name: product.name,
        ingredients: resRecipe.data,
        steps: resSteps.data
      });
      setShowRecipeModal(true);
    } catch (err) {
      showAlert("Món này chưa có công thức!", "error");
    }
  };

  // 3. Logic Chat
  const fetchChatData = async () => {
    try {
      const resCus = await axios.get("http://localhost:3003/api/messages/customers");
      const customerList = (resCus.data || []).map((c) => ({
        id: c.customer_phone,
        name: c.customer_name,
        phone: c.customer_phone,
        unread: c.unread_count || 0,
      }));
      setCustomers(customerList);
      setUnreadChatCount(customerList.reduce((sum, item) => sum + item.unread, 0));

      if (selectedCustomerId) {
        await axios.put(`http://localhost:3003/api/messages/mark-read/${selectedCustomerId}`).catch(() => {});
        const resHis = await axios.get(`http://localhost:3003/api/messages/history/${selectedCustomerId}`);
        const newMessages = (resHis.data || []).map((m) => ({
          text: m.message_text,
          type: m.sender_type,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setMessages((prev) => ({ ...prev, [selectedCustomerId]: newMessages }));
      }
    } catch (err) { console.error("Lỗi tải chat:", err); }
  };

  useEffect(() => {
    fetchChatData();
    const interval = setInterval(fetchChatData, 3000);
    return () => clearInterval(interval);
  }, [selectedCustomerId]);

  // 4. Giỏ hàng & Thanh toán
  const addToCart = (p) => {
    const disc = Number(p.discount || 0);
    const price = disc > 0 ? p.price * (1 - disc / 100) : p.price;
    const existing = cart.find((i) => i.product_id === p.product_id);
    if (existing) {
      setCart(cart.map((i) => (i.product_id === p.product_id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...p, qty: 1, sellPrice: price }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.product_id !== id));

  const totalMoney = cart.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);

  const handlePayment = async () => {
    if (cart.length === 0) return showAlert("Giỏ hàng đang trống!", "error");
    
    try {
      await axios.post("http://localhost:3003/api/orders/pos", { 
        items: cart, 
        total_amount: totalMoney, 
        payment_method: "Tiền mặt",
        order_type: orderType 
      });
      showAlert("Thanh toán thành công!");
      setCart([]);
      setOrderType("Tại chỗ");
    } catch (err) { 
      showAlert("Lỗi thanh toán: " + (err.response?.data?.error || "Lỗi kết nối"), "error"); 
    }
  };

  const handleReplyMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedCustomerId) return;
    const currentCus = customers.find((c) => c.id === selectedCustomerId);
    try {
      await axios.post("http://localhost:3003/api/messages/send", {
        customer_name: currentCus?.name || "Khách",
        customer_phone: selectedCustomerId,
        sender_type: "staff",
        message_text: inputMessage
      });
      setInputMessage("");
      fetchChatData();
    } catch (err) { showAlert("Gửi tin nhắn thất bại!", "error"); }
  };

  return (
    <div className="pos-container">
      {/* BOX THÔNG BÁO CUSTOM */}
      {alertBox.show && (
        <div className="custom-alert-overlay">
          <div className={`custom-alert-box ${alertBox.type}`}>
            <div className="alert-icon">{alertBox.type === 'success' ? '✅' : '❌'}</div>
            <p>{alertBox.message}</p>
            {alertBox.type === "error" && (
              <button className="btn-close-alert" onClick={() => setAlertBox({ ...alertBox, show: false })}>Đóng</button>
            )}
          </div>
        </div>
      )}

      {/* PHẦN BÊN TRÁI: DANH SÁCH SẢN PHẨM */}
      <div className="pos-left">
        <div className="pos-nav">
          <div className="tabs">
            <button className={`tab-btn ${!activeCategoryId ? "active" : ""}`} onClick={() => setActiveCategoryId(null)}>Tất cả</button>
            {categories.map((cat) => (
              <button key={cat.category_id} className={`tab-btn ${activeCategoryId === cat.category_id ? "active" : ""}`} onClick={() => setActiveCategoryId(cat.category_id)}>
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>
        <div className="pos-grid">
          {products.filter((p) => !activeCategoryId || p.category_id === activeCategoryId).map((p) => (
            <div key={p.product_id} className="pos-card" onClick={() => addToCart(p)}>
              {Number(p.discount) > 0 && <div className="pos-sale-badge">-{p.discount}%</div>}
              <button className="btn-view-recipe" onClick={(e) => handleViewRecipe(e, p)}>📜</button>
              <div className="pos-img"><img src={`http://localhost:3003${p.image}`} alt="" /></div>
              <div className="pos-info">
                <p className="name">{p.name}</p>
                <p className="price">{Number(p.price).toLocaleString()}đ</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PHẦN BÊN PHẢI: GIỎ HÀNG & THANH TOÁN */}
      <div className="pos-right">
        <div className="order-header">
          <h3>Đơn hàng tại quầy</h3>
          <button className="btn-clear" onClick={() => setCart([])}>Xóa hết</button>
        </div>
        <div className="order-list">
          {cart.length === 0 ? <p className="empty-cart">Chưa có món nào</p> : cart.map((item) => (
            <div key={item.product_id} className="order-item">
              <span>{item.name} x {item.qty}</span>
              <span>{(item.sellPrice * item.qty).toLocaleString()}đ</span>
              <button onClick={() => removeFromCart(item.product_id)}>🗑️</button>
            </div>
          ))}
        </div>

        <div className="order-footer">
          <div className="total-row">
            <span>Tổng cộng:</span>
            <span className="total-val">{totalMoney.toLocaleString()}đ</span>
          </div>

          {/* CHỌN HÌNH THỨC */}
          <div className="order-type-selector">
            <button 
              className={`type-btn ${orderType === "Tại chỗ" ? "active-store" : ""}`}
              onClick={() => setOrderType("Tại chỗ")}
            >
              🏠 Tại chỗ
            </button>
            <button 
              className={`type-btn ${orderType === "Mang về" ? "active-away" : ""}`}
              onClick={() => setOrderType("Mang về")}
            >
              🛍️ Mang về
            </button>
          </div>

          <div className="footer-buttons">
            <button className="btn-unconfirmed" onClick={() => navigate("/staff/online-orders")}>
              🛍️ Đơn mới {newOrderCount > 0 && <span className="badge-count">{newOrderCount}</span>}
            </button>
            {/* NÚT NHẬP KHO ĐÃ QUAY LẠI */}
            <button className="btn-import-stock" onClick={() => navigate("/staff/import-ingredients")}>
              📦 Nhập kho
            </button>
            <button className="btn-chat-toggle" onClick={() => setShowChatModal(true)}>
              💬 Chat {unreadChatCount > 0 && <span className="badge-count chat-badge">{unreadChatCount}</span>}
            </button>
            <button className="btn-pay" onClick={handlePayment}>XÁC NHẬN THANH TOÁN</button>
          </div>
        </div>
      </div>

      {/* MODAL CÔNG THỨC */}
      {showRecipeModal && (
        <div className="chat-modal-overlay">
          <div className="recipe-modal-content">
            <div className="chat-modal-header">
              <h3>📖 Công thức: {selectedRecipe.name}</h3>
              <button className="close-x" onClick={() => setShowRecipeModal(false)}>×</button>
            </div>
            <div className="recipe-body">
              <div className="recipe-section">
                <h4>🍱 Nguyên liệu:</h4>
                <table className="recipe-table">
                  <thead>
                    <tr><th>Nguyên liệu</th><th>Lượng</th><th>Đơn vị</th></tr>
                  </thead>
                  <tbody>
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <tr key={i}><td>{ing.ingredient_name}</td><td>{ing.amount}</td><td>{ing.unit}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="recipe-section">
                <h4>👨‍🍳 Các bước:</h4>
                <div className="steps-container">
                  {selectedRecipe.steps.map((s, i) => (
                    <div key={i} className="step-row">
                      <strong>B{s.step_number}:</strong> <span>{s.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHAT */}
      {showChatModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal-content">
            <div className="chat-modal-header">
              <h3>Hỗ trợ khách hàng</h3>
              <button className="close-x" onClick={() => setShowChatModal(false)}>×</button>
            </div>
            <div className="chat-layout">
              <div className="chat-sidebar">
                <div className="sidebar-list">
                  {customers.map((cus) => (
                    <div key={cus.id} className={`customer-item ${selectedCustomerId === cus.id ? "active" : ""}`} onClick={() => setSelectedCustomerId(cus.id)}>
                      <strong>{cus.name}</strong>
                      {cus.unread > 0 && <span className="unread-dot">{cus.unread}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="chat-main">
                <div className="chat-messages">
                  {(messages[selectedCustomerId] || []).map((m, idx) => (
                    <div key={idx} className={`chat-bubble-row ${m.type === "staff" ? "staff" : "customer"}`}>
                      <div className="bubble">{m.text} <small>{m.time}</small></div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form className="chat-input-form" onSubmit={handleReplyMessage}>
                  <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Nhập tin nhắn..." />
                  <button type="submit">GỬI</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}