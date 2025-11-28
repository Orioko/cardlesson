import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/localAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    try {
        const user = getCurrentUser();
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        return <>{children}</>;
    } catch (error) {
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;

