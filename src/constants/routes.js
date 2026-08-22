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
  { label: 'Visual Phishing Detection', icon: 'eye', path: '/app/coming-soon/visual-phishing' },
  { label: 'Live Cyber Threat Map', icon: 'map', path: '/app/coming-soon/threat-map' },
  { label: 'AI Security Copilot', icon: 'cpu', path: '/app/coming-soon/ai-copilot' },
  { label: 'Real-Time Threat Intelligence', icon: 'zap', path: '/app/coming-soon/threat-intel' },
  { label: 'Webcam Security Lab', icon: 'camera', path: '/app/coming-soon/webcam-security' },
];

