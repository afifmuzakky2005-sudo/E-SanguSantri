import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const QrPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="qrgeneratif" />;
};

export default QrPage;
