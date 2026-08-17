export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/app/dashboard',
  SCREENSHOT_ANALYZER: '/app/screenshot-analyzer',
  PHISHING_SIMULATOR: '/app/phishing-simulator',
  URL_SCANNER: '/app/url-scanner',
  QR_SCANNER: '/app/qr-scanner',
  PASSWORD_LAB: '/app/password-lab',
  SECURITY_CENTER: '/app/security-center',
  PROFILE: '/app/profile',
  SETTINGS: '/app/settings',
  NOT_FOUND: '*',
};

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

export const SIDEBAR_LINKS = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'grid' },
  { label: 'Screenshot Phishing Analyzer', path: ROUTES.SCREENSHOT_ANALYZER, icon: 'camera' },
  { label: 'Phishing Simulator', path: ROUTES.PHISHING_SIMULATOR, icon: 'crosshair' },
  { label: 'Smart URL Scanner', path: ROUTES.URL_SCANNER, icon: 'link' },
  { label: 'QR Security Scanner', path: ROUTES.QR_SCANNER, icon: 'maximize' },
  { label: 'Password Security Lab', path: ROUTES.PASSWORD_LAB, icon: 'key' },
  { label: 'Security Command Center', path: ROUTES.SECURITY_CENTER, icon: 'shield' },
];

export const COMING_SOON_LINKS = [
  { label: 'AI Threat Intelligence', icon: 'cpu' },
  { label: 'Malware Analysis', icon: 'activity' },
  { label: 'Security Reports', icon: 'fileText' },
  { label: 'Breach Monitoring', icon: 'eye' },
  { label: 'Advanced Email Analysis', icon: 'mail' },
  { label: 'Network Security Monitor', icon: 'server' },
];
