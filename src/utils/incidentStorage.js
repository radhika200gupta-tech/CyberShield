import { loadHistory as loadUrlHistory } from './scanHistory';
import { visualPhishingService } from '../services/visualPhishingService';

export const STORAGE_KEY = 'cybershield_incidents_v1';
export const CATEGORIES = ['Phishing Attempt', 'Malicious QR', 'Suspicious URL', 'Account Compromise', 'Malware', 'Other'];
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Open', 'In Progress', 'Resolved'];
export const SAMPLE_CASES = [
  { id: 'SMP-01', title: 'Suspicious Recruitment Email', category: 'Phishing Attempt', severity: 'Medium', asset: 'Exchange / HR Inbox', evidence: 'EML-2026-0881.eml', desc: 'Unsolicited VP offer requiring passport scan.' },
  { id: 'SMP-02', title: 'Cafeteria Decal Quishing', category: 'Malicious QR', severity: 'High', asset: 'Cafeteria POS Stand #3', evidence: 'pay-quick-verify.net/auth', desc: 'Tampered QR decal overlaid on cafeteria menu code.' },
  { id: 'SMP-03', title: 'AitM Reverse-Proxy Alert', category: 'Suspicious URL', severity: 'Critical', asset: 'Identity Gateway (Okta)', evidence: 'https://auth.sso-gateway.net', desc: 'Reverse-proxy session cookie interception targeting employee logins.' },
  { id: 'SMP-04', title: 'Open S3 Bucket Exposure', category: 'Other', severity: 'High', asset: 'AWS S3 / prod-backup', evidence: 's3://prod-backup (Public Read)', desc: 'Unrestricted cloud storage bucket containing unmasked database logs.' }
];
const SEEDED = [
  { id: 'INC-0007', title: 'Suspicious QR code detected', category: 'Malicious QR', severity: 'High', status: 'Open', affectedAsset: 'Cafeteria POS #3', evidenceReferences: ['pay-quick-verify.net/auth'], description: 'Payment QR overlaid with decal redirecting to fake portal.', createdAt: new Date(Date.now() - 72e5).toISOString(), isSample: true, sourceType: 'scanner' },
  { id: 'INC-0006', title: 'Phishing email campaign', category: 'Phishing Attempt', severity: 'High', status: 'In Progress', affectedAsset: 'Exec Inboxes', evidenceReferences: ['wire-remittance.pdf.eml'], description: 'Mass executive impersonation wire fraud attempt.', createdAt: new Date(Date.now() - 216e5).toISOString(), isSample: true, sourceType: 'manual' },
  { id: 'INC-0005', title: 'Suspicious URL in message', category: 'Suspicious URL', severity: 'Medium', status: 'Open', affectedAsset: 'Slack Channel', evidenceReferences: ['tinyurl.com/auth-m365'], description: 'Shortened link redirecting to deceptive Microsoft 365 login screen.', createdAt: new Date(Date.now() - 864e5).toISOString(), isSample: true, sourceType: 'scanner' },
  { id: 'INC-0001', title: 'Campus QR Drill (Simulated)', category: 'Malicious QR', severity: 'High', status: 'Resolved', affectedAsset: 'North Campus Board', evidenceReferences: ['sim-audit-payload'], description: 'Controlled drill evaluating employee QR awareness.', createdAt: new Date(Date.now() - 35e7).toISOString(), isSample: true, sourceType: 'sample' }
];

export const getIncidents = () => { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED)); return SEEDED; } return JSON.parse(raw) || []; } catch { return []; } };
export const saveIncidents = (list) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {} };

export const saveQrScan = (res) => {
  try {
    const target = res?.classified?.parsed?.url || res?.classified?.raw || 'QR destination', entry = { id: `qr-${Date.now()}`, target, verdict: res?.riskLevel?.label || 'Analyzed', score: res?.riskScore ?? null, level: (res?.riskLevel?.key || 'SAFE').toLowerCase(), timestamp: new Date().toISOString() };
    const cur = JSON.parse(localStorage.getItem('cybershield_qr_scan_history') || '[]');
    localStorage.setItem('cybershield_qr_scan_history', JSON.stringify([entry, ...cur.filter((e) => e.target !== target)].slice(0, 15)));
  } catch {}
};

export const createIncident = (d) => {
  const cur = getIncidents(), max = cur.reduce((m, i) => Math.max(m, parseInt((i.id || '').replace(/^INC-0*/i, ''), 10) || 0), 0), now = new Date().toISOString();
  const rec = { id: `INC-${String(max > 0 ? max + 1 : 1001).padStart(4, '0')}`, title: (d.title || '').trim(), category: d.category || 'Other', severity: d.severity || 'Medium', status: d.status || 'Open', description: (d.description || d.desc || '').trim(), affectedAsset: (d.affectedAsset || d.asset || '').trim(), evidenceReferences: Array.isArray(d.evidenceReferences) ? d.evidenceReferences : d.evidence ? [d.evidence] : [], observations: d.observations || '', sourceType: d.sourceType || 'manual', sourceId: d.sourceId || null, isSample: Boolean(d.isSample), createdAt: d.createdAt || now, updatedAt: now };
  saveIncidents([rec, ...cur]);
  return rec;
};

export const updateIncident = (id, up) => { const list = getIncidents(), idx = list.findIndex((i) => i.id === id); if (idx === -1) return null; const rec = { ...list[idx], ...up, id: list[idx].id, createdAt: list[idx].createdAt, updatedAt: new Date().toISOString() }; list[idx] = rec; saveIncidents(list); return rec; };
export const deleteIncident = (id) => { const list = getIncidents().filter((i) => i.id !== id); saveIncidents(list); return list; };

export const calculateMetrics = (list = []) => ({
  total: list.length, open: list.filter((i) => i.status === 'Open').length,
  highSeverity: list.filter((i) => i.severity === 'High' || i.severity === 'Critical').length,
  inProgress: list.filter((i) => i.status === 'In Progress').length, resolved: list.filter((i) => i.status === 'Resolved').length
});

export const getAvailableScanners = () => {
  const scans = [];
  try { JSON.parse(localStorage.getItem('cybershield_qr_scan_history') || '[]').forEach((qr) => scans.push({ id: qr.id, sourceType: 'QR Security Scanner', target: qr.target, verdict: qr.verdict, riskScore: qr.score, riskLevel: qr.level === 'dangerous' ? 'High' : qr.level === 'suspicious' ? 'Medium' : 'Low', timestamp: qr.timestamp, suggestedCategory: 'Malicious QR' })); } catch {}
  try { loadUrlHistory().forEach((url) => scans.push({ id: url.id, sourceType: 'Smart URL Scanner', target: url.url, verdict: url.verdict || (url.score >= 50 ? 'Suspicious' : 'Clean'), riskScore: url.score, riskLevel: url.score >= 70 ? 'High' : url.score >= 35 ? 'Medium' : 'Low', timestamp: url.timestamp, suggestedCategory: 'Suspicious URL' })); } catch {}
  try { visualPhishingService.getHistory().forEach((vp) => scans.push({ id: vp.id, sourceType: 'Screenshot Phishing Analyzer', target: vp.fileName || 'Screenshot', verdict: vp.topIndicator || 'Analyzed', riskScore: vp.score, riskLevel: vp.score >= 60 ? 'High' : 'Medium', timestamp: vp.timestamp, suggestedCategory: 'Phishing Attempt' })); } catch {}
  try { JSON.parse(localStorage.getItem('commandHistory') || '[]').forEach((cmd, idx) => scans.push({ id: `cmd-${idx}`, sourceType: 'Security Command Center', target: cmd.command, verdict: cmd.status || cmd.risk, riskScore: cmd.risk === 'High' ? 85 : 45, riskLevel: cmd.risk === 'High' ? 'High' : 'Medium', timestamp: cmd.timestamp, suggestedCategory: 'Account Compromise' })); } catch {}
  return scans;
};
