import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

// ====== PAGES (KHÁCH HÀNG) ======
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import News from "./pages/News"; 

import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/Profile/Edit_Profile";
import UploadAvatar from "./pages/UploadAvatar";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// ====== STAFF (NHÂN VIÊN) ======
import StaffOrder from "./pages/StaffOrder";
import OnlineOrders from "./pages/OnlineOrders";
import ImportIngredients from "./pages/StaffImportIngredients";

// ====== ADMIN (QUẢN TRỊ) ======
import AccountManagement from "./Admin/AccountManagement";
import ProductManagement from "./Admin/ProductManagement";
import AddProduct from "./Admin/AddProduct";
import AdminBooking from "./Admin/AdminBooking";
import AdminOrderHistory from "./Admin/AdminOrderHistory";
import AddNews from "./Admin/AddNews"; 
import NewsDetail from "./pages/NewsDetail";
import RevenueStats from "./Admin/RevenueStats";
import AdminPurchaseHistory from "./Admin/AdminPurchaseHistory";

// Admin (role_id = 1)
const AdminRoute = ({ children }) => {
  const data = sessionStorage.getItem("user_session");
  const user = data ? JSON.parse(data) : null;

  // Sử dụng != 1 để chấp nhận cả kiểu số 1 và kiểu chuỗi "1"
  if (!user || user.role_id != 1) {
    console.warn("Truy cập bị từ chối: Không phải Admin");
    return <Navigate to="/Home" replace />;
  }
  return children;
};

// Staff (role_id = 2)
const StaffRoute = ({ children }) => {
  const data = sessionStorage.getItem("user_session");
  const user = data ? JSON.parse(data) : null;

  if (!user || user.role_id != 2) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


  //  MAIN APP COMPONENT


export default function App() {
  const location = useLocation();

  // Ẩn Header/Footer khi vào các trang quản trị (Admin hoặc Staff)
  const isManagementPage =
    location.pathname.startsWith("/staff") ||
    location.pathname.startsWith("/admin");

  return (
    <>
      {/* Chỉ hiện Header nếu không phải trang quản lý */}
      {!isManagementPage && <Header />}

      <Routes>
        {/* ===== ĐIỀU HƯỚNG GỐC ===== */}
        <Route path="/" element={<Navigate to="/Home" replace />} />

        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />

        {/* ===== USER ROUTES (Yêu cầu đăng nhập thông thường) ===== */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/upload-avatar" element={<UploadAvatar />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* ===== STAFF ROUTES (POS) ===== */}
        <Route path="/staff/order" element={<StaffRoute><StaffOrder /></StaffRoute>} />
        <Route path="/staff/online-orders" element={<StaffRoute><OnlineOrders /></StaffRoute>} />
        <Route path="/staff/import-ingredients" element={<StaffRoute><ImportIngredients /></StaffRoute>} />

        {/* ===== ADMIN ROUTES (QUẢN TRỊ) ===== */}
        
        {/* Tự động chuyển /admin sang trang quản lý tài khoản để không bị trắng trang */}
        <Route path="/admin" element={<Navigate to="/admin/accounts" replace />} />

        <Route
          path="/admin/accounts"
          element={<AdminRoute><AccountManagement /></AdminRoute>}
        />
        <Route
          path="/admin/products"
          element={<AdminRoute><ProductManagement /></AdminRoute>}
        />
        <Route
          path="/admin/products/add"
          element={<AdminRoute><AddProduct /></AdminRoute>}
        />
        <Route
          path="/admin/bookings"
          element={<AdminRoute><AdminBooking /></AdminRoute>}
        />
        <Route
          path="/admin/orders"
          element={<AdminRoute><AdminOrderHistory /></AdminRoute>}
        />
        <Route
          path="/admin/news/add"
          element={<AdminRoute><AddNews /></AdminRoute>}
        />
        <Route
        path="/admin/revenue"
        element={<AdminRoute><RevenueStats/></AdminRoute>}
        />
         <Route
        path="/admin/purchases"
        element={<AdminRoute><AdminPurchaseHistory/></AdminRoute>}
        />
        {/* ===== NOT FOUND (404) ===== */}
        <Route path="*" element={<Navigate to="/Home" replace />} />
      </Routes>

      {/* Chỉ hiện Footer nếu không phải trang quản lý */}
      {!isManagementPage && <Footer />}
    </>
  );
}