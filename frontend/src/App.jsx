import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GpsProvider } from './context/GpsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';

import AdminDashboard from './pages/admin/Dashboard';
import Vans from './pages/admin/Vans';
import Drivers from './pages/admin/Drivers';
import AdminRoutes from './pages/admin/Routes';
import Schedules from './pages/admin/Schedules';
import Trips from './pages/admin/Trips';
import Reports from './pages/admin/Reports';
import Tracking from './pages/admin/Tracking';
import AdminRequests from './pages/admin/Requests';

import DriverDashboard from './pages/driver/Dashboard';
import DriverSchedule from './pages/driver/Schedule';
import DriverTracking from './pages/driver/Tracking';
import DriverRequests from './pages/driver/Requests';
import DriverPassengers from './pages/driver/Passengers';

import CustomerHome from './pages/customer/Home';
import MyBookings from './pages/customer/Bookings';
import CustomerTracking from './pages/customer/Tracking';

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading Parokya ni Jed...</div>;
  if (!user) return <Landing />;
  // Wrap driver routes in GpsProvider so GPS persists across navigation
  if (user.role === 'driver') {
    return (
      <GpsProvider>
        <Navigate to="/driver" replace />
      </GpsProvider>
    );
  }
  return <Navigate to={`/${user.role}`} replace />;
};

const DriverLayout = ({ children }) => (
  <GpsProvider>
    <ProtectedRoute roles={['driver']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  </GpsProvider>
);

const P = ({ roles, children }) => (
  <ProtectedRoute roles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontSize: '0.875rem', borderRadius: '8px' } }} />
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={<P roles={['admin']}><AdminDashboard /></P>} />
          <Route path="/admin/vans" element={<P roles={['admin']}><Vans /></P>} />
          <Route path="/admin/drivers" element={<P roles={['admin']}><Drivers /></P>} />
          <Route path="/admin/routes" element={<P roles={['admin']}><AdminRoutes /></P>} />
          <Route path="/admin/schedules" element={<P roles={['admin']}><Schedules /></P>} />
          <Route path="/admin/trips" element={<P roles={['admin']}><Trips /></P>} />
          <Route path="/admin/tracking" element={<P roles={['admin']}><Tracking /></P>} />
          <Route path="/admin/reports" element={<P roles={['admin']}><Reports /></P>} />
          <Route path="/admin/requests" element={<P roles={['admin']}><AdminRequests /></P>} />

          <Route path="/driver" element={<DriverLayout><DriverDashboard /></DriverLayout>} />
          <Route path="/driver/schedule" element={<DriverLayout><DriverSchedule /></DriverLayout>} />
          <Route path="/driver/tracking" element={<DriverLayout><DriverTracking /></DriverLayout>} />
          <Route path="/driver/requests" element={<DriverLayout><DriverRequests /></DriverLayout>} />
          <Route path="/driver/passengers" element={<DriverLayout><DriverPassengers /></DriverLayout>} />

          <Route path="/customer" element={<P roles={['customer']}><CustomerHome /></P>} />
          <Route path="/customer/bookings" element={<P roles={['customer']}><MyBookings /></P>} />
          <Route path="/customer/tracking" element={<P roles={['customer']}><CustomerTracking /></P>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
