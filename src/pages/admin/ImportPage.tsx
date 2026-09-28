import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const ImportPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="impor_santri" />;
};

export default ImportPage;
