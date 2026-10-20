export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/app/dashboard',
  INCIDENTS: '/app/incidents',
  INVESTIGATION_CENTER: '/app/incidents',
  INVESTIGATE: '/app/incidents/investigate',
  INCIDENT_REPORT: '/app/incidents/report',
  SCREENSHOT_ANALYZER: '/app/screenshot-analyzer',
  VISUAL_PHISHING: '/app/visual-phishing',
  PHISHING_SIMULATOR: '/app/phishing-simulator',
  PHISHING_CHALLENGE: '/app/phishing-challenge',
  URL_SCANNER: '/web-security/url-scanner',
  QR_SCANNER: '/web-security/qr-scanner',
  PASSWORD_LAB: '/app/password-lab',
  PASSWORD_SECURITY: '/app/password-security',
  CYBER_RESCUE: '/app/cyber-rescue',
  EMAIL_FORENSICS: '/app/email-forensics',
  EMAIL_DISCOVERY: '/app/email-account-discovery',
  WEBCAM_SECURITY: '/app/webcam-security',
  SECURITY_CENTER: '/app/security-center',
  AI_COPILOT: '/app/coming-soon/ai-copilot',
  THREAT_INTEL: '/app/coming-soon/threat-intel',
  THREAT_MAP: '/app/coming-soon/threat-map',
  PROFILE: '/app/profile',
  SETTINGS: '/app/settings',
  NOT_FOUND: '*',
};


export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];


export const SIDEBAR_SECTIONS = [
  {
    category: 'OVERVIEW',
    links: [
      { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'grid' },
    ],
  },
  {
    category: 'PHISHING & EMAIL INVESTIGATION',
    links: [
      { label: 'Screenshot Phishing Analyzer', path: ROUTES.SCREENSHOT_ANALYZER, icon: 'camera' },
      { label: 'Visual Phishing Detection', path: ROUTES.VISUAL_PHISHING, icon: 'eye' },
      { label: 'Email Forensics Lab', path: ROUTES.EMAIL_FORENSICS, icon: 'mail' },
      { label: 'Phishing Simulator', path: ROUTES.PHISHING_SIMULATOR, icon: 'crosshair' },
    ],
  },
  {
    category: 'SECURITY MONITORING & INTELLIGENCE',
    links: [
      { label: 'Real-Time Threat Intelligence', path: ROUTES.THREAT_INTEL, icon: 'zap' },
      { label: 'Live Cyber Threat Map', path: ROUTES.THREAT_MAP, icon: 'map' },
      { label: 'Webcam Security Lab', path: ROUTES.WEBCAM_SECURITY, icon: 'camera' },
    ],
  },
  {
    category: 'AI SECURITY COPILOT',
    links: [
      { label: 'Security Copilot', path: ROUTES.AI_COPILOT, icon: 'cpu' },
    ],
  },
  {
    category: 'INCIDENT INVESTIGATION & RESPONSE',
    links: [
      { label: 'Incident Command Center', path: ROUTES.INCIDENTS, icon: 'compass' },
    ],
  },
  {
    category: 'WEB SECURITY',
    links: [
      { label: 'Smart URL Scanner', path: ROUTES.URL_SCANNER, icon: 'link' },
      { label: 'QR Security Scanner', path: ROUTES.QR_SCANNER, icon: 'maximize' },
      { label: 'Phishing Challenge', path: ROUTES.PHISHING_CHALLENGE, icon: 'activity' },
    ],
  },
  {
    category: 'INCIDENT RECOVERY & ASSISTANCE',
    links: [
      { label: 'CyberRescue Assistant', path: ROUTES.CYBER_RESCUE, icon: 'lifeBuoy' },
    ],
  },
  {
    category: 'IDENTITY & DEVICE SECURITY',
    links: [
      { label: 'Password Security Lab', path: ROUTES.PASSWORD_LAB, icon: 'key' },
    ],
  },
  {
    category: 'SECURITY COMMAND CENTER',
    links: [
      { label: 'Security Command Center', path: ROUTES.SECURITY_CENTER, icon: 'shield' },
    ],
  },
];

export const SIDEBAR_LINKS = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: 'grid' },
  { label: 'Incident Command Center', path: ROUTES.INCIDENTS, icon: 'compass' },
  { label: 'Screenshot Phishing Analyzer', path: ROUTES.SCREENSHOT_ANALYZER, icon: 'camera' },
  { label: 'Visual Phishing Detection', path: ROUTES.VISUAL_PHISHING, icon: 'eye' },
  { label: 'Email Forensics Lab', path: ROUTES.EMAIL_FORENSICS, icon: 'mail' },
  { label: 'Phishing Simulator', path: ROUTES.PHISHING_SIMULATOR, icon: 'crosshair' },
  { label: 'Real-Time Threat Intelligence', path: ROUTES.THREAT_INTEL, icon: 'zap' },
  { label: 'Live Cyber Threat Map', path: ROUTES.THREAT_MAP, icon: 'map' },
  { label: 'Webcam Security Lab', path: ROUTES.WEBCAM_SECURITY, icon: 'camera' },
  { label: 'Security Copilot', path: ROUTES.AI_COPILOT, icon: 'cpu' },
  { label: 'Incident Command Center', path: ROUTES.INCIDENTS, icon: 'compass' },
  { label: 'Smart URL Scanner', path: ROUTES.URL_SCANNER, icon: 'link' },
  { label: 'QR Security Scanner', path: ROUTES.QR_SCANNER, icon: 'maximize' },
  { label: 'Phishing Challenge', path: ROUTES.PHISHING_CHALLENGE, icon: 'activity' },
  { label: 'CyberRescue Assistant', path: ROUTES.CYBER_RESCUE, icon: 'lifeBuoy' },
  { label: 'Password Security Lab', path: ROUTES.PASSWORD_LAB, icon: 'key' },
  { label: 'Security Command Center', path: ROUTES.SECURITY_CENTER, icon: 'shield' },
];

export const INTELLIGENCE_LINKS = [
  { label: 'Security Copilot', icon: 'cpu', path: ROUTES.AI_COPILOT },
  { label: 'Real-Time Threat Intelligence', icon: 'zap', path: ROUTES.THREAT_INTEL },
  { label: 'Live Cyber Threat Map', icon: 'map', path: ROUTES.THREAT_MAP },
];

export const COMING_SOON_LINKS = INTELLIGENCE_LINKS;



