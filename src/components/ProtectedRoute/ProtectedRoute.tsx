import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser, onAuthChange, type LocalUser } from '../../utils/localAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Следит за входом: если сессия истекла (сервер ответил 401), уводит на страницу входа.
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [user, setUser] = useState<LocalUser | null>(() => getCurrentUser());

  useEffect(() => onAuthChange(setUser), []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
