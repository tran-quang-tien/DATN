import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

import StaffOrder from './pages/StaffOrder';
import OnlineOrders from './pages/OnlineOrders'
import Login from "./pages/Login";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/menu";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/Profile/Edit_Profile";
import Register from "./pages/Register"; 
import VerifyEmail from "./pages/VerifyEmail";
import UploadAvatar from "./pages/UploadAvatar";
import Checkout from "./pages/Checkout";
import Cart from "./pages/Cart";

// IMPORT CÁC TRANG ADMIN & STAFF
import AdminOrderHistory from "./Admin/AdminOrderHistory";
import ProductManagement from "./Admin/ProductManagement";
import AddProduct from "./Admin/AddProduct";
import AccountManagement from "./Admin/AccountManagement";
import AdminBooking from "./Admin/AdminBooking";


// 1. Route bảo vệ cho Admin (Role 1)
const AdminRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem("user_session"));
  if (!user || user.role_id !== 1) { 
    return <Navigate to="/Home" replace />;
  }
  return children;
};

// 2. Route bảo vệ cho Nhân viên (Role 2)
const StaffRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem("user_session"));
  if (!user || user.role_id !== 2) { 
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  const location = useLocation();
  
  // Kiểm tra đường dẫn để ẩn Header/Footer
  // Thêm "/online-orders" vào danh sách ẩn nếu bạn muốn trang đó chuyên nghiệp như POS
  const isManagementPage = location.pathname.toLowerCase().startsWith("/admin") || 
                           location.pathname.toLowerCase().startsWith("/staff") ||
                           location.pathname.toLowerCase().startsWith("/online-orders");

  return (
    <>
      {!isManagementPage && <Header />}

      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace/>}/>
        
        {/* ROUTES CÔNG KHAI */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/Menu" element={<Menu />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* ROUTES NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP */}
        <Route path="/profile" element={<Profile />} /> 
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/upload-avatar" element={<UploadAvatar />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* --- ROUTE DÀNH RIÊNG CHO NHÂN VIÊN (ROLE 2) --- */}
        {/* Gom StaffOrder và OnlineOrders vào StaffRoute để bảo mật */}
        <Route path="/staff/order" element={
          <StaffRoute>
            <StaffOrder />
          </StaffRoute>
        } />

        <Route path="/online-orders" element={
          <StaffRoute>
            <OnlineOrders />
          </StaffRoute>
        } />

        {/* --- ROUTES DÀNH RIÊNG CHO ADMIN (ROLE 1) --- */}
        <Route path="/admin" element={
          <AdminRoute>
            <Navigate to="/admin/products" replace />
          </AdminRoute>
        } />
        
        <Route path="/admin/orders" element={<AdminRoute> <AdminOrderHistory /> </AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute> <AdminBooking /> </AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute> <ProductManagement /> </AdminRoute>} />
        <Route path="/admin/products/add" element={<AdminRoute> <AddProduct /> </AdminRoute>} />
        <Route path="/admin/accounts" element={<AdminRoute> <AccountManagement /> </AdminRoute>} />

        {/* ROUTE 404 */}
        <Route path="*" element={<Navigate to="/Home" replace />} />
      </Routes>

      {!isManagementPage && <Footer />}
    </>
  );
}