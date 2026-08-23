import { ROUTES } from '../constants/routes';

export const features = [
  {
    icon: 'camera',
    title: 'Screenshot Phishing Analyzer',
    description: 'Analyze screenshots for suspicious phishing signals.',
    path: ROUTES.SCREENSHOT_ANALYZER,
  },
  {
    icon: 'crosshair',
    title: 'Phishing Simulator',
    description: 'Practice identifying common phishing attempts.',
    path: ROUTES.PHISHING_SIMULATOR,
  },
  {
    icon: 'link',
    title: 'Smart URL Scanner',
    description: 'Check URLs for suspicious security patterns.',
    path: ROUTES.URL_SCANNER,
  },
  {
    icon: 'maximize',
    title: 'QR Security Scanner',
    description: 'Scan QR codes and analyze their destination.',
    path: ROUTES.QR_SCANNER,
  },
  {
    icon: 'key',
    title: 'Password Security Lab',
    description: 'Evaluate password strength and security.',
    path: ROUTES.PASSWORD_LAB,
  },
  {
    icon: 'shield',
    title: 'Security Command Center',
    description: 'Monitor security activity and overall risk.',
    path: ROUTES.SECURITY_CENTER,
  },
];

export const stats = [
  { label: 'Threats Analyzed', value: 4200000, suffix: '+' },
  { label: 'Phishing Sites Blocked', value: 128000, suffix: '+' },
  { label: 'Avg. Detection Time', value: 340, suffix: 'ms' },
  { label: 'Detection Accuracy', value: 99.2, suffix: '%' },
];

export const howItWorks = [
  {
    step: '01',
    title: 'Connect a signal',
    description: 'Paste a URL, an email, or a password — CyberShield accepts whatever you\u2019re unsure about.',
  },
  {
    step: '02',
    title: 'AI evaluates risk',
    description: 'Our models score reputation, entropy, and intent in real time, cross-checked against threat data.',
  },
  {
    step: '03',
    title: 'Act on a clear verdict',
    description: 'Get a risk level and specific next steps — not just a red or green light.',
  },
];

export const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'IT Security Lead, Finlytics',
    quote: 'We caught a spoofed vendor invoice in the phishing detector that would have slipped past our filters.',
    avatarInitials: 'PS',
  },
  {
    name: 'Daniel Cho',
    role: 'Founder, Northloop',
    quote: 'The password analyzer finally got our whole team off "Company2024!" — the entropy breakdown makes it click.',
    avatarInitials: 'DC',
  },
  {
    name: 'Meera Iyer',
    role: 'Freelance Developer',
    quote: 'I run every client link through the URL checker before I click. It has paid for itself twice over.',
    avatarInitials: 'MI',
  },
];

export const faqs = [
  {
    question: 'Is CyberShield free to use?',
    answer: 'A free tier covers core scanning. Pro unlocks unlimited scans, deeper analytics, and priority AI models.',
  },
  {
    question: 'Do you store the URLs, emails, or passwords I scan?',
    answer: 'Scans are processed to generate your result and are not retained beyond your account\u2019s history log, which you control.',
  },
  {
    question: 'How accurate is the phishing detector?',
    answer: 'Our rule-based and AI-assisted models are benchmarked against known phishing datasets and continuously retrained.',
  },
  {
    question: 'Can I use CyberShield for my whole team?',
    answer: 'Team and Enterprise plans add shared dashboards, role-based access, and centralized reporting.',
  },
  {
    question: 'What happens after Phase 2 and 3 rollout?',
    answer: 'The platform gains persistent accounts, live threat-intel APIs, and continuously learning AI models.',
  },
];

export const comingSoon = [
  { title: 'Visual Threat Intelligence', icon: 'eye' },
  { title: 'Live Cyber Threat Map', icon: 'map' },
  { title: 'AI Security Copilot', icon: 'cpu' },
  { title: 'Real-Time Threat Intelligence', icon: 'zap' },
  { title: 'Webcam Security Lab', icon: 'camera' },
];
