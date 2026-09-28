import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const SettingsPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="pengaturan" />;
};

export default SettingsPage;
