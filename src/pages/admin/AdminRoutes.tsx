import { Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from '../../contexts/AdminAuthContext';
import RequireAdmin from '../../components/RequireAdmin';
import Admin from './Admin';
import AdminLogin from './AdminLogin';

export default function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<RequireAdmin />}>
          <Route path="*" element={<Admin />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
