import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const isAuth = isAuthenticated();
    const userRole = getUserRole();

    // Not authenticated - redirect to login
    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated but role not allowed - redirect to appropriate dashboard
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to user's own dashboard
        switch (userRole) {
            case 'admin':
                return <Navigate to="/admin" replace />;
            case 'teacher':
                return <Navigate to="/teacher" replace />;
            case 'student':
                return <Navigate to="/student" replace />;
            default:
                return <Navigate to="/login" replace />;
        }
    }

    // Authenticated and authorized
    return children;
};

export default ProtectedRoute;
