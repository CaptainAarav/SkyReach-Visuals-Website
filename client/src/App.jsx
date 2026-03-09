import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import GetStarted from './pages/GetStarted.jsx';
import BookNow from './pages/BookNow.jsx';
import Quote from './pages/Quote.jsx';
import QuickPay from './pages/QuickPay.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import AdminLoginVerify from './pages/AdminLoginVerify.jsx';
import BookingPay from './pages/BookingPay.jsx';
import BookingSuccess from './pages/BookingSuccess.jsx';
import Orders from './pages/Orders.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import BookingDetail from './pages/dashboard/BookingDetail.jsx';
import Profile from './pages/dashboard/Profile.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminAccounts from './pages/admin/AdminAccounts.jsx';
import AdminMessages from './pages/admin/AdminMessages.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminLogs from './pages/admin/AdminLogs.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Navigate to="/#services" replace />} />
        <Route path="/gallery" element={<Navigate to="/#portfolio" replace />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/quick-pay" element={<QuickPay />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/admin-login-verify" element={<AdminLoginVerify />} />

        <Route path="/book" element={
          <ProtectedRoute><BookNow /></ProtectedRoute>
        } />
        <Route path="/booking/pay/:bookingId" element={
          <ProtectedRoute><BookingPay /></ProtectedRoute>
        } />
        <Route path="/booking/success" element={
          <ProtectedRoute><BookingSuccess /></ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute><Orders /></ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/dashboard/bookings/:id" element={
          <ProtectedRoute><BookingDetail /></ProtectedRoute>
        } />
        <Route path="/dashboard/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute><AdminLayout /></AdminRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
      </Route>
    </Routes>
  );
}
