import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

// ====== PAGES ======
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/Profile/Edit_Profile";
import UploadAvatar from "./pages/UploadAvatar";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// ====== STAFF ======
import StaffOrder from "./pages/StaffOrder";
import OnlineOrders from "./pages/OnlineOrders";
import ImportIngredients from "./pages/StaffImportIngredients"; // nếu chưa có thì tạo file rỗng

// ====== ADMIN ======
import AdminOrderHistory from "./Admin/AdminOrderHistory";
import ProductManagement from "./Admin/ProductManagement";
import AddProduct from "./Admin/AddProduct";
import AccountManagement from "./Admin/AccountManagement";
import AdminBooking from "./Admin/AdminBooking";

/* =======================
   ROUTE BẢO VỆ
======================= */

// Admin (role_id = 1)
const AdminRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem("user_session"));
  if (!user || user.role_id !== 1) {
    return <Navigate to="/Home" replace />;
  }
  return children;
};

// Staff (role_id = 2)
const StaffRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem("user_session"));
  if (!user || user.role_id !== 2) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  const location = useLocation();

  // Ẩn Header/Footer cho POS & Admin
  const isManagementPage =
    location.pathname.startsWith("/staff") ||
    location.pathname.startsWith("/admin");

  return (
    <>
      {!isManagementPage && <Header />}

      <Routes>
        {/* ===== DEFAULT ===== */}
        <Route path="/" element={<Navigate to="/Home" replace />} />

        {/* ===== PUBLIC ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/Home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/contact" element={<Contact />} />

        {/* ===== USER ===== */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/upload-avatar" element={<UploadAvatar />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* =======================
              STAFF POS
        ======================= */}
        <Route
          path="/staff/order"
          element={
            <StaffRoute>
              <StaffOrder />
            </StaffRoute>
          }
        />

        <Route
          path="/staff/online-orders"
          element={
            <StaffRoute>
              <OnlineOrders />
            </StaffRoute>
          }
        />

        <Route
          path="/staff/import-ingredients"
          element={
            <StaffRoute>
              <ImportIngredients />
            </StaffRoute>
          }
        />

        {/* =======================
              ADMIN
        ======================= */}
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrderHistory />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <ProductManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/products/add"
          element={
            <AdminRoute>
              <AddProduct />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/accounts"
          element={
            <AdminRoute>
              <AccountManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/bookings"
          element={
            <AdminRoute>
              <AdminBooking />
            </AdminRoute>
          }
        />

        {/* ===== NOT FOUND ===== */}
        <Route path="*" element={<Navigate to="/Home" replace />} />
      </Routes>

      {!isManagementPage && <Footer />}
    </>
  );
}
