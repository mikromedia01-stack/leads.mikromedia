import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';

import LoadingSpinner from './components/LoadingSpinner';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Users = lazy(() => import('./pages/Users'));

// Protected Route Component
const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />; // or unauthorized page
  }

  return <Outlet />; // Renders the child routes
};

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Layout Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'sales']} />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/tasks" element={<Tasks />} />

            {/* Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/users" element={<Users />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
