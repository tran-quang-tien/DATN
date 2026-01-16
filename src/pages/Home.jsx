import React, { useState, useEffect, useRef } from "react";
import "./Css/main.css";
import { sendMessageApi, getChatHistoryApi } from "../api/Api";

// Import hình ảnh
import BanhNgotImg from "./picture/bánh ngọt.png";
import CafeImg from "./picture/cafe rang.png";
import Vuichoi from "./picture/masoi.png";
import giaikhat from "./picture/giaikhat.png";
import khongian from "./picture/khonggianquan.png";

// --- COMPONENT DINO GAME (Giữ nguyên logic của bạn) ---
const DinoGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let gameSpeed = 5;
    let internalScore = 0;
    let animationId;
    let obstacles = [];
    
    const dino = { x: 50, y: 150, w: 40, h: 40, dy: 0, jumpF: 12, grav: 0.6, grounded: false };

    const createObstacle = () => {
      let h = Math.random() * 30 + 30;
      obstacles.push({ x: canvas.width, y: 200 - h, w: 20, h: h });
    };

    const handleKeyDown = (e) => {
      if (["Space", "ArrowUp"].includes(e.code)) {
        e.preventDefault(); 
        if (dino.grounded) {
          dino.dy = -dino.jumpF;
          dino.grounded = false;
        }
      }
    };

    const update = () => {
      if (isGameOver) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dino.dy += dino.grav;
      dino.y += dino.dy;
      if (dino.y + dino.h > 200) {
        dino.y = 200 - dino.h;
        dino.dy = 0;
        dino.grounded = true;
      }
      ctx.fillStyle = "#ffb7c5"; 
      ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
      ctx.fillStyle = "white";
      ctx.fillRect(dino.x + 25, dino.y + 10, 5, 5);
      if (Math.random() < 0.02 && (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300)) {
        createObstacle();
      }
      obstacles.forEach((obs, i) => {
        obs.x -= gameSpeed;
        ctx.fillStyle = "#535353";
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        if (dino.x < obs.x + obs.w && dino.x + dino.w > obs.x && dino.y < obs.y + obs.h && dino.y + dino.h > obs.y) {
          setIsGameOver(true);
        }
        if (obs.x < -20) {
          obstacles.splice(i, 1);
          internalScore++;
          setScore(internalScore);
          gameSpeed += 0.1;
        }
      });
      animationId = requestAnimationFrame(update);
    };
    window.addEventListener("keydown", handleKeyDown);
    update();
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [isGameOver]);

  const resetGame = () => { setIsGameOver(false); setScore(0); };

  return (
    <div className="game-wrapper">
      <div className="game-score-display">{score.toString().padStart(5, "0")}</div>
      <canvas ref={canvasRef} width="800" height="200" />
      {isGameOver && (
        <div className="game-over-overlay">
          <h3>GAME OVER</h3>
          <button className="read-more-btn" onClick={resetGame}>CHƠI LẠI</button>
        </div>
      )}
    </div>
  );
};

// --- MAIN HOME COMPONENT ---
export default function Home() {
  const [showGame, setShowGame] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [showStaffChat, setShowStaffChat] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const scrollRef = useRef(null);
  
  // Ref cho input chọn file ảnh
  const fileInputRef = useRef(null);

  const userSession = JSON.parse(localStorage.getItem("user")) || null;

  const [chatForm, setChatForm] = useState({
    name: userSession?.full_name || "",
    phone: userSession?.phone || "",
    message: ""
  });

  const [messages, setMessages] = useState([
    { id: 0, message_text: "Xin chào quý khách! Để lại thông tin để Sakura hỗ trợ nhé!", sender_type: "staff" }
  ]);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatting]);

  // --- LOGIC POLLING ---
  useEffect(() => {
    let interval;
    if (isChatting && chatForm.phone) {
      interval = setInterval(async () => {
        try {
          const history = await getChatHistoryApi(chatForm.phone);
          setMessages(history);
        } catch (error) {
          console.error("Lỗi cập nhật tin nhắn:", error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isChatting, chatForm.phone]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChatForm(prev => ({ ...prev, [name]: value }));
  };

  // 1. Nhấn nút bắt đầu trò chuyện (Đã sửa dùng FormData)
  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!chatForm.message.trim()) return;

    const formData = new FormData();
    formData.append('user_id', userSession?.user_id || '');
    formData.append('customer_name', chatForm.name);
    formData.append('customer_phone', chatForm.phone);
    formData.append('sender_type', "customer");
    formData.append('message_text', chatForm.message);

    try {
      await sendMessageApi(formData);
      setIsChatting(true);
      setChatForm(prev => ({ ...prev, message: "" }));
      const history = await getChatHistoryApi(chatForm.phone);
      setMessages(history);
    } catch (error) {
      alert("Lỗi khi bắt đầu chat!");
    }
  };

  // 2. Gửi thêm tin nhắn/ảnh/icon (Đã sửa dùng FormData)
  const sendMoreMessage = async (e, quickMsg = null) => {
    if (e) e.preventDefault();
    
    const textToSend = quickMsg || chatForm.message;
    const hasFile = fileInputRef.current?.files[0];

    if (!textToSend.trim() && !hasFile) return;

    const formData = new FormData();
    formData.append('user_id', userSession?.user_id || '');
    formData.append('customer_name', chatForm.name);
    formData.append('customer_phone', chatForm.phone);
    formData.append('sender_type', "customer");
    formData.append('message_text', textToSend);

    if (hasFile) {
      formData.append('image', hasFile);
    }

    try {
      await sendMessageApi(formData);
      setChatForm(prev => ({ ...prev, message: "" }));
      if (fileInputRef.current) fileInputRef.current.value = ""; // Xóa file sau khi gửi
      
      const history = await getChatHistoryApi(chatForm.phone);
      setMessages(history);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  return (
    <div className="home-container">
      
      {/* NÚT GIẢI TRÍ & LIÊN HỆ */}
      <div className="dino-float-bubble" onClick={() => setShowGame(true)}>
        <span>Giải trí</span> <span>🦖</span>
      </div>

      <div className="contact-fixed-wrapper">
        {showContactMenu && (
          <div className="contact-flyout-menu">
            <div className="menu-item" onClick={() => { setShowStaffChat(true); setShowContactMenu(false); }}>
              <span className="icon">👩‍💼</span>
              <span>Chat với nhân viên</span>
            </div>
            <hr className="menu-divider" />
            <a href="https://zalo.me/0123456789" target="_blank" rel="noreferrer" className="menu-item">
              <span className="icon">🔵</span>
              <span>Liên hệ Zalo</span>
            </a>
          </div>
        )}
        <div className="main-contact-btn" onClick={() => setShowContactMenu(!showContactMenu)}>
          <span>Liên hệ</span> 🎧
        </div>
      </div>

      {/* BOX CHAT ĐA NĂNG */}
      {showStaffChat && (
        <div className="staff-chat-container">
          <div className="staff-chat-header">
            <div className="header-info">
              <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="staff" className="staff-avatar-small" />
              <div className="header-text">
                <h4>Sakura Café Tư Vấn</h4>
                <p>Chat trực tiếp tại Website</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="header-icon-btn">☰</button>
              <button className="close-chat-btn" onClick={() => setShowStaffChat(false)}>×</button>
            </div>
          </div>

          {!isChatting ? (
            <form className="staff-chat-body" onSubmit={handleStartChat}>
              <p className="form-section-title">Thông tin cơ bản</p>
              <input type="text" name="name" placeholder="Nhập tên của bạn*" value={chatForm.name} onChange={handleInputChange} required />
              <input type="text" name="phone" placeholder="Nhập số điện thoại*" value={chatForm.phone} onChange={handleInputChange} required />
              <p className="form-section-title">Nội dung tư vấn</p>
              <textarea name="message" placeholder="Bạn cần giúp đỡ gì..." rows="3" value={chatForm.message} onChange={handleInputChange} required></textarea>
              <button type="submit" className="submit-chat-btn"><span>➤</span> BẮT ĐẦU TRÒ CHUYỆN</button>
            </form>
          ) : (
            <div className="chat-window-content">
              <div className="chat-messages-area" ref={scrollRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.sender_type === 'customer' ? 'user-msg' : 'bot-msg'}`}>
                    {/* Hiển thị chữ */}
                    {msg.message_text && <div>{msg.message_text}</div>}
                    
                    {/* Hiển thị ảnh nếu có */}
                    {msg.image_url && (
                      <img 
                        src={`http://localhost:3003${msg.image_url}`} 
                        alt="attachment" 
                        style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '5px' }} 
                      />
                    )}
                  </div>
                ))}
              </div>
              <form className="chat-input-footer" onSubmit={sendMoreMessage}>
                {/* Input chọn file ẩn */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={() => sendMoreMessage()} 
                />
                
                <input type="text" name="message" placeholder="Nhập nội dung..." value={chatForm.message} onChange={handleInputChange} autoComplete="off" />
                
                <div className="footer-icons">
                  <button type="button" onClick={() => sendMoreMessage(null, "👍")}>👍</button>
                  <button type="button" onClick={() => fileInputRef.current.click()}>📎</button>
                  <button type="submit" className="send-inline-btn">➤</button>
                </div>
              </form>
            </div>
          )}
          <div className="chat-footer-brand">Powered by Sakura</div>
        </div>
      )}

      {/* MODAL GAME */}
      {showGame && (
        <div className="game-modal">
          <div className="game-content">
            <button className="close-btn" onClick={() => setShowGame(false)}>×</button>
            <DinoGame />
          </div>
        </div>
      )}

      {/* NỘI DUNG TRANG CHỦ */}
      <div className="home-hero-banner">
        <div className="hero-overlay">
          <h1>Sakura Café</h1>
          <p>Hương vị trà đạo & cà phê nguyên bản Nhật Bản</p>
        </div>
      </div>

      <div className="categories-grid">
        <div className="category-item">
          <img src={BanhNgotImg} alt="Cake" />
          <div className="category-info"><h4>Bánh Ngọt Matcha</h4><p>Vị ngọt thanh tinh tế</p></div>
        </div>
        <div className="category-item">
          <img src={CafeImg} alt="Coffee" />
          <div className="category-info"><h4>Cà Phê Rang</h4><p>Đậm đà hương vị Việt</p></div>
        </div>
        <div className="category-item">
          <img src={Vuichoi} alt="Game" />
          <div className="category-info"><h4>Giải Trí</h4><p>Vui chơi thỏa thích</p></div>
        </div>
        <div className="category-item">
          <img src={giaikhat} alt="Drink" />
          <div className="category-info"><h4>Giải Khát</h4><p>Tươi mát tức thì</p></div>
        </div>
      </div>

      <div className="featured-row">
        <div className="featured-text">
          <h2>Chào mừng đến Sakura</h2>
          <p>Tận hưởng không gian trà đạo Nhật Bản giữa lòng thành phố.</p>
          <button className="read-more-btn">XEM THỰC ĐƠN</button>
        </div>
        <div className="featured-promo"><img src={khongian} alt="Space" /></div>
      </div>
    </div>
  );
}