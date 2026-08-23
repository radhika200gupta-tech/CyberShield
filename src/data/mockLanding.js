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

export const securityWorkflow = [
  {
    step: '01',
    title: 'Detect',
    description: 'Ingest signals from URLs, emails, and endpoints into the telemetry engine.',
  },
  {
    step: '02',
    title: 'Analyze',
    description: 'Run deep inspections against global threat feeds and zero-day heuristics.',
  },
  {
    step: '03',
    title: 'Assess Risk',
    description: 'Assign a deterministic risk score based on intent, entropy, and history.',
  },
  {
    step: '04',
    title: 'Protect',
    description: 'Deliver an actionable verdict to block or safely interact with the asset.',
  },
];

export const faqs = [
  {
    question: 'What does CyberShield analyze?',
    answer: 'CyberShield analyzes URLs for deceptive routing, evaluates password entropy, and scans structural anomalies in QR codes and screenshots.',
  },
  {
    question: 'How does phishing detection work?',
    answer: 'Our engine uses computer vision to detect spoofed login screens, cross-referenced with domain age and SSL certificate reputation.',
  },
  {
    question: 'What is the Phishing Simulator?',
    answer: 'It is a training environment where you can safely interact with defanged phishing templates to improve your detection skills.',
  },
  {
    question: 'Does CyberShield store my scanned information?',
    answer: 'All scans are ephemeral. We do not persist raw passwords or sensitive email bodies beyond the immediate session analysis.',
  },
  {
    question: 'What does the security score mean?',
    answer: 'The score is a weighted aggregate of threat intelligence signals. A low score indicates severe risk based on blacklists or structural deception.',
  },
];

export const comingSoon = [
  { title: 'Visual Threat Intelligence', icon: 'eye', description: 'Advanced computer vision models to detect deceptive visual elements.', path: '/app/coming-soon/visual-phishing' },
  { title: 'Live Cyber Threat Map', icon: 'map', description: 'Global real-time visualization of intercepted attacks and origin points.', path: '/app/coming-soon/threat-map' },
  { title: 'AI Security Copilot', icon: 'cpu', description: 'Conversational assistant for automated threat response and triage.', path: '/app/coming-soon/ai-copilot' },
  { title: 'Real-Time Threat Intelligence', icon: 'zap', description: 'Live streaming feeds from global honeypots and threat databases.', path: '/app/coming-soon/threat-intel' },
  { title: 'Webcam Security Lab', icon: 'camera', description: 'Deep analysis of webcam hijacking indicators and local privacy risks.', path: '/app/coming-soon/webcam-security' },
];
