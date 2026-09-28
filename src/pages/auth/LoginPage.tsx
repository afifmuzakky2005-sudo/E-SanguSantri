import React from 'react';
import Login from '../../components/auth/Login';

interface LoginPageProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, pass: string) => boolean;
  logoUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = (props) => {
  return <Login {...props} />;
};

export default LoginPage;
