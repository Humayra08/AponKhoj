import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ProtectedRoute — guards authenticated user routes.
 * - While loading auth state → render nothing
 * - Not authenticated        → /login
 * - Authenticated            → render children
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return children;
}
