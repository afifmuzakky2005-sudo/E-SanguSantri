import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const MutasiPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="riwayat" />;
};

export default MutasiPage;
