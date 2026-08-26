export const weeklyThreats = [
  { day: 'Mon', threats: 4 },
  { day: 'Tue', threats: 7 },
  { day: 'Wed', threats: 3 },
  { day: 'Thu', threats: 9 },
  { day: 'Fri', threats: 5 },
  { day: 'Sat', threats: 2 },
  { day: 'Sun', threats: 6 },
];

export const monthlyScans = [
  { month: 'Mar', scans: 42 },
  { month: 'Apr', scans: 58 },
  { month: 'May', scans: 51 },
  { month: 'Jun', scans: 73 },
  { month: 'Jul', scans: 66 },
  { month: 'Aug', scans: 89 },
];

export const riskDistribution = [
  { name: 'Low Risk', value: 45, color: '#22C55E' },
  { name: 'Medium Risk', value: 30, color: '#F59E0B' },
  { name: 'High Risk', value: 15, color: '#EF4444' },
  { name: 'Critical', value: 10, color: '#991B1B' },
];

export const recentActivity = [
  { id: 1, type: 'screenshot', label: 'Suspicious phishing indicators detected', risk: 'high', time: '3 hours ago' },
  { id: 2, type: 'url', label: 'github.com verified as safe', risk: 'safe', time: '5 hours ago' },
  { id: 3, type: 'password', label: 'Bank Account password evaluated', risk: 'medium', time: 'Yesterday' },
  { id: 4, type: 'qr', label: 'QR destination checked successfully', risk: 'low', time: 'Yesterday' },
  { id: 5, type: 'phishing', label: 'Security decision recorded', risk: 'safe', time: '2 days ago' },
  { id: 6, type: 'url', label: 'Blocked access to malicious domain', risk: 'high', time: '3 days ago' },
  { id: 7, type: 'screenshot', label: 'Clean desktop environment verified', risk: 'safe', time: '3 days ago' },
  { id: 8, type: 'password', label: 'Weak network password detected', risk: 'high', time: '4 days ago' },
  { id: 9, type: 'qr', label: 'Scanned restaurant menu QR code', risk: 'safe', time: '5 days ago' },
  { id: 10, type: 'phishing', label: 'Failed simulated phishing test', risk: 'high', time: '1 week ago' },
];

export const scanHistory = [
  { id: 'scn_001', type: 'URL', target: 'secure-paypal-verify.com', risk: 'high', date: '2026-08-05', status: 'Blocked' },
  { id: 'scn_002', type: 'Password', target: 'Netflix Account', risk: 'safe', date: '2026-08-05', status: 'Completed' },
  { id: 'scn_003', type: 'Phishing', target: 'Email from "hr-payroll@corp-notice.com"', risk: 'high', date: '2026-08-04', status: 'Blocked' },
  { id: 'scn_004', type: 'URL', target: 'github.com', risk: 'safe', date: '2026-08-04', status: 'Completed' },
  { id: 'scn_005', type: 'Password', target: 'Work Email', risk: 'medium', date: '2026-08-03', status: 'Completed' },
  { id: 'scn_006', type: 'URL', target: 'amaz0n-deals-today.ru', risk: 'high', date: '2026-08-02', status: 'Blocked' },
  { id: 'scn_007', type: 'Phishing', target: 'Email from "IT-Support@company.co"', risk: 'medium', date: '2026-08-01', status: 'Flagged' },
  { id: 'scn_008', type: 'Password', target: 'Amazon Account', risk: 'safe', date: '2026-07-31', status: 'Completed' },
  { id: 'scn_009', type: 'URL', target: 'linkedin.com', risk: 'safe', date: '2026-07-30', status: 'Completed' },
  { id: 'scn_010', type: 'Phishing', target: 'Email from "billing@subscription-renew.info"', risk: 'high', date: '2026-07-29', status: 'Blocked' },
  { id: 'scn_011', type: 'Password', target: 'Personal Email', risk: 'low', date: '2026-07-28', status: 'Completed' },
  { id: 'scn_012', type: 'URL', target: 'stackoverflow.com', risk: 'safe', date: '2026-07-27', status: 'Completed' },
];

export const dashboardCards = {
  securityScore: 82,
  threatsDetected: 47,
  safeUrls: 269,
  passwordHealth: 76,
};

export const threatCategories = [
  { name: 'Phishing', value: 42 },
  { name: 'Malicious URLs', value: 35 },
  { name: 'Weak Passwords', value: 28 },
  { name: 'Suspicious QR Codes', value: 19 },
  { name: 'Unsafe Files', value: 14 },
];
