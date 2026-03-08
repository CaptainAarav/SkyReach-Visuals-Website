import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import Quote from './pages/Quote.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BookingCheckout from './pages/BookingCheckout.jsx';
import BookingSuccess from './pages/BookingSuccess.jsx';
import Orders from './pages/Orders.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import BookingDetail from './pages/dashboard/BookingDetail.jsx';
import Profile from './pages/dashboard/Profile.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminAccounts from './pages/admin/AdminAccounts.jsx';
import AdminMessages from './pages/admin/AdminMessages.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Navigate to="/#services" replace />} />
        <Route path="/gallery" element={<Navigate to="/#portfolio" replace />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/booking/:packageSlug" element={
          <ProtectedRoute><BookingCheckout /></ProtectedRoute>
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
          <Route index element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="reviews" element={<AdminReviews />} />
        </Route>
      </Route>
    </Routes>
  );
}
