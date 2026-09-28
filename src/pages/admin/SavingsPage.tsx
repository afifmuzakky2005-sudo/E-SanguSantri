import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const SavingsPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="datatabungan" />;
};

export default SavingsPage;
