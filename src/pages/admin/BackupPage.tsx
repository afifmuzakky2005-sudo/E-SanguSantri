import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const BackupPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="backup" />;
};

export default BackupPage;
