import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const TransactionsPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="transaksi" />;
};

export default TransactionsPage;
