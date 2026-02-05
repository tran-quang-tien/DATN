import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./styles/main.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./Admin/Sidebar";

/* ===== PAGES ===== */
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/Profile/Edit_Profile";
import UploadAvatar from "./pages/UploadAvatar";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Recruitment from "./components/Recruitment";
import ForgotPassword from "./pages/ForgotPassword";
import BookingHistory from "./components/BookingHistory";
import OrderHistory from "./components/OrderHistory";

/* ===== STAFF ===== */
import StaffOrder from "./pages/StaffOrder";
import OnlineOrders from "./pages/OnlineOrders";
import ImportIngredients from "./pages/StaffImportIngredients";

/* ===== ADMIN ===== */
import AccountManagement from "./Admin/AccountManagement";
import ProductManagement from "./Admin/ProductManagement";
import AddProduct from "./Admin/AddProduct";
import AdminBooking from "./Admin/AdminBooking";
import AdminOrderHistory from "./Admin/AdminOrderHistory";
import AddNews from "./Admin/AddNews";
import RevenueStats from "./Admin/RevenueStats";
import AdminPurchaseHistory from "./Admin/AdminPurchaseHistory";
import RecipeManagement from "./Admin/RecipeManagement";
import PackagingManagement from "./Admin/PackagingManagement";

/* ===== ROUTE GUARDS ===== */
const AdminRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem("user_session"));
  if (!user || user.role_id !== 1) return <Navigate to="/Home" replace />;
  return children;
};

const StaffRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem("user_session"));
  if (!user || user.role_id !== 2) return <Navigate to="/login" replace />;
  return children;
};

/* ===== MANAGEMENT LAYOUT (Có Sidebar) ===== */
const ManagementLayout = ({ children, isCollapsed, setIsCollapsed }) => (
  <div className={`admin-layout ${isCollapsed ? "collapsed" : ""}`}>
    <aside className="admin-sidebar">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
    </aside>
    <main className="admin-main">{children}</main>
  </div>
);

export default function App() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Kiểm tra trang quản lý nói chung
  const isManagementPage =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/staff");

  // Kiểm tra riêng trang Menu và Staff Order để ẩn Header/Footer/Sidebar
  const isMenuPage = location.pathname === "/menu";
  const isPOSLayout = 
  location.pathname === "/staff/order"
  location.pathname === "/staff/import-ingredients";
  location.pathname === "/staff/online-orders";
  return (
    <div className={(isManagementPage && !isPOSLayout) ? "is-management" : "is-customer"}>
      {/* Chỉ hiện Header cho khách, không hiện ở trang POS hoặc Admin */}
      {!isManagementPage &&!isPOSLayout && <Header />}

      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />

        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/Home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/recuiment" element={<Recruitment />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />

        {/* ===== USER ROUTES ===== */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/upload-avatar" element={<UploadAvatar />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/UserBokhis" element={<BookingHistory/>}/>
        <Route path="/UserOrderhis" element={<OrderHistory/>}/>
        {/* ===== STAFF ROUTES ===== */}

        <Route
          path="/staff/order"
          element={
            <StaffRoute>
              <div className="pos-full-screen">
                <StaffOrder />
              </div>
            </StaffRoute>
          }
        />
         <Route
          path="/staff/import-ingredients"
          element={
            <StaffRoute>
              <div className="pos-full-screen">
                <ImportIngredients />
              </div>
            </StaffRoute>
          }
        />
        <Route
          path="/staff/online-orders"
          element={
            <StaffRoute>
             <div className="pos-full-screen">
                <OnlineOrders />
              </div>
            </StaffRoute>
          }
        />

       

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin" element={<Navigate to="/admin/accounts" replace />} />

        {[
          ["/admin/accounts", <AccountManagement />],
          ["/admin/products", <ProductManagement />],
          ["/admin/products/add", <AddProduct />],
          ["/admin/bookings", <AdminBooking />],
          ["/admin/orders", <AdminOrderHistory />],
          ["/admin/news/add", <AddNews />],
          ["/admin/revenue", <RevenueStats />],
          ["/admin/purchases", <AdminPurchaseHistory />],
          ["/admin/recipes",<RecipeManagement/>],
          ["/admin/packaging",<PackagingManagement/>]
        ].map(([path, component]) => (
          <Route
            key={path}
            path={path}
            element={
              <AdminRoute>
                <ManagementLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                  {component}
                </ManagementLayout>
              </AdminRoute>
            }
          />
        ))}

        <Route path="*" element={<Navigate to="/Home" replace />} />
      </Routes>

      {/* Footer chỉ hiện ở trang khách, không hiện ở POS hoặc trang quản lý */}
      {!isManagementPage && !isMenuPage && !isPOSLayout && <Footer />}
    </div>
  );
}