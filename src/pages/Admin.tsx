import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminPanel } from '@/components/admin/AdminPanel';

const Admin = () => {
  const { isAdminAuthenticated } = useAdmin();

  return isAdminAuthenticated ? <AdminPanel /> : <AdminLogin />;
};

export default Admin;