import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const DashboardPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="dashboard" />;
};

export default DashboardPage;
