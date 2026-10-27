import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import IncidentCommandCenter from './pages/IncidentCommandCenter';
import InvestigationWorkspace from './pages/InvestigationWorkspace';
import IncidentResolutionReport from './pages/IncidentResolutionReport';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Feature pages
import ScreenshotAnalyzer from './pages/features/ScreenshotAnalyzer';
import PhishingSimulator from './pages/features/PhishingSimulator';
import PhishingChallenge from './modules/phishing-challenge/PhishingChallenge';
import PasswordSecurity from './pages/PasswordSecurity';
import CyberRescue from './pages/features/CyberRescue';
import SecurityCenter from './pages/features/SecurityCenter';
import ComingSoonFeature from './pages/features/ComingSoonFeature';
import VisualPhishingLab from './pages/features/VisualPhishingLab';
import EmailForensicsLab from './pages/features/EmailForensicsLab';
import EmailAccountDiscovery from './pages/features/EmailAccountDiscovery';
import WebcamSecurityLab from './pages/features/WebcamSecurityLab';

// Teammate Web Security pages
import URLScanner from './components/URLScanner';
import QRSecurityPage from './modules/qr-security/QRSecurityPage';
import FakeWebsiteChallenge from './modules/fake-website-challenge/FakeWebsiteChallenge';

import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import { ROUTES } from './constants/routes';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
            <Routes>

              {/* Public Routes */}
              <Route path={ROUTES.HOME} element={<Landing />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.SIGNUP} element={<SignUp />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

              {/* Teammate Web Security Routes moved inside DashboardLayout */}

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>

                  <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                  <Route path={ROUTES.INCIDENTS} element={<IncidentCommandCenter />} />
                  <Route path="/app/investigation-center" element={<Navigate to={ROUTES.INCIDENTS} replace />} />
                  <Route path="/app/investigation" element={<Navigate to={ROUTES.INCIDENTS} replace />} />
                  <Route path={ROUTES.INVESTIGATE} element={<InvestigationWorkspace />} />
                  <Route path={`${ROUTES.INVESTIGATE}/:incidentId`} element={<InvestigationWorkspace />} />
                  <Route path={ROUTES.INCIDENT_REPORT} element={<IncidentResolutionReport />} />
                  <Route path={`${ROUTES.INCIDENT_REPORT}/:incidentId`} element={<IncidentResolutionReport />} />
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
                  
                  {/* Teammate Web Security Routes */}
                  <Route
                    path={ROUTES.URL_SCANNER}
                    element={<URLScanner />}
                  />
                  <Route
                    path={ROUTES.QR_SCANNER}
                    element={<QRSecurityPage />}
                  />
                  <Route path="/web-security/challenge" element={<FakeWebsiteChallenge />} />
                  <Route
                    path={ROUTES.PASSWORD_LAB}
                    element={<PasswordSecurity />}
                  />
                  <Route
                    path={ROUTES.PASSWORD_SECURITY}
                    element={<PasswordSecurity />}
                  />
                  <Route
                    path={ROUTES.SECURITY_CENTER}
                    element={<SecurityCenter />}
                  />
                  <Route
                    path={ROUTES.CYBER_RESCUE}
                    element={<CyberRescue />}
                  />

                  <Route
                    path={ROUTES.VISUAL_PHISHING}
                    element={<VisualPhishingLab />}
                  />
                  <Route
                    path={ROUTES.EMAIL_FORENSICS}
                    element={<EmailForensicsLab />}
                  />
                  <Route
                    path={ROUTES.EMAIL_DISCOVERY}
                    element={<EmailAccountDiscovery />}
                  />
                  <Route
                    path={ROUTES.WEBCAM_SECURITY}
                    element={<WebcamSecurityLab />}
                  />
                  <Route
                    path="/app/coming-soon/visual-phishing"
                    element={<Navigate to={ROUTES.VISUAL_PHISHING} replace />}
                  />
                  <Route
                    path="/app/coming-soon/webcam-security"
                    element={<Navigate to={ROUTES.WEBCAM_SECURITY} replace />}
                  />
                  {/* REVERSIBLE REMOVAL: Threat Intel & Threat Map routes disabled on deployed site */}
                  {/* To restore, remove these two redirect routes or set ENABLE_THREAT_INTEL/MAP to true */}
                  <Route
                    path="/app/coming-soon/threat-intel"
                    element={<Navigate to={ROUTES.HOME} replace />}
                  />
                  <Route
                    path="/app/coming-soon/threat-map"
                    element={<Navigate to={ROUTES.HOME} replace />}
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
  </Provider>
  );
}

export default App;