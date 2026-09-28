import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const LaporanPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="laporan" />;
};

export default LaporanPage;
