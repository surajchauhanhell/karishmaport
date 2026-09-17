import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { SEO, State } from './common';

export default function RequireAdmin() {
  const auth = useAdminAuth();
  const location = useLocation();
  if (auth.status === 'loading')
    return (
      <div className="login">
        <SEO title="Creator admin" noindex />
        <State loading />
      </div>
    );
  if (auth.status !== 'allowed')
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
    );
  return <Outlet />;
}
