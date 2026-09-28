import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../../components/auth/Login';
import { User } from '../../types';

interface LoginPageProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, pass: string) => boolean;
  logoUrl?: string;
  loggedInAdmin?: User | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ isOpen, onClose, onLogin, logoUrl, loggedInAdmin }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedInAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [loggedInAdmin, navigate]);

  return (
    <Login 
      isOpen={isOpen}
      onClose={() => {
        if (onClose) onClose();
        navigate('/portal');
      }}
      logoUrl={logoUrl}
      onLogin={(u, p) => {
        const success = onLogin(u, p);
        if (success) {
          navigate('/admin/dashboard', { replace: true });
        }
        return success;
      }}
    />
  );
};

export default LoginPage;
