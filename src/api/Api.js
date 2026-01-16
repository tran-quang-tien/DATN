const API_URL = "http://localhost:3003/api";
import axios from 'axios';
// Hàm bổ trợ để dọn dẹp ID (tránh lỗi dính dấu : hoặc ký tự lạ)
const cleanId = (id) => {
  if (!id) return "";
  return String(id).trim().replace(/[^0-9]/g, ""); // Chỉ giữ số, loại bỏ mọi ký tự lạ
};

// --- 1. HỆ THỐNG & ĐĂNG NHẬP ---

export const loginUser = async (credentials) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
  return data;
};

export const registerUser = async (userData) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
  return data;
};

export const verifyOTP = async (verifyData) => {
  const res = await fetch(`${API_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(verifyData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Xác thực OTP thất bại");
  return data;
};

// --- 2. QUẢN LÝ TÀI KHOẢN ---

export const getUsers = async () => {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error("Lỗi tải danh sách người dùng");
  return res.json();
};

// === ĐÃ SỬA: getUserById (fix lỗi 404) ===
export const getUserById = async (userId) => {
  try {
    const cleanUserId = cleanId(userId);
    if (!cleanUserId) throw new Error("ID người dùng không hợp lệ");

    const res = await fetch(`${API_URL}/users/${cleanUserId}`);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || "Không tìm thấy người dùng");
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi getUserById:", error);
    throw error;
  }
};

export const uploadAvatarApi = async (userId, formData) => {
  const cleanUserId = cleanId(userId);
  const res = await fetch(`${API_URL}/users/upload-avatar/${cleanUserId}`, {
    method: "PUT",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi tải ảnh");
  return data;
};

export const updateUserProfile = async (userId, formData) => {
  const cleanUserId = cleanId(userId);
  const res = await fetch(`${API_URL}/users/${cleanUserId}`, {
    method: "PUT",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
  return data;
};

export const updateUserStatus = async (userId, roleId) => {
  const cleanUserId = cleanId(userId);
  const res = await fetch(`${API_URL}/users/status/${cleanUserId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role_id: roleId }),
  });
  return res.json();
};

export const deleteUser = async (userId) => {
  const cleanUserId = cleanId(userId);
  const res = await fetch(`${API_URL}/users/${cleanUserId}`, { method: "DELETE" });
  return res.json();
};

// --- 3. QUẢN LÝ SẢN PHẨM ---

export const getProducts = async () => {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Lỗi mạng");
    return await res.json();
  } catch (error) {
    console.error("Lỗi Api.js:", error);
    throw error;
  }
};

export const addProduct = async (formData) => {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Lỗi thêm sản phẩm");
  return res.json();
};

export const updateProduct = async (productId, formData) => {
  const res = await fetch(`${API_URL}/products/${productId}`, {
    method: "PUT",
    body: formData,
  });
  if (!res.ok) throw new Error("Cập nhật thất bại");
  return res.json();
};

export const deleteProduct = async (productId) => {
  const res = await fetch(`${API_URL}/products/${productId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa sản phẩm thất bại");
  return res.json();
};

// --- 4. ĐẶT BÀN (BOOKING) ---

export const createBooking = async (bookingData) => {
  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    const data = await res.json();

    if (!res.ok) {
      return { 
        success: false, 
        message: data.message || data.error || "Đặt bàn thất bại" 
      };
    }

    return { success: true, ...data };
    
  } catch (error) {
    return { 
      success: false, 
      message: "Không thể kết nối đến máy chủ" 
    };
  }
};

export const getAllBookings = async () => {
  const res = await fetch(`${API_URL}/bookings`);
  if (!res.ok) throw new Error("Lỗi tải danh sách");
  return res.json();
};

export const updateBookingStatus = async (bookingId, status, reason = "") => {
  const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reason }),
  });
  return res.json();
};

export const deleteBooking = async (bookingId) => {
  const res = await fetch(`${API_URL}/bookings/${bookingId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa đơn thất bại");
  return res.json();
};
// --- 5. QUẢN LÝ NHẬP KHO (STAFF) ---

export const getIngredients = async () => {
  const res = await fetch(`${API_URL}/staff/ingredients`);
  if (!res.ok) throw new Error("Lỗi tải danh sách nguyên liệu");
  return res.json();
};

export const createPurchaseOrder = async (orderData) => {
  const res = await fetch(`${API_URL}/staff/purchase-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lỗi nhập kho");
  return data;
};

export const getPurchaseHistory = async () => {
  const res = await fetch(`${API_URL}/staff/purchase-orders`);
  if (!res.ok) throw new Error("Lỗi tải lịch sử nhập hàng");
  return res.json();
};
// 1. Lấy danh sách nguyên liệu
export const getStaffIngredients = async () => {
    const res = await axios.get(`${API_URL}/staff/ingredients`);
    return res.data;
};

// 2. Nút "Lưu dữ liệu" trong Modal (Thêm món mới)

export const addIngredient = async (data) => {
    const res = await axios.post(`${API_URL}/ingredients`, data);
    return res.data;
};

// 3. Nút Cập nhật giá gốc
export const updateIngredientPrice = async (id, price) => {
    const res = await axios.put(`${API_URL}/ingredients/${id}/price`, { import_price: price });
    return res.data;
};

// 4. Nút "HOÀN THÀNH" (Lưu phiếu nhập)
export const createStaffPurchaseOrder = async (payload) => {
    const res = await axios.post(`${API_URL}/staff/purchase-orders`, payload);
    return res.data;
};
// --- . QUẢN LÝ TIN NHẮN (CHAT) ---

// Gửi tin nhắn mới (Dùng cho cả Khách và Nhân viên)
export const sendMessageApi = async (formData) => {
  // formData phải chứa: user_id, customer_name, customer_phone, sender_type, message_text, và file 'image'
  const res = await fetch(`${API_URL}/messages/send`, {
    method: "POST",
    body: formData, // Không để Content-Type là application/json vì dùng FormData
  });
  if (!res.ok) throw new Error("Gửi tin nhắn thất bại");
  return res.json();
};

// Lấy lịch sử chat dựa trên số điện thoại khách hàng
export const getChatHistoryApi = async (phone) => {
  const res = await fetch(`${API_URL}/messages/history/${phone}`);
  if (!res.ok) throw new Error("Lỗi tải lịch sử tin nhắn");
  return res.json();
};

// Lấy danh sách tất cả khách hàng đã nhắn tin (Dùng cho Staff Sidebar)
export const getChatCustomersApi = async () => {
  const res = await fetch(`${API_URL}/messages/customers`);
  if (!res.ok) throw new Error("Lỗi tải danh sách khách hàng chat");
  return res.json();
};