import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
const Content = lazy(() => import('./pages/Content'));
const Editorial = lazy(() => import('./pages/Editorial'));
const Admin = lazy(() => import('./pages/admin/AdminRoutes'));
export default function App() {
  return (
    <Suspense
      fallback={
        <div className="container section" role="status">
          Opening the next chapter…
        </div>
      }
    >
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route index element={<Home />} />
                {[
                  'portfolio',
                  'portfolio/:slug',
                  'shop',
                  'shop/:slug',
                  'blog',
                  'blog/:slug',
                  'looks/:slug',
                  'go/:keyword',
                ].map((path) => (
                  <Route key={path} path={path} element={<Content />} />
                ))}
                {[
                  'about',
                  'work-with-me',
                  'media-kit',
                  'contact',
                  'privacy',
                  'affiliate-disclosure',
                  '*',
                ].map((path) => (
                  <Route key={path} path={path} element={<Editorial />} />
                ))}
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Suspense>
  );
}
