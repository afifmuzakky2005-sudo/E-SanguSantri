import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const LogsPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="log_aktifitas" />;
};

export default LogsPage;
