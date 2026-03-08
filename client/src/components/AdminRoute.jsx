import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}
