import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const UsersPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="akun_pengguna" />;
};

export default UsersPage;
