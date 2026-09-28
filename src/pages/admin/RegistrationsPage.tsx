import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const RegistrationsPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="pendaftaran" />;
};

export default RegistrationsPage;
