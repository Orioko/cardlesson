import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/localAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  let user;
  try {
    user = getCurrentUser();
  } catch {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
