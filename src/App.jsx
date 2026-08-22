import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Feature pages
import ScreenshotAnalyzer from './pages/features/ScreenshotAnalyzer';
import PhishingSimulator from './pages/features/PhishingSimulator';
import PhishingChallenge from './modules/phishing-challenge/PhishingChallenge';
import UrlScanner from './pages/features/UrlScanner';
import QrScanner from './pages/features/QrScanner';
import PasswordLab from './pages/features/PasswordLab';
import SecurityCenter from './pages/features/SecurityCenter';
import ComingSoonFeature from './pages/features/ComingSoonFeature';

// Teammate Web Security pages
import URLScanner from './components/URLScanner';
import QRSecurityPage from './modules/qr-security/QRSecurityPage';
import FakeWebsiteChallenge from './modules/fake-website-challenge/FakeWebsiteChallenge';

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

              {/* Teammate Web Security Routes */}
              <Route path="/web-security/url-scanner" element={<URLScanner />} />
              <Route path="/web-security/qr-scanner" element={<QRSecurityPage />} />
              <Route path="/web-security/challenge" element={<FakeWebsiteChallenge />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>

                  <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                  <Route
                    path={ROUTES.SCREENSHOT_ANALYZER}
                    element={<ScreenshotAnalyzer />}
                  />
                  <Route
                    path={ROUTES.PHISHING_SIMULATOR}
                    element={<PhishingSimulator />}
                  />
                  <Route
                    path={ROUTES.PHISHING_CHALLENGE}
                    element={<PhishingChallenge />}
                  />
                  <Route
                    path={ROUTES.URL_SCANNER}
                    element={<UrlScanner />}
                  />
                  <Route
                    path={ROUTES.QR_SCANNER}
                    element={<QrScanner />}
                  />
                  <Route
                    path={ROUTES.PASSWORD_LAB}
                    element={<PasswordLab />}
                  />
                  <Route
                    path={ROUTES.SECURITY_CENTER}
                    element={<SecurityCenter />}
                  />

                  <Route
                    path="/app/coming-soon/*"
                    element={<ComingSoonFeature />}
                  />

                  <Route path={ROUTES.PROFILE} element={<Profile />} />
                  <Route path={ROUTES.SETTINGS} element={<Settings />} />

                </Route>
              </Route>

              {/* Redirect unknown routes */}
              <Route
                path="*"
                element={<Navigate to={ROUTES.HOME} replace />}
              />

            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;