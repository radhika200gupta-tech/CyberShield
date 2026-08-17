import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Feature placeholders
import ScreenshotAnalyzer from './pages/features/ScreenshotAnalyzer';
import PhishingSimulator from './pages/features/PhishingSimulator';
import UrlScanner from './pages/features/UrlScanner';
import QrScanner from './pages/features/QrScanner';
import PasswordLab from './pages/features/PasswordLab';
import SecurityCenter from './pages/features/SecurityCenter';

import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import { ROUTES } from './constants/routes';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.HOME} element={<Landing />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              
              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                  <Route path={ROUTES.SCREENSHOT_ANALYZER} element={<ScreenshotAnalyzer />} />
                  <Route path={ROUTES.PHISHING_SIMULATOR} element={<PhishingSimulator />} />
                  <Route path={ROUTES.URL_SCANNER} element={<UrlScanner />} />
                  <Route path={ROUTES.QR_SCANNER} element={<QrScanner />} />
                  <Route path={ROUTES.PASSWORD_LAB} element={<PasswordLab />} />
                  <Route path={ROUTES.SECURITY_CENTER} element={<SecurityCenter />} />
                  
                  {/* Redirect unimplemented internal routes to Dashboard for now */}
                  <Route path={ROUTES.PROFILE} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                  <Route path={ROUTES.SETTINGS} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                </Route>
              </Route>

              {/* Redirect any unknown route to home */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
