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
  { name: 'Safe', value: 68, color: '#22C55E' },
  { name: 'Low Risk', value: 18, color: '#38BDF8' },
  { name: 'Medium Risk', value: 9, color: '#F59E0B' },
  { name: 'High Risk', value: 5, color: '#EF4444' },
];

export const recentActivity = [
  { id: 1, type: 'url', label: 'Scanned freepixelicons-download.net', risk: 'high', time: '4 minutes ago' },
  { id: 2, type: 'password', label: 'Analyzed password for "GitHub"', risk: 'safe', time: '1 hour ago' },
  { id: 3, type: 'phishing', label: 'Detected phishing attempt from "IT-Support"', risk: 'high', time: '3 hours ago' },
  { id: 4, type: 'url', label: 'Scanned github.com', risk: 'safe', time: '5 hours ago' },
  { id: 5, type: 'password', label: 'Analyzed password for "Bank Account"', risk: 'medium', time: 'Yesterday' },
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
