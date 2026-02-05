export const API_BASE = "http://localhost:3003";
export const API_URL = "http://localhost:3003";
import axios from 'axios';
import { auth } from "../pages/Fire/firebase.JS";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
  const cleanId = (id) => {
    if (!id) return "";
    return String(id).trim().replace(/[^0-9]/g, ""); 
  };
  
  //hỗ trợ đăng nhập 
  // --- 1. HỆ THỐNG & ĐĂNG NHẬP ---

export const loginUser = async ({ account, password }) => { 
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, password }), 
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Đăng nhập thất bại");
  }
  return res.json();
}
export const checkRegisterInfo = async (userData) => {
    // Axios sẽ tự ném lỗi nếu status code là 400, 500...
    const response = await axios.post(`${API_URL}/api/register/check-exists`, userData);
    return response.data;
};

// 2. Gửi mã OTP qua Email
export const sendEmailOTP = async (emailData) => {
    const response = await axios.post(`${API_URL}/api/register/send-email-otp`, emailData);
    return response.data;
};

// 3. Xác thực mã OTP Email (Phải có cái này để trang Verify gọi)
export const verifyEmailOTPAPI = async (otpData) => {
    const response = await axios.post(`${API_URL}/api/register/verify-email-otp`, otpData);
    return response.data;
};

// 4. Lưu thông tin đăng ký cuối cùng vào SQL Server
export const completeRegistration = async (userData) => {
    const response = await axios.post(`${API_URL}/api/register/complete`, userData);
    return response.data;
};
// Gửi yêu cầu khôi phục qua Email
export const sendResetEmail = async (email) => {
    const response = await fetch(`${API_BASE}/api/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    return await response.json();
};

// Dùng cho trang đổi mật khẩu mới
export const updatePasswordInDB = async (data) => {
    const response = await fetch(`${API_BASE}/api/reset-password-db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return await response.json();
};
  // --- 2. QUẢN LÝ TÀI KHOẢN ---

 export const getUsers = async () => {
    const response = await fetch(`${API_BASE}/api/users`); 
    if (!response.ok) throw new Error("Lỗi tải danh sách người dùng");
    return await response.json();
};


 export const getUserById = async (userId) => {
  try {
    const cleanUserId = String(userId).split(':')[0].trim();  
    console.log("ID thực tế gửi đi:", cleanUserId); 
    const res = await fetch(`http://localhost:3003/api/users/${cleanUserId}`);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Không tìm thấy người dùng");
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi getUserById:", error);
    throw error;
  }
};

 export const updateUserProfile = async (userId, formData) => {
  const cleanUserId = String(userId).split(':')[0].trim();
  // THÊM /api VÀO ĐÂY
  const res = await fetch(`http://localhost:3003/api/users/${cleanUserId}`, {
    method: "PUT",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
  return data;
};

export const uploadAvatarApi = async (userId, formData) => {
  const cleanUserId = String(userId).split(':')[0].trim();
  // THÊM /api VÀO ĐÂY
  const res = await fetch(`http://localhost:3003/api/users/upload-avatar/${cleanUserId}`, {
    method: "PUT",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi tải ảnh");
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
        const response = await fetch(`${API_URL}/api/products`); 
        if (!response.ok) throw new Error("Lỗi mạng");
        return await response.json();
    } catch (error) {
        console.error("Lỗi getProducts:", error);
        throw error;
    }
};

  export const addProduct = async (formData) => {
    const res = await fetch(`${API_URL}/api/products`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Lỗi thêm sản phẩm");
    return res.json();
  };

export const updateProduct = async (productId, formData) => {

  if (formData.has("discount")) {
    const discount = formData.get("discount");
    formData.delete("discount");     
    formData.append("discount", discount); 
  }
  const res = await fetch(`${API_URL}/products/${productId}`, {
    method: "PUT",
    body: formData
  });
  if (!res.ok) throw new Error("Cập nhật thất bại");
  return res.json();
};

  export const deleteProduct = async (productId) => {
    const res = await fetch(`${API_URL}/api/products/${productId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Xóa sản phẩm thất bại");
    return res.json();
  };
export const createOrder = async (orderData) => {
  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData), // Chứa user_id, items (array), total_price...
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Đặt hàng thất bại");
    return data;
  } catch (error) {
    console.error("Lỗi createOrder:", error);
    throw error;
  }
};
  // --- 4. ĐẶT BÀN (BOOKING) ---

export const createBooking = async (bookingData) => {
  try {
    const res = await fetch(`${API_URL}/api/bookings`, {
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
  if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
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
    const response = await fetch(`${API_BASE}/api/staff/purchase-history`);
    if (!response.ok) throw new Error("Lỗi tải lịch sử nhập hàng");
    return await response.json();
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
   
    const res = await fetch(`${API_URL}/messages/send`, {
      method: "POST",
      body: formData, 
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
  // đánh dấu tin nhắn đã đọc
  export const markReadApi = async (phone) => {
  const res = await fetch(`${API_URL}/messages/mark-read/${phone}`, {
    method: "PUT", // Lưu ý dùng phương thức PUT để cập nhật
  });
  if (!res.ok) throw new Error("Lỗi đánh dấu đã đọc");
  return res.json();
};
  // --- 6. QUẢN LÝ TIN TỨC (NEWS) ---

// Lấy danh sách tất cả tin tức (Dùng cho trang chủ/trang news)
export const getNews = async () => {
  try {
    const res = await fetch(`${API_URL}/news`);
    if (!res.ok) throw new Error("Lỗi tải danh sách tin tức");
    return await res.json();
  } catch (error) {
    console.error("Lỗi getNews:", error);
    throw error;
  }
};

// Lấy chi tiết một bài viết theo ID
export const getNewsById = async (newsId) => {
  const res = await fetch(`${API_URL}/news/${newsId}`);
  if (!res.ok) throw new Error("Không tìm thấy bài viết");
  return res.json();
};

// Thêm bài viết mới (Dùng FormData để upload ảnh)
export const addNews = async (formData) => {
  const res = await fetch(`${API_URL}/news`, {
    method: "POST",
    body: formData, // FormData tự động xử lý Content-Type là multipart/form-data
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi khi đăng bài viết");
  return data;
};

// Xóa bài viết
export const deleteNews = async (newsId) => {
  const res = await fetch(`${API_URL}/news/${newsId}`, { 
    method: "DELETE" 
  });
  if (!res.ok) throw new Error("Xóa bài viết thất bại");
  return res.json();
};
// Hàm lấy lịch sử đơn hàng
export const getOrderHistory = async (userId) => {
    try {
        // 1. Làm sạch ID (xóa cái :1 nếu có)
        const cleanUserId = String(userId).split(':')[0].trim();
        
        // 2. Thêm /api vào đường dẫn
        const res = await fetch(`http://localhost:3003/api/user/order-history/${cleanUserId}`);
        
        if (!res.ok) throw new Error("Lỗi tải lịch sử đơn hàng");
        return await res.json();
    } catch (error) {
      console.error("Lỗi API getOrderHistory:", error);
        throw error;
    }
};

// Hàm lấy lịch sử đặt bàn
export const getBookingHistory = async (email) => {
    try {
        // Đảm bảo có /api
        const res = await fetch(`http://localhost:3003/api/user/booking-history/${email}`);
        
        if (!res.ok) throw new Error("Lỗi tải lịch sử đặt bàn");
        return await res.json();
    } catch (error) {
      console.error("Lỗi API getOrderHistory:", error);
        throw error;
    }
};

