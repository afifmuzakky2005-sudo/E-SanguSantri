import React from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

export const StudentsPage: React.FC<any> = (props) => {
  return <AdminPanel {...props} initialTab="datamaster" />;
};

export default StudentsPage;
