import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute — redirects to login if no session exists.
 * Optionally checks for a specific role.
 */
export default function ProtectedRoute({ children, role }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (role && session.role !== role) {
    const redirectTo = session.role === 'farmer' ? '/farmer' : '/merchant';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
